import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  
  
  /**
   * Validador para DNI argentino (7-8 dígitos)
   */
  dniValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío (usar required para eso)
      }
      
      const valid = /^[0-9]{7,8}$/.test(control.value);
      return valid ? null : { invalidDni: true };
    };
  }
  
  /**
   * Validador para teléfono argentino
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      // Formato: +54 9 11 1234-5678 o variaciones
      const valid = /^(\+?54|0)?\s?(\d{2,4}|\(?\d{2,4}\)?)\s?\d{4}[-]?\d{4}$/.test(control.value);
      return valid ? null : { invalidPhone: true };
    };
  }
  
  /**
   * Validador para coincidencia de contraseñas
   * @param passwordKey Nombre del campo de contraseña
   * @param confirmPasswordKey Nombre del campo de confirmación
   */
  passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) {
        return null;
      }
      
      const password = control.get(passwordKey)?.value;
      const confirmPassword = control.get(confirmPasswordKey)?.value;
      
      if (password === confirmPassword) {
        // Si coinciden, eliminar el error del control de confirmación
        const confirmControl = control.get(confirmPasswordKey);
        if (confirmControl?.hasError('passwordMismatch')) {
          const errors = { ...confirmControl.errors };
          delete errors['passwordMismatch'];
          confirmControl.setErrors(Object.keys(errors).length ? errors : null);
        }
        return null;
      } else {
        // Si no coinciden, establecer el error en el control de confirmación
        const confirmControl = control.get(confirmPasswordKey);
        if (confirmControl) {
          const errors = { 
            ...(confirmControl.errors || {}),
            passwordMismatch: true 
          };
          confirmControl.setErrors(errors);
        }
        return { passwordMismatch: true };
      }
    };
  }
  
  /**
   * Validador para fecha futura
   */
  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      const date = new Date(control.value);
      const now = new Date();
      
      // Ignorar la hora para comparar solo la fecha
      date.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      return date > now ? { futureDate: true } : null;
    };
  }
  
  /**
   * Validador para fecha pasada
   */
  pastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      const date = new Date(control.value);
      const now = new Date();
      
      // Ignorar la hora para comparar solo la fecha
      date.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      return date < now ? { pastDate: true } : null;
    };
  }
  
  /**
   * Validador para URL
   */
  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      try {
        const url = new URL(control.value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? null : { invalidUrl: true };
      } catch (e) {
        return { invalidUrl: true };
      }
    };
  }
  
  /**
   * Validador para edad mínima
   * @param minAge Edad mínima requerida
   */
  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      const birthDate = new Date(control.value);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age < minAge ? { minAge: { required: minAge, actual: age } } : null;
    };
  }
  
  /**
   * Validador para formato de nombre (sin números ni caracteres especiales)
   */
  nameFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío
      }
      
      const valid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(control.value);
      return valid ? null : { invalidName: true };
    };
  }
}
