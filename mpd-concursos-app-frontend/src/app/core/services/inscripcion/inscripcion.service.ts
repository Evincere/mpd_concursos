import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '@env/environment';
import { 
    InscripcionResponse, 
    ElegibilidadResponse, 
    InscripcionRequest 
} from '@shared/interfaces/inscripcion/inscripcion.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { AuthService } from '@core/services/auth/auth.service';
import { InscriptionResponse } from '../concursos/inscription.service';

@Injectable({
    providedIn: 'root'
})
export class InscripcionService {
    private readonly baseUrl = `${environment.apiUrl}/inscripciones`;

    constructor(
        private http: HttpClient,
        private snackBar: MatSnackBar,
        private authService: AuthService
    ) { }

    verificarElegibilidad(concursoId: string): Observable<ElegibilidadResponse> {
        const url = `${this.baseUrl}/elegibilidad/${concursoId}`;
        return this.http.get<ElegibilidadResponse>(url).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    inscribirse(concursoId: string, documentos?: File[]): Observable<InscripcionResponse> {
        const userId = this.authService.getCurrentUserId();
        if (!userId) {
            return throwError(() => new Error('Usuario no autenticado'));
        }

        const formData = new FormData();
        formData.append('concursoId', concursoId);
        
        if (documentos) {
            documentos.forEach((doc, index) => {
                formData.append(`documentos[${index}]`, doc);
            });
        }

        return this.http.post<InscripcionResponse>(this.baseUrl, formData).pipe(
            tap(response => {
                this.snackBar.open('Inscripción realizada con éxito', 'Cerrar', {
                    duration: 3000
                });
            }),
            catchError(this.handleError.bind(this))
        );
    }

    obtenerEstadoInscripcion(concursoId: string): Observable<InscripcionState> {
        const userId = this.authService.getCurrentUserId();
        if (!userId) {
            return of(InscripcionState.NO_INSCRIPTO);
        }
        
        return this.http.get<{ estado: string }>(
            `${this.baseUrl}/concursos/${concursoId}/estado`
        ).pipe(
            map(response => InscripcionState[response.estado as keyof typeof InscripcionState]),
            catchError(() => of(InscripcionState.NO_INSCRIPTO))
        );
    }

    cancelarInscripcion(inscripcionId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${inscripcionId}`
        ).pipe(
            tap(() => this.snackBar.open('Inscripción cancelada con éxito', 'Cerrar', {
                duration: 3000
            })),
            catchError(this.handleError.bind(this))
        );
    }

    createInscription(contestId: number): Observable<InscriptionResponse> {
        return this.http.post<InscriptionResponse>(
            `${this.baseUrl}/api/v1/contests/${contestId}/inscriptions`,
            {}
        ).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    getUserInscriptions(): Observable<InscriptionResponse[]> {
        return this.http.get<InscriptionResponse[]>(
            `${this.baseUrl}/api/v1/contests/inscriptions/me`
        ).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    getInscriptionStatus(inscripcionId: number): Observable<InscriptionResponse> {
        return this.http.get<InscriptionResponse>(
            `${this.baseUrl}/api/v1/contests/inscriptions/${inscripcionId}`
        ).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Ha ocurrido un error en la operación';
        
        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = error.error.message;
        } else {
            // Error del lado del servidor
            if (error.status === 400) {
                errorMessage = error.error.message || 'Datos inválidos';
            } else if (error.status === 401) {
                errorMessage = 'No autorizado';
            } else if (error.status === 403) {
                errorMessage = 'No tiene permisos para realizar esta operación';
            } else if (error.status === 404) {
                errorMessage = 'Recurso no encontrado';
            } else if (error.status === 409) {
                errorMessage = 'Ya existe una inscripción para este concurso';
            }
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });

        return throwError(() => new Error(errorMessage));
    }
}
