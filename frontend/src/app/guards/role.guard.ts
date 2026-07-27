import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  const user = authService.currentUserValue;

  if (user && expectedRoles && expectedRoles.includes(user.roleName)) {
    return true;
  }

  // Redirect to dashboard page
  router.navigate(['/']);
  return false;
};
