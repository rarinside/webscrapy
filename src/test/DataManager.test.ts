import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataManager } from '../classes/DataManager.js';
import { ContactData } from '../types/interfaces.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test-page'
  },
  writable: true
});

describe('DataManager', () => {
  let dataManager: DataManager;
  let mockContact: ContactData;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    dataManager = new DataManager();
    mockContact = {
      name: 'João Silva',
      phone: '(11) 99999-9999',
      email: 'joao@example.com',
      source: 'https://example.com',
      timestamp: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact Management', () => {
    it('should add a valid contact', () => {
      const result = dataManager.addContact(mockContact);
      
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
      expect(dataManager.getAllContacts()).toHaveLength(1);
    });

    it('should not add invalid contact (missing name)', () => {
      const invalidContact = { ...mockContact, name: '' };
      const result = dataManager.addContact(invalidContact);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(0);
    });

    it('should not add invalid contact (no phone or email)', () => {
      const invalidContact = { ...mockContact, phone: '', email: '' };
      const result = dataManager.addContact(invalidContact);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(0);
    });

    it('should not add invalid contact (invalid email)', () => {
      const invalidContact = { ...mockContact, email: 'invalid-email' };
      const result = dataManager.addContact(invalidContact);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(0);
    });

    it('should not add invalid contact (invalid phone)', () => {
      const invalidContact = { ...mockContact, phone: '123' };
      const result = dataManager.addContact(invalidContact);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(0);
    });

    it('should remove contact by index', () => {
      dataManager.addContact(mockContact);
      const result = dataManager.removeContact(0);
      
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(0);
    });

    it('should not remove contact with invalid index', () => {
      dataManager.addContact(mockContact);
      const result = dataManager.removeContact(5);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should update contact by index', () => {
      dataManager.addContact(mockContact);
      const updatedContact = { ...mockContact, name: 'Maria Silva' };
      const result = dataManager.updateContact(0, updatedContact);
      
      expect(result).toBe(true);
      expect(dataManager.getContact(0)?.name).toBe('Maria Silva');
    });

    it('should not update contact with invalid index', () => {
      dataManager.addContact(mockContact);
      const updatedContact = { ...mockContact, name: 'Maria Silva' };
      const result = dataManager.updateContact(5, updatedContact);
      
      expect(result).toBe(false);
    });

    it('should get contact by index', () => {
      dataManager.addContact(mockContact);
      const contact = dataManager.getContact(0);
      
      expect(contact).not.toBeNull();
      expect(contact?.name).toBe(mockContact.name);
    });

    it('should return null for invalid index', () => {
      const contact = dataManager.getContact(0);
      expect(contact).toBeNull();
    });

    it('should clear all contacts', () => {
      dataManager.addContact(mockContact);
      dataManager.clearAll();
      
      expect(dataManager.getContactCount()).toBe(0);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate by name and phone', () => {
      dataManager.addContact(mockContact);
      const duplicate = { ...mockContact };
      const result = dataManager.addContact(duplicate);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should detect duplicate by name and email', () => {
      const contact1 = { ...mockContact, phone: '' };
      const contact2 = { ...mockContact, phone: '(21) 88888-8888' };
      
      dataManager.addContact(contact1);
      const result = dataManager.addContact(contact2);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should allow different contacts with same name but different contact info', () => {
      const contact2 = {
        ...mockContact,
        phone: '(21) 88888-8888',
        email: 'joao2@example.com'
      };
      
      dataManager.addContact(mockContact);
      const result = dataManager.addContact(contact2);
      
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(2);
    });

    it('should normalize phone numbers for duplicate detection', () => {
      const contact1 = { ...mockContact, phone: '(11) 99999-9999' };
      const contact2 = { ...mockContact, phone: '11 99999 9999' };
      
      dataManager.addContact(contact1);
      const result = dataManager.addContact(contact2);
      
      expect(result).toBe(false);
      expect(dataManager.getContactCount()).toBe(1);
    });
  });

  describe('Data Validation', () => {
    it('should accept valid Brazilian phone formats', () => {
      const validPhones = [
        '(11) 99999-9999',
        '11 99999-9999',
        '+55 11 99999-9999',
        '11999999999'
      ];

      validPhones.forEach((phone, index) => {
        const contact = { ...mockContact, phone, email: `test${index}@example.com`, name: `Test ${index}` };
        const result = dataManager.addContact(contact);
        if (!result) {
          console.log(`Failed to add contact with phone: ${phone}`);
        }
        expect(result).toBe(true);
      });

      expect(dataManager.getContactCount()).toBe(validPhones.length);
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach((email, index) => {
        const contact = { ...mockContact, email, phone: `(1${index}) 99999-999${index}` };
        const result = dataManager.addContact(contact);
        expect(result).toBe(true);
      });

      expect(dataManager.getContactCount()).toBe(validEmails.length);
    });

    it('should accept contact with only phone', () => {
      const contact = { ...mockContact, email: '' };
      const result = dataManager.addContact(contact);
      
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should accept contact with only email', () => {
      const contact = { ...mockContact, phone: '' };
      const result = dataManager.addContact(contact);
      
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
    });
  });

  describe('Storage Persistence', () => {
    it('should save to localStorage when adding contact', () => {
      dataManager.addContact(mockContact);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'web-data-extractor-contacts',
        expect.stringContaining(mockContact.name)
      );
    });

    it('should load from localStorage on initialization', () => {
      const storedData = {
        contacts: [mockContact],
        lastUpdated: new Date().toISOString()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const newDataManager = new DataManager();
      expect(newDataManager.getContactCount()).toBe(1);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const result = dataManager.addContact(mockContact);
      expect(result).toBe(true); // Should still add to memory
      expect(dataManager.getContactCount()).toBe(1);
    });
  });

  describe('Session Management', () => {
    it('should save session data', () => {
      dataManager.addContact(mockContact);
      dataManager.saveSession({ extractedCount: 1 });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'web-data-extractor-session',
        expect.stringContaining(mockContact.name)
      );
    });

    it('should load session data', () => {
      const sessionData = {
        contacts: [mockContact],
        sessionData: { extractedCount: 1 },
        timestamp: new Date().toISOString(),
        url: 'https://example.com'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const session = dataManager.loadSession();
      expect(session).not.toBeNull();
      expect(session?.contacts).toHaveLength(1);
    });

    it('should restore session with merge strategy', () => {
      const sessionData = {
        contacts: [mockContact],
        sessionData: {},
        timestamp: new Date().toISOString(),
        url: 'https://example.com'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const result = dataManager.restoreSession('merge');
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should restore session with replace strategy', () => {
      // Add a contact first
      dataManager.addContact(mockContact);
      expect(dataManager.getContactCount()).toBe(1);
      
      // Mock session with different contact
      const differentContact = { ...mockContact, name: 'Maria Santos' };
      const sessionData = {
        contacts: [differentContact],
        sessionData: {},
        timestamp: new Date().toISOString(),
        url: 'https://example.com'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const result = dataManager.restoreSession('replace');
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
      expect(dataManager.getContact(0)?.name).toBe('Maria Santos');
    });

    it('should clear session', () => {
      dataManager.clearSession();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('web-data-extractor-session');
    });

    it('should check if session exists', () => {
      localStorageMock.getItem.mockReturnValue('{}');
      expect(dataManager.hasSession()).toBe(true);
      
      localStorageMock.getItem.mockReturnValue(null);
      expect(dataManager.hasSession()).toBe(false);
    });

    it('should calculate session age', () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const sessionData = {
        contacts: [],
        sessionData: {},
        timestamp: oneHourAgo.toISOString(),
        url: 'https://example.com'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const age = dataManager.getSessionAge();
      expect(age).toBeGreaterThanOrEqual(59); // Should be around 60 minutes
      expect(age).toBeLessThanOrEqual(61);
    });

    it('should cleanup old sessions', () => {
      const oldTimestamp = new Date();
      oldTimestamp.setHours(oldTimestamp.getHours() - 25); // 25 hours ago
      
      const sessionData = {
        contacts: [],
        sessionData: {},
        timestamp: oldTimestamp.toISOString(),
        url: 'https://example.com'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      dataManager.cleanupOldSessions(24); // Max age 24 hours
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('web-data-extractor-session');
    });
  });

  describe('Import/Export', () => {
    it('should export session data', () => {
      dataManager.addContact(mockContact);
      const exportData = dataManager.exportSessionData();
      
      expect(exportData).toContain(mockContact.name);
      expect(exportData).toContain('"version": "1.0"');
    });

    it('should import session data with merge strategy', () => {
      const importData = {
        contacts: [mockContact],
        exportTimestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      const result = dataManager.importSessionData(JSON.stringify(importData), 'merge');
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should handle invalid import data', () => {
      const result = dataManager.importSessionData('invalid json', 'merge');
      expect(result).toBe(false);
    });
  });

  describe('Advanced Edge Cases', () => {
    it('should handle contacts with very long field values', () => {
      const longContact = {
        name: 'A'.repeat(1000),
        phone: '(11) 99999-9999',
        email: 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com',
        source: 'https://example.com/' + 'c'.repeat(1000),
        timestamp: new Date()
      };

      const result = dataManager.addContact(longContact);
      expect(result).toBe(true);
      expect(dataManager.getContactCount()).toBe(1);
    });

    it('should handle contacts with special characters in all fields', () => {
      const specialContact = {
        name: 'José María Ñoño',
        phone: '(11) 99999-9999',
        email: 'josé.maría@tëst.com',
        source: 'https://example.com/página?param=valué',
        timestamp: new Date()
      };

      const result = dataManager.addContact(specialContact);
      expect(result).toBe(true);
      expect(dataManager.getContact(0)?.name).toBe('José María Ñoño');
    });

    it('should handle concurrent operations safely', () => {
      const contacts = Array(100).fill(null).map((_, i) => ({
        name: `Contact ${i}`,
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        email: `contact${i}@test.com`,
        source: 'https://example.com',
        timestamp: new Date()
      }));

      // Add all contacts
      contacts.forEach(contact => {
        dataManager.addContact(contact);
      });

      expect(dataManager.getContactCount()).toBe(100);

      // Remove every other contact
      for (let i = 99; i >= 0; i -= 2) {
        dataManager.removeContact(i);
      }

      expect(dataManager.getContactCount()).toBe(50);
    });

    it('should handle malformed contact data gracefully', () => {
      const malformedContacts = [
        { name: '', phone: '(11) 99999-9999', email: '', source: '', timestamp: new Date() },
        { name: 'Test', phone: '', email: '', source: '', timestamp: new Date() },
        { name: 'Test', phone: 'invalid', email: 'invalid', source: '', timestamp: new Date() },
        { name: null as any, phone: '(11) 99999-9999', email: 'test@test.com', source: '', timestamp: new Date() }
      ];

      malformedContacts.forEach(contact => {
        const result = dataManager.addContact(contact);
        expect(result).toBe(false);
      });

      expect(dataManager.getContactCount()).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      
      // Add 1000 contacts
      for (let i = 0; i < 1000; i++) {
        dataManager.addContact({
          name: `Contact ${i}`,
          phone: `(11) 9999${i.toString().padStart(4, '0')}`,
          email: `contact${i}@test.com`,
          source: 'https://example.com',
          timestamp: new Date()
        });
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(dataManager.getContactCount()).toBe(1000);

      // Test retrieval performance
      const retrievalStart = Date.now();
      const allContacts = dataManager.getAllContacts();
      const retrievalTime = Date.now() - retrievalStart;
      
      expect(retrievalTime).toBeLessThan(100); // Should be very fast
      expect(allContacts).toHaveLength(1000);
    });

    it('should handle duplicate detection efficiently with large datasets', () => {
      const baseContact = {
        name: 'Test User',
        phone: '(11) 99999-9999',
        email: 'test@test.com',
        source: 'https://example.com',
        timestamp: new Date()
      };

      // Add the base contact
      dataManager.addContact(baseContact);

      const startTime = Date.now();
      
      // Try to add 100 duplicates
      for (let i = 0; i < 100; i++) {
        dataManager.addContact({ ...baseContact });
      }

      const duplicateTime = Date.now() - startTime;
      expect(duplicateTime).toBeLessThan(1000); // Should complete quickly
      expect(dataManager.getContactCount()).toBe(1); // Should still have only 1 contact
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after multiple operations', () => {
      const contacts = [
        { name: 'Contact 1', phone: '(11) 99999-9999', email: 'c1@test.com', source: 'https://example.com', timestamp: new Date() },
        { name: 'Contact 2', phone: '(21) 88888-8888', email: 'c2@test.com', source: 'https://example.com', timestamp: new Date() },
        { name: 'Contact 3', phone: '(31) 77777-7777', email: 'c3@test.com', source: 'https://example.com', timestamp: new Date() }
      ];

      // Add contacts
      contacts.forEach(contact => dataManager.addContact(contact));
      expect(dataManager.getContactCount()).toBe(3);

      // Update middle contact
      const updatedContact = { ...contacts[1], name: 'Updated Contact 2' };
      dataManager.updateContact(1, updatedContact);
      expect(dataManager.getContact(1)?.name).toBe('Updated Contact 2');

      // Remove first contact
      dataManager.removeContact(0);
      expect(dataManager.getContactCount()).toBe(2);
      expect(dataManager.getContact(0)?.name).toBe('Updated Contact 2');

      // Verify data integrity
      const allContacts = dataManager.getAllContacts();
      expect(allContacts).toHaveLength(2);
      expect(allContacts[0].name).toBe('Updated Contact 2');
      expect(allContacts[1].name).toBe('Contact 3');
    });

    it('should handle timestamp edge cases', () => {
      const contactWithoutTimestamp = {
        name: 'No Timestamp',
        phone: '(11) 99999-9999',
        email: 'test@test.com',
        source: 'https://example.com',
        timestamp: undefined as any
      };

      const result = dataManager.addContact(contactWithoutTimestamp);
      expect(result).toBe(true);
      
      const savedContact = dataManager.getContact(0);
      expect(savedContact?.timestamp).toBeInstanceOf(Date);
    });

    it('should handle source URL edge cases', () => {
      const contactsWithDifferentSources = [
        { ...mockContact, source: '' },
        { ...mockContact, name: 'Test 2', phone: '(21) 88888-8888', source: 'file:///local/file.html' },
        { ...mockContact, name: 'Test 3', phone: '(31) 77777-7777', source: 'data:text/html,<html>test</html>' },
        { ...mockContact, name: 'Test 4', phone: '(41) 66666-6666', source: 'https://example.com/very/long/path/with/many/segments?param1=value1&param2=value2#fragment' }
      ];

      contactsWithDifferentSources.forEach(contact => {
        const result = dataManager.addContact(contact);
        expect(result).toBe(true);
      });

      expect(dataManager.getContactCount()).toBe(4);
    });
  });
});