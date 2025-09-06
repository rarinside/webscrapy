import { NotificationMessage } from '../types/interfaces.js';

/**
 * NotificationManager handles toast notifications with different message types,
 * positioning that doesn't conflict with page content, and auto-dismiss functionality
 */
export class NotificationManager {
  private container: HTMLElement | null = null;
  private notifications: Map<string, HTMLElement> = new Map();
  private notificationCounter: number = 0;

  constructor() {
    this.createNotificationContainer();
  }

  /**
   * Creates the notification container with proper positioning
   */
  private createNotificationContainer(): void {
    // Remove existing container if it exists
    const existingContainer = document.getElementById('web-data-extractor-notifications');
    if (existingContainer) {
      existingContainer.remove();
    }

    this.container = document.createElement('div');
    this.container.id = 'web-data-extractor-notifications';
    this.container.className = 'web-data-extractor-notifications-container';
    
    // Position the container to avoid conflicts with page content
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
      max-width: 400px;
      width: auto;
    `;

    document.body.appendChild(this.container);
  }

  /**
   * Shows a notification with the specified message and type
   */
  public show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number): string {
    const notification: NotificationMessage = {
      message,
      type,
      duration: duration || this.getDefaultDuration(type)
    };

    return this.showNotification(notification);
  }

  /**
   * Shows a notification using the NotificationMessage interface
   */
  public showNotification(notification: NotificationMessage): string {
    if (!this.container) {
      this.createNotificationContainer();
    }

    const notificationId = `notification-${++this.notificationCounter}`;
    const notificationElement = this.createNotificationElement(notification, notificationId);
    
    this.notifications.set(notificationId, notificationElement);
    this.container!.appendChild(notificationElement);

    // Trigger animation
    requestAnimationFrame(() => {
      notificationElement.classList.add('web-data-extractor-notification-show');
    });

    // Auto-dismiss if duration is specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notificationId);
      }, notification.duration);
    }

    return notificationId;
  }

  /**
   * Creates a notification element
   */
  private createNotificationElement(notification: NotificationMessage, id: string): HTMLElement {
    const element = document.createElement('div');
    element.id = id;
    element.className = `web-data-extractor-notification web-data-extractor-notification-${notification.type}`;
    element.style.cssText = `
      pointer-events: auto;
      margin-bottom: 10px;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      max-width: 100%;
      word-wrap: break-word;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease-in-out;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    `;

    // Set colors based on type
    const colors = this.getNotificationColors(notification.type);
    element.style.backgroundColor = colors.background;
    element.style.color = colors.text;
    element.style.borderLeft = `4px solid ${colors.border}`;

    // Add icon
    const icon = document.createElement('span');
    icon.className = 'web-data-extractor-notification-icon';
    icon.textContent = this.getNotificationIcon(notification.type);
    icon.style.cssText = `
      flex-shrink: 0;
      font-size: 16px;
      margin-top: 1px;
    `;

    // Add message
    const messageElement = document.createElement('span');
    messageElement.className = 'web-data-extractor-notification-message';
    messageElement.textContent = notification.message;
    messageElement.style.cssText = `
      flex: 1;
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'web-data-extractor-notification-close';
    closeButton.textContent = '×';
    closeButton.type = 'button';
    closeButton.title = 'Fechar notificação';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      margin-left: 8px;
      opacity: 0.7;
      flex-shrink: 0;
    `;

    closeButton.addEventListener('click', () => {
      this.dismiss(id);
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.7';
    });

    element.appendChild(icon);
    element.appendChild(messageElement);
    element.appendChild(closeButton);

    return element;
  }

  /**
   * Gets the default duration for a notification type
   */
  private getDefaultDuration(type: string): number {
    switch (type) {
      case 'error':
        return 8000; // Errors stay longer
      case 'warning':
        return 6000; // Warnings stay a bit longer
      case 'success':
        return 4000; // Success messages
      case 'info':
      default:
        return 5000; // Default duration
    }
  }

  /**
   * Gets colors for notification types
   */
  private getNotificationColors(type: string): { background: string; text: string; border: string } {
    switch (type) {
      case 'success':
        return {
          background: '#f0f9ff',
          text: '#0f766e',
          border: '#10b981'
        };
      case 'error':
        return {
          background: '#fef2f2',
          text: '#dc2626',
          border: '#ef4444'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          text: '#d97706',
          border: '#f59e0b'
        };
      case 'info':
      default:
        return {
          background: '#f0f9ff',
          text: '#0369a1',
          border: '#3b82f6'
        };
    }
  }

  /**
   * Gets icon for notification types
   */
  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  /**
   * Dismisses a notification by ID
   */
  public dismiss(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Animate out
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(notificationId);
    }, 300);
  }

  /**
   * Dismisses all notifications
   */
  public dismissAll(): void {
    const notificationIds = Array.from(this.notifications.keys());
    notificationIds.forEach(id => this.dismiss(id));
  }

  /**
   * Shows a success notification
   */
  public success(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  }

  /**
   * Shows an error notification
   */
  public error(message: string, duration?: number): string {
    return this.show(message, 'error', duration);
  }

  /**
   * Shows a warning notification
   */
  public warning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration);
  }

  /**
   * Shows an info notification
   */
  public info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  }

  /**
   * Destroys the notification manager and cleans up
   */
  public destroy(): void {
    this.dismissAll();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.notifications.clear();
  }
}

// Add CSS styles for notifications
const notificationStyles = `
.web-data-extractor-notification-show {
  transform: translateX(0) !important;
  opacity: 1 !important;
}

.web-data-extractor-notification:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
}

@media (max-width: 480px) {
  .web-data-extractor-notifications-container {
    left: 10px !important;
    right: 10px !important;
    top: 10px !important;
    max-width: none !important;
  }
  
  .web-data-extractor-notification {
    font-size: 13px !important;
    padding: 10px 12px !important;
  }
}
`;

// Inject styles if not already present
if (!document.getElementById('web-data-extractor-notification-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'web-data-extractor-notification-styles';
  styleElement.textContent = notificationStyles;
  document.head.appendChild(styleElement);
}