import { ContactData, NotificationMessage } from '../types/interfaces.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * UI Controller class responsible for managing the user interface
 * including modal display, editing functionality, and user interactions
 */
export class UIController {
  private modal: HTMLElement | null = null;
  private isModalVisible: boolean = false;
  private contacts: ContactData[] = [];
  private onContactsUpdated?: (contacts: ContactData[]) => void;
  private notificationManager: NotificationManager;

  constructor() {
    this.notificationManager = new NotificationManager();
    this.createModalTemplate();
  }

  /**
   * Creates the HTML template for the contact review modal
   */
  private createModalTemplate(): void {
    const modalHTML = `
      <div id="web-data-extractor-modal" class="web-data-extractor-modal" style="display: none;">
        <div class="web-data-extractor-modal-overlay">
          <div class="web-data-extractor-modal-content">
            <div class="web-data-extractor-modal-header">
              <h2>Contatos Extraídos</h2>
              <button class="web-data-extractor-close-btn" type="button">&times;</button>
            </div>
            <div class="web-data-extractor-modal-body">
              <div class="web-data-extractor-contacts-list">
                <!-- Contacts will be dynamically inserted here -->
              </div>
            </div>
            <div class="web-data-extractor-modal-footer">
              <div class="web-data-extractor-actions">
                <button class="web-data-extractor-btn web-data-extractor-btn-secondary" id="select-all-btn" type="button">
                  Selecionar Todos
                </button>
                <button class="web-data-extractor-btn web-data-extractor-btn-danger" id="remove-selected-btn" type="button">
                  Remover Selecionados
                </button>
                <button class="web-data-extractor-btn web-data-extractor-btn-primary" id="export-csv-btn" type="button">
                  Exportar CSV
                </button>
                <button class="web-data-extractor-btn web-data-extractor-btn-secondary" id="cancel-btn" type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal element
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    this.modal = modalContainer.firstElementChild as HTMLElement;
    
    // Append to body
    document.body.appendChild(this.modal);
    
    // Bind event listeners
    this.bindModalEvents();
  }

  /**
   * Binds event listeners for modal interactions
   */
  private bindModalEvents(): void {
    if (!this.modal) return;

    // Close button
    const closeBtn = this.modal.querySelector('.web-data-extractor-close-btn');
    closeBtn?.addEventListener('click', () => this.hideReviewModal());

    // Cancel button
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => this.hideReviewModal());

    // Select all button
    const selectAllBtn = this.modal.querySelector('#select-all-btn');
    selectAllBtn?.addEventListener('click', () => this.toggleSelectAll());

    // Remove selected button
    const removeSelectedBtn = this.modal.querySelector('#remove-selected-btn');
    removeSelectedBtn?.addEventListener('click', () => this.removeSelectedContacts());

    // Overlay click to close
    const overlay = this.modal.querySelector('.web-data-extractor-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideReviewModal();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalVisible) {
        this.hideReviewModal();
      }
    });

    // Delegate event listeners for dynamic content
    this.modal.addEventListener('click', this.handleModalClick.bind(this));
    this.modal.addEventListener('keydown', this.handleModalKeydown.bind(this));
  }

  /**
   * Handles click events within the modal
   */
  private handleModalClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Handle editable field clicks
    if (target.classList.contains('editable')) {
      this.enableEditing(target);
    }

    // Handle remove contact button clicks
    if (target.classList.contains('remove-contact-btn')) {
      const index = parseInt(target.getAttribute('data-index') || '0');
      this.removeContact(index);
    }
  }

  /**
   * Handles keydown events within the modal
   */
  private handleModalKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;

    // Handle Enter key in input fields
    if (e.key === 'Enter' && target.tagName === 'INPUT') {
      e.preventDefault();
      this.saveEdit(target as HTMLInputElement);
    }

    // Handle Escape key in input fields
    if (e.key === 'Escape' && target.tagName === 'INPUT') {
      e.preventDefault();
      this.cancelEdit(target as HTMLInputElement);
    }
  }

  /**
   * Shows the review modal with the provided contacts
   */
  public showReviewModal(contacts: ContactData[]): void {
    if (!this.modal) return;

    this.contacts = [...contacts];
    this.renderContacts();
    this.modal.style.display = 'block';
    this.isModalVisible = true;
    
    // Focus management for accessibility
    const firstFocusable = this.modal.querySelector('button, input, [tabindex]') as HTMLElement;
    firstFocusable?.focus();
  }

  /**
   * Hides the review modal
   */
  public hideReviewModal(): void {
    if (!this.modal) return;

    this.modal.style.display = 'none';
    this.isModalVisible = false;
  }

  /**
   * Renders the contacts list in the modal
   */
  private renderContacts(): void {
    if (!this.modal) return;

    const contactsList = this.modal.querySelector('.web-data-extractor-contacts-list');
    if (!contactsList) return;

    if (this.contacts.length === 0) {
      contactsList.innerHTML = '<p class="web-data-extractor-no-contacts">Nenhum contato encontrado.</p>';
      return;
    }

    const contactsHTML = this.contacts.map((contact, index) => `
      <div class="web-data-extractor-contact-item" data-index="${index}">
        <div class="web-data-extractor-contact-checkbox">
          <input type="checkbox" id="contact-${index}" class="contact-checkbox" checked>
        </div>
        <div class="web-data-extractor-contact-fields">
          <div class="web-data-extractor-field">
            <label>Nome:</label>
            <span class="web-data-extractor-field-value editable" data-field="name" data-index="${index}">
              ${this.escapeHtml(contact.name)}
            </span>
          </div>
          <div class="web-data-extractor-field">
            <label>Telefone:</label>
            <span class="web-data-extractor-field-value editable" data-field="phone" data-index="${index}">
              ${this.escapeHtml(contact.phone)}
            </span>
          </div>
          <div class="web-data-extractor-field">
            <label>Email:</label>
            <span class="web-data-extractor-field-value editable" data-field="email" data-index="${index}">
              ${this.escapeHtml(contact.email)}
            </span>
          </div>
          <div class="web-data-extractor-field-meta">
            <small>Fonte: ${this.escapeHtml(contact.source)}</small>
          </div>
        </div>
        <div class="web-data-extractor-contact-actions">
          <button class="web-data-extractor-btn-icon remove-contact-btn" data-index="${index}" type="button" title="Remover contato">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    contactsList.innerHTML = contactsHTML;
    
    // Update checkbox listeners and button states
    this.updateCheckboxListeners();
    this.updateRemoveButtonState();
    this.updateSelectAllButtonState();
  }

