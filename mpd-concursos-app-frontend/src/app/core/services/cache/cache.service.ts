import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interfaz para los elementos de caché
 */
export interface CacheItem<T> {
  /** Datos almacenados en caché */
  data: T;
  /** Timestamp de expiración */
  expiry: number;
  /** Clave de caché */
  key: string;
}

/**
 * Opciones de caché
 */
export interface CacheOptions {
  /** Tiempo de vida en milisegundos (por defecto: 5 minutos) */
  ttl?: number;
  /** Si se debe forzar la actualización de la caché */
  forceRefresh?: boolean;
  /** Clave de caché personalizada */
  customKey?: string;
}

/**
 * Servicio de caché para almacenar datos temporalmente
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  /** Almacenamiento de caché en memoria */
  private cache = new Map<string, CacheItem<any>>();
  
  /** Tiempo de vida predeterminado: 5 minutos */
  private defaultTTL = 5 * 60 * 1000;
  
  /** Tamaño máximo de caché (número de elementos) */
  private maxCacheSize = 100;
  
  constructor(
    private loggingService: LoggingService
  ) {
    // Iniciar limpieza periódica de caché
    this.startPeriodicCleanup();
  }
  
  /**
   * Obtiene un elemento de la caché
   * @param key Clave de caché
   * @returns Datos almacenados o null si no existe o ha expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar si el elemento ha expirado
    if (Date.now() > item.expiry) {
      this.remove(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Almacena un elemento en la caché
   * @param key Clave de caché
   * @param data Datos a almacenar
   * @param options Opciones de caché
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Limpiar caché si está llena
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupOldestItems(Math.floor(this.maxCacheSize * 0.2));
    }
    
    const ttl = options.ttl || this.defaultTTL;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, { data, expiry, key });
  }
  
  /**
   * Elimina un elemento de la caché
   * @param key Clave de caché
   */
  remove(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Verifica si un elemento existe en la caché y no ha expirado
   * @param key Clave de caché
   * @returns true si el elemento existe y no ha expirado
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Verificar si el elemento ha expirado
    if (Date.now() > item.expiry) {
      this.remove(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtiene todas las claves de caché
   * @returns Array de claves
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Obtiene el tamaño actual de la caché
   * @returns Número de elementos en caché
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Limpia los elementos expirados de la caché
   */
  cleanupExpiredItems(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Limpia los elementos más antiguos de la caché
   * @param count Número de elementos a limpiar
   */
  private cleanupOldestItems(count: number): void {
    // Ordenar elementos por tiempo de expiración
    const items = Array.from(this.cache.values())
      .sort((a, b) => a.expiry - b.expiry);
    
    // Eliminar los elementos más antiguos
    for (let i = 0; i < Math.min(count, items.length); i++) {
      this.cache.delete(items[i].key);
    }
  }
  
  /**
   * Inicia la limpieza periódica de caché
   */
  private startPeriodicCleanup(): void {
    // Limpiar caché cada minuto
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60 * 1000);
  }
}
