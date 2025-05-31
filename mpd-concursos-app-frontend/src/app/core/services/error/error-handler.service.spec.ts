import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ErrorHandlerService, ErrorType, AppError } from './error-handler.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleHttpError', () => {
    it('should handle client-side error', () => {
      const errorEvent = new ErrorEvent('Network error', { message: 'Failed to connect' });
      const httpError = new HttpErrorResponse({
        error: errorEvent,
        status: 0,
        statusText: 'Unknown Error'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.CONNECTION);
      expect(appError.message).toContain('Error de conexión');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 400 validation error', () => {
      const httpError = new HttpErrorResponse({
        error: {
          message: 'Validation failed',
          errors: {
            email: 'Invalid email format'
          }
        },
        status: 400,
        statusText: 'Bad Request'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.message).toBe('Validation failed');
      expect(appError.details).toEqual({ email: 'Invalid email format' });
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 401 authentication error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.AUTHENTICATION);
      expect(appError.message).toContain('No está autenticado');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 403 authorization error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Forbidden' },
        status: 403,
        statusText: 'Forbidden'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.AUTHORIZATION);
      expect(appError.message).toContain('No tiene permisos');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 404 not found error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Not Found' },
        status: 404,
        statusText: 'Not Found'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.NOT_FOUND);
      expect(appError.message).toContain('no existe');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 409 conflict error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Conflict' },
        status: 409,
        statusText: 'Conflict'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.CONFLICT);
      expect(appError.message).toContain('conflicto');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle 500 server error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Internal Server Error' },
        status: 500,
        statusText: 'Internal Server Error'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.SERVER);
      expect(appError.message).toContain('Error interno del servidor');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle unknown error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unknown Error' },
        status: 503,
        statusText: 'Service Unavailable'
      });

      const appError = service.handleHttpError(httpError);

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toContain('error inesperado');
      expect(appError.originalError).toBe(httpError);
      expect(appError.timestamp).toBeDefined();
    });

    it('should emit error to errorSubject', () => {
      spyOn<any>(service['errorSubject'], 'next');

      const httpError = new HttpErrorResponse({
        error: { message: 'Test Error' },
        status: 500,
        statusText: 'Internal Server Error'
      });

      const appError = service.handleHttpError(httpError);

      expect(service['errorSubject'].next).toHaveBeenCalledWith(appError);
    });
  });

  describe('handleAppError', () => {
    it('should handle string error', () => {
      const errorMessage = 'Test error message';
      const appError = service.handleAppError(errorMessage, ErrorType.VALIDATION);

      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.message).toBe(errorMessage);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle Error object', () => {
      const error = new Error('Test error');
      const appError = service.handleAppError(error, ErrorType.SERVER);

      expect(appError.type).toBe(ErrorType.SERVER);
      expect(appError.message).toBe('Test error');
      expect(appError.originalError).toBe(error);
      expect(appError.timestamp).toBeDefined();
    });

    it('should handle AppError object', () => {
      const originalError: AppError = {
        type: ErrorType.VALIDATION,
        message: 'Original error',
        details: { field: 'error' },
        code: 'ERR001'
      };

      const appError = service.handleAppError(originalError);

      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.message).toBe('Original error');
      expect(appError.details).toEqual({ field: 'error' });
      expect(appError.code).toBe('ERR001');
      expect(appError.timestamp).toBeDefined();
    });

    it('should use UNKNOWN as default error type', () => {
      const errorMessage = 'Test error message';
      const appError = service.handleAppError(errorMessage);

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe(errorMessage);
      expect(appError.timestamp).toBeDefined();
    });

    it('should emit error to errorSubject', () => {
      spyOn<any>(service['errorSubject'], 'next');

      const errorMessage = 'Test error message';
      const appError = service.handleAppError(errorMessage);

      expect(service['errorSubject'].next).toHaveBeenCalledWith(appError);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should extract message from error.message', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Validation message' },
        status: 400
      });

      const message = (service as any).getValidationErrorMessage(httpError);
      expect(message).toBe('Validation message');
    });

    it('should extract message from error.error', () => {
      const httpError = new HttpErrorResponse({
        error: { error: 'Error message' },
        status: 400
      });

      const message = (service as any).getValidationErrorMessage(httpError);
      expect(message).toBe('Error message');
    });

    it('should use HttpErrorResponse message if no error message', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 400,
        statusText: 'Bad Request',
        url: 'http://example.com'
      });

      const message = (service as any).getValidationErrorMessage(httpError);
      expect(message).toBe('Http message');
    });

    it('should return default message if no message found', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 400
      });

      const message = (service as any).getValidationErrorMessage(httpError);
      expect(message).toContain('Error de validación');
    });
  });

  describe('extractValidationDetails', () => {
    it('should extract details from error.errors', () => {
      const httpError = new HttpErrorResponse({
        error: {
          errors: {
            email: 'Invalid email',
            password: 'Too short'
          }
        },
        status: 400
      });

      const details = (service as any).extractValidationDetails(httpError);
      expect(details).toEqual({
        email: 'Invalid email',
        password: 'Too short'
      });
    });

    it('should extract details from error.fieldErrors', () => {
      const httpError = new HttpErrorResponse({
        error: {
          fieldErrors: {
            email: 'Invalid email',
            password: 'Too short'
          }
        },
        status: 400
      });

      const details = (service as any).extractValidationDetails(httpError);
      expect(details).toEqual({
        email: 'Invalid email',
        password: 'Too short'
      });
    });

    it('should return empty object if no details found', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 400
      });

      const details = (service as any).extractValidationDetails(httpError);
      expect(details).toEqual({});
    });
  });
});
