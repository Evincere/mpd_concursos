import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface InscriptionResponse {
  id: number;
  contestId: number;
  userId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  inscriptionDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/contests`;

  constructor(private http: HttpClient) {}

  /**
   * Crea una nueva inscripción para un concurso
   * @param contestId ID del concurso al que se quiere inscribir
   * @returns Observable con la respuesta de la inscripción
   */
  createInscription(contestId: number): Observable<InscriptionResponse> {
    return this.http.post<InscriptionResponse>(
      `${this.apiUrl}/${contestId}/inscriptions`,
      {}
    );
  }

  /**
   * Obtiene todas las inscripciones del usuario actual
   * @returns Observable con la lista de inscripciones
   */
  getUserInscriptions(): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(
      `${this.apiUrl}/inscriptions/me`
    );
  }

  /**
   * Obtiene el estado de una inscripción específica
   * @param inscriptionId ID de la inscripción
   * @returns Observable con los detalles de la inscripción
   */
  getInscriptionStatus(inscriptionId: number): Observable<InscriptionResponse> {
    return this.http.get<InscriptionResponse>(
      `${this.apiUrl}/inscriptions/${inscriptionId}`
    );
  }
}
