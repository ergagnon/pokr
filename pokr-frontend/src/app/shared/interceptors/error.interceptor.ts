import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiErrorResponse } from '../models/session.models';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';
        let errorCode = 'UNKNOWN_ERROR';
        let validationErrors: { [key: string]: string[] } | undefined;

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
          errorCode = 'CLIENT_ERROR';
        } else {
          // Server-side error
          if (error.error && typeof error.error === 'object') {
            const apiError = error.error as ApiErrorResponse;
            errorMessage = apiError.message || this.getDefaultErrorMessage(error.status);
            errorCode = apiError.errorCode || this.getDefaultErrorCode(error.status);
            validationErrors = apiError.validationErrors;
          } else {
            errorMessage = this.getDefaultErrorMessage(error.status);
            errorCode = this.getDefaultErrorCode(error.status);
          }
        }

        // Log error for debugging
        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          errorCode,
          validationErrors,
          url: error.url
        });

        // Create standardized error response
        const standardizedError: ApiErrorResponse = {
          message: errorMessage,
          errorCode,
          validationErrors,
          timestamp: new Date()
        };

        return throwError(() => standardizedError);
      })
    );
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized access.';
      case 403:
        return 'Access forbidden.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict occurred. Resource may already exist.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  private getDefaultErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}