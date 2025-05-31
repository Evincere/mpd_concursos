import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from  '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';


export interface StateTransition {
  fromState: InscripcionState;
  toState: InscripcionState;
  requiredRole: string;
  requiresApproval: boolean;
  requiresReason: boolean;
  notifyUser: boolean;
}

export interface TransitionRequest {
  inscriptionId: string;
  toState: InscripcionState;
  reason?: string;
  notifyUser?: boolean;
  customMessage?: string;
}

export interface TransitionResponse {
  success: boolean;
  message: string;
  inscription: IInscription;
  notificationSent?: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  forState: InscripcionState;
  variables: string[];
}

export interface CommunicationHistory {
  id: string;
  inscriptionId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  subject: string;
  message: string;
  sentAt: Date;
  sentBy: string;
  sentByRole: string;
  messageType: 'email' | 'notification' | 'sms';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  relatedState?: InscripcionState;
}

export interface SpecialCase {
  id: string;
  inscriptionId: string;
  type: 'exception' | 'priority' | 'review' | 'hold';
  reason: string;
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface InternalNote {
  id: string;
  inscriptionId: string;
  note: string;
  createdAt: Date;
  createdBy: string;
  createdByRole: string;
  isPrivate: boolean;
  isPinned: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionLifecycleService {
  private apiUrl = `${environment.apiUrl}/admin/inscriptions`;

  constructor(private http: HttpClient) {}

  // Definición de transiciones de estado permitidas
  private allowedTransitions: StateTransition[] = [
    // Desde NO_INSCRIPTO
    { fromState: InscripcionState.NO_INSCRIPTO, toState: InscripcionState.IN_PROCESS, requiredRole: 'USER', requiresApproval: false, requiresReason: false, notifyUser: false },

    // Desde IN_PROCESS
    { fromState: InscripcionState.IN_PROCESS, toState: InscripcionState.PENDING, requiredRole: 'USER', requiresApproval: false, requiresReason: false, notifyUser: true },
    { fromState: InscripcionState.IN_PROCESS, toState: InscripcionState.CANCELLED, requiredRole: 'USER', requiresApproval: false, requiresReason: true, notifyUser: true },
    { fromState: InscripcionState.IN_PROCESS, toState: InscripcionState.NO_INSCRIPTO, requiredRole: 'USER', requiresApproval: false, requiresReason: true, notifyUser: false },

    // Desde PENDING
    { fromState: InscripcionState.PENDING, toState: InscripcionState.APPROVED, requiredRole: 'ADMIN', requiresApproval: false, requiresReason: false, notifyUser: true },
    { fromState: InscripcionState.PENDING, toState: InscripcionState.REJECTED, requiredRole: 'ADMIN', requiresApproval: false, requiresReason: true, notifyUser: true },
    { fromState: InscripcionState.PENDING, toState: InscripcionState.CANCELLED, requiredRole: 'USER', requiresApproval: true, requiresReason: true, notifyUser: true },

    // Desde APPROVED
    { fromState: InscripcionState.APPROVED, toState: InscripcionState.REJECTED, requiredRole: 'ADMIN', requiresApproval: true, requiresReason: true, notifyUser: true },
    { fromState: InscripcionState.APPROVED, toState: InscripcionState.CANCELLED, requiredRole: 'USER', requiresApproval: true, requiresReason: true, notifyUser: true },

    // Desde REJECTED
    { fromState: InscripcionState.REJECTED, toState: InscripcionState.APPROVED, requiredRole: 'ADMIN', requiresApproval: true, requiresReason: true, notifyUser: true },
    { fromState: InscripcionState.REJECTED, toState: InscripcionState.PENDING, requiredRole: 'ADMIN', requiresApproval: true, requiresReason: true, notifyUser: true },

    // Desde CANCELLED
    { fromState: InscripcionState.CANCELLED, toState: InscripcionState.NO_INSCRIPTO, requiredRole: 'USER', requiresApproval: false, requiresReason: false, notifyUser: false },
    { fromState: InscripcionState.CANCELLED, toState: InscripcionState.PENDING, requiredRole: 'ADMIN', requiresApproval: true, requiresReason: true, notifyUser: true }
  ];



  /**
   * Obtiene las transiciones de estado permitidas para una inscripción
   * @param currentState Estado actual de la inscripción
   * @param userRole Rol del usuario que realiza la consulta
   */
  getAllowedTransitions(currentState: InscripcionState, userRole: string): StateTransition[] {
    return this.allowedTransitions.filter(transition =>
      transition.fromState === currentState &&
      (transition.requiredRole === userRole || userRole === 'ADMIN')
    );
  }

  /**
   * Verifica si una transición de estado es válida
   * @param fromState Estado actual
   * @param toState Estado destino
   * @param userRole Rol del usuario
   */
  isTransitionAllowed(fromState: InscripcionState, toState: InscripcionState, userRole: string): boolean {
    return this.allowedTransitions.some(transition =>
      transition.fromState === fromState &&
      transition.toState === toState &&
      (transition.requiredRole === userRole || userRole === 'ADMIN')
    );
  }

  /**
   * Obtiene los requisitos para una transición específica
   * @param fromState Estado actual
   * @param toState Estado destino
   */
  getTransitionRequirements(fromState: InscripcionState, toState: InscripcionState): StateTransition | null {
    const transition = this.allowedTransitions.find(t =>
      t.fromState === fromState && t.toState === toState
    );
    return transition || null;
  }

  /**
   * Realiza una transición de estado para una inscripción
   * @param request Datos de la solicitud de transición
   */
  performTransition(request: TransitionRequest): Observable<TransitionResponse> {
    return this.http.post<TransitionResponse>(`${this.apiUrl}/${request.inscriptionId}/transition`, request).pipe(
      catchError(error => {
        console.error(`Error al realizar transición de estado para inscripción ${request.inscriptionId}:`, error);
        return throwError(() => new Error('Error al cambiar el estado de la inscripción'));
      })
    );
  }

  /**
   * Obtiene las plantillas de mensajes disponibles
   * @param forState Estado para el que se buscan plantillas (opcional)
   */
  getMessageTemplates(forState?: InscripcionState): Observable<MessageTemplate[]> {
    let params = new HttpParams();
    if (forState) {
      params = params.set('state', forState);
    }

    return this.http.get<MessageTemplate[]>(`${this.apiUrl}/message-templates`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener plantillas de mensajes:', error);
        return of([]);
      })
    );
  }

