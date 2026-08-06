import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface UserSession {
  userId: number;
  email: string;
  name: string;
  roleName: string;
  regionId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const sessionStr = localStorage.getItem('agrilink_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        this.currentUserSubject.next(session);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem('agrilink_token');
  }

  public get refreshTokenValue(): string | null {
    return localStorage.getItem('agrilink_refresh_token');
  }

  public isLoggedIn(): boolean {
    return !!this.token;
  }

  /**
   * True if the given JWT access token is missing or past its `exp` claim.
   * Used to decide whether a 401/403 warrants a silent refresh (expired token)
   * versus an authorization denial (valid token, insufficient role) which must
   * NOT end the session.
   */
  public isTokenExpired(token: string | null = this.token): boolean {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload || !payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }

  public hasRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.includes(user.roleName);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>('/agriLink/session/login', credentials).pipe(
      tap(res => {
        if (res && res.accessToken) {
          localStorage.setItem('agrilink_token', res.accessToken);
          localStorage.setItem('agrilink_refresh_token', res.refreshToken);
          
          const session: UserSession = {
            userId: res.userId,
            email: credentials.email,
            // Prefer the account's real name. If the server didn't send one, fall
            // back to the email's local part rather than a generic "User", which
            // would otherwise be cached in localStorage and shown everywhere.
            name: res.name
              || (res.roleName === 'AgriLinkAdmin' ? 'Administrator' : this.nameFromEmail(credentials.email)),
            roleName: res.roleName,
            regionId: res.regionId
          };
          
          localStorage.setItem('agrilink_session', JSON.stringify(session));
          this.currentUserSubject.next(session);
        }
      })
    );
  }

  /**
   * Correct the cached display name from an authoritative source — currently the
   * farmer profile, which carries the person's real name. Needed because the login
   * response does not always include `name`, and the session is cached in
   * localStorage, so a placeholder would otherwise stick until the next login.
   */
  updateDisplayName(name: string | undefined): void {
    const current = this.currentUserValue;
    const trimmed = (name || '').trim();
    if (!current || !trimmed || current.name === trimmed) return;
    const updated: UserSession = { ...current, name: trimmed };
    localStorage.setItem('agrilink_session', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  /** "lakshmi@gmail.com" -> "Lakshmi". Last-resort display name only. */
  private nameFromEmail(email: string | undefined): string {
    const local = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (!local) return 'User';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>('/agriLink/session/register', userData);
  }

  logout(): Observable<any> {
    return this.http.post<any>('/agriLink/session/logout', {}).pipe(
      catchError(err => {
        // Even if server logout fails, clear local session
        return throwError(() => err);
      }),
      tap({
        finalize: () => {
          this.clearSession();
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.refreshTokenValue;
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>('/agriLink/session/refresh', { refreshToken }).pipe(
      tap(res => {
        if (res && res.accessToken) {
          localStorage.setItem('agrilink_token', res.accessToken);
          localStorage.setItem('agrilink_refresh_token', res.refreshToken);
          
          const current = this.currentUserValue;
          if (current) {
            const updated = { ...current, roleName: res.roleName, regionId: res.regionId };
            localStorage.setItem('agrilink_session', JSON.stringify(updated));
            this.currentUserSubject.next(updated);
          }
        }
      }),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.post<any>('/agriLink/session/change-password', data);
  }

  clearSession() {
    localStorage.removeItem('agrilink_token');
    localStorage.removeItem('agrilink_refresh_token');
    localStorage.removeItem('agrilink_session');
    this.currentUserSubject.next(null);
  }
}
