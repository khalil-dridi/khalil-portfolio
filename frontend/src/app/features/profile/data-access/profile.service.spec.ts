import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves the public profile without requiring an auth-specific request', () => {
    let result: unknown;
    service.getPublicProfile().subscribe((profile) => result = profile);
    const request = http.expectOne('/api/profile');
    expect(request.request.method).toBe('GET');
    request.flush({ firstName: 'Ada', availability: false });
    expect(result).toEqual({ firstName: 'Ada', availability: false });
  });

  it('retrieves the admin profile', () => {
    service.getAdminProfile().subscribe();
    const request = http.expectOne('/api/admin/profile');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 1, availability: false });
  });

  it('sends the partial update contract using PUT and preserves null and false values', () => {
    const update = {
      firstName: '', lastName: null, professionalTitle: null, biography: null,
      email: null, phone: null, location: null, resumeUrl: null, githubUrl: null,
      linkedinUrl: null, availability: false,
    };
    service.updateProfile(update).subscribe();
    const request = http.expectOne('/api/admin/profile');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(update);
    request.flush({ id: 1, firstName: '', availability: false });
  });

  it('uploads multipart form data in the file field without setting Content-Type', () => {
    const file = new File(['image-bytes'], 'portrait.webp', { type: 'image/webp' });
    service.uploadProfileImage(file).subscribe();
    const request = http.expectOne('/api/admin/profile/image');
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush({ imageUrl: '/api/profile/image', contentType: 'image/webp' });
  });

  it('deletes the profile image without a request body', () => {
    service.deleteProfileImage().subscribe();
    const request = http.expectOne('/api/admin/profile/image');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('propagates each supported backend error status without changing it', () => {
    for (const statusCode of [400, 401, 403, 404, 413, 415, 500]) {
      let receivedStatus = 0;
      service.getAdminProfile().subscribe({ error: (error: { status: number }) => receivedStatus = error.status });
      http.expectOne('/api/admin/profile').flush({}, { status: statusCode, statusText: 'Backend error' });
      expect(receivedStatus).withContext(`status ${statusCode}`).toBe(statusCode);
    }
  });
});