  /**
   * Escapes HTML characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Enables inline editing for a field
   */
  public enableEditing(fieldElement: HTMLElement): void {
    if (fieldElement.querySelector('input')) {
      return; // Already editing
    }

    const currentValue = fieldElement.textContent?.trim() || '';
    const field = fieldElement.getAttribute('data-field') || '';
    const index = parseInt(fieldElement.getAttribute('data-index') || '0');

    // Create input element
    const input = document.createElement('input');
    input.type = field === 'email' ? 'email' : 'text';
    input.value = currentValue;
    input.className = 'web-data-extractor-edit-input';
    input.setAttribute('data-original-value', currentValue);
    input.setAttribute('data-field', field);
    input.setAttribute('data-index', index.toString());

    // Add validation attributes
    if (field === 'email') {
      input.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
    } else if (field === 'phone') {
      input.setAttribute('pattern', '\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}');
    }

    // Create action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'web-data-extractor-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✓';
    saveBtn.className = 'web-data-extractor-edit-btn web-data-extractor-edit-save';
    saveBtn.type = 'button';
    saveBtn.title = 'Salvar';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕';
    cancelBtn.className = 'web-data-extractor-edit-btn web-data-extractor-edit-cancel';
    cancelBtn.type = 'button';
    cancelBtn.title = 'Cancelar';

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    // Replace content with input and buttons
    fieldElement.innerHTML = '';
    fieldElement.appendChild(input);
    fieldElement.appendChild(actionsDiv);

    // Focus and select input
    input.focus();
    input.select();

    // Add event listeners
    saveBtn.addEventListener('click', () => this.saveEdit(input));
    cancelBtn.addEventListener('click', () => this.cancelEdit(input));

    // Real-time validation
    input.addEventListener('input', () => this.validateField(input));
  }

