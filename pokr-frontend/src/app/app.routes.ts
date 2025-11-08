import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/sessions',
    pathMatch: 'full'
  },
  {
    path: 'sessions',
    loadChildren: () => import('./features/sessions/sessions.module').then(m => m.SessionsModule)
  },
  {
    path: 'session/:code/facilitator',
    loadChildren: () => import('./features/facilitator-dashboard/facilitator-dashboard.module').then(m => m.FacilitatorDashboardModule)
  },
  {
    path: 'session/:code/participant',
    loadChildren: () => import('./features/session-detail/session-detail.module').then(m => m.SessionDetailModule)
  },
  {
    path: 'session/:id',
    redirectTo: '/sessions'
  },
  {
    path: '**',
    redirectTo: '/sessions'
  }
];