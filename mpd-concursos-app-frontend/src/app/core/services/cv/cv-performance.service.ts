/**
 * Servicio de Optimización de Rendimiento del Sistema CV
 * 
 * @description Maneja virtual scrolling, lazy loading y optimizaciones de performance
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { WorkExperience, EducationEntry } from '@core/models/cv';
import { CvPreferencesService } from './cv-preferences.service';

/**
 * Configuración de rendimiento
 */
export interface PerformanceConfig {
  enableVirtualScrolling: boolean;
  virtualScrollItemSize: number;
  virtualScrollBufferSize: number;
  enableLazyLoading: boolean;
  lazyLoadingThreshold: number;
  enableMemoization: boolean;
  memoizationTTL: number; // Time to live en ms
  enableDebouncing: boolean;
  debounceTime: number;
  maxConcurrentRequests: number;
  enableCompression: boolean;
  compressionThreshold: number; // Tamaño en bytes
}

/**
 * Métricas de rendimiento
 */
export interface PerformanceMetrics {
  searchTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  totalItems: number;
  visibleItems: number;
  scrollPosition: number;
  lastUpdate: Date;
}

/**
 * Elemento virtualizado
 */
export interface VirtualizedItem<T> {
  index: number;
  item: T;
  height: number;
  offset: number;
  visible: boolean;
}

/**
 * Viewport virtual
 */
export interface VirtualViewport {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  visibleHeight: number;
  scrollTop: number;
  itemCount: number;
}

