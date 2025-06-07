import { Injectable } from '@angular/core';
import { Router, PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { PerformanceOptimizationService } from './performance-optimization.service';

/**
 * Estrategia de preloading personalizada
 */
export interface PreloadingConfig {
  enabled: boolean;
  delay: number;
  priority: 'high' | 'medium' | 'low';
  condition?: () => boolean;
  networkAware: boolean;
  memoryAware: boolean;
}

/**
 * Información de ruta para preloading
 */
export interface RoutePreloadInfo {
  path: string;
  priority: number;
  lastAccessed?: Date;
  accessCount: number;
  loadTime?: number;
  size?: number;
}

/**
 * Servicio de preloading inteligente
 */
@Injectable({
  providedIn: 'root'
})
export class PreloadingService implements PreloadingStrategy {

  private routeStats = new Map<string, RoutePreloadInfo>();
  private preloadQueue: Route[] = [];
  private isPreloading = false;
  private maxConcurrentPreloads = 2;
  private currentPreloads = 0;

  // Configuración por defecto
  private defaultConfig: PreloadingConfig = {
    enabled: true,
    delay: 2000,
    priority: 'medium',
    networkAware: true,
    memoryAware: true
  };

  constructor(
    private router: Router,
    private performanceService: PerformanceOptimizationService
  ) {
    this.initializeRouteTracking();
  }

  /**
   * Implementación de PreloadingStrategy
   */
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const config = this.getRouteConfig(route);
    
    if (!config.enabled) {
      return EMPTY;
    }

    // Verificar condiciones de red y memoria
    if (!this.shouldPreload(config)) {
      return EMPTY;
    }

    // Aplicar delay basado en prioridad
    const delay = this.calculateDelay(config, route);
    
    return timer(delay).pipe(
      switchMap(() => {
        if (this.currentPreloads >= this.maxConcurrentPreloads) {
          this.preloadQueue.push(route);
          return EMPTY;
        }

        return this.executePreload(route, load);
      }),
      catchError(error => {
        console.warn(`Failed to preload route ${route.path}:`, error);
        this.processQueue();
        return EMPTY;
      })
    );
  }

  /**
   * Ejecuta el preload de una ruta
   */
  private executePreload(route: Route, load: () => Observable<any>): Observable<any> {
    this.currentPreloads++;
    const startTime = performance.now();
    
    console.log(`Preloading route: ${route.path}`);
    
    return load().pipe(
      switchMap(module => {
        const loadTime = performance.now() - startTime;
        this.updateRouteStats(route.path!, { loadTime });
        this.currentPreloads--;
        this.processQueue();
        
        console.log(`Route ${route.path} preloaded in ${loadTime.toFixed(2)}ms`);
        return of(module);
      }),
      catchError(error => {
        this.currentPreloads--;
        this.processQueue();
        throw error;
      })
    );
  }

  /**
   * Procesa la cola de preloads
   */
  private processQueue(): void {
    if (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrentPreloads) {
      const nextRoute = this.preloadQueue.shift()!;
      // Reintenta el preload
      this.preload(nextRoute, () => this.router.navigate([nextRoute.path!]));
    }
  }

  /**
   * Verifica si debe hacer preload
   */
  private shouldPreload(config: PreloadingConfig): boolean {
    // Verificar condición personalizada
    if (config.condition && !config.condition()) {
      return false;
    }

    // Verificar estado de la red
    if (config.networkAware && !this.isNetworkSuitable()) {
      return false;
    }

    // Verificar memoria disponible
    if (config.memoryAware && !this.isMemorySuitable()) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si la red es adecuada para preloading
   */
  private isNetworkSuitable(): boolean {
    if (!('connection' in navigator)) {
      return true; // Asumir que es adecuada si no hay información
    }

    const connection = (navigator as any).connection;
    
    // No precargar en conexiones lentas
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return false;
    }

    // No precargar si el usuario tiene datos limitados
    if (connection.saveData) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si la memoria es adecuada para preloading
   */
  private isMemorySuitable(): boolean {
    const metrics = this.performanceService.getCurrentMetrics();
    
    if (!metrics || !metrics.usedJSHeapSize || !metrics.jsHeapSizeLimit) {
      return true; // Asumir que es adecuada si no hay información
    }

    const memoryUsage = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
    
    // No precargar si el uso de memoria es alto
    return memoryUsage < 0.7;
  }

  /**
   * Calcula el delay para el preload
   */
  private calculateDelay(config: PreloadingConfig, route: Route): number {
    let delay = config.delay;
    
    // Ajustar delay basado en prioridad
    switch (config.priority) {
      case 'high':
        delay = Math.min(delay, 500);
        break;
      case 'low':
        delay = Math.max(delay, 5000);
        break;
    }

    // Ajustar basado en estadísticas de la ruta
    const stats = this.routeStats.get(route.path!);
    if (stats) {
      // Rutas más accedidas tienen menor delay
      const accessFactor = Math.min(stats.accessCount / 10, 0.8);
      delay = delay * (1 - accessFactor);
    }

    return delay;
  }

  /**
   * Obtiene la configuración de una ruta
   */
  private getRouteConfig(route: Route): PreloadingConfig {
    const routeConfig = route.data?.['preload'] as Partial<PreloadingConfig>;
    return { ...this.defaultConfig, ...routeConfig };
  }

  /**
   * Inicializa el tracking de rutas
   */
  private initializeRouteTracking(): void {
    this.router.events.subscribe(event => {
      if (event.constructor.name === 'NavigationEnd') {
        const url = (event as any).url;
        this.trackRouteAccess(url);
      }
    });
  }

  /**
   * Rastrea el acceso a rutas
   */
  private trackRouteAccess(path: string): void {
    const existing = this.routeStats.get(path);
    
    if (existing) {
      existing.accessCount++;
      existing.lastAccessed = new Date();
    } else {
      this.routeStats.set(path, {
        path,
        priority: 1,
        accessCount: 1,
        lastAccessed: new Date()
      });
    }
  }

  /**
   * Actualiza estadísticas de ruta
   */
  private updateRouteStats(path: string, updates: Partial<RoutePreloadInfo>): void {
    const existing = this.routeStats.get(path);
    
    if (existing) {
      Object.assign(existing, updates);
    }
  }

  /**
   * Preload manual de una ruta
   */
  public preloadRoute(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const route = this.findRouteByPath(path);
      
      if (!route) {
        reject(new Error(`Route not found: ${path}`));
        return;
      }

      // Simular carga del módulo
      import(/* webpackChunkName: "dynamic-route" */ path)
        .then(module => {
          this.updateRouteStats(path, { 
            loadTime: performance.now(),
            lastAccessed: new Date()
          });
          resolve(module);
        })
        .catch(reject);
    });
  }

  /**
   * Busca una ruta por path
   */
  private findRouteByPath(path: string): Route | null {
    // Implementación simplificada
    // En una implementación real, buscaría en la configuración de rutas
    return { path } as Route;
  }

  /**
   * Obtiene estadísticas de preloading
   */
  public getPreloadingStats(): {
    totalRoutes: number;
    preloadedRoutes: number;
    averageLoadTime: number;
    topRoutes: RoutePreloadInfo[];
    queueSize: number;
    activePreloads: number;
  } {
    const routes = Array.from(this.routeStats.values());
    const preloadedRoutes = routes.filter(r => r.loadTime !== undefined);
    
    const averageLoadTime = preloadedRoutes.length > 0
      ? preloadedRoutes.reduce((sum, r) => sum + (r.loadTime || 0), 0) / preloadedRoutes.length
      : 0;

    const topRoutes = routes
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalRoutes: routes.length,
      preloadedRoutes: preloadedRoutes.length,
      averageLoadTime,
      topRoutes,
      queueSize: this.preloadQueue.length,
      activePreloads: this.currentPreloads
    };
  }

  /**
   * Configura el preloading
   */
  public configure(config: Partial<PreloadingConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Limpia estadísticas antiguas
   */
  public cleanupOldStats(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [path, stats] of this.routeStats.entries()) {
      if (stats.lastAccessed && stats.lastAccessed < cutoff) {
        this.routeStats.delete(path);
      }
    }
  }

  /**
   * Exporta estadísticas
   */
  public exportStats(): string {
    const stats = {
      routes: Array.from(this.routeStats.entries()),
      config: this.defaultConfig,
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(stats, null, 2);
  }

  /**
   * Importa estadísticas
   */
  public importStats(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.routes) {
        this.routeStats.clear();
        parsed.routes.forEach(([path, stats]: [string, RoutePreloadInfo]) => {
          this.routeStats.set(path, {
            ...stats,
            lastAccessed: stats.lastAccessed ? new Date(stats.lastAccessed) : undefined
          });
        });
      }
      
      if (parsed.config) {
        this.defaultConfig = { ...this.defaultConfig, ...parsed.config };
      }
    } catch (error) {
      console.error('Failed to import preloading stats:', error);
    }
  }
}
