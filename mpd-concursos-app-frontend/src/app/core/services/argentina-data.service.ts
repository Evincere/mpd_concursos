import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http'; // Comentado porque no se usa en la implementación mock
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
 * Utiliza la API de Nominatim (OpenStreetMap) para buscar direcciones
 */
@Injectable({
  providedIn: 'root'
})
export class ArgentinaDataService {
  // URL de la API de Nominatim (comentado porque se usa una implementación mock)
  // private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
  private readonly CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private searchCache: Record<string, { results: LocationResult[], timestamp: number }> = {};

  // HttpClient inyectado pero no usado en la implementación mock actual
  constructor(/* private http: HttpClient */) {}

  /**
   * Busca ubicaciones en Argentina basadas en el texto de búsqueda
   * @param query Texto de búsqueda
   * @returns Observable con los resultados de la búsqueda
   */
  searchLocations(query: string): Observable<LocationResult[]> {
    console.log('Buscando ubicaciones para:', query);

    // Verificar si hay resultados en caché
    if (this.searchCache[query] && (Date.now() - this.searchCache[query].timestamp) < this.CACHE_TIMEOUT) {
      console.log('Usando resultados en caché para:', query);
      return of(this.searchCache[query].results);
    }

    // Construir parámetros de búsqueda (comentado porque se usa una implementación mock)
    /*
    const params = {
      q: query + ' Argentina', // Agregar 'Argentina' para limitar resultados
      format: 'json',
      addressdetails: '1',
      limit: '10',
      countrycodes: 'ar'
    };
    */

    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<Record<string, unknown>[]>(this.NOMINATIM_API, { params: _params }).pipe(

    // Implementación mock para desarrollo
    return of([
      {
        place_id: '1',
        lat: '-32.8894587',
        lon: '-68.8458386',
        display_name: 'Mendoza, Argentina',
        type: 'administrative',
        address: {
          state: 'Mendoza',
          country: 'Argentina'
        }
      }
    ]).pipe(
      map(results => {
        console.log('Resultados crudos de Nominatim:', results);

        // Mapear resultados al formato esperado
        const mappedResults = results.map(item => this.mapNominatimResult(item));

        // Guardar en caché
        this.searchCache[query] = {
          results: mappedResults,
          timestamp: Date.now()
        };

        console.log('Resultados encontrados:', mappedResults.length);
        return mappedResults;
      }),
      catchError(error => {
        console.error('Error al buscar ubicaciones:', error);
        return of([]);
      })
    );
  }

  /**
   * Mapea un resultado de Nominatim al formato esperado
   * @param item Resultado de Nominatim
   * @returns Resultado mapeado
   */
  private mapNominatimResult(item: Record<string, unknown>): LocationResult {
    // Determinar el tipo de resultado
    let type: 'province' | 'city' | 'address' = 'address';

    const itemType = item['type'] as string;
    const address = item['address'] as Record<string, string>;

    if (itemType === 'administrative' && address['state'] && !address['city']) {
      type = 'province';
    } else if ((itemType === 'city' || itemType === 'town' || itemType === 'village') ||
               (address['city'] && !address['road'])) {
      type = 'city';
    }

    // Construir dirección completa
    let fullAddress = '';

    if (type === 'province') {
      fullAddress = address['state'] || '';
    } else if (type === 'city') {
      fullAddress = `${address['city'] || address['town'] || address['village'] || ''}, ${address['state'] || ''}`;
    } else {
      // Dirección completa
      const street = address['road'] || '';
      const number = address['house_number'] || '';
      const city = address['city'] || address['town'] || address['village'] || '';
      const state = address['state'] || '';

      fullAddress = `${street} ${number}, ${city}, ${state}`;
    }

    // Construir componentes
    const components = {
      street: address['road'] || '',
      number: address['house_number'] || '',
      city: address['city'] || address['town'] || address['village'] || '',
      province: address['state'] || '',
      postalCode: address['postcode'] || ''
    };

    return {
      id: item['place_id'] as string,
      fullAddress: fullAddress.trim(),
      type,
      coordinates: {
        lat: parseFloat(item['lat'] as string),
        lng: parseFloat(item['lon'] as string)
      },
      components
    };
  }

  /**
   * Limpia la caché de búsqueda
   */
  clearCache(): void {
    this.searchCache = {};
  }
}
