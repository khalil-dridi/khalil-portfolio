import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const AUTH_LIFECYCLE_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/csrf',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const path = request.url.split('?')[0];
  if (!path.startsWith('/api/') || AUTH_LIFECYCLE_PATHS.has(path)) return next(request);

  const token = auth.getValidAccessToken();
  if (!token) {
    if (!auth.canRefreshSession()) return next(request);
    return auth.refreshAccessToken().pipe(
      switchMap((session) => next(withBearer(request, session.accessToken))),
    );
  }

  return next(withBearer(request, token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const latestToken = auth.getValidAccessToken();
      if (latestToken && latestToken !== token) {
        return next(withBearer(request, latestToken));
      }

      return auth.refreshAccessToken().pipe(
        switchMap((session) => next(withBearer(request, session.accessToken))),
      );
    }),
  );
};

function withBearer(request: Parameters<HttpInterceptorFn>[0], token: string) {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
