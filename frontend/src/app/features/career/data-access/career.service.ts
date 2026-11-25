import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CareerResponse,
  Education,
  EducationRequest,
  Experience,
  ExperienceRequest,
  Skill,
  SkillRequest,
} from './career.models';

@Injectable({ providedIn: 'root' })
export class CareerService {
  private readonly http = inject(HttpClient);
  private readonly adminBase = '/api/admin/career';

  getCareer(): Observable<CareerResponse> {
    return this.http.get<CareerResponse>('/api/career');
  }

  getSkills(): Observable<Skill[]> { return this.http.get<Skill[]>(`${this.adminBase}/skills`); }
  getSkill(id: number): Observable<Skill> { return this.http.get<Skill>(`${this.adminBase}/skills/${id}`); }
  createSkill(request: SkillRequest): Observable<Skill> { return this.http.post<Skill>(`${this.adminBase}/skills`, request); }
  updateSkill(id: number, request: SkillRequest): Observable<Skill> { return this.http.put<Skill>(`${this.adminBase}/skills/${id}`, request); }
  deleteSkill(id: number): Observable<void> { return this.http.delete<void>(`${this.adminBase}/skills/${id}`); }

  getExperiences(): Observable<Experience[]> { return this.http.get<Experience[]>(`${this.adminBase}/experiences`); }
  getExperience(id: number): Observable<Experience> { return this.http.get<Experience>(`${this.adminBase}/experiences/${id}`); }
  createExperience(request: ExperienceRequest): Observable<Experience> { return this.http.post<Experience>(`${this.adminBase}/experiences`, request); }
  updateExperience(id: number, request: ExperienceRequest): Observable<Experience> { return this.http.put<Experience>(`${this.adminBase}/experiences/${id}`, request); }
  deleteExperience(id: number): Observable<void> { return this.http.delete<void>(`${this.adminBase}/experiences/${id}`); }

  getEducation(): Observable<Education[]> { return this.http.get<Education[]>(`${this.adminBase}/education`); }
  getEducationItem(id: number): Observable<Education> { return this.http.get<Education>(`${this.adminBase}/education/${id}`); }
  createEducation(request: EducationRequest): Observable<Education> { return this.http.post<Education>(`${this.adminBase}/education`, request); }
  updateEducation(id: number, request: EducationRequest): Observable<Education> { return this.http.put<Education>(`${this.adminBase}/education/${id}`, request); }
  deleteEducation(id: number): Observable<void> { return this.http.delete<void>(`${this.adminBase}/education/${id}`); }
}
