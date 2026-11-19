import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.accessToken()
    ? true
    : auth.refreshSession().pipe(
        // Recover the in-memory access token through the HttpOnly refresh cookie after reload.
        // A failed refresh sends the user back to the login form.
        map((authenticated) => authenticated ? true : router.createUrlTree(['/admin/login'])),
      );
};
