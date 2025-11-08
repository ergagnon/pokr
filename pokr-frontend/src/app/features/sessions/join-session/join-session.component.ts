import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../shared/services/session.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-join-session',
  template: `
    <div class="join-session-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Join Planning Session</mat-card-title>
          <mat-card-subtitle>Enter the session code to join an existing session</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="joinForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Session Code</mat-label>
              <input matInput formControlName="sessionCode" 
                     placeholder="Enter 6-character session code"
                     [disabled]="isLoading"
                     (input)="onSessionCodeChange($event)"
                     maxlength="6"
                     style="text-transform: uppercase;">
              <mat-hint>Session codes are 6 characters long</mat-hint>
              <mat-error *ngIf="joinForm.get('sessionCode')?.hasError('required')">
                Session code is required
              </mat-error>
              <mat-error *ngIf="joinForm.get('sessionCode')?.hasError('minlength')">
                Session code must be 6 characters
              </mat-error>
              <mat-error *ngIf="joinForm.get('sessionCode')?.hasError('maxlength')">
                Session code must be 6 characters
              </mat-error>
              <mat-error *ngIf="joinForm.get('sessionCode')?.hasError('pattern')">
                Session code can only contain letters and numbers
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Name</mat-label>
              <input matInput formControlName="participantName" 
                     placeholder="Enter your name"
                     [disabled]="isLoading">
              <mat-error *ngIf="joinForm.get('participantName')?.hasError('required')">
                Your name is required
              </mat-error>
              <mat-error *ngIf="joinForm.get('participantName')?.hasError('minlength')">
                Name must be at least 2 characters
              </mat-error>
              <mat-error *ngIf="joinForm.get('participantName')?.hasError('maxlength')">
                Name cannot exceed 50 characters
              </mat-error>
            </mat-form-field>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-button routerLink="/sessions" [disabled]="isLoading">
            Cancel
          </button>
          <button mat-raised-button color="primary" 
                  [disabled]="joinForm.invalid || isLoading"
                  (click)="onSubmit()">
            <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
            <span *ngIf="!isLoading">Join Session</span>
            <span *ngIf="isLoading">Joining...</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .join-session-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
    }
    
    mat-card-header {
      margin-bottom: 16px;
    }
    
    mat-spinner {
      margin-right: 8px;
    }
    
    button[mat-raised-button] {
      display: flex;
      align-items: center;
    }
  `]
})
export class JoinSessionComponent {
  joinForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {
    this.joinForm = this.fb.group({
      sessionCode: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      participantName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]]
    });
  }

  onSessionCodeChange(event: any) {
    // Convert to uppercase as user types
    const value = event.target.value.toUpperCase();
    this.joinForm.patchValue({ sessionCode: value });
  }

  onSubmit() {
    if (this.joinForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.loadingService.show();
      
      const { sessionCode, participantName } = this.joinForm.value;
      
      this.sessionService.joinSession(sessionCode, participantName)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.loadingService.hide();
          })
        )
        .subscribe({
          next: (participantInfo) => {
            this.notificationService.showSuccess(
              `Successfully joined session "${participantInfo.sessionName}"!`
            );
            // Store participant name in session storage for this session
            sessionStorage.setItem(`participant_${sessionCode}`, participantName);
            // Navigate to participant view
            this.router.navigate(['/session', sessionCode, 'participant']);
          },
          error: (error) => {
            console.error('Error joining session:', error);
            let errorMessage = 'Failed to join session. Please try again.';
            
            if (error.status === 404) {
              errorMessage = 'Session not found. Please check the session code.';
            } else if (error.status === 409) {
              errorMessage = 'A participant with this name already exists in the session.';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            this.notificationService.showError(errorMessage);
          }
        });
    }
  }
}