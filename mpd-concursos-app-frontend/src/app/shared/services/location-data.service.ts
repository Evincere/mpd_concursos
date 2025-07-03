import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  Province, 
  Municipality, 
  ARGENTINA_PROVINCES, 
  getMunicipalitiesByProvince,
  searchProvinces,
  searchMunicipalities
} from '../data/argentina-locations.data';

/**
 * Resultado de búsqueda con información adicional
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  query: string;
}

/**
 * Configuración de búsqueda
 */
export interface SearchConfig {
  maxResults?: number;
  minQueryLength?: number;
  debounceTime?: number;
  fuzzySearch?: boolean;
}

/**
 * Servicio para manejar datos de ubicación de Argentina
 * Proporciona búsqueda optimizada de provincias y municipios
 */
@Injectable({
  providedIn: 'root'
})
export class LocationDataService {
  
  private readonly defaultConfig: SearchConfig = {
    maxResults: 10,
    minQueryLength: 2,
    debounceTime: 300,
    fuzzySearch: true
  };

  // Cache para optimizar búsquedas
  private provincesCache = new Map<string, Province[]>();
  private municipalitiesCache = new Map<string, Municipality[]>();
  
  // Subject para la provincia seleccionada
  private selectedProvinceSubject = new BehaviorSubject<Province | null>(null);
  public selectedProvince$ = this.selectedProvinceSubject.asObservable();

  constructor() {
    // Pre-cargar cache con datos más comunes
    this.preloadCache();
  }

  /**
   * Obtiene todas las provincias
   */
  getAllProvinces(): Observable<Province[]> {
    return of(ARGENTINA_PROVINCES);
  }

  /**
   * Busca provincias por nombre
   */
  searchProvinces(query: string, config?: Partial<SearchConfig>): Observable<SearchResult<Province>> {
    const searchConfig = { ...this.defaultConfig, ...config };
    
    if (!query || query.length < searchConfig.minQueryLength!) {
      return of({
        items: ARGENTINA_PROVINCES.slice(0, searchConfig.maxResults),
        total: ARGENTINA_PROVINCES.length,
        hasMore: ARGENTINA_PROVINCES.length > searchConfig.maxResults!,
        query
      });
    }

    // Verificar cache
    const cacheKey = `provinces_${query.toLowerCase()}`;
    if (this.provincesCache.has(cacheKey)) {
      const cachedResults = this.provincesCache.get(cacheKey)!;
      return of(this.formatSearchResult(cachedResults, query, searchConfig.maxResults!));
    }

    // Realizar búsqueda
    const results = this.performProvinceSearch(query, searchConfig);
    
    // Guardar en cache
    this.provincesCache.set(cacheKey, results);
    
    return of(this.formatSearchResult(results, query, searchConfig.maxResults!));
  }

  /**
   * Obtiene municipios por provincia
   */
  getMunicipalitiesByProvince(provinceId: string): Observable<Municipality[]> {
    return of(getMunicipalitiesByProvince(provinceId));
  }

  /**
   * Busca municipios por nombre dentro de una provincia
   */
  searchMunicipalities(
    query: string, 
    provinceId?: string, 
    config?: Partial<SearchConfig>
  ): Observable<SearchResult<Municipality>> {
    const searchConfig = { ...this.defaultConfig, ...config };
    
    // Clave de cache que incluye la provincia
    const cacheKey = `municipalities_${provinceId || 'all'}_${query.toLowerCase()}`;
    
    if (!query || query.length < searchConfig.minQueryLength!) {
      const allMunicipalities = provinceId 
        ? getMunicipalitiesByProvince(provinceId)
        : [];
      
      return of({
        items: allMunicipalities.slice(0, searchConfig.maxResults),
        total: allMunicipalities.length,
        hasMore: allMunicipalities.length > searchConfig.maxResults!,
        query
      });
    }

    // Verificar cache
    if (this.municipalitiesCache.has(cacheKey)) {
      const cachedResults = this.municipalitiesCache.get(cacheKey)!;
      return of(this.formatSearchResult(cachedResults, query, searchConfig.maxResults!));
    }

    // Realizar búsqueda
    const results = this.performMunicipalitySearch(query, provinceId, searchConfig);
    
    // Guardar en cache
    this.municipalitiesCache.set(cacheKey, results);
    
    return of(this.formatSearchResult(results, query, searchConfig.maxResults!));
  }

  /**
   * Establece la provincia seleccionada
   */
  setSelectedProvince(province: Province | null): void {
    this.selectedProvinceSubject.next(province);
  }

  /**
   * Obtiene la provincia seleccionada actual
   */
  getSelectedProvince(): Province | null {
    return this.selectedProvinceSubject.value;
  }

