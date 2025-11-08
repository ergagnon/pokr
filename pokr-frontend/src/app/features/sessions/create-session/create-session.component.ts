import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../shared/services/session.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-create-session',
  template: `
    <div class="create-session-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create New Planning Session</mat-card-title>
          <mat-card-subtitle>Start a new story point estimation session</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Facilitator Name</mat-label>
              <input matInput formControlName="facilitatorName" 
                     placeholder="Your name" 
                     [disabled]="isLoading">
              <mat-error *ngIf="sessionForm.get('facilitatorName')?.hasError('required')">
                Facilitator name is required
              </mat-error>
              <mat-error *ngIf="sessionForm.get('facilitatorName')?.hasError('minlength')">
                Facilitator name must be at least 2 characters
              </mat-error>
              <mat-error *ngIf="sessionForm.get('facilitatorName')?.hasError('maxlength')">
                Facilitator name cannot exceed 50 characters
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Session Name</mat-label>
              <input matInput formControlName="sessionName" 
                     placeholder="Enter session name"
                     [disabled]="isLoading">
              <mat-error *ngIf="sessionForm.get('sessionName')?.hasError('required')">
                Session name is required
              </mat-error>
              <mat-error *ngIf="sessionForm.get('sessionName')?.hasError('minlength')">
                Session name must be at least 3 characters
              </mat-error>
              <mat-error *ngIf="sessionForm.get('sessionName')?.hasError('maxlength')">
                Session name cannot exceed 100 characters
              </mat-error>
            </mat-form-field>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-button routerLink="/sessions" [disabled]="isLoading">
            Cancel
          </button>
          <button mat-raised-button color="primary" 
                  [disabled]="sessionForm.invalid || isLoading"
                  (click)="onSubmit()">
            <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
            <span *ngIf="!isLoading">Create Session</span>
            <span *ngIf="isLoading">Creating...</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-session-container {
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
export class CreateSessionComponent {
  sessionForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {
    this.sessionForm = this.fb.group({
      facilitatorName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      sessionName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]]
    });
  }

  onSubmit() {
    if (this.sessionForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.loadingService.show();
      
      const { facilitatorName, sessionName } = this.sessionForm.value;
      
      this.sessionService.createSession(facilitatorName, sessionName)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.loadingService.hide();
          })
        )
        .subscribe({
          next: (session) => {
            this.notificationService.showSuccess(
              `Session "${session.name}" created successfully! Session code: ${session.code}`
            );
            // Navigate to facilitator dashboard
            this.router.navigate(['/session', session.code, 'facilitator']);
          },
          error: (error) => {
            console.error('Error creating session:', error);
            this.notificationService.showError(
              error.error?.message || 'Failed to create session. Please try again.'
            );
          }
        });
    }
  }
}