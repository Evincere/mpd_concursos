import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContestStatus, Postulacion, PostulacionRequest, PostulacionResponse } from '../../../shared/interfaces/postulacion/postulacion.interface';

@Injectable({
    providedIn: 'root'
})
export class PostulacionesService {
    private apiUrl = `${environment.apiUrl}/api/inscriptions`;
  
    constructor(private http: HttpClient) { }
  
    getPostulaciones(page: number = 0, size: number = 10, sortBy: string = 'inscriptionDate', sortDirection: string = 'desc'): Observable<PostulacionResponse> {
      let params = new HttpParams()
          .set('page', page.toString())
          .set('size', size.toString())
          .set('sortBy', sortBy)
          .set('sortDirection', sortDirection);
  
      return this.http.get<PostulacionResponse>(this.apiUrl, {
          params,
          withCredentials: true
      }).pipe(
          map(response => {
              console.log('response', response);
              return this.transformResponse(response);
          }),
          catchError(this.handleError)
      );
    }
    
    private transformResponse(response: any): PostulacionResponse {
        const transformedResponse = {
            content: response.content.map((item: any) => {
                console.log('Item de postulación:', {
                    id: item.id,
                    contestId: item.contestId,
                    userId: item.userId,
                    estado: item.estado,
                    fechaPostulacion: item.fechaPostulacion
                });

                return {
                    id: item.id,
                    contestId: item.contestId,
                    userId: item.userId,
                    estado: item.estado,
                    fechaPostulacion: item.fechaPostulacion,
                    concurso: {
                        id: item.concurso.id,
                        titulo: item.concurso.titulo,
                        cargo: item.concurso.cargo,
                        dependencia: item.concurso.dependencia,
                        estado: item.concurso.estado,
                        fechaInicio: item.concurso.fechaInicio,
                        fechaFin: item.concurso.fechaFin,
                        results: item.concurso.results,
                        resolution: item.concurso.resolution,
                        requirements: item.concurso.requirements,
                        category: item.concurso.category,
                        class: item.concurso.class,
                        status: item.concurso.status as ContestStatus
                    }
                };
            }),
            pageNumber: response.pageNumber || 0,
            pageSize: response.pageSize || 10,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            last: response.last
        };

        console.log('Transformed Response:', transformedResponse);
        return transformedResponse;
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
        return this.http.post<Postulacion>(this.apiUrl, postulacion);
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

    // Método para transformar una única respuesta de postulación
    private transformSingleResponse(item: any): Postulacion {
        return {
            id: item.id,
            contestId: item.contestId,
            userId: item.userId,
            estado: item.estado,
            fechaPostulacion: item.fechaPostulacion,
            concurso: {
                id: item.concurso.id,
                titulo: item.concurso.titulo,
                cargo: item.concurso.cargo,
                dependencia: item.concurso.dependencia,
                estado: item.concurso.estado,
                fechaInicio: item.concurso.fechaInicio,
                fechaFin: item.concurso.fechaFin,
                results: item.concurso.results,
                resolution: item.concurso.resolution,
                requirements: item.concurso.requirements,
                category: item.concurso.category,
                class: item.concurso.class,
                status: item.concurso.status
            },
            attachedDocuments: item.attachedDocuments || []
        };
    }
}