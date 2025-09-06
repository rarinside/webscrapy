import { NotificationManager } from './NotificationManager.js';
import { ERROR_MESSAGES } from '../utilities/constants.js';

/**
 * Error types for categorizing different kinds of errors
 */
export enum ErrorType {
  DOM_ACCESS = 'DOM_ACCESS',
  PATTERN_MATCHING = 'PATTERN_MATCHING',
  DATA_STORAGE = 'DATA_STORAGE',
  UI_RENDERING = 'UI_RENDERING',
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY',
  VALIDATION = 'VALIDATION',
  UNEXPECTED = 'UNEXPECTED'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Error information interface
 */
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  url: string;
}

/**
 * Error recovery action interface
 */
export interface ErrorRecoveryAction {
  label: string;
  action: () => void;
}

/**
 * Comprehensive error handling system with logging, user notifications,
 * and recovery suggestions
 */
export class ErrorHandler {
  private notificationManager: NotificationManager;
  private errorLog: ErrorInfo[] = [];
  private maxLogSize: number = 100;
  private isDebugMode: boolean = false;

  constructor(notificationManager: NotificationManager, debugMode: boolean = false) {
    this.notificationManager = notificationManager;
    this.isDebugMode = debugMode;
    this.setupGlobalErrorHandlers();
  }

