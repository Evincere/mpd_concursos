/**
 * Servicio de Autocompletado Inteligente del Sistema CV
 * 
 * @description Servicio para sugerencias automáticas de empresas, tecnologías e instituciones
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import Fuse from 'fuse.js';
import { CvValidationService } from './cv-validation.service';

/**
 * Sugerencia de autocompletado
 */
export interface AutocompleteSuggestion {
  id: string;
  value: string;
  label: string;
  category: string;
  score: number;
  metadata?: {
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    location?: string;
    size?: string;
    popularity?: number;
    verified?: boolean;
  };
}

/**
 * Configuración de autocompletado
 */
export interface AutocompleteConfig {
  maxSuggestions: number;
  minCharacters: number;
  debounceTime: number;
  enableFuzzySearch: boolean;
  enableCaching: boolean;
  cacheExpiration: number; // en minutos
  threshold: number; // umbral de similitud para fuzzy search
  includeMetadata: boolean;
}

/**
 * Categorías de autocompletado
 */
export enum AutocompleteCategory {
  COMPANY = 'company',
  POSITION = 'position',
  TECHNOLOGY = 'technology',
  INSTITUTION = 'institution',
  SKILL = 'skill',
  LOCATION = 'location',
  INDUSTRY = 'industry'
}

/**
 * Fuente de datos para autocompletado
 */
