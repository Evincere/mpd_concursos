import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http'; // Comentado porque no se usa en la implementación mock
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators'; // Added tap for logging
import { LoggingService } from '@core/services/logging/logging.service';

export interface LocationResult {
  id: string;
  fullAddress: string;
  type: 'province' | 'city' | 'address';
  coordinates: {
    lat: number;
    lng: number;
  };
  components?: {
    street?: string;
    number?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
}

/**
 * Servicio para obtener datos de ubicaciones en Argentina
 * Utiliza la API de Nominatim (OpenStreetMap) para buscar direcciones (mocked in this example)
 */
@Injectable({
  providedIn: 'root'
})
export class ArgentinaDataService {
  // URL de la API de Nominatim (comentado porque se usa una implementación mock)
  // private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
  private readonly CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private searchCache: Record<string, { results: LocationResult[], timestamp: number }> = {};
  private readonly LOG_TAG = 'ArgentinaDataService'; // Tag for logging

  // HttpClient inyectado pero no usado en la implementación mock actual
  constructor(
    // private http: HttpClient,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing ArgentinaDataService.`, undefined, this.LOG_TAG);
  }

  /**
   * Busca ubicaciones en Argentina basadas en el texto de búsqueda.
   * Utiliza una caché en memoria para resultados recientes.
   * @param query Texto de búsqueda.
   * @returns Observable con los resultados de la búsqueda.
   */
  searchLocations(query: string): Observable<LocationResult[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Searching locations for query: "${query}".`, undefined, this.LOG_TAG);

    if (!query || query.trim().length < 2) {
      this.loggingService.warn(`[${this.LOG_TAG}] Search query is too short or empty. Returning empty results.`, undefined, this.LOG_TAG);
      return of([]);
    }

    // Comprobar la caché
    const cached = this.searchCache[query];
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TIMEOUT)) {
      this.loggingService.debug(`[${this.LOG_TAG}] Returning results from cache for query: "${query}".`, cached.results, this.LOG_TAG);
      return of(cached.results);
    }
    this.loggingService.debug(`[${this.LOG_TAG}] Cache miss or expired for query: "${query}". Fetching from mock API.`, undefined, this.LOG_TAG);

    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<Record<string, unknown>[]>(this.NOMINATIM_API, { params: _params }).pipe(

    // Implementación mock para desarrollo y demostración
    return of([
      {
        place_id: '1',
        lat: '-32.8894587',
        lon: '-68.8458386',
        display_name: 'Mendoza, Argentina',
        type: 'administrative',
        address: {
          state: 'Mendoza',
          country: 'Argentina',
          city: 'Mendoza' // Added city to mock data for better mapping
        }
      },
      {
        place_id: '2',
        lat: '-34.6037',
        lon: '-58.3816',
        display_name: 'Obelisco de Buenos Aires, Av. 9 de Julio, Buenos Aires, Argentina',
        type: 'attraction',
        address: {
          road: 'Av. 9 de Julio',
          city: 'Buenos Aires',
          state: 'Ciudad Autónoma de Buenos Aires',
          country: 'Argentina',
          postcode: '1043'
        }
      },
      {
        place_id: '3',
        lat: '-34.905',
        lon: '-60.010',
        display_name: 'Calle Falsa 123, San Rafael, Mendoza, Argentina',
        type: 'house',
        address: {
          road: 'Calle Falsa',
          house_number: '123',
          city: 'San Rafael',
          state: 'Mendoza',
          country: 'Argentina',
        }
      }
    ].filter(item => item.display_name.toLowerCase().includes(query.toLowerCase()))).pipe(
      map(results => {
        this.loggingService.debug(`[${this.LOG_TAG}] Received ${results.length} results from mock API. Mapping...`, results, this.LOG_TAG);
        const mappedResults = results.map(item => this.mapNominatimResult(item));
        this.loggingService.debug(`[${this.LOG_TAG}] Mapping complete. Mapped ${mappedResults.length} results.`, mappedResults, this.LOG_TAG);

        // Guardar en caché
        this.searchCache[query] = {
          results: mappedResults,
          timestamp: Date.now()
        };
        this.loggingService.debug(`[${this.LOG_TAG}] Results for query "${query}" saved to cache.`, undefined, this.LOG_TAG);
        return mappedResults;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error searching locations for query "${query}":`, error, this.LOG_TAG);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Mapea un resultado de Nominatim (objeto genérico) al formato esperado LocationResult.
   * @param item Resultado de Nominatim.
   * @returns Resultado mapeado.
   */
  private mapNominatimResult(item: Record<string, unknown>): LocationResult {
    this.loggingService.debug(`[${this.LOG_TAG}] Mapping single Nominatim result:`, item, this.LOG_TAG);

    // Determinar el tipo de resultado
    let type: 'province' | 'city' | 'address' = 'address';
    const itemType = item['type'] as string;
    const address = item['address'] as Record<string, string> || {}; // Ensure address is an object

    if (itemType === 'administrative' && address['state'] && !address['city']) {
      type = 'province';
      this.loggingService.debug(`[${this.LOG_TAG}] Identified type as 'province'.`, undefined, this.LOG_TAG);
    } else if ((itemType === 'city' || itemType === 'town' || itemType === 'village') ||
               (address['city'] && !address['road'])) {
      type = 'city';
      this.loggingService.debug(`[${this.LOG_TAG}] Identified type as 'city'.`, undefined, this.LOG_TAG);
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] Identified type as 'address'.`, undefined, this.LOG_TAG);
    }

    // Construir dirección completa
    let fullAddress = '';
    const street = address['road'] || '';
    const number = address['house_number'] || '';
    const city = address['city'] || address['town'] || address['village'] || '';
    const state = address['state'] || '';
    const country = address['country'] || '';

    if (type === 'province') {
      fullAddress = state;
    } else if (type === 'city') {
      fullAddress = `${city}${state ? `, ${state}` : ''}`;
    } else {
      // For addresses, combine street, number, city, and state
      const addressParts = [];
      if (street) {
        addressParts.push(`${street}${number ? ` ${number}` : ''}`);
      }
      if (city) {
        addressParts.push(city);
      }
      if (state) {
        addressParts.push(state);
      }
      fullAddress = addressParts.join(', ');
      // Fallback to display_name if address components are very sparse
      if (!fullAddress.trim() && item['display_name']) {
        fullAddress = item['display_name'] as string;
      }
    }
    this.loggingService.debug(`[${this.LOG_TAG}] Constructed fullAddress: "${fullAddress}".`, undefined, this.LOG_TAG);


    // Construir componentes detallados
    const components = {
      street: address['road'] || '',
      number: address['house_number'] || '',
      city: address['city'] || address['town'] || address['village'] || '',
      province: address['state'] || '',
      postalCode: address['postcode'] || ''
    };

    const mappedResult: LocationResult = {
      id: item['place_id'] as string,
      fullAddress: fullAddress.trim(),
      type,
      coordinates: {
        lat: parseFloat(item['lat'] as string),
        lng: parseFloat(item['lon'] as string)
      },
      components
    };
    this.loggingService.debug(`[${this.LOG_TAG}] Mapped result:`, mappedResult, this.LOG_TAG);
    return mappedResult;
  }

  /**
   * Limpia la caché de búsqueda en memoria.
   */
  clearCache(): void {
    this.searchCache = {};
    this.loggingService.info(`[${this.LOG_TAG}] Search cache cleared.`, undefined, this.LOG_TAG);
  }
}