/**
 * Cache de datos
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class CvPerformanceService {
  // ===== SERVICIOS INYECTADOS =====
  private readonly preferencesService = inject(CvPreferencesService);

  // ===== CONFIGURACIÓN =====
  private readonly defaultConfig: PerformanceConfig = {
    enableVirtualScrolling: true,
    virtualScrollItemSize: 120,
    virtualScrollBufferSize: 5,
    enableLazyLoading: true,
    lazyLoadingThreshold: 50,
    enableMemoization: true,
    memoizationTTL: 300000, // 5 minutos
    enableDebouncing: true,
    debounceTime: 300,
    maxConcurrentRequests: 3,
    enableCompression: false,
    compressionThreshold: 1024 // 1KB
  };

  // ===== ESTADO REACTIVO =====
  private readonly configSignal = signal<PerformanceConfig>(this.defaultConfig);
  private readonly metricsSignal = signal<PerformanceMetrics>({
    searchTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    totalItems: 0,
    visibleItems: 0,
    scrollPosition: 0,
    lastUpdate: new Date()
  });

  // ===== CACHE =====
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly maxCacheSize = 100;

  // ===== OBSERVABLES =====
  private readonly viewportSubject = new BehaviorSubject<VirtualViewport>({
    startIndex: 0,
    endIndex: 0,
    totalHeight: 0,
    visibleHeight: 0,
    scrollTop: 0,
    itemCount: 0
  });

  // ===== GETTERS PÚBLICOS =====
  public readonly config = this.configSignal.asReadonly();
  public readonly metrics = this.metricsSignal.asReadonly();
  public readonly viewport$ = this.viewportSubject.asObservable();

  // ===== COMPUTED SIGNALS =====
  public readonly isVirtualScrollEnabled = computed(() => this.config().enableVirtualScrolling);
  public readonly isLazyLoadingEnabled = computed(() => this.config().enableLazyLoading);
  public readonly cacheSize = computed(() => this.cache.size);

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Actualiza la configuración de rendimiento
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    const currentConfig = this.configSignal();
    this.configSignal.set({ ...currentConfig, ...config });
  }

  /**
   * Calcula elementos virtualizados para una lista
   */
  calculateVirtualizedItems<T>(
    items: T[],
    containerHeight: number,
    scrollTop: number
  ): VirtualizedItem<T>[] {
    if (!this.config().enableVirtualScrolling) {
      return items.map((item, index) => ({
        index,
        item,
        height: this.config().virtualScrollItemSize,
        offset: index * this.config().virtualScrollItemSize,
        visible: true
      }));
    }

    const itemSize = this.config().virtualScrollItemSize;
    const bufferSize = this.config().virtualScrollBufferSize;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - bufferSize);
    const visibleCount = Math.ceil(containerHeight / itemSize);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + bufferSize * 2);

    const virtualizedItems: VirtualizedItem<T>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        virtualizedItems.push({
          index: i,
          item: items[i],
          height: itemSize,
          offset: i * itemSize,
          visible: i >= startIndex + bufferSize && i <= endIndex - bufferSize
        });
      }
    }

    // Actualizar viewport
    this.updateViewport({
      startIndex,
      endIndex,
      totalHeight: items.length * itemSize,
      visibleHeight: containerHeight,
      scrollTop,
      itemCount: items.length
    });

    return virtualizedItems;
  }

  /**
   * Implementa lazy loading para una lista
   */
  implementLazyLoading<T>(
    items: T[],
    loadMoreCallback: () => Observable<T[]>,
    threshold: number = this.config().lazyLoadingThreshold
  ): Observable<T[]> {
    if (!this.config().enableLazyLoading) {
      return new BehaviorSubject(items).asObservable();
    }

    const itemsSubject = new BehaviorSubject<T[]>(items);

    // Simular carga lazy cuando se acerca al final
    return itemsSubject.asObservable().pipe(
      map(currentItems => {
        if (currentItems.length > 0 && currentItems.length % threshold === 0) {
          // Trigger lazy loading
          loadMoreCallback().subscribe(newItems => {
            itemsSubject.next([...currentItems, ...newItems]);
          });
        }
        return currentItems;
      }),
      shareReplay(1)
    );
  }

  /**
   * Optimiza búsquedas con debouncing y memoización
   */
  optimizeSearch<T>(
    searchFunction: (term: string) => Observable<T[]>,
    searchTerm$: Observable<string>
  ): Observable<T[]> {
    const config = this.config();
    
    let searchObservable = searchTerm$;

    // Aplicar debouncing si está habilitado
    if (config.enableDebouncing) {
      searchObservable = searchObservable.pipe(
        debounceTime(config.debounceTime),
        distinctUntilChanged()
      );
    }

    return searchObservable.pipe(
      map(term => {
        const startTime = performance.now();

        // Verificar cache si está habilitado
        if (config.enableMemoization) {
          const cached = this.getFromCache<T[]>(term);
          if (cached) {
            this.updateMetrics({ 
              searchTime: performance.now() - startTime,
              cacheHitRate: this.calculateCacheHitRate()
            });
            return cached;
          }
        }

        // Ejecutar búsqueda
        const result = searchFunction(term);
        
        // Guardar en cache
        if (config.enableMemoization) {
          result.subscribe(data => {
            this.setCache(term, data);
          });
        }

        this.updateMetrics({ 
          searchTime: performance.now() - startTime,
          cacheHitRate: this.calculateCacheHitRate()
        });

        return result;
      }),
      shareReplay(1)
    );
  }

  /**
   * Optimiza renderizado con técnicas de performance
   */
  optimizeRendering<T>(
    items: T[],
    renderFunction: (item: T) => any
  ): any[] {
    const startTime = performance.now();

    // Usar requestAnimationFrame para renderizado suave
    return new Promise<any[]>((resolve) => {
      requestAnimationFrame(() => {
        const rendered = items.map(renderFunction);
        
        this.updateMetrics({
          renderTime: performance.now() - startTime,
          totalItems: items.length
        });

        resolve(rendered);
      });
    }) as any;
  }

  /**
   * Gestiona memoria y limpia recursos
   */
  cleanupMemory(): void {
    // Limpiar cache expirado
    this.cleanExpiredCache();

    // Forzar garbage collection si está disponible
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Actualizar métricas de memoria
    this.updateMemoryMetrics();
  }

  /**
   * Comprime datos si exceden el umbral
   */
  compressData<T>(data: T): T | string {
    if (!this.config().enableCompression) {
      return data;
    }

    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    if (size > this.config().compressionThreshold) {
      // Simular compresión (en implementación real usaría pako o similar)
      return `compressed:${btoa(serialized)}`;
    }

    return data;
  }

  /**
   * Descomprime datos
   */
  decompressData<T>(data: T | string): T {
    if (typeof data === 'string' && data.startsWith('compressed:')) {
      const compressed = data.replace('compressed:', '');
      const decompressed = atob(compressed);
      return JSON.parse(decompressed);
    }

    return data as T;
  }

  /**
   * Obtiene métricas de rendimiento
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.metricsSignal();
  }

  /**
   * Resetea métricas de rendimiento
   */
  resetMetrics(): void {
    this.metricsSignal.set({
      searchTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      totalItems: 0,
      visibleItems: 0,
      scrollPosition: 0,
      lastUpdate: new Date()
    });
  }

  /**
   * Optimiza lista de experiencias
   */
  optimizeExperiences(experiences: WorkExperience[]): Observable<WorkExperience[]> {
    return this.implementLazyLoading(
      experiences,
      () => new BehaviorSubject<WorkExperience[]>([]).asObservable(),
      this.config().lazyLoadingThreshold
    );
  }

  /**
   * Optimiza lista de educación
   */
  optimizeEducation(education: EducationEntry[]): Observable<EducationEntry[]> {
    return this.implementLazyLoading(
      education,
      () => new BehaviorSubject<EducationEntry[]>([]).asObservable(),
      this.config().lazyLoadingThreshold
    );
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Actualiza el viewport virtual
   */
  private updateViewport(viewport: VirtualViewport): void {
    this.viewportSubject.next(viewport);
  }

  /**
   * Actualiza métricas de rendimiento
   */
  private updateMetrics(updates: Partial<PerformanceMetrics>): void {
    const current = this.metricsSignal();
    this.metricsSignal.set({
      ...current,
      ...updates,
      lastUpdate: new Date()
    });
  }

  /**
   * Obtiene datos del cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Verificar TTL
    const now = Date.now();
    if (now - entry.timestamp > this.config().memoizationTTL) {
      this.cache.delete(key);
      return null;
    }

    // Incrementar hits
    entry.hits++;
    return entry.data;
  }

  /**
   * Guarda datos en cache
   */
  private setCache<T>(key: string, data: T): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanOldestCacheEntries();
    }

    const size = new Blob([JSON.stringify(data)]).size;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      size
    });
  }

  /**
   * Limpia entradas de cache expiradas
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const ttl = this.config().memoizationTTL;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia las entradas más antiguas del cache
   */
  private cleanOldestCacheEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Eliminar el 25% más antiguo
    const toDelete = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Calcula la tasa de aciertos del cache
   */
  private calculateCacheHitRate(): number {
    if (this.cache.size === 0) return 0;

    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = this.cache.size;
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Actualiza métricas de memoria
   */
  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.updateMetrics({
        memoryUsage: memory.usedJSHeapSize / memory.totalJSHeapSize * 100
      });
    }
  }
}
