import { Injectable, NgZone } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { debounceTime, throttleTime, map, startWith } from 'rxjs/operators';

/**
 * Interfaz para métricas de rendimiento
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Métricas adicionales
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
  
  // Métricas de memoria
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  
  // Métricas de red
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // Timestamp
  timestamp: number;
}

/**
 * Configuración de optimización
 */
export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableVirtualScrolling: boolean;
  enablePreloading: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  maxCacheSize: number;
  preloadDelay: number;
}

/**
 * Servicio de optimización de rendimiento
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceOptimizationService {

  private metricsSubject = new BehaviorSubject<PerformanceMetrics | null>(null);
  private configSubject = new BehaviorSubject<OptimizationConfig>(this.getDefaultConfig());
  
  // Observables públicos
  public metrics$ = this.metricsSubject.asObservable();
  public config$ = this.configSubject.asObservable();
  
  // Cache para recursos
  private resourceCache = new Map<string, any>();
  private imageCache = new Map<string, HTMLImageElement>();
  
  // Intersection Observer para lazy loading
  private intersectionObserver?: IntersectionObserver;
  
  // Performance Observer
  private performanceObserver?: PerformanceObserver;
  
  constructor(
    private ngZone: NgZone,
    private loggingService: LoggingService
  ) {
    this.initializePerformanceMonitoring();
    this.initializeLazyLoading();
    this.initializeNetworkMonitoring();
  }

  /**
   * Configuración por defecto
   */
  private getDefaultConfig(): OptimizationConfig {
    return {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableVirtualScrolling: true,
      enablePreloading: true,
      enableCaching: true,
      enableCompression: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      preloadDelay: 2000
    };
  }

  /**
   * Inicializa el monitoreo de rendimiento
   */
  private initializePerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    this.performanceObserver = new PerformanceObserver((list) => {
      this.ngZone.run(() => {
        this.processPerformanceEntries(list.getEntries());
      });
    });

    // Observar diferentes tipos de métricas
    try {
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.warn('Some performance metrics not supported:', error);
    }

    // Métricas iniciales
    this.collectInitialMetrics();
  }

  /**
   * Procesa las entradas de rendimiento
   */
  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    const currentMetrics = this.metricsSubject.value || {} as PerformanceMetrics;
    
    entries.forEach(entry => {
      switch (entry.entryType) {
        case 'navigation':
          const navEntry = entry as PerformanceNavigationTiming;
          currentMetrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart;
          currentMetrics.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart;
          currentMetrics.ttfb = navEntry.responseStart - navEntry.navigationStart;
          break;
          
        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            currentMetrics.fcp = entry.startTime;
          }
          break;
          
        case 'largest-contentful-paint':
          currentMetrics.lcp = entry.startTime;
          break;
      }
    });

    currentMetrics.timestamp = Date.now();
    this.metricsSubject.next(currentMetrics);
  }

  /**
   * Recopila métricas iniciales
   */
  private collectInitialMetrics(): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now()
    };

    // Métricas de memoria
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.usedJSHeapSize = memory.usedJSHeapSize;
      metrics.totalJSHeapSize = memory.totalJSHeapSize;
      metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }

    // Información de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.connectionType = connection.type;
      metrics.effectiveType = connection.effectiveType;
      metrics.downlink = connection.downlink;
      metrics.rtt = connection.rtt;
    }

    this.metricsSubject.next(metrics);
  }

  /**
   * Inicializa lazy loading
   */
  private initializeLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyElement(entry.target as HTMLElement);
            this.intersectionObserver?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );
  }

  /**
   * Inicializa monitoreo de red
   */
  private initializeNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      fromEvent(connection, 'change').pipe(
        throttleTime(1000)
      ).subscribe(() => {
        this.updateNetworkMetrics();
      });
    }
  }

  /**
   * Actualiza métricas de red
   */
  private updateNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const currentMetrics = this.metricsSubject.value || {} as PerformanceMetrics;
      
      currentMetrics.connectionType = connection.type;
      currentMetrics.effectiveType = connection.effectiveType;
      currentMetrics.downlink = connection.downlink;
      currentMetrics.rtt = connection.rtt;
      currentMetrics.timestamp = Date.now();
      
      this.metricsSubject.next(currentMetrics);
    }
  }

  /**
   * Registra elemento para lazy loading
   */
  public registerLazyElement(element: HTMLElement): void {
    if (this.intersectionObserver && this.configSubject.value.enableLazyLoading) {
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Carga elemento lazy
   */
  private loadLazyElement(element: HTMLElement): void {
    const dataSrc = element.getAttribute('data-src');
    const dataSrcset = element.getAttribute('data-srcset');
    
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      if (dataSrc) {
        img.src = dataSrc;
        element.removeAttribute('data-src');
      }
      if (dataSrcset) {
        img.srcset = dataSrcset;
        element.removeAttribute('data-srcset');
      }
    } else if (element.tagName === 'IFRAME') {
      const iframe = element as HTMLIFrameElement;
      if (dataSrc) {
        iframe.src = dataSrc;
        element.removeAttribute('data-src');
      }
    }
    
    element.classList.add('loaded');
  }

  /**
   * Optimiza imagen
   */
  public optimizeImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const cacheKey = `${src}_${JSON.stringify(options)}`;
      
      if (this.imageCache.has(cacheKey)) {
        resolve(this.imageCache.get(cacheKey)!.src);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          const { width = img.width, height = img.height, quality = 0.8, format = 'webp' } = options;
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const optimizedSrc = canvas.toDataURL(`image/${format}`, quality);
          
          const optimizedImg = new Image();
          optimizedImg.src = optimizedSrc;
          
          this.imageCache.set(cacheKey, optimizedImg);
          resolve(optimizedSrc);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Preload de recursos
   */
  public preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(url)) {
        resolve(this.resourceCache.get(url));
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      switch (type) {
        case 'script':
          link.as = 'script';
          break;
        case 'style':
          link.as = 'style';
          break;
        case 'image':
          link.as = 'image';
          break;
        case 'fetch':
          link.as = 'fetch';
          link.crossOrigin = 'anonymous';
          break;
      }
      
      link.onload = () => {
        this.resourceCache.set(url, true);
        resolve(true);
      };
      
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  /**
   * Limpia cache
   */
  public clearCache(): void {
    this.resourceCache.clear();
    this.imageCache.clear();
  }

  /**
   * Obtiene tamaño del cache
   */
  public getCacheSize(): number {
    let size = 0;
    
    // Estimar tamaño del cache de recursos
    size += this.resourceCache.size * 1024; // Estimación aproximada
    
    // Estimar tamaño del cache de imágenes
    this.imageCache.forEach(img => {
      // Estimación basada en dimensiones
      size += (img.width * img.height * 4); // 4 bytes por pixel (RGBA)
    });
    
    return size;
  }

  /**
   * Actualiza configuración
   */
  public updateConfig(config: Partial<OptimizationConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }

  /**
   * Obtiene configuración actual
   */
  public getCurrentConfig(): OptimizationConfig {
    return this.configSubject.value;
  }

  /**
   * Obtiene métricas actuales
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsSubject.value;
  }

  /**
   * Calcula score de rendimiento
   */
  public calculatePerformanceScore(): number {
    const metrics = this.metricsSubject.value;
    if (!metrics) return 0;

    let score = 100;
    
    // Penalizar por LCP alto
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }
    
    // Penalizar por FCP alto
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 20;
      else if (metrics.fcp > 1800) score -= 10;
    }
    
    // Penalizar por CLS alto
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 25;
      else if (metrics.cls > 0.1) score -= 10;
    }
    
    // Penalizar por uso excesivo de memoria
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      const memoryUsage = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
      if (memoryUsage > 0.8) score -= 15;
      else if (memoryUsage > 0.6) score -= 5;
    }
    
    return Math.max(0, score);
  }

  /**
   * Destructor
   */
  public destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.clearCache();
  }
}
