import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interceptor para depurar peticiones HTTP
 * Muestra información detallada sobre las peticiones y respuestas en la consola
 */
export const debugInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Solo depurar en modo desarrollo
  if (!environment.production) {
    // Mostrar información de la petición
    console.group(`🔍 [DebugInterceptor] Petición HTTP: ${request.method} ${request.url}`);
    // TODO: Implement proper logging - console.debug('Headers:', formatHeaders(request.headers.keys();.map(key => [key, request.headers.get(key)])));
    // TODO: Implement proper logging - console.debug('Body:', request.body);
    // TODO: Implement proper logging - console.debug('Params:', formatParams(request.params););
    console.groupEnd();

    // Procesar la petición y mostrar información de la respuesta
    return next(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          console.group(`✅ [DebugInterceptor] Respuesta HTTP: ${request.method} ${request.url}`);
          // TODO: Implement proper logging - console.debug('Status:', event.status);
          // TODO: Implement proper logging - console.debug('Headers:', formatHeaders(event.headers.keys();.map(key => [key, event.headers.get(key)])));
          // TODO: Implement proper logging - console.debug('Body:', event.body);
          console.groupEnd();
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.group(`❌ [DebugInterceptor] Error HTTP: ${request.method} ${request.url}`);
        // TODO: Implement proper logging - console.debug('Status:', error.status);
        // TODO: Implement proper logging - console.debug('Message:', error.message);
        // TODO: Implement proper logging - console.error('Error:', error.error);
        console.groupEnd();
        return throwError(() => error);
      })
    );
  }

  // En producción, simplemente pasar la petición sin depurar
  return next(request);
};

/**
 * Formatea los headers para mostrarlos en la consola
 * @param headers Array de pares [clave, valor]
 * @returns Objeto con los headers formateados
 */
function formatHeaders(headers: [string, string | null][]): Record<string, string | null> {
  return headers.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, string | null>);
}

/**
 * Formatea los parámetros para mostrarlos en la consola
 * @param params Parámetros HTTP
 * @returns Objeto con los parámetros formateados
 */
function formatParams(params: any): Record<string, string> {
  if (!params) return {};

  const result: Record<string, string> = {};
  params.keys().forEach((key: string) => {
    result[key] = params.get(key);
  });
  return result;
}
