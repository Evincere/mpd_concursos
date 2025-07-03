import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggingService } from '../logging/logging.service';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Obtener LoggingService vía Injector para evitar ciclos
    const logger = this.injector.get(LoggingService);
    // Log crítico
    logger.critical('[GlobalErrorHandler] Error global capturado', error, 'global-error-handler');
    // Log en consola siempre
    console.error('[GlobalErrorHandler] Error global capturado:', error);
    // Aquí se puede agregar lógica para mostrar un diálogo de error global si se desea
  }
} 