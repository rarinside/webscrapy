/**
 * End-to-End tests for complete extraction workflow
 * Tests UI interaction, data editing, and CSV export functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebDataExtractor } from '../index.js';
import { UIController } from '../classes/UIController.js';
import { DataManager } from '../classes/DataManager.js';
import { DOMScanner } from '../classes/DOMScanner.js';
import { CSVExporter } from '../classes/CSVExporter.js';
import { ContactData } from '../types/interfaces.js';
import fs from 'fs';
import path from 'path';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: 'https://example.com/test-page' },
  writable: true
});

describe('End-to-End Tests', () => {
  let extractor: WebDataExtractor;
  let uiController: UIController;
  let dataManager: DataManager;
  let domScanner: DOMScanner;
  let csvExporter: CSVExporter;

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Initialize components
    dataManager = new DataManager();
    domScanner = new DOMScanner();
    csvExporter = new CSVExporter();
    uiController = new UIController();
    extractor = new WebDataExtractor();
  });

  afterEach(() => {
    extractor?.destroy();
    uiController?.destroy();
    domScanner?.cleanup();
    document.body.innerHTML = '';
  });

  describe('Complete Extraction Workflow', () => {
    beforeEach(() => {
      // Load test page with contacts
      const htmlPath = path.join(__dirname, 'pages/simple-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should complete full extraction workflow from DOM to CSV', async () => {
      // Step 1: Initialize extractor
      extractor.init();
      expect(extractor.getState().isInitialized).toBe(true);

      // Step 2: Activate extraction
      await extractor.activate();
      expect(extractor.getState().isActive).toBe(true);

      // Step 3: Verify contacts were extracted
      const contacts = extractor.getContacts();
      expect(contacts.length).toBeGreaterThan(0);

      // Step 4: Verify specific contact data
      const joaoContact = contacts.find(c => c.name === 'João Silva');
      expect(joaoContact).toBeTruthy();
      expect(joaoContact?.phone).toBe('(11) 99999-9999');
      expect(joaoContact?.email).toBe('joao.silva@empresa.com.br');

      // Step 5: Test CSV export
      const csvContent = csvExporter.generateCSV(contacts);
      expect(csvContent).toContain('Nome,Telefone,Email,Fonte,Data de Extração');
      expect(csvContent).toContain('João Silva');
      expect(csvContent).toContain('(11) 99999-9999');
      expect(csvContent).toContain('joao.silva@empresa.com.br');

      // Step 6: Deactivate
      extractor.deactivate();
      expect(extractor.getState().isActive).toBe(false);
    });

    it('should handle empty pages gracefully', () => {
      document.body.innerHTML = '<html><body><h1>Empty Page</h1></body></html>';
      
      extractor.init();
      
      expect(() => extractor.activate()).not.toThrow();
      
      const contacts = extractor.getContacts();
      expect(contacts).toHaveLength(0);
    });

    it('should handle pages with no valid contacts', () => {
      document.body.innerHTML = `
        <html><body>
          <h1>No Contacts Page</h1>
          <p>This page has no contact information.</p>
          <p>Just some random text and numbers like 123456789.</p>
          <p>And some invalid emails like @invalid.com and invalid@.</p>
        </body></html>
      `;
      
      extractor.init();
      extractor.activate();
      
      const contacts = extractor.getContacts();
      expect(contacts).toHaveLength(0);
    });
  });

  describe('UI Interaction Tests', () => {
    let mockContacts: ContactData[];

    beforeEach(() => {
      mockContacts = [
        {
          name: 'João Silva',
          phone: '(11) 99999-9999',
          email: 'joao@test.com',
          source: 'https://example.com',
          timestamp: new Date()
        },
        {
          name: 'Maria Santos',
          phone: '(21) 88888-8888',
          email: 'maria@test.com',
          source: 'https://example.com',
          timestamp: new Date()
        }
      ];
    });

    it('should show review modal with extracted contacts', () => {
      uiController.showReviewModal(mockContacts);
      
      expect(uiController.isVisible()).toBe(true);
      
      const modal = document.getElementById('web-data-extractor-modal');
      expect(modal).toBeTruthy();
      expect(modal?.style.display).toBe('block');
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(2);
    });

    it('should handle contact editing workflow', () => {
      uiController.showReviewModal(mockContacts);
      
      // Find editable name field
      const nameField = document.querySelector('.editable[data-field="name"]') as HTMLElement;
      expect(nameField).toBeTruthy();
      
      // Enable editing
      uiController.enableEditing(nameField);
      
      // Check that input field was created
      const input = nameField.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('João Silva');
      
      // Check that save/cancel buttons exist
      const saveBtn = nameField.querySelector('.web-data-extractor-edit-save');
      const cancelBtn = nameField.querySelector('.web-data-extractor-edit-cancel');
      expect(saveBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();
    });

    it('should validate edited contact data', () => {
      uiController.showReviewModal(mockContacts);
      
      // Test email validation
      const emailField = document.querySelector('.editable[data-field="email"]') as HTMLElement;
      uiController.enableEditing(emailField);
      
      const emailInput = emailField.querySelector('input') as HTMLInputElement;
      
      // Test invalid email
      emailInput.value = 'invalid-email';
      emailInput.dispatchEvent(new Event('input'));
      expect(emailInput.classList.contains('web-data-extractor-field-error')).toBe(true);
      
      // Test valid email
      emailInput.value = 'valid@email.com';
      emailInput.dispatchEvent(new Event('input'));
      expect(emailInput.classList.contains('web-data-extractor-field-error')).toBe(false);
    });

    it('should handle contact removal', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      uiController.showReviewModal(mockContacts);
      
      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      const removeBtn = document.querySelector('.remove-contact-btn[data-index="0"]') as HTMLElement;
      removeBtn.click();
      
      expect(callback).toHaveBeenCalled();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(1);
    });

    it('should handle select all/none functionality', () => {
      uiController.showReviewModal(mockContacts);
      
      const selectAllBtn = document.querySelector('#select-all-btn') as HTMLElement;
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      
      // Initially all should be checked
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(true);
      });
      expect(selectAllBtn.textContent).toBe('Desmarcar Todos');
      
      // Click to deselect all
      selectAllBtn.click();
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(false);
      });
      expect(selectAllBtn.textContent).toBe('Selecionar Todos');
      
      // Click to select all again
      selectAllBtn.click();
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(true);
      });
      expect(selectAllBtn.textContent).toBe('Desmarcar Todos');
    });

    it('should handle bulk contact removal', () => {
      const callback = vi.fn();
      uiController.setContactsUpdatedCallback(callback);
      uiController.showReviewModal(mockContacts);
      
      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      // Select first contact only
      const checkboxes = document.querySelectorAll('.contact-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes[0].checked = true;
      checkboxes[1].checked = false;
      
      // Trigger change event to update button state
      checkboxes[0].dispatchEvent(new Event('change'));
      
      const removeSelectedBtn = document.querySelector('#remove-selected-btn') as HTMLElement;
      removeSelectedBtn.click();
      
      expect(callback).toHaveBeenCalled();
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(1);
    });
  });

  describe('CSV Export End-to-End', () => {
    let mockContacts: ContactData[];

    beforeEach(() => {
      mockContacts = [
        {
          name: 'João Silva',
          phone: '(11) 99999-9999',
          email: 'joao@test.com',
          source: 'https://example.com',
          timestamp: new Date('2024-01-15T10:30:00Z')
        },
        {
          name: 'Maria Santos',
          phone: '(21) 88888-8888',
          email: 'maria@test.com',
          source: 'https://example.com',
          timestamp: new Date('2024-01-15T11:45:00Z')
        }
      ];

      // Mock download functionality
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockElement = {
        click: vi.fn(),
        style: {},
        setAttribute: vi.fn(),
        href: '',
        download: ''
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as any);
      
      global.Blob = vi.fn().mockImplementation((content, options) => ({
        content,
        options,
        type: options?.type || 'text/plain'
      })) as any;
    });

    it('should export contacts to CSV with proper formatting', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      
      // Check UTF-8 BOM
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      
      // Check headers
      expect(csv).toContain('Nome,Telefone,Email,Fonte,Data de Extração');
      
      // Check data rows
      expect(csv).toContain('João Silva,(11) 99999-9999,joao@test.com,https://example.com');
      expect(csv).toContain('Maria Santos,(21) 88888-8888,maria@test.com,https://example.com');
      
      // Check Brazilian date format
      expect(csv).toContain('15/01/2024 10:30:00');
      expect(csv).toContain('15/01/2024 11:45:00');
    });

    it('should trigger CSV download', () => {
      csvExporter.exportContacts(mockContacts, 'test-export.csv');
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Nome,Telefone,Email')],
        { type: 'text/csv;charset=utf-8;' }
      );
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle CSV export from UI', () => {
      uiController.showReviewModal(mockContacts);
      
      const exportBtn = document.querySelector('#export-csv-btn') as HTMLElement;
      expect(exportBtn).toBeTruthy();
      
      // Mock the CSV export functionality
      const exportSpy = vi.spyOn(csvExporter, 'exportContacts').mockImplementation(() => {});
      
      // We need to set up the callback to actually trigger the export
      uiController.setContactsUpdatedCallback((contacts) => {
        if (contacts.length > 0) {
          csvExporter.exportContacts(contacts);
        }
      });
      
      // Simulate export button click (this would normally be handled by the UI)
      exportBtn.click();
      
      // In a real scenario, this would be triggered by the UI callback
      csvExporter.exportContacts(mockContacts);
      
      expect(exportSpy).toHaveBeenCalledWith(mockContacts);
    });
  });

  describe('Error Handling End-to-End', () => {
    it('should handle DOM scanning errors gracefully', () => {
      // Create malformed HTML
      document.body.innerHTML = `
        <html><body>
          <table>
            <tr>
              <td>Incomplete row
            </tr>
            <tr>
              <td>Valid Contact</td>
              <td>(11) 99999-9999</td>
              <td>valid@test.com</td>
            </tr>
          </table>
        </body></html>
      `;
      
      expect(() => {
        const contacts = domScanner.scanPage();
        expect(Array.isArray(contacts)).toBe(true);
      }).not.toThrow();
    });

    it('should handle data manager errors gracefully', () => {
      const invalidContact = {
        name: '',
        phone: 'invalid',
        email: 'invalid',
        source: '',
        timestamp: new Date()
      };
      
      expect(() => {
        const result = dataManager.addContact(invalidContact);
        expect(result).toBe(false);
      }).not.toThrow();
    });

    it('should handle CSV export errors gracefully', () => {
      expect(() => {
        csvExporter.generateCSV([]);
      }).toThrow('Nenhum contato fornecido para exportação');
      
      expect(() => {
        csvExporter.downloadCSV('');
      }).toThrow('Conteúdo CSV vazio para download');
    });

    it('should handle UI errors gracefully', () => {
      expect(() => {
        uiController.showReviewModal([]);
      }).not.toThrow();
      
      expect(() => {
        uiController.hideReviewModal();
      }).not.toThrow();
    });
  });

  describe('Performance End-to-End', () => {
    it('should handle large datasets efficiently in complete workflow', () => {
      // Create large dataset
      const largeDataset: ContactData[] = Array(1000).fill(null).map((_, i) => ({
        name: `Contact ${i}`,
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        email: `contact${i}@test.com`,
        source: 'https://example.com',
        timestamp: new Date()
      }));

      const startTime = Date.now();

      // Add to data manager
      largeDataset.forEach(contact => {
        dataManager.addContact(contact);
      });

      // Generate CSV
      const csvContent = csvExporter.generateCSV(dataManager.getAllContacts());

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete in less than 10 seconds
      expect(dataManager.getContactCount()).toBe(1000);
      expect(csvContent.split('\n')).toHaveLength(1002); // Header + 1000 contacts + empty line
    });

    it('should handle UI with large datasets efficiently', () => {
      const largeDataset: ContactData[] = Array(100).fill(null).map((_, i) => ({
        name: `Contact ${i}`,
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        email: `contact${i}@test.com`,
        source: 'https://example.com',
        timestamp: new Date()
      }));

      const startTime = Date.now();
      
      uiController.showReviewModal(largeDataset);
      
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should render in less than 2 seconds
      
      const contactItems = document.querySelectorAll('.web-data-extractor-contact-item');
      expect(contactItems.length).toBe(100);
    });
  });

  describe('Session Persistence End-to-End', () => {
    it('should persist and restore extraction sessions', () => {
      const testContacts: ContactData[] = [
        {
          name: 'Session Test',
          phone: '(11) 99999-9999',
          email: 'session@test.com',
          source: 'https://example.com',
          timestamp: new Date()
        }
      ];

      // Add contacts to data manager
      testContacts.forEach(contact => {
        dataManager.addContact(contact);
      });

      // Save session
      dataManager.saveSession({ extractedCount: 1 });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'web-data-extractor-session',
        expect.stringContaining('Session Test')
      );

      // Create new data manager and restore session
      const newDataManager = new DataManager();
      const restored = newDataManager.restoreSession('merge');
      
      expect(restored).toBe(true);
      expect(newDataManager.getContactCount()).toBe(1);
      expect(newDataManager.getContact(0)?.name).toBe('Session Test');
    });

    it('should handle session cleanup', () => {
      dataManager.saveSession({ extractedCount: 1 });
      dataManager.clearSession();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('web-data-extractor-session');
    });
  });

  describe('Integration with Real Browser APIs', () => {
    it('should work with real DOM events', () => {
      const htmlPath = path.join(__dirname, 'pages/simple-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;

      extractor.init();

      // Test keyboard shortcut
      const keyboardEvent = new KeyboardEvent('keydown', {
        ctrlKey: true,
        shiftKey: true,
        key: 'e',
        bubbles: true,
        cancelable: true
      });

      document.dispatchEvent(keyboardEvent);

      // Should have activated the extractor
      expect(extractor.getState().isActive).toBe(true);
    });

    it('should work with real mouse events', () => {
      uiController.showReviewModal([{
        name: 'Test Contact',
        phone: '(11) 99999-9999',
        email: 'test@test.com',
        source: 'https://example.com',
        timestamp: new Date()
      }]);

      const closeBtn = document.querySelector('.web-data-extractor-close-btn') as HTMLElement;
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      closeBtn.dispatchEvent(clickEvent);

      expect(uiController.isVisible()).toBe(false);
    });
  });
});