import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private apiUrl = 'http://localhost:8080/api'; // Replace with your actual API URL

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  createInscription(contestId: number): Observable<any> {
    const userId = this.authService.getCurrentUserId();
    
    console.log('[InscripcionService] Preparando inscripción:', {
      userId,
      concursoId: contestId,
      tokenPresente: !!this.authService.getToken()
    });

    if (!userId) {
      return throwError(() => new Error('No se pudo obtener el ID del usuario'));
    }

    const inscriptionRequest = {
      contestId: contestId,
      userId: userId
    };

    return this.http.post(`${this.apiUrl}/inscripciones`, inscriptionRequest).pipe(
      tap(response => {
        console.log('[InscripcionService] Inscripción exitosa:', response);
      }),
      catchError(error => {
        console.error('[InscripcionService] Error en la inscripción:', error);
        if (error.status === 500) {
          // Mostrar un mensaje más amigable al usuario
          this.snackBar.open(
            'Hubo un problema al procesar su inscripción. Por favor, intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
        return throwError(() => error);
      })
    );
  }
} 