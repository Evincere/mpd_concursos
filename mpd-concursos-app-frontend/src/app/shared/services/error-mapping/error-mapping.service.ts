import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Tipos de error específicos para el mapeo
 */
export enum ErrorType {
  VALIDATION = 'validation',
  CONFLICT = 'conflict',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

/**
 * Severidad del error para determinar el estilo visual
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Estado de validación para errores de campo
 */
export enum ValidationStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  FAILED = 'failed'
}

/**
 * Interfaz para errores de campo específicos
 */
export interface FieldError {
  /** Campo afectado */
  field: string;
  /** Mensaje específico del error */
  message: string;
  /** Tipo de error */
  type: ErrorType;
  /** Estado actual de validación */
  status: ValidationStatus;
  /** Sugerencias específicas para este campo */
  suggestions?: string[];
  /** Indica si el error es crítico para el campo */
  critical: boolean;
}

/**
 * Interfaz para la información mapeada del error
 */
export interface MappedError {
  /** Tipo de error */
  type: ErrorType;
  /** Severidad del error */
  severity: ErrorSeverity;
  /** Título del error */
  title: string;
  /** Mensaje principal del error */
  message: string;
  /** Campo específico afectado (si aplica) */
  field?: string;
  /** Lista de errores de campo específicos */
  fieldErrors?: FieldError[];
  /** Sugerencias para resolver el error */
  suggestions?: string[];
  /** Código de error interno */
  code?: string;
  /** Indica si el error es recuperable */
  recoverable: boolean;
  /** Indica si hay múltiples errores */
  hasMultipleErrors?: boolean;
}

/**
 * Configuración de mapeo para errores específicos
 */
interface ErrorMappingConfig {
  [key: string]: {
    type: ErrorType;
    severity: ErrorSeverity;
    title: string;
    message: string;
    field?: string;
    suggestions?: string[];
    recoverable: boolean;
  };
}