export interface AutocompleteDataSource {
  category: AutocompleteCategory;
  data: AutocompleteSuggestion[];
  lastUpdated: Date;
  isStatic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CvAutocompleteService {

  // ===== CONFIGURACIÓN POR DEFECTO =====
  private readonly defaultConfig: AutocompleteConfig = {
    maxSuggestions: 10,
    minCharacters: 2,
    debounceTime: 300,
    enableFuzzySearch: true,
    enableCaching: true,
    cacheExpiration: 60, // 1 hora
    threshold: 0.3,
    includeMetadata: true
  };

  // ===== ESTADO REACTIVO =====
  private readonly configSubject = new BehaviorSubject<AutocompleteConfig>(this.defaultConfig);
  private readonly dataSourcesSubject = new BehaviorSubject<Map<AutocompleteCategory, AutocompleteDataSource>>(new Map());
  private readonly cacheSubject = new BehaviorSubject<Map<string, { suggestions: AutocompleteSuggestion[]; timestamp: Date }>>(new Map());

  // ===== ÍNDICES DE BÚSQUEDA =====
  private fuseInstances = new Map<AutocompleteCategory, Fuse<AutocompleteSuggestion>>();

  // ===== OBSERVABLES PÚBLICOS =====
  public readonly config$ = this.configSubject.asObservable();
  public readonly dataSources$ = this.dataSourcesSubject.asObservable();

  constructor(private readonly validationService: CvValidationService) {
    this.initializeStaticData();
  }

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Obtiene sugerencias para un término de búsqueda
   */
  getSuggestions(
    term: string,
    category: AutocompleteCategory,
    config?: Partial<AutocompleteConfig>
  ): Observable<AutocompleteSuggestion[]> {
    const searchConfig = { ...this.defaultConfig, ...config };
    
    // Validar término mínimo
    if (term.length < searchConfig.minCharacters) {
      return of([]);
    }

    // Sanitizar término de búsqueda
    const sanitizedTerm = this.validationService.sanitizeInput(term);
    const cacheKey = `${category}_${sanitizedTerm}`;

    // Verificar caché si está habilitado
    if (searchConfig.enableCaching) {
      const cached = this.getCachedSuggestions(cacheKey, searchConfig.cacheExpiration);
      if (cached) {
        return of(cached);
      }
    }

    // Realizar búsqueda
    return this.performSearch(sanitizedTerm, category, searchConfig).pipe(
      map(suggestions => {
        // Guardar en caché
        if (searchConfig.enableCaching) {
          this.setCachedSuggestions(cacheKey, suggestions);
        }
        return suggestions;
      }),
      catchError(error => {
        console.error('Error in autocomplete search:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene sugerencias con debounce
   */
  getSuggestionsWithDebounce(
    term$: Observable<string>,
    category: AutocompleteCategory,
    config?: Partial<AutocompleteConfig>
  ): Observable<AutocompleteSuggestion[]> {
    const searchConfig = { ...this.defaultConfig, ...config };

    return term$.pipe(
      debounceTime(searchConfig.debounceTime),
      distinctUntilChanged(),
      switchMap(term => this.getSuggestions(term, category, searchConfig))
    );
  }

  /**
   * Agrega una nueva sugerencia personalizada
   */
  addCustomSuggestion(suggestion: Omit<AutocompleteSuggestion, 'id' | 'score'>): void {
    const newSuggestion: AutocompleteSuggestion = {
      ...suggestion,
      id: this.generateId(),
      score: 1.0
    };

    const dataSources = this.dataSourcesSubject.value;
    const category = suggestion.category as AutocompleteCategory;
    const dataSource = dataSources.get(category);

    if (dataSource) {
      dataSource.data.push(newSuggestion);
      dataSource.lastUpdated = new Date();
      this.rebuildIndex(category, dataSource.data);
    }
  }

  /**
   * Actualiza la popularidad de una sugerencia
   */
  updateSuggestionPopularity(suggestionId: string, category: AutocompleteCategory): void {
    const dataSources = this.dataSourcesSubject.value;
    const dataSource = dataSources.get(category);

    if (dataSource) {
      const suggestion = dataSource.data.find(s => s.id === suggestionId);
      if (suggestion && suggestion.metadata) {
        suggestion.metadata.popularity = (suggestion.metadata.popularity || 0) + 1;
        suggestion.score = Math.min(suggestion.score + 0.1, 1.0);
      }
    }
  }

  /**
   * Obtiene sugerencias populares para una categoría
   */
  getPopularSuggestions(category: AutocompleteCategory, limit: number = 5): AutocompleteSuggestion[] {
    const dataSources = this.dataSourcesSubject.value;
    const dataSource = dataSources.get(category);

    if (!dataSource) return [];

    return dataSource.data
      .filter(s => s.metadata?.popularity && s.metadata.popularity > 0)
      .sort((a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0))
      .slice(0, limit);
  }

  /**
   * Obtiene sugerencias recientes del usuario
   */
  getRecentSuggestions(category: AutocompleteCategory, limit: number = 5): AutocompleteSuggestion[] {
    // TODO: Implementar almacenamiento de sugerencias recientes del usuario
    // Por ahora retornamos sugerencias populares
    return this.getPopularSuggestions(category, limit);
  }

  /**
   * Limpia la caché de sugerencias
   */
  clearCache(): void {
    this.cacheSubject.next(new Map());
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<AutocompleteConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }

  /**
   * Exporta datos de autocompletado para backup
   */
  exportData(): { [key: string]: AutocompleteSuggestion[] } {
    const dataSources = this.dataSourcesSubject.value;
    const exported: { [key: string]: AutocompleteSuggestion[] } = {};

    dataSources.forEach((dataSource, category) => {
      exported[category] = dataSource.data;
    });

    return exported;
  }

  /**
   * Importa datos de autocompletado desde backup
   */
  importData(data: { [key: string]: AutocompleteSuggestion[] }): void {
    const dataSources = this.dataSourcesSubject.value;

    Object.entries(data).forEach(([categoryStr, suggestions]) => {
      const category = categoryStr as AutocompleteCategory;
      const dataSource: AutocompleteDataSource = {
        category,
        data: suggestions,
        lastUpdated: new Date(),
        isStatic: false
      };

      dataSources.set(category, dataSource);
      this.rebuildIndex(category, suggestions);
    });

    this.dataSourcesSubject.next(new Map(dataSources));
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializa datos estáticos de autocompletado
   */
  private initializeStaticData(): void {
    const dataSources = new Map<AutocompleteCategory, AutocompleteDataSource>();

    // Empresas tecnológicas populares
    const companies: AutocompleteSuggestion[] = [
      { id: '1', value: 'Google', label: 'Google', category: AutocompleteCategory.COMPANY, score: 1.0, metadata: { industry: 'Technology', verified: true } },
      { id: '2', value: 'Microsoft', label: 'Microsoft', category: AutocompleteCategory.COMPANY, score: 1.0, metadata: { industry: 'Technology', verified: true } },
      { id: '3', value: 'Amazon', label: 'Amazon', category: AutocompleteCategory.COMPANY, score: 1.0, metadata: { industry: 'E-commerce', verified: true } },
      { id: '4', value: 'Meta', label: 'Meta (Facebook)', category: AutocompleteCategory.COMPANY, score: 1.0, metadata: { industry: 'Social Media', verified: true } },
      { id: '5', value: 'Apple', label: 'Apple', category: AutocompleteCategory.COMPANY, score: 1.0, metadata: { industry: 'Technology', verified: true } },
      { id: '6', value: 'Netflix', label: 'Netflix', category: AutocompleteCategory.COMPANY, score: 0.9, metadata: { industry: 'Entertainment', verified: true } },
      { id: '7', value: 'Spotify', label: 'Spotify', category: AutocompleteCategory.COMPANY, score: 0.9, metadata: { industry: 'Music', verified: true } },
      { id: '8', value: 'Uber', label: 'Uber', category: AutocompleteCategory.COMPANY, score: 0.8, metadata: { industry: 'Transportation', verified: true } }
    ];

    // Tecnologías populares
    const technologies: AutocompleteSuggestion[] = [
      { id: '1', value: 'JavaScript', label: 'JavaScript', category: AutocompleteCategory.TECHNOLOGY, score: 1.0 },
      { id: '2', value: 'TypeScript', label: 'TypeScript', category: AutocompleteCategory.TECHNOLOGY, score: 0.9 },
      { id: '3', value: 'React', label: 'React', category: AutocompleteCategory.TECHNOLOGY, score: 0.9 },
      { id: '4', value: 'Angular', label: 'Angular', category: AutocompleteCategory.TECHNOLOGY, score: 0.8 },
      { id: '5', value: 'Vue.js', label: 'Vue.js', category: AutocompleteCategory.TECHNOLOGY, score: 0.8 },
      { id: '6', value: 'Node.js', label: 'Node.js', category: AutocompleteCategory.TECHNOLOGY, score: 0.9 },
      { id: '7', value: 'Python', label: 'Python', category: AutocompleteCategory.TECHNOLOGY, score: 1.0 },
      { id: '8', value: 'Java', label: 'Java', category: AutocompleteCategory.TECHNOLOGY, score: 0.9 },
      { id: '9', value: 'C#', label: 'C#', category: AutocompleteCategory.TECHNOLOGY, score: 0.8 },
      { id: '10', value: 'Docker', label: 'Docker', category: AutocompleteCategory.TECHNOLOGY, score: 0.8 },
      { id: '11', value: 'Kubernetes', label: 'Kubernetes', category: AutocompleteCategory.TECHNOLOGY, score: 0.7 },
      { id: '12', value: 'AWS', label: 'Amazon Web Services (AWS)', category: AutocompleteCategory.TECHNOLOGY, score: 0.9 }
    ];

    // Puestos de trabajo comunes
    const positions: AutocompleteSuggestion[] = [
      { id: '1', value: 'Desarrollador Frontend', label: 'Desarrollador Frontend', category: AutocompleteCategory.POSITION, score: 1.0 },
      { id: '2', value: 'Desarrollador Backend', label: 'Desarrollador Backend', category: AutocompleteCategory.POSITION, score: 1.0 },
      { id: '3', value: 'Desarrollador Full Stack', label: 'Desarrollador Full Stack', category: AutocompleteCategory.POSITION, score: 0.9 },
      { id: '4', value: 'Ingeniero de Software', label: 'Ingeniero de Software', category: AutocompleteCategory.POSITION, score: 0.9 },
      { id: '5', value: 'Arquitecto de Software', label: 'Arquitecto de Software', category: AutocompleteCategory.POSITION, score: 0.8 },
      { id: '6', value: 'DevOps Engineer', label: 'DevOps Engineer', category: AutocompleteCategory.POSITION, score: 0.8 },
      { id: '7', value: 'Data Scientist', label: 'Data Scientist', category: AutocompleteCategory.POSITION, score: 0.8 },
      { id: '8', value: 'Product Manager', label: 'Product Manager', category: AutocompleteCategory.POSITION, score: 0.7 },
      { id: '9', value: 'UX/UI Designer', label: 'UX/UI Designer', category: AutocompleteCategory.POSITION, score: 0.7 },
      { id: '10', value: 'QA Engineer', label: 'QA Engineer', category: AutocompleteCategory.POSITION, score: 0.7 }
    ];

    // Instituciones educativas
    const institutions: AutocompleteSuggestion[] = [
      { id: '1', value: 'Universidad de Buenos Aires', label: 'Universidad de Buenos Aires (UBA)', category: AutocompleteCategory.INSTITUTION, score: 1.0, metadata: { location: 'Buenos Aires, Argentina', verified: true } },
      { id: '2', value: 'Universidad Tecnológica Nacional', label: 'Universidad Tecnológica Nacional (UTN)', category: AutocompleteCategory.INSTITUTION, score: 0.9, metadata: { location: 'Argentina', verified: true } },
      { id: '3', value: 'Universidad Nacional de La Plata', label: 'Universidad Nacional de La Plata (UNLP)', category: AutocompleteCategory.INSTITUTION, score: 0.9, metadata: { location: 'La Plata, Argentina', verified: true } },
      { id: '4', value: 'Instituto Tecnológico de Buenos Aires', label: 'Instituto Tecnológico de Buenos Aires (ITBA)', category: AutocompleteCategory.INSTITUTION, score: 0.8, metadata: { location: 'Buenos Aires, Argentina', verified: true } },
      { id: '5', value: 'Universidad de Palermo', label: 'Universidad de Palermo (UP)', category: AutocompleteCategory.INSTITUTION, score: 0.7, metadata: { location: 'Buenos Aires, Argentina', verified: true } }
    ];

    // Configurar fuentes de datos
    dataSources.set(AutocompleteCategory.COMPANY, {
      category: AutocompleteCategory.COMPANY,
      data: companies,
      lastUpdated: new Date(),
      isStatic: true
    });

    dataSources.set(AutocompleteCategory.TECHNOLOGY, {
      category: AutocompleteCategory.TECHNOLOGY,
      data: technologies,
      lastUpdated: new Date(),
      isStatic: true
    });

    dataSources.set(AutocompleteCategory.POSITION, {
      category: AutocompleteCategory.POSITION,
      data: positions,
      lastUpdated: new Date(),
      isStatic: true
    });

    dataSources.set(AutocompleteCategory.INSTITUTION, {
      category: AutocompleteCategory.INSTITUTION,
      data: institutions,
      lastUpdated: new Date(),
      isStatic: true
    });

    this.dataSourcesSubject.next(dataSources);

    // Construir índices de búsqueda
    this.buildAllIndices();
  }

  /**
   * Construye todos los índices de búsqueda
   */
  private buildAllIndices(): void {
    const dataSources = this.dataSourcesSubject.value;
    
    dataSources.forEach((dataSource, category) => {
      this.rebuildIndex(category, dataSource.data);
    });
  }

  /**
   * Reconstruye el índice de búsqueda para una categoría
   */
  private rebuildIndex(category: AutocompleteCategory, data: AutocompleteSuggestion[]): void {
    const options = {
      threshold: this.defaultConfig.threshold,
      includeScore: true,
      includeMatches: true,
      keys: [
        { name: 'value', weight: 0.7 },
        { name: 'label', weight: 0.3 }
      ]
    };

    this.fuseInstances.set(category, new Fuse(data, options));
  }

  /**
   * Realiza la búsqueda de sugerencias
   */
  private performSearch(
    term: string,
    category: AutocompleteCategory,
    config: AutocompleteConfig
  ): Observable<AutocompleteSuggestion[]> {
    const fuse = this.fuseInstances.get(category);
    const dataSources = this.dataSourcesSubject.value;
    const dataSource = dataSources.get(category);

    if (!fuse || !dataSource) {
      return of([]);
    }

    let results: AutocompleteSuggestion[] = [];

    if (config.enableFuzzySearch) {
      // Búsqueda fuzzy con Fuse.js
      const fuseResults = fuse.search(term);
      results = fuseResults
        .map(result => ({
          ...result.item,
          score: 1 - (result.score || 0) // Invertir score para que mayor sea mejor
        }))
        .slice(0, config.maxSuggestions);
    } else {
      // Búsqueda exacta
      const lowerTerm = term.toLowerCase();
      results = dataSource.data
        .filter(suggestion => 
          suggestion.value.toLowerCase().includes(lowerTerm) ||
          suggestion.label.toLowerCase().includes(lowerTerm)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, config.maxSuggestions);
    }

    return of(results);
  }

  /**
   * Obtiene sugerencias de la caché
   */
  private getCachedSuggestions(key: string, expirationMinutes: number): AutocompleteSuggestion[] | null {
    const cache = this.cacheSubject.value;
    const cached = cache.get(key);

    if (!cached) return null;

    const now = new Date();
    const expirationTime = new Date(cached.timestamp.getTime() + expirationMinutes * 60 * 1000);

    if (now > expirationTime) {
      cache.delete(key);
      return null;
    }

    return cached.suggestions;
  }

  /**
   * Guarda sugerencias en la caché
   */
  private setCachedSuggestions(key: string, suggestions: AutocompleteSuggestion[]): void {
    const cache = this.cacheSubject.value;
    cache.set(key, {
      suggestions,
      timestamp: new Date()
    });

    // Limpiar caché antigua (mantener máximo 100 entradas)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
