import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Servicio simplificado para trabajar con almacenamiento local
 * Usa localStorage como almacenamiento principal para evitar problemas con IndexedDB
 */
@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private prefix = 'mpd-concursos-app';

  constructor() {
    console.log('Servicio de almacenamiento local inicializado');
  }

  /**
   * Guarda un valor en el almacenamiento local
   */
  set<T>(storeName: string, key: string, value: T): Observable<T> {
    try {
      const fullKey = `${this.prefix}_${storeName}_${key}`;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return of(value);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      return of(value); // Devolver el valor incluso si hay error
    }
  }

  /**
   * Obtiene un valor del almacenamiento local
   */
  get<T>(storeName: string, key: string): Observable<T | null> {
    try {
      const fullKey = `${this.prefix}_${storeName}_${key}`;
      const value = localStorage.getItem(fullKey);
      return of(value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Error al obtener de localStorage:', error);
      return of(null);
    }
  }

  /**
   * Elimina un valor del almacenamiento local
   */
  remove(storeName: string, key: string): Observable<boolean> {
    try {
      const fullKey = `${this.prefix}_${storeName}_${key}`;
      localStorage.removeItem(fullKey);
      return of(true);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      return of(false);
    }
  }

  /**
   * Limpia todos los datos de un almacén
   */
  clear(storeName: string): Observable<boolean> {
    try {
      const prefix = `${this.prefix}_${storeName}_`;

      // Obtener todas las claves que comienzan con el prefijo
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // Eliminar todas las claves encontradas
      keysToRemove.forEach(key => localStorage.removeItem(key));

      return of(true);
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      return of(false);
    }
  }
}
