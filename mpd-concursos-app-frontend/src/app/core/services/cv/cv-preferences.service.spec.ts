/**
 * Tests Unitarios para CvPreferencesService
 * 
 * @description Tests completos para el servicio de gestión de preferencias del CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { CvPreferencesService, CvPreferences, SavedFilter } from './cv-preferences.service';
import { AdvancedSearchFilters } from './cv-search.service';

describe('CvPreferencesService', () => {
  let service: CvPreferencesService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return mockLocalStorage[key] || null;
    });
    
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
    });

    TestBed.configureTestingModule({
      providers: [CvPreferencesService]
    });

    service = TestBed.inject(CvPreferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('should initialize with default preferences', () => {
      const preferences = service.preferences();
      
      expect(preferences.searchPreferences.defaultSortBy).toBe('date');
      expect(preferences.searchPreferences.defaultSortOrder).toBe('desc');
      expect(preferences.searchPreferences.enableFuzzySearch).toBe(true);
      expect(preferences.displayPreferences.itemsPerPage).toBe(10);
      expect(preferences.exportPreferences.defaultFormat).toBe('pdf');
    });

    it('should load preferences from localStorage if available', () => {
      const storedPreferences: CvPreferences = {
        searchPreferences: {
          defaultSortBy: 'alphabetical',
          defaultSortOrder: 'asc',
          enableFuzzySearch: false,
          enableAutoComplete: true,
          saveSearchHistory: true,
          maxSearchHistoryItems: 25
        },
        displayPreferences: {
          itemsPerPage: 20,
          showThumbnails: false,
          compactView: true,
          showFacets: false,
          defaultView: 'grid',
          enableAnimations: false
        },
        exportPreferences: {
          defaultFormat: 'docx',
          includePhotos: false,
          includeReferences: false,
          templateStyle: 'classic',
          paperSize: 'Letter',
          margins: 'wide'
        },
        notificationPreferences: {
          enableSaveNotifications: false,
          enableValidationAlerts: true,
          enableSuccessMessages: false,
          notificationDuration: 5000,
          soundEnabled: true
        },
        savedFilters: [],
        searchHistory: [],
        privacySettings: {
          shareUsageData: true,
          enableAnalytics: false,
          autoSaveEnabled: false,
          autoSaveInterval: 10
        }
      };

      mockLocalStorage['mpd-cv-preferences'] = JSON.stringify({
        version: '1.0.0',
        preferences: storedPreferences
      });

      // Crear nueva instancia para probar la carga
      const newService = new CvPreferencesService();
      const loadedPreferences = newService.preferences();

      expect(loadedPreferences.searchPreferences.defaultSortBy).toBe('alphabetical');
      expect(loadedPreferences.displayPreferences.itemsPerPage).toBe(20);
      expect(loadedPreferences.exportPreferences.defaultFormat).toBe('docx');
    });
  });

  describe('Actualización de preferencias de búsqueda', () => {
    it('should update search preferences', () => {
      const updates = {
        defaultSortBy: 'relevance' as const,
        enableFuzzySearch: false,
        maxSearchHistoryItems: 100
      };

      service.updateSearchPreferences(updates);
      const preferences = service.preferences();

      expect(preferences.searchPreferences.defaultSortBy).toBe('relevance');
      expect(preferences.searchPreferences.enableFuzzySearch).toBe(false);
      expect(preferences.searchPreferences.maxSearchHistoryItems).toBe(100);
    });

    it('should persist search preferences to localStorage', () => {
      service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mpd-cv-preferences',
        jasmine.any(String)
      );
    });
  });

  describe('Actualización de preferencias de visualización', () => {
    it('should update display preferences', () => {
      const updates = {
        itemsPerPage: 25,
        compactView: true,
        defaultView: 'timeline' as const
      };

      service.updateDisplayPreferences(updates);
      const preferences = service.preferences();

      expect(preferences.displayPreferences.itemsPerPage).toBe(25);
      expect(preferences.displayPreferences.compactView).toBe(true);
      expect(preferences.displayPreferences.defaultView).toBe('timeline');
    });
  });

  describe('Gestión de filtros guardados', () => {
    let mockFilters: AdvancedSearchFilters;

    beforeEach(() => {
      mockFilters = {
        searchTerm: 'Angular',
        companies: ['TechCorp'],
        technologies: ['Angular', 'TypeScript'],
        dateRange: {},
        positions: [],
        institutions: [],
        educationTypes: [],
        educationStatuses: [],
        keywords: [],
        excludeKeywords: [],
        locationFilters: [],
        sortBy: 'relevance',
        sortOrder: 'desc',
        fuzzySearch: true,
        exactMatch: false,
        caseSensitive: false
      };
    });

    it('should save a new filter', () => {
      const savedFilter = service.saveFilter('Mi Filtro', mockFilters, 'Descripción de prueba');

      expect(savedFilter.name).toBe('Mi Filtro');
      expect(savedFilter.description).toBe('Descripción de prueba');
      expect(savedFilter.filters).toEqual(mockFilters);
      expect(savedFilter.id).toBeDefined();
      expect(savedFilter.createdAt).toBeInstanceOf(Date);
      expect(savedFilter.useCount).toBe(0);

      const preferences = service.preferences();
      expect(preferences.savedFilters.length).toBe(1);
      expect(preferences.savedFilters[0]).toEqual(savedFilter);
    });

    it('should delete a saved filter', () => {
      const savedFilter = service.saveFilter('Test Filter', mockFilters);
      expect(service.preferences().savedFilters.length).toBe(1);

      service.deleteFilter(savedFilter.id);
      expect(service.preferences().savedFilters.length).toBe(0);
    });

    it('should update a saved filter', () => {
      const savedFilter = service.saveFilter('Original Name', mockFilters);
      
      service.updateFilter(savedFilter.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      const updatedFilter = service.preferences().savedFilters[0];
      expect(updatedFilter.name).toBe('Updated Name');
      expect(updatedFilter.description).toBe('Updated description');
    });

    it('should mark filter as used', () => {
      const savedFilter = service.saveFilter('Test Filter', mockFilters);
      expect(savedFilter.useCount).toBe(0);
      expect(savedFilter.lastUsed).toBeUndefined();

      service.markFilterAsUsed(savedFilter.id);

      const updatedFilter = service.preferences().savedFilters[0];
      expect(updatedFilter.useCount).toBe(1);
      expect(updatedFilter.lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('Historial de búsquedas', () => {
    it('should add search to history', () => {
      const searchTerm = 'Angular Developer';
      const filters = { companies: ['TechCorp'] };
      const resultCount = 5;

      service.addToSearchHistory(searchTerm, filters, resultCount);

      const history = service.preferences().searchHistory;
      expect(history.length).toBe(1);
      expect(history[0].searchTerm).toBe(searchTerm);
      expect(history[0].filters).toEqual(filters);
      expect(history[0].resultCount).toBe(resultCount);
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should not add to history if saveSearchHistory is disabled', () => {
      service.updateSearchPreferences({ saveSearchHistory: false });
      
      service.addToSearchHistory('test', {}, 1);
      
      expect(service.preferences().searchHistory.length).toBe(0);
    });

    it('should limit history size to maxSearchHistoryItems', () => {
      service.updateSearchPreferences({ maxSearchHistoryItems: 2 });

      service.addToSearchHistory('search1', {}, 1);
      service.addToSearchHistory('search2', {}, 2);
      service.addToSearchHistory('search3', {}, 3);

      const history = service.preferences().searchHistory;
      expect(history.length).toBe(2);
      expect(history[0].searchTerm).toBe('search3'); // Más reciente primero
      expect(history[1].searchTerm).toBe('search2');
    });

    it('should avoid duplicate recent searches', () => {
      const searchTerm = 'Angular';
      const filters = { companies: ['TechCorp'] };

      service.addToSearchHistory(searchTerm, filters, 5);
      service.addToSearchHistory(searchTerm, filters, 3); // Misma búsqueda

      const history = service.preferences().searchHistory;
      expect(history.length).toBe(1);
      expect(history[0].resultCount).toBe(3); // Debe mantener la más reciente
    });

    it('should clear search history', () => {
      service.addToSearchHistory('test1', {}, 1);
      service.addToSearchHistory('test2', {}, 2);
      expect(service.preferences().searchHistory.length).toBe(2);

      service.clearSearchHistory();
      expect(service.preferences().searchHistory.length).toBe(0);
    });
  });

  describe('Exportación e importación', () => {
    it('should export preferences as JSON', () => {
      service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });
      
      const exportedData = service.exportPreferences();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.version).toBe('1.0.0');
      expect(parsedData.preferences).toBeDefined();
      expect(parsedData.preferences.searchPreferences.defaultSortBy).toBe('alphabetical');
      expect(parsedData.exportedAt).toBeDefined();
    });

    it('should import preferences from valid JSON', () => {
      const importData = {
        version: '1.0.0',
        preferences: {
          searchPreferences: {
            defaultSortBy: 'relevance',
            defaultSortOrder: 'asc',
            enableFuzzySearch: false,
            enableAutoComplete: true,
            saveSearchHistory: true,
            maxSearchHistoryItems: 75
          }
        }
      };

      const success = service.importPreferences(JSON.stringify(importData));
      
      expect(success).toBe(true);
      expect(service.preferences().searchPreferences.defaultSortBy).toBe('relevance');
    });

    it('should reject invalid JSON during import', () => {
      const success = service.importPreferences('invalid json');
      expect(success).toBe(false);
    });

    it('should reject JSON without version during import', () => {
      const invalidData = { preferences: {} };
      const success = service.importPreferences(JSON.stringify(invalidData));
      expect(success).toBe(false);
    });
  });

  describe('Reset a valores por defecto', () => {
    it('should reset all preferences to defaults', () => {
      // Modificar algunas preferencias
      service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });
      service.updateDisplayPreferences({ itemsPerPage: 50 });
      service.saveFilter('Test Filter', {} as AdvancedSearchFilters);

      // Verificar que se modificaron
      expect(service.preferences().searchPreferences.defaultSortBy).toBe('alphabetical');
      expect(service.preferences().displayPreferences.itemsPerPage).toBe(50);
      expect(service.preferences().savedFilters.length).toBe(1);

      // Resetear
      service.resetToDefaults();

      // Verificar que volvieron a los valores por defecto
      const preferences = service.preferences();
      expect(preferences.searchPreferences.defaultSortBy).toBe('date');
      expect(preferences.displayPreferences.itemsPerPage).toBe(10);
      expect(preferences.savedFilters.length).toBe(0);
    });
  });

  describe('Computed signals', () => {
    it('should provide reactive access to specific preference sections', () => {
      const searchPrefs = service.searchPreferences();
      const displayPrefs = service.displayPreferences();
      const exportPrefs = service.exportPreferences();

      expect(searchPrefs.defaultSortBy).toBe('date');
      expect(displayPrefs.itemsPerPage).toBe(10);
      expect(exportPrefs.defaultFormat).toBe('pdf');

      // Actualizar y verificar reactividad
      service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });
      expect(service.searchPreferences().defaultSortBy).toBe('alphabetical');
    });
  });

  describe('Manejo de errores', () => {
    it('should handle localStorage errors gracefully', () => {
      // Simular error en localStorage
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage full');

      expect(() => {
        service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });
      }).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage['mpd-cv-preferences'] = 'corrupted data';

      expect(() => {
        new CvPreferencesService();
      }).not.toThrow();
    });
  });

  describe('Observables para compatibilidad', () => {
    it('should provide observable access to preferences', (done) => {
      service.preferences$.subscribe(preferences => {
        expect(preferences.searchPreferences.defaultSortBy).toBe('date');
        done();
      });
    });

    it('should emit changes through observable', (done) => {
      let emissionCount = 0;
      
      service.preferences$.subscribe(preferences => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(preferences.searchPreferences.defaultSortBy).toBe('alphabetical');
          done();
        }
      });

      service.updateSearchPreferences({ defaultSortBy: 'alphabetical' });
    });
  });
});
