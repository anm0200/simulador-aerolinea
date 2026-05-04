import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'RESPONSABLE' | 'CLIENTE';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);

  constructor(private http: HttpClient) {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  register(data: any) {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/register`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  login(data: any) {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/login`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private handleAuth(res: { token: string; user: User }) {
    this.token.set(res.token);
    this.currentUser.set(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  isLoggedIn() {
    return !!this.token();
  }

  hasRole(role: string) {
    return this.currentUser()?.role === role;
  }
}
