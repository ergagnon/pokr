import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Service for managing global loading state
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable().pipe(
    distinctUntilChanged(),
    debounceTime(100) // Only show spinner if loading takes more than 100ms
  );

  /**
   * Increment the active requests counter and show loading indicator
   */
  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Decrement the active requests counter and hide loading indicator when no requests are active
   */
  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get the current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Force reset the loading state (useful for error recovery)
   */
  reset(): void {
    this.activeRequests = 0;
    this.loadingSubject.next(false);
  }
}
