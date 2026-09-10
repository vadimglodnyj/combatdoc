import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const TOKEN_KEY = 'access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          localStorage.setItem(TOKEN_KEY, response.accessToken);
        }
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** True only if a JWT exists and is not expired. Invalid leftover tokens do not count. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      this.logout();
      return false;
    }
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 5000) {
      this.logout();
      return false;
    }
    return true;
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) {
      return null;
    }
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const json = atob(padded + '='.repeat(padLen));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
