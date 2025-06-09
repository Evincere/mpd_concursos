import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

/**
 * Simplified service for working with local storage.
 * Uses localStorage as the primary storage to avoid IndexedDB complexities.
 */
@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private prefix = 'mpd-concursos-app';

  constructor(private loggingService: LoggingService) { // Inject LoggingService
    this.loggingService.debug('[IndexedDBService] Initializing IndexedDBService (using localStorage).', undefined, 'StorageService');
  }

  /**
   * Saves a value to local storage.
   * @param storeName Logical store name (e.g., 'user-settings').
   * @param key Key under which to store the value.
   * @param value The value to store.
   * @returns An Observable that emits the stored value on success.
   */
  set<T>(storeName: string, key: string, value: T): Observable<T> {
    const fullKey = `${this.prefix}_${storeName}_${key}`;
    this.loggingService.debug(`[IndexedDBService] Attempting to set item: "${fullKey}"`, value, 'StorageService');
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
      this.loggingService.debug(`[IndexedDBService] Item "${fullKey}" set successfully.`, undefined, 'StorageService');
      return of(value);
    } catch (error) {
      this.loggingService.error(`[IndexedDBService] Error saving to localStorage for key "${fullKey}":`, error, 'StorageService');
      // Return the value even if there's an error, as per original logic, but log it.
      return of(value);
    }
  }

  /**
   * Retrieves a value from local storage.
   * @param storeName Logical store name.
   * @param key Key of the value to retrieve.
   * @returns An Observable that emits the retrieved value or null if not found/error.
   */
  get<T>(storeName: string, key: string): Observable<T | null> {
    const fullKey = `${this.prefix}_${storeName}_${key}`;
    this.loggingService.debug(`[IndexedDBService] Attempting to get item: "${fullKey}"`, undefined, 'StorageService');
    try {
      const value = localStorage.getItem(fullKey);
      const parsedValue = value ? JSON.parse(value) : null;
      this.loggingService.debug(`[IndexedDBService] Item "${fullKey}" retrieved successfully.`, parsedValue, 'StorageService');
      return of(parsedValue);
    } catch (error) {
      this.loggingService.error(`[IndexedDBService] Error getting from localStorage for key "${fullKey}":`, error, 'StorageService');
      return of(null);
    }
  }

  /**
   * Removes a value from local storage.
   * @param storeName Logical store name.
   * @param key Key of the value to remove.
   * @returns An Observable that emits true on success, false on error.
   */
  remove(storeName: string, key: string): Observable<boolean> {
    const fullKey = `${this.prefix}_${storeName}_${key}`;
    this.loggingService.debug(`[IndexedDBService] Attempting to remove item: "${fullKey}"`, undefined, 'StorageService');
    try {
      localStorage.removeItem(fullKey);
      this.loggingService.debug(`[IndexedDBService] Item "${fullKey}" removed successfully.`, undefined, 'StorageService');
      return of(true);
    } catch (error) {
      this.loggingService.error(`[IndexedDBService] Error removing from localStorage for key "${fullKey}":`, error, 'StorageService');
      return of(false);
    }
  }

  /**
   * Clears all data from a specific store.
   * @param storeName Logical store name to clear.
   * @returns An Observable that emits true on success, false on error.
   */
  clear(storeName: string): Observable<boolean> {
    const prefix = `${this.prefix}_${storeName}_`;
    this.loggingService.debug(`[IndexedDBService] Attempting to clear store: "${storeName}" (prefix: "${prefix}")`, undefined, 'StorageService');
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        this.loggingService.debug(`[IndexedDBService] Removed key: "${key}" during clear operation.`, undefined, 'StorageService');
      });
      this.loggingService.info(`[IndexedDBService] Store "${storeName}" cleared successfully. Removed ${keysToRemove.length} items.`, undefined, 'StorageService');
      return of(true);
    } catch (error) {
      this.loggingService.error(`[IndexedDBService] Error clearing localStorage for store "${storeName}":`, error, 'StorageService');
      return of(false);
    }
  }
}
