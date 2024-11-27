import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Postulacion, PostulacionRequest, PostulacionResponse } from '../../../shared/interfaces/postulacion/postulacion.interface';

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
            headers: {
                'Accept': 'application/json'
            }
        }).pipe(
            map(response => {
                console.log('response', response);
                return this.transformResponse(response);
            }),
            catchError(this.handleError)
        );
    }

    private transformResponse(response: any): PostulacionResponse {
        return {
            content: response.content.map((item: any) => ({
                id: item.id,
                concursoId: item.contestId,
                userId: item.userId,
                estado: item.status,
                fechaPostulacion: item.inscriptionDate,
                concurso: null
            })),
            pageNumber: response.pageNumber || 0,
            pageSize: response.pageSize || 10,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            last: response.last
        };
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
        return this.http.get<Postulacion>(`${this.apiUrl}/${id}`);
    }
} 