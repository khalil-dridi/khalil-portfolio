import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { CsrfResponse, LoginRequest, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private csrfToken = '';
  readonly accessToken = signal<string | null>(null);
  readonly admin = signal<LoginResponse['admin'] | null>(null);

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.loadCsrfToken().pipe(
      switchMap((token) =>
        this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, {
          withCredentials: true,
          headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }),
        }),
      ),
      tap((response) => {
        this.accessToken.set(response.accessToken);
        this.admin.set(response.admin);
      }),
    );
  }

  refreshSession(): Observable<boolean> {
    return this.loadCsrfToken().pipe(
      switchMap((token) => this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}, {
        withCredentials: true,
        headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }),
      })),
      tap((response) => {
        this.accessToken.set(response.accessToken);
        this.admin.set(response.admin);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  getCurrentAdmin(): Observable<LoginResponse['admin']> {
    return this.http.get<LoginResponse['admin']>(`${this.apiUrl}/me`);
  }

  logout(): Observable<void> {
    return this.loadCsrfToken().pipe(
      switchMap((token) => this.http.post<unknown>(`${this.apiUrl}/logout`, {}, {
        withCredentials: true,
        headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }),
      })),
      map(() => undefined),
      finalize(() => {
        this.accessToken.set(null);
        this.admin.set(null);
      }),
    );
  }

  loadCsrfToken(): Observable<string> {
    return this.http.get<CsrfResponse | string>(`${this.apiUrl}/csrf`, { withCredentials: true }).pipe(
      tap((response) => {
        if (typeof response === 'string') {
          this.csrfToken = response;
        } else {
          this.csrfToken = response.csrfToken ?? response.token ?? this.readCookie('XSRF-TOKEN');
        }
      }),
      map(() => this.csrfToken),
    );
  }

  private readCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
  }

  static messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Adresse email ou mot de passe incorrect.';
      if (error.status === 403) return 'Accès refusé. Veuillez actualiser la page et réessayer.';
      if (error.status === 0) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    }
    return 'La connexion a échoué. Veuillez réessayer.';
  }
}
