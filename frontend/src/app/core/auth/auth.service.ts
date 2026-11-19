import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthState } from './auth.state';
import { AdminUser, CsrfResponse, LoginRequest, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly state = inject(AuthState);
  private refreshInFlight$: Observable<LoginResponse> | null = null;
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly status = this.state.status;
  readonly accessToken = this.state.accessToken;
  readonly admin = this.state.admin;
  readonly expiresAt = this.state.expiresAt;
  readonly canRefreshSession = this.state.canRefreshSession;

  hasValidAccessToken(): boolean {
    return this.getValidAccessToken() !== null;
  }

  getValidAccessToken(): string | null {
    const { accessToken, expiresAt } = this.state.snapshot();
    if (accessToken && (!expiresAt || Date.now() >= expiresAt)) {
      this.clearExpirationTimer();
      this.state.expireAccessToken();
      return null;
    }
    return accessToken;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.state.setStatus('authenticating');
    return this.loadCsrfToken().pipe(
      switchMap((token) => this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, {
        withCredentials: true,
        headers: this.csrfHeaders(token),
      })),
      tap((response) => this.acceptSession(response)),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  refreshSession(): Observable<boolean> {
    if (this.status() === 'sessionExpired' && !this.canRefreshSession()) return of(false);
    return this.refreshAccessToken().pipe(map(() => true));
  }

  refreshAccessToken(): Observable<LoginResponse> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.getValidAccessToken();
    this.state.setStatus('refreshing');
    const refresh$ = this.loadCsrfToken().pipe(
      switchMap((token) => this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}, {
        withCredentials: true,
        headers: this.csrfHeaders(token),
      })),
      tap((response) => this.acceptSession(response)),
      catchError((error: unknown) => {
        const definitelyExpired = error instanceof HttpErrorResponse && error.status === 401;
        if (definitelyExpired) {
          this.clearSession('sessionExpired');
          this.redirectToLogin();
        } else if (this.hasValidAccessToken()) {
          this.state.setStatus('authenticated');
        } else if (this.canRefreshSession()) {
          this.state.setStatus('sessionExpired');
        } else {
          this.clearSession();
        }
        return throwError(() => error);
      }),
      finalize(() => { this.refreshInFlight$ = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.refreshInFlight$ = refresh$;
    return refresh$;
  }

  getCurrentAdmin(): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/me`).pipe(
      tap((admin) => {
        if (!this.hasValidAccessToken()) return;
        this.state.setAdmin(admin);
      }),
    );
  }

  logout(): Observable<void> {
    return this.loadCsrfToken().pipe(
      switchMap((token) => this.http.post<void>(`${this.apiUrl}/logout`, {}, {
        withCredentials: true,
        headers: this.csrfHeaders(token),
      })),
      map(() => undefined),
      finalize(() => {
        this.clearSession();
        if (!this.router.url.startsWith('/admin/login')) {
          void this.router.navigate(['/admin/login'], { replaceUrl: true });
        }
      }),
    );
  }

  loadCsrfToken(): Observable<string> {
    return this.http.get<CsrfResponse>(`${this.apiUrl}/csrf`, { withCredentials: true }).pipe(
      map((response) => {
        const token = response.token?.trim() || this.readCookie('XSRF-TOKEN').trim();
        if (!token) throw new Error('Le serveur n’a pas fourni de token CSRF exploitable.');
        return token;
      }),
    );
  }

  static messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Adresse email ou mot de passe incorrect.';
      if (error.status === 403) return 'Accès refusé. Veuillez actualiser la page et réessayer.';
      if (error.status === 0) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    }
    return 'La connexion a échoué. Veuillez réessayer.';
  }

  private acceptSession(response: LoginResponse): void {
    this.clearExpirationTimer();
    this.state.setAuthenticated(response.accessToken, response.expiresIn, response.admin);
    const expiresAt = this.state.expiresAt();
    if (expiresAt !== null) {
      this.expirationTimer = setTimeout(() => {
        if (this.state.expiresAt() === expiresAt && Date.now() >= expiresAt) {
          this.expirationTimer = null;
          this.state.expireAccessToken();
        }
      }, Math.max(0, expiresAt - Date.now()));
    }
  }

  private clearSession(status: 'unauthenticated' | 'sessionExpired' = 'unauthenticated'): void {
    this.clearExpirationTimer();
    this.state.clear(status);
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer !== null) clearTimeout(this.expirationTimer);
    this.expirationTimer = null;
  }

  private csrfHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ 'X-XSRF-TOKEN': token });
  }

  private readCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
  }

  private redirectToLogin(): void {
    if (!this.router.url.startsWith('/admin/login')) {
      const returnUrl = this.router.url.startsWith('/admin') ? this.router.url : null;
      if (returnUrl) void this.router.navigate(['/admin/login'], { queryParams: { returnUrl }, replaceUrl: true });
      else void this.router.navigate(['/admin/login'], { replaceUrl: true });
    }
  }
}
