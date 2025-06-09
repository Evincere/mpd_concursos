import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap } from 'rxjs/operators';

import { AdminUsersService } from '@core/services/admin/admin-users.service';
import {
  USERNAME_VALIDATION,
  EMAIL_VALIDATION,
  DNI_VALIDATION,
  CUIT_VALIDATION,
  NAME_VALIDATION,
  PASSWORD_VALIDATION,
  PHONE_VALIDATION,
  ADDRESS_VALIDATION
} from './user-validation.constants';
import { ROLES_VALIDATION } from './validation-messages';

/**
 * Servicio para validar datos de usuario
 *
 * Este servicio proporciona validadores para los formularios de usuario
 * utilizando las constantes de validación definidas.
 */
@Injectable({
  providedIn: 'root'
})
export class UserValidationService {
  constructor(
    private usersService: AdminUsersService,
    private loggingService: LoggingService
  ) {}

  /**
   * Validador para el nombre de usuario
   */
  usernameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < USERNAME_VALIDATION.MIN_LENGTH) {
        errors['minlength'] = {
          requiredLength: USERNAME_VALIDATION.MIN_LENGTH,
          actualLength: value.length,
          message: USERNAME_VALIDATION.MIN_LENGTH_MESSAGE
        };
      }

      if (value.length > USERNAME_VALIDATION.MAX_LENGTH) {
        errors['maxlength'] = {
          requiredLength: USERNAME_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: USERNAME_VALIDATION.MAX_LENGTH_MESSAGE
        };
      }

      if (!USERNAME_VALIDATION.PATTERN.test(value)) {
        errors['pattern'] = {
          requiredPattern: USERNAME_VALIDATION.PATTERN.toString(),
          actualValue: value,
          message: USERNAME_VALIDATION.PATTERN_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador asíncrono para verificar si un nombre de usuario ya existe
   */
  usernameExistsValidator(excludeUsername?: string): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;

      if (!value || (excludeUsername && value === excludeUsername)) {
        return of(null);
      }

      return of(null).pipe(
        debounceTime(300),
        switchMap(() => this.usersService.checkUsernameExists(value)),
        map(exists => exists ? { usernameExists: { message: USERNAME_VALIDATION.ALREADY_EXISTS_MESSAGE } } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador para el correo electrónico
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length > EMAIL_VALIDATION.MAX_LENGTH) {
        errors['maxlength'] = {
          requiredLength: EMAIL_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: EMAIL_VALIDATION.MAX_LENGTH_MESSAGE
        };
      }

      if (!EMAIL_VALIDATION.PATTERN.test(value)) {
        errors['email'] = {
          message: EMAIL_VALIDATION.INVALID_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador asíncrono para verificar si un correo electrónico ya existe
   */
  emailExistsValidator(excludeEmail?: string): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;

      if (!value || (excludeEmail && value === excludeEmail)) {
        return of(null);
      }

      return of(null).pipe(
        debounceTime(300),
        switchMap(() => this.usersService.checkEmailExists(value)),
        map(exists => exists ? { emailExists: { message: EMAIL_VALIDATION.ALREADY_EXISTS_MESSAGE } } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador para el DNI
   */
  dniValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < DNI_VALIDATION.MIN_LENGTH || value.length > DNI_VALIDATION.MAX_LENGTH) {
        errors['length'] = {
          minLength: DNI_VALIDATION.MIN_LENGTH,
          maxLength: DNI_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: DNI_VALIDATION.LENGTH_MESSAGE
        };
      }

      if (!DNI_VALIDATION.PATTERN.test(value)) {
        errors['pattern'] = {
          requiredPattern: DNI_VALIDATION.PATTERN.toString(),
          actualValue: value,
          message: DNI_VALIDATION.INVALID_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador asíncrono para verificar si un DNI ya existe
   */
  dniExistsValidator(excludeDni?: string): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;

      if (!value || (excludeDni && value === excludeDni)) {
        return of(null);
      }

      return of(null).pipe(
        debounceTime(300),
        switchMap(() => this.usersService.checkDniExists(value)),
        map(exists => exists ? { dniExists: { message: DNI_VALIDATION.ALREADY_EXISTS_MESSAGE } } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador para el CUIT
   */
  cuitValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length !== CUIT_VALIDATION.LENGTH) {
        errors['length'] = {
          requiredLength: CUIT_VALIDATION.LENGTH,
          actualLength: value.length,
          message: CUIT_VALIDATION.LENGTH_MESSAGE
        };
      }

      if (!CUIT_VALIDATION.PATTERN.test(value)) {
        errors['pattern'] = {
          requiredPattern: CUIT_VALIDATION.PATTERN.toString(),
          actualValue: value,
          message: CUIT_VALIDATION.INVALID_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador para el nombre y apellido
   */
  nameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < NAME_VALIDATION.MIN_LENGTH) {
        errors['minlength'] = {
          requiredLength: NAME_VALIDATION.MIN_LENGTH,
          actualLength: value.length,
          message: NAME_VALIDATION.MIN_LENGTH_MESSAGE
        };
      }

      if (value.length > NAME_VALIDATION.MAX_LENGTH) {
        errors['maxlength'] = {
          requiredLength: NAME_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: NAME_VALIDATION.MAX_LENGTH_MESSAGE
        };
      }

      if (!NAME_VALIDATION.PATTERN.test(value)) {
        errors['pattern'] = {
          requiredPattern: NAME_VALIDATION.PATTERN.toString(),
          actualValue: value,
          message: NAME_VALIDATION.PATTERN_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador para la contraseña
   */
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < PASSWORD_VALIDATION.MIN_LENGTH) {
        errors['minlength'] = {
          requiredLength: PASSWORD_VALIDATION.MIN_LENGTH,
          actualLength: value.length,
          message: PASSWORD_VALIDATION.MIN_LENGTH_MESSAGE
        };
      }

      if (value.length > PASSWORD_VALIDATION.MAX_LENGTH) {
        errors['maxlength'] = {
          requiredLength: PASSWORD_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: PASSWORD_VALIDATION.MAX_LENGTH_MESSAGE
        };
      }

      if (!PASSWORD_VALIDATION.UPPERCASE_PATTERN.test(value)) {
        errors['uppercase'] = {
          message: PASSWORD_VALIDATION.UPPERCASE_MESSAGE
        };
      }

      if (!PASSWORD_VALIDATION.LOWERCASE_PATTERN.test(value)) {
        errors['lowercase'] = {
          message: PASSWORD_VALIDATION.LOWERCASE_MESSAGE
        };
      }

      if (!PASSWORD_VALIDATION.NUMBER_PATTERN.test(value)) {
        errors['number'] = {
          message: PASSWORD_VALIDATION.NUMBER_MESSAGE
        };
      }

      if (!PASSWORD_VALIDATION.SPECIAL_CHAR_PATTERN.test(value)) {
        errors['specialChar'] = {
          message: PASSWORD_VALIDATION.SPECIAL_CHAR_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador para confirmar contraseña
   */
  passwordMatchValidator(passwordControlName: string, confirmPasswordControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const form = formGroup as FormGroup;
      const passwordControl = form.get(passwordControlName);
      const confirmPasswordControl = form.get(confirmPasswordControlName);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {
        const errors = { passwordMismatch: { message: 'Las contraseñas no coinciden' } };
        confirmPasswordControl.setErrors(errors);
        return errors;
      } else {
        // Solo eliminar el error de passwordMismatch, mantener otros errores
        const currentErrors = confirmPasswordControl.errors;
        if (currentErrors) {
          const { passwordMismatch, ...otherErrors } = currentErrors;
          confirmPasswordControl.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
        }
        return null;
      }
    };
  }

  /**
   * Validador para el teléfono
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < PHONE_VALIDATION.MIN_LENGTH || value.length > PHONE_VALIDATION.MAX_LENGTH) {
        errors['length'] = {
          minLength: PHONE_VALIDATION.MIN_LENGTH,
          maxLength: PHONE_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: PHONE_VALIDATION.LENGTH_MESSAGE
        };
      }

      if (!PHONE_VALIDATION.PATTERN.test(value)) {
        errors['pattern'] = {
          requiredPattern: PHONE_VALIDATION.PATTERN.toString(),
          actualValue: value,
          message: PHONE_VALIDATION.INVALID_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador para la dirección
   */
  addressValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      if (value.length < ADDRESS_VALIDATION.MIN_LENGTH) {
        errors['minlength'] = {
          requiredLength: ADDRESS_VALIDATION.MIN_LENGTH,
          actualLength: value.length,
          message: ADDRESS_VALIDATION.MIN_LENGTH_MESSAGE
        };
      }

      if (value.length > ADDRESS_VALIDATION.MAX_LENGTH) {
        errors['maxlength'] = {
          requiredLength: ADDRESS_VALIDATION.MAX_LENGTH,
          actualLength: value.length,
          message: ADDRESS_VALIDATION.MAX_LENGTH_MESSAGE
        };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador para los roles
   */
  rolesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value || !Array.isArray(value) || value.length === 0) {
        return { required: { message: ROLES_VALIDATION.REQUIRED_MESSAGE } };
      }

      return null;
    };
  }
}
