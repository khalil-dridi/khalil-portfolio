import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthState } from '../auth/auth.state';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let state: AuthState;

  const session = {
    accessToken: 'access-new',
    tokenType: 'Bearer',
    expiresIn: 900,
    admin: { id: 3, email: 'admin@example.com', lastLoginAt: null },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    state = TestBed.inject(AuthState);
    state.setAuthenticated('access-old', 900, session.admin);
  });

  afterEach(() => backend.verify());

  it('adds the Bearer token to private API requests', () => {
    http.get('/api/auth/me').subscribe();
    const request = backend.expectOne('/api/auth/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-old');
    request.flush({});
  });

  it('does not add a Bearer token or refresh when no access token exists', () => {
    state.clear();
    let status = 0;
    http.get('/api/admin/profile').subscribe({ error: (error) => status = error.status });
    const request = backend.expectOne('/api/admin/profile');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    backend.expectNone('/api/auth/csrf');
  });

  it('refreshes an expired token before sending a private request', () => {
    state.setAuthenticated('already-expired', -1, session.admin);
    let result: unknown;
    http.get('/api/admin/profile').subscribe((value) => result = value);
    backend.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    backend.expectOne('/api/auth/refresh').flush(session);

    const request = backend.expectOne('/api/admin/profile');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-new');
    request.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('shares one refresh across concurrent 401 responses and retries every request once', () => {
    const results: unknown[] = [];
    for (let index = 0; index < 5; index++) {
      http.get(`/api/admin/items/${index}`).subscribe((value) => results.push(value));
    }

    const originalRequests = backend.match((request) => request.url.startsWith('/api/admin/items/'));
    expect(originalRequests.length).toBe(5);
    originalRequests.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer access-old');
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    const csrfRequests = backend.match('/api/auth/csrf');
    expect(csrfRequests.length).toBe(1);
    expect(csrfRequests[0].request.withCredentials).toBeTrue();
    csrfRequests[0].flush({ token: 'csrf-value' });

    const refreshRequests = backend.match('/api/auth/refresh');
    expect(refreshRequests.length).toBe(1);
    expect(refreshRequests[0].request.withCredentials).toBeTrue();
    refreshRequests[0].flush(session);

    const retriedRequests = backend.match((request) => request.url.startsWith('/api/admin/items/'));
    expect(retriedRequests.length).toBe(5);
    retriedRequests.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer access-new');
      request.flush({ ok: true });
    });
    expect(results.length).toBe(5);
    expect(auth.accessToken()).toBe('access-new');
  });

  it('does not refresh after a 403 or for auth lifecycle endpoints', () => {
    let privateStatus = 0;
    http.get('/api/admin/profile').subscribe({ error: (error) => privateStatus = error.status });
    backend.expectOne('/api/admin/profile').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(privateStatus).toBe(403);
    backend.expectNone('/api/auth/csrf');

    for (const url of ['/api/auth/login', '/api/auth/csrf', '/api/auth/refresh', '/api/auth/logout']) {
      http.post(url, {}).subscribe({ error: () => undefined });
      const request = backend.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBeFalse();
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    }
    backend.expectNone('/api/auth/csrf');
  });

  it('clears expired auth and redirects after refresh returns 401', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    let status = 0;
    http.get('/api/admin/profile').subscribe({ error: (error) => status = error.status });
    backend.expectOne('/api/admin/profile').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    backend.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.status()).toBe('sessionExpired');
    expect(auth.accessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], { replaceUrl: true });
  });

  it('keeps a still-valid local session after a temporary refresh network failure', () => {
    let status = 0;
    http.get('/api/admin/profile').subscribe({ error: (error) => status = error.status });
    backend.expectOne('/api/admin/profile').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    backend.expectOne('/api/auth/refresh').error(new ProgressEvent('network error'));

    expect(status).toBe(0);
    expect(auth.status()).toBe('authenticated');
    expect(auth.accessToken()).toBe('access-old');
  });
});
