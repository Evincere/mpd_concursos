import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from  'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

/**
 * Interfaz para la solicitud de sesión de inscripción
 */
export interface InscriptionSessionRequest {
  inscriptionId: string;
  contestId: number;
  currentStep: InscriptionStep;
  formData: {
    termsAccepted?: boolean;
    centroDeVida?: string;
    selectedCircunscripciones?: string[];
    documentosCompletos?: boolean;
    confirmedPersonalData?: boolean;
    currentStep?: number;
    contestId?: number;
    contestTitle?: string;
  };
}

/**
 * Interfaz para la respuesta de sesión de inscripción
 */
export interface InscriptionSessionResponse {
  id: string;
  inscriptionId: string;
  contestId: number;
  userId: string;
  currentStep: InscriptionStep;
  formData: {
    termsAccepted?: boolean;
    centroDeVida?: string;
    selectedCircunscripciones?: string[];
    documentosCompletos?: boolean;
    confirmedPersonalData?: boolean;
    currentStep?: number;
    contestId?: number;
    contestTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

/**
 * Servicio para gestionar las sesiones de inscripción
 */
@Injectable({
  providedIn: 'root'
})
export class InscriptionSessionService {
  private apiUrl = `${environment.apiUrl}/inscription-sessions`;
  private http: HttpClient;

  constructor(
    private loggingService: LoggingService
  ) {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string): Observable<T> => {
        // Logging implementado con LoggingService;
      },
      post: <T>(_url: string, _body: unknown): Observable<T> => {
        // Logging implementado con LoggingService;
      },
      delete: <T>(_url: string): Observable<T> => {
        // Logging implementado con LoggingService;
      }
    } as HttpClient;
  }

  /**
   * Guarda una sesión de inscripción
   * @param session Datos de la sesión a guardar
   * @returns Observable con la sesión guardada
   */
  saveSession(session: InscriptionSessionRequest): Observable<InscriptionSessionResponse> {
    // Logging implementado con LoggingService;),
        catchError(error => {
          this.loggingService.debug('[InscriptionSessionService] Error al guardar sesión:', error.status, 'InscriptionSession');
          throw error;
        })
      );
  }

  /**
   * Obtiene una sesión por su ID de inscripción
   * @param inscriptionId ID de la inscripción
   * @returns Observable con la sesión encontrada o null
   */
  getSessionByInscriptionId(inscriptionId: string): Observable<InscriptionSessionResponse | null> {
    // Logging implementado con LoggingService;),
        catchError(error => {
          console.error('[InscriptionSessionService] Error al buscar sesión:', error);
          return of(null);
        })
      );
  }

  /**
   * Obtiene una sesión por ID de concurso
   * @param contestId ID del concurso
   * @returns Observable con la sesión encontrada o null
   */
  getSessionByContestId(contestId: number): Observable<InscriptionSessionResponse | null> {
    // Logging implementado con LoggingService;),
        catchError(error => {
          console.error('[InscriptionSessionService] Error al buscar sesión:', error);
          return of(null);
        })
      );
  }

  /**
   * Obtiene todas las sesiones del usuario autenticado
   * @returns Observable con la lista de sesiones
   */
  getAllSessions(): Observable<InscriptionSessionResponse[]> {
    // Logging implementado con LoggingService;),
        catchError(error => {
          console.error('[InscriptionSessionService] Error al obtener sesiones:', error);
          return of([]);
        })
      );
  }

  /**
   * Elimina una sesión por su ID de inscripción
   * @param inscriptionId ID de la inscripción
   * @returns Observable con la respuesta vacía
   */
  deleteSessionByInscriptionId(inscriptionId: string): Observable<void> {
    // Logging implementado con LoggingService;),
        catchError(error => {
          console.error('[InscriptionSessionService] Error al eliminar sesión:', error);
          throw error;
        })
      );
  }

  /**
   * Convierte un paso numérico a enum
   * @param step Paso numérico
   * @returns Paso como enum
   */
  convertStepToEnum(step: number): InscriptionStep {
    switch (step) {
      case 1:
        return InscriptionStep.TERMS_ACCEPTANCE;
      case 2:
        return InscriptionStep.LOCATION_SELECTION;
      case 3:
        return InscriptionStep.DOCUMENTATION;
      case 4:
        return InscriptionStep.DATA_CONFIRMATION;
      default:
        return InscriptionStep.INITIAL;
    }
  }

  /**
   * Convierte un paso enum a numérico
   * @param step Paso como enum
   * @returns Paso numérico
   */
  convertEnumToStep(step: InscriptionStep): number {
    switch (step) {
      case InscriptionStep.TERMS_ACCEPTANCE:
        return 1;
      case InscriptionStep.LOCATION_SELECTION:
        return 2;
      case InscriptionStep.DOCUMENTATION:
        return 3;
      case InscriptionStep.DATA_CONFIRMATION:
        return 4;
      default:
        return 0;
    }
  }
}
