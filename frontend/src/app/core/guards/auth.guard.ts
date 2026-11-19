import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (_route, routerState) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasValidAccessToken()) return true;

  return auth.refreshSession().pipe(
    map((restored) => restored ? true : loginUrl(router, routerState.url)),
    catchError(() => of(loginUrl(router, routerState.url))),
  );
};

export const adminLoginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasValidAccessToken()) return router.createUrlTree(['/admin']);

  return auth.refreshSession().pipe(
    map((restored) => restored ? router.createUrlTree(['/admin']) : true),
    catchError(() => of(true)),
  );
};

function loginUrl(router: Router, returnUrl: string) {
  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl } });
}
