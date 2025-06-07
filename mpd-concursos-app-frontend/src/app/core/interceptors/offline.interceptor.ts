import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { OfflineManagerService } from '@core/services/pwa/offline-manager.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Configuración de cache para diferentes endpoints
 */
interface CacheConfig {
  endpoint: string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  ttl: number; // Time to live en milisegundos
  priority: 'low' | 'normal' | 'high';
}

/**
 * Interceptor para manejar operaciones offline
 */
@Injectable()
export class OfflineInterceptor implements HttpInterceptor {

  // Configuración de cache por endpoint
  private cacheConfigs: CacheConfig[] = [
    // Concursos - Cache first (cambian poco)
    {
      endpoint: '/api/concursos',
      strategy: 'cache-first',
      ttl: 30 * 60 * 1000, // 30 minutos
      priority: 'normal'
    },
    // Inscripciones - Network first (datos críticos)
    {
      endpoint: '/api/inscripciones',
      strategy: 'network-first',
      ttl: 5 * 60 * 1000, // 5 minutos
      priority: 'high'
    },
    // Documentos - Stale while revalidate
    {
      endpoint: '/api/documentos',
      strategy: 'stale-while-revalidate',
      ttl: 60 * 60 * 1000, // 1 hora
      priority: 'normal'
    },
    // Perfil de usuario - Network first
    {
      endpoint: '/api/usuarios/perfil',
      strategy: 'network-first',
      ttl: 10 * 60 * 1000, // 10 minutos
      priority: 'high'
    },
    // Configuraciones - Cache first
    {
      endpoint: '/api/configuracion',
      strategy: 'cache-first',
      ttl: 60 * 60 * 1000, // 1 hora
      priority: 'low'
    },
    // Estadísticas - Stale while revalidate
    {
      endpoint: '/api/estadisticas',
      strategy: 'stale-while-revalidate',
      ttl: 15 * 60 * 1000, // 15 minutos
      priority: 'low'
    }
  ];

  constructor(
    private offlineManagerService: OfflineManagerService,
    private notificationService: CustomNotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo interceptar requests a la API
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const cacheConfig = this.getCacheConfig(req.url);
    const isOnline = this.offlineManagerService.getCurrentConnectivity().isOnline;

    // Manejar según el método HTTP
    if (req.method === 'GET') {
      return this.handleGetRequest(req, next, cacheConfig, isOnline);
    } else {
      return this.handleMutationRequest(req, next, cacheConfig, isOnline);
    }
  }

  /**
   * Maneja requests GET (lectura)
   */
  private handleGetRequest(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    cacheConfig: CacheConfig | null,
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    if (!cacheConfig) {
      // Sin configuración de cache, proceder normalmente
      return this.executeRequest(req, next, isOnline);
    }

    switch (cacheConfig.strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(req, next, cacheConfig, isOnline);
      
      case 'network-first':
        return this.networkFirstStrategy(req, next, cacheConfig, isOnline);
      
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(req, next, cacheConfig, isOnline);
      
      case 'network-only':
        return this.networkOnlyStrategy(req, next, isOnline);
      
      default:
        return this.executeRequest(req, next, isOnline);
    }
  }

  /**
   * Maneja requests de mutación (POST, PUT, DELETE)
   */
  private handleMutationRequest(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    cacheConfig: CacheConfig | null,
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    if (!isOnline) {
      // Offline: agregar a cola de sincronización
      this.addToSyncQueue(req, cacheConfig);
      
      // Retornar respuesta simulada
      return this.createOfflineResponse(req);
    }

    // Online: ejecutar normalmente y cachear si es necesario
    return this.executeRequest(req, next, isOnline).pipe(
      tap(event => {
        if (event instanceof HttpResponse && cacheConfig) {
          this.cacheResponse(req, event, cacheConfig);
        }
      })
    );
  }

