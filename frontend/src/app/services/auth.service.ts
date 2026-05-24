import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { StateService, UserInfo } from './state.service';

export interface AuthResponse {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  token: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiBaseUrl}/api/auth`;

  constructor(private http: HttpClient, private state: StateService) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, { email, password }).pipe(
      tap(response => this.applySession(response, true)),
    );
  }

  register(data: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, data).pipe(
      tap(response => this.applySession(response, false)),
    );
  }

  logout(): void {
    this.state.logout();
  }

  isLoggedIn(): boolean {
    return this.state.isLoggedIn();
  }

  getCurrentUser(): UserInfo | null {
    return this.state.getCurrentUser();
  }

  getToken(): string | null {
    return this.state.getToken();
  }

  hasRole(role: string): boolean {
    return this.state.hasRole(role);
  }

  private applySession(response: AuthResponse, remember: boolean): void {
    this.state.setToken(response.token);
    this.state.setUser({
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      avatar: response.avatar || 'م',
      role: response.role || 'BUYER',
    }, remember);
  }
}
