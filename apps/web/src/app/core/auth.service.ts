import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
const TOKEN_KEY = 'vault_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  status(): Observable<{ configured: boolean }> {
    return this.http.get<{ configured: boolean }>(`${API_BASE_URL}/auth/status`);
  }

  setup(masterPassword: string): Observable<{ token: string }> {
    return this.authenticate('setup', masterPassword);
  }

  login(masterPassword: string): Observable<{ token: string }> {
    return this.authenticate('login', masterPassword);
  }

  hasValidToken(): boolean {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
        this.clearToken();
        return false;
      }
      return true;
    } catch {
      this.clearToken();
      return false;
    }
  }

  token(): string | null {
    return this.hasValidToken() ? sessionStorage.getItem(TOKEN_KEY) : null;
  }

  logout(): void {
    this.clearToken();
  }

  private authenticate(action: 'setup' | 'login', masterPassword: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${API_BASE_URL}/auth/${action}`, { masterPassword }).pipe(
      tap(({ token }) => sessionStorage.setItem(TOKEN_KEY, token)),
    );
  }

  private clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
