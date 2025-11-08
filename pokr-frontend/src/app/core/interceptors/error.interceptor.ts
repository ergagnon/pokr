import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * HTTP interceptor that handles errors from API requests
 * and displays user-friendly error messages
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else {
        // Backend returned an unsuccessful response code
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.Message) {
          // Handle both camelCase and PascalCase
          errorMessage = error.error.Message;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = 'Invalid request. Please check your input.';
              break;
            case 401:
              errorMessage = 'You are not authorized to perform this action.';
              break;
            case 403:
              errorMessage = 'Access forbidden.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 409:
              errorMessage = 'A conflict occurred. The resource may already exist.';
              break;
            case 500:
              errorMessage = 'A server error occurred. Please try again later.';
              break;
            case 503:
              errorMessage = 'The service is temporarily unavailable. Please try again later.';
              break;
            default:
              errorMessage = `Error: ${error.statusText || 'Unknown error'}`;
          }
        }
      }

      // Display error notification to user
      notificationService.showError(errorMessage);

      // Re-throw the error so components can handle it if needed
      return throwError(() => error);
    })
  );
};
