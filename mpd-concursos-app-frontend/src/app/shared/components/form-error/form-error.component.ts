import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="shouldShowErrors()" class="error-container">
      <div *ngFor="let error of errorMessages" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      margin-top: 0.25rem;
      font-size: 0.85rem;
      color: var(--color-error, #F44336);
    }
    
    .error-message {
      display: flex;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    
    .error-message i {
      margin-right: 0.5rem;
      font-size: 0.9rem;
    }
    
    @media (prefers-color-scheme: dark) {
      .error-container {
        color: var(--color-error-dark, #EF5350);
      }
    }
  `]
})
export class FormErrorComponent implements OnChanges {
  /**
   * Control de formulario a validar
   */
  @Input() control: AbstractControl | null = null;
  
  /**
   * Si se deben mostrar los errores cuando el control está pristine
   */
  @Input() showErrorsWhenPristine = false;
  
  /**
   * Si se deben mostrar los errores cuando el control está untouched
   */
  @Input() showErrorsWhenUntouched = false;
  
  /**
   * Mensajes de error personalizados
   */
  @Input() customMessages: { [key: string]: string } = {};
  
  /**
   * Mensajes de error a mostrar
   */
  errorMessages: string[] = [];
  
  /**
   * Detecta cambios en las propiedades de entrada
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['control'] || changes['customMessages']) {
      this.updateErrorMessages();
    }
  }
  
  /**
   * Determina si se deben mostrar los errores
   */
  shouldShowErrors(): boolean {
    if (!this.control) {
      return false;
    }
    
    const { dirty, touched, errors, invalid } = this.control;
    
    return invalid && 
           errors !== null && 
           ((dirty || this.showErrorsWhenPristine) && 
           (touched || this.showErrorsWhenUntouched));
  }
  
  /**
   * Actualiza los mensajes de error
   */
  updateErrorMessages(): void {
    this.errorMessages = [];
    
    if (!this.control || !this.control.errors) {
      return;
    }
    
    const errors = this.control.errors;
    
    for (const errorKey in errors) {
      if (errors.hasOwnProperty(errorKey)) {
        const errorValue = errors[errorKey];
        
        // Primero buscar en mensajes personalizados
        if (this.customMessages && this.customMessages[errorKey]) {
          this.errorMessages.push(this.customMessages[errorKey]);
          continue;
        }
        
        // Luego buscar mensaje en el error
        if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
          this.errorMessages.push(errorValue.message);
          continue;
        }
        
        // Finalmente, usar mensajes predeterminados
        switch (errorKey) {
          case 'required':
            this.errorMessages.push('Este campo es obligatorio');
            break;
          case 'minlength':
            const minLength = errorValue.requiredLength;
            this.errorMessages.push(`Debe tener al menos ${minLength} caracteres`);
            break;
          case 'maxlength':
            const maxLength = errorValue.requiredLength;
            this.errorMessages.push(`No puede tener más de ${maxLength} caracteres`);
            break;
          case 'email':
            this.errorMessages.push('Debe ser un correo electrónico válido');
            break;
          case 'pattern':
            this.errorMessages.push('El formato no es válido');
            break;
          case 'min':
            const min = errorValue.min;
            this.errorMessages.push(`El valor mínimo es ${min}`);
            break;
          case 'max':
            const max = errorValue.max;
            this.errorMessages.push(`El valor máximo es ${max}`);
            break;
          default:
            this.errorMessages.push(`Error de validación: ${errorKey}`);
        }
      }
    }
  }
}
