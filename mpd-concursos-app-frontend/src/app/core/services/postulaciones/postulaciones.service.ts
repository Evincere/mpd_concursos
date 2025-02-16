import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContestStatus, Postulacion, PostulacionRequest, PostulacionResponse } from '../../../shared/interfaces/postulacion/postulacion.interface';
import { AuthService } from '../auth/auth.service';
import { PostulationStatus } from '../../../shared/interfaces/postulacion/postulacion.interface';

@Injectable({
    providedIn: 'root'
})
export class PostulacionesService {
    private apiUrl = `${environment.apiUrl}/inscripciones`;
    private concursosUrl = `${environment.apiUrl}/contests/search`;

    constructor(private http: HttpClient, private authService: AuthService) { }

    getPostulaciones(page: number = 0, size: number = 10, sortBy: string = 'fechaPostulacion', sortDirection: string = 'desc'): Observable<PostulacionResponse> {
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

        return this.http.get<PostulacionResponse>(`${this.apiUrl}/me`, { params })
            .pipe(
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
                                const contestList = contests as any[];
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

    private transformResponse(response: any): PostulacionResponse {
        const transformedResponse = {
            content: response.content.map((item: any) => this.mapPostulacion(item)),
            pageNumber: response.pageNumber || 0,
            pageSize: response.pageSize || 10,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            last: response.last
        };

        console.log('Transformed Response:', transformedResponse);
        return transformedResponse;
    }

    private mapPostulacion(item: any): Postulacion {
        return {
            id: item.id,
            contestId: item.contestId,
            userId: item.userId,
            estado: this.mapearEstado(item.estado || item.status),
            fechaPostulacion: item.createdAt || item.inscription_date || new Date().toISOString(),
            concurso: item.contest ? {
                id: item.contest.id,
                titulo: item.contest.name || item.contest.title || 'Concurso para ' + item.contest.position,
                cargo: item.contest.position || 'No especificado',
                dependencia: item.contest.department || 'No especificada',
                estado: item.contest.status || ContestStatus.OPEN,
                fechaInicio: item.contest.startDate || new Date().toISOString(),
                fechaFin: item.contest.endDate || new Date().toISOString(),
                status: (item.contest.status as ContestStatus) || ContestStatus.OPEN,
                category: this.mapearCategoria(item.contest.position),
                class: item.contest.class || 'No especificada'
            } : undefined,
            attachedDocuments: Array.isArray(item.attachedDocuments) ? item.attachedDocuments : []
        };
    }

    private mapearEstado(status: string): PostulationStatus {
        const estadosMap: { [key: string]: PostulationStatus } = {
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
    private transformSingleResponse(item: any): Postulacion {
        return this.mapPostulacion(item);
    }

    private handleError(error: HttpErrorResponse) {
        console.error('Error completo:', error);

        if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error('Error de red o del cliente'));
        }

        switch (error.status) {
            case 401:
                return throwError(() => new Error('No autorizado. Por favor, inicie sesión nuevamente.'));
            case 403:
                return throwError(() => new Error('No tiene permisos para acceder a este recurso.'));
            case 404:
                return throwError(() => new Error('Recurso no encontrado.'));
            default:
                return throwError(() => new Error('Error del servidor. Por favor, intente más tarde.'));
        }
    }

    // Crear una nueva postulación
    crearPostulacion(postulacion: PostulacionRequest): Observable<Postulacion> {
        return this.http.post<Postulacion>(this.apiUrl, postulacion, { withCredentials: true });
    }

    // Obtener una postulación específica
    getPostulacion(id: number): Observable<Postulacion> {
        console.log(`Intentando obtener postulación con ID: ${id}`);

        return this.http.get<Postulacion>(`${this.apiUrl}/${id}`, {
            withCredentials: true,
            observe: 'response'  // Obtener toda la respuesta HTTP
        }).pipe(
            map(response => {
                console.log('Respuesta completa:', response);
                console.log('Código de estado:', response.status);
                console.log('Headers:', response.headers.keys());

                if (response.status === 200) {
                    const postulacion = this.transformSingleResponse(response.body);
                    console.log('Detalles de postulación transformados:', postulacion);
                    return postulacion;
                } else {
                    throw new Error(`Error inesperado: ${response.status}`);
                }
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
