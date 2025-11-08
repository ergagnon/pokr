import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,
    NotificationComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>casino</mat-icon>
      <span style="margin-left: 8px;">Pokr - Planning Poker</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/sessions">
        <mat-icon>list</mat-icon>
        Sessions
      </button>
    </mat-toolbar>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Global components -->
    <app-notification></app-notification>
    <app-loading-spinner></app-loading-spinner>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    
    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }
  `]
})
export class AppComponent {
  title = 'pokr-frontend';
}