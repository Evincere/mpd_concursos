import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
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

  /**
   * Validador mejorado para nombres con caracteres del español
   */
  spanishNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();

      // Verificar que solo contenga caracteres válidos
      const validChars = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(value);
      if (!validChars) {
        return { invalidSpanishName: { message: 'Solo se permiten letras, espacios, acentos, ñ, guiones y apostrofes' } };
      }

      // Verificar que no tenga espacios múltiples
      if (/\s{2,}/.test(value)) {
        return { multipleSpaces: { message: 'No se permiten espacios múltiples consecutivos' } };
      }

      // Verificar que no empiece o termine con espacios, guiones o apostrofes
      if (/^[\s'-]|[\s'-]$/.test(value)) {
        return { invalidNameFormat: { message: 'El nombre no puede empezar o terminar con espacios, guiones o apostrofes' } };
      }

      return null;
    };
  }

  /**
   * Validador para caracteres válidos en email
   */
  emailCharacterValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = /^[a-zA-Z0-9@._-]+$/.test(control.value);
      return valid ? null : { invalidEmailChars: { message: 'Solo se permiten letras, números, @, punto, guión y guión bajo' } };
    };
  }

  /**
   * Validador para caracteres válidos en teléfono
   */
  phoneCharacterValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = /^[0-9\s\-\(\)\+]+$/.test(control.value);
      return valid ? null : { invalidPhoneChars: { message: 'Solo se permiten números, espacios, guiones, paréntesis y signo más' } };
    };
  }

  /**
   * Validador mejorado para teléfono argentino
   */
  argentinePhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.replace(/\s/g, ''); // Remover espacios para validación

      // Patrones válidos para teléfonos argentinos
      const patterns = [
        /^\+54\d{10}$/, // +54 seguido de 10 dígitos
        /^54\d{10}$/, // 54 seguido de 10 dígitos
        /^\d{10}$/, // 10 dígitos (celular sin código de país)
        /^\d{8}$/, // 8 dígitos (teléfono fijo)
        /^0\d{10}$/, // 0 seguido de 10 dígitos
      ];

      const isValid = patterns.some(pattern => pattern.test(value));
      return isValid ? null : { invalidArgentinePhone: { message: 'Formato de teléfono argentino no válido' } };
    };
  }

  /**
   * Validador para caracteres válidos en DNI
   */
  dniCharacterValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = /^[0-9]+$/.test(control.value);
      return valid ? null : { invalidDniChars: { message: 'El DNI solo puede contener números' } };
    };
  }

  /**
   * Validador mejorado para DNI argentino
   */
  argentineDniValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString();

      // Verificar longitud (7-8 dígitos)
      if (!/^\d{7,8}$/.test(value)) {
        return { invalidArgentineDni: { message: 'El DNI debe tener entre 7 y 8 dígitos' } };
      }

      // Verificar que no sea una secuencia obvia
      if (/^(\d)\1+$/.test(value)) {
        return { obviousDni: { message: 'El DNI no puede ser una secuencia de números iguales' } };
      }

      return null;
    };
  }

  /**
   * Validador para fortaleza de contraseña
   */
  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value;
      const errors: any = {};

      // Longitud mínima
      if (value.length < 8) {
        errors.minLength = { message: 'La contraseña debe tener al menos 8 caracteres' };
      }

      // Al menos una letra minúscula
      if (!/[a-z]/.test(value)) {
        errors.lowercase = { message: 'La contraseña debe contener al menos una letra minúscula' };
      }

      // Al menos una letra mayúscula
      if (!/[A-Z]/.test(value)) {
        errors.uppercase = { message: 'La contraseña debe contener al menos una letra mayúscula' };
      }

      // Al menos un número
      if (!/\d/.test(value)) {
        errors.number = { message: 'La contraseña debe contener al menos un número' };
      }

      // Al menos un carácter especial
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.specialChar = { message: 'La contraseña debe contener al menos un carácter especial' };
      }

      // Verificar patrones comunes débiles
      const weakPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /admin/i
      ];

      if (weakPatterns.some(pattern => pattern.test(value))) {
        errors.weakPattern = { message: 'La contraseña contiene un patrón común y débil' };
      }

      return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
    };
  }

  /**
   * Validador para caracteres válidos en nombre de usuario
   */
  usernameCharacterValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = /^[a-zA-Z0-9._-]+$/.test(control.value);
      return valid ? null : { invalidUsernameChars: { message: 'Solo se permiten letras, números, punto, guión y guión bajo' } };
    };
  }

  /**
   * Validador para formato de CUIT argentino
   */
  cuitFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.replace(/\D/g, ''); // Remover no dígitos

      if (value.length !== 11) {
        return { invalidCuitLength: { message: 'El CUIT debe tener 11 dígitos' } };
      }

      // Validar dígito verificador
      const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;

      for (let i = 0; i < 10; i++) {
        sum += parseInt(value[i]) * weights[i];
      }

      const remainder = sum % 11;
      const checkDigit = remainder < 2 ? remainder : 11 - remainder;

      if (parseInt(value[10]) !== checkDigit) {
        return { invalidCuitChecksum: { message: 'El dígito verificador del CUIT no es válido' } };
      }

      return null;
    };
  }
}
