import { Component } from '@angular/core';

@Component({
  selector: 'app-sessions-list',
  template: `
    <div class="sessions-container">
      <div class="header">
        <h1>Planning Poker Sessions</h1>
        <div class="header-actions">
          <button mat-raised-button color="accent" routerLink="/sessions/join">
            <mat-icon>login</mat-icon>
            Join Session
          </button>
          <button mat-raised-button color="primary" routerLink="/sessions/create">
            <mat-icon>add</mat-icon>
            Create Session
          </button>
        </div>
      </div>
      
      <div class="welcome-section">
        <mat-card class="welcome-card">
          <mat-card-header>
            <mat-card-title>Welcome to Planning Poker</mat-card-title>
            <mat-card-subtitle>Estimate story points with your team</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Get started by creating a new planning session or joining an existing one with a session code.</p>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/sessions/create">
                <mat-icon>add</mat-icon>
                Create New Session
              </button>
              <button mat-raised-button color="accent" routerLink="/sessions/join">
                <mat-icon>login</mat-icon>
                Join Existing Session
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .sessions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
    
    .welcome-section {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }
    
    .welcome-card {
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    
    .action-buttons button {
      min-width: 200px;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
      
      .header-actions {
        width: 100%;
        justify-content: center;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .action-buttons button {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class SessionsListComponent {
}