  /**
   * Envía una comunicación personalizada a un usuario
   * @param inscriptionId ID de la inscripción
   * @param subject Asunto del mensaje
   * @param message Contenido del mensaje
   * @param type Tipo de comunicación
   */
  sendCommunication(inscriptionId: string, subject: string, message: string, type: 'email' | 'notification' | 'sms' = 'email'): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${inscriptionId}/communicate`, {
      subject,
      message,
      type
    }).pipe(
      map((response: Record<string, unknown>) => response['success'] as boolean),
      catchError(error => {
        console.error(`Error al enviar comunicación para inscripción ${inscriptionId}:`, error);
        return of(false);
      })
    );
  }

  /**
   * Obtiene el historial de comunicaciones para una inscripción
   * @param inscriptionId ID de la inscripción
   */
  getCommunicationHistory(inscriptionId: string): Observable<CommunicationHistory[]> {
    return this.http.get<CommunicationHistory[]>(`${this.apiUrl}/${inscriptionId}/communications`).pipe(
      catchError(error => {
        console.error(`Error al obtener historial de comunicaciones para inscripción ${inscriptionId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Marca una inscripción como caso especial
   * @param inscriptionId ID de la inscripción
   * @param specialCase Datos del caso especial
   */
  markAsSpecialCase(inscriptionId: string, specialCase: Omit<SpecialCase, 'id' | 'inscriptionId' | 'createdAt' | 'createdBy'>): Observable<SpecialCase> {
    return this.http.post<SpecialCase>(`${this.apiUrl}/${inscriptionId}/special-case`, specialCase).pipe(
      catchError(error => {
        console.error(`Error al marcar inscripción ${inscriptionId} como caso especial:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene los casos especiales para una inscripción
   * @param inscriptionId ID de la inscripción
   */
  getSpecialCases(inscriptionId: string): Observable<SpecialCase[]> {
    return this.http.get<SpecialCase[]>(`${this.apiUrl}/${inscriptionId}/special-cases`).pipe(
      catchError(error => {
        console.error(`Error al obtener casos especiales para inscripción ${inscriptionId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Resuelve un caso especial
   * @param inscriptionId ID de la inscripción
   * @param specialCaseId ID del caso especial
   * @param resolution Resolución del caso
   */
  resolveSpecialCase(inscriptionId: string, specialCaseId: string, resolution: string): Observable<SpecialCase> {
    return this.http.patch<SpecialCase>(`${this.apiUrl}/${inscriptionId}/special-cases/${specialCaseId}/resolve`, { resolution }).pipe(
      catchError(error => {
        console.error(`Error al resolver caso especial ${specialCaseId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Añade una nota interna a una inscripción
   * @param inscriptionId ID de la inscripción
   * @param note Datos de la nota
   */
  addInternalNote(inscriptionId: string, note: Omit<InternalNote, 'id' | 'inscriptionId' | 'createdAt' | 'createdBy' | 'createdByRole'>): Observable<InternalNote> {
    return this.http.post<InternalNote>(`${this.apiUrl}/${inscriptionId}/notes`, note).pipe(
      catchError(error => {
        console.error(`Error al añadir nota interna a inscripción ${inscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene las notas internas de una inscripción
   * @param inscriptionId ID de la inscripción
   */
  getInternalNotes(inscriptionId: string): Observable<InternalNote[]> {
    return this.http.get<InternalNote[]>(`${this.apiUrl}/${inscriptionId}/notes`).pipe(
      catchError(error => {
        console.error(`Error al obtener notas internas para inscripción ${inscriptionId}:`, error);
        return of([]);
      })
    );
  }
}
