/**
 * Servicio para la gestión de preferencias del CV
 * 
 * @description Maneja la persistencia de preferencias de usuario para el sistema CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdvancedSearchFilters } from './cv-search.service';

/**
 * Configuración de preferencias del CV
 */
export interface CvPreferences {
  // Preferencias de búsqueda
  searchPreferences: {
    defaultSortBy: 'date' | 'relevance' | 'alphabetical' | 'duration' | 'grade' | 'salary';
    defaultSortOrder: 'asc' | 'desc';
    enableFuzzySearch: boolean;
    enableAutoComplete: boolean;
    saveSearchHistory: boolean;
    maxSearchHistoryItems: number;
  };
  
  // Preferencias de visualización
  displayPreferences: {
    itemsPerPage: number;
    showThumbnails: boolean;
    compactView: boolean;
    showFacets: boolean;
    defaultView: 'list' | 'grid' | 'timeline';
    enableAnimations: boolean;
  };
  
  // Preferencias de exportación
  exportPreferences: {
    defaultFormat: 'pdf' | 'docx' | 'html';
    includePhotos: boolean;
    includeReferences: boolean;
    templateStyle: 'modern' | 'classic' | 'minimal' | 'creative';
    paperSize: 'A4' | 'Letter';
    margins: 'normal' | 'narrow' | 'wide';
  };
  
  // Preferencias de notificaciones
  notificationPreferences: {
    enableSaveNotifications: boolean;
    enableValidationAlerts: boolean;
    enableSuccessMessages: boolean;
    notificationDuration: number;
    soundEnabled: boolean;
  };
  
  // Filtros guardados
  savedFilters: SavedFilter[];
  
  // Historial de búsquedas
  searchHistory: SearchHistoryItem[];
  
  // Configuración de privacidad
  privacySettings: {
    shareUsageData: boolean;
    enableAnalytics: boolean;
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // en minutos
  };
}

/**
 * Filtro guardado por el usuario
 */
export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: AdvancedSearchFilters;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
  isDefault?: boolean;
}

/**
 * Elemento del historial de búsquedas
 */
