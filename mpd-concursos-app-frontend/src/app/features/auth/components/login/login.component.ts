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
import { LoggingService } from '../../../../core/services/logging/logging.service'; // Import LoggingService
import { ErrorMappingService, MappedError, ErrorType, ErrorSeverity } from '../../../../shared/services/error-mapping';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginNotificationComponent, LoginNotification } from './login-notification/login-notification.component';

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
    HeaderComponent,
    LoginNotificationComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('loginFormContainer') loginFormContainer!: ElementRef;

  loginForm: FormGroup;

  // Sistema de notificaciones externas para login
  loginNotification: LoginNotification | null = null;
  showLoginNotification = false;

  // Propiedades legacy mantenidas para compatibilidad
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
    private router: Router,
    private loggingService: LoggingService,
    private errorMappingService: ErrorMappingService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.loggingService.debug('[LoginComponent] Component initialized.', undefined, 'Login');
    this.loginForm.valueChanges.subscribe(() => {
      // Clear error messages when user starts typing again
      if (this.loginError) {
        this.loginError = null;
        this.isBlockedError = false;
        this.isInactiveError = false;
        this.isExpiredError = false;
        // Don't automatically flip back - let user control the card flip
      }
    });
  }

  ngAfterViewInit(): void {
    this.loggingService.debug('[LoginComponent] AfterViewInit triggered.', undefined, 'Login');
    if (this.loginFormContainer && this.loginFormContainer.nativeElement) {
      const inputs = this.loginFormContainer.nativeElement.querySelectorAll('.login-input');
      if (inputs) {
        inputs.forEach((input: HTMLInputElement) => {
          // Add a small delay to ensure styles are applied after Angular's rendering
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
    this.loggingService.info('[LoginComponent] Login form submitted.', undefined, 'Login');
    if (this.loginForm.valid) {
      // Reset error states
      this.loginError = null;
      this.isBlockedError = false;
      this.isInactiveError = false;
      this.isExpiredError = false;

      const loginData = new LoginUser(
        this.loginForm.get('username')?.value?.trim(),
        this.loginForm.get('password')?.value
      );

      if (!loginData.isValid()) {
        this.loginError = 'Por favor, complete todos los campos correctamente.';
        // Don't auto-flip - let user see error in current position
        this.loggingService.warn('[LoginComponent] Login data invalid before API call.', loginData, 'Login');
        return;
      }

      this.authService.handleLogin(loginData).subscribe({
        next: (jwtDto: any) => {
          if (jwtDto && jwtDto.token) {
            this.loggingService.info('[LoginComponent] Login successful. Navigating to dashboard.', undefined, 'Login');
            this.router.navigate(['/dashboard']);
          } else {
            // This case should ideally not be reached if AuthService handles errors by throwing them
            this.loginError = 'Credenciales incorrectas. Por favor, intente de nuevo.';
            // Don't auto-flip - let user see error in current position
            this.loggingService.warn('[LoginComponent] Login failed, but no specific error from AuthService.', undefined, 'Login');
          }
        },
        error: (error: any) => {
          this.loggingService.error('[LoginComponent] Login error caught in component:', error.message, 'Login');

          // Limpiar errores previos
          this.clearErrors();

          // Verificar si es un HttpErrorResponse para usar el nuevo sistema
          if (error instanceof HttpErrorResponse) {
            this.handleHttpError(error);
          } else {
            // Fallback al sistema legacy para errores no HTTP
            this.loginError = error.message || 'Error al intentar iniciar sesión. Por favor, intente de nuevo.';
            this.detectErrorType(error.message);
          }

          // Show the error message and reset password field
          this.loginForm.get('password')?.reset();
          // Don't auto-flip - let user see error in current position
        }
      });
    } else {
      this.loginError = 'Por favor, complete todos los campos correctamente.';
      // Don't auto-flip - let user see error in current position
      this.loggingService.warn('[LoginComponent] Login form invalid before submission.', this.loginForm.errors, 'Login');
    }
  }

  /**
   * Detects the type of error based on the message to apply specific styles and messages.
   * @param errorMessage The error message from the backend.
   */
  private detectErrorType(errorMessage: string): void {
    // Reset all error states first
    this.isBlockedError = false;
    this.isInactiveError = false;
    this.isExpiredError = false;

    const lowerCaseErrorMessage = errorMessage.toLowerCase();

    // Detect if it's a permissions error (possibly a blocked account)
    if (lowerCaseErrorMessage.includes('no tiene permisos') || lowerCaseErrorMessage.includes('bloqueada')) {
      this.isBlockedError = true;
      // Replace generic message with a more specific one
      this.loginError = this.getBlockedAccountMessage();
      this.loggingService.warn('[LoginComponent] Detected blocked account error.', undefined, 'Login');
    } else if (lowerCaseErrorMessage.includes('inactiva')) {
      this.isInactiveError = true;
      this.loggingService.warn('[LoginComponent] Detected inactive account error.', undefined, 'Login');
    } else if (lowerCaseErrorMessage.includes('expirado') || lowerCaseErrorMessage.includes('expirada')) {
      this.isExpiredError = true;
      this.loggingService.warn('[LoginComponent] Detected expired account error.', undefined, 'Login');
    } else {
      this.loggingService.debug('[LoginComponent] Detected generic authentication error.', undefined, 'Login');
    }
  }

  /**
   * Gets the appropriate title for the error message.
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
   * Gets the appropriate icon for the error type.
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
   * Maneja errores HTTP usando el sistema de notificaciones externas
   */
  private handleHttpError(error: HttpErrorResponse): void {
    // Mapear el error usando el ErrorMappingService
    const mappedError = this.errorMappingService.mapHttpError(error);

    // SOLO usar el nuevo sistema de notificaciones externas
    this.showLoginNotificationFromError(mappedError);

    // NO activar el ErrorContextPanel - solo notificaciones externas
  }



  /**
   * Crea y muestra una notificación externa basada en el error mapeado
   */
  private showLoginNotificationFromError(mappedError: MappedError): void {
    // Determinar el tipo de notificación
    let notificationType: 'error' | 'warning' | 'info' | 'success' = 'error';

    if (mappedError.severity === 'low') {
      notificationType = 'info';
    } else if (mappedError.severity === 'medium') {
      notificationType = 'warning';
    } else {
      notificationType = 'error';
    }

    // Crear la notificación sin detalles técnicos
    this.loginNotification = {
      type: notificationType,
      title: mappedError.title,
      message: mappedError.message,
      suggestions: mappedError.suggestions?.filter(s => !s.includes('HTTP') && !s.includes('endpoint')) || [],
      autoHide: true,
      hideDelay: 8000
    };

    this.showLoginNotification = true;
  }

  /**
   * Limpia todos los errores
   */
  private clearErrors(): void {
    // Limpiar notificaciones externas
    this.loginNotification = null;
    this.showLoginNotification = false;

    // Limpiar errores legacy
    this.loginError = null;
    this.isBlockedError = false;
    this.isInactiveError = false;
    this.isExpiredError = false;
  }



  /**
   * Maneja el cierre de la notificación de login
   */
  onLoginNotificationClose(): void {
    this.showLoginNotification = false;
    this.loginNotification = null;
  }

  /**
   * Maneja el dismiss automático de la notificación de login
   */
  onLoginNotificationDismiss(): void {
    this.onLoginNotificationClose();
  }



  /**
   * Copies the administrator's email to the clipboard.
   */
  copyAdminEmail(): void {
    navigator.clipboard.writeText(this.adminEmail)
      .then(() => {
        this.emailCopied = true;
        this.loggingService.info('[LoginComponent] Admin email copied to clipboard.', undefined, 'Login');
        // Reset state after 3 seconds
        setTimeout(() => {
          this.emailCopied = false;
        }, 3000);
      })
      .catch(err => {
        console.error('[LoginComponent] Error copying email:', err);
        this.loggingService.error('[LoginComponent] Failed to copy admin email to clipboard.', err, 'Login');
      });
  }

  /**
   * Returns a custom message for a blocked account error.
   */
  getBlockedAccountMessage(): string {
    return `Su cuenta ha sido bloqueada por motivos de seguridad. Para resolver este problema, por favor contacte al administrador del sistema.`;
  }

  /**
   * Navigates to the registration page.
   */
  goToRegister(): void {
    this.loggingService.debug('[LoginComponent] Navigating to register page.', undefined, 'Login');
    this.router.navigate(['/register']);
  }

  /**
   * Handles click on the front face (welcome screen) to show login form.
   */
  onFrontClick(): void {
    if (!this.isFlipped) {
      this.isFlipped = true;
      this.loggingService.debug('[LoginComponent] Card flipped to show login form.', undefined, 'Login');
    }
  }

  /**
   * Handles click on the back face (login form) - prevents unwanted flips.
   */
  onBackClick(event: Event): void {
    // Prevent the click from bubbling up and causing unwanted flips
    event.stopPropagation();
  }

  /**
   * Manually flips the card back to welcome screen (for explicit user action).
   */
  flipToWelcome(): void {
    this.isFlipped = false;
    this.loginError = null;
    this.isBlockedError = false;
    this.isInactiveError = false;
    this.isExpiredError = false;
    this.loggingService.debug('[LoginComponent] Card flipped back to welcome screen.', undefined, 'Login');
  }

  /**
   * Legacy method for backward compatibility - now only flips to login form.
   */
  onCardClick(): void {
    this.onFrontClick();
  }

  /**
   * Handles image loading errors for the logo.
   * Attempts to load a fallback image, then a text alternative.
   * @param event The error event from the image.
   */
  onLogoError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const container = imgElement.parentElement;
    this.loggingService.warn(`[LoginComponent] Error loading logo from: ${imgElement.src}. Attempting fallback.`, undefined, 'Login');

    // Attempt to load the fallback image
    imgElement.src = this.fallbackLogoUrl;
    // If the fallback also fails, show text alternative
    imgElement.onerror = () => {
      this.loggingService.error(`[LoginComponent] Fallback logo also failed to load from: ${this.fallbackLogoUrl}. Displaying text alternative.`, undefined, 'Login');
      if (container) {
        container.innerHTML = '<span class="logo-text">MPD</span>';
        // Add basic styling for the logo text if needed
        const logoTextElement = container.querySelector('.logo-text') as HTMLElement;
        if (logoTextElement) {
          logoTextElement.style.fontSize = '2rem';
          logoTextElement.style.fontWeight = 'bold';
          logoTextElement.style.color = '#3b82f6';
          logoTextElement.style.textShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
        }
      }
    };
  }
}
