import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, delay, tap, switchMap } from 'rxjs/operators';


/**
 * Interface for a standardized location result.
 */
export interface LocationResult {
  id: string; // Unique identifier for the location
  name: string; // Primary name of the location (e.g., street name, city name)
  fullAddress: string; // Complete formatted address (e.g., "Street Name 123, City, Province")
  province: string; // Province name
  type: 'province' | 'city' | 'address'; // Type of location result
  coordinates: {
    lat: number; // Latitude
    lng: number; // Longitude
  };
}

@Injectable({
  providedIn: 'root'
})
export class ArgentinaDataService {
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';
  // Mock HttpClient for demonstration. In a real app, inject HttpClient.
  private http: {
    get: (url: string, options?: Record<string, unknown>) => Observable<unknown[]>
  };

  constructor(
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ArgentinaDataService] Initializing ArgentinaDataService.', undefined, 'ArgentinaData');

    // In a real implementation, you would inject HttpClient here:
    // constructor(private http: HttpClient, private loggingService: LoggingService) { ... }
    // For now, we mock it.
    this.http = {
      get: (url: string, options?: Record<string, unknown>) => {
        this.loggingService.debug(`[ArgentinaDataService] (MOCK HTTP) GET request to: ${url}`, options, 'ArgentinaData');
        // Simulate a network request with a delay and dummy data
        const dummyResponse = this.simulateNominatimResponse(options?.["params"] as Record<string, string>);
        return of(dummyResponse).pipe(
          delay(300 + Math.random() * 200), // Simulate network delay
          tap(res => this.loggingService.debug(`[ArgentinaDataService] (MOCK HTTP) Response for ${url}:`, res, 'ArgentinaData')),
          catchError(err => {
            this.loggingService.error(`[ArgentinaDataService] (MOCK HTTP) Error for ${url}:`, err, 'ArgentinaData');
            return throwError(() => new Error('Mock HTTP error'));
          })
        );
      }
    };
  }

  /**
   * Simulates a Nominatim response based on query parameters for testing purposes.
   */
  private simulateNominatimResponse(params: Record<string, string> | undefined): unknown[] {
    const q = params?.['q']?.toLowerCase() || '';
    const format = params?.['format'] || '';
    const countrycodes = params?.['countrycodes'] || '';

    if (!q) {
      return [];
    }

    const mockData = [
      { place_id: 1, lat: '-34.599', lon: '-58.400', display_name: 'Obelisco de Buenos Aires, Avenida 9 de Julio, San Nicolás, Comuna 1, Buenos Aires, Ciudad Autónoma de Buenos Aires, 1043, Argentina', address: { city: 'Buenos Aires', state: 'Ciudad Autónoma de Buenos Aires', country: 'Argentina', road: 'Avenida 9 de Julio' }, type: 'amenity' },
      { place_id: 2, lat: '-34.603', lon: '-58.381', display_name: 'Plaza de Mayo, San Nicolás, Comuna 1, Buenos Aires, Ciudad Autónoma de Buenos Aires, Argentina', address: { city: 'Buenos Aires', state: 'Ciudad Autónoma de Buenos Aires', country: 'Argentina' }, type: 'square' },
      { place_id: 3, lat: '-33.000', lon: '-60.000', display_name: 'Rosario, Santa Fe, Argentina', address: { city: 'Rosario', state: 'Santa Fe', country: 'Argentina' }, type: 'city' },
      { place_id: 4, lat: '-32.890', lon: '-68.845', display_name: 'Mendoza, Capital, Mendoza, Argentina', address: { city: 'Mendoza', state: 'Mendoza', country: 'Argentina' }, type: 'city' },
      { place_id: 5, lat: '-34.921', lon: '-57.954', display_name: 'La Plata, Buenos Aires, Argentina', address: { city: 'La Plata', state: 'Buenos Aires', country: 'Argentina' }, type: 'city' },
      { place_id: 6, lat: '-34.900', lon: '-60.000', display_name: 'San Rafael, Mendoza, Argentina', address: { city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'city' },
      { place_id: 7, lat: '-34.905', lon: '-60.010', display_name: 'Calle Falsa 123, San Rafael, Mendoza, Argentina', address: { road: 'Calle Falsa', house_number: '123', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 8, lat: '-34.906', lon: '-60.011', display_name: 'Avenida Siempre Viva 742, San Rafael, Mendoza, Argentina', address: { road: 'Avenida Siempre Viva', house_number: '742', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 9, lat: '-34.910', lon: '-60.005', display_name: 'Plaza San Martin, San Rafael, Mendoza, Argentina', address: { city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'square' },
      { place_id: 10, lat: '-32.880', lon: '-68.850', display_name: 'Las Heras 500, Mendoza, Capital, Mendoza, Argentina', address: { road: 'Las Heras', house_number: '500', city: 'Mendoza', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 11, lat: '-34.915', lon: '-60.020', display_name: 'Maipú 123, San Rafael, Mendoza, Argentina', address: { road: 'Maipú', house_number: '123', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 12, lat: '-34.918', lon: '-60.025', display_name: 'Belgrano, San Rafael, Mendoza, Argentina', address: { road: 'Belgrano', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'street' },
      { place_id: 13, lat: '-34.920', lon: '-60.030', display_name: 'Rivadavia 456, San Rafael, Mendoza, Argentina', address: { road: 'Rivadavia', house_number: '456', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 14, lat: '-34.922', lon: '-60.035', display_name: 'Salta 789, San Rafael, Mendoza, Argentina', address: { road: 'Salta', house_number: '789', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 15, lat: '-34.925', lon: '-60.040', display_name: 'San Martín, San Rafael, Mendoza, Argentina', address: { road: 'San Martín', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'street' },
      { place_id: 16, lat: '-34.928', lon: '-60.045', display_name: 'Avenida Libertador 100, San Rafael, Mendoza, Argentina', address: { road: 'Avenida Libertador', house_number: '100', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 17, lat: '-34.930', lon: '-60.050', display_name: '9 de Julio 200, San Rafael, Mendoza, Argentina', address: { road: '9 de Julio', house_number: '200', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 18, lat: '-34.933', lon: '-60.055', display_name: 'Mitre, San Rafael, Mendoza, Argentina', address: { road: 'Mitre', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'street' },
      { place_id: 19, lat: '-34.935', lon: '-60.060', display_name: 'Hipólito Yrigoyen 300, San Rafael, Mendoza, Argentina', address: { road: 'Hipólito Yrigoyen', house_number: '300', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
      { place_id: 20, lat: '-34.938', lon: '-60.065', display_name: 'General Paz, San Rafael, Mendoza, Argentina', address: { road: 'General Paz', city: 'San Rafael', Mendoza: 'Mendoza', country: 'Argentina' }, type: 'street' },
      { place_id: 21, lat: '-34.940', lon: '-60.070', display_name: 'Chile 50, San Rafael, Mendoza, Argentina', address: { road: 'Chile', house_number: '50', city: 'San Rafael', state: 'Mendoza', country: 'Argentina' }, type: 'house' },
    ];

    return mockData.filter((item: any) =>
      item.display_name.toLowerCase().includes(q) &&
      (countrycodes ? item.address?.country_code === countrycodes : true)
    ).slice(0, parseInt(params?.['limit'] || '5', 10));
  }


  /**
   * Searches for locations matching the search text using Nominatim API.
   * @param searchText Search query.
   * @param limit Maximum number of results (defaults to 5).
   * @param province Province to filter results (optional).
   * @returns An Observable of LocationResult array.
   */
  searchLocations(searchText: string, limit = 5, province = ''): Observable<LocationResult[]> {
    this.loggingService.info(`[ArgentinaDataService] Starting location search for: "${searchText}", limit: ${limit}, province: "${province}"`, undefined, 'ArgentinaData');

    if (!searchText || searchText.trim().length < 2) {
      this.loggingService.warn('[ArgentinaDataService] Search text is too short or empty. Returning empty results.', undefined, 'ArgentinaData');
      return of([] as LocationResult[]);
    }

    let searchObservable: Observable<LocationResult[]>;
    const initialSearchText = searchText;
    const initialProvince = province;

    // If the search is very specific (contains street, number, and city), try simplifying it
    const parts = searchText.split(',').map(part => part.trim());
    let optimizedSearch = searchText;

    // If more than 2 parts (street+number, city, province), try simplifying
    if (parts.length > 2) {
      // Use only the first part (street and number) for the search
      optimizedSearch = parts[0];
      this.loggingService.debug(`[ArgentinaDataService] Optimizing search text from "${searchText}" to "${optimizedSearch}" due to multiple parts.`, undefined, 'ArgentinaData');
    }

    searchObservable = this.searchWithNominatim(optimizedSearch, limit, initialProvince).pipe(
      // If no results and a province is specified, try without province filter
      switchMap((results: LocationResult[]) => {
        if (results.length === 0 && initialProvince) {
          this.loggingService.warn(`[ArgentinaDataService] No results found with province filter "${initialProvince}". Retrying search without province filter.`, undefined, 'ArgentinaData');
          return this.searchWithNominatim(initialSearchText, limit, '').pipe(
            catchError(error => {
              this.loggingService.error('[ArgentinaDataService] Error during fallback search without province:', error, 'ArgentinaData');
              return of([] as LocationResult[]);
            })
          );
        }
        return of(results);
      }),
      catchError(error => {
        this.loggingService.error(`[ArgentinaDataService] Error during primary search for "${initialSearchText}":`, error, 'ArgentinaData');
        return of([] as LocationResult[]); // Return empty array on error
      })
    );

    return searchObservable.pipe(
      tap(results => {
        this.loggingService.info(`[ArgentinaDataService] Search completed for "${initialSearchText}". Found ${results.length} results.`, results, 'ArgentinaData');
      })
    );
  }

  /**
   * Searches for locations using the Nominatim API.
   * @param searchText Search query.
   * @param limit Maximum number of results.
   * @param province Province to filter results (optional).
   * @returns An Observable of LocationResult array.
   */
  private searchWithNominatim(searchText: string, limit: number, province = ''): Observable<LocationResult[]> {
    this.loggingService.debug(`[ArgentinaDataService] Calling Nominatim with searchText: "${searchText}", limit: ${limit}, province: "${province}"`, undefined, 'ArgentinaData');

    const queryComponents = this.parseQueryComponents(searchText);
    this.loggingService.debug('[ArgentinaDataService] Parsed query components:', queryComponents, 'ArgentinaData');

    let query = searchText;

    // If we have identified components, we can optimize the query
    if (queryComponents.street) {
      // If we have a specific city, try searching with it
      if (queryComponents.city && this.normalizeText(queryComponents.city).includes(this.normalizeText('san rafael'))) {
        // For San Rafael, explicitly specify it
        query = `${queryComponents.street}`;
        if (queryComponents.number) {
          query += ` ${queryComponents.number}`;
        }
        query += `, San Rafael, Mendoza`; // Add Mendoza for precision
        this.loggingService.debug('[ArgentinaDataService] Optimized query for San Rafael street search.', { query }, 'ArgentinaData');
      } else if (queryComponents.city) {
        // If there's a city but not San Rafael, use it
        query = `${queryComponents.street}`;
        if (queryComponents.number) {
          query += ` ${queryComponents.number}`;
        }
        query += `, ${queryComponents.city}`;
        this.loggingService.debug('[ArgentinaDataService] Optimized query for generic city street search.', { query }, 'ArgentinaData');
      }
    }

    // If a province is specified, add it to the query unless already included in the search text
    if (province) {
      const normalizedQuery = this.normalizeText(query.toLowerCase());
      const normalizedProvince = this.normalizeText(province.toLowerCase());
      if (!normalizedQuery.includes(normalizedProvince)) {
        query = `${query}, ${province}`;
        this.loggingService.debug('[ArgentinaDataService] Added province to query.', { query }, 'ArgentinaData');
      } else {
        this.loggingService.debug('[ArgentinaDataService] Province already included in query. Skipping addition.', undefined, 'ArgentinaData');
      }
    }

    const params = {
      q: query,
      format: 'json',
      limit: limit.toString(),
      countrycodes: 'ar', // Filter to Argentina
      'accept-language': 'es' // Request Spanish language results
    };

    this.loggingService.debug('[ArgentinaDataService] Sending Nominatim request with params:', params, 'ArgentinaData');

    return this.http.get(this.nominatimBaseUrl, { params }).pipe(
      tap((response: unknown[]) => this.loggingService.debug('[ArgentinaDataService] Raw Nominatim response received:', response, 'ArgentinaData')),
      map((response: unknown[]) => this.mapNominatimResponse(response, province)),
      delay(100), // Small delay to avoid overloading the API
      catchError(error => {
        this.loggingService.error('[ArgentinaDataService] Error during Nominatim API call:', error, 'ArgentinaData');
        return throwError(() => new Error('Error al conectar con el servicio de ubicaciones.'));
      })
    );
  }

  /**
   * Converts the Nominatim API response to the LocationResult format.
   * @param response Raw Nominatim response.
   * @param filterProvince Optional province to prioritize/filter results.
   * @returns An array of LocationResult.
   */
  private mapNominatimResponse(response: unknown[], filterProvince = ''): LocationResult[] {
    this.loggingService.debug(`[ArgentinaDataService] Mapping Nominatim response (items: ${response.length}) with filterProvince: "${filterProvince}".`, undefined, 'ArgentinaData');

    // Extract search terms from the first result to improve relevance
    const searchTerms = this.extractSearchTerms(response);
    this.loggingService.debug('[ArgentinaDataService] Extracted search terms from Nominatim response:', searchTerms, 'ArgentinaData');

    let filteredResponse = response;
    if (filterProvince) {
      const normalizedFilterProvince = this.normalizeText(filterProvince.toLowerCase());
      filteredResponse = response.filter(item => {
        const itemAny = item as Record<string, unknown>;
        const address = itemAny['address'] as Record<string, unknown> | undefined;
        const province = address?.['state'] as string || '';
        const matches = this.normalizeText(province.toLowerCase()).includes(normalizedFilterProvince);
        // this.loggingService.debug(`Filtering by province: "${filterProvince}". Item province: "${province}". Match: ${matches}`, item, 'ArgentinaData');
        return matches;
      });
      this.loggingService.debug(`[ArgentinaDataService] Response filtered by province "${filterProvince}". Remaining items: ${filteredResponse.length}.`, undefined, 'ArgentinaData');
    }

    // If there's a city term in the search, prioritize matching results
    if (searchTerms.city) {
      filteredResponse = this.prioritizeByCity(filteredResponse, searchTerms.city);
      this.loggingService.debug('[ArgentinaDataService] Results prioritized by city.', undefined, 'ArgentinaData');
    }

    const mappedResults = filteredResponse.map(item => {
      const itemAny = item as Record<string, unknown>;
      const address = itemAny['address'] as Record<string, unknown> | undefined;

      // Determine the type of result
      let type: 'province' | 'city' | 'address' = 'address';
      if (itemAny['type'] === 'administrative' && address?.['state'] && !address?.['city']) {
        type = 'province';
        this.loggingService.debug('[ArgentinaDataService] Mapped type: province.', itemAny, 'ArgentinaData');
      } else if (
        (itemAny['type'] === 'city' || itemAny['type'] === 'town' || itemAny['type'] === 'village') ||
        (address?.['city'] && !address?.['road'])
      ) {
        type = 'city';
        this.loggingService.debug('[ArgentinaDataService] Mapped type: city.', itemAny, 'ArgentinaData');
      } else {
        this.loggingService.debug('[ArgentinaDataService] Mapped type: address.', itemAny, 'ArgentinaData');
      }

      // Get the name based on the type
      let name = '';
      if (type === 'province') {
        name = address?.['state'] as string || '';
      } else if (type === 'city') {
        name = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string ||
               address?.['municipality'] as string || address?.['county'] as string || '';
      } else {
        // For addresses, format as "Street Number"
        const street = address?.['road'] as string || address?.['pedestrian'] as string || address?.['footway'] as string ||
                       address?.['street'] as string || address?.['path'] as string || '';
        let number = address?.['house_number'] as string || '';

        // Try to extract the number from the street name if not available in house_number
        let extractedNumber = '';
        if (!number && street) {
          const numberMatch = street.match(/\s+(\d+(?:\/\d+)?)$/);
          if (numberMatch) {
            extractedNumber = numberMatch[1];
          }
        }

        const finalNumber = number || extractedNumber;

        if (street && finalNumber) {
          // If a number was found in the street name, remove it to avoid duplication
          const cleanStreet = extractedNumber ?
            street.replace(new RegExp(`\\s+${extractedNumber}$`), '') :
            street;

          name = `${cleanStreet} ${finalNumber}`;
        } else if (street) {
          name = street;
        } else {
          // If no street, use the display name's first part
          name = (itemAny['display_name'] as string || '').split(',')[0] || '';
        }
      }

      // Get the province
      const province = address?.['state'] as string || '';

      // Build the full address in a user-friendly format
      let fullAddress = '';
      if (type === 'province') {
        fullAddress = province;
      } else if (type === 'city') {
        const city = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string || '';
        fullAddress = `${city}, ${province}`;
      } else {
        // For addresses, format as "Street Number, City, Province"
        const street = address?.['road'] as string || address?.['pedestrian'] as string || address?.['footway'] as string ||
                       address?.['street'] as string || address?.['path'] as string || '';
        const number = address?.['house_number'] as string || '';
        const city = address?.['city'] as string || address?.['town'] as string || address?.['village'] as string ||
                     address?.['municipality'] as string || address?.['county'] as string || '';

        let extractedNumber = '';
        if (!number && street) {
          const numberMatch = street.match(/\s+(\d+(?:\/\d+)?)$/);
          if (numberMatch) {
            extractedNumber = numberMatch[1];
          }
        }
        const finalNumber = number || extractedNumber;

        const addressParts = [];
        if (street && finalNumber) {
          const cleanStreet = extractedNumber ?
            street.replace(new RegExp(`\\s+${extractedNumber}$`), '') :
            street;
          addressParts.push(`${cleanStreet} ${finalNumber}`);
        } else if (street) {
          addressParts.push(street);
        }
        if (city) {
          addressParts.push(city);
        }
        if (province) {
          addressParts.push(province);
        }
        fullAddress = addressParts.length > 0
          ? addressParts.join(', ')
          : itemAny['display_name'] as string || '';
      }

      const result: LocationResult = {
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
      this.loggingService.debug('[ArgentinaDataService] Mapped single result:', result, 'ArgentinaData');
      return result;
    });
    this.loggingService.info(`[ArgentinaDataService] Finished mapping Nominatim response. Total mapped results: ${mappedResults.length}.`, undefined, 'ArgentinaData');
    return mappedResults;
  }

  /**
   * Normalizes text by removing accents and special characters.
   * @param text The text to normalize.
   * @returns Normalized text.
   */
  private normalizeText(text: string): string {
    const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    this.loggingService.debug(`[ArgentinaDataService] Normalized text "${text}" to "${normalized}".`, undefined, 'ArgentinaData');
    return normalized;
  }

  /**
   * Parses a search query to extract its components (street, number, city).
   * @param query Search query string.
   * @returns Extracted components.
   */
  private parseQueryComponents(query: string): { street?: string, number?: string, city?: string } {
    this.loggingService.debug(`[ArgentinaDataService] Parsing query components for: "${query}".`, undefined, 'ArgentinaData');
    if (!query) {
      return {};
    }

    const parts = query.split(',').map((part: string) => part.trim());

    let street = '';
    let number = '';
    let city = '';

    if (parts.length >= 1) {
      const firstPart = parts[0];
      const streetMatch = firstPart.match(/^(.*?)\s+(\d+(?:\/\d+)?)$/);

      if (streetMatch) {
        street = streetMatch[1].trim();
        number = streetMatch[2];
      } else {
        street = firstPart;
      }
    }

    if (parts.length >= 2) {
      city = parts[1];
    }

    const components = { street, number, city };
    this.loggingService.debug('[ArgentinaDataService] Parsed components:', components, 'ArgentinaData');
    return components;
  }

  /**
   * Extracts relevant search terms from the Nominatim response.
   * @param response Raw Nominatim response.
   * @returns Object with extracted search terms (street, number, city, etc.).
   */
  private extractSearchTerms(response: unknown[]): { street?: string, number?: string, city?: string } {
    this.loggingService.debug(`[ArgentinaDataService] Extracting search terms from response with ${response.length} items.`, undefined, 'ArgentinaData');
    if (!response || response.length === 0) {
      return {};
    }

    const firstResult = response[0] as Record<string, unknown>;
    const displayName = firstResult['display_name'] as string || '';
    const parts = displayName.split(',').map((part: string) => part.trim());

    let city = '';
    if (parts.length >= 2) {
      for (let i = 1; i < Math.min(parts.length, 4); i++) {
        const part = parts[i];
        if (!/\d/.test(part) && part.length > 3) {
          city = part;
          break;
        }
      }
    }

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

    const terms = { street, number, city };
    this.loggingService.debug('[ArgentinaDataService] Extracted terms:', terms, 'ArgentinaData');
    return terms;
  }

  /**
   * Prioritizes results that match the specified city term.
   * @param results Results to sort.
   * @param cityTerm City term to prioritize.
   * @returns Results sorted by relevance.
   */
  private prioritizeByCity(results: unknown[], cityTerm: string): Record<string, unknown>[] {
    this.loggingService.debug(`[ArgentinaDataService] Prioritizing results by city term: "${cityTerm}".`, undefined, 'ArgentinaData');
    if (!cityTerm || !results || results.length === 0) {
      return results as Record<string, unknown>[];
    }

    const normalizedCityTerm = this.normalizeText(cityTerm.toLowerCase());

    const getRelevanceScore = (item: unknown): number => {
      let score = 0;
      const itemAny = item as Record<string, unknown>;
      const address = itemAny['address'] as Record<string, unknown> | undefined;

      const city = address?.['city'] as string || '';
      const town = address?.['town'] as string || '';
      const village = address?.['village'] as string || '';
      const municipality = address?.['municipality'] as string || '';
      const county = address?.['county'] as string || '';

      // Check for matches in different city-related fields
      if (this.normalizeText(city.toLowerCase()) === normalizedCityTerm) score += 100;
      else if (this.normalizeText(city.toLowerCase()).includes(normalizedCityTerm)) score += 50;

      if (this.normalizeText(town.toLowerCase()) === normalizedCityTerm) score += 90;
      else if (this.normalizeText(town.toLowerCase()).includes(normalizedCityTerm)) score += 45;

      if (this.normalizeText(village.toLowerCase()) === normalizedCityTerm) score += 80;
      else if (this.normalizeText(village.toLowerCase()).includes(normalizedCityTerm)) score += 40;

      if (this.normalizeText(municipality.toLowerCase()) === normalizedCityTerm) score += 70;
      else if (this.normalizeText(municipality.toLowerCase()).includes(normalizedCityTerm)) score += 35;

      if (this.normalizeText(county.toLowerCase()) === normalizedCityTerm) score += 60;
      else if (this.normalizeText(county.toLowerCase()).includes(normalizedCityTerm)) score += 30;

      // Check if the city term appears in the display_name
      const displayName = itemAny['display_name'] as string || '';
      const normalizedDisplayName = this.normalizeText(displayName.toLowerCase());
      if (normalizedDisplayName.includes(normalizedCityTerm)) {
        const regex = new RegExp(`\\b${normalizedCityTerm}\\b`, 'i'); // Whole word match
        if (normalizedDisplayName.match(regex)) {
          score += 20;
        } else {
          score += 10;
        }
      }
      return score;
    };

    // Sort results by relevance score in descending order
    const sortedResults = ([...results] as Record<string, unknown>[]).sort((a, b) => {
      const scoreA = getRelevanceScore(a);
      const scoreB = getRelevanceScore(b);
      return scoreB - scoreA;
    });
    this.loggingService.debug('[ArgentinaDataService] Results sorted by city relevance.', undefined, 'ArgentinaData');
    return sortedResults;
  }
}
