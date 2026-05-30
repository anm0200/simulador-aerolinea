import { Component, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Header } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="login-container">
      <div class="login-card">
        <!-- Modo Login/Registro -->
        <ng-container *ngIf="!showVerification() && !showRecovery()">
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
              <small *ngIf="!isLogin()" class="pwd-hint">
                8-12 carac., Mayús., Minús., Número y Símbolo (@$!%*?&.,-_)
              </small>
            </div>

            <div class="form-actions">
              <div class="forgot-password" *ngIf="isLogin()">
                <a href="javascript:void(0)" (click)="toggleRecovery()"
                  >¿Olvidaste tu contraseña?</a
                >
              </div>
              <button type="submit" class="btn-primary" [disabled]="loading()">
                {{ loading() ? 'Cargando...' : isLogin() ? 'Entrar' : 'Registrarme' }}
              </button>
            </div>

            <div class="divider">
              <span>o</span>
            </div>

            <!-- Contenedor donde Google renderizará su botón oficial -->
            <div id="google-btn" class="google-btn-container"></div>
          </form>

          <div class="login-footer">
            <p>
              {{ isLogin() ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
              <a href="javascript:void(0)" (click)="toggleMode()">{{
                isLogin() ? 'Regístrate aquí' : 'Inicia sesión'
              }}</a>
            </p>
          </div>
        </ng-container>

        <!-- Modo Verificación -->
        <ng-container *ngIf="showVerification() && !showRecovery()">
          <div class="login-header">
            <h1>Verifica tu cuenta</h1>
            <p>
              Hemos enviado un código de 6 dígitos a <strong>{{ formData.email }}</strong>
            </p>
          </div>

          <form (ngSubmit)="onVerify()">
            <div class="form-group">
              <label for="code">Código de Verificación</label>
              <input
                type="text"
                id="code"
                name="code"
                [(ngModel)]="verificationCode"
                required
                placeholder="123456"
                maxlength="6"
                class="code-input"
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Verificando...' : 'Confirmar Cuenta' }}
            </button>
          </form>

          <div class="login-footer">
            <a href="javascript:void(0)" (click)="showVerification.set(false)"
              >Volver al registro</a
            >
          </div>
        </ng-container>

        <!-- Modo Recuperación de Contraseña -->
        <ng-container *ngIf="showRecovery()">
          <div class="login-header">
            <h1>Recuperar Contraseña</h1>
            <p>Introduce tu correo para recibir una nueva contraseña temporal segura.</p>
          </div>

          <form (ngSubmit)="onRecoverPassword()">
            <div class="form-group">
              <label for="recovery-email">Correo Electrónico</label>
              <input
                type="email"
                id="recovery-email"
                name="email"
                [(ngModel)]="formData.email"
                required
                placeholder="ejemplo@correo.com"
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar Contraseña' }}
            </button>
          </form>

          <div class="login-footer">
            <a href="javascript:void(0)" (click)="toggleRecovery()">Volver al inicio de sesión</a>
          </div>
        </ng-container>

        <div *ngIf="error()" class="error-message">
          {{ error() }}
        </div>
        <div *ngIf="successMessage()" class="success-message">
          {{ successMessage() }}
        </div>
      </div>
    </div>
    <app-footer></app-footer>
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
      .form-group input {
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
      .pwd-hint {
        display: block;
        margin-top: 0.4rem;
        font-size: 0.75rem;
        color: #777;
      }
      .code-input {
        text-align: center;
        letter-spacing: 0.5rem;
        font-size: 1.5rem !important;
        font-weight: bold;
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
      .google-btn-container {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-top: 10px;
      }
      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 1.5rem 0;
        color: #888;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #eee;
      }
      .divider span {
        padding: 0 10px;
        font-size: 0.9rem;
      }
      .forgot-password {
        text-align: right;
        margin-bottom: 1rem;
      }
      .forgot-password a {
        font-size: 0.9rem;
        color: var(--primary-color, #1a73e8);
        text-decoration: none;
      }
      .forgot-password a:hover {
        text-decoration: underline;
      }
      .form-actions {
        margin-top: 1rem;
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
      .success-message {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #dcfce7;
        color: #16a34a;
        border-radius: 0.5rem;
        text-align: center;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginPage implements OnInit {
  isLogin = signal(true);
  loading = signal(false);
  showVerification = signal(false);
  showRecovery = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  formData = {
    email: '',
    password: '',
    name: '',
  };

  verificationCode = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadGoogleScript();
  }

  private loadGoogleScript() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  }

  private initializeGoogleSignIn() {
    if (typeof (window as any).google === 'undefined') return;

    (window as any).google.accounts.id.initialize({
      client_id: '206099058419-sicqal0lftqkb2i8aodff7ervii0c12k.apps.googleusercontent.com',
      callback: this.handleGoogleCredentialResponse.bind(this),
    });

    this.renderGoogleButton();
  }

  private renderGoogleButton() {
    const btnContainer = document.getElementById('google-btn');
    if (btnContainer && typeof (window as any).google !== 'undefined') {
      (window as any).google.accounts.id.renderButton(btnContainer, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    }
  }

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    this.error.set(null);
    this.successMessage.set(null);
    // Re-renderizamos el botón tras cambiar de modo si es necesario,
    // aunque al estar fuera del ngIf del formulario no se destruye.
    setTimeout(() => this.renderGoogleButton(), 100);
  }

  toggleRecovery() {
    this.showRecovery.set(!this.showRecovery());
    this.error.set(null);
    this.successMessage.set(null);
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    if (this.isLogin()) {
      this.auth.login({ email: this.formData.email, password: this.formData.password }).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'Error en el inicio de sesión');
          this.loading.set(false);
        },
      });
    } else {
      this.auth.register(this.formData).subscribe({
        next: (res: any) => {
          this.showVerification.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'Error en el registro');
          this.loading.set(false);
        },
      });
    }
  }

  onVerify() {
    this.loading.set(true);
    this.error.set(null);

    this.auth.verify(this.formData.email, this.verificationCode).subscribe({
      next: () => {
        this.successMessage.set('Cuenta verificada con éxito. Ya puedes iniciar sesión.');
        this.showVerification.set(false);
        this.isLogin.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Código incorrecto');
        this.loading.set(false);
      },
    });
  }

  onRecoverPassword() {
    if (!this.formData.email) {
      this.error.set('Introduce tu correo electrónico');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.auth.recoverPassword(this.formData.email).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al procesar la solicitud');
        this.loading.set(false);
      },
    });
  }

  handleGoogleCredentialResponse(response: any) {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    // Mandamos el JWT de Google al backend para que lo valide con google-auth-library
    this.auth.loginWithGoogle({ token: response.credential }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.requiresVerification) {
          // No tenemos el email en el frontend directo (está en el JWT encriptado),
          // pero el backend ya mandó el código.
          this.showVerification.set(true);
          this.successMessage.set(res.message);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error en autenticación de Google');
        this.loading.set(false);
      },
    });
  }
}