  /**
   * Busca una provincia por ID
   */
  getProvinceById(id: string): Observable<Province | null> {
    const province = ARGENTINA_PROVINCES.find(p => p.id === id);
    return of(province || null);
  }

  /**
   * Busca un municipio por ID
   */
  getMunicipalityById(id: string): Observable<Municipality | null> {
    const municipality = searchMunicipalities('', undefined).find(m => m.id === id);
    return of(municipality || null);
  }

  /**
   * Valida si una provincia existe
   */
  validateProvince(name: string): Observable<boolean> {
    const normalizedName = name.toLowerCase().trim();
    const exists = ARGENTINA_PROVINCES.some(p => 
      p.name.toLowerCase() === normalizedName ||
      p.code.toLowerCase() === normalizedName
    );
    return of(exists);
  }

  /**
   * Valida si un municipio existe en una provincia
   */
  validateMunicipality(name: string, provinceId?: string): Observable<boolean> {
    const normalizedName = name.toLowerCase().trim();
    const municipalities = provinceId 
      ? getMunicipalitiesByProvince(provinceId)
      : searchMunicipalities('', undefined);
    
    const exists = municipalities.some(m => 
      m.name.toLowerCase() === normalizedName
    );
    return of(exists);
  }

  /**
   * Limpia el cache de búsquedas
   */
  clearCache(): void {
    this.provincesCache.clear();
    this.municipalitiesCache.clear();
  }

  /**
   * Realiza búsqueda fuzzy de provincias
   */
  private performProvinceSearch(query: string, config: SearchConfig): Province[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (config.fuzzySearch) {
      return this.fuzzySearchProvinces(normalizedQuery);
    } else {
      return searchProvinces(query);
    }
  }

  /**
   * Realiza búsqueda fuzzy de municipios
   */
  private performMunicipalitySearch(
    query: string, 
    provinceId: string | undefined, 
    config: SearchConfig
  ): Municipality[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (config.fuzzySearch) {
      return this.fuzzySearchMunicipalities(normalizedQuery, provinceId);
    } else {
      return searchMunicipalities(query, provinceId);
    }
  }

  /**
   * Búsqueda fuzzy para provincias (tolerante a errores de tipeo)
   */
  private fuzzySearchProvinces(query: string): Province[] {
    return ARGENTINA_PROVINCES.filter(province => {
      const name = province.name.toLowerCase();
      const code = province.code.toLowerCase();
      
      // Búsqueda exacta
      if (name.includes(query) || code.includes(query)) {
        return true;
      }
      
      // Búsqueda fuzzy simple (permite 1-2 caracteres de diferencia)
      return this.fuzzyMatch(name, query) || this.fuzzyMatch(code, query);
    }).sort((a, b) => {
      // Ordenar por relevancia (coincidencias exactas primero)
      const aExact = a.name.toLowerCase().startsWith(query);
      const bExact = b.name.toLowerCase().startsWith(query);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Búsqueda fuzzy para municipios
   */
  private fuzzySearchMunicipalities(query: string, provinceId?: string): Municipality[] {
    const municipalities = provinceId 
      ? getMunicipalitiesByProvince(provinceId)
      : searchMunicipalities('', undefined);
    
    return municipalities.filter(municipality => {
      const name = municipality.name.toLowerCase();
      
      // Búsqueda exacta
      if (name.includes(query)) {
        return true;
      }
      
      // Búsqueda fuzzy simple
      return this.fuzzyMatch(name, query);
    }).sort((a, b) => {
      // Ordenar por relevancia
      const aExact = a.name.toLowerCase().startsWith(query);
      const bExact = b.name.toLowerCase().startsWith(query);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Algoritmo simple de fuzzy matching
   */
  private fuzzyMatch(text: string, query: string): boolean {
    if (query.length < 3) return false;
    
    // Permitir hasta 20% de caracteres diferentes
    const maxErrors = Math.floor(query.length * 0.2);
    let errors = 0;
    let textIndex = 0;
    
    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      const found = text.indexOf(char, textIndex);
      
      if (found === -1) {
        errors++;
        if (errors > maxErrors) return false;
      } else {
        textIndex = found + 1;
      }
    }
    
    return true;
  }

  /**
   * Formatea el resultado de búsqueda
   */
  private formatSearchResult<T>(
    items: T[], 
    query: string, 
    maxResults: number
  ): SearchResult<T> {
    return {
      items: items.slice(0, maxResults),
      total: items.length,
      hasMore: items.length > maxResults,
      query
    };
  }

  /**
   * Pre-carga cache con búsquedas comunes
   */
  private preloadCache(): void {
    // Pre-cargar provincias más buscadas
    const commonProvinces = ['buenos aires', 'cordoba', 'santa fe', 'mendoza', 'caba'];
    commonProvinces.forEach(query => {
      this.searchProvinces(query).subscribe();
    });
  }
}