  /**
   * Estrategia Cache First
   */
  private cacheFirstStrategy(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    cacheConfig: CacheConfig,
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    const cachedResponse = this.getCachedResponse(req, cacheConfig);
    
    if (cachedResponse) {
      // Retornar desde cache
      return of(cachedResponse);
    }

    // No hay cache, intentar red
    if (isOnline) {
      return this.executeRequest(req, next, isOnline).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            this.cacheResponse(req, event, cacheConfig);
          }
        })
      );
    } else {
      // Offline y sin cache
      return throwError(this.createOfflineError());
    }
  }

  /**
   * Estrategia Network First
   */
  private networkFirstStrategy(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    cacheConfig: CacheConfig,
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    if (isOnline) {
      // Intentar red primero
      return this.executeRequest(req, next, isOnline).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            this.cacheResponse(req, event, cacheConfig);
          }
        }),
        catchError(error => {
          // Error de red, intentar cache
          const cachedResponse = this.getCachedResponse(req, cacheConfig);
          if (cachedResponse) {
            this.notificationService.showWarning('Usando datos cacheados debido a error de red');
            return of(cachedResponse);
          }
          return throwError(error);
        })
      );
    } else {
      // Offline, usar cache
      const cachedResponse = this.getCachedResponse(req, cacheConfig);
      if (cachedResponse) {
        return of(cachedResponse);
      } else {
        return throwError(this.createOfflineError());
      }
    }
  }

  /**
   * Estrategia Stale While Revalidate
   */
  private staleWhileRevalidateStrategy(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    cacheConfig: CacheConfig,
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    const cachedResponse = this.getCachedResponse(req, cacheConfig);
    
    if (cachedResponse) {
      // Retornar cache inmediatamente
      if (isOnline) {
        // Actualizar en segundo plano
        this.executeRequest(req, next, isOnline).pipe(
          tap(event => {
            if (event instanceof HttpResponse) {
              this.cacheResponse(req, event, cacheConfig);
            }
          }),
          catchError(() => of(null)) // Ignorar errores en segundo plano
        ).subscribe();
      }
      
      return of(cachedResponse);
    }

    // Sin cache, comportarse como network-first
    return this.networkFirstStrategy(req, next, cacheConfig, isOnline);
  }

  /**
   * Estrategia Network Only
   */
  private networkOnlyStrategy(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    if (!isOnline) {
      return throwError(this.createOfflineError());
    }

    return this.executeRequest(req, next, isOnline);
  }

  /**
   * Ejecuta el request con manejo de errores
   */
  private executeRequest(
    req: HttpRequest<any>, 
    next: HttpHandler, 
    isOnline: boolean
  ): Observable<HttpEvent<any>> {
    
    if (!isOnline) {
      return throwError(this.createOfflineError());
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores de red
        if (error.status === 0 || error.status >= 500) {
          this.notificationService.showError('Error de conexión. Verifica tu internet.');
        }
        return throwError(error);
      })
    );
  }

  /**
   * Obtiene la configuración de cache para un endpoint
   */
  private getCacheConfig(url: string): CacheConfig | null {
    return this.cacheConfigs.find(config => url.includes(config.endpoint)) || null;
  }

  /**
   * Obtiene respuesta cacheada
   */
  private getCachedResponse(req: HttpRequest<any>, cacheConfig: CacheConfig): HttpResponse<any> | null {
    const cacheKey = this.generateCacheKey(req);
    const cachedData = this.offlineManagerService.getOfflineData<{
      data: any;
      timestamp: number;
      headers: any;
    }>(cacheKey);

    if (!cachedData) {
      return null;
    }

    // Verificar TTL
    const now = Date.now();
    if (now - cachedData.timestamp > cacheConfig.ttl) {
      // Cache expirado
      this.offlineManagerService.removeOfflineData(cacheKey);
      return null;
    }

    // Crear respuesta desde cache
    return new HttpResponse({
      body: cachedData.data,
      headers: cachedData.headers,
      status: 200,
      statusText: 'OK (from cache)',
      url: req.url
    });
  }

  /**
   * Cachea una respuesta
   */
  private cacheResponse(req: HttpRequest<any>, response: HttpResponse<any>, cacheConfig: CacheConfig): void {
    const cacheKey = this.generateCacheKey(req);
    const cacheData = {
      data: response.body,
      timestamp: Date.now(),
      headers: response.headers
    };

    this.offlineManagerService.setOfflineData(cacheKey, cacheData);
  }

  /**
   * Agrega request a la cola de sincronización
   */
  private addToSyncQueue(req: HttpRequest<any>, cacheConfig: CacheConfig | null): void {
    const syncData = {
      type: this.getOperationType(req.method),
      endpoint: req.url,
      data: req.body,
      priority: cacheConfig?.priority || 'normal'
    };

    this.offlineManagerService.addToSyncQueue(syncData);
  }

  /**
   * Crea respuesta offline simulada
   */
  private createOfflineResponse(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let responseBody: any;
    
    switch (req.method) {
      case 'POST':
        responseBody = { ...req.body, id: tempId, _offline: true };
        break;
      case 'PUT':
        responseBody = { ...req.body, _offline: true };
        break;
      case 'DELETE':
        responseBody = { success: true, _offline: true };
        break;
      default:
        responseBody = { _offline: true };
    }

    const response = new HttpResponse({
      body: responseBody,
      status: 200,
      statusText: 'OK (offline)',
      url: req.url
    });

    this.notificationService.showInfo('Operación guardada. Se sincronizará al reconectar.');
    
    return of(response);
  }

  /**
   * Crea error offline
   */
  private createOfflineError(): HttpErrorResponse {
    return new HttpErrorResponse({
      error: 'No hay conexión a internet',
      status: 0,
      statusText: 'Offline',
      url: ''
    });
  }

  /**
   * Genera clave de cache
   */
  private generateCacheKey(req: HttpRequest<any>): string {
    const url = req.url.split('?')[0]; // Sin query params
    const params = req.params.toString();
    return `cache_${url}_${params}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Obtiene tipo de operación
   */
  private getOperationType(method: string): 'CREATE' | 'UPDATE' | 'DELETE' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UPDATE';
    }
  }
}