/**
 * Servicio centralizado para mapear errores HTTP a mensajes específicos
 * con soporte para diseño glassmorphism y accesibilidad WCAG AA
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorMappingService {

  /**
   * Configuración de mapeo para errores específicos del backend
   */
  private readonly errorMappings: ErrorMappingConfig = {
    // Errores de conflicto (HTTP 409)
    'El nombre de usuario ya está en uso': {
      type: ErrorType.CONFLICT,
      severity: ErrorSeverity.MEDIUM,
      title: 'Nombre de usuario no disponible',
      message: 'Este nombre de usuario ya está registrado en el sistema.',
      field: 'username',
      suggestions: [
        'Intente con un nombre de usuario diferente',
        'Agregue números o caracteres especiales',
        'Use una combinación de su nombre y apellido'
      ],
      recoverable: true
    },
    'El email ya está registrado': {
      type: ErrorType.CONFLICT,
      severity: ErrorSeverity.MEDIUM,
      title: 'Correo electrónico ya registrado',
      message: 'Ya existe una cuenta asociada a este correo electrónico.',
      field: 'email',
      suggestions: [
        'Verifique si ya tiene una cuenta creada',
        'Use un correo electrónico diferente',
        'Intente recuperar su contraseña si olvidó sus datos'
      ],
      recoverable: true
    },
    'El usuario con dni': {
      type: ErrorType.CONFLICT,
      severity: ErrorSeverity.HIGH,
      title: 'DNI ya registrado',
      message: 'Este número de DNI ya está asociado a otra cuenta.',
      field: 'dni',
      suggestions: [
        'Verifique que el DNI ingresado sea correcto',
        'Contacte al administrador si cree que es un error',
        'Verifique si ya tiene una cuenta registrada'
      ],
      recoverable: false
    },
    'El CUIT ya está registrado': {
      type: ErrorType.CONFLICT,
      severity: ErrorSeverity.HIGH,
      title: 'CUIT ya registrado',
      message: 'Este número de CUIT ya está asociado a otra cuenta.',
      field: 'cuit',
      suggestions: [
        'Verifique que el CUIT ingresado sea correcto',
        'Contacte al administrador si cree que es un error'
      ],
      recoverable: false
    },

    // Errores de validación (HTTP 400)
    'La contraseña debe tener al menos 6 caracteres': {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      title: 'Contraseña muy corta',
      message: 'La contraseña debe contener al menos 6 caracteres.',
      field: 'password',
      suggestions: [
        'Use una combinación de letras, números y símbolos',
        'Evite contraseñas muy simples o predecibles',
        'Considere usar una frase de contraseña'
      ],
      recoverable: true
    },
    'El nombre es requerido': {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      title: 'Campo requerido',
      message: 'El nombre es un campo obligatorio.',
      field: 'firstName',
      suggestions: ['Complete este campo para continuar'],
      recoverable: true
    },
    'El apellido es requerido': {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      title: 'Campo requerido',
      message: 'El apellido es un campo obligatorio.',
      field: 'lastName',
      suggestions: ['Complete este campo para continuar'],
      recoverable: true
    }
  };

  /**
   * Mapea un error HTTP a información específica y contextual
   * @param error Error HTTP recibido del backend
   * @returns Información mapeada del error
   */
  mapHttpError(error: HttpErrorResponse): MappedError {
    // Extraer información del error
    const errorMessage = this.extractErrorMessage(error);
    const statusCode = error.status;

    // Verificar si hay múltiples errores de campo
    const fieldErrors = this.extractFieldErrors(error);

    if (fieldErrors.length > 0) {
      return this.createMultiFieldError(fieldErrors, statusCode);
    }

    // Buscar mapeo específico
    const mappedConfig = this.findErrorMapping(errorMessage);

    if (mappedConfig) {
      return {
        ...mappedConfig,
        code: `HTTP_${statusCode}`
      };
    }

    // Mapeo por código de estado HTTP
    return this.mapByHttpStatus(statusCode, errorMessage);
  }

  /**
   * Extrae errores de campo específicos del HttpErrorResponse
   */
  private extractFieldErrors(error: HttpErrorResponse): FieldError[] {
    const fieldErrors: FieldError[] = [];

    // Verificar si hay fieldErrors en la respuesta
    if (error.error?.fieldErrors && Array.isArray(error.error.fieldErrors)) {
      error.error.fieldErrors.forEach((fieldError: any) => {
        if (fieldError.field && fieldError.message) {
          fieldErrors.push(this.createFieldError(fieldError.field, fieldError.message));
        }
      });
    }

    // Verificar errores específicos conocidos
    const errorMessage = this.extractErrorMessage(error);
    const mappedConfig = this.findErrorMapping(errorMessage);

    if (mappedConfig && mappedConfig.field) {
      fieldErrors.push(this.createFieldError(mappedConfig.field, mappedConfig.message, mappedConfig.type));
    }

    return fieldErrors;
  }

  /**
   * Crea un error de campo específico
   */
  private createFieldError(field: string, message: string, type: ErrorType = ErrorType.VALIDATION): FieldError {
    const fieldConfig = this.getFieldErrorConfig(field, message);

    return {
      field,
      message: fieldConfig.message || message,
      type: fieldConfig.type || type,
      status: ValidationStatus.PENDING,
      suggestions: fieldConfig.suggestions,
      critical: fieldConfig.critical || false
    };
  }

  /**
   * Obtiene configuración específica para errores de campo
   */
  private getFieldErrorConfig(field: string, message: string): Partial<FieldError> {
    const fieldConfigs: Record<string, Partial<FieldError>> = {
      username: {
        type: ErrorType.CONFLICT,
        suggestions: [
          'Intente con un nombre de usuario diferente',
          'Agregue números o caracteres especiales',
          'Use una combinación de su nombre y apellido'
        ],
        critical: false
      },
      email: {
        type: ErrorType.CONFLICT,
        suggestions: [
          'Verifique si ya tiene una cuenta creada',
          'Use un correo electrónico diferente',
          'Intente recuperar su contraseña si olvidó sus datos'
        ],
        critical: false
      },
      dni: {
        type: ErrorType.CONFLICT,
        suggestions: [
          'Verifique que el DNI ingresado sea correcto',
          'Contacte al administrador si cree que es un error',
          'Verifique si ya tiene una cuenta registrada'
        ],
        critical: true
      },
      password: {
        type: ErrorType.VALIDATION,
        suggestions: [
          'Use al menos 8 caracteres',
          'Incluya mayúsculas, minúsculas y números',
          'Evite usar información personal'
        ],
        critical: false
      },
      confirmPassword: {
        type: ErrorType.VALIDATION,
        suggestions: [
          'Asegúrese de que coincida con la contraseña',
          'Verifique que no haya errores de tipeo'
        ],
        critical: false
      }
    };

    return fieldConfigs[field] || { type: ErrorType.VALIDATION, critical: false };
  }

  /**
   * Crea un error con múltiples campos afectados
   */
  private createMultiFieldError(fieldErrors: FieldError[], statusCode: number): MappedError {
    const criticalErrors = fieldErrors.filter(fe => fe.critical);
    const hasMultipleErrors = fieldErrors.length > 1;

    return {
      type: criticalErrors.length > 0 ? ErrorType.CONFLICT : ErrorType.VALIDATION,
      severity: criticalErrors.length > 0 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      title: hasMultipleErrors ? 'Múltiples errores de validación' : 'Error de validación',
      message: this.generateMultiErrorMessage(fieldErrors),
      fieldErrors,
      hasMultipleErrors,
      suggestions: this.generateMultiErrorSuggestions(fieldErrors),
      recoverable: true,
      code: `HTTP_${statusCode}`
    };
  }

  /**
   * Genera mensaje para múltiples errores
   */
  private generateMultiErrorMessage(fieldErrors: FieldError[]): string {
    if (fieldErrors.length === 1) {
      return fieldErrors[0].message;
    }

    const criticalErrors = fieldErrors.filter(fe => fe.critical);
    if (criticalErrors.length > 0) {
      return `Se encontraron ${fieldErrors.length} errores que impiden completar el registro. Algunos requieren atención inmediata.`;
    }

    return `Se encontraron ${fieldErrors.length} errores en el formulario. Por favor, corrija los campos marcados.`;
  }

  /**
   * Genera sugerencias para múltiples errores
   */
  private generateMultiErrorSuggestions(fieldErrors: FieldError[]): string[] {
    const suggestions = [
      'Revise los campos marcados en rojo',
      'Complete la información requerida',
      'Verifique que los datos sean correctos'
    ];

    const criticalErrors = fieldErrors.filter(fe => fe.critical);
    if (criticalErrors.length > 0) {
      suggestions.unshift('Algunos errores requieren contactar al administrador');
    }

    return suggestions;
  }

  /**
   * Extrae el mensaje de error del HttpErrorResponse
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.message) {
      return error.message;
    }

    return 'Error desconocido';
  }

  /**
   * Busca un mapeo específico para el mensaje de error
   */
  private findErrorMapping(errorMessage: string): ErrorMappingConfig[string] | null {
    // Búsqueda exacta
    if (this.errorMappings[errorMessage]) {
      return this.errorMappings[errorMessage];
    }

    // Búsqueda parcial para mensajes que contienen variables
    for (const [key, config] of Object.entries(this.errorMappings)) {
      if (errorMessage.includes(key)) {
        return config;
      }
    }

    return null;
  }

  /**
   * Mapea errores basándose en el código de estado HTTP
   */
  private mapByHttpStatus(statusCode: number, message: string): MappedError {
    switch (statusCode) {
      case 409: // Conflict
        return {
          type: ErrorType.CONFLICT,
          severity: ErrorSeverity.MEDIUM,
          title: 'Conflicto de datos',
          message: message || 'Los datos ingresados entran en conflicto con información existente.',
          suggestions: ['Verifique los datos ingresados', 'Intente con información diferente'],
          recoverable: true,
          code: 'HTTP_409'
        };

      case 400: // Bad Request
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          title: 'Datos inválidos',
          message: message || 'Los datos ingresados no son válidos.',
          suggestions: ['Revise la información ingresada', 'Complete todos los campos requeridos'],
          recoverable: true,
          code: 'HTTP_400'
        };

      case 401: // Unauthorized
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          title: 'Error de autenticación',
          message: message || 'Las credenciales proporcionadas no son válidas.',
          suggestions: ['Verifique su usuario y contraseña', 'Intente iniciar sesión nuevamente'],
          recoverable: true,
          code: 'HTTP_401'
        };

      case 403: // Forbidden
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          title: 'Acceso denegado',
          message: message || 'No tiene permisos para realizar esta acción.',
          suggestions: ['Contacte al administrador del sistema'],
          recoverable: false,
          code: 'HTTP_403'
        };

      case 500: // Internal Server Error
        return {
          type: ErrorType.SERVER,
          severity: ErrorSeverity.CRITICAL,
          title: 'Error del servidor',
          message: 'Ha ocurrido un error interno en el servidor.',
          suggestions: ['Intente nuevamente en unos momentos', 'Contacte al soporte técnico si persiste'],
          recoverable: true,
          code: 'HTTP_500'
        };

      case 0: // Network Error
        return {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          title: 'Error de conexión',
          message: 'No se pudo establecer conexión con el servidor.',
          suggestions: ['Verifique su conexión a internet', 'Intente nuevamente en unos momentos'],
          recoverable: true,
          code: 'NETWORK_ERROR'
        };

      default:
        return {
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          title: 'Error inesperado',
          message: message || 'Ha ocurrido un error inesperado.',
          suggestions: ['Intente nuevamente', 'Contacte al soporte si el problema persiste'],
          recoverable: true,
          code: `HTTP_${statusCode}`
        };
    }
  }

  /**
   * Obtiene el color asociado a un tipo de error para el diseño glassmorphism
   */
  getErrorColor(type: ErrorType): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'var(--color-warning)'; // #f59e0b
      case ErrorType.CONFLICT:
        return 'var(--color-danger)'; // #ef4444
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return 'var(--color-danger)'; // #ef4444
      case ErrorType.SERVER:
      case ErrorType.NETWORK:
        return 'var(--color-danger)'; // #ef4444
      default:
        return 'var(--color-warning)'; // #f59e0b
    }
  }

  /**
   * Obtiene el icono asociado a un tipo de error
   */
  getErrorIcon(type: ErrorType): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'warning';
      case ErrorType.CONFLICT:
        return 'error';
      case ErrorType.AUTHENTICATION:
        return 'lock';
      case ErrorType.AUTHORIZATION:
        return 'block';
      case ErrorType.SERVER:
        return 'error_outline';
      case ErrorType.NETWORK:
        return 'wifi_off';
      default:
        return 'info';
    }
  }

  /**
   * Actualiza el estado de un error de campo específico
   */
  updateFieldErrorStatus(mappedError: MappedError, field: string, status: ValidationStatus): MappedError {
    if (!mappedError.fieldErrors) {
      return mappedError;
    }

    const updatedFieldErrors = mappedError.fieldErrors.map(fieldError => {
      if (fieldError.field === field) {
        return { ...fieldError, status };
      }
      return fieldError;
    });

    return {
      ...mappedError,
      fieldErrors: updatedFieldErrors
    };
  }

  /**
   * Verifica si todos los errores de campo han sido resueltos
   */
  areAllFieldErrorsResolved(mappedError: MappedError): boolean {
    if (!mappedError.fieldErrors || mappedError.fieldErrors.length === 0) {
      return true;
    }

    return mappedError.fieldErrors.every(fieldError =>
      fieldError.status === ValidationStatus.RESOLVED
    );
  }

  /**
   * Obtiene errores pendientes de resolución
   */
  getPendingFieldErrors(mappedError: MappedError): FieldError[] {
    if (!mappedError.fieldErrors) {
      return [];
    }

    return mappedError.fieldErrors.filter(fieldError =>
      fieldError.status === ValidationStatus.PENDING
    );
  }

  /**
   * Obtiene el icono para el estado de validación
   */
  getValidationStatusIcon(status: ValidationStatus): string {
    switch (status) {
      case ValidationStatus.PENDING:
        return 'error';
      case ValidationStatus.RESOLVED:
        return 'check_circle';
      case ValidationStatus.FAILED:
        return 'cancel';
      default:
        return 'help';
    }
  }

  /**
   * Obtiene el color para el estado de validación
   */
  getValidationStatusColor(status: ValidationStatus): string {
    switch (status) {
      case ValidationStatus.PENDING:
        return 'var(--color-danger)';
      case ValidationStatus.RESOLVED:
        return 'var(--color-success)';
      case ValidationStatus.FAILED:
        return 'var(--color-danger)';
      default:
        return 'var(--color-warning)';
    }
  }
}
