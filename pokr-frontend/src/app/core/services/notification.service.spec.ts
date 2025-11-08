import { TestBed } from '@angular/core/testing';
import { NotificationService, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit success notification', (done) => {
    const message = 'Success!';
    
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.message).toBe(message);
      expect(notification.type).toBe('success');
      expect(notification.duration).toBe(3000);
      done();
    });

    service.showSuccess(message);
  });

  it('should emit error notification', (done) => {
    const message = 'Error!';
    
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.message).toBe(message);
      expect(notification.type).toBe('error');
      expect(notification.duration).toBe(5000);
      done();
    });

    service.showError(message);
  });

  it('should emit info notification', (done) => {
    const message = 'Info!';
    
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.message).toBe(message);
      expect(notification.type).toBe('info');
      expect(notification.duration).toBe(3000);
      done();
    });

    service.showInfo(message);
  });
});
