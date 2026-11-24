import { Routes } from '@angular/router';
import { of } from 'rxjs';
import { ProjectService } from './features/public/projects/data-access/project.service';

const pickerTestProject = { id: 999, title: 'Picker test', description: 'Temporary browser diagnostic', technologies: '', githubUrl: null, backgroundImageUrl: null, demoVideoUrl: null, createdAt: null, updatedAt: null };
const pickerTestApi = { getAdminProjects: () => of([pickerTestProject]), getAdminProject: () => of(pickerTestProject) };

export const routes: Routes = [
  { path: '__picker-test', loadComponent: () => import('./features/admin/projects/projects').then((module) => module.AdminProjects), providers: [{ provide: ProjectService, useValue: pickerTestApi }] },
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((module) => module.PUBLIC_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found').then((module) => module.NotFound),
  },
];
