import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let authReq = req;
  const token = authService.token;
  
  const isPublic = req.url.includes('/session/login') || 
                   req.url.includes('/session/refresh') || 
                   req.url.includes('/session/register');

  if (token && !isPublic) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // This backend returns 403 (not 401) for an expired/invalid JWT, so treat
      // both as an auth failure and attempt a silent token refresh — but only when
      // we actually sent a token on a non-public request.
      const isAuthFailure = error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403);

      if (isAuthFailure && !isPublic && token) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((res: any) => {
              isRefreshing = false;
              refreshTokenSubject.next(res.accessToken);
              return next(req.clone({
                headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`)
              }));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.clearSession();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((newToken) => {
              return next(req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              }));
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
