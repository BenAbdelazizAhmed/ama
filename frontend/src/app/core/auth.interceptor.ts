import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { StateService } from '../services/state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(StateService);
  const token = state.token;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        state.logout();
        window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action: 'session-expired' } }));
      }

      if (error.status === 403) {
        window.dispatchEvent(new CustomEvent('amanafarm-forbidden'));
      }

      return throwError(() => error);
    }),
  );
};
