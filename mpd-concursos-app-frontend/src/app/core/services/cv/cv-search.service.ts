/**
 * Servicio de Búsqueda y Filtrado Avanzado del Sistema CV
 * 
 * @description Servicio para búsqueda con indexación, filtros múltiples y ordenamiento
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable, inject } from '@angular/core';
import Fuse from 'fuse.js';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import {
  WorkExperience,
  EducationEntry,
  EducationType,
  EducationStatus
} from '@core/models/cv';
import { CvPreferencesService } from './cv-preferences.service';

/**
 * Filtros de búsqueda avanzada
 */
export interface AdvancedSearchFilters {
  // Filtros generales
  searchTerm: string;
  dateRange: {
    from?: Date;
    to?: Date;
    preset?: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';
  };

  // Filtros de experiencia
  companies: string[];
  positions: string[];
  technologies: string[];
  isCurrentJob?: boolean;
  minDurationMonths?: number;
  maxDurationMonths?: number;
  salaryRange?: {
    min?: number;
    max?: number;
  };

  // Filtros de educación
  institutions: string[];
  educationTypes: EducationType[];
  educationStatuses: EducationStatus[];
  isOngoing?: boolean;
  gradeRange?: {
    min?: number;
    max?: number;
  };

  // Filtros avanzados
  keywords: string[];
  excludeKeywords: string[];
  hasAchievements?: boolean;
  hasProjects?: boolean;
  locationFilters: string[];

  // Filtros de ordenamiento
  sortBy: 'date' | 'relevance' | 'alphabetical' | 'duration' | 'grade' | 'salary';
  sortOrder: 'asc' | 'desc';

  // Configuración de búsqueda
  fuzzySearch?: boolean;
  exactMatch?: boolean;
  caseSensitive?: boolean;
}

/**
 * Resultado de búsqueda
 */
export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  searchTime: number;
  suggestions: string[];
  facets: SearchFacets;
}

/**
 * Facetas de búsqueda para filtros dinámicos
 */
export interface SearchFacets {
  companies: FacetItem[];
  positions: FacetItem[];
  technologies: FacetItem[];
  institutions: FacetItem[];
  educationTypes: FacetItem[];
  educationStatuses: FacetItem[];
  years: FacetItem[];
  locations: FacetItem[];
  salaryRanges: FacetItem[];
  gradeRanges: FacetItem[];
  durationRanges: FacetItem[];
  keywords: FacetItem[];
  achievements: FacetItem[];
  projects: FacetItem[];
}

/**
 * Item de faceta
 */
export interface FacetItem {
  value: string;
  count: number;
  selected: boolean;
}

/**
 * Configuración de búsqueda
 */
export interface SearchConfig {
  threshold: number; // Umbral de similitud (0-1)
  includeScore: boolean;
  includeMatches: boolean;
  minMatchCharLength: number;
  maxResults: number;
}

@Injectable({
  providedIn: 'root'
})
export class CvSearchService {

  // ===== CONFIGURACIÓN DE BÚSQUEDA =====
  private readonly defaultConfig: SearchConfig = {
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    maxResults: 100
  };

  // ===== ÍNDICES DE BÚSQUEDA =====
  private experienceFuse: Fuse<WorkExperience> | null = null;
  private educationFuse: Fuse<EducationEntry> | null = null;

  // ===== ESTADO REACTIVO =====
  private readonly filtersSubject = new BehaviorSubject<AdvancedSearchFilters>(this.getDefaultFilters());
  private readonly experiencesSubject = new BehaviorSubject<WorkExperience[]>([]);
  private readonly educationSubject = new BehaviorSubject<EducationEntry[]>([]);

  // ===== OBSERVABLES PÚBLICOS =====
  public readonly filters$ = this.filtersSubject.asObservable();
  public readonly experiences$ = this.experiencesSubject.asObservable();
  public readonly education$ = this.educationSubject.asObservable();

  // ===== RESULTADOS DE BÚSQUEDA =====
  public readonly experienceResults$: Observable<SearchResult<WorkExperience>>;
  public readonly educationResults$: Observable<SearchResult<EducationEntry>>;

  // ===== SERVICIOS INYECTADOS =====
  private readonly preferencesService = inject(CvPreferencesService);

