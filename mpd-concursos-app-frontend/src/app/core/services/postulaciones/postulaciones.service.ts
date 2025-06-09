import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators'; // Added tap
import { environment } from '../../../../environments/environment';
import { Postulacion, PostulacionRequest, PostulacionResponse, AttachedDocument } from '../../../shared/interfaces/postulacion/postulacion.interface';
import { ContestStatus, Contest } from '../../../shared/interfaces/concurso/concurso.interface';
import { PostulationStatus } from '../../../shared/interfaces/postulacion/postulacion.interface';
import { AuthService } from '../auth/auth.service';
import { LoggingService } from '../logging/logging.service'; // Ensure this path is correct

// Temporary interface for server responses, assuming a paginated structure
interface ServerResponse {
  content?: any[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  number?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionesService {
  private apiUrl = `${environment.apiUrl}/inscriptions`; // Current main endpoint for inscriptions
  private oldApiUrl = `${environment.apiUrl}/inscripciones`; // Legacy endpoint (kept for reference, not actively used below)
  private concursosUrl = `${environment.apiUrl}/concursos`; // Public endpoint for contests (corrected from /contests)

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[PostulacionesService] Initializing PostulacionesService.', undefined, 'PostulacionesService');
  }

  /**
   * Retrieves a paginated list of user postulations.
   * Fetches full contest details for each postulation.
   * @param page Page number (0-indexed).
   * @param size Number of items per page.
   * @param sortBy Field to sort by.
   * @param sortDirection Sort direction ('asc' or 'desc').
   * @returns An Observable of PostulacionResponse.
   */
  getPostulaciones(page = 0, size = 10, sortBy = 'fechaPostulacion', sortDirection = 'desc'): Observable<PostulacionResponse> {
    const userId = this.authService.getCurrentUserId();
    this.loggingService.info('Obteniendo postulaciones del usuario', { page, size, sortBy, sortDirection, userId }, 'PostulacionesService');

    if (!userId) {
      this.loggingService.error('Usuario no autenticado al obtener postulaciones.', undefined, 'PostulacionesService');
      return throwError(() => new Error('Usuario no autenticado. Por favor, inicie sesión.'));
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sortBy)
      .set('direction', sortDirection.toUpperCase())
      .set('userId', userId); // Assuming backend filters by userId

    this.loggingService.debug('Realizando petición de postulaciones a: ' + `${this.apiUrl}/user`, { params: params.toString() }, 'PostulacionesService');

    return this.http.get<ServerResponse>(`${this.apiUrl}/user`, { params }).pipe(
      tap((response: ServerResponse) => {
        this.loggingService.debug('Respuesta inicial de postulaciones recibida del servidor.', { responseType: typeof response, hasContent: !!response?.content, contentCount: response?.content?.length }, 'PostulacionesService');
      }),
      switchMap((response: ServerResponse) => {
        // If no content, return the response as is
        if (!response || !Array.isArray(response.content) || response.content.length === 0) {
          this.loggingService.info('No se encontraron postulaciones para el usuario o la respuesta está vacía.', undefined, 'PostulacionesService');
          return of(response);
        }

        const content = response.content;
        // Map each postulation item to an Observable that fetches its corresponding contest details
        const contestRequests = content.map((item: any) => {
          const contestDetailUrl = `${this.concursosUrl}/${item.contestId}`; // Use the public contests endpoint
          this.loggingService.debug(`Obteniendo detalles del concurso para contestId: ${item.contestId}`, undefined, 'PostulacionesService');

          return this.http.get<Contest>(contestDetailUrl).pipe(
            map(contest => {
              this.loggingService.debug(`Detalles del concurso ${item.contestId} obtenidos.`, contest, 'PostulacionesService');
              return contest;
            }),
            catchError(error => {
              this.loggingService.error(`Error al obtener detalles del concurso ${item.contestId}:`, error, 'PostulacionesService');
              this.loggingService.warn(`Retornando null para concurso ${item.contestId} debido a error.`, undefined, 'PostulacionesService');
              return of(null); // Return null if fetching contest details fails
            })
          );
        });

        // Use forkJoin to wait for all contest detail requests to complete
        return forkJoin(contestRequests).pipe(
          map((concursos: (Contest | null)[]) => {
            this.loggingService.debug('Todos los detalles de concursos obtenidos.', concursos, 'PostulacionesService');
            // Combine postulation items with their corresponding contest details
            const contentWithConcursos = content.map((item: any, index: number) => ({
              ...item,
              contest: concursos[index] || null // Assign null if contest details failed to load
            }));
            return {
              ...response,
              content: contentWithConcursos
            };
          }),
          catchError(error => {
            this.loggingService.error('[PostulacionesService] Error al obtener detalles de concursos en forkJoin:', error, 'PostulacionesService');
            // If forkJoin fails (e.g., due to an unhandled error in one of the inner streams),
            // return the original response without contest details, or an empty one.
            return of(response);
          })
        );
      }),
      map(response => this.transformResponse(response)), // Transform the final response to PostulacionResponse structure
      catchError(error => {
        this.loggingService.error('[PostulacionesService] Error general en la petición de postulaciones:', error, 'PostulacionesService');
        let errorMessage = 'Error del servidor. Por favor, intente más tarde.';

        if (error instanceof HttpErrorResponse) {
          this.loggingService.error('[PostulacionesService] Detalles del error HTTP:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            errorBody: error.error // Backend specific error body
          }, 'PostulacionesService');

          if (error.status === 0) {
            errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
          } else if (error.status === 400) {
            errorMessage = 'Parámetros de búsqueda inválidos.';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
            this.authService.logout(); // Force logout on auth issues
          } else if (error.status === 404) {
             errorMessage = 'Recurso no encontrado.';
          } else if (error.status >= 500) {
              errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Transforms the raw server response into the PostulacionResponse format.
   * @param response The raw response from the server.
   * @returns A PostulacionResponse object.
   */
  private transformResponse(response: unknown): PostulacionResponse {
    this.loggingService.debug('Transformando respuesta del servidor a PostulacionResponse.', response, 'PostulacionesService');
    const serverResponse = response as ServerResponse;

    let content: any[] = [];
    if (Array.isArray(serverResponse.content)) {
      content = serverResponse.content;
    } else if (Array.isArray(response)) {
      // If the response is directly an array (non-paginated or simpler backend)
      content = response as any[];
      this.loggingService.warn('La respuesta del servidor no es paginada (no tiene propiedad "content"). Asumiendo que es un array directo.', response, 'PostulacionesService');
    } else {
      this.loggingService.warn('La respuesta del servidor no contiene la propiedad "content" ni es un array directo. Retornando contenido vacío.', response, 'PostulacionesService');
    }

    const transformedResponse: PostulacionResponse = {
      content: content.map((item: unknown) => this.mapPostulacion(item)),
      // Provide fallback defaults for pagination info
      pageNumber: serverResponse.pageNumber ?? serverResponse.number ?? 0,
      pageSize: serverResponse.pageSize ?? serverResponse.size ?? 10,
      totalElements: serverResponse.totalElements ?? content.length,
      totalPages: serverResponse.totalPages ?? (serverResponse.size ? Math.ceil(content.length / serverResponse.size) : 1), // Estimate total pages
      last: serverResponse.last ?? true // Assume last page if not specified
    };

    this.loggingService.debug('Respuesta transformada finalizada:', transformedResponse, 'PostulacionesService');
    return transformedResponse;
  }

  /**
   * Maps a single raw postulation item from the backend to the Postulacion interface.
   * @param item The raw postulation item.
   * @returns A Postulacion object.
   */
  private mapPostulacion(item: unknown): Postulacion {
    this.loggingService.debug('Mapeando un elemento de postulación.', item, 'PostulacionesService');
    const itemAny = item as Record<string, unknown>;

    // Extract and validate the contest object from InscriptionDetailResponse (if present)
    const contestObj = itemAny['contest'] as Record<string, unknown> | undefined;

    // Keep id as string (UUID)
    let id: string | undefined;
    if (typeof itemAny['id'] === 'string') {
      id = itemAny['id'] as string;
    } else if (typeof itemAny['id'] === 'number') {
      id = itemAny['id'].toString();
    } else {
      this.loggingService.warn('ID de postulación no es string ni number. Asignando undefined.', itemAny['id'], 'PostulacionesService');
      id = undefined;
    }

    // Convert contestId to number
    const contestId = typeof itemAny['contestId'] === 'number'
      ? itemAny['contestId'] as number
      : typeof itemAny['contestId'] === 'string'
        ? parseInt(itemAny['contestId'] as string, 10) || 0
        : 0;
    if (contestId === 0 && itemAny['contestId']) {
        this.loggingService.warn(`contestId "${itemAny['contestId']}" no pudo ser convertido a número. Asignando 0.`, undefined, 'PostulacionesService');
    }

    // Process the contest object if it exists
    let contest: Contest | undefined;
    if (contestObj) {
      // Convert contest id to number
      const concursoId = typeof contestObj['id'] === 'number'
        ? contestObj['id'] as number
        : typeof contestObj['id'] === 'string'
          ? parseInt(contestObj['id'] as string, 10) || 0
          : 0;

      // Map contest information from InscriptionDetailResponse
      const title = (contestObj['name'] as string) ||
                    (contestObj['title'] as string) ||
                    'Concurso para ' + (contestObj['position'] as string || 'No especificado');

      contest = {
        id: concursoId,
        title: (contestObj['title'] as string) || title, // Endpoint /api/concursos/{id} usa 'title'
        position: (contestObj['location'] as string) || 'No especificado', // Endpoint usa 'location' para position
        department: (contestObj['dependency'] as string) || 'No especificada', // Endpoint usa 'dependency'
        status: (contestObj['status'] as ContestStatus) || 'DRAFT' as ContestStatus, // Endpoint usa 'status'
        startDate: (contestObj['startDate'] as string) || new Date().toISOString(), // Endpoint usa 'startDate'
        endDate: (contestObj['endDate'] as string) || new Date().toISOString(), // Endpoint usa 'endDate'
        category: this.mapearCategoria(contestObj['location'] as string), // Usar 'location' para categoría
        class: (contestObj['class'] as string) || 'No especificada',
        description: (contestObj['description'] as string) || title, // Endpoint usa 'description'
        functions: (contestObj['functions'] as string) || 'No especificadas',
        createdAt: (contestObj['createdAt'] as string) || new Date().toISOString(),
        updatedAt: (contestObj['updatedAt'] as string) || new Date().toISOString()
      } as Contest;
      this.loggingService.debug('Concurso mapeado para postulación:', contest, 'PostulacionesService');
    } else {
      this.loggingService.debug('Objeto "contest" no presente en la postulación. Se asignará undefined.', undefined, 'PostulacionesService');
    }

    // Convert attached documents to the correct type
    const attachedDocuments: AttachedDocument[] = Array.isArray(itemAny['attachedDocuments'])
      ? (itemAny['attachedDocuments'] as unknown[]).map(doc => {
          const docObj = doc as Record<string, unknown>;
          return {
            id: typeof docObj['id'] === 'number' ? docObj['id'] as number : 0,
            name: typeof docObj['name'] === 'string' ? docObj['name'] as string : '',
            type: typeof docObj['type'] === 'string' ? docObj['type'] as string : '',
            url: typeof docObj['url'] === 'string' ? docObj['url'] as string : ''
          };
        })
      : [];
    if (!Array.isArray(itemAny['attachedDocuments'])) {
        this.loggingService.warn('attachedDocuments no es un array. Se asignará un array vacío.', itemAny['attachedDocuments'], 'PostulacionesService');
    }


    return {
      id,
      contestId,
      userId: (itemAny['userId'] as string) || '',
      estado: this.mapearEstado((itemAny['estado'] as string) || (itemAny['status'] as string) || 'PENDING'), // Default to PENDING
      fechaPostulacion: (itemAny['createdAt'] as string) ||
                        (itemAny['inscription_date'] as string) ||
                        new Date().toISOString(), // Fallback to current date
      concurso: contest, // Map 'contest' to 'concurso' property as defined in Postulacion interface
      attachedDocuments
    };
  }

  /**
   * Maps backend status strings to PostulationStatus enum.
   * @param status The status string from the backend.
   * @returns The corresponding PostulationStatus enum value.
   */
  private mapearEstado(status: string): PostulationStatus {
    const estadosMap: Record<string, PostulationStatus> = {
      'ACTIVE': PostulationStatus.ACTIVE, // Inscription in progress (interrupted)
      'IN_PROCESS': PostulationStatus.ACTIVE, // Legacy state for active
      'PENDING': PostulationStatus.PENDING, // Inscription completed, pending validation
      'PENDIENTE': PostulationStatus.PENDING, // Legacy Spanish state
      'CONFIRMADA': PostulationStatus.PENDING, // Legacy state
      'COMPLETED': PostulationStatus.PENDING, // Completed inscriptions are pending validation
      'COMPLETED_WITH_DOCS': PostulationStatus.COMPLETED_WITH_DOCS, // Specific state for documentation
      'COMPLETED_PENDING_DOCS': PostulationStatus.COMPLETED_PENDING_DOCS, // Specific state for documentation
      'APPROVED': PostulationStatus.APPROVED, // Inscription approved
      'INSCRIPTO': PostulationStatus.APPROVED, // Legacy Spanish state
      'REJECTED': PostulationStatus.REJECTED,
      'CANCELLED': PostulationStatus.CANCELLED
    };
    const mappedStatus = estadosMap[status.toUpperCase()];

    if (!mappedStatus) {
        this.loggingService.warn(`Estado de postulación desconocido: "${status}". Mapeando a PENDING.`, undefined, 'PostulacionesService');
    }
    return mappedStatus || PostulationStatus.PENDING; // Default to PENDING if unknown
  }

  /**
   * Maps a contest position to a category string.
   * @param cargo The position string (e.g., 'Defensor/a Penal').
   * @returns A general category string (e.g., 'DEFENSOR', 'FISCAL').
   */
  private mapearCategoria(cargo: string | undefined): string {
    if (!cargo) return 'No especificada';

    const lowerCargo = cargo.toLowerCase();
    if (lowerCargo.includes('defensor')) return 'DEFENSOR';
    if (lowerCargo.includes('fiscal')) return 'FISCAL';
    if (lowerCargo.includes('secretario')) return 'SECRETARIO';
    if (lowerCargo.includes('juez')) return 'JUEZ';
    if (lowerCargo.includes('administrativo')) return 'ADMINISTRATIVO';
    if (lowerCargo.includes('tecnico')) return 'TECNICO';
    if (lowerCargo.includes('profesional')) return 'PROFESIONAL';

    // If no specific category matches, extract the first word of the position
    const firstWord = cargo.split(' ')[0];
    const category = firstWord.toUpperCase();
    this.loggingService.debug(`Categoría mapeada para cargo "${cargo}": "${category}"`, undefined, 'PostulacionesService');
    return category;
  }

  /**
   * Creates a new postulation.
   * @param postulation The postulation data to create.
   * @returns An Observable of the created Postulacion.
   */
  crearPostulacion(postulacion: PostulacionRequest): Observable<Postulacion> {
    this.loggingService.info('Creando nueva postulación.', postulacion, 'PostulacionesService');
    return this.http.post<Postulacion>(this.apiUrl, postulacion).pipe(
      tap(response => {
        this.loggingService.info('Postulación creada correctamente.', response, 'PostulacionesService');
      }),
      catchError(error => {
        this.loggingService.error('[PostulacionesService] Error al crear postulación:', error, 'PostulacionesService');
        let errorMessage = 'Error al crear la postulación.';
        if (error instanceof HttpErrorResponse) {
          if (error.status === 409) { // Conflict, e.g., already exists
            errorMessage = 'Ya existe una postulación para este concurso.';
          } else if (error.status === 400) {
            errorMessage = 'Datos de postulación inválidos. Por favor, revise la información.';
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Retrieves a specific postulation by its ID.
   * @param id The ID of the postulation to retrieve.
   * @returns An Observable of the Postulacion.
   */
  getPostulacion(id: string): Observable<Postulacion> {
    this.loggingService.info(`Obteniendo postulación por ID: ${id}.`, undefined, 'PostulacionesService');
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapPostulacion(response)), // Map the single response
      tap(postulacion => {
        this.loggingService.debug(`Postulación ${id} obtenida y mapeada correctamente.`, postulacion, 'PostulacionesService');
      }),
      catchError(error => {
        this.loggingService.error(`[PostulacionesService] Error al obtener postulación con ID ${id}:`, error, 'PostulacionesService');

        if (error instanceof HttpErrorResponse) {
          this.loggingService.error('[PostulacionesService] Detalles del error HTTP:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            errorBody: error.error
          }, 'PostulacionesService');

          if (error.status === 404) {
            return throwError(() => new Error(`Postulación con ID ${id} no encontrada.`));
          } else if (error.status === 401 || error.status === 403) {
            return throwError(() => new Error('No autorizado para ver esta postulación.'));
          }
        }
        return throwError(() => new Error('Error al obtener la postulación. Por favor, intente más tarde.'));
      })
    );
  }
}
