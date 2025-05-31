import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { ErrorInterceptor } from './error-interceptor';
import { ErrorHandlerService, AppError, ErrorType } from '../services/error/error-handler.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  let notificationService: jasmine.SpyObj<CustomNotificationService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleHttpError']);
    const notificationSpy = jasmine.createSpyObj('CustomNotificationService', ['error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true
        },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: CustomNotificationService, useValue: notificationSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
    notificationService = TestBed.inject(CustomNotificationService) as jasmine.SpyObj<CustomNotificationService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should handle HTTP errors', () => {
    // Mock AppError que devolverá el servicio
    const mockAppError: AppError = {
      type: ErrorType.SERVER,
      message: 'Error interno del servidor',
      timestamp: Date.now()
    };

    // Configurar el spy para devolver el error mock
    errorHandlerService.handleHttpError.and.returnValue(mockAppError);

    // Realizar una solicitud HTTP que fallará
    httpClient.get('/api/test').subscribe({
      next: () => fail('Expected an error, not a successful response'),
      error: (error) => {
        // Verificar que el error es el AppError devuelto por el servicio
        expect(error).toBe(mockAppError);
      }
    });

    // Simular una respuesta de error del servidor
    const mockErrorResponse = { status: 500, statusText: 'Internal Server Error' };
    const req = httpTestingController.expectOne('/api/test');
    req.flush('Server error', mockErrorResponse);

    // Verificar que se llamó al servicio de manejo de errores
    expect(errorHandlerService.handleHttpError).toHaveBeenCalled();
    
    // Verificar que se mostró una notificación de error
    expect(notificationService.error).toHaveBeenCalledWith(mockAppError.message);
  });

  it('should pass through successful responses', () => {
    const mockResponse = { data: 'test' };

    httpClient.get('/api/test').subscribe({
      next: (response) => {
        expect(response).toEqual(mockResponse);
      },
      error: () => fail('Expected a successful response, not an error')
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(mockResponse);

    // Verificar que no se llamó al servicio de manejo de errores
    expect(errorHandlerService.handleHttpError).not.toHaveBeenCalled();
    
    // Verificar que no se mostró una notificación de error
    expect(notificationService.error).not.toHaveBeenCalled();
  });

  it('should handle different types of HTTP errors', () => {
    // Probar diferentes códigos de error HTTP
    const errorCodes = [400, 401, 403, 404, 500];
    
    errorCodes.forEach(errorCode => {
      // Mock AppError que devolverá el servicio
      const mockAppError: AppError = {
        type: ErrorType.UNKNOWN,
        message: `Error ${errorCode}`,
        timestamp: Date.now()
      };
      
      // Configurar el spy para devolver el error mock
      errorHandlerService.handleHttpError.and.returnValue(mockAppError);
      
      // Realizar una solicitud HTTP que fallará
      httpClient.get(`/api/test/${errorCode}`).subscribe({
        next: () => fail('Expected an error, not a successful response'),
        error: (error) => {
          // Verificar que el error es el AppError devuelto por el servicio
          expect(error).toBe(mockAppError);
        }
      });
      
      // Simular una respuesta de error del servidor
      const mockErrorResponse = { status: errorCode, statusText: 'Error' };
      const req = httpTestingController.expectOne(`/api/test/${errorCode}`);
      req.flush('Error', mockErrorResponse);
      
      // Verificar que se llamó al servicio de manejo de errores
      expect(errorHandlerService.handleHttpError).toHaveBeenCalled();
      
      // Verificar que se mostró una notificación de error
      expect(notificationService.error).toHaveBeenCalledWith(mockAppError.message);
      
      // Resetear los spies
      errorHandlerService.handleHttpError.calls.reset();
      notificationService.error.calls.reset();
    });
  });
});