  constructor() {
    // Configurar búsqueda reactiva
    this.experienceResults$ = combineLatest([
      this.filters$.pipe(debounceTime(300), distinctUntilChanged()),
      this.experiences$
    ]).pipe(
      map(([filters, experiences]) => this.searchExperiences(experiences, filters))
    );

    this.educationResults$ = combineLatest([
      this.filters$.pipe(debounceTime(300), distinctUntilChanged()),
      this.education$
    ]).pipe(
      map(([filters, education]) => this.searchEducation(education, filters))
    );
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Actualiza los datos de experiencias
   */
  updateExperiences(experiences: WorkExperience[]): void {
    this.experiencesSubject.next(experiences);
    this.buildExperienceIndex(experiences);
  }

  /**
   * Actualiza los datos de educación
   */
  updateEducation(education: EducationEntry[]): void {
    this.educationSubject.next(education);
    this.buildEducationIndex(education);
  }

  /**
   * Actualiza los filtros de búsqueda
   */
  updateFilters(filters: Partial<AdvancedSearchFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters };
    this.filtersSubject.next(newFilters);
  }

  /**
   * Resetea los filtros a valores por defecto
   */
  resetFilters(): void {
    this.filtersSubject.next(this.getDefaultFilters());
  }

  /**
   * Obtiene los filtros actuales
   */
  getCurrentFilters(): AdvancedSearchFilters {
    return this.filtersSubject.value;
  }

  /**
   * Búsqueda rápida de texto
   */
  quickSearch(term: string): Observable<{
    experiences: WorkExperience[];
    education: EducationEntry[];
  }> {
    this.updateFilters({ searchTerm: term });

    return combineLatest([
      this.experienceResults$,
      this.educationResults$
    ]).pipe(
      tap(([expResults, eduResults]) => {
        // Agregar al historial de búsquedas si está habilitado
        if (term.trim()) {
          const totalResults = expResults.filteredCount + eduResults.filteredCount;
          this.preferencesService.addToSearchHistory(
            term,
            this.getCurrentFilters(),
            totalResults
          );
        }
      }),
      map(([expResults, eduResults]) => ({
        experiences: expResults.items,
        education: eduResults.items
      }))
    );
  }

  /**
   * Guarda los filtros actuales como filtro favorito
   */
  saveCurrentFiltersAsPreset(name: string, description?: string): void {
    const currentFilters = this.getCurrentFilters();
    this.preferencesService.saveFilter(name, currentFilters, description);
  }

  /**
   * Carga un filtro guardado
   */
  loadSavedFilter(filterId: string): void {
    const savedFilters = this.preferencesService.savedFilters();
    const filter = savedFilters.find(f => f.id === filterId);

    if (filter) {
      this.updateFilters(filter.filters);
      this.preferencesService.markFilterAsUsed(filterId);
    }
  }

  /**
   * Obtiene el historial de búsquedas
   */
  getSearchHistory() {
    return this.preferencesService.searchHistory();
  }

  /**
   * Obtiene los filtros guardados
   */
  getSavedFilters() {
    return this.preferencesService.savedFilters();
  }

  /**
   * Aplica las preferencias de búsqueda por defecto
   */
  applyDefaultSearchPreferences(): void {
    const searchPrefs = this.preferencesService.searchPreferences();

    this.updateFilters({
      sortBy: searchPrefs.defaultSortBy,
      sortOrder: searchPrefs.defaultSortOrder,
      fuzzySearch: searchPrefs.enableFuzzySearch
    });
  }