  /**
   * Saves the edited field value
   */
  private saveEdit(input: HTMLInputElement): void {
    const fieldElement = input.closest('.web-data-extractor-field-value') as HTMLElement;
    if (!fieldElement) return;

    const newValue = input.value.trim();
    const field = input.getAttribute('data-field') || '';
    const index = parseInt(input.getAttribute('data-index') || '0');

    // Validate the input
    if (!this.validateFieldValue(field, newValue)) {
      this.showFieldError(input, this.getValidationMessage(field));
      return;
    }

    // Update the contact data
    if (this.contacts[index]) {
      (this.contacts[index] as any)[field] = newValue;
    }

    // Update the display
    fieldElement.innerHTML = this.escapeHtml(newValue);
    fieldElement.classList.add('web-data-extractor-field-updated');

    // Notify callback if set
    if (this.onContactsUpdated) {
      this.onContactsUpdated(this.contacts);
    }

    // Show success feedback
    this.showNotification('Campo atualizado com sucesso', 'success');
  }

  /**
   * Cancels the edit and restores original value
   */
  private cancelEdit(input: HTMLInputElement): void {
    const fieldElement = input.closest('.web-data-extractor-field-value') as HTMLElement;
    if (!fieldElement) return;

    const originalValue = input.getAttribute('data-original-value') || '';
    fieldElement.innerHTML = this.escapeHtml(originalValue);
  }

  /**
   * Validates a field value in real-time
   */
  private validateField(input: HTMLInputElement): void {
    const field = input.getAttribute('data-field') || '';
    const value = input.value.trim();

    if (this.validateFieldValue(field, value)) {
      input.classList.remove('web-data-extractor-field-error');
      this.clearFieldError(input);
    } else {
      input.classList.add('web-data-extractor-field-error');
      this.showFieldError(input, this.getValidationMessage(field));
    }
  }

