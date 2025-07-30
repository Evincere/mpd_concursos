import { Injectable } from '@angular/core';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interfaz para el estado completo del formulario de inscripción
 */
export interface IInscriptionFormState {
  inscriptionId: string;
  contestId: number;
  currentStep: InscriptionStep;
  timestamp: string;
  
  // Datos del formulario por pasos
  termsAccepted?: boolean;
  circunscripcionData?: any;
  documentationData?: any;
  confirmationData?: any;
  
  // Estado de la inscripción
  inscriptionCompleted?: boolean;
  inscriptionStatus?: InscripcionState;
  
  // Metadatos
  lastModified?: string;
  contestTitle?: string;
}

/**
 * ✅ SOLUCIÓN PROBLEMA 16: Servicio de Estado de Inscripciones
 * 
 * Gestiona el estado local de las inscripciones en progreso, proporcionando:
 * - Persistencia en localStorage con validación temporal
 * - Sincronización con el backend
 * - Detección de inscripciones incompletas
 * - Limpieza automática de datos obsoletos
 */
@Injectable({
  providedIn: 'root'
})
export class InscriptionStateService {
  
  private readonly FORM_STATE_KEY = 'inscription_form_state_';
  private readonly INCOMPLETE_INSCRIPTIONS_KEY = 'incomplete_inscriptions';
  
  constructor(private loggingService: LoggingService) {
    // ✅ CORRECCIÓN: Limpiar datos obsoletos al inicializar
    this.cleanupObsoleteData();
  }

  /**
   * Guarda el estado actual del formulario de inscripción
   * @param state Estado completo del formulario
   */
  saveInscriptionState(state: IInscriptionFormState): void {
    try {
      const key = this.FORM_STATE_KEY + state.inscriptionId;
      const stateWithTimestamp = {
        ...state,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(stateWithTimestamp));
      
      // Actualizar lista de inscripciones incompletas
      this.updateIncompleteInscriptionsList(state);
      
      this.loggingService.debug('[InscriptionStateService] Estado guardado', {
        inscriptionId: state.inscriptionId,
        currentStep: state.currentStep,
        contestId: state.contestId
      }, 'InscriptionStateService');
      
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al guardar estado', error, 'InscriptionStateService');
    }
  }

  /**
   * Recupera el estado guardado de una inscripción
   * @param inscriptionId ID de la inscripción
   * @returns Estado guardado o null si no existe
   */
  getInscriptionState(inscriptionId: string): IInscriptionFormState | null {
    try {
      const key = this.FORM_STATE_KEY + inscriptionId;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }
      
      const state = JSON.parse(data) as IInscriptionFormState;
      
      // Verificar que el estado no sea muy antiguo (más de 24 horas)
      const timestamp = new Date(state.timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (diffHours > 24) {
        this.removeInscriptionState(inscriptionId);
        return null;
      }
      
      return state;
      
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al recuperar estado', error, 'InscriptionStateService');
      return null;
    }
  }

  /**
   * Elimina el estado guardado de una inscripción
   * @param inscriptionId ID de la inscripción
   */
  removeInscriptionState(inscriptionId: string): void {
    try {
      const key = this.FORM_STATE_KEY + inscriptionId;
      localStorage.removeItem(key);
      
      // Remover de la lista de incompletas
      this.removeFromIncompleteList(inscriptionId);
      
      this.loggingService.debug('[InscriptionStateService] Estado eliminado', {
        inscriptionId
      }, 'InscriptionStateService');
      
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al eliminar estado', error, 'InscriptionStateService');
    }
  }

