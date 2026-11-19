import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthState } from '../auth/auth.state';
import { adminLoginGuard, authGuard } from './auth.guard';

describe('authGuard', () => {
  let state: AuthState;
  let http: HttpTestingController;
  let router: Router;
  const route = {} as ActivatedRouteSnapshot;
  const routerState = { url: '/admin/projects' } as RouterStateSnapshot;
  const session = {
    accessToken: 'restored-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    admin: { id: 2, email: 'admin@example.com', lastLoginAt: null },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    state = TestBed.inject(AuthState);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('allows a user with a non-expired in-memory token', () => {
    state.setAuthenticated('valid-token', 900, session.admin);
    expect(TestBed.runInInjectionContext(() => authGuard(route, routerState))).toBeTrue();
    http.expectNone('/api/auth/csrf');
  });

  it('restores a missing session before allowing the protected route', async () => {
    const resultPromise = TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(route, routerState) as Observable<boolean | UrlTree>),
    );
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').flush(session);

    expect(await resultPromise).toBeTrue();
    expect(state.accessToken()).toBe('restored-token');
    expect(state.status()).toBe('authenticated');
  });

  it('redirects expired sessions to login while preserving the requested route', async () => {
    const resultPromise = TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(route, routerState) as Observable<boolean | UrlTree>),
    );
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    const result = await resultPromise;
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toContain('/admin/login?returnUrl=%2Fadmin%2Fprojects');
    expect(state.status()).toBe('sessionExpired');
  });

  it('does not mark a session expired when restoration fails because of a network error', async () => {
    const resultPromise = TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(route, routerState) as Observable<boolean | UrlTree>),
    );
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').error(new ProgressEvent('network error'));

    const result = await resultPromise;
    expect(result instanceof UrlTree).toBeTrue();
    expect(state.status()).toBe('unauthenticated');
  });

  it('redirects an authenticated visitor away from the login page', () => {
    state.setAuthenticated('valid-token', 900, session.admin);
    const result = TestBed.runInInjectionContext(() => adminLoginGuard(route, routerState));
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin');
    http.expectNone('/api/auth/csrf');
  });

  it('restores a refresh-cookie session before redirecting away from login', async () => {
    const resultPromise = TestBed.runInInjectionContext(() =>
      firstValueFrom(adminLoginGuard(route, routerState) as Observable<boolean | UrlTree>),
    );
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').flush(session);

    const result = await resultPromise;
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin');
    expect(state.accessToken()).toBe('restored-token');
  });

  it('keeps the login page available when no session can be restored', async () => {
    const resultPromise = TestBed.runInInjectionContext(() =>
      firstValueFrom(adminLoginGuard(route, routerState) as Observable<boolean | UrlTree>),
    );
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-value' });
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(await resultPromise).toBeTrue();
  });
});
