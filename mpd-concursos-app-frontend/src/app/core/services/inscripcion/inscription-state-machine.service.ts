import { Injectable } from '@angular/core';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Servicio para manejar transiciones de estado de inscripciones
 * Sincronizado con InscriptionStateMachine.java del backend
 */
@Injectable({
  providedIn: 'root'
})
export class InscriptionStateMachineService {

  // Transiciones válidas - sincronizado con backend
  private readonly VALID_TRANSITIONS = new Map<InscripcionState, Set<InscripcionState>>([
    [InscripcionState.ACTIVE, new Set([
      InscripcionState.COMPLETED_WITH_DOCS,
      InscripcionState.COMPLETED_PENDING_DOCS,
      InscripcionState.CANCELLED
    ])],
    [InscripcionState.COMPLETED_WITH_DOCS, new Set([
      InscripcionState.PENDING,
      InscripcionState.COMPLETED_PENDING_DOCS,
      InscripcionState.CANCELLED
    ])],
    [InscripcionState.COMPLETED_PENDING_DOCS, new Set([
      InscripcionState.COMPLETED_WITH_DOCS,
      InscripcionState.FROZEN,
      InscripcionState.CANCELLED
    ])],
    [InscripcionState.PENDING, new Set([
      InscripcionState.APPROVED,
      InscripcionState.REJECTED
    ])],
    [InscripcionState.FROZEN, new Set([
      InscripcionState.REJECTED
    ])],
    // Estados finales - sin transiciones
    [InscripcionState.APPROVED, new Set()],
    [InscripcionState.REJECTED, new Set()],
    [InscripcionState.CANCELLED, new Set()]
  ]);

  constructor(private loggingService: LoggingService) {}

  /**
   * Verifica si una transición de estado es válida
   * @param from Estado actual
   * @param to Estado objetivo
   * @returns true si la transición es válida
   */
  canTransition(from: InscripcionState, to: InscripcionState): boolean {
    if (!from || !to) {
      return false;
    }

    const validNextStates = this.VALID_TRANSITIONS.get(from);
    return validNextStates?.has(to) ?? false;
  }

  /**
   * Valida una transición y lanza error si es inválida
   * @param from Estado actual
   * @param to Estado objetivo
   * @throws Error si la transición no es válida
   */
  validateTransition(from: InscripcionState, to: InscripcionState): void {
    if (!this.canTransition(from, to)) {
      const errorMessage = `Transición de estado inválida: ${from} -> ${to}`;
      this.loggingService.error(errorMessage, undefined, 'InscriptionStateMachine');
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtiene todos los estados válidos siguientes para un estado dado
   * @param current Estado actual
   * @returns Set de estados válidos siguientes
   */
  getValidNextStates(current: InscripcionState): Set<InscripcionState> {
    return this.VALID_TRANSITIONS.get(current) ?? new Set();
  }

  /**
   * Determina el siguiente estado automático basado en reglas de negocio
   * Sincronizado con backend InscriptionStateMachine.getNextAutomaticState()
   * @param currentState Estado actual
   * @param hasAllDocuments Si tiene todos los documentos requeridos
   * @returns Siguiente estado automático o null si no hay transición automática
   */
  getNextAutomaticState(currentState: InscripcionState, hasAllDocuments: boolean): InscripcionState | null {
    switch (currentState) {
      case InscripcionState.ACTIVE:
        return hasAllDocuments ? 
          InscripcionState.COMPLETED_WITH_DOCS : 
          InscripcionState.COMPLETED_PENDING_DOCS;
          
      case InscripcionState.COMPLETED_WITH_DOCS:
        // Auto-transición a PENDING para revisión del admin
        return InscripcionState.PENDING;
        
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return hasAllDocuments ? InscripcionState.COMPLETED_WITH_DOCS : null;
        
      case InscripcionState.FROZEN:
        // Auto-rechazo después del deadline
        return InscripcionState.REJECTED;
        
      default:
        return null;
    }
  }

  /**
   * Verifica si un estado es final (no permite más transiciones)
   * @param state Estado a verificar
   * @returns true si es un estado final
   */
  isFinalState(state: InscripcionState): boolean {
    const validNextStates = this.VALID_TRANSITIONS.get(state);
    return validNextStates?.size === 0;
  }

  /**
   * Verifica si un estado permite cancelación
   * @param state Estado a verificar
   * @returns true si permite cancelación
   */
  canBeCancelled(state: InscripcionState): boolean {
    const validNextStates = this.VALID_TRANSITIONS.get(state);
    return validNextStates?.has(InscripcionState.CANCELLED) ?? false;
  }

  /**
   * Obtiene el mensaje de error apropiado para una transición inválida
   * @param from Estado actual
   * @param to Estado objetivo
   * @returns Mensaje de error descriptivo
   */
  getTransitionErrorMessage(from: InscripcionState, to: InscripcionState): string {
    if (this.isFinalState(from)) {
      return `No se puede cambiar el estado desde ${from} porque es un estado final.`;
    }

    const validStates = Array.from(this.getValidNextStates(from));
    if (validStates.length === 0) {
      return `El estado ${from} no permite transiciones.`;
    }

    return `Transición inválida de ${from} a ${to}. Estados válidos: ${validStates.join(', ')}.`;
  }

  /**
   * Verifica si una inscripción puede ser re-abierta
   * @param state Estado actual
   * @returns true si puede ser re-abierta
   */
  canBeReopened(state: InscripcionState): boolean {
    // Solo estados específicos pueden ser re-abiertos
    return [
      InscripcionState.COMPLETED_PENDING_DOCS,
      InscripcionState.FROZEN
    ].includes(state);
  }

  /**
   * Obtiene el estado de visualización para el usuario
   * @param state Estado interno
   * @returns Texto descriptivo para mostrar al usuario
   */
  getDisplayText(state: InscripcionState): string {
    const displayTexts = {
      [InscripcionState.NO_INSCRIPTION]: 'Sin inscripción',
      [InscripcionState.ACTIVE]: 'En proceso',
      [InscripcionState.PENDING]: 'Pendiente de revisión',
      [InscripcionState.COMPLETED_WITH_DOCS]: 'Completada con documentación',
      [InscripcionState.COMPLETED_PENDING_DOCS]: 'Completada - Documentación pendiente',
      [InscripcionState.FROZEN]: 'Congelada',
      [InscripcionState.APPROVED]: 'Aprobada',
      [InscripcionState.REJECTED]: 'Rechazada',
      [InscripcionState.CANCELLED]: 'Cancelada'
    };

    return displayTexts[state] || state;
  }

  /**
   * Obtiene la clase CSS apropiada para el estado
   * @param state Estado de la inscripción
   * @returns Clase CSS para styling
   */
  getStateClass(state: InscripcionState): string {
    const stateClasses = {
      [InscripcionState.NO_INSCRIPTION]: 'state-no-inscription',
      [InscripcionState.ACTIVE]: 'state-active',
      [InscripcionState.PENDING]: 'state-pending',
      [InscripcionState.COMPLETED_WITH_DOCS]: 'state-completed',
      [InscripcionState.COMPLETED_PENDING_DOCS]: 'state-pending-docs',
      [InscripcionState.FROZEN]: 'state-frozen',
      [InscripcionState.APPROVED]: 'state-approved',
      [InscripcionState.REJECTED]: 'state-rejected',
      [InscripcionState.CANCELLED]: 'state-cancelled'
    };

    return stateClasses[state] || 'state-unknown';
  }
}
