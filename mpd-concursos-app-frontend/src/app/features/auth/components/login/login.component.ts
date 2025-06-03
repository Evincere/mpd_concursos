import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../../dashboard/components/header/header.component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LoginUser } from '../../../../core/models/login-user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HeaderComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('loginFormContainer') loginFormContainer!: ElementRef;
  loginForm: FormGroup;
  loginError: string | null = null;
  hide = true;
  isFlipped = false;
  isBlockedError = false;
  isInactiveError = false;
  isExpiredError = false;
  adminEmail = 'administracion@mdp.gov.ar';
  emailCopied = false;
  private readonly fallbackLogoUrl = 'assets/images/mpd-logo.png';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.loginFormContainer && this.loginFormContainer.nativeElement) {
      const inputs = this.loginFormContainer.nativeElement.querySelectorAll('.login-input');
      if (inputs) {
        inputs.forEach((input: HTMLInputElement) => {
          input.addEventListener('input', () => {
            setTimeout(() => {
              input.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
              input.style.color = 'white';
            }, 100);
          });
        });
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Resetear estados de error
      this.loginError = null;
      this.isBlockedError = false;
      this.isInactiveError = false;
      this.isExpiredError = false;

      const loginData = new LoginUser(
        this.loginForm.get('username')?.value?.trim(),
        this.loginForm.get('password')?.value
      );

      if (!loginData.isValid()) {
        this.loginError = 'Por favor, complete todos los campos correctamente';
        return;
      }

      console.log('[LoginComponent] Enviando datos de login:', {
        username: loginData.username,
        passwordValid: loginData.password?.length >= 6
      });

      this.authService.handleLogin(loginData)
        .subscribe({
          next: (_response) => {
            console.log('[LoginComponent] Login exitoso, verificando rol del usuario...');

            // Verificar si el usuario es administrador para redirigir apropiadamente
            if (this.authService.hasRole('ROLE_ADMIN')) {
              console.log('[LoginComponent] Usuario administrador detectado, redirigiendo al panel de administración...');
              this.router.navigate(['/admin/dashboard']);
            } else {
              console.log('[LoginComponent] Usuario regular detectado, redirigiendo al dashboard...');
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error: Error) => {
            console.error('[LoginComponent] Error en login:', error.message);
            this.loginError = error.message || 'Error al intentar iniciar sesión';

            // Determinar el tipo de error para aplicar estilos específicos
            this.detectErrorType(error.message);

            // Mostrar el mensaje de error y resetear la contraseña
            this.loginForm.get('password')?.reset();
            this.isFlipped = true;
          }
        });
    } else {
      this.loginError = 'Por favor, complete todos los campos correctamente';
      this.isFlipped = true;
    }
  }

  /**
   * Detecta el tipo de error basado en el mensaje para aplicar estilos específicos
   */
  private detectErrorType(errorMessage: string): void {
    // Resetear todos los estados de error
    this.isBlockedError = false;
    this.isInactiveError = false;
    this.isExpiredError = false;

    // Detectar si es un error de permisos (posible cuenta bloqueada)
    if (errorMessage.includes('No tiene permisos') || errorMessage.includes('bloqueada')) {
      this.isBlockedError = true;
      // Reemplazar el mensaje genérico con uno más específico
      this.loginError = this.getBlockedAccountMessage();
    } else if (errorMessage.includes('inactiva')) {
      this.isInactiveError = true;
    } else if (errorMessage.includes('expirado') || errorMessage.includes('expirada')) {
      this.isExpiredError = true;
    }
  }

  /**
   * Obtiene el título apropiado para el mensaje de error
   */
  getErrorTitle(): string {
    if (this.isBlockedError) {
      return 'Cuenta bloqueada';
    } else if (this.isInactiveError) {
      return 'Cuenta inactiva';
    } else if (this.isExpiredError) {
      return 'Cuenta expirada';
    }
    return 'Error de autenticación';
  }

  /**
   * Obtiene el icono apropiado para el tipo de error
   */
  getErrorIcon(): string {
    if (this.isBlockedError) {
      return 'lock';
    } else if (this.isInactiveError) {
      return 'warning';
    } else if (this.isExpiredError) {
      return 'access_time';
    }
    return 'error';
  }

  /**
   * Copia el email del administrador al portapapeles
   */
  copyAdminEmail(): void {
    navigator.clipboard.writeText(this.adminEmail)
      .then(() => {
        this.emailCopied = true;
        // Resetear el estado después de 3 segundos
        setTimeout(() => {
          this.emailCopied = false;
        }, 3000);
      })
      .catch(err => {
        console.error('Error al copiar el email: ', err);
      });
  }

  /**
   * Devuelve un mensaje personalizado para el error de cuenta bloqueada
   */
  getBlockedAccountMessage(): string {
    return `Su cuenta ha sido bloqueada por motivos de seguridad. Para resolver este problema, por favor contacte al administrador del sistema.`;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  onCardClick(): void {
    if (!this.isFlipped) {
      this.isFlipped = true;
    }
  }

  onLogoError(event: Event) {
    console.log('Error al cargar el logo en login, intentando con fallback');
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.fallbackLogoUrl;
    // Si también falla el fallback, mostrar un texto
    imgElement.onerror = () => {
      console.log('Error al cargar el logo fallback en login');
      const container = imgElement.parentElement;
      if (container) {
        container.innerHTML = '<span class="logo-text">MPD</span>';
      }
    };
  }
}
