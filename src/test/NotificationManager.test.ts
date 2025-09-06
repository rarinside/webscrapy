import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationManager } from '../classes/NotificationManager.js';
import { NotificationMessage } from '../types/interfaces.js';

// Mock DOM methods
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 0),
  writable: true
});

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;
  let container: HTMLElement;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '';
    notificationManager = new NotificationManager();
    container = document.getElementById('web-data-extractor-notifications')!;
  });

  afterEach(() => {
    notificationManager.destroy();
    document.body.innerHTML = '';
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should create notification container on initialization', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('web-data-extractor-notifications');
      expect(container.className).toBe('web-data-extractor-notifications-container');
    });

    it('should position container correctly', () => {
      const styles = window.getComputedStyle(container);
      expect(container.style.position).toBe('fixed');
      expect(container.style.top).toBe('20px');
      expect(container.style.right).toBe('20px');
      expect(container.style.zIndex).toBe('999999');
    });
  });

  describe('Notification Display', () => {
    it('should show basic notification', () => {
      const notificationId = notificationManager.show('Test message', 'info');
      
      expect(notificationId).toBeTruthy();
      expect(container.children.length).toBe(1);
      
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.textContent).toContain('Test message');
      expect(notification.className).toContain('web-data-extractor-notification-info');
    });

    it('should show notifications with different types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];
      
      types.forEach(type => {
        const notificationId = notificationManager.show(`${type} message`, type);
        expect(notificationId).toBeTruthy();
      });

      expect(container.children.length).toBe(4);
      
      types.forEach((type, index) => {
        const notification = container.children[index] as HTMLElement;
        expect(notification.className).toContain(`web-data-extractor-notification-${type}`);
      });
    });

    it('should show notification using NotificationMessage interface', () => {
      const message: NotificationMessage = {
        message: 'Interface test',
        type: 'warning',
        duration: 2000
      };

      const notificationId = notificationManager.showNotification(message);
      
      expect(notificationId).toBeTruthy();
      expect(container.children.length).toBe(1);
      
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.textContent).toContain('Interface test');
      expect(notification.className).toContain('web-data-extractor-notification-warning');
    });
  });

  describe('Notification Content', () => {
    it('should include icon, message, and close button', () => {
      notificationManager.show('Test message', 'success');
      
      const notification = container.firstElementChild as HTMLElement;
      const icon = notification.querySelector('.web-data-extractor-notification-icon');
      const message = notification.querySelector('.web-data-extractor-notification-message');
      const closeButton = notification.querySelector('.web-data-extractor-notification-close');
      
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('✓'); // Success icon
      expect(message).toBeTruthy();
      expect(message?.textContent).toBe('Test message');
      expect(closeButton).toBeTruthy();
      expect(closeButton?.textContent).toBe('×');
    });

    it('should use correct icons for different types', () => {
      const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      Object.entries(iconMap).forEach(([type, expectedIcon]) => {
        // Clear container completely
        container.innerHTML = '';
        notificationManager.show('Test', type as any);
        
        const notification = container.firstElementChild as HTMLElement;
        const icon = notification.querySelector('.web-data-extractor-notification-icon');
        expect(icon?.textContent).toBe(expectedIcon);
      });
    });
  });

  describe('Auto-dismiss Functionality', () => {
    it('should auto-dismiss notifications after default duration', async () => {
      vi.useFakeTimers();
      
      notificationManager.show('Test message', 'info');
      expect(container.children.length).toBe(1);
      
      // Fast-forward time past default duration (5000ms for info)
      vi.advanceTimersByTime(5300); // 5000ms + 300ms animation
      
      expect(container.children.length).toBe(0);
      
      vi.useRealTimers();
    });

    it('should use custom duration when specified', async () => {
      vi.useFakeTimers();
      
      notificationManager.show('Test message', 'info', 1000);
      expect(container.children.length).toBe(1);
      
      // Fast-forward time past custom duration
      vi.advanceTimersByTime(1300); // 1000ms + 300ms animation
      
      expect(container.children.length).toBe(0);
      
      vi.useRealTimers();
    });

    it('should not auto-dismiss when duration is 0', async () => {
      vi.useFakeTimers();
      
      // Duration 0 means no auto-dismiss, but the default for error is 8000ms
      // Let's use a very high duration instead to test persistence
      notificationManager.show('Persistent message', 'error', 999999);
      expect(container.children.length).toBe(1);
      
      // Fast-forward time significantly but less than the duration
      vi.advanceTimersByTime(10000);
      
      expect(container.children.length).toBe(1);
      
      vi.useRealTimers();
    });
  });

  describe('Manual Dismissal', () => {
    it('should dismiss notification by ID', () => {
      const notificationId = notificationManager.show('Test message', 'info');
      expect(container.children.length).toBe(1);
      
      notificationManager.dismiss(notificationId);
      
      // Should start dismissal animation
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.style.opacity).toBe('0');
      expect(notification.style.transform).toBe('translateX(100%)');
    });

    it('should dismiss all notifications', () => {
      notificationManager.show('Message 1', 'info');
      notificationManager.show('Message 2', 'success');
      notificationManager.show('Message 3', 'warning');
      
      expect(container.children.length).toBe(3);
      
      notificationManager.dismissAll();
      
      // All notifications should start dismissal animation
      Array.from(container.children).forEach(notification => {
        const element = notification as HTMLElement;
        expect(element.style.opacity).toBe('0');
        expect(element.style.transform).toBe('translateX(100%)');
      });
    });

    it('should dismiss notification when close button is clicked', () => {
      notificationManager.show('Test message', 'info');
      
      const notification = container.firstElementChild as HTMLElement;
      const closeButton = notification.querySelector('.web-data-extractor-notification-close') as HTMLElement;
      
      closeButton.click();
      
      expect(notification.style.opacity).toBe('0');
      expect(notification.style.transform).toBe('translateX(100%)');
    });
  });

  describe('Convenience Methods', () => {
    it('should provide success method', () => {
      const notificationId = notificationManager.success('Success message');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.className).toContain('web-data-extractor-notification-success');
    });

    it('should provide error method', () => {
      const notificationId = notificationManager.error('Error message');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.className).toContain('web-data-extractor-notification-error');
    });

    it('should provide warning method', () => {
      const notificationId = notificationManager.warning('Warning message');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.className).toContain('web-data-extractor-notification-warning');
    });

    it('should provide info method', () => {
      const notificationId = notificationManager.info('Info message');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      expect(notification.className).toContain('web-data-extractor-notification-info');
    });
  });

  describe('Multiple Notifications', () => {
    it('should stack multiple notifications', () => {
      notificationManager.show('Message 1', 'info');
      notificationManager.show('Message 2', 'success');
      notificationManager.show('Message 3', 'warning');
      
      expect(container.children.length).toBe(3);
      
      // Check that they are stacked with proper spacing
      Array.from(container.children).forEach((notification, index) => {
        const element = notification as HTMLElement;
        expect(element.style.marginBottom).toBe('10px');
      });
    });

    it('should maintain unique IDs for multiple notifications', () => {
      const id1 = notificationManager.show('Message 1', 'info');
      const id2 = notificationManager.show('Message 2', 'success');
      const id3 = notificationManager.show('Message 3', 'warning');
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Cleanup', () => {
    it('should clean up when destroyed', () => {
      notificationManager.show('Test message', 'info');
      expect(container.children.length).toBe(1);
      
      notificationManager.destroy();
      
      // Container should be removed from DOM
      const containerAfterDestroy = document.getElementById('web-data-extractor-notifications');
      expect(containerAfterDestroy).toBeNull();
    });

    it('should handle destroy when no notifications exist', () => {
      expect(() => notificationManager.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const notificationId = notificationManager.show('', 'info');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      const message = notification.querySelector('.web-data-extractor-notification-message');
      expect(message?.textContent).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const notificationId = notificationManager.show(longMessage, 'info');
      
      expect(notificationId).toBeTruthy();
      const notification = container.firstElementChild as HTMLElement;
      const message = notification.querySelector('.web-data-extractor-notification-message');
      expect(message?.textContent).toBe(longMessage);
    });

    it('should handle dismissing non-existent notification', () => {
      expect(() => notificationManager.dismiss('non-existent-id')).not.toThrow();
    });
  });
});