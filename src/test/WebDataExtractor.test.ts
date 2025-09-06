/**
 * Tests for the main WebDataExtractor application controller
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebDataExtractor } from '../index.js';

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test-page'
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock document methods
Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true
});

describe('WebDataExtractor', () => {
  let extractor: WebDataExtractor;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create fresh extractor instance
    extractor = new WebDataExtractor();
  });

  afterEach(() => {
    // Clean up
    if (extractor) {
      extractor.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(() => extractor.init()).not.toThrow();
      
      const state = extractor.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isActive).toBe(false);
      expect(state.contactCount).toBe(0);
    });

    it('should not initialize twice', () => {
      extractor.init();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      extractor.init(); // Second initialization
      
      expect(consoleSpy).toHaveBeenCalledWith('Web Data Extractor already initialized');
      consoleSpy.mockRestore();
    });

    it('should create activation button after initialization', () => {
      extractor.init();
      
      const button = document.getElementById('web-data-extractor-activation-btn');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      extractor.init();
      
      // Mock the DOM scanner to return some test contacts to prevent auto-deactivation
      const mockContacts = [{
        name: 'Test User',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        source: 'https://example.com',
        timestamp: new Date()
      }];
      const mockScanPage = vi.fn().mockReturnValue(mockContacts);
      (extractor as any).domScanner.scanPage = mockScanPage;
      
      // Mock showNotification to prevent console output
      (extractor as any).showNotification = vi.fn();
    });

    it('should return correct initial state', () => {
      const state = extractor.getState();
      
      expect(state.isInitialized).toBe(true);
      expect(state.isActive).toBe(false);
      expect(state.contactCount).toBe(0);
      expect(state.hasSession).toBe(false);
      expect(state.sessionAge).toBeNull();
    });

    it('should update state when activated', async () => {
      await extractor.activate();
      
      const state = extractor.getState();
      expect(state.isActive).toBe(true);
    });

    it('should update state when deactivated', async () => {
      await extractor.activate();
      extractor.deactivate();
      
      const state = extractor.getState();
      expect(state.isActive).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      extractor.init();
      
      // Mock the DOM scanner to return some test contacts to prevent auto-deactivation
      const mockContacts = [{
        name: 'Test User',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        source: 'https://example.com',
        timestamp: new Date()
      }];
      const mockScanPage = vi.fn().mockReturnValue(mockContacts);
      (extractor as any).domScanner.scanPage = mockScanPage;
      
      // Mock showNotification to prevent console output
      (extractor as any).showNotification = vi.fn();
    });

    it('should handle Ctrl+Shift+E activation shortcut', async () => {
      // Test that the keyboard shortcut toggles the extractor state
      const initialState = extractor.getState();
      expect(initialState.isActive).toBe(false);

      // Create a more realistic event that can be prevented
      const event = new KeyboardEvent('keydown', {
        ctrlKey: true,
        shiftKey: true,
        key: 'e',
        bubbles: true,
        cancelable: true
      });

      // Dispatch the event
      document.dispatchEvent(event);

      // Wait for async activation to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if the state changed (indicating the shortcut worked)
      const newState = extractor.getState();
      expect(newState.isActive).toBe(true);
    });

    it('should handle Escape key when active', async () => {
      await extractor.activate();
      
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });

      let preventDefaultCalled = false;
      const originalPreventDefault = event.preventDefault;
      event.preventDefault = () => {
        preventDefaultCalled = true;
        originalPreventDefault.call(event);
      };

      document.dispatchEvent(event);

      expect(preventDefaultCalled).toBe(true);
      
      const state = extractor.getState();
      expect(state.isActive).toBe(false);
    });

    it('should handle help shortcut Ctrl+Shift+H', () => {
      // Mock the showKeyboardShortcutsHelp method instead of console.log
      const helpSpy = vi.spyOn(extractor as any, 'showKeyboardShortcutsHelp').mockImplementation(() => {});
      
      const event = new KeyboardEvent('keydown', {
        ctrlKey: true,
        shiftKey: true,
        key: 'h',
        bubbles: true,
        cancelable: true
      });

      document.dispatchEvent(event);

      expect(helpSpy).toHaveBeenCalled();
      helpSpy.mockRestore();
    });
  });

  describe('Activation Button', () => {
    beforeEach(() => {
      extractor.init();
      
      // Mock the DOM scanner to return some test contacts to prevent auto-deactivation
      const mockContacts = [{
        name: 'Test User',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        source: 'https://example.com',
        timestamp: new Date()
      }];
      const mockScanPage = vi.fn().mockReturnValue(mockContacts);
      (extractor as any).domScanner.scanPage = mockScanPage;
      
      // Mock showNotification to prevent console output
      (extractor as any).showNotification = vi.fn();
    });

    it('should create activation button with correct properties', () => {
      const button = document.getElementById('web-data-extractor-activation-btn');
      
      expect(button).toBeTruthy();
      expect(button?.innerHTML).toBe('📞');
      expect(button?.title).toContain('Ativar Extrator de Contatos');
      expect(button?.getAttribute('aria-label')).toBe('Ativar Extrator de Contatos');
    });

    it('should update button appearance when activated', async () => {
      const button = document.getElementById('web-data-extractor-activation-btn');
      
      await extractor.activate();
      
      expect(button?.innerHTML).toBe('⏹️');
      expect(button?.title).toContain('Desativar Extrator de Contatos');
    });

    it('should handle button click', async () => {
      const button = document.getElementById('web-data-extractor-activation-btn');
      
      // Simulate click
      button?.click();
      
      // Wait for async activation
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const state = extractor.getState();
      expect(state.isActive).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        highlightElements: false,
        maxContacts: 50,
        minConfidence: 0.8
      };

      const customExtractor = new WebDataExtractor(customConfig);
      customExtractor.init();

      // Configuration is private, but we can test behavior
      expect(() => customExtractor.init()).not.toThrow();
      
      customExtractor.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Mock document.addEventListener to throw
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => extractor.init()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      document.addEventListener = originalAddEventListener;
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should clean up properly when destroyed', () => {
      extractor.init();
      
      const button = document.getElementById('web-data-extractor-activation-btn');
      expect(button).toBeTruthy();
      
      extractor.destroy();
      
      const buttonAfterDestroy = document.getElementById('web-data-extractor-activation-btn');
      expect(buttonAfterDestroy).toBeNull();
      
      const state = extractor.getState();
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('External API', () => {
    beforeEach(() => {
      extractor.init();
      
      // Mock the DOM scanner to return some test contacts to prevent auto-deactivation
      const mockContacts = [{
        name: 'Test User',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        source: 'https://example.com',
        timestamp: new Date()
      }];
      const mockScanPage = vi.fn().mockReturnValue(mockContacts);
      (extractor as any).domScanner.scanPage = mockScanPage;
      
      // Mock showNotification to prevent console output
      (extractor as any).showNotification = vi.fn();
    });

    it('should provide external activation method', async () => {
      await extractor.activate();
      
      const state = extractor.getState();
      expect(state.isActive).toBe(true);
    });

    it('should provide external deactivation method', async () => {
      await extractor.activate();
      extractor.deactivate();
      
      const state = extractor.getState();
      expect(state.isActive).toBe(false);
    });

    it('should provide contacts getter', () => {
      const contacts = extractor.getContacts();
      expect(Array.isArray(contacts)).toBe(true);
    });

    it('should handle CSV export with no contacts', () => {
      expect(() => extractor.exportCSV()).toThrow('Nenhum contato para exportar');
    });
  });
});