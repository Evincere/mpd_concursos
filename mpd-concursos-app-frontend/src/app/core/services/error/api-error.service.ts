import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ErrorDialogService } from '@shared/components/error-dialog/error-dialog.service';

/**
 * Interfaz para los errores de validación de la API
 */
export interface ApiValidationError {
  /** Código de error */
  code: string;
  /** Mensaje de error */
  message: string;
  /** Campo al que se refiere el error */
  field?: string;
  /** Detalles adicionales del error */
  details?: Record<string, string[]>;
}

/**
 * Servicio para manejar errores de la API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {
  constructor(
    private notificationService: CustomNotificationService,
    private errorDialogService: ErrorDialogService
  ) {}

  /**
   * Maneja un error HTTP y lo convierte en un mensaje de error amigable
   * @param error Error HTTP
   * @returns Observable con el error
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = this.handleBadRequestError(error);
          break;
        case 401:
          errorMessage = 'No está autorizado para realizar esta acción. Por favor, inicie sesión nuevamente.';
          break;
        case 403:
          // Verificar si es un error de cuenta bloqueada
          if (this.isBlockedAccountError(error)) {
            // Mostrar diálogo específico para cuenta bloqueada
            this.errorDialogService.showBlockedAccountError();
            errorMessage = 'Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.';
          } else {
            errorMessage = 'No tiene permisos para realizar esta acción.';
            // Mostrar diálogo de error de autorización
            this.errorDialogService.showAuthorizationError(errorMessage);
          }
          break;
        case 404:
          errorMessage = 'El recurso solicitado no existe.';
          break;
        case 409:
          errorMessage = 'La operación no pudo completarse debido a un conflicto con el estado actual del recurso.';
          break;
        case 422:
          errorMessage = this.handleValidationError(error);
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.';
          break;
        case 503:
          errorMessage = 'El servicio no está disponible en este momento. Por favor, inténtelo de nuevo más tarde.';
          break;
        default:
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión a Internet.';
          } else {
            errorMessage = `Error ${error.status}: ${error.message}`;
          }
      }
    }

    // Mostrar notificación de error solo si no es un error 403 (ya que usamos diálogo para esos)
    if (error.status !== 403) {
      this.notificationService.error(errorMessage);
    }

    // Devolver el error para que pueda ser manejado por el componente
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Maneja un error de solicitud incorrecta (400)
   * @param error Error HTTP
   * @returns Mensaje de error
   */
  private handleBadRequestError(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object') {
      if ('message' in error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }

      if ('error' in error.error && typeof error.error.error === 'string') {
        return error.error.error;
      }
    }

    return 'La solicitud no pudo ser procesada. Por favor, verifique los datos ingresados.';
  }

  /**
   * Maneja un error de validación (422)
   * @param error Error HTTP
   * @returns Mensaje de error
   */
  private handleValidationError(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object') {
      if ('message' in error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }

      if ('errors' in error.error && Array.isArray(error.error.errors)) {
        const errors = error.error.errors as ApiValidationError[];
        if (errors.length > 0) {
          return errors[0].message;
        }
      }

      if ('details' in error.error && typeof error.error.details === 'object') {
        const details = error.error.details as Record<string, string[]>;
        const firstField = Object.keys(details)[0];
        if (firstField && Array.isArray(details[firstField]) && details[firstField].length > 0) {
          return details[firstField][0];
        }
      }
    }

    return 'Los datos proporcionados no son válidos. Por favor, verifique la información ingresada.';
  }

  /**
   * Aplica errores de validación de la API a un formulario
   * @param form Formulario
   * @param error Error HTTP
   */
  applyValidationErrorsToForm(form: FormGroup, error: HttpErrorResponse): void {
    if (!error.error || typeof error.error !== 'object') {
      return;
    }

    // Manejar errores en formato { details: { field: [error1, error2] } }
    if ('details' in error.error && typeof error.error.details === 'object') {
      const details = error.error.details as Record<string, string[]>;

      Object.keys(details).forEach(field => {
        const control = form.get(field);
        if (control) {
          const errors = details[field];
          if (Array.isArray(errors) && errors.length > 0) {
            const validationErrors = { apiError: { message: errors[0] } };
            control.setErrors(validationErrors);
            control.markAsTouched();
          }
        }
      });
    }

    // Manejar errores en formato { errors: [{ field: 'field', message: 'message' }] }
    if ('errors' in error.error && Array.isArray(error.error.errors)) {
      const errors = error.error.errors as ApiValidationError[];

      errors.forEach(err => {
        if (err.field) {
          const control = form.get(err.field);
          if (control) {
            const validationErrors = { apiError: { message: err.message } };
            control.setErrors(validationErrors);
            control.markAsTouched();
          }
        }
      });
    }
  }

  /**
   * Determina si un error HTTP es un error de cuenta bloqueada
   * @param error Error HTTP
   * @returns true si es un error de cuenta bloqueada, false en caso contrario
   */
  private isBlockedAccountError(error: HttpErrorResponse): boolean {
    // Verificar si el error contiene información específica de cuenta bloqueada
    if (error.error) {
      // Verificar si el error tiene un campo 'error' con valor 'Cuenta bloqueada'
      if (error.error.error === 'Cuenta bloqueada' ||
          error.error.error === 'Acceso Denegado') {
        return true;
      }

      // Verificar si el mensaje contiene texto relacionado con bloqueo
      if (error.error.message && typeof error.error.message === 'string') {
        const message = error.error.message.toLowerCase();
        return message.includes('bloqueada') ||
               message.includes('blocked') ||
               message.includes('no tiene permisos');
      }
    }

    // Verificar si la URL está relacionada con autenticación
    if (error.url && error.url.includes('/auth/login')) {
      return true;
    }

    return false;
  }
}
