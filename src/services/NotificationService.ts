import { AppNotification } from '../types/common';

export class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: AppNotification) => void)[] = [];
  private notifications: AppNotification[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public addNotification(notification: AppNotification): void {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    // Log to console for debugging
    console.log(`🔔 ${notification.type.toUpperCase()}: ${notification.title} - ${notification.message}`);
  }

  public onNotification(listener: (notification: AppNotification) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  public clearNotifications(): void {
    this.notifications = [];
  }

  public removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  // Helper methods for common notifications
  public success(title: string, message: string): void {
    this.addNotification({
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      timestamp: new Date(),
    });
  }

  public error(title: string, message: string): void {
    this.addNotification({
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      timestamp: new Date(),
    });
  }

  public warning(title: string, message: string): void {
    this.addNotification({
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      timestamp: new Date(),
    });
  }

  public info(title: string, message: string): void {
    this.addNotification({
      id: Date.now().toString(),
      type: 'info',
      title,
      message,
      timestamp: new Date(),
    });
  }
}