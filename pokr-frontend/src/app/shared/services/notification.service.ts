import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationConfig extends MatSnackBarConfig {
  type?: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, { 
      type: 'success', 
      duration,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error notification
   */
  showError(message: string, duration: number = 5000): void {
    this.show(message, { 
      type: 'error', 
      duration,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, duration: number = 4000): void {
    this.show(message, { 
      type: 'warning', 
      duration,
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Show info notification
   */
  showInfo(message: string, duration: number = 3000): void {
    this.show(message, { 
      type: 'info', 
      duration,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Show generic notification
   */
  show(message: string, config?: NotificationConfig): void {
    const defaultConfig: MatSnackBarConfig = {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      ...config
    };

    this.snackBar.open(message, 'Close', defaultConfig);
  }

  /**
   * Dismiss all notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}