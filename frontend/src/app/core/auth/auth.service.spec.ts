import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthState } from './auth.state';

describe('AuthService', () => {
  let auth: AuthService;
  let state: AuthState;
  let http: HttpTestingController;

  const session = {
    accessToken: 'access-1',
    tokenType: 'Bearer',
    expiresIn: 900,
    admin: { id: 7, email: 'admin@example.com', lastLoginAt: null },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    state = TestBed.inject(AuthState);
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('loads CSRF before login and stores the returned session in memory', () => {
    let result: unknown;
    auth.login({ email: 'admin@example.com', password: 'sent-as-entered' }).subscribe((value) => result = value);

    const csrf = http.expectOne('/api/auth/csrf');
    expect(csrf.request.method).toBe('GET');
    expect(csrf.request.withCredentials).toBeTrue();
    csrf.flush({ token: 'csrf-value' });

    const login = http.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.withCredentials).toBeTrue();
    expect(login.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-value');
    expect(login.request.body).toEqual({ email: 'admin@example.com', password: 'sent-as-entered' });
    login.flush(session);

    expect(result).toEqual(session);
    expect(auth.accessToken()).toBe('access-1');
    expect(auth.status()).toBe('authenticated');
    expect(auth.expiresAt()).toBeGreaterThan(Date.now());
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('propagates rejected credentials and returns to unauthenticated state', () => {
    let status = 0;
    auth.login({ email: 'admin@example.com', password: 'wrong' }).subscribe({ error: (error) => status = error.status });
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.status()).toBe('unauthenticated');
    expect(auth.canRefreshSession()).toBeFalse();
    expect(auth.accessToken()).toBeNull();
  });

  it('restores a session through refresh and sends CSRF and cookies', () => {
    let restored = false;
    auth.refreshSession().subscribe((value) => restored = value);
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    const refresh = http.expectOne('/api/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.withCredentials).toBeTrue();
    expect(refresh.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-value');
    refresh.flush(session);

    expect(restored).toBeTrue();
    expect(auth.accessToken()).toBe('access-1');
    expect(auth.admin()).toEqual(session.admin);
  });

  it('does not send a protected POST when no CSRF token is available', () => {
    let error: unknown;
    auth.login({ email: 'admin@example.com', password: 'password' }).subscribe({ error: (value) => error = value });
    http.expectOne('/api/auth/csrf').flush({ token: '' });

    expect(error).toEqual(jasmine.any(Error));
    http.expectNone('/api/auth/login');
    expect(auth.status()).toBe('unauthenticated');
  });

  it('clears local state after logout even when the request fails', () => {
    state.setAuthenticated('access-1', 900, session.admin);
    let failed = false;
    auth.logout().subscribe({ error: () => failed = true });
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });

    const logout = http.expectOne('/api/auth/logout');
    expect(logout.request.withCredentials).toBeTrue();
    expect(logout.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-value');
    logout.error(new ProgressEvent('network error'));

    expect(failed).toBeTrue();
    expect(auth.status()).toBe('unauthenticated');
    expect(auth.accessToken()).toBeNull();
    expect(auth.admin()).toBeNull();
  });

  it('marks a rejected refresh as an expired session', () => {
    let status = 0;
    auth.refreshSession().subscribe({ error: (error) => status = error.status });
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.status()).toBe('sessionExpired');
    expect(auth.accessToken()).toBeNull();
  });

  it('does not expose an access token after its in-memory expiry', () => {
    state.setAuthenticated('already-expired', -1, session.admin);
    expect(auth.getValidAccessToken()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(auth.status()).toBe('sessionExpired');
    expect(auth.canRefreshSession()).toBeTrue();
  });
});
