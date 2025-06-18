import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Interceptor para transformar URLs absolutas a relativas en las respuestas
 *
 * Este interceptor asegura que las URLs de imágenes de perfil y otros recursos
 * sean siempre relativas, lo que permite que funcionen correctamente tanto
 * en desarrollo (con proxy) como en producción (con nginx).
 *
 * Transformaciones que realiza:
 * - http://localhost:8080/api/files/... → /api/files/...
 * - http://149.50.132.23:8080/api/files/... → /api/files/...
 * - https://domain.com/api/files/... → /api/files/...
 *
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-06
 */

/**
 * Patrones de URLs que deben ser transformadas a relativas
 */
const URL_PATTERNS = [
  // URLs de imágenes de perfil
  /https?:\/\/[^\/]+\/api\/files\/profile-images\//g,
  // URLs de archivos de concursos
  /https?:\/\/[^\/]+\/api\/files\/contest-bases\//g,
  // URLs de documentos
  /https?:\/\/[^\/]+\/api\/files\/documents\//g,
  // Cualquier URL de API
  /https?:\/\/[^\/]+\/api\//g
];

export const urlTransformInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        // Transformar URLs en el cuerpo de la respuesta
        const transformedBody = transformUrls(event.body);

        if (transformedBody !== event.body) {
          return event.clone({ body: transformedBody });
        }
      }
      return event;
    })
  );
};

/**
 * Transforma URLs absolutas a relativas en un objeto
 */
function transformUrls(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return transformUrlString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => transformUrls(item));
    }

    if (typeof obj === 'object') {
      const transformed: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          transformed[key] = transformUrls(obj[key]);
        }
      }
      return transformed;
    }

    return obj;
}

/**
 * Transforma una URL string de absoluta a relativa
 */
function transformUrlString(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }

    let transformedUrl = url;

    // Aplicar todas las transformaciones
    URL_PATTERNS.forEach(pattern => {
      transformedUrl = transformedUrl.replace(pattern, (match) => {
        // Extraer la parte relativa de la URL
        const apiIndex = match.indexOf('/api/');
        if (apiIndex !== -1) {
          const relativeUrl = match.substring(apiIndex);
          console.log(`[UrlTransformInterceptor] Transforming: ${match} → ${relativeUrl}`);
          return relativeUrl;
        }
        return match;
      });
    });

    return transformedUrl;
}
