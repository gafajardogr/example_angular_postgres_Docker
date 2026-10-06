import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'access', loadComponent: () => import('./pages/access.component').then((module) => module.AccessComponent) },
  { path: 'generate-password', canActivate: [authGuard], loadComponent: () => import('./pages/password-generator.component').then((module) => module.PasswordGeneratorComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard.component').then((module) => module.DashboardComponent) },
  { path: '**', redirectTo: '' },
];
