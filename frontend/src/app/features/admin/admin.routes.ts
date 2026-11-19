import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((module) => module.Login),
  },
  {
    path: '',
    loadComponent: () => import('../../layouts/admin-layout/admin-layout').then((module) => module.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./dashboard/dashboard').then((module) => module.Dashboard) },
      { path: 'profile', loadComponent: () => import('./profile/profile').then((module) => module.Profile) },
      { path: 'projects', loadComponent: () => import('./projects/projects').then((module) => module.AdminProjects) },
      { path: 'skills', loadComponent: () => import('./skills/skills').then((module) => module.AdminSkills) },
      { path: 'experiences', loadComponent: () => import('./experiences/experiences').then((module) => module.Experiences) },
      { path: 'education', loadComponent: () => import('./education/education').then((module) => module.Education) },
      { path: 'messages', loadComponent: () => import('./messages/messages').then((module) => module.Messages) },
    ],
  },
];
