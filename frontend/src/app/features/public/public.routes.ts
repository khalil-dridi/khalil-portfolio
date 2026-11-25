import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layouts/public-layout/public-layout').then((module) => module.PublicLayout),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./home/home').then((module) => module.Home) },
      { path: 'about', loadComponent: () => import('./about/about').then((module) => module.About) },
      { path: 'career', loadComponent: () => import('./career/career').then((module) => module.Career) },
      { path: 'skills', pathMatch: 'full', redirectTo: 'career' },
      { path: 'projects', pathMatch: 'full', loadComponent: () => import('./projects/projects').then((module) => module.Projects) },
      { path: 'projects/:slug', loadComponent: () => import('./project-details/project-details').then((module) => module.ProjectDetails) },
      { path: 'contact', loadComponent: () => import('./contact/contact').then((module) => module.Contact) },
    ],
  },
];
