import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-session-detail',
  template: `
    <div class="session-detail-container">
      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-card>
          <mat-card-content>
            <div class="loading-content">
              <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
              <p>Loading session...</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="errorMessage && !isLoading">
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon color="warn">error</mat-icon>
              <div>
                <h3>Unable to Load Session</h3>
                <p>{{ errorMessage }}</p>
                <button mat-raised-button color="primary" (click)="retry()">
                  Try Again
                </button>
                <button mat-button (click)="goHome()">
                  Go Home
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Participant Name Input -->
      <div class="participant-setup" *ngIf="!participantName && !isLoading && !errorMessage">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Join Session</mat-card-title>
            <mat-card-subtitle>Session: {{ sessionCode }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Name</mat-label>
              <input matInput 
                     [(ngModel)]="tempParticipantName" 
                     (keyup.enter)="setParticipantName()"
                     placeholder="Enter your name to join">
              <mat-error *ngIf="participantNameError">
                {{ participantNameError }}
              </mat-error>
            </mat-form-field>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-raised-button 
                    color="primary" 
                    (click)="setParticipantName()"
                    [disabled]="!tempParticipantName || !tempParticipantName.trim()">
              Join Session
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Main Participant View -->
      <app-participant-view 
        *ngIf="sessionCode && participantName && !isLoading && !errorMessage"
        [sessionCode]="sessionCode"
        [participantName]="participantName">
      </app-participant-view>
    </div>
  `,
  styles: [`
    .session-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }
    
    .loading-container,
    .error-container,
    .participant-setup {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      text-align: center;
    }
    
    .error-card {
      max-width: 500px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
    }
    
    .error-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      
      mat-icon {
        margin-top: 4px;
      }
      
      h3 {
        margin: 0 0 8px 0;
        color: #c62828;
      }
      
      p {
        margin: 0 0 16px 0;
        color: #666;
      }
      
      button {
        margin-right: 8px;
      }
    }
    
    .participant-setup {
      mat-card {
        max-width: 400px;
        width: 100%;
      }
      
      .full-width {
        width: 100%;
      }
    }
    
    @media (max-width: 768px) {
      .session-detail-container {
        padding: 8px;
      }
      
      .participant-setup mat-card {
        max-width: none;
        margin: 0 8px;
      }
    }
  `]
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sessionCode: string = '';
  participantName: string = '';
  tempParticipantName: string = '';
  participantNameError: string = '';
  
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get session code from route
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.sessionCode = params.get('code') || '';
        if (!this.sessionCode) {
          this.errorMessage = 'Invalid session code';
          this.isLoading = false;
          return;
        }
        
        // Check if participant name is stored (e.g., from previous join)
        const storedName = sessionStorage.getItem(`participant_${this.sessionCode}`);
        if (storedName) {
          this.participantName = storedName;
        }
        
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setParticipantName(): void {
    const name = this.tempParticipantName?.trim();
    if (!name) {
      this.participantNameError = 'Please enter your name';
      return;
    }

    if (name.length < 2) {
      this.participantNameError = 'Name must be at least 2 characters';
      return;
    }

    if (name.length > 50) {
      this.participantNameError = 'Name must be less than 50 characters';
      return;
    }

    // Store participant name for this session
    sessionStorage.setItem(`participant_${this.sessionCode}`, name);
    this.participantName = name;
    this.participantNameError = '';
  }

  retry(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // Trigger re-initialization
    this.ngOnInit();
  }

  goHome(): void {
    this.router.navigate(['/sessions']);
  }
}