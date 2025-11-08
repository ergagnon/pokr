import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

interface DisplayNotification extends Notification {
  id: number;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (notification of notifications; track notification.id) {
        <div 
          class="notification notification-{{ notification.type }}"
          [@slideIn]>
          <div class="notification-content">
            <span class="notification-icon">
              @switch (notification.type) {
                @case ('success') { ✓ }
                @case ('error') { ✕ }
                @case ('warning') { ⚠ }
                @case ('info') { ℹ }
              }
            </span>
            <span class="notification-message">{{ notification.message }}</span>
          </div>
          <button 
            class="notification-close" 
            (click)="dismiss(notification.id)"
            aria-label="Close notification">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .notification-icon {
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .notification-message {
      font-size: 14px;
      line-height: 1.4;
      color: #333;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      color: #666;
      padding: 0;
      margin-left: 12px;
      flex-shrink: 0;
    }

    .notification-close:hover {
      color: #333;
    }

    .notification-success {
      border-left: 4px solid #4caf50;
    }

    .notification-success .notification-icon {
      color: #4caf50;
    }

    .notification-error {
      border-left: 4px solid #f44336;
    }

    .notification-error .notification-icon {
      color: #f44336;
    }

    .notification-warning {
      border-left: 4px solid #ff9800;
    }

    .notification-warning .notification-icon {
      color: #ff9800;
    }

    .notification-info {
      border-left: 4px solid #2196f3;
    }

    .notification-info .notification-icon {
      color: #2196f3;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: DisplayNotification[] = [];
  private subscription?: Subscription;
  private nextId = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      (notification) => {
        this.show(notification);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private show(notification: Notification): void {
    const id = this.nextId++;
    const displayNotification: DisplayNotification = { ...notification, id };
    
    this.notifications.push(displayNotification);

    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }
  }

  dismiss(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}