  /**
   * Validates a field value
   */
  private validateFieldValue(field: string, value: string): boolean {
    if (!value) return false;

    switch (field) {
      case 'email':
        return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
      case 'phone':
        return /^(\+55\s?)?\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(value.replace(/\s/g, ''));
      case 'name':
        return value.length >= 2 && /^[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Gets validation message for a field
   */
  private getValidationMessage(field: string): string {
    switch (field) {
      case 'email':
        return 'Por favor, insira um email válido';
      case 'phone':
        return 'Por favor, insira um telefone válido (formato brasileiro)';
      case 'name':
        return 'Por favor, insira um nome válido (mínimo 2 caracteres)';
      default:
        return 'Valor inválido';
    }
  }

  /**
   * Shows field error message
   */
  private showFieldError(input: HTMLInputElement, message: string): void {
    this.clearFieldError(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'web-data-extractor-field-error-message';
    errorDiv.textContent = message;

    const fieldElement = input.closest('.web-data-extractor-field-value');
    fieldElement?.appendChild(errorDiv);
  }

  /**
   * Clears field error message
   */
  private clearFieldError(input: HTMLInputElement): void {
    const fieldElement = input.closest('.web-data-extractor-field-value');
    const errorMsg = fieldElement?.querySelector('.web-data-extractor-field-error-message');
    errorMsg?.remove();
  }

  /**
   * Removes a contact from the list
   */
  private removeContact(index: number): void {
    if (index < 0 || index >= this.contacts.length) return;

    // Show confirmation dialog
    if (!confirm('Tem certeza que deseja remover este contato?')) {
      return;
    }

    // Remove from contacts array
    this.contacts.splice(index, 1);

    // Re-render the contacts list
    this.renderContacts();

    // Notify callback if set
    if (this.onContactsUpdated) {
      this.onContactsUpdated(this.contacts);
    }

    this.showNotification('Contato removido com sucesso', 'success');
  }

  /**
   * Toggles select all/none functionality
   */
  private toggleSelectAll(): void {
    if (!this.modal) return;

    const checkboxes = this.modal.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
    const selectAllBtn = this.modal.querySelector('#select-all-btn') as HTMLButtonElement;
    
    if (!checkboxes.length || !selectAllBtn) return;

    // Check if all are currently selected
    const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    // Toggle all checkboxes
    checkboxes.forEach(checkbox => {
      checkbox.checked = !allSelected;
    });

    // Update button text
    selectAllBtn.textContent = allSelected ? 'Selecionar Todos' : 'Desmarcar Todos';
    
    // Update remove button state
    this.updateRemoveButtonState();
  }

  /**
   * Updates the state of the remove selected button
   */
  private updateRemoveButtonState(): void {
    if (!this.modal) return;

    const checkboxes = this.modal.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
    const removeSelectedBtn = this.modal.querySelector('#remove-selected-btn') as HTMLButtonElement;
    
    if (!removeSelectedBtn) return;

    const selectedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
    
    removeSelectedBtn.disabled = selectedCount === 0;
    removeSelectedBtn.textContent = selectedCount > 0 
      ? `Remover Selecionados (${selectedCount})` 
      : 'Remover Selecionados';
  }

  /**
   * Removes selected contacts with confirmation
   */
  private removeSelectedContacts(): void {
    if (!this.modal) return;

    const checkboxes = this.modal.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
    const selectedIndices: number[] = [];

    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        selectedIndices.push(index);
      }
    });

    if (selectedIndices.length === 0) {
      this.showNotification('Nenhum contato selecionado', 'warning');
      return;
    }

    // Show confirmation dialog
    const confirmMessage = selectedIndices.length === 1 
      ? 'Tem certeza que deseja remover este contato?'
      : `Tem certeza que deseja remover ${selectedIndices.length} contatos?`;

    if (!this.showConfirmDialog(confirmMessage)) {
      return;
    }

    // Remove contacts in reverse order to maintain indices
    selectedIndices.reverse().forEach(index => {
      this.contacts.splice(index, 1);
    });

    // Re-render the contacts list
    this.renderContacts();

    // Notify callback if set
    if (this.onContactsUpdated) {
      this.onContactsUpdated(this.contacts);
    }

    const removedCount = selectedIndices.length;
    this.showNotification(
      `${removedCount} contato${removedCount > 1 ? 's removidos' : ' removido'} com sucesso`, 
      'success'
    );
  }

  /**
   * Shows a confirmation dialog
   */
  private showConfirmDialog(message: string): boolean {
    return confirm(message);
  }

  /**
   * Updates checkbox event listeners after re-rendering
   */
  private updateCheckboxListeners(): void {
    if (!this.modal) return;

    const checkboxes = this.modal.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateRemoveButtonState();
        this.updateSelectAllButtonState();
      });
    });
  }

  /**
   * Updates the select all button state based on current selections
   */
  private updateSelectAllButtonState(): void {
    if (!this.modal) return;

    const checkboxes = this.modal.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
    const selectAllBtn = this.modal.querySelector('#select-all-btn') as HTMLButtonElement;
    
    if (!checkboxes.length || !selectAllBtn) return;

    const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
    const noneSelected = Array.from(checkboxes).every(checkbox => !checkbox.checked);
    
    if (allSelected) {
      selectAllBtn.textContent = 'Desmarcar Todos';
    } else if (noneSelected) {
      selectAllBtn.textContent = 'Selecionar Todos';
    } else {
      selectAllBtn.textContent = 'Selecionar Todos';
    }
  }

  /**
   * Shows a notification message using the NotificationManager
   */
  public showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number): string {
    return this.notificationManager.show(message, type, duration);
  }

  /**
   * Shows a notification using the NotificationMessage interface
   */
  public showNotificationMessage(notification: NotificationMessage): string {
    return this.notificationManager.showNotification(notification);
  }

  /**
   * Dismisses a specific notification
   */
  public dismissNotification(notificationId: string): void {
    this.notificationManager.dismiss(notificationId);
  }

  /**
   * Dismisses all notifications
   */
  public dismissAllNotifications(): void {
    this.notificationManager.dismissAll();
  }

  /**
   * Sets callback for when contacts are updated
   */
  public setContactsUpdatedCallback(callback: (contacts: ContactData[]) => void): void {
    this.onContactsUpdated = callback;
  }

  /**
   * Gets the current modal visibility state
   */
  public isVisible(): boolean {
    return this.isModalVisible;
  }

  /**
   * Destroys the modal and cleans up event listeners
   */
  public destroy(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    this.isModalVisible = false;
    this.notificationManager.destroy();
  }
}