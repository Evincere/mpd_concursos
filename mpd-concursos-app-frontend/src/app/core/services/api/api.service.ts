import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, tap, shareReplay, switchMap, retryWhen, delayWhen, take, finalize, scan } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CacheService, CacheOptions } from '../cache/cache.service';
import { ApiErrorService } from '../error/api-error.service';

/**
 * Opciones para las solicitudes HTTP
 */
export interface ApiRequestOptions {
  /** Parámetros de la solicitud */
  params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  /** Cabeceras de la solicitud */
  headers?: HttpHeaders | Record<string, string | string[]>;
  /** Opciones de caché */
  cache?: CacheOptions;
  /** Número máximo de reintentos */
  maxRetries?: number;
  /** Tiempo de espera entre reintentos (ms) */
  retryDelay?: number;
  /** Función para determinar si se debe reintentar */
  shouldRetry?: (error: HttpErrorResponse) => boolean;
  /** Si se debe reportar el progreso */
  reportProgress?: boolean;
  /** Si se debe incluir credenciales */
  withCredentials?: boolean;
}

/**
 * Servicio para realizar solicitudes HTTP con caché y reintentos
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** URL base de la API */
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private errorService: ApiErrorService
  ) {}

  /**
   * Realiza una solicitud GET
   * @param endpoint Endpoint de la API
   * @param options Opciones de la solicitud
   * @returns Observable con la respuesta
   */
  get<T>(endpoint: string, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const cacheKey = this.buildCacheKey('GET', url, options.params);

    // Verificar si los datos están en caché y no se fuerza la actualización
    if (options.cache && !options.cache.forceRefresh && this.cacheService.has(cacheKey)) {
      const cachedData = this.cacheService.get<T>(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    }

    // Configurar opciones HTTP
    const httpOptions = this.buildHttpOptions(options);

    // Realizar la solicitud
    const response$ = this.http.get<T>(url, httpOptions) as Observable<T>;
    return response$.pipe(
      // Reintentar si es necesario
      this.retryStrategy(options),
      // Compartir la respuesta entre múltiples suscriptores
      shareReplay(1),
      // Almacenar en caché si es necesario
      tap(data => {
        if (options.cache) {
          this.cacheService.set(cacheKey, data, options.cache);
        }
      }),
      // Manejar errores
      catchError(error => this.handleError<T>(error))
    );
  }

  /**
   * Realiza una solicitud POST
   * @param endpoint Endpoint de la API
   * @param body Cuerpo de la solicitud
   * @param options Opciones de la solicitud
   * @returns Observable con la respuesta
   */
  post<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);

    // Configurar opciones HTTP
    const httpOptions = this.buildHttpOptions(options);

    // Realizar la solicitud
    const response$ = this.http.post<T>(url, body, httpOptions) as Observable<T>;
    return response$.pipe(
      // Reintentar si es necesario
      this.retryStrategy(options),
      // Compartir la respuesta entre múltiples suscriptores
      shareReplay(1),
      // Invalidar caché relacionada
      tap(() => {
        this.invalidateRelatedCache(endpoint);
      }),
      // Manejar errores
      catchError(error => this.handleError<T>(error))
    );
  }

  /**
   * Realiza una solicitud PUT
   * @param endpoint Endpoint de la API
   * @param body Cuerpo de la solicitud
   * @param options Opciones de la solicitud
   * @returns Observable con la respuesta
   */
  put<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);

    // Configurar opciones HTTP
    const httpOptions = this.buildHttpOptions(options);

    // Realizar la solicitud
    const response$ = this.http.put<T>(url, body, httpOptions) as Observable<T>;
    return response$.pipe(
      // Reintentar si es necesario
      this.retryStrategy(options),
      // Compartir la respuesta entre múltiples suscriptores
      shareReplay(1),
      // Invalidar caché relacionada
      tap(() => {
        this.invalidateRelatedCache(endpoint);
      }),
      // Manejar errores
      catchError(error => this.handleError<T>(error))
    );
  }

  /**
   * Realiza una solicitud PATCH
   * @param endpoint Endpoint de la API
   * @param body Cuerpo de la solicitud
   * @param options Opciones de la solicitud
   * @returns Observable con la respuesta
   */
  patch<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);

    // Configurar opciones HTTP
    const httpOptions = this.buildHttpOptions(options);

    // Realizar la solicitud
    const response$ = this.http.patch<T>(url, body, httpOptions) as Observable<T>;
    return response$.pipe(
      // Reintentar si es necesario
      this.retryStrategy(options),
      // Compartir la respuesta entre múltiples suscriptores
      shareReplay(1),
      // Invalidar caché relacionada
      tap(() => {
        this.invalidateRelatedCache(endpoint);
      }),
      // Manejar errores
      catchError(error => this.handleError<T>(error))
    );
  }

  /**
   * Realiza una solicitud DELETE
   * @param endpoint Endpoint de la API
   * @param options Opciones de la solicitud
   * @returns Observable con la respuesta
   */
  delete<T>(endpoint: string, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);

    // Configurar opciones HTTP
    const httpOptions = this.buildHttpOptions(options);

    // Realizar la solicitud
    const response$ = this.http.delete<T>(url, httpOptions) as Observable<T>;
    return response$.pipe(
      // Reintentar si es necesario
      this.retryStrategy(options),
      // Compartir la respuesta entre múltiples suscriptores
      shareReplay(1),
      // Invalidar caché relacionada
      tap(() => {
        this.invalidateRelatedCache(endpoint);
      }),
      // Manejar errores
      catchError(error => this.handleError<T>(error))
    );
  }

  /**
   * Construye la URL completa para un endpoint
   * @param endpoint Endpoint de la API
   * @returns URL completa
   */
  private buildUrl(endpoint: string): string {
    // Asegurarse de que el endpoint no comience con '/'
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Verificar si la API URL ya termina con '/'
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;

    // Construir URL completa
    const url = `${baseUrl}/${normalizedEndpoint}`;

    // Depurar la URL construida
    console.log(`[ApiService] URL construida: ${url} (baseUrl: ${baseUrl}, endpoint: ${endpoint})`);

    return url;
  }

  /**
   * Construye las opciones HTTP para una solicitud
   * @param options Opciones de la solicitud
   * @returns Opciones HTTP
   */
  private buildHttpOptions(options: ApiRequestOptions): any {
    const httpOptions: any = {};

    // Configurar parámetros
    if (options.params) {
      if (options.params instanceof HttpParams) {
        httpOptions.params = options.params;
      } else {
        httpOptions.params = new HttpParams({ fromObject: options.params as any });
      }
    }

    // Configurar cabeceras
    if (options.headers) {
      if (options.headers instanceof HttpHeaders) {
        httpOptions.headers = options.headers;
      } else {
        httpOptions.headers = new HttpHeaders(options.headers);
      }
    }

    // Configurar otras opciones
    if (options.reportProgress !== undefined) {
      httpOptions.reportProgress = options.reportProgress;
    }

    if (options.withCredentials !== undefined) {
      httpOptions.withCredentials = options.withCredentials;
    }

    return httpOptions;
  }

  /**
   * Construye una clave de caché para una solicitud
   * @param method Método HTTP
   * @param url URL de la solicitud
   * @param params Parámetros de la solicitud
   * @returns Clave de caché
   */
  private buildCacheKey(method: string, url: string, params?: any): string {
    if (params) {
      // Convertir parámetros a cadena ordenada
      const paramString = typeof params === 'string'
        ? params
        : JSON.stringify(params, Object.keys(params).sort());

      return `${method}:${url}:${paramString}`;
    }

    return `${method}:${url}`;
  }

  /**
   * Invalida la caché relacionada con un endpoint
   * @param endpoint Endpoint de la API
   */
  private invalidateRelatedCache(endpoint: string): void {
    // Obtener todas las claves de caché
    const keys = this.cacheService.keys();

    // Normalizar endpoint para comparación
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Filtrar claves relacionadas con el endpoint
    const relatedKeys = keys.filter(key => {
      // Extraer URL de la clave
      const urlPart = key.split(':')[1];

      if (!urlPart) {
        return false;
      }

      // Verificar si la URL contiene el endpoint
      return urlPart.includes(normalizedEndpoint);
    });

    // Eliminar claves relacionadas
    relatedKeys.forEach(key => {
      this.cacheService.remove(key);
    });
  }

  /**
   * Estrategia de reintento para solicitudes HTTP
   * @param options Opciones de la solicitud
   * @returns Operador RxJS para reintentar solicitudes
   */
  private retryStrategy<T>(options: ApiRequestOptions) {
    const maxRetries = options.maxRetries || 0;
    const retryDelay = options.retryDelay || 1000;
    const shouldRetry = options.shouldRetry || this.defaultShouldRetry;

    return (source: Observable<T>) => {
      return source.pipe(
        retryWhen(errors => {
          return errors.pipe(
            // Contador de reintentos
            scan((retryCount, error) => {
              // Verificar si se debe reintentar
              if (retryCount >= maxRetries || !shouldRetry(error)) {
                throw error;
              }

              return retryCount + 1;
            }, 0),
            // Esperar antes de reintentar
            delayWhen(retryCount => timer(retryCount * retryDelay)),
            // Limitar número de reintentos
            take(maxRetries)
          );
        })
      );
    };
  }

  /**
   * Función predeterminada para determinar si se debe reintentar una solicitud
   * @param error Error HTTP
   * @returns true si se debe reintentar
   */
  private defaultShouldRetry(error: HttpErrorResponse): boolean {
    // Reintentar solo errores de red o errores 5xx
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con error
   */
  private handleError<T>(error: HttpErrorResponse): Observable<T> {
    // Agregar información adicional de diagnóstico
    if (error.status === 500) {
      console.error('Error 500 detectado. Información adicional:');
      console.error('URL:', error.url);
      console.error('Tipo de error:', error.name);
      console.error('Mensaje:', error.message);

      // Intentar analizar el cuerpo de la respuesta para obtener más detalles
      if (error.error) {
        if (typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            console.error('Detalles del error (parseado):', parsedError);
          } catch (e) {
            console.error('Cuerpo de la respuesta (texto):', error.error);
          }
        } else {
          console.error('Detalles del error (objeto):', error.error);
        }
      }

      // Verificar si hay problemas con el formato de los datos
      console.error('Verificando posibles problemas de formato en la solicitud...');
    }

    return this.errorService.handleError(error) as Observable<T>;
  }
}
