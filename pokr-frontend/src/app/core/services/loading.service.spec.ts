import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show loading when show() is called', (done) => {
    service.loading$.subscribe(isLoading => {
      if (isLoading) {
        expect(isLoading).toBe(true);
        done();
      }
    });

    service.show();
  });

  it('should hide loading when hide() is called after show()', (done) => {
    let callCount = 0;
    
    service.loading$.subscribe(isLoading => {
      callCount++;
      if (callCount === 2) {
        expect(isLoading).toBe(false);
        done();
      }
    });

    service.show();
    service.hide();
  });

  it('should handle multiple concurrent requests', () => {
    service.show();
    service.show();
    expect(service.isLoading()).toBe(true);

    service.hide();
    expect(service.isLoading()).toBe(true);

    service.hide();
    expect(service.isLoading()).toBe(false);
  });

  it('should reset loading state', () => {
    service.show();
    service.show();
    service.reset();
    expect(service.isLoading()).toBe(false);
  });
});
