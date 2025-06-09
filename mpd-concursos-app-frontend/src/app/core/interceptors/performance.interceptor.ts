import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpResponse,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { 
  tap, 
  catchError, 
  timeout, 
  retry, 
  shareReplay, 
  finalize,
  switchMap 
} from 'rxjs/operators';

/**
 * Configuración del interceptor de rendimiento
 */
interface PerformanceConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enableRetry: boolean;
  enableTimeout: boolean;
  enableDeduplication: boolean;
  cacheMaxAge: number;
  timeoutMs: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Entrada del cache
 */
interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  maxAge: number;
}

/**
 * Métricas de request
 */
interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  size?: number;
  cached: boolean;
  retries: number;
  success: boolean;
  error?: string;
}

/**
 * Interceptor de optimización de rendimiento para HTTP
 */
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {

  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();
  private metrics: RequestMetrics[] = [];
  
  private config: PerformanceConfig = {
    enableCaching: true,
    enableCompression: true,
    enableRetry: true,
    enableTimeout: true,
    enableDeduplication: true,
    cacheMaxAge: 5 * 60 * 1000, // 5 minutos
    timeoutMs: 30000, // 30 segundos
    maxRetries: 3,
    retryDelay: 1000
  };

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const requestKey = this.getRequestKey(req);
    
    // Crear métricas iniciales
    const metrics: RequestMetrics = {
      url: req.url,
      method: req.method,
      startTime,
      cached: false,
      retries: 0,
      success: false
    };

    // Verificar cache para requests GET
    if (this.config.enableCaching && req.method === 'GET') {
      const cachedResponse = this.getCachedResponse(requestKey);
      if (cachedResponse) {
        metrics.cached = true;
        metrics.endTime = performance.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.success = true;
        this.addMetrics(metrics);
        
        return of(cachedResponse.clone());
      }
    }

    // Deduplicación de requests
    if (this.config.enableDeduplication && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    // Preparar request optimizado
    let optimizedReq = this.optimizeRequest(req);
    
    // Crear observable del request
    let request$ = next.handle(optimizedReq).pipe(
      // Timeout
      timeout(this.config.timeoutMs),
      
      // Retry con backoff exponencial
      retry({
        count: this.config.maxRetries,
        delay: (error, retryCount) => {
          metrics.retries = retryCount;
          
          // No reintentar para errores 4xx (excepto 408, 429)
          if (error instanceof HttpErrorResponse) {
            const status = error.status;
            if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
              throw error;
            }
          }
          
          const delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
          // TODO: Implement proper logging - console.debug('Retrying request ${req.url} (attempt ${retryCount}) after ${delay}ms', );
          return timer(delay);
        }
      }),
      
      // Procesar respuesta
      tap(event => {
        if (event instanceof HttpResponse) {
          this.handleSuccessResponse(event, requestKey, metrics);
        }
      }),
      
      // Manejar errores
      catchError(error => {
        this.handleErrorResponse(error, metrics);
        throw error;
      }),
      
      // Compartir para deduplicación
      shareReplay(1),
      
      // Cleanup
      finalize(() => {
        this.pendingRequests.delete(requestKey);
        
        if (!metrics.endTime) {
          metrics.endTime = performance.now();
          metrics.duration = metrics.endTime - metrics.startTime;
          this.addMetrics(metrics);
        }
      })
    );

    // Guardar request pendiente para deduplicación
    if (this.config.enableDeduplication) {
      this.pendingRequests.set(requestKey, request$);
    }

    return request$;
  }

  /**
   * Optimiza el request
   */
  private optimizeRequest(req: HttpRequest<any>): HttpRequest<any> {
    let headers = req.headers;

    // Agregar compresión
    if (this.config.enableCompression) {
      headers = headers.set('Accept-Encoding', 'gzip, deflate, br');
    }

    // Agregar cache headers para requests GET
    if (req.method === 'GET') {
      headers = headers.set('Cache-Control', 'max-age=300'); // 5 minutos
    }

    // Optimizar content-type para JSON
    if (req.body && typeof req.body === 'object') {
      headers = headers.set('Content-Type', 'application/json');
    }

    return req.clone({ headers });
  }

  /**
   * Maneja respuesta exitosa
   */
  private handleSuccessResponse(
    response: HttpResponse<any>, 
    requestKey: string, 
    metrics: RequestMetrics
  ): void {
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;
    
    // Calcular tamaño de respuesta
    if (response.body) {
      metrics.size = this.calculateResponseSize(response.body);
    }

    // Cachear respuesta GET exitosa
    if (this.config.enableCaching && response.url && response.status === 200) {
      const req = this.parseRequestKey(requestKey);
      if (req.method === 'GET') {
        this.cacheResponse(requestKey, response);
      }
    }

    this.addMetrics(metrics);
    
    // TODO: Implement proper logging - console.debug('Request completed: ${metrics.url} in ${metrics.duration?.toFixed(2)}ms', );
  }

  /**
   * Maneja respuesta de error
   */
  private handleErrorResponse(error: any, metrics: RequestMetrics): void {
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = false;
    
    if (error instanceof HttpErrorResponse) {
      metrics.error = `${error.status}: ${error.message}`;
    } else {
      metrics.error = error.message || 'Unknown error';
    }

    this.addMetrics(metrics);
    
    console.error(`Request failed: ${metrics.url} - ${metrics.error}`);
  }

  /**
   * Genera clave única para el request
   */
  private getRequestKey(req: HttpRequest<any>): string {
    const params = req.params.toString();
    const body = req.body ? JSON.stringify(req.body) : '';
    return `${req.method}:${req.url}:${params}:${body}`;
  }

  /**
   * Parsea la clave del request
   */
  private parseRequestKey(key: string): { method: string; url: string } {
    const [method, url] = key.split(':');
    return { method, url };
  }

  /**
   * Obtiene respuesta del cache
   */
  private getCachedResponse(key: string): HttpResponse<any> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si el cache ha expirado
    const now = Date.now();
    if (now - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // TODO: Implement proper logging - console.debug('Cache hit for: ${this.parseRequestKey(key).url}', );
    return entry.response;
  }

  /**
   * Cachea una respuesta
   */
  private cacheResponse(key: string, response: HttpResponse<any>): void {
    // Determinar max age basado en headers de cache
    let maxAge = this.config.cacheMaxAge;
    
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        maxAge = parseInt(maxAgeMatch[1]) * 1000;
      }
    }

    const entry: CacheEntry = {
      response: response.clone(),
      timestamp: Date.now(),
      maxAge
    };

    this.cache.set(key, entry);
    
    // Limpiar cache si es muy grande
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Limpia entradas antiguas del cache
   */
  private cleanupCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.maxAge) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    
    // Si aún es muy grande, eliminar las más antiguas
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - 80);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Calcula el tamaño de la respuesta
   */
  private calculateResponseSize(body: any): number {
    if (typeof body === 'string') {
      return new Blob([body]).size;
    }
    
    if (body instanceof ArrayBuffer) {
      return body.byteLength;
    }
    
    if (typeof body === 'object') {
      return new Blob([JSON.stringify(body)]).size;
    }
    
    return 0;
  }

  /**
   * Agrega métricas
   */
  private addMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  public getPerformanceStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cachedRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    totalDataTransferred: number;
    slowestRequests: RequestMetrics[];
    errorsByType: { [key: string]: number };
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = this.metrics.filter(m => !m.success).length;
    const cached = this.metrics.filter(m => m.cached).length;
    
    const avgResponseTime = total > 0
      ? this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / total
      : 0;
    
    const cacheHitRate = total > 0 ? (cached / total) * 100 : 0;
    
    const totalDataTransferred = this.metrics.reduce((sum, m) => sum + (m.size || 0), 0);
    
    const slowestRequests = this.metrics
      .filter(m => m.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);
    
    const errorsByType: { [key: string]: number } = {};
    this.metrics.filter(m => m.error).forEach(m => {
      const errorType = m.error!.split(':')[0];
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      cachedRequests: cached,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalDataTransferred,
      slowestRequests,
      errorsByType
    };
  }

  /**
   * Limpia el cache manualmente
   */
  public clearCache(): void {
    this.cache.clear();
    // TODO: Implement proper logging - console.debug('HTTP cache cleared', );
  }

  /**
   * Limpia las métricas
   */
  public clearMetrics(): void {
    this.metrics = [];
    // TODO: Implement proper logging - console.debug('Performance metrics cleared', );
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // TODO: Implement proper logging - console.debug('Performance interceptor config updated:', this.config);
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }
}
