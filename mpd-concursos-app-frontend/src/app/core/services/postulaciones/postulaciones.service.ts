import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from  '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContestStatus, Postulacion, PostulacionRequest, PostulacionResponse } from '../../../shared/interfaces/postulacion/postulacion.interface';
import { PostulationStatus } from '../../../shared/interfaces/postulacion/postulacion.interface';
import { AuthService } from '../auth/auth.service';

// Interfaz temporal para respuestas del servidor
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
    private apiUrl = `${environment.apiUrl}/inscriptions`;
    private oldApiUrl = `${environment.apiUrl}/inscripciones`;
    private concursosUrl = `${environment.apiUrl}/contests/search`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {}


    getPostulaciones(page = 0, size = 10, sortBy = 'fechaPostulacion', sortDirection = 'desc'): Observable<PostulacionResponse> {
        const userId = this.authService.getCurrentUserId();
        console.log('[PostulacionesService] Obteniendo postulaciones para userId:', userId);

        if (!userId) {
            console.error('[PostulacionesService] Usuario no autenticado');
            return throwError(() => new Error('Usuario no autenticado'));
        }

        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', sortBy)
            .set('direction', sortDirection.toUpperCase())
            .set('userId', userId);

        console.log('[PostulacionesService] Parámetros de la petición:', params.toString());

        // Intentar con el nuevo endpoint primero
        return this.http.get<ServerResponse>(`${this.apiUrl}/user/${userId}`, { params })
            .pipe(
                catchError(error => {
                    console.log('[PostulacionesService] Error con endpoint nuevo, intentando con endpoint alternativo:', error);
                    // Si falla, intentar con el endpoint alternativo
                    return this.http.get<ServerResponse>(`${this.apiUrl}/by-user/${userId}`, { params })
                        .pipe(
                            catchError(secondError => {
                                console.log('[PostulacionesService] Error con endpoint alternativo, intentando con endpoint antiguo:', secondError);
                                // Si también falla, intentar con el endpoint antiguo
                                return this.http.get<ServerResponse>(`${this.oldApiUrl}/me`, { params });
                            })
                        );
                }),
                switchMap((response: ServerResponse) => {
                    console.log('[PostulacionesService] Respuesta del servidor:', response);

                    // Verificar si la respuesta tiene contenido
                    if (!response || !Array.isArray(response.content) || response.content.length === 0) {
                        return of(response);
                    }

                    // Obtener los detalles de cada concurso
                    const content = response.content || [];
                    const concursoRequests = content.map((item: any) => {
                        // Construir los parámetros para buscar el concurso específico
                        const searchParams = new HttpParams()
                            .set('id', item.contestId.toString());

                        return this.http.get(this.concursosUrl, { params: searchParams }).pipe(
                            map(contests => {
                                // Asumimos que la búsqueda devuelve una lista y tomamos el primer resultado
                                const contestList = contests as Record<string, unknown>[];
                                return contestList.length > 0 ? contestList[0] : null;
                            }),
                            catchError(error => {
                                console.error(`Error al obtener concurso ${item.contestId}:`, error);
                                return of(null); // Retornar null si falla la obtención del concurso
                            })
                        );
                    });

                    // Si no hay requests de concursos, retornar la respuesta original
                    if (concursoRequests.length === 0) {
                        return of(response);
                    }

                    return forkJoin(concursoRequests).pipe(
                        map((concursos: unknown) => {
                            // Asegurar que concursos es un array
                            const concursosArray = Array.isArray(concursos) ? concursos : [];
                            // Asegurar que response.content existe y es un array
                            const content = response.content || [];
                            const contentWithConcursos = content.map((item: any, index: number) => ({
                                ...item,
                                contest: concursosArray[index] || null
                            }));
                            return {
                                ...response,
                                content: contentWithConcursos
                            };
                        }),
                        catchError(error => {
                            console.error('[PostulacionesService] Error al obtener detalles de concursos:', error);
                            // Si falla la obtención de concursos, retornar la respuesta original sin detalles
                            return of(response);
                        })
                    );
                }),
                map(response => this.transformResponse(response)),
                catchError(error => {
                    console.error('[PostulacionesService] Error completo:', error);

                    // Si es un error de red o el servidor devuelve un objeto vacío,
                    // retornar una respuesta vacía válida en lugar de un error
                    if (error.status === 0 || error.status === 404 || !error.error) {
                        console.log('[PostulacionesService] Servidor no disponible o sin datos, retornando respuesta vacía');
                        return of({
                            content: [],
                            pageNumber: 0,
                            pageSize: 10,
                            totalElements: 0,
                            totalPages: 0,
                            last: true
                        });
                    }

                    if (error.status === 400) {
                        return throwError(() => new Error('Parámetros de búsqueda inválidos'));
                    }

                    if (error.status === 401 || error.status === 403) {
                        return throwError(() => new Error('No autorizado. Por favor, inicie sesión nuevamente.'));
                    }

                    return throwError(() => new Error('Error del servidor. Por favor, intente más tarde.'));
                })
            );
    }

    private transformResponse(response: unknown): PostulacionResponse {
        console.log('[PostulacionesService] Transformando respuesta:', response);

        // Manejar respuesta vacía o nula
        if (!response || typeof response !== 'object') {
            console.log('[PostulacionesService] Respuesta vacía o inválida, retornando respuesta por defecto');
            return {
                content: [],
                pageNumber: 0,
                pageSize: 10,
                totalElements: 0,
                totalPages: 0,
                last: true
            };
        }

        const serverResponse = response as ServerResponse;

        // Verificar si la respuesta tiene la estructura esperada
        let content: any[] = [];
        if (Array.isArray(serverResponse.content)) {
            content = serverResponse.content;
        } else if (Array.isArray(response)) {
            // Si la respuesta es directamente un array
            content = response as any[];
        }

        const transformedResponse: PostulacionResponse = {
            content: content.map((item: unknown) => this.mapPostulacion(item)),
            pageNumber: serverResponse.pageNumber || serverResponse.number || 0,
            pageSize: serverResponse.pageSize || serverResponse.size || 10,
            totalElements: serverResponse.totalElements || content.length,
            totalPages: serverResponse.totalPages || Math.ceil(content.length / 10),
            last: serverResponse.last !== undefined ? serverResponse.last : true
        };

        console.log('[PostulacionesService] Respuesta transformada:', transformedResponse);
        return transformedResponse;
    }

    private mapPostulacion(item: unknown): Postulacion {
        const itemAny = item as Record<string, unknown>;

        // Extraer y validar el objeto contest desde InscriptionDetailResponse
        const contestObj = itemAny['contest'] as Record<string, unknown> | undefined;

        // Mantener id como string (UUID)
        let id: string | undefined;
        if (typeof itemAny['id'] === 'string') {
            id = itemAny['id'] as string;
        } else if (typeof itemAny['id'] === 'number') {
            id = itemAny['id'].toString();
        } else {
            id = undefined;
        }

        // Convertir contestId a número
        const contestId = typeof itemAny['contestId'] === 'number'
            ? itemAny['contestId'] as number
            : typeof itemAny['contestId'] === 'string'
                ? parseInt(itemAny['contestId'] as string, 10) || 0
                : 0;

        // Procesar el objeto concurso si existe
        let concurso = undefined;
        if (contestObj) {
            // Convertir id del concurso a número
            const concursoId = typeof contestObj['id'] === 'number'
                ? contestObj['id'] as number
                : typeof contestObj['id'] === 'string'
                    ? parseInt(contestObj['id'] as string, 10) || 0
                    : 0;

            // Mapear información del concurso desde InscriptionDetailResponse
            const titulo = (contestObj['name'] as string) ||
                          (contestObj['title'] as string) ||
                          'Concurso para ' + (contestObj['position'] as string || 'No especificado');

            concurso = {
                id: concursoId,
                titulo: titulo,
                cargo: (contestObj['position'] as string) || 'No especificado',
                dependencia: (contestObj['department'] as string) || 'No especificada',
                estado: (contestObj['status'] as ContestStatus) || ContestStatus.OPEN,
                fechaInicio: (contestObj['startDate'] as string) || new Date().toISOString(),
                fechaFin: (contestObj['endDate'] as string) || new Date().toISOString(),
                status: (contestObj['status'] as ContestStatus) || ContestStatus.OPEN,
                category: this.mapearCategoria(contestObj['position'] as string),
                class: (contestObj['class'] as string) || 'No especificada'
            };
        }

        // Convertir documentos adjuntos a tipo correcto
        const attachedDocuments = Array.isArray(itemAny['attachedDocuments'])
            ? (itemAny['attachedDocuments'] as unknown[]).map(doc => {
                const docObj = doc as Record<string, unknown>;
                // Convertir a AttachedDocument
                return {
                    id: typeof docObj['id'] === 'number' ? docObj['id'] as number : 0,
                    name: typeof docObj['name'] === 'string' ? docObj['name'] as string : '',
                    type: typeof docObj['type'] === 'string' ? docObj['type'] as string : '',
                    url: typeof docObj['url'] === 'string' ? docObj['url'] as string : ''
                };
              })
            : [];

        return {
            id,
            contestId,
            userId: (itemAny['userId'] as string) || '',
            estado: this.mapearEstado((itemAny['estado'] as string) || (itemAny['status'] as string) || ''),
            fechaPostulacion: (itemAny['createdAt'] as string) ||
                             (itemAny['inscription_date'] as string) ||
                             new Date().toISOString(),
            concurso,
            attachedDocuments
        };
    }

    private mapearEstado(status: string): PostulationStatus {
        const estadosMap: Record<string, PostulationStatus> = {
            'ACTIVE': PostulationStatus.ACTIVE,           // Inscripción en proceso (interrumpida)
            'IN_PROCESS': PostulationStatus.ACTIVE,       // Legacy state
            'PENDING': PostulationStatus.PENDING,         // Inscripción completada, pendiente de validación
            'PENDIENTE': PostulationStatus.PENDING,       // Legacy Spanish state
            'CONFIRMADA': PostulationStatus.PENDING,      // Legacy state
            'COMPLETED': PostulationStatus.PENDING,       // Las inscripciones completadas están pendientes de validación
            'COMPLETED_WITH_DOCS': PostulationStatus.PENDING,
            'COMPLETED_PENDING_DOCS': PostulationStatus.PENDING,
            'APPROVED': PostulationStatus.ACCEPTED,       // Inscripción aprobada
            'INSCRIPTO': PostulationStatus.ACCEPTED,      // Legacy Spanish state
            'REJECTED': PostulationStatus.REJECTED,
            'CANCELLED': PostulationStatus.CANCELLED
        };
        return estadosMap[status] || PostulationStatus.PENDING;
    }

    private mapearCategoria(cargo: string | undefined): string {
        if (!cargo) return 'No especificada';

        // Extraer la categoría del cargo
        if (cargo.toLowerCase().includes('defensor')) return 'DEFENSOR';
        if (cargo.toLowerCase().includes('fiscal')) return 'FISCAL';
        if (cargo.toLowerCase().includes('secretario')) return 'SECRETARIO';

        // Si no coincide con ninguna categoría conocida, extraer la primera palabra del cargo
        const primeraPalabra = cargo.split(' ')[0];
        return primeraPalabra.toUpperCase();
    }

    // Método para transformar una única respuesta de postulación
    private transformSingleResponse(item: unknown): Postulacion {
        return this.mapPostulacion(item);
    }

    // Método de manejo de errores eliminado por no ser utilizado

    // Crear una nueva postulación
    crearPostulacion(postulacion: PostulacionRequest): Observable<Postulacion> {
        return this.http.post<Postulacion>(this.apiUrl, postulacion).pipe(
            catchError(error => {
                console.error('[PostulacionesService] Error al crear postulación:', error);
                return throwError(() => error);
            })
        );
    }

    // Obtener una postulación específica
    getPostulacion(id: string): Observable<Postulacion> {
        console.log(`[PostulacionesService] Intentando obtener postulación con ID: ${id}`);

        return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                console.log('[PostulacionesService] Respuesta completa:', response);

                // Transformar la respuesta a Postulacion
                const postulacion = this.transformSingleResponse(response);
                console.log('[PostulacionesService] Detalles de postulación transformados:', postulacion);
                return postulacion;
            }),
            catchError(error => {
                console.error('[PostulacionesService] Error al obtener postulación:', error);

                if (error instanceof HttpErrorResponse) {
                    console.error('[PostulacionesService] Detalles del error HTTP:', {
                        status: error.status,
                        message: error.message,
                        url: error.url
                    });
                }

                return throwError(() => error);
            })
        );
    }
}
