import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminProfile,
  ProfileImageResponse,
  ProfileUpdateRequest,
  PublicProfile,
} from './profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getPublicProfile(): Observable<PublicProfile> {
    return this.http.get<PublicProfile>('/api/profile');
  }

  getAdminProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>('/api/admin/profile');
  }

  updateProfile(request: ProfileUpdateRequest): Observable<AdminProfile> {
    return this.http.put<AdminProfile>('/api/admin/profile', request);
  }

  uploadProfileImage(file: File): Observable<ProfileImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProfileImageResponse>('/api/admin/profile/image', formData);
  }

  deleteProfileImage(): Observable<void> {
    return this.http.delete<void>('/api/admin/profile/image');
  }
}
