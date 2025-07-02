/**
 * Servicio de Cache para Documentos
 * 
 * @description Servicio especializado para gestión de cache de documentos siguiendo SRP
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DocumentoUsuario, TipoDocumento } from '../../models/documento.model';

/**
 * Entrada de cache para documentos
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Estadísticas del cache
 */
export interface CacheStats {
  documentsCount: number;
  typesCount: number;
  lastDocumentUpdate: Date | null;
  lastTypeUpdate: Date | null;
  hitRate: number;
  missRate: number;
  totalRequests: number;
}

/**
 * Configuración del cache
 */
export interface CacheConfig {
  defaultTimeout: number;
  maxEntries: number;
  enableStats: boolean;
  enableDebugLogs: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentCacheService {
  
  // Configuración por defecto
  private readonly defaultConfig: CacheConfig = {
    defaultTimeout: 5 * 60 * 1000, // 5 minutos
    maxEntries: 100,
    enableStats: true,
    enableDebugLogs: false
  };

  // Cache interno
  private documentsCache = new Map<string, CacheEntry<DocumentoUsuario[]>>();
  private typesCache = new Map<string, CacheEntry<TipoDocumento[]>>();
  
  // Estadísticas
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  // Subjects para notificaciones de cambios
  private cacheUpdatedSubject = new BehaviorSubject<string>('');
  public readonly cacheUpdated$ = this.cacheUpdatedSubject.asObservable();

  constructor() {
    this.log('DocumentCacheService inicializado');
    
    // Limpiar cache expirado cada 5 minutos
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Obtiene documentos del cache
   * @param key Clave del cache (ej: userId)
   * @param timeout Timeout personalizado en ms
   */
  getDocuments(key: string, timeout?: number): Observable<DocumentoUsuario[]> | null {
    this.stats.totalRequests++;
    
    const entry = this.documentsCache.get(key);
    const now = Date.now();
    const effectiveTimeout = timeout || this.defaultConfig.defaultTimeout;

    if (entry && (now - entry.timestamp) < effectiveTimeout) {
      this.stats.hits++;
      this.log(`Cache HIT para documentos: ${key}`);
      return of(entry.data);
    }

    this.stats.misses++;
    this.log(`Cache MISS para documentos: ${key}`);
    return null;
  }

  /**
   * Almacena documentos en el cache
   * @param key Clave del cache
   * @param data Datos a almacenar
   * @param timeout Timeout personalizado en ms
   */
  setDocuments(key: string, data: DocumentoUsuario[], timeout?: number): void {
    const now = Date.now();
    const effectiveTimeout = timeout || this.defaultConfig.defaultTimeout;
    
    const entry: CacheEntry<DocumentoUsuario[]> = {
      data: [...data], // Clonar para evitar mutaciones
      timestamp: now,
      expiresAt: now + effectiveTimeout
    };

    this.documentsCache.set(key, entry);
    this.enforceMaxEntries(this.documentsCache);
    
    this.log(`Documentos almacenados en cache: ${key} (${data.length} elementos)`);
    this.notifyCacheUpdate(`documents:${key}`);
  }

  /**
   * Obtiene tipos de documento del cache
   * @param key Clave del cache
   * @param timeout Timeout personalizado en ms
   */
  getDocumentTypes(key: string = 'default', timeout?: number): Observable<TipoDocumento[]> | null {
    this.stats.totalRequests++;
    
    const entry = this.typesCache.get(key);
    const now = Date.now();
    const effectiveTimeout = timeout || this.defaultConfig.defaultTimeout;

    if (entry && (now - entry.timestamp) < effectiveTimeout) {
      this.stats.hits++;
      this.log(`Cache HIT para tipos: ${key}`);
      return of(entry.data);
    }

    this.stats.misses++;
    this.log(`Cache MISS para tipos: ${key}`);
    return null;
  }

  /**
   * Almacena tipos de documento en el cache
   * @param key Clave del cache
   * @param data Datos a almacenar
   * @param timeout Timeout personalizado en ms
   */
  setDocumentTypes(key: string = 'default', data: TipoDocumento[], timeout?: number): void {
    const now = Date.now();
    const effectiveTimeout = timeout || this.defaultConfig.defaultTimeout;
    
    const entry: CacheEntry<TipoDocumento[]> = {
      data: [...data], // Clonar para evitar mutaciones
      timestamp: now,
      expiresAt: now + effectiveTimeout
    };

    this.typesCache.set(key, entry);
    this.enforceMaxEntries(this.typesCache);
    
    this.log(`Tipos de documento almacenados en cache: ${key} (${data.length} elementos)`);
    this.notifyCacheUpdate(`types:${key}`);
  }

  /**
   * Invalida documentos del cache
   * @param key Clave específica o null para invalidar todo
   */
  invalidateDocuments(key?: string): void {
    if (key) {
      this.documentsCache.delete(key);
      this.log(`Cache invalidado para documentos: ${key}`);
    } else {
      this.documentsCache.clear();
      this.log('Cache de documentos completamente invalidado');
    }
    
    this.notifyCacheUpdate(`invalidate:documents:${key || 'all'}`);
  }

  /**
   * Invalida tipos de documento del cache
   * @param key Clave específica o null para invalidar todo
   */
  invalidateDocumentTypes(key?: string): void {
    if (key) {
      this.typesCache.delete(key);
      this.log(`Cache invalidado para tipos: ${key}`);
    } else {
      this.typesCache.clear();
      this.log('Cache de tipos completamente invalidado');
    }
    
    this.notifyCacheUpdate(`invalidate:types:${key || 'all'}`);
  }

  /**
   * Limpia todo el cache
   */
  clearAll(): void {
    this.documentsCache.clear();
    this.typesCache.clear();
    this.resetStats();
    
    this.log('Cache completamente limpiado');
    this.notifyCacheUpdate('clear:all');
  }

  /**
   * Verifica si hay datos en cache
   */
  hasCache(): boolean {
    return this.documentsCache.size > 0 || this.typesCache.size > 0;
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    const documentsCount = Array.from(this.documentsCache.values())
      .reduce((sum, entry) => sum + entry.data.length, 0);
    
    const typesCount = Array.from(this.typesCache.values())
      .reduce((sum, entry) => sum + entry.data.length, 0);

    const lastDocumentUpdate = this.getLastUpdateTime(this.documentsCache);
    const lastTypeUpdate = this.getLastUpdateTime(this.typesCache);

    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    
    const missRate = this.stats.totalRequests > 0 
      ? (this.stats.misses / this.stats.totalRequests) * 100 
      : 0;

    return {
      documentsCount,
      typesCount,
      lastDocumentUpdate,
      lastTypeUpdate,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalRequests: this.stats.totalRequests
    };
  }

  /**
   * Limpia entradas expiradas del cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Limpiar documentos expirados
    for (const [key, entry] of this.documentsCache.entries()) {
      if (now > entry.expiresAt) {
        this.documentsCache.delete(key);
        cleanedCount++;
      }
    }

    // Limpiar tipos expirados
    for (const [key, entry] of this.typesCache.entries()) {
      if (now > entry.expiresAt) {
        this.typesCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.log(`Limpiadas ${cleanedCount} entradas expiradas del cache`);
    }
  }

  /**
   * Aplica límite máximo de entradas
   */
  private enforceMaxEntries<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size > this.defaultConfig.maxEntries) {
      // Eliminar las entradas más antiguas
      const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.size - this.defaultConfig.maxEntries);
      toRemove.forEach(([key]) => cache.delete(key));
      
      this.log(`Eliminadas ${toRemove.length} entradas antiguas del cache`);
    }
  }

  /**
   * Obtiene la fecha de última actualización de un cache
   */
  private getLastUpdateTime<T>(cache: Map<string, CacheEntry<T>>): Date | null {
    let lastTimestamp = 0;
    
    for (const entry of cache.values()) {
      if (entry.timestamp > lastTimestamp) {
        lastTimestamp = entry.timestamp;
      }
    }
    
    return lastTimestamp > 0 ? new Date(lastTimestamp) : null;
  }

  /**
   * Notifica cambios en el cache
   */
  private notifyCacheUpdate(event: string): void {
    this.cacheUpdatedSubject.next(event);
  }

  /**
   * Resetea estadísticas
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Log de debug
   */
  private log(message: string): void {
    if (this.defaultConfig.enableDebugLogs) {
      console.log(`[DocumentCacheService] ${message}`);
    }
  }
}
