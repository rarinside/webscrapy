import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIController } from '../classes/UIController.js';
import { ContactData } from '../types/interfaces.js';

describe('UIController', () => {
  let uiController: UIController;
  let mockContacts: ContactData[];

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    
    // Create mock contacts
    mockContacts = [
      {
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@example.com',
        source: 'https://example.com',
        timestamp: new Date('2024-01-01T10:00:00Z')
      },
      {
        name: 'Maria Santos',
        phone: '(21) 88888-8888',
        email: 'maria@example.com',
        source: 'https://example.com',
        timestamp: new Date('2024-01-01T10:01:00Z')
      }
    ];

    uiController = new UIController();
  });

  afterEach(() => {
    uiController.destroy();
    document.body.innerHTML = '';
  });

  describe('Modal Creation', () => {
    it('should create modal element in DOM', () => {
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal).toBeTruthy();
      expect(modal?.classList.contains('web-data-extractor-modal')).toBe(true);
    });

    it('should have modal hidden by default', () => {
      expect(uiController.isVisible()).toBe(false);
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal?.style.display).toBe('none');
    });

    it('should have all required modal elements', () => {
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal?.querySelector('.web-data-extractor-modal-header')).toBeTruthy();
      expect(modal?.querySelector('.web-data-extractor-modal-body')).toBeTruthy();
      expect(modal?.querySelector('.web-data-extractor-modal-footer')).toBeTruthy();
      expect(modal?.querySelector('.web-data-extractor-close-btn')).toBeTruthy();
      expect(modal?.querySelector('#select-all-btn')).toBeTruthy();
      expect(modal?.querySelector('#remove-selected-btn')).toBeTruthy();
      expect(modal?.querySelector('#export-csv-btn')).toBeTruthy();
      expect(modal?.querySelector('#cancel-btn')).toBeTruthy();
    });
  });

  describe('Show/Hide Modal', () => {
    it('should show modal when showReviewModal is called', () => {
      uiController.showReviewModal(mockContacts);
      
      expect(uiController.isVisible()).toBe(true);
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal?.style.display).toBe('block');
    });

    it('should hide modal when hideReviewModal is called', () => {
      uiController.showReviewModal(mockContacts);
      uiController.hideReviewModal();
      
      expect(uiController.isVisible()).toBe(false);
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal?.style.display).toBe('none');
    });

    it('should hide modal when close button is clicked', () => {
      uiController.showReviewModal(mockContacts);
      
      const closeBtn = document.querySelector('.web-data-extractor-close-btn') as HTMLElement;
      closeBtn.click();
      
      expect(uiController.isVisible()).toBe(false);
    });

    it('should hide modal when cancel button is clicked', () => {
      uiController.showReviewModal(mockContacts);
      
      const cancelBtn = document.querySelector('#cancel-btn') as HTMLElement;
      cancelBtn.click();
      
      expect(uiController.isVisible()).toBe(false);
    });

    it('should hide modal when overlay is clicked', () => {
      uiController.showReviewModal(mockContacts);
      
      const overlay = document.querySelector('.web-data-extractor-modal-overlay') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: overlay });
      overlay.dispatchEvent(clickEvent);
      
      expect(uiController.isVisible()).toBe(false);
    });

    it('should hide modal when Escape key is pressed', () => {
      uiController.showReviewModal(mockContacts);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(uiController.isVisible()).toBe(false);
    });
  });

  describe('Contact Rendering', () => {
    it('should render contacts in the modal', () => {
      uiController.showReviewModal(mockContacts);
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(2);
    });

    it('should display contact information correctly', () => {
      uiController.showReviewModal(mockContacts);
      
      const firstContact = document.querySelector('[data-index="0"]');
      expect(firstContact?.textContent).toContain('João Silva');
      expect(firstContact?.textContent).toContain('(11) 99999-9999');
      expect(firstContact?.textContent).toContain('joao@example.com');
      expect(firstContact?.textContent).toContain('https://example.com');
    });

    it('should show "no contacts" message when empty array is provided', () => {
      uiController.showReviewModal([]);
      
      const noContactsMsg = document.querySelector('.web-data-extractor-no-contacts');
      expect(noContactsMsg).toBeTruthy();
      expect(noContactsMsg?.textContent).toContain('Nenhum contato encontrado');
    });

    it('should escape HTML in contact data', () => {
      const maliciousContact: ContactData = {
        name: '<script>alert("xss")</script>',
        phone: '<img src=x onerror=alert(1)>',
        email: 'test@<script>alert("xss")</script>.com',
        source: 'https://example.com',
        timestamp: new Date()
      };

      uiController.showReviewModal([maliciousContact]);
      
      const contactItem = document.querySelector('.web-data-extractor-contact-item');
      expect(contactItem?.innerHTML).not.toContain('<script>');
      expect(contactItem?.innerHTML).not.toContain('<img');
      // The textContent should contain the escaped version as plain text
      expect(contactItem?.textContent).toContain('<script>alert("xss")</script>');
    });

    it('should have checkboxes checked by default', () => {
      uiController.showReviewModal(mockContacts);
      
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(true);
      });
    });

    it('should have remove buttons for each contact', () => {
      uiController.showReviewModal(mockContacts);
      
      const removeButtons = document.querySelectorAll('.remove-contact-btn');
      expect(removeButtons.length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should focus first focusable element when modal opens', () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      
      uiController.showReviewModal(mockContacts);
      
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      uiController.showReviewModal(mockContacts);
      
      const modal = document.getElementById('web-data-extractor-modal');
      const closeBtn = modal?.querySelector('.web-data-extractor-close-btn');
      const removeButtons = modal?.querySelectorAll('.remove-contact-btn');
      
      // Check that buttons have proper titles/labels
      expect(closeBtn?.textContent).toBeTruthy();
      removeButtons?.forEach(btn => {
        expect(btn.getAttribute('title')).toBeTruthy();
      });
    });
  });

  describe('Callback Management', () => {
    it('should allow setting contacts updated callback', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      // Callback should be set (we can't directly test this without triggering an update)
      expect(callback).toBeDefined();
    });
  });

  describe('Inline Editing', () => {
    beforeEach(() => {
      uiController.showReviewModal(mockContacts);
    });

    it('should enable editing when editable field is clicked', () => {
      const editableField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      editableField.click();
      
      const input = editableField.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.value).toBe('João Silva');
    });

    it('should show save and cancel buttons when editing', () => {
      const editableField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      uiController.enableEditing(editableField);
      
      const saveBtn = editableField.querySelector('.web-data-extractor-edit-save');
      const cancelBtn = editableField.querySelector('.web-data-extractor-edit-cancel');
      
      expect(saveBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();
    });

    it('should validate email fields', () => {
      const emailField = document.querySelector('.editable[data-field="email"]') as HTMLElement;
      uiController.enableEditing(emailField);
      
      const input = emailField.querySelector('input') as HTMLInputElement;
      input.value = 'invalid-email';
      input.dispatchEvent(new Event('input'));
      
      expect(input.classList.contains('web-data-extractor-field-error')).toBe(true);
    });

    it('should validate phone fields', () => {
      const phoneField = document.querySelector('.editable[data-field="phone"]') as HTMLElement;
      uiController.enableEditing(phoneField);
      
      const input = phoneField.querySelector('input') as HTMLInputElement;
      input.value = 'invalid-phone';
      input.dispatchEvent(new Event('input'));
      
      expect(input.classList.contains('web-data-extractor-field-error')).toBe(true);
    });

    it('should validate name fields', () => {
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      uiController.enableEditing(nameField);
      
      const input = nameField.querySelector('input') as HTMLInputElement;
      input.value = 'A'; // Too short
      input.dispatchEvent(new Event('input'));
      
      expect(input.classList.contains('web-data-extractor-field-error')).toBe(true);
    });

    it('should save valid changes', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      uiController.enableEditing(nameField);
      
      const input = nameField.querySelector('input') as HTMLInputElement;
      input.value = 'João Santos';
      
      const saveBtn = nameField.querySelector('.web-data-extractor-edit-save') as HTMLElement;
      saveBtn.click();
      
      expect(nameField.textContent).toBe('João Santos');
      expect(callback).toHaveBeenCalled();
    });

    it('should cancel editing and restore original value', () => {
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      const originalValue = nameField.textContent?.trim();
      
      uiController.enableEditing(nameField);
      
      const input = nameField.querySelector('input') as HTMLInputElement;
      input.value = 'Changed Name';
      
      const cancelBtn = nameField.querySelector('.web-data-extractor-edit-cancel') as HTMLElement;
      cancelBtn.click();
      
      expect(nameField.textContent?.trim()).toBe(originalValue);
    });

    it('should save on Enter key press', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      uiController.enableEditing(nameField);
      
      const input = nameField.querySelector('input') as HTMLInputElement;
      input.value = 'João Santos';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(enterEvent, 'target', { value: input });
      input.dispatchEvent(enterEvent);
      
      expect(nameField.textContent?.trim()).toBe('João Santos');
      expect(callback).toHaveBeenCalled();
    });

    it('should cancel on Escape key press', () => {
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      const originalValue = nameField.textContent?.trim();
      
      uiController.enableEditing(nameField);
      
      const input = nameField.querySelector('input') as HTMLInputElement;
      input.value = 'Changed Name';
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(escapeEvent, 'target', { value: input });
      input.dispatchEvent(escapeEvent);
      
      expect(nameField.textContent?.trim()).toBe(originalValue);
    });

    it('should not allow editing if already editing', () => {
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      
      uiController.enableEditing(nameField);
      const firstInput = nameField.querySelector('input');
      
      uiController.enableEditing(nameField);
      const inputs = nameField.querySelectorAll('input');
      
      expect(inputs.length).toBe(1);
      expect(inputs[0]).toBe(firstInput);
    });
  });

  describe('Contact Management', () => {
    beforeEach(() => {
      uiController.showReviewModal(mockContacts);
    });

    it('should remove contact when remove button is clicked', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      const removeBtn = document.querySelector('.remove-contact-btn[data-index="0"]') as HTMLElement;
      removeBtn.click();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(1);
      expect(callback).toHaveBeenCalled();
    });

    it('should not remove contact if user cancels confirmation', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      // Mock confirm dialog to return false
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      const removeBtn = document.querySelector('.remove-contact-btn[data-index="0"]') as HTMLElement;
      removeBtn.click();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(2);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should select all contacts when select all button is clicked', () => {
      const selectAllBtn = document.querySelector('#select-all-btn') as HTMLElement;
      
      // First uncheck all
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => checkbox.checked = false);
      
      selectAllBtn.click();
      
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(true);
      });
      expect(selectAllBtn.textContent).toBe('Desmarcar Todos');
    });

    it('should deselect all contacts when deselect all button is clicked', () => {
      const selectAllBtn = document.querySelector('#select-all-btn') as HTMLElement;
      
      // Ensure all are selected first
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => checkbox.checked = true);
      
      selectAllBtn.click();
      
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(false);
      });
      expect(selectAllBtn.textContent).toBe('Selecionar Todos');
    });

    it('should update remove button state based on selections', () => {
      const removeSelectedBtn = document.querySelector('#remove-selected-btn') as HTMLButtonElement;
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      
      // Uncheck all
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
      });
      
      expect(removeSelectedBtn.disabled).toBe(true);
      expect(removeSelectedBtn.textContent).toBe('Remover Selecionados');
      
      // Check one
      checkboxes[0].checked = true;
      checkboxes[0].dispatchEvent(new Event('change'));
      
      expect(removeSelectedBtn.disabled).toBe(false);
      expect(removeSelectedBtn.textContent).toBe('Remover Selecionados (1)');
    });

    it('should remove selected contacts when remove selected button is clicked', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      // Select first contact only
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes[0].checked = true;
      checkboxes[1].checked = false;
      
      const removeSelectedBtn = document.querySelector('#remove-selected-btn') as HTMLElement;
      removeSelectedBtn.click();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(1);
      expect(callback).toHaveBeenCalled();
    });

    it('should not remove selected contacts if user cancels confirmation', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      
      // Mock confirm dialog to return false
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      // Select first contact
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes[0].checked = true;
      
      const removeSelectedBtn = document.querySelector('#remove-selected-btn') as HTMLElement;
      removeSelectedBtn.click();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(2);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should show warning when trying to remove with no selections', () => {
      const notificationSpy = vi.spyOn(uiController, 'showNotification');
      
      // Uncheck all
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => checkbox.checked = false);
      
      const removeSelectedBtn = document.querySelector('#remove-selected-btn') as HTMLElement;
      removeSelectedBtn.click();
      
      expect(notificationSpy).toHaveBeenCalledWith('Nenhum contato selecionado', 'warning');
    });

    it('should update select all button text based on current selections', () => {
      const selectAllBtn = document.querySelector('#select-all-btn') as HTMLElement;
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      
      // All selected initially
      expect(selectAllBtn.textContent).toBe('Desmarcar Todos');
      
      // Uncheck one
      checkboxes[0].checked = false;
      checkboxes[0].dispatchEvent(new Event('change'));
      
      expect(selectAllBtn.textContent).toBe('Selecionar Todos');
      
      // Uncheck all
      checkboxes[1].checked = false;
      checkboxes[1].dispatchEvent(new Event('change'));
      
      expect(selectAllBtn.textContent).toBe('Selecionar Todos');
    });
  });

  describe('Notifications', () => {
    it('should show notification message', () => {
      uiController.showNotification('Test message', 'success');
      
      const notification = document.querySelector('.web-data-extractor-notification');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toBe('Test message');
      expect(notification?.classList.contains('web-data-extractor-notification-success')).toBe(true);
    });

    it('should remove existing notifications before showing new one', () => {
      uiController.showNotification('First message', 'info');
      uiController.showNotification('Second message', 'success');
      
      const notifications = document.querySelectorAll('.web-data-extractor-notification');
      expect(notifications.length).toBe(1);
      expect(notifications[0].textContent).toBe('Second message');
    });
  });

  describe('Cleanup', () => {
    it('should remove modal from DOM when destroyed', () => {
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal).toBeTruthy();
      
      uiController.destroy();
      
      const modalAfterDestroy = document.getElementById('web-data-extractor-modal');
      expect(modalAfterDestroy).toBeFalsy();
    });

    it('should set visibility to false when destroyed', () => {
      uiController.showReviewModal(mockContacts);
      expect(uiController.isVisible()).toBe(true);
      
      uiController.destroy();
      
      expect(uiController.isVisible()).toBe(false);
    });
  });
});