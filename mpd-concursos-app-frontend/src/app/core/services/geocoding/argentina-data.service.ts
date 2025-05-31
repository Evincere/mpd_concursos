import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, delay, tap, switchMap } from 'rxjs/operators';


export interface LocationResult {
  id: string;
  name: string;
  fullAddress: string;
  province: string;
  type: 'province' | 'city' | 'address';
  coordinates: {
    lat: number;
    lng: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ArgentinaDataService {
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';
  private http: {
    get: (url: string, options?: Record<string, unknown>) => Observable<unknown[]>
  };

  constructor() {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: (url: string, options?: Record<string, unknown>) => {
        console.log(`GET simulado a ${url}`, options);
        return of([]);
      }
    };
  }


  /**
   * Busca ubicaciones que coincidan con el texto de búsqueda
   * @param searchText Texto de búsqueda
   * @param limit Número máximo de resultados (por defecto 5)
   * @param province Provincia para filtrar resultados (opcional)
   */
  searchLocations(searchText: string, limit = 5, province = ''): Observable<LocationResult[]> {
    if (!searchText || searchText.trim().length < 2) {
      return of([] as LocationResult[]);
    }

    // Si la búsqueda es muy específica (contiene calle, número y ciudad), intentar simplificarla
    const parts = searchText.split(',').map(part => part.trim());
    let optimizedSearch = searchText;

    // Si hay más de 2 partes (calle+número, ciudad, provincia), intentar simplificar
    if (parts.length > 2) {
      // Usar solo la primera parte (calle y número) para la búsqueda
      optimizedSearch = parts[0];
      console.log('Búsqueda simplificada a:', optimizedSearch);
    }

    console.log('Buscando ubicaciones para:', optimizedSearch, province ? `en provincia: ${province}` : '');

    // Intentar buscar con Nominatim usando el filtro de provincia
    return this.searchWithNominatim(optimizedSearch, limit, province).pipe(
      catchError(error => {
        console.error('Error al buscar direcciones:', error);
        // En caso de error, devolver un array vacío
        return of([] as LocationResult[]);
      }),
      // Si no hay resultados y hay una provincia especificada, intentar sin filtro de provincia
      switchMap((results: LocationResult[]) => {
        if (results.length === 0 && province) {
          console.log('No se encontraron resultados con provincia. Intentando sin filtro de provincia...');
          return this.searchWithNominatim(optimizedSearch, limit).pipe(
            catchError(() => of([] as LocationResult[]))
          );
        }
        return of(results);
      })
    );
  }

  /**
   * Busca ubicaciones usando la API de Nominatim
   * @param searchText Texto de búsqueda
   * @param limit Número máximo de resultados
   * @param province Provincia para filtrar resultados (opcional)
   */
  private searchWithNominatim(searchText: string, limit: number, province = ''): Observable<LocationResult[]> {
    // Analizar la consulta para extraer componentes
    const queryComponents = this.parseQueryComponents(searchText);

    // Construir los parámetros de la consulta
    let query = searchText;

    // Si tenemos componentes identificados, podemos optimizar la consulta
    if (queryComponents.street) {
      // Si tenemos una ciudad específica, intentar buscar con ella
      if (queryComponents.city && queryComponents.city.toLowerCase() === 'san rafael') {
        // Para San Rafael, especificar explícitamente
        query = `${queryComponents.street}`;
        if (queryComponents.number) {
          query += ` ${queryComponents.number}`;
        }
        query += `, San Rafael`;
      }
    }

    // Si se especificó una provincia, añadirla a la consulta
    if (province) {
      // No añadir la provincia a la consulta si ya está incluida
      if (!query.toLowerCase().includes(province.toLowerCase())) {
        query = `${query}, ${province}`;
      }
    }

    console.log('Consulta optimizada:', query);

    // Parámetros optimizados para búsqueda en Argentina
    const params = {
      q: `${query}, Argentina`, // Añadir "Argentina" para mejorar resultados
      format: 'json',
      addressdetails: '1',
      limit: (limit * 2).toString(), // Aumentar el límite para tener más opciones para filtrar
      countrycodes: 'ar', // Limitar a Argentina
      accept_language: 'es',
      // Parámetros adicionales para mejorar la precisión
      'polygon_geojson': '0',
      'dedupe': '1',
      'bounded': '1',
      // Establecer un viewbox aproximado para Mendoza para mejorar resultados
      // Coordenadas aproximadas de la provincia de Mendoza
      'viewbox': '-70.6,-32.0,-67.0,-36.0'
    };

    return this.http.get(this.nominatimBaseUrl, { params }).pipe(
      tap((response: unknown[]) => console.log('Respuesta de Nominatim:', response.length)),
      map((response: unknown[]) => this.mapNominatimResponse(response, province)),
      delay(300) // Pequeño retraso para evitar sobrecargar la API
    );
  }

  /**
   * Convierte la respuesta de Nominatim al formato LocationResult
   * @param response Respuesta de Nominatim
   * @param filterProvince Provincia para filtrar resultados (opcional)
   */
  private mapNominatimResponse(response: unknown[], filterProvince = ''): LocationResult[] {
    // Extraer términos de búsqueda para mejorar la relevancia
    const searchTerms = this.extractSearchTerms(response);

    // Filtrar por provincia si se especificó
    let filteredResponse = response;
    if (filterProvince) {
      const normalizedFilterProvince = this.normalizeText(filterProvince.toLowerCase());
      filteredResponse = response.filter(item => {
        const itemAny = item as Record<string, unknown>;
        const address = itemAny['address'] as Record<string, unknown> | undefined;
        const province = address?.['state'] as string || '';
        return this.normalizeText(province.toLowerCase()).includes(normalizedFilterProvince);
      });
    }

    // Si hay un término de ciudad en la búsqueda, priorizar resultados que coincidan
    if (searchTerms.city) {
      // Ordenar los resultados para priorizar los que coinciden con la ciudad buscada
      filteredResponse = this.prioritizeByCity(filteredResponse, searchTerms.city);
    }

    return filteredResponse.map(item => {
      const itemAny = item as Record<string, unknown>;
      const address = itemAny['address'] as Record<string, unknown> | undefined;
      // Determinar el tipo de resultado
      let type: 'province' | 'city' | 'address' = 'address';

      if (itemAny['type'] === 'administrative' && address?.['state'] && !address?.['city']) {
        type = 'province';
      } else if (
        (itemAny['type'] === 'city' || itemAny['type'] === 'town' || itemAny['type'] === 'village') ||
        (address?.['city'] && !address?.['road'])
      ) {
        type = 'city';
      }

      // Obtener el nombre según el tipo
      let name = '';
      if (type === 'province') {
        name = address?.['state'] as string || '';
      } else if (type === 'city') {
        name = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string ||
               address?.['municipality'] as string || address?.['county'] as string || '';
      } else {
        // Para direcciones, formatear como "Calle Número"
        const street = address?.['road'] as string || address?.['pedestrian'] as string || address?.['footway'] as string ||
                      address?.['street'] as string || address?.['path'] as string || '';
        const number = address?.['house_number'] as string || '';

        // Intentar extraer el número de la dirección si no está disponible en house_number
        let extractedNumber = '';
        if (!number && street) {
          const numberMatch = street.match(/\s+(\d+(?:\/\d+)?)$/);
          if (numberMatch) {
            extractedNumber = numberMatch[1];
          }
        }

        const finalNumber = number || extractedNumber;

        if (street && finalNumber) {
          // Si se encontró un número en el nombre de la calle, quitarlo para evitar duplicación
          const cleanStreet = extractedNumber ?
            street.replace(new RegExp(`\\s+${extractedNumber}$`), '') :
            street;

          name = `${cleanStreet} ${finalNumber}`;
        } else if (street) {
          name = street;
        } else {
          // Si no hay calle, usar el nombre mostrado
          name = (itemAny['display_name'] as string || '').split(',')[0] || '';
        }
      }

      // Obtener la provincia
      const province = address?.['state'] as string || '';

      // Construir la dirección completa en un formato más amigable
      let fullAddress = '';

      if (type === 'province') {
        fullAddress = province;
      } else if (type === 'city') {
        const city = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string || '';
        fullAddress = `${city}, ${province}`;
      } else {
        // Para direcciones, formatear como "Calle Número, Ciudad, Provincia"
        const street = address?.['road'] as string || address?.['pedestrian'] as string || address?.['footway'] as string ||
                      address?.['street'] as string || address?.['path'] as string || '';
        const number = address?.['house_number'] as string || '';
        const city = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string ||
                    address?.['municipality'] as string || address?.['county'] as string || '';

        // Intentar extraer el número de la dirección si no está disponible en house_number
        let extractedNumber = '';
        if (!number && street) {
          const numberMatch = street.match(/\s+(\d+(?:\/\d+)?)$/);
          if (numberMatch) {
            extractedNumber = numberMatch[1];
          }
        }

        const finalNumber = number || extractedNumber;

        // Construir la dirección con los componentes disponibles
        const addressParts = [];

        // Calle y número
        if (street && finalNumber) {
          // Si se encontró un número en el nombre de la calle, quitarlo para evitar duplicación
          const cleanStreet = extractedNumber ?
            street.replace(new RegExp(`\\s+${extractedNumber}$`), '') :
            street;

          addressParts.push(`${cleanStreet} ${finalNumber}`);
        } else if (street) {
          addressParts.push(street);
        }

        // Ciudad
        if (city) {
          addressParts.push(city);
        }

        // Provincia
        if (province) {
          addressParts.push(province);
        }

        // Si tenemos componentes, usarlos; de lo contrario, usar el display_name
        fullAddress = addressParts.length > 0
          ? addressParts.join(', ')
          : itemAny['display_name'] as string || '';
      }

      return {
        id: `nominatim-${itemAny['place_id'] as string}`,
        name,
        fullAddress,
        province,
        type,
        coordinates: {
          lat: parseFloat(itemAny['lat'] as string),
          lng: parseFloat(itemAny['lon'] as string)
        }
      };
    });
  }

  /**
   * Normaliza un texto eliminando acentos y caracteres especiales
   */
  private normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Analiza una consulta de búsqueda para extraer sus componentes
   * @param query Consulta de búsqueda
   * @returns Componentes extraídos (calle, número, ciudad)
   */
  private parseQueryComponents(query: string): { street?: string, number?: string, city?: string } {
    if (!query) {
      return {};
    }

    // Dividir la consulta por comas
    const parts = query.split(',').map((part: string) => part.trim());

    // El primer componente suele ser la calle y número
    let street = '';
    let number = '';
    let city = '';

    if (parts.length >= 1) {
      const firstPart = parts[0];
      // Intentar extraer número de la calle
      const streetMatch = firstPart.match(/^(.*?)\s+(\d+(?:\/\d+)?)$/);

      if (streetMatch) {
        street = streetMatch[1].trim();
        number = streetMatch[2];
      } else {
        street = firstPart;
      }
    }

    // El segundo componente suele ser la ciudad
    if (parts.length >= 2) {
      city = parts[1];
    }

    return {
      street,
      number,
      city
    };
  }

  /**
   * Extrae términos de búsqueda relevantes de la respuesta de Nominatim
   * @param response Respuesta de Nominatim
   * @returns Objeto con términos de búsqueda (calle, ciudad, etc.)
   */
  private extractSearchTerms(response: unknown[]): { street?: string, number?: string, city?: string } {
    if (!response || response.length === 0) {
      return {};
    }

    // Intentar extraer términos de búsqueda del display_name del primer resultado
    const firstResult = response[0] as Record<string, unknown>;
    const displayName = firstResult['display_name'] as string || '';
    const parts = displayName.split(',').map((part: string) => part.trim());

    // Extraer posible ciudad (generalmente el segundo o tercer componente)
    let city = '';
    if (parts.length >= 2) {
      // Buscar un componente que podría ser una ciudad
      // Excluir componentes que son probablemente calles o números
      for (let i = 1; i < Math.min(parts.length, 4); i++) {
        const part = parts[i];
        // Si no contiene números y no es muy corto, podría ser una ciudad
        if (!/\d/.test(part) && part.length > 3) {
          city = part;
          break;
        }
      }
    }

    // Extraer calle y número del primer componente
    let street = '';
    let number = '';

    if (parts.length >= 1) {
      const firstPart = parts[0];
      const streetMatch = firstPart.match(/^(.*?)\s+(\d+(?:\/\d+)?)$/);

      if (streetMatch) {
        street = streetMatch[1];
        number = streetMatch[2];
      } else {
        street = firstPart;
      }
    }

    return {
      street,
      number,
      city
    };
  }

  /**
   * Prioriza resultados que coincidan con la ciudad especificada
   * @param results Resultados a ordenar
   * @param cityTerm Término de ciudad para priorizar
   * @returns Resultados ordenados por relevancia
   */
  private prioritizeByCity(results: unknown[], cityTerm: string): Record<string, unknown>[] {
    if (!cityTerm || !results || results.length === 0) {
      return results as Record<string, unknown>[];
    }

    const normalizedCityTerm = this.normalizeText(cityTerm.toLowerCase());

    // Función para calcular la puntuación de relevancia
    const getRelevanceScore = (item: unknown): number => {
      let score = 0;
      const itemAny = item as Record<string, unknown>;

      // Verificar coincidencia en diferentes campos de ciudad
      const address = itemAny['address'] as Record<string, unknown> | undefined;
      const city = address?.['city'] as string || '';
      const town = address?.['town'] as string || '';
      const village = address?.['village'] as string || '';
      const municipality = address?.['municipality'] as string || '';
      const county = address?.['county'] as string || '';

      const normalizedCity = this.normalizeText(city.toLowerCase());
      const normalizedTown = this.normalizeText(town.toLowerCase());
      const normalizedVillage = this.normalizeText(village.toLowerCase());
      const normalizedMunicipality = this.normalizeText(municipality.toLowerCase());
      const normalizedCounty = this.normalizeText(county.toLowerCase());

      // Coincidencia exacta tiene mayor puntuación
      if (normalizedCity === normalizedCityTerm) score += 100;
      else if (normalizedCity.includes(normalizedCityTerm)) score += 50;

      if (normalizedTown === normalizedCityTerm) score += 90;
      else if (normalizedTown.includes(normalizedCityTerm)) score += 45;

      if (normalizedVillage === normalizedCityTerm) score += 80;
      else if (normalizedVillage.includes(normalizedCityTerm)) score += 40;

      if (normalizedMunicipality === normalizedCityTerm) score += 70;
      else if (normalizedMunicipality.includes(normalizedCityTerm)) score += 35;

      if (normalizedCounty === normalizedCityTerm) score += 60;
      else if (normalizedCounty.includes(normalizedCityTerm)) score += 30;

      // Verificar si el término de ciudad aparece en el display_name
      const displayName = itemAny['display_name'] as string || '';
      const normalizedDisplayName = this.normalizeText(displayName.toLowerCase());

      if (normalizedDisplayName.includes(normalizedCityTerm)) {
        // Mayor puntuación si aparece como palabra completa
        const regex = new RegExp(`\\b${normalizedCityTerm}\\b`, 'i');
        if (normalizedDisplayName.match(regex)) {
          score += 20;
        } else {
          score += 10;
        }
      }

      return score;
    };

    // Ordenar resultados por puntuación de relevancia
    return ([...results] as Record<string, unknown>[]).sort((a, b) => {
      const scoreA = getRelevanceScore(a);
      const scoreB = getRelevanceScore(b);
      return scoreB - scoreA; // Orden descendente
    });
  }
}
