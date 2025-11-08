import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP interceptor that tracks loading state for API requests
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Increment active requests counter
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Decrement active requests counter when request completes
      loadingService.hide();
    })
  );
};
