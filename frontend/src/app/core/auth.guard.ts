import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { StateService } from '../services/state.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const session = inject(StateService);
  const router = inject(Router);

  if (session.isLoggedIn()) return true;

  sessionStorage.setItem('amanafarm-return-url', state.url);
  window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action: 'protected-route' } }));
  return router.parseUrl('/');
};

export const roleGuard: CanActivateFn = (route): boolean | UrlTree => {
  const session = inject(StateService);
  const router = inject(Router);
  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (!allowed.length || session.hasAnyRole(allowed)) return true;

  window.dispatchEvent(new CustomEvent('amanafarm-forbidden'));
  return router.parseUrl('/');
};
