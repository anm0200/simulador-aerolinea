import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>{{ isLogin() ? 'Iniciar Sesión' : 'Registrarse' }}</h1>
          <p>
            {{
              isLogin()
                ? 'Bienvenido de nuevo al simulador'
                : 'Crea tu cuenta para gestionar reservas'
            }}
          </p>
        </div>

        <form (ngSubmit)="onSubmit()" #authForm="ngForm">
          <div class="form-group" *ngIf="!isLogin()">
            <label for="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              [(ngModel)]="formData.name"
              required
              placeholder="Tu nombre"
            />
          </div>

          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="formData.email"
              required
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="formData.password"
              required
              placeholder="••••••••"
            />
          </div>

          <div class="form-group" *ngIf="!isLogin()">
            <label for="role">Tipo de Usuario</label>
            <select id="role" name="role" [(ngModel)]="formData.role">
              <option value="CLIENTE">Cliente (Solo Reservas)</option>
              <option value="RESPONSABLE">Responsable (Gestión Total)</option>
            </select>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Cargando...' : isLogin() ? 'Entrar' : 'Registrarme' }}
          </button>
        </form>

        <div class="login-footer">
          <p>
            {{ isLogin() ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
            <a href="javascript:void(0)" (click)="toggleMode()">{{
              isLogin() ? 'Regístrate aquí' : 'Inicia sesión'
            }}</a>
          </p>
        </div>

        <div *ngIf="error()" class="error-message">
          {{ error() }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 2rem;
      }
      .login-card {
        background: var(--bg-card, #ffffff);
        padding: 2.5rem;
        border-radius: 1.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 450px;
      }
      .login-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      .login-header h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: var(--primary-color, #1a73e8);
      }
      .login-header p {
        color: #666;
      }
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #ddd;
        border-radius: 0.75rem;
        font-size: 1rem;
        transition: border-color 0.2s;
      }
      .form-group input:focus {
        border-color: var(--primary-color, #1a73e8);
        outline: none;
      }
      .btn-primary {
        width: 100%;
        padding: 0.85rem;
        background: var(--primary-color, #1a73e8);
        color: white;
        border: none;
        border-radius: 0.75rem;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .login-footer {
        margin-top: 1.5rem;
        text-align: center;
      }
      .login-footer a {
        color: var(--primary-color, #1a73e8);
        text-decoration: none;
        font-weight: 600;
      }
      .error-message {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 0.5rem;
        text-align: center;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginPage {
  isLogin = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);

  formData = {
    email: '',
    password: '',
    name: '',
    role: 'CLIENTE',
  };

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    this.error.set(null);
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);

    const action = this.isLogin()
      ? this.auth.login({ email: this.formData.email, password: this.formData.password })
      : this.auth.register(this.formData);

    action.subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error en la autenticación');
        this.loading.set(false);
      },
    });
  }
}
