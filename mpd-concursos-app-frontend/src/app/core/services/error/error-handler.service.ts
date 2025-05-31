import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ErrorDialogService } from '@shared/components/error-dialog/error-dialog.service';

/**
 * Tipo de error
 */
export enum ErrorType {
  /**
   * Error de validación (400)
   */
  VALIDATION = 'VALIDATION',

  /**
   * Error de autenticación (401)
   */
  AUTHENTICATION = 'AUTHENTICATION',

  /**
   * Error de autorización (403)
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * Error de recurso no encontrado (404)
   */
  NOT_FOUND = 'NOT_FOUND',

  /**
   * Error de conflicto (409)
   */
  CONFLICT = 'CONFLICT',

  /**
   * Error de servidor (500)
   */
  SERVER = 'SERVER',

  /**
   * Error de conexión
   */
  CONNECTION = 'CONNECTION',

  /**
   * Error desconocido
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interfaz para errores de la aplicación
 */
export interface AppError {
  /**
   * Tipo de error
   */
  type: ErrorType;

  /**
   * Mensaje de error
   */
  message: string;

  /**
   * Error original
   */
  originalError?: any;

  /**
   * Detalles del error
   */
  details?: Record<string, any>;

  /**
   * Código de error
   */
  code?: string;

  /**
   * Timestamp del error
   */
  timestamp?: number;
}

/**
 * Servicio para manejar errores de la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  /**
   * Subject para errores globales
   */
  private errorSubject = new Subject<AppError>();

  /**
   * Observable para errores globales
   */
  readonly errors$ = this.errorSubject.asObservable();

  /**
   * Constructor
   */
  constructor(private errorDialogService: ErrorDialogService) {}

  /**
   * Maneja un error HTTP
   * @param error Error HTTP
   * @returns Error de la aplicación
   */
  handleHttpError(error: HttpErrorResponse): AppError {
    let appError: AppError;

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      appError = {
        type: ErrorType.CONNECTION,
        message: 'Error de conexión. Por favor, verifique su conexión a internet.',
        originalError: error,
        timestamp: Date.now()
      };
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          appError = {
            type: ErrorType.VALIDATION,
            message: this.getValidationErrorMessage(error),
            originalError: error,
            details: this.extractValidationDetails(error),
            timestamp: Date.now()
          };
          break;
        case 401:
          appError = {
            type: ErrorType.AUTHENTICATION,
            message: 'No está autenticado. Por favor, inicie sesión.',
            originalError: error,
            timestamp: Date.now()
          };
          break;
        case 403:
          // Verificar si es un error de cuenta bloqueada
          if (this.isBlockedAccountError(error)) {
            // Mostrar diálogo específico para cuenta bloqueada
            this.errorDialogService.showBlockedAccountError();
            appError = {
              type: ErrorType.AUTHORIZATION,
              message: 'Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.',
              originalError: error,
              timestamp: Date.now()
            };
          } else {
            appError = {
              type: ErrorType.AUTHORIZATION,
              message: 'No tiene permisos para realizar esta acción.',
              originalError: error,
              timestamp: Date.now()
            };
          }
          break;
        case 404:
          appError = {
            type: ErrorType.NOT_FOUND,
            message: 'El recurso solicitado no existe.',
            originalError: error,
            timestamp: Date.now()
          };
          break;
        case 409:
          appError = {
            type: ErrorType.CONFLICT,
            message: 'La operación no pudo completarse debido a un conflicto con el estado actual del recurso.',
            originalError: error,
            timestamp: Date.now()
          };
          break;
        case 500:
          appError = {
            type: ErrorType.SERVER,
            message: 'Error interno del servidor. Por favor, intente nuevamente más tarde.',
            originalError: error,
            timestamp: Date.now()
          };
          break;
        default:
          appError = {
            type: ErrorType.UNKNOWN,
            message: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
            originalError: error,
            timestamp: Date.now()
          };
      }
    }

    // Emitir el error global
    this.errorSubject.next(appError);

    return appError;
  }

  /**
   * Maneja un error de la aplicación
   * @param error Error de la aplicación o mensaje de error
   * @param type Tipo de error
   * @returns Error de la aplicación
   */
  handleAppError(error: string | Error | AppError, type: ErrorType = ErrorType.UNKNOWN): AppError {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = {
        type,
        message: error,
        timestamp: Date.now()
      };
    } else if (error instanceof Error) {
      appError = {
        type,
        message: error.message,
        originalError: error,
        timestamp: Date.now()
      };
    } else {
      appError = {
        ...error,
        timestamp: Date.now()
      };
    }

    // Emitir el error global
    this.errorSubject.next(appError);

    return appError;
  }

  /**
   * Obtiene el mensaje de error de validación
   * @param error Error HTTP
   * @returns Mensaje de error
   */
  private getValidationErrorMessage(error: HttpErrorResponse): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }

    if (error.error && error.error.error) {
      return error.error.error;
    }

    if (error.message) {
      return error.message;
    }

    return 'Error de validación. Por favor, verifique los datos ingresados.';
  }

  /**
   * Extrae los detalles de validación
   * @param error Error HTTP
   * @returns Detalles de validación
   */
  private extractValidationDetails(error: HttpErrorResponse): Record<string, any> {
    if (error.error && error.error.errors) {
      return error.error.errors;
    }

    if (error.error && error.error.fieldErrors) {
      return error.error.fieldErrors;
    }

    return {};
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
