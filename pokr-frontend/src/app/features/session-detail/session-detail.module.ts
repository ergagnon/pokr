import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { SessionDetailComponent } from './session-detail.component';
import { VotingCardsComponent } from './components/voting-cards/voting-cards.component';
import { ParticipantViewComponent } from './components/participant-view/participant-view.component';

const routes: Routes = [
  {
    path: '',
    component: SessionDetailComponent
  }
];

@NgModule({
  declarations: [
    SessionDetailComponent,
    VotingCardsComponent,
    ParticipantViewComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ]
})
export class SessionDetailModule { }