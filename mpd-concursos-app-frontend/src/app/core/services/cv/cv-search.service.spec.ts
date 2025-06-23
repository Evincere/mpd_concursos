/**
 * Tests Unitarios para CvSearchService
 * 
 * @description Tests completos para el servicio de búsqueda avanzada del CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CvSearchService, AdvancedSearchFilters, SearchResult } from './cv-search.service';
import { CvPreferencesService } from './cv-preferences.service';
import { WorkExperience, EducationEntry, EducationType, EducationStatus } from '@core/models/cv';

describe('CvSearchService', () => {
  let service: CvSearchService;
  let mockPreferencesService: jasmine.SpyObj<CvPreferencesService>;
  let mockExperiences: WorkExperience[];
  let mockEducation: EducationEntry[];

  beforeEach(() => {
    // Mock del servicio de preferencias
    const preferencesServiceSpy = jasmine.createSpyObj('CvPreferencesService', [
      'addToSearchHistory',
      'saveFilter',
      'markFilterAsUsed',
      'savedFilters',
      'searchHistory',
      'searchPreferences'
    ]);

    // Configurar valores por defecto del mock
    preferencesServiceSpy.savedFilters.and.returnValue([]);
    preferencesServiceSpy.searchHistory.and.returnValue([]);
    preferencesServiceSpy.searchPreferences.and.returnValue({
      defaultSortBy: 'date',
      defaultSortOrder: 'desc',
      enableFuzzySearch: true,
      enableAutoComplete: true,
      saveSearchHistory: true,
      maxSearchHistoryItems: 50
    });

    TestBed.configureTestingModule({
      providers: [
        CvSearchService,
        { provide: CvPreferencesService, useValue: preferencesServiceSpy }
      ]
    });

    service = TestBed.inject(CvSearchService);
    mockPreferencesService = TestBed.inject(CvPreferencesService) as jasmine.SpyObj<CvPreferencesService>;

    // Datos de prueba
    mockExperiences = [
      {
        id: '1',
        position: 'Desarrollador Frontend',
        company: 'TechCorp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-12-31'),
        description: 'Desarrollo de aplicaciones web con Angular y TypeScript',
        technologies: ['Angular', 'TypeScript', 'JavaScript'],
        achievements: ['Implementó sistema de testing', 'Mejoró performance 30%'],
        isCurrentJob: false,
        location: 'Buenos Aires'
      },
      {
        id: '2',
        position: 'Desarrollador Full Stack',
        company: 'StartupXYZ',
        startDate: new Date('2021-06-01'),
        endDate: new Date('2021-12-31'),
        description: 'Desarrollo backend con Node.js y frontend con React',
        technologies: ['React', 'Node.js', 'MongoDB'],
        achievements: ['Creó API REST completa'],
        isCurrentJob: false,
        location: 'Córdoba'
      }
    ];

    mockEducation = [
      {
        id: '1',
        type: EducationType.UNIVERSITY,
        title: 'Ingeniería en Sistemas',
        institution: 'Universidad Nacional',
        startDate: new Date('2018-03-01'),
        endDate: new Date('2022-12-01'),
        status: EducationStatus.COMPLETED,
        description: 'Carrera de grado en ingeniería de sistemas',
        grade: 8.5,
        isOngoing: false
      },
      {
        id: '2',
        type: EducationType.COURSE,
        title: 'Curso de Angular Avanzado',
        institution: 'TechAcademy',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-03-01'),
        status: EducationStatus.COMPLETED,
        description: 'Curso especializado en Angular y desarrollo frontend',
        grade: 9.0,
        isOngoing: false
      }
    ];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuración inicial', () => {
    it('should initialize with default filters', () => {
      const currentFilters = service.getCurrentFilters();
      
      expect(currentFilters.searchTerm).toBe('');
      expect(currentFilters.sortBy).toBe('date');
      expect(currentFilters.sortOrder).toBe('desc');
      expect(currentFilters.fuzzySearch).toBe(true);
    });

    it('should use preferences service for default values', () => {
      expect(mockPreferencesService.searchPreferences).toHaveBeenCalled();
    });
  });

  describe('Actualización de filtros', () => {
    it('should update filters correctly', () => {
      const newFilters: Partial<AdvancedSearchFilters> = {
        searchTerm: 'Angular',
        companies: ['TechCorp'],
        sortBy: 'relevance'
      };

      service.updateFilters(newFilters);
      const currentFilters = service.getCurrentFilters();

      expect(currentFilters.searchTerm).toBe('Angular');
      expect(currentFilters.companies).toEqual(['TechCorp']);
      expect(currentFilters.sortBy).toBe('relevance');
    });

    it('should emit filter changes', (done) => {
      service.filters$.subscribe(filters => {
        if (filters.searchTerm === 'test') {
          expect(filters.searchTerm).toBe('test');
          done();
        }
      });

      service.updateFilters({ searchTerm: 'test' });
    });
  });

  describe('Configuración de datos', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
      service.setEducation(mockEducation);
    });

    it('should set experiences correctly', () => {
      service.experienceResults$.subscribe(result => {
        expect(result.items.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result.filteredCount).toBe(2);
      });
    });

    it('should set education correctly', () => {
      service.educationResults$.subscribe(result => {
        expect(result.items.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result.filteredCount).toBe(2);
      });
    });
  });

  describe('Búsqueda por texto', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
      service.setEducation(mockEducation);
    });

    it('should filter experiences by search term', () => {
      service.updateFilters({ searchTerm: 'Angular' });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].position).toBe('Desarrollador Frontend');
      });
    });

    it('should filter education by search term', () => {
      service.updateFilters({ searchTerm: 'Angular' });

      service.educationResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].title).toBe('Curso de Angular Avanzado');
      });
    });

    it('should return empty results for non-matching search', () => {
      service.updateFilters({ searchTerm: 'Python' });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(0);
        expect(result.items.length).toBe(0);
      });
    });
  });

  describe('Filtros avanzados', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
      service.setEducation(mockEducation);
    });

    it('should filter by company', () => {
      service.updateFilters({ companies: ['TechCorp'] });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].company).toBe('TechCorp');
      });
    });

    it('should filter by technologies', () => {
      service.updateFilters({ technologies: ['Angular'] });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].technologies).toContain('Angular');
      });
    });

    it('should filter by education type', () => {
      service.updateFilters({ educationTypes: [EducationType.UNIVERSITY] });

      service.educationResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].type).toBe(EducationType.UNIVERSITY);
      });
    });

    it('should filter by current job status', () => {
      service.updateFilters({ isCurrentJob: true });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(0); // Ninguna experiencia actual en los datos de prueba
      });
    });
  });

  describe('Ordenamiento', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
    });

    it('should sort by date descending by default', () => {
      service.experienceResults$.subscribe(result => {
        expect(result.items[0].startDate.getTime()).toBeGreaterThan(result.items[1].startDate.getTime());
      });
    });

    it('should sort by date ascending when specified', () => {
      service.updateFilters({ sortOrder: 'asc' });

      service.experienceResults$.subscribe(result => {
        expect(result.items[0].startDate.getTime()).toBeLessThan(result.items[1].startDate.getTime());
      });
    });
  });

  describe('Facetas', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
      service.setEducation(mockEducation);
    });

    it('should generate facets correctly', () => {
      const facets = service.getFacets();

      expect(facets.companies.length).toBeGreaterThan(0);
      expect(facets.technologies.length).toBeGreaterThan(0);
      expect(facets.institutions.length).toBeGreaterThan(0);
      
      // Verificar que las facetas contienen los valores esperados
      const companyValues = facets.companies.map(f => f.value);
      expect(companyValues).toContain('TechCorp');
      expect(companyValues).toContain('StartupXYZ');
    });

    it('should update facet counts based on filters', () => {
      service.updateFilters({ searchTerm: 'Angular' });
      const facets = service.getFacets();

      const techCorpFacet = facets.companies.find(f => f.value === 'TechCorp');
      expect(techCorpFacet?.count).toBe(1);
    });
  });

  describe('Búsqueda rápida', () => {
    beforeEach(() => {
      service.setExperiences(mockExperiences);
      service.setEducation(mockEducation);
    });

    it('should perform quick search and add to history', () => {
      service.quickSearch('Angular').subscribe(results => {
        expect(results.experiences.length).toBe(1);
        expect(results.education.length).toBe(1);
      });

      expect(mockPreferencesService.addToSearchHistory).toHaveBeenCalledWith(
        'Angular',
        jasmine.any(Object),
        jasmine.any(Number)
      );
    });

    it('should not add empty searches to history', () => {
      service.quickSearch('').subscribe();

      expect(mockPreferencesService.addToSearchHistory).not.toHaveBeenCalled();
    });
  });

  describe('Gestión de filtros guardados', () => {
    it('should save current filters as preset', () => {
      service.updateFilters({ searchTerm: 'test', companies: ['TechCorp'] });
      service.saveCurrentFiltersAsPreset('Mi filtro', 'Descripción de prueba');

      expect(mockPreferencesService.saveFilter).toHaveBeenCalledWith(
        'Mi filtro',
        jasmine.objectContaining({
          searchTerm: 'test',
          companies: ['TechCorp']
        }),
        'Descripción de prueba'
      );
    });

    it('should load saved filter', () => {
      const mockFilter = {
        id: 'filter1',
        name: 'Test Filter',
        filters: { searchTerm: 'Angular', companies: ['TechCorp'] },
        createdAt: new Date(),
        useCount: 0
      };

      mockPreferencesService.savedFilters.and.returnValue([mockFilter]);

      service.loadSavedFilter('filter1');

      expect(mockPreferencesService.markFilterAsUsed).toHaveBeenCalledWith('filter1');
      
      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.searchTerm).toBe('Angular');
      expect(currentFilters.companies).toEqual(['TechCorp']);
    });
  });

  describe('Aplicación de preferencias por defecto', () => {
    it('should apply default search preferences', () => {
      mockPreferencesService.searchPreferences.and.returnValue({
        defaultSortBy: 'alphabetical',
        defaultSortOrder: 'asc',
        enableFuzzySearch: false,
        enableAutoComplete: true,
        saveSearchHistory: true,
        maxSearchHistoryItems: 25
      });

      service.applyDefaultSearchPreferences();

      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.sortBy).toBe('alphabetical');
      expect(currentFilters.sortOrder).toBe('asc');
      expect(currentFilters.fuzzySearch).toBe(false);
    });
  });

  describe('Presets de fechas', () => {
    it('should apply last month date preset', () => {
      service.applyDatePreset('last_month');

      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.dateRange.preset).toBe('last_month');
      expect(currentFilters.dateRange.from).toBeDefined();
      expect(currentFilters.dateRange.to).toBeDefined();
    });

    it('should apply last year date preset', () => {
      service.applyDatePreset('last_year');

      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.dateRange.preset).toBe('last_year');
      
      const fromDate = currentFilters.dateRange.from!;
      const toDate = currentFilters.dateRange.to!;
      const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
      expect(yearDiff).toBe(1);
    });
  });

  describe('Filtros combinados inteligentes', () => {
    it('should apply intelligent combined filters for technologies', () => {
      service.applyCombinedFilters({ technologies: ['Angular', 'React'] });

      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.technologies).toEqual(['Angular', 'React']);
      expect(currentFilters.sortBy).toBe('relevance'); // Debe cambiar a relevancia
    });

    it('should apply intelligent combined filters for salary range', () => {
      service.applyCombinedFilters({ 
        salaryRange: { min: 50000, max: 80000 } 
      });

      const currentFilters = service.getCurrentFilters();
      expect(currentFilters.salaryRange?.min).toBe(50000);
      expect(currentFilters.salaryRange?.max).toBe(80000);
      expect(currentFilters.sortBy).toBe('salary'); // Debe cambiar a salario
      expect(currentFilters.sortOrder).toBe('desc');
    });
  });

  describe('Manejo de errores', () => {
    it('should handle invalid filter values gracefully', () => {
      expect(() => {
        service.updateFilters({ 
          sortBy: 'invalid' as any,
          sortOrder: 'invalid' as any
        });
      }).not.toThrow();
    });

    it('should handle empty data sets', () => {
      service.setExperiences([]);
      service.setEducation([]);

      service.experienceResults$.subscribe(result => {
        expect(result.items.length).toBe(0);
        expect(result.totalCount).toBe(0);
        expect(result.filteredCount).toBe(0);
      });
    });
  });
});
