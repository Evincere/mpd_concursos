import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from   '@angular/forms';

@Component({
  selector: 'app-validation-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="shouldShowErrors()" class="validation-error-container">
      <div
        *ngFor="let error of getErrorMessages()"
        class="validation-error"
        [class.error-animation]="animate">
        <span class="error-icon">
          <i class="fas fa-exclamation-circle"></i>
        </span>
        <span class="error-message">{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .validation-error-container {
      margin-top: 0.25rem;
    }

    .validation-error {
      display: flex;
      align-items: center;
      color: var(--color-error, #f44336);
      font-size: 0.75rem;
      line-height: 1.2;
      margin-bottom: 0.25rem;
      transition: all 0.3s ease;
    }

    .error-icon {
      margin-right: 0.25rem;
    }

    .error-message {
      flex: 1;
    }

    .error-animation {
      animation: errorPulse 0.5s ease;
    }

    @keyframes errorPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (prefers-color-scheme: dark) {
      .validation-error {
        color: var(--color-error-dark, #ff6b6b);
      }
    }
  `]
})
export class ValidationErrorComponent implements OnChanges {
  @Input() control: AbstractControl | null = null;
  @Input() showOnlyWhenTouched = true;
  @Input() showOnlyWhenDirty = false;
  @Input() customMessages: Record<string, string> = {};

  animate = false;

  // Mensajes de error predeterminados
  private defaultErrorMessages: Record<string, string> = {
    required: 'Este campo es obligatorio',
    email: 'Debe ingresar un correo electrónico válido',
    minlength: 'Debe tener al menos {requiredLength} caracteres',
    maxlength: 'No debe exceder los {requiredLength} caracteres',
    min: 'El valor debe ser mayor o igual a {min}',
    max: 'El valor debe ser menor o igual a {max}',
    pattern: 'El formato ingresado no es válido',
    passwordMismatch: 'Las contraseñas no coinciden',
    invalidDni: 'El DNI debe tener entre 7 y 8 dígitos numéricos',
    invalidPhone: 'El teléfono debe tener un formato válido',
    invalidDate: 'La fecha ingresada no es válida',
    futureDate: 'La fecha no puede ser futura',
    pastDate: 'La fecha no puede ser pasada',
    invalidUrl: 'La URL ingresada no es válida',
    duplicateEmail: 'Este correo electrónico ya está registrado',
    duplicateDni: 'Este DNI ya está registrado',
    serverError: 'Error de validación en el servidor'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['control'] && !changes['control'].firstChange) {
      this.animate = true;
      setTimeout(() => {
        this.animate = false;
      }, 500);
    }
  }

  shouldShowErrors(): boolean {
    if (!this.control) return false;

    const { dirty, touched, invalid, errors } = this.control;

    if (!invalid || !errors) return false;

    if (this.showOnlyWhenTouched && this.showOnlyWhenDirty) {
      return dirty && touched;
    } else if (this.showOnlyWhenTouched) {
      return touched;
    } else if (this.showOnlyWhenDirty) {
      return dirty;
    }

    return true;
  }

  getErrorMessages(): string[] {
    if (!this.control || !this.control.errors) return [];

    return Object.keys(this.control.errors).map(key => {
      const error = this.control?.errors?.[key];

      // Usar mensaje personalizado si existe
      if (this.customMessages[key]) {
        return this.customMessages[key];
      }

      // Usar mensaje predeterminado con parámetros si es necesario
      const defaultMessage = this.defaultErrorMessages[key] || `Error de validación: ${key}`;

      if (typeof error === 'object' && error !== null) {
        return this.interpolateErrorMessage(defaultMessage, error);
      }

      return defaultMessage;
    });
  }

  private interpolateErrorMessage(message: string, params: Record<string, unknown>): string {
    return message.replace(/{([^}]+)}/g, (_match, key) => {
      return key in params ? String(params[key]) : '';
    });
  }
}
