import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler, ErrorType, ErrorSeverity } from '../classes/ErrorHandler.js';
import { NotificationManager } from '../classes/NotificationManager.js';

// Mock NotificationManager
vi.mock('../classes/NotificationManager.js', () => ({
  NotificationManager: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    showNotification: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockNotificationManager: NotificationManager;

  beforeEach(() => {
    mockNotificationManager = new NotificationManager();
    errorHandler = new ErrorHandler(mockNotificationManager, true); // Enable debug mode for tests
  });

  afterEach(() => {
    errorHandler.clearErrorLog();
    vi.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle basic errors correctly', () => {
      const testError = new Error('Test error');
      
      errorHandler.handleError(
        ErrorType.DOM_ACCESS,
        ErrorSeverity.MEDIUM,
        'Test error message',
        testError
      );

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.DOM_ACCESS);
      expect(errorLog[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorLog[0].message).toBe('Test error message');
      expect(errorLog[0].originalError).toBe(testError);
    });

    it('should show user notifications based on severity', () => {
      errorHandler.handleError(
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH,
        'High severity error'
      );

      expect(mockNotificationManager.show).toHaveBeenCalledWith(
        expect.stringContaining('Dados inválidos detectados'),
        'error',
        10000
      );
    });

    it('should handle different error types with appropriate messages', () => {
      const errorTypes = [
        { type: ErrorType.DOM_ACCESS, expectedMessage: 'Erro ao acessar elementos da página' },
        { type: ErrorType.PATTERN_MATCHING, expectedMessage: 'Erro ao processar padrões de texto' },
        { type: ErrorType.DATA_STORAGE, expectedMessage: 'Erro ao armazenar dados' },
        { type: ErrorType.NETWORK, expectedMessage: 'Erro de conexão de rede' }
      ];

      errorTypes.forEach(({ type, expectedMessage }) => {
        vi.clearAllMocks();
        errorHandler.handleError(type, ErrorSeverity.MEDIUM, 'Test message');
        
        expect(mockNotificationManager.show).toHaveBeenCalledWith(
          expect.stringContaining(expectedMessage),
          'warning',
          7000
        );
      });
    });

    it('should maintain error log with size limit', () => {
      // Add more errors than the limit (100)
      for (let i = 0; i < 105; i++) {
        errorHandler.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          `Error ${i}`
        );
      }

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(100); // Should be limited to 100
      expect(errorLog[0].message).toBe('Error 5'); // First 5 should be removed
    });
  });

  describe('Error Wrapping Functions', () => {
    it('should wrap functions with error handling', () => {
      const testFunction = vi.fn(() => {
        throw new Error('Test function error');
      });

      const wrappedFunction = errorHandler.wrapWithErrorHandling(
        testFunction,
        ErrorType.VALIDATION,
        'Wrapped function error',
        ErrorSeverity.LOW
      );

      expect(() => wrappedFunction()).toThrow('Test function error');
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].message).toBe('Wrapped function error');
    });

    it('should wrap async functions with error handling', async () => {
      const testAsyncFunction = vi.fn(async () => {
        throw new Error('Async test error');
      });

      const wrappedFunction = errorHandler.wrapAsyncWithErrorHandling(
        testAsyncFunction,
        ErrorType.NETWORK,
        'Wrapped async error',
        ErrorSeverity.MEDIUM
      );

      await expect(wrappedFunction()).rejects.toThrow('Async test error');
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].message).toBe('Wrapped async error');
    });

    it('should create safe functions that don\'t throw', () => {
      const testFunction = vi.fn(() => {
        throw new Error('Test function error');
      });

      const safeFunction = errorHandler.createSafeFunction(
        testFunction,
        ErrorType.VALIDATION,
        'Safe function error',
        'default value',
        ErrorSeverity.LOW
      );

      const result = safeFunction();
      expect(result).toBe('default value');
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].message).toBe('Safe function error');
    });
  });

  describe('Browser Compatibility', () => {
    it('should check browser compatibility', () => {
      // Mock required browser features
      const originalLocalStorage = global.localStorage;
      const originalJSON = global.JSON;
      
      // Test with missing features
      delete (global as any).localStorage;
      delete (global as any).JSON;

      const isCompatible = errorHandler.checkBrowserCompatibility();
      expect(isCompatible).toBe(false);
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.some(error => error.type === ErrorType.BROWSER_COMPATIBILITY)).toBe(true);

      // Restore features
      global.localStorage = originalLocalStorage;
      global.JSON = originalJSON;
    });
  });

  describe('Error Log Management', () => {
    it('should export error log as JSON', () => {
      errorHandler.handleError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'Test error for export'
      );

      const exportedLog = errorHandler.exportErrorLog();
      const parsedLog = JSON.parse(exportedLog);
      
      expect(Array.isArray(parsedLog)).toBe(true);
      expect(parsedLog).toHaveLength(1);
      expect(parsedLog[0].message).toBe('Test error for export');
    });

    it('should clear error log', () => {
      errorHandler.handleError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'Test error'
      );

      expect(errorHandler.getErrorLog()).toHaveLength(1);
      
      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('Debug Mode', () => {
    it('should enable and disable debug mode', () => {
      expect(errorHandler.isDebugModeEnabled()).toBe(true);
      
      errorHandler.setDebugMode(false);
      expect(errorHandler.isDebugModeEnabled()).toBe(false);
      
      errorHandler.setDebugMode(true);
      expect(errorHandler.isDebugModeEnabled()).toBe(true);
    });
  });

  describe('Global Error Handlers', () => {
    it('should handle global JavaScript errors', async () => {
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        filename: 'test.js',
        lineno: 10,
        colno: 5
      });

      window.dispatchEvent(errorEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.some(error => 
        error.type === ErrorType.UNEXPECTED && 
        error.message === 'Erro JavaScript não tratado'
      )).toBe(true);
    });

    it('should handle unhandled promise rejections', async () => {
      // Create a custom event since PromiseRejectionEvent might not be available in test environment
      const rejectionEvent = new CustomEvent('unhandledrejection', {
        detail: {
          promise: Promise.reject(new Error('Promise rejection')),
          reason: new Error('Promise rejection')
        }
      });

      // Mock the event properties
      Object.defineProperty(rejectionEvent, 'promise', {
        value: Promise.reject(new Error('Promise rejection'))
      });
      Object.defineProperty(rejectionEvent, 'reason', {
        value: new Error('Promise rejection')
      });

      window.dispatchEvent(rejectionEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.some(error => 
        error.type === ErrorType.UNEXPECTED && 
        error.message === 'Promise rejeitada não tratada'
      )).toBe(true);
    });
  });
});