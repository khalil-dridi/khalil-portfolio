import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from './project.models';

export type ProjectWriteRequest = Pick<Project, 'title' | 'description' | 'technologies' | 'githubUrl'>;

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  getAdminProjects(): Observable<Project[]> { return this.http.get<Project[]>('/api/admin/projects'); }
  getAdminProject(id: number): Observable<Project> { return this.http.get<Project>(`/api/admin/projects/${id}`); }
  createAdminProject(project: ProjectWriteRequest): Observable<Project> { return this.http.post<Project>('/api/admin/projects', project); }
  updateAdminProject(id: number, project: ProjectWriteRequest): Observable<Project> { return this.http.put<Project>(`/api/admin/projects/${id}`, project); }
  deleteAdminProject(id: number): Observable<void> { return this.http.delete<void>(`/api/admin/projects/${id}`); }
  uploadAdminImage(id: number, file: File): Observable<unknown> { return this.uploadMedia(`/api/admin/projects/${id}/image`, file); }
  deleteAdminImage(id: number): Observable<void> { return this.http.delete<void>(`/api/admin/projects/${id}/image`); }
  uploadAdminVideo(id: number, file: File): Observable<unknown> { return this.uploadMedia(`/api/admin/projects/${id}/video`, file); }
  deleteAdminVideo(id: number): Observable<void> { return this.http.delete<void>(`/api/admin/projects/${id}/video`); }

  private uploadMedia(url: string, file: File): Observable<unknown> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post(url, body);
  }
}