export interface SearchHistoryItem {
  id: string;
  searchTerm: string;
  filters: Partial<AdvancedSearchFilters>;
  timestamp: Date;
  resultCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CvPreferencesService {
  private readonly STORAGE_KEY = 'mpd-cv-preferences';
  private readonly STORAGE_VERSION = '1.0.0';
  
  // Signals para preferencias reactivas
  private readonly preferencesSignal = signal<CvPreferences>(this.getDefaultPreferences());
  
  // Observables para compatibilidad
  private readonly preferencesSubject = new BehaviorSubject<CvPreferences>(this.getDefaultPreferences());
  
  // Getters públicos
  public readonly preferences = this.preferencesSignal.asReadonly();
  public readonly preferences$ = this.preferencesSubject.asObservable();
  
  // Computed signals para acceso rápido
  public readonly searchPreferences = computed(() => this.preferences().searchPreferences);
  public readonly displayPreferences = computed(() => this.preferences().displayPreferences);
  public readonly exportPreferences = computed(() => this.preferences().exportPreferences);
  public readonly notificationPreferences = computed(() => this.preferences().notificationPreferences);
  public readonly savedFilters = computed(() => this.preferences().savedFilters);
  public readonly searchHistory = computed(() => this.preferences().searchHistory);
  public readonly privacySettings = computed(() => this.preferences().privacySettings);

  constructor() {
    this.loadPreferences();
    this.setupAutoSave();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Actualiza las preferencias de búsqueda
   */
  updateSearchPreferences(preferences: Partial<CvPreferences['searchPreferences']>): void {
    this.updatePreferences({
      searchPreferences: { ...this.preferences().searchPreferences, ...preferences }
    });
  }

  /**
   * Actualiza las preferencias de visualización
   */
  updateDisplayPreferences(preferences: Partial<CvPreferences['displayPreferences']>): void {
    this.updatePreferences({
      displayPreferences: { ...this.preferences().displayPreferences, ...preferences }
    });
  }

  /**
   * Actualiza las preferencias de exportación
   */
  updateExportPreferences(preferences: Partial<CvPreferences['exportPreferences']>): void {
    this.updatePreferences({
      exportPreferences: { ...this.preferences().exportPreferences, ...preferences }
    });
  }

  /**
   * Actualiza las preferencias de notificaciones
   */
  updateNotificationPreferences(preferences: Partial<CvPreferences['notificationPreferences']>): void {
    this.updatePreferences({
      notificationPreferences: { ...this.preferences().notificationPreferences, ...preferences }
    });
  }

  /**
   * Guarda un filtro de búsqueda
   */
  saveFilter(name: string, filters: AdvancedSearchFilters, description?: string): SavedFilter {
    const newFilter: SavedFilter = {
      id: this.generateId(),
      name,
      description,
      filters,
      createdAt: new Date(),
      useCount: 0
    };

    const currentFilters = this.preferences().savedFilters;
    this.updatePreferences({
      savedFilters: [...currentFilters, newFilter]
    });

    return newFilter;
  }

  /**
   * Elimina un filtro guardado
   */
  deleteFilter(filterId: string): void {
    const currentFilters = this.preferences().savedFilters;
    this.updatePreferences({
      savedFilters: currentFilters.filter(f => f.id !== filterId)
    });
  }

  /**
   * Actualiza un filtro guardado
   */
  updateFilter(filterId: string, updates: Partial<SavedFilter>): void {
    const currentFilters = this.preferences().savedFilters;
    const updatedFilters = currentFilters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    
    this.updatePreferences({
      savedFilters: updatedFilters
    });
  }

  /**
   * Marca un filtro como usado
   */
  markFilterAsUsed(filterId: string): void {
    const filter = this.preferences().savedFilters.find(f => f.id === filterId);
    if (filter) {
      this.updateFilter(filterId, {
        lastUsed: new Date(),
        useCount: filter.useCount + 1
      });
    }
  }

  /**
   * Agrega una búsqueda al historial
   */
  addToSearchHistory(searchTerm: string, filters: Partial<AdvancedSearchFilters>, resultCount: number): void {
    if (!this.preferences().searchPreferences.saveSearchHistory) {
      return;
    }

    const newItem: SearchHistoryItem = {
      id: this.generateId(),
      searchTerm,
      filters,
      timestamp: new Date(),
      resultCount
    };

    const currentHistory = this.preferences().searchHistory;
    const maxItems = this.preferences().searchPreferences.maxSearchHistoryItems;
    
    // Evitar duplicados recientes
    const filteredHistory = currentHistory.filter(item => 
      item.searchTerm !== searchTerm || 
      JSON.stringify(item.filters) !== JSON.stringify(filters)
    );

    const updatedHistory = [newItem, ...filteredHistory].slice(0, maxItems);
    
    this.updatePreferences({
      searchHistory: updatedHistory
    });
  }

  /**
   * Limpia el historial de búsquedas
   */
  clearSearchHistory(): void {
    this.updatePreferences({
      searchHistory: []
    });
  }

  /**
   * Exporta las preferencias como JSON
   */
  exportPreferencesToJson(): string {
    return JSON.stringify({
      version: this.STORAGE_VERSION,
      preferences: this.preferences(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Importa preferencias desde JSON
   */
  importPreferences(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.version && data.preferences) {
        this.updatePreferences(data.preferences);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing preferences:', error);
      return false;
    }
  }

  /**
   * Resetea las preferencias a los valores por defecto
   */
  resetToDefaults(): void {
    const defaults = this.getDefaultPreferences();
    this.preferencesSignal.set(defaults);
    this.preferencesSubject.next(defaults);
    this.savePreferences();
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Actualiza las preferencias
   */
  private updatePreferences(updates: Partial<CvPreferences>): void {
    const current = this.preferences();
    const updated = { ...current, ...updates };
    
    this.preferencesSignal.set(updated);
    this.preferencesSubject.next(updated);
    this.savePreferences();
  }

  /**
   * Carga las preferencias desde localStorage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.STORAGE_VERSION) {
          const preferences = { ...this.getDefaultPreferences(), ...data.preferences };
          this.preferencesSignal.set(preferences);
          this.preferencesSubject.next(preferences);
        } else {
          // Migrar versión si es necesario
          this.migratePreferences(data);
        }
      }
    } catch (error) {
      console.error('Error loading CV preferences:', error);
      this.resetToDefaults();
    }
  }

  /**
   * Guarda las preferencias en localStorage
   */
  private savePreferences(): void {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        preferences: this.preferences(),
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving CV preferences:', error);
    }
  }

  /**
   * Configura el auto-guardado
   */
  private setupAutoSave(): void {
    effect(() => {
      const preferences = this.preferences();
      if (preferences.privacySettings.autoSaveEnabled) {
        // El efecto se ejecuta automáticamente cuando cambian las preferencias
        // No necesitamos lógica adicional aquí ya que savePreferences() se llama en updatePreferences()
      }
    });
  }

  /**
   * Migra preferencias de versiones anteriores
   */
  private migratePreferences(oldData: any): void {
    // Implementar lógica de migración si es necesario
    console.log('Migrating preferences from older version');
    this.resetToDefaults();
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene las preferencias por defecto
   */
  private getDefaultPreferences(): CvPreferences {
    return {
      searchPreferences: {
        defaultSortBy: 'date',
        defaultSortOrder: 'desc',
        enableFuzzySearch: true,
        enableAutoComplete: true,
        saveSearchHistory: true,
        maxSearchHistoryItems: 50
      },
      displayPreferences: {
        itemsPerPage: 10,
        showThumbnails: true,
        compactView: false,
        showFacets: true,
        defaultView: 'list',
        enableAnimations: true
      },
      exportPreferences: {
        defaultFormat: 'pdf',
        includePhotos: true,
        includeReferences: true,
        templateStyle: 'modern',
        paperSize: 'A4',
        margins: 'normal'
      },
      notificationPreferences: {
        enableSaveNotifications: true,
        enableValidationAlerts: true,
        enableSuccessMessages: true,
        notificationDuration: 3000,
        soundEnabled: false
      },
      savedFilters: [],
      searchHistory: [],
      privacySettings: {
        shareUsageData: false,
        enableAnalytics: true,
        autoSaveEnabled: true,
        autoSaveInterval: 5
      }
    };
  }
}
