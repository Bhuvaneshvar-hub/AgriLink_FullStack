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
      // This backend returns 403 (not 401) for an expired/invalid JWT. We only
      // attempt a silent refresh when the access token is actually EXPIRED. A
      // 401/403 with a still-valid token is an authorization denial (the role is
      // not permitted for this endpoint) — surface it as an error to the caller
      // instead of refreshing or logging the user out.
      const isAuthFailure = error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403);
      const tokenExpired = authService.isTokenExpired(token);

      if (isAuthFailure && !isPublic && token && tokenExpired) {
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
