import { Injectable } from '@angular/core';
import { HttpParams, HttpErrorResponse } from  '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContestStatus, Postulacion, PostulacionRequest, PostulacionResponse } from '../../../shared/interfaces/postulacion/postulacion.interface';

import { PostulationStatus } from '../../../shared/interfaces/postulacion/postulacion.interface';

@Injectable({
    providedIn: 'root'
})
export class PostulacionesService {
    private apiUrl = `${environment.apiUrl}/inscriptions`;
    private oldApiUrl = `${environment.apiUrl}/inscripciones`;
    private concursosUrl = `${environment.apiUrl}/contests/search`;
    private http: {
        get: <T>(url: string, options?: Record<string, unknown>) => Observable<T>;
        post: <T>(url: string, body: unknown, options?: Record<string, unknown>) => Observable<T>;
    };
    private authService: {
        getCurrentUserId: () => string;
    };

    constructor() {
        // En una implementación real, se inyectaría HttpClient y AuthService
        this.http = {
            get: <T>(url: string, options?: Record<string, unknown>) => {
                console.log(`GET simulado a ${url}`, options);
                return new Observable<T>(observer => {
                    observer.next({} as T);
                    observer.complete();
                });
            },
            post: <T>(url: string, body: unknown, options?: Record<string, unknown>) => {
                console.log(`POST simulado a ${url}`, body, options);
                return new Observable<T>(observer => {
                    observer.next({} as T);
                    observer.complete();
                });
            }
        };

        this.authService = {
            getCurrentUserId: () => 'user-123'
        };
    }


    getPostulaciones(page = 0, size = 10, sortBy = 'fechaPostulacion', sortDirection = 'desc'): Observable<PostulacionResponse> {
        const userId = this.authService.getCurrentUserId();
        console.log('[PostulacionesService] Obteniendo postulaciones para userId:', userId);

        if (!userId) {
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
        return this.http.get<PostulacionResponse>(`${this.apiUrl}/user/${userId}`, { params })
            .pipe(
                catchError(error => {
                    console.log('[PostulacionesService] Error con endpoint nuevo, intentando con endpoint alternativo:', error);
                    // Si falla, intentar con el endpoint alternativo
                    return this.http.get<PostulacionResponse>(`${this.apiUrl}/by-user/${userId}`, { params })
                        .pipe(
                            catchError(secondError => {
                                console.log('[PostulacionesService] Error con endpoint alternativo, intentando con endpoint antiguo:', secondError);
                                // Si también falla, intentar con el endpoint antiguo
                                return this.http.get<PostulacionResponse>(`${this.oldApiUrl}/me`, { params });
                            })
                        );
                }),
                switchMap(response => {
                    console.log('[PostulacionesService] Respuesta del servidor:', response);

                    // Obtener los detalles de cada concurso
                    const concursoRequests = response.content.map(item => {
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

                    return forkJoin(concursoRequests).pipe(
                        map(concursos => {
                            const contentWithConcursos = response.content.map((item, index) => ({
                                ...item,
                                contest: concursos[index]
                            }));
                            return {
                                ...response,
                                content: contentWithConcursos
                            };
                        })
                    );
                }),
                map(response => this.transformResponse(response)),
                catchError(error => {
                    console.error('[PostulacionesService] Error completo:', error);
                    if (error.status === 400) {
                        return throwError(() => new Error('Parámetros de búsqueda inválidos'));
                    }
                    return throwError(() => new Error('Error del servidor. Por favor, intente más tarde.'));
                })
            );
    }

    private transformResponse(response: unknown): PostulacionResponse {
        const responseAny = response as Record<string, unknown>;
        const content = responseAny['content'] as unknown[];

        const transformedResponse: PostulacionResponse = {
            content: content ? content.map((item: unknown) => this.mapPostulacion(item)) : [],
            pageNumber: (responseAny['pageNumber'] as number) || 0,
            pageSize: (responseAny['pageSize'] as number) || 10,
            totalElements: responseAny['totalElements'] as number,
            totalPages: responseAny['totalPages'] as number,
            last: responseAny['last'] as boolean
        };

        console.log('Transformed Response:', transformedResponse);
        return transformedResponse;
    }

    private mapPostulacion(item: unknown): Postulacion {
        const itemAny = item as Record<string, unknown>;

        // Extraer y validar el objeto contest
        const contestObj = itemAny['contest'] as Record<string, unknown> | undefined;

        // Convertir id a número si es string
        let id: number | undefined;
        if (typeof itemAny['id'] === 'number') {
            id = itemAny['id'] as number;
        } else if (typeof itemAny['id'] === 'string') {
            id = parseInt(itemAny['id'] as string, 10) || 0;
        } else {
            id = 0;
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

            concurso = {
                id: concursoId,
                titulo: (contestObj['name'] as string) ||
                        (contestObj['title'] as string) ||
                        'Concurso para ' + (contestObj['position'] as string || 'No especificado'),
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
            'PENDING': PostulationStatus.PENDING,
            'ACCEPTED': PostulationStatus.ACCEPTED,
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
        return this.http.post<Postulacion>(this.apiUrl, postulacion, { withCredentials: true });
    }

    // Obtener una postulación específica
    getPostulacion(id: number): Observable<Postulacion> {
        console.log(`Intentando obtener postulación con ID: ${id}`);

        return this.http.get<unknown>(`${this.apiUrl}/${id}`, {
            withCredentials: true
        }).pipe(
            map(response => {
                console.log('Respuesta completa:', response);

                // Transformar la respuesta a Postulacion
                const postulacion = this.transformSingleResponse(response);
                console.log('Detalles de postulación transformados:', postulacion);
                return postulacion;
            }),
            catchError(error => {
                console.error('Error al obtener postulación:', error);

                if (error instanceof HttpErrorResponse) {
                    console.error('Detalles del error HTTP:', {
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