  /**
   * Actualiza la lista de inscripciones incompletas
   * @param state Estado de la inscripción
   */
  private updateIncompleteInscriptionsList(state: IInscriptionFormState): void {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      let incompleteList: {id: string, contestId: number, timestamp: string, contestTitle?: string}[] = [];
      
      if (data) {
        incompleteList = JSON.parse(data);
      }
      
      // Remover entrada existente si existe
      incompleteList = incompleteList.filter(item => item.id !== state.inscriptionId);
      
      // Agregar nueva entrada si la inscripción no está completada
      if (!state.inscriptionCompleted && state.currentStep !== InscriptionStep.COMPLETED) {
        incompleteList.push({
          id: state.inscriptionId,
          contestId: state.contestId,
          timestamp: new Date().toISOString(),
          contestTitle: state.contestTitle
        });
      }
      
      localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(incompleteList));
      
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al actualizar lista incompletas', error, 'InscriptionStateService');
    }
  }

  /**
   * Remueve una inscripción de la lista de incompletas
   * @param inscriptionId ID de la inscripción
   */
  private removeFromIncompleteList(inscriptionId: string): void {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (!data) return;
      
      let incompleteList = JSON.parse(data);
      incompleteList = incompleteList.filter((item: any) => item.id !== inscriptionId);
      
      localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(incompleteList));
      
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al remover de lista incompletas', error, 'InscriptionStateService');
    }
  }

  /**
   * Obtiene todas las inscripciones incompletas
   * 🔧 CORRECCIÓN: Filtrado más estricto para evitar falsos positivos
   * @returns Array de estados de inscripción o array vacío si no hay ninguna
   */
  getAllIncompleteInscriptions(): IInscriptionFormState[] {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (!data) {
        return [];
      }

      const incompleteIds = JSON.parse(data) as {id: string, contestId: number, timestamp: string, contestTitle?: string}[];

      // ✅ CORRECCIÓN: Filtrar por tiempo (menos de 2 horas para ser más estricto)
      const now = new Date();
      const validIncompleteIds = incompleteIds.filter(item => {
        const timestamp = new Date(item.timestamp);
        const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        return diffHours <= 2; // Reducido de 24 a 2 horas
      });

      // Si se filtraron elementos, actualizar la lista
      if (validIncompleteIds.length !== incompleteIds.length) {
        localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(validIncompleteIds));
      }

      // Obtener los estados completos y filtrar más estrictamente
      const result: IInscriptionFormState[] = [];
      for (const item of validIncompleteIds) {
        const state = this.getInscriptionState(item.id);
        if (state && this.isValidIncompleteInscription(state)) {
          result.push(state);
        }
      }

      this.loggingService.debug('[InscriptionStateService] Inscripciones incompletas filtradas', {
        totalFound: incompleteIds.length,
        validByTime: validIncompleteIds.length,
        validByState: result.length,
        results: result.map(r => ({
          id: r.inscriptionId,
          step: r.currentStep,
          contestId: r.contestId
        }))
      }, 'InscriptionStateService');

      return result;
    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al obtener inscripciones incompletas', error, 'InscriptionStateService');
      return [];
    }
  }

  /**
   * 🔧 NUEVO: Valida si una inscripción realmente está incompleta
   * @param state Estado de la inscripción
   * @returns true si la inscripción está realmente incompleta
   */
  private isValidIncompleteInscription(state: IInscriptionFormState): boolean {
    // ✅ Solo considerar incompletas las inscripciones que:
    // 1. Tienen un ID válido
    // 2. Están en un paso mayor al inicial
    // 3. No están en el paso final
    return !!(
      state.inscriptionId && 
      state.inscriptionId.trim() !== '' &&
      state.currentStep &&
      state.currentStep !== InscriptionStep.INITIAL &&
      state.currentStep !== InscriptionStep.COMPLETED
    );
  }

  /**
   * Verifica si hay alguna inscripción activa
   * @returns true si hay al menos una inscripción incompleta
   */
  hasActiveInscription(): boolean {
    return this.getAllIncompleteInscriptions().length > 0;
  }

  /**
   * Limpia todos los estados guardados
   */
  clearAllStates(): void {
    try {
      const keys = Object.keys(localStorage);
      const formStateKeys = keys.filter(key => key.startsWith(this.FORM_STATE_KEY));

      formStateKeys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(this.INCOMPLETE_INSCRIPTIONS_KEY);

      this.loggingService.debug('[InscriptionStateService] Todos los estados limpiados', {
        removedKeys: formStateKeys.length
      }, 'InscriptionStateService');

    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error al limpiar estados', error, 'InscriptionStateService');
    }
  }

  /**
   * 🔧 NUEVO: Limpia datos obsoletos del localStorage
   * Ejecutado automáticamente al inicializar el servicio
   */
  private cleanupObsoleteData(): void {
    try {
      // Limpiar inscripciones incompletas obsoletas (más de 24 horas)
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (data) {
        const incompleteIds = JSON.parse(data) as {id: string, contestId: number, timestamp: string}[];
        const now = new Date();

        const validIds = incompleteIds.filter(item => {
          const timestamp = new Date(item.timestamp);
          const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
          return diffHours <= 24;
        });

        if (validIds.length !== incompleteIds.length) {
          localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(validIds));

          this.loggingService.debug('[InscriptionStateService] Datos obsoletos limpiados', {
            originalCount: incompleteIds.length,
            cleanedCount: validIds.length,
            removedCount: incompleteIds.length - validIds.length
          }, 'InscriptionStateService');
        }
      }

      // Limpiar estados de formulario obsoletos
      const keys = Object.keys(localStorage);
      const formStateKeys = keys.filter(key => key.startsWith(this.FORM_STATE_KEY));

      for (const key of formStateKeys) {
        const stateData = localStorage.getItem(key);
        if (stateData) {
          try {
            const state = JSON.parse(stateData) as IInscriptionFormState;
            const timestamp = new Date(state.timestamp);
            const now = new Date();
            const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

            if (diffHours > 24) {
              localStorage.removeItem(key);
              this.loggingService.debug('[InscriptionStateService] Estado de formulario obsoleto eliminado', {
                key,
                inscriptionId: state.inscriptionId,
                ageHours: diffHours
              }, 'InscriptionStateService');
            }
          } catch (error) {
            // Si no se puede parsear, eliminar
            localStorage.removeItem(key);
          }
        }
      }

    } catch (error) {
      this.loggingService.error('[InscriptionStateService] Error durante limpieza de datos obsoletos', error, 'InscriptionStateService');
    }
  }
}