  /**
   * Obtiene sugerencias de autocompletado
   */
  getSuggestions(term: string, type: 'companies' | 'positions' | 'technologies' | 'institutions'): string[] {
    const experiences = this.experiencesSubject.value;
    const education = this.educationSubject.value;
    
    let suggestions: string[] = [];
    
    switch (type) {
      case 'companies':
        suggestions = [...new Set(experiences.map(exp => exp.company))];
        break;
      case 'positions':
        suggestions = [...new Set(experiences.map(exp => exp.position))];
        break;
      case 'technologies':
        suggestions = [...new Set(experiences.flatMap(exp => exp.technologies || []))];
        break;
      case 'institutions':
        suggestions = [...new Set(education.map(edu => edu.institution))];
        break;
    }
    
    // Filtrar sugerencias que coincidan con el término
    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(term.toLowerCase())
      )
      .sort()
      .slice(0, 10);
  }

  /**
   * Obtiene facetas para filtros dinámicos
   */
  getFacets(): SearchFacets {
    const experiences = this.experiencesSubject.value;
    const education = this.educationSubject.value;
    const currentFilters = this.getCurrentFilters();

    return {
      companies: this.buildFacet(
        experiences.map(exp => exp.company),
        currentFilters.companies
      ),
      positions: this.buildFacet(
        experiences.map(exp => exp.position),
        currentFilters.positions
      ),
      technologies: this.buildFacet(
        experiences.flatMap(exp => exp.technologies || []),
        currentFilters.technologies
      ),
      institutions: this.buildFacet(
        education.map(edu => edu.institution),
        currentFilters.institutions
      ),
      educationTypes: this.buildFacet(
        education.map(edu => edu.type),
        currentFilters.educationTypes
      ),
      educationStatuses: this.buildFacet(
        education.map(edu => edu.status),
        currentFilters.educationStatuses
      ),
      years: this.buildYearFacet([...experiences, ...education]),
      locations: this.buildFacet(
        experiences.map(exp => exp.location || '').filter(Boolean),
        currentFilters.locationFilters || []
      ),
      salaryRanges: this.buildSalaryRangeFacet(experiences),
      gradeRanges: this.buildGradeRangeFacet(education),
      durationRanges: this.buildDurationRangeFacet(experiences),
      keywords: this.buildFacet(
        [...experiences, ...education].flatMap(item => (item as any).keywords || []),
        currentFilters.keywords || []
      ),
      achievements: this.buildFacet(
        experiences.flatMap(exp => exp.achievements || []),
        []
      ),
      projects: this.buildFacet(
        [...experiences, ...education].flatMap(item => (item as any).projects || []),
        []
      )
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Construye el índice de búsqueda para experiencias
   */
  private buildExperienceIndex(experiences: WorkExperience[]): void {
    const options = {
      ...this.defaultConfig,
      keys: [
        { name: 'position', weight: 0.3 },
        { name: 'company', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'technologies', weight: 0.1 },
        { name: 'achievements', weight: 0.1 }
      ]
    };

    this.experienceFuse = new Fuse(experiences, options);
  }

  /**
   * Construye el índice de búsqueda para educación
   */
  private buildEducationIndex(education: EducationEntry[]): void {
    const options = {
      ...this.defaultConfig,
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'institution', weight: 0.3 },
        { name: 'type', weight: 0.2 },
        { name: 'status', weight: 0.1 }
      ]
    };

    this.educationFuse = new Fuse(education, options);
  }

  /**
   * Busca experiencias con filtros aplicados
   */
  private searchExperiences(
    experiences: WorkExperience[],
    filters: AdvancedSearchFilters
  ): SearchResult<WorkExperience> {
    const startTime = Date.now();
    let results = experiences;

    // Aplicar búsqueda de texto si hay término
    if (filters.searchTerm && this.experienceFuse) {
      const fuseResults = this.experienceFuse.search(filters.searchTerm);
      results = fuseResults.map(result => result.item);
    }

    // Aplicar filtros específicos
    results = this.applyExperienceFilters(results, filters);

    // Aplicar ordenamiento
    results = this.sortExperiences(results, filters.sortBy, filters.sortOrder);

    const searchTime = Date.now() - startTime;

    return {
      items: results,
      totalCount: experiences.length,
      filteredCount: results.length,
      searchTime,
      suggestions: this.generateSuggestions(filters.searchTerm),
      facets: this.getFacets()
    };
  }

  /**
   * Busca educación con filtros aplicados
   */
  private searchEducation(
    education: EducationEntry[],
    filters: AdvancedSearchFilters
  ): SearchResult<EducationEntry> {
    const startTime = Date.now();
    let results = education;

    // Aplicar búsqueda de texto si hay término
    if (filters.searchTerm && this.educationFuse) {
      const fuseResults = this.educationFuse.search(filters.searchTerm);
      results = fuseResults.map(result => result.item);
    }

    // Aplicar filtros específicos
    results = this.applyEducationFilters(results, filters);

    // Aplicar ordenamiento
    results = this.sortEducation(results, filters.sortBy, filters.sortOrder);

    const searchTime = Date.now() - startTime;

    return {
      items: results,
      totalCount: education.length,
      filteredCount: results.length,
      searchTime,
      suggestions: this.generateSuggestions(filters.searchTerm),
      facets: this.getFacets()
    };
  }

  /**
   * Aplica filtros específicos a experiencias
   */
  private applyExperienceFilters(
    experiences: WorkExperience[],
    filters: AdvancedSearchFilters
  ): WorkExperience[] {
    return experiences.filter(exp => {
      // Filtro por empresas
      if (filters.companies.length > 0 && !filters.companies.includes(exp.company)) {
        return false;
      }

      // Filtro por puestos
      if (filters.positions.length > 0 && !filters.positions.includes(exp.position)) {
        return false;
      }

      // Filtro por tecnologías
      if (filters.technologies.length > 0) {
        const expTechnologies = exp.technologies || [];
        const hasMatchingTech = filters.technologies.some(tech => 
          expTechnologies.includes(tech)
        );
        if (!hasMatchingTech) return false;
      }

      // Filtro por trabajo actual
      if (filters.isCurrentJob !== undefined && exp.isCurrentJob !== filters.isCurrentJob) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange.from || filters.dateRange.to) {
        const startDate = exp.startDate;
        const endDate = exp.endDate || new Date();

        if (filters.dateRange.from && startDate < filters.dateRange.from) {
          return false;
        }

        if (filters.dateRange.to && endDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Aplica filtros específicos a educación
   */
  private applyEducationFilters(
    education: EducationEntry[],
    filters: AdvancedSearchFilters
  ): EducationEntry[] {
    return education.filter(edu => {
      // Filtro por instituciones
      if (filters.institutions.length > 0 && !filters.institutions.includes(edu.institution)) {
        return false;
      }

      // Filtro por tipos de educación
      if (filters.educationTypes.length > 0 && !filters.educationTypes.includes(edu.type)) {
        return false;
      }

      // Filtro por estados de educación
      if (filters.educationStatuses.length > 0 && !filters.educationStatuses.includes(edu.status)) {
        return false;
      }

      // Filtro por educación en curso
      if (filters.isOngoing !== undefined && edu.isOngoing !== filters.isOngoing) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange.from || filters.dateRange.to) {
        const startDate = edu.startDate;
        const endDate = edu.endDate || new Date();

        if (filters.dateRange.from && startDate < filters.dateRange.from) {
          return false;
        }

        if (filters.dateRange.to && endDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Ordena experiencias según criterio
   */
  private sortExperiences(
    experiences: WorkExperience[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): WorkExperience[] {
    const sorted = [...experiences].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = a.endDate || a.startDate;
          const dateB = b.endDate || b.startDate;
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'alphabetical':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'duration':
          const durationA = this.calculateDuration(a.startDate, a.endDate);
          const durationB = this.calculateDuration(b.startDate, b.endDate);
          comparison = durationA - durationB;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Ordena educación según criterio
   */
  private sortEducation(
    education: EducationEntry[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): EducationEntry[] {
    const sorted = [...education].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = a.endDate || a.startDate;
          const dateB = b.endDate || b.startDate;
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Construye una faceta para filtros
   */
  private buildFacet(values: string[], selectedValues: string[]): FacetItem[] {
    const counts = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        selected: selectedValues.includes(value)
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Construye faceta de años
   */
  private buildYearFacet(items: (WorkExperience | EducationEntry)[]): FacetItem[] {
    const years = items.flatMap(item => {
      // Verificar que startDate existe antes de usar getFullYear()
      if (!item.startDate) return [];

      const startYear = item.startDate.getFullYear();
      const endYear = item.endDate ? item.endDate.getFullYear() : new Date().getFullYear();

      const yearRange = [];
      for (let year = startYear; year <= endYear; year++) {
        yearRange.push(year.toString());
      }
      return yearRange;
    });

    return this.buildFacet(years, []);
  }

  /**
   * Construye faceta de rangos salariales
   */
  private buildSalaryRangeFacet(experiences: WorkExperience[]): FacetItem[] {
    const ranges = ['0-30k', '30k-50k', '50k-70k', '70k-100k', '100k+'];
    return ranges.map(range => ({
      value: range,
      count: experiences.filter(exp => this.isInSalaryRange(exp, range)).length,
      selected: false
    }));
  }

  /**
   * Construye faceta de rangos de calificaciones
   */
  private buildGradeRangeFacet(education: EducationEntry[]): FacetItem[] {
    const ranges = ['0-5', '5-6', '6-7', '7-8', '8-9', '9-10'];
    return ranges.map(range => ({
      value: range,
      count: education.filter(edu => this.isInGradeRange(edu, range)).length,
      selected: false
    }));
  }

  /**
   * Construye faceta de rangos de duración
   */
  private buildDurationRangeFacet(experiences: WorkExperience[]): FacetItem[] {
    const ranges = ['0-6 meses', '6-12 meses', '1-2 años', '2-5 años', '5+ años'];
    return ranges.map(range => ({
      value: range,
      count: experiences.filter(exp => this.isInDurationRange(exp, range)).length,
      selected: false
    }));
  }

  /**
   * Verifica si una experiencia está en un rango salarial
   */
  private isInSalaryRange(experience: WorkExperience, range: string): boolean {
    const salary = (experience as any).salary || 0;
    switch (range) {
      case '0-30k': return salary >= 0 && salary < 30000;
      case '30k-50k': return salary >= 30000 && salary < 50000;
      case '50k-70k': return salary >= 50000 && salary < 70000;
      case '70k-100k': return salary >= 70000 && salary < 100000;
      case '100k+': return salary >= 100000;
      default: return false;
    }
  }

  /**
   * Verifica si una educación está en un rango de calificaciones
   */
  private isInGradeRange(education: EducationEntry, range: string): boolean {
    const grade = (education as any).grade || 0;
    const [min, max] = range.split('-').map(Number);
    return grade >= min && grade <= (max || 10);
  }

  /**
   * Verifica si una experiencia está en un rango de duración
   */
  private isInDurationRange(experience: WorkExperience, range: string): boolean {
    const duration = this.calculateDuration(experience.startDate, experience.endDate);
    switch (range) {
      case '0-6 meses': return duration >= 0 && duration < 6;
      case '6-12 meses': return duration >= 6 && duration < 12;
      case '1-2 años': return duration >= 12 && duration < 24;
      case '2-5 años': return duration >= 24 && duration < 60;
      case '5+ años': return duration >= 60;
      default: return false;
    }
  }

  /**
   * Calcula la duración en meses
   */
  private calculateDuration(startDate: Date | undefined, endDate?: Date): number {
    if (!startDate) return 0;

    const end = endDate || new Date();
    const diffTime = Math.abs(end.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Genera sugerencias de búsqueda
   */
  private generateSuggestions(term: string): string[] {
    if (!term || term.length < 2) return [];

    const suggestions: string[] = [];
    
    // Agregar sugerencias de diferentes tipos
    suggestions.push(...this.getSuggestions(term, 'companies'));
    suggestions.push(...this.getSuggestions(term, 'positions'));
    suggestions.push(...this.getSuggestions(term, 'technologies'));
    suggestions.push(...this.getSuggestions(term, 'institutions'));

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Aplica filtro de rango de fechas preestablecido
   */
  applyDatePreset(preset: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year'): void {
    const now = new Date();
    let from: Date;

    switch (preset) {
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'last_3_months':
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'last_6_months':
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'last_year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        return;
    }

    const currentFilters = this.getCurrentFilters();
    this.updateFilters({
      ...currentFilters,
      dateRange: {
        from,
        to: now,
        preset
      }
    });
  }

  /**
   * Aplica filtros combinados inteligentes
   */
  applyCombinedFilters(filters: Partial<AdvancedSearchFilters>): void {
    const currentFilters = this.getCurrentFilters();
    const combinedFilters = { ...currentFilters, ...filters };

    // Lógica inteligente para filtros combinados
    if (filters.technologies && filters.technologies.length > 0) {
      // Si se filtran tecnologías, ajustar relevancia
      combinedFilters.sortBy = 'relevance';
    }

    if (filters.salaryRange) {
      // Si se filtra por salario, ordenar por salario
      combinedFilters.sortBy = 'salary';
      combinedFilters.sortOrder = 'desc';
    }

    this.updateFilters(combinedFilters);
  }

  /**
   * Obtiene filtros por defecto basados en las preferencias del usuario
   */
  private getDefaultFilters(): AdvancedSearchFilters {
    const searchPrefs = this.preferencesService?.searchPreferences();

    return {
      searchTerm: '',
      dateRange: {},
      companies: [],
      positions: [],
      technologies: [],
      institutions: [],
      educationTypes: [],
      educationStatuses: [],
      keywords: [],
      excludeKeywords: [],
      locationFilters: [],
      sortBy: searchPrefs?.defaultSortBy || 'date',
      sortOrder: searchPrefs?.defaultSortOrder || 'desc',
      fuzzySearch: searchPrefs?.enableFuzzySearch ?? true,
      exactMatch: false,
      caseSensitive: false
    };
  }
}