  /**
   * Sets up global error handlers for unhandled errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        ErrorType.UNEXPECTED,
        ErrorSeverity.HIGH,
        'Erro JavaScript não tratado',
        event.error,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        ErrorType.UNEXPECTED,
        ErrorSeverity.HIGH,
        'Promise rejeitada não tratada',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          reason: event.reason
        }
      );
    });
  }

  /**
   * Main error handling method
   */
  public handleError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    originalError?: Error,
    context?: Record<string, any>,
    recoveryActions?: ErrorRecoveryAction[]
  ): void {
    const errorInfo: ErrorInfo = {
      type,
      severity,
      message,
      originalError,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log the error
    this.logError(errorInfo);

    // Show user notification based on severity
    this.showUserNotification(errorInfo, recoveryActions);

    // Log to console in debug mode
    if (this.isDebugMode) {
      this.logToConsole(errorInfo);
    }
  }

  /**
   * Logs error to internal error log
   */
  private logError(errorInfo: ErrorInfo): void {
    this.errorLog.push(errorInfo);

    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Store in localStorage for debugging (only in debug mode)
    if (this.isDebugMode) {
      try {
        const logData = JSON.stringify(this.errorLog.slice(-10), null, 2);
        localStorage.setItem('web-data-extractor-error-log', logData);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Shows user notification based on error severity
   */
  private showUserNotification(errorInfo: ErrorInfo, recoveryActions?: ErrorRecoveryAction[]): void {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    const notificationType = this.getNotificationType(errorInfo.severity);
    const duration = this.getNotificationDuration(errorInfo.severity);

    // Show the notification
    const notificationId = this.notificationManager.show(userMessage, notificationType, duration);

    // If there are recovery actions, we could extend the notification system
    // to support action buttons (for future enhancement)
    if (recoveryActions && recoveryActions.length > 0) {
      // For now, just log the available actions
      console.log('Recovery actions available:', recoveryActions.map(a => a.label));
    }
  }

  /**
   * Gets user-friendly error message
   */
  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    const baseMessage = this.getBaseErrorMessage(errorInfo.type);
    const suggestion = this.getRecoverySuggestion(errorInfo.type);
    
    return suggestion ? `${baseMessage}. ${suggestion}` : baseMessage;
  }

  /**
   * Gets base error message for error type
   */
  private getBaseErrorMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.DOM_ACCESS:
        return ERROR_MESSAGES.DOM_ACCESS_ERROR;
      case ErrorType.PATTERN_MATCHING:
        return ERROR_MESSAGES.PATTERN_MATCHING_ERROR;
      case ErrorType.DATA_STORAGE:
        return ERROR_MESSAGES.DATA_STORAGE_ERROR;
      case ErrorType.UI_RENDERING:
        return ERROR_MESSAGES.UI_RENDERING_ERROR;
      case ErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case ErrorType.PERMISSION:
        return ERROR_MESSAGES.PERMISSION_ERROR;
      case ErrorType.BROWSER_COMPATIBILITY:
        return ERROR_MESSAGES.BROWSER_COMPATIBILITY_ERROR;
      case ErrorType.VALIDATION:
        return 'Dados inválidos detectados';
      case ErrorType.UNEXPECTED:
      default:
        return ERROR_MESSAGES.UNEXPECTED_ERROR;
    }
  }

  /**
   * Gets recovery suggestion for error type
   */
  private getRecoverySuggestion(type: ErrorType): string {
    switch (type) {
      case ErrorType.DOM_ACCESS:
        return 'Tente recarregar a página ou aguarde o carregamento completo';
      case ErrorType.PATTERN_MATCHING:
        return 'Verifique se a página contém dados de contato válidos';
      case ErrorType.DATA_STORAGE:
        return 'Verifique se há espaço disponível no navegador';
      case ErrorType.UI_RENDERING:
        return 'Tente fechar e reabrir a ferramenta';
      case ErrorType.NETWORK:
        return 'Verifique sua conexão com a internet';
      case ErrorType.PERMISSION:
        return 'Permita o acesso necessário no navegador';
      case ErrorType.BROWSER_COMPATIBILITY:
        return 'Use um navegador mais recente (Chrome, Firefox, Safari, Edge)';
      case ErrorType.VALIDATION:
        return 'Corrija os dados destacados em vermelho';
      case ErrorType.UNEXPECTED:
      default:
        return 'Tente recarregar a página. Se o problema persistir, contate o suporte';
    }
  }

  /**
   * Gets notification type based on severity
   */
  private getNotificationType(severity: ErrorSeverity): 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  /**
   * Gets notification duration based on severity
   */
  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 0; // Don't auto-dismiss critical errors
      case ErrorSeverity.HIGH:
        return 10000; // 10 seconds
      case ErrorSeverity.MEDIUM:
        return 7000; // 7 seconds
      case ErrorSeverity.LOW:
      default:
        return 5000; // 5 seconds
    }
  }

  /**
   * Logs error to console for debugging
   */
  private logToConsole(errorInfo: ErrorInfo): void {
    const logLevel = this.getConsoleLogLevel(errorInfo.severity);
    const logMessage = `[Web Data Extractor] ${errorInfo.type}: ${errorInfo.message}`;
    
    console[logLevel](logMessage, {
      error: errorInfo.originalError,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp,
      url: errorInfo.url
    });
  }

  /**
   * Gets console log level based on severity
   */
  private getConsoleLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  /**
   * Wraps a function with error handling
   */
  public wrapWithErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    errorType: ErrorType,
    errorMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch((error: Error) => {
            this.handleError(errorType, severity, errorMessage, error, { args });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.handleError(errorType, severity, errorMessage, error as Error, { args });
        throw error;
      }
    }) as T;
  }

  /**
   * Wraps an async function with error handling
   */
  public wrapAsyncWithErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorType: ErrorType,
    errorMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(errorType, severity, errorMessage, error as Error, { args });
        throw error;
      }
    }) as T;
  }

  /**
   * Creates a safe version of a function that doesn't throw
   */
  public createSafeFunction<T extends (...args: any[]) => any>(
    fn: T,
    errorType: ErrorType,
    errorMessage: string,
    defaultReturn?: ReturnType<T>,
    severity: ErrorSeverity = ErrorSeverity.LOW
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(errorType, severity, errorMessage, error as Error, { args });
        return defaultReturn;
      }
    }) as T;
  }

  /**
   * Gets the error log for debugging
   */
  public getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Clears the error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
    if (this.isDebugMode) {
      try {
        localStorage.removeItem('web-data-extractor-error-log');
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Exports error log as JSON string
   */
  public exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Checks browser compatibility
   */
  public checkBrowserCompatibility(): boolean {
    const requiredFeatures = [
      'localStorage' in window,
      'JSON' in window,
      'addEventListener' in window,
      'querySelector' in document,
      'createElement' in document,
      'Blob' in window,
      'URL' in window && 'createObjectURL' in URL
    ];

    const missingFeatures = requiredFeatures.filter(feature => !feature);
    
    if (missingFeatures.length > 0) {
      this.handleError(
        ErrorType.BROWSER_COMPATIBILITY,
        ErrorSeverity.CRITICAL,
        'Navegador não suporta recursos necessários',
        undefined,
        { missingFeatures: missingFeatures.length }
      );
      return false;
    }

    return true;
  }

  /**
   * Enables or disables debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  /**
   * Gets current debug mode status
   */
  public isDebugModeEnabled(): boolean {
    return this.isDebugMode;
  }
}