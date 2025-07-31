import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';

/**
 * ENHANCEMENT: Configuración específica de timeout para uploads
 */
function getTimeoutForRequest(req: HttpRequest<any>): number {
  // Para uploads de documentos, usar timeout más largo
  if (req.url.includes('/documentos/upload') ||
      req.url.includes('/upload') ||
      (req.method === 'POST' && req.body instanceof FormData)) {
    return 5 * 60 * 1000; // 5 minutos para uploads
  }

  // Para requests de archivos grandes
  if (req.url.includes('/file') || req.url.includes('/download')) {
    return 2 * 60 * 1000; // 2 minutos para descargas
  }

  return 30000; // 30 segundos por defecto
}

/**
 * Interceptor funcional de optimización de rendimiento para HTTP
 * Aplica timeouts dinámicos basados en el tipo de request
 */
export const PerformanceInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  // ENHANCEMENT: Aplicar timeout dinámico basado en el tipo de request
  const timeoutMs = getTimeoutForRequest(req);
  
  // Log para debugging de uploads
  if (req.method === 'POST' && req.body instanceof FormData) {
    console.log(`[PerformanceInterceptor] Upload detectado - Timeout: ${timeoutMs}ms para ${req.url}`);
  }

  // Crear observable del request con timeout dinámico
  return next(req).pipe(
    // ENHANCEMENT: Timeout dinámico basado en el tipo de request
    timeout(timeoutMs),
    
    // Log de errores de timeout
    catchError(error => {
      if (error.name === 'TimeoutError') {
        console.error(`[PerformanceInterceptor] Timeout en request: ${req.method} ${req.url} (${timeoutMs}ms)`);
      }
      throw error;
    })
  );
};
