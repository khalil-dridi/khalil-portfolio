import { Routes } from '@angular/router';
import { adminLoginGuard, authGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((module) => module.Login),
    canActivate: [adminLoginGuard],
  },
  {
    path: '',
    loadComponent: () => import('../../layouts/admin-layout/admin-layout').then((module) => module.AdminLayout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'career' },
      { path: 'profile', loadComponent: () => import('./profile/profile').then((module) => module.Profile) },
      { path: 'projects', loadComponent: () => import('./projects/projects').then((module) => module.AdminProjects) },
      { path: 'career', loadComponent: () => import('./career/career').then((module) => module.AdminCareer) },
      { path: 'skills', pathMatch: 'full', redirectTo: 'career' },
      { path: 'experiences', pathMatch: 'full', redirectTo: 'career' },
      { path: 'education', pathMatch: 'full', redirectTo: 'career' },
    ],
  },
];
