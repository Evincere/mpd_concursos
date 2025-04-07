import { Injectable } from '@angular/core';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

/**
 * Interfaz para el estado completo del formulario de inscripción
 */
export interface IInscriptionFormState {
  inscriptionId: string;
  contestId: number;
  currentStep: InscriptionStep;
  formData: {
    termsAccepted: boolean;
    selectedCircunscripciones: string[];
    confirmedPersonalData: boolean;
    // Otros campos que puedan ser necesarios
  };
  timestamp: string;
  contestTitle?: string; // Título del concurso para mostrar en diálogos
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionStateService {
  private readonly STORAGE_KEY = 'mpd_inscription_in_progress';
  private readonly REDIRECT_FROM_DOCS_KEY = 'mpd_redirect_from_inscription';
  private readonly FORM_STATE_KEY = 'mpd_inscription_form_state';
  private readonly INCOMPLETE_INSCRIPTIONS_KEY = 'mpd_incomplete_inscriptions';

  constructor() { }

  /**
   * Guarda el estado de una inscripción en progreso
   * @param inscription Datos de la inscripción
   */
  saveInProgressInscription(inscription: IInscription): void {
    try {
      // Marcar la inscripción como "en proceso"
      const inscriptionData = {
        ...inscription,
        state: InscripcionState.PENDING,
        currentStep: InscriptionStep.DATA_CONFIRMATION, // Paso 3
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(inscriptionData));
      console.log('[InscriptionStateService] Inscripción en progreso guardada:', inscriptionData);
    } catch (error) {
      console.error('[InscriptionStateService] Error al guardar inscripción en progreso:', error);
    }
  }

  /**
   * Obtiene la inscripción en progreso guardada
   * @returns Datos de la inscripción o null si no hay ninguna
   */
  getInProgressInscription(): IInscription | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return null;
      }

      // Parsear los datos guardados
      const savedData = JSON.parse(data);
      const inscription = savedData as IInscription;

      // Verificar si la inscripción es reciente (menos de 24 horas)
      // La propiedad timestamp es agregada por nosotros al guardar, no es parte de IInscription
      const timestamp = new Date(savedData.timestamp || new Date().toISOString());
      const now = new Date();
      const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        // Si han pasado más de 24 horas, eliminar la inscripción guardada
        this.clearInProgressInscription();
        return null;
      }

      return inscription;
    } catch (error) {
      console.error('[InscriptionStateService] Error al recuperar inscripción en progreso:', error);
      return null;
    }
  }

  /**
   * Elimina la inscripción en progreso guardada
   */
  clearInProgressInscription(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[InscriptionStateService] Inscripción en progreso eliminada');
    } catch (error) {
      console.error('[InscriptionStateService] Error al eliminar inscripción en progreso:', error);
    }
  }

  /**
   * Marca que el usuario viene de la inscripción al ir a la pestaña de documentación
   * @param inscriptionId ID de la inscripción
   */
  setRedirectFromInscription(inscriptionId: string): void {
    try {
      localStorage.setItem(this.REDIRECT_FROM_DOCS_KEY, inscriptionId);
      console.log('[InscriptionStateService] Redirección desde inscripción guardada:', inscriptionId);
    } catch (error) {
      console.error('[InscriptionStateService] Error al guardar redirección desde inscripción:', error);
    }
  }

  /**
   * Verifica si el usuario viene de la inscripción
   * @returns ID de la inscripción o null
   */
  getRedirectFromInscription(): string | null {
    try {
      return localStorage.getItem(this.REDIRECT_FROM_DOCS_KEY);
    } catch (error) {
      console.error('[InscriptionStateService] Error al recuperar redirección desde inscripción:', error);
      return null;
    }
  }

  /**
   * Elimina la marca de redirección desde inscripción
   */
  clearRedirectFromInscription(): void {
    try {
      localStorage.removeItem(this.REDIRECT_FROM_DOCS_KEY);
      console.log('[InscriptionStateService] Redirección desde inscripción eliminada');
    } catch (error) {
      console.error('[InscriptionStateService] Error al eliminar redirección desde inscripción:', error);
    }
  }

  /**
   * Guarda el estado completo del formulario de inscripción
   * @param inscriptionId ID de la inscripción
   * @param contestId ID del concurso
   * @param currentStep Paso actual del proceso
   * @param formData Datos del formulario
   * @param contestTitle Título del concurso (opcional)
   */
  saveInscriptionState(inscriptionId: string, contestId: number, currentStep: InscriptionStep, formData: any, contestTitle?: string): void {
    try {
      const state: IInscriptionFormState = {
        inscriptionId,
        contestId,
        currentStep,
        formData,
        timestamp: new Date().toISOString(),
        contestTitle
      };

      // Guardar el estado individual
      localStorage.setItem(`${this.FORM_STATE_KEY}_${inscriptionId}`, JSON.stringify(state));

      // Actualizar la lista de inscripciones incompletas
      this.addToIncompleteInscriptions(inscriptionId, contestId, contestTitle);

      console.log('[InscriptionStateService] Estado de inscripción guardado:', state);
    } catch (error) {
      console.error('[InscriptionStateService] Error al guardar estado de inscripción:', error);
    }
  }

  /**
   * Obtiene el estado completo del formulario de inscripción
   * @param inscriptionId ID de la inscripción
   * @returns Estado del formulario o null si no existe
   */
  getInscriptionState(inscriptionId: string): IInscriptionFormState | null {
    try {
      const data = localStorage.getItem(`${this.FORM_STATE_KEY}_${inscriptionId}`);
      if (!data) {
        return null;
      }

      const state = JSON.parse(data) as IInscriptionFormState;

      // Verificar si el estado es reciente (menos de 24 horas)
      const timestamp = new Date(state.timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        // Si han pasado más de 24 horas, eliminar el estado guardado
        this.clearInscriptionState(inscriptionId);
        return null;
      }

      return state;
    } catch (error) {
      console.error('[InscriptionStateService] Error al recuperar estado de inscripción:', error);
      return null;
    }
  }

  /**
   * Elimina el estado del formulario de inscripción
   * @param inscriptionId ID de la inscripción
   */
  clearInscriptionState(inscriptionId: string): void {
    try {
      localStorage.removeItem(`${this.FORM_STATE_KEY}_${inscriptionId}`);
      this.removeFromIncompleteInscriptions(inscriptionId);
      console.log('[InscriptionStateService] Estado de inscripción eliminado:', inscriptionId);
    } catch (error) {
      console.error('[InscriptionStateService] Error al eliminar estado de inscripción:', error);
    }
  }

  /**
   * Verifica si hay inscripciones incompletas
   * @returns true si hay inscripciones incompletas, false en caso contrario
   */
  hasIncompleteInscriptions(): boolean {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (!data) {
        return false;
      }

      const inscriptions = JSON.parse(data) as Array<{id: string, contestId: number, timestamp: string, contestTitle?: string}>;
      return inscriptions.length > 0;
    } catch (error) {
      console.error('[InscriptionStateService] Error al verificar inscripciones incompletas:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las inscripciones incompletas
   * @returns Array de estados de inscripción o array vacío si no hay ninguna
   */
  getAllIncompleteInscriptions(): IInscriptionFormState[] {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (!data) {
        return [];
      }

      const incompleteIds = JSON.parse(data) as Array<{id: string, contestId: number, timestamp: string, contestTitle?: string}>;

      // Filtrar por tiempo (menos de 24 horas)
      const now = new Date();
      const validIncompleteIds = incompleteIds.filter(item => {
        const timestamp = new Date(item.timestamp);
        const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      });

      // Si se filtraron elementos, actualizar la lista
      if (validIncompleteIds.length !== incompleteIds.length) {
        localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(validIncompleteIds));
      }

      // Obtener los estados completos
      const result: IInscriptionFormState[] = [];
      for (const item of validIncompleteIds) {
        const state = this.getInscriptionState(item.id);
        if (state) {
          result.push(state);
        }
      }

      return result;
    } catch (error) {
      console.error('[InscriptionStateService] Error al obtener inscripciones incompletas:', error);
      return [];
    }
  }

  /**
   * Agrega una inscripción a la lista de incompletas
   * @param inscriptionId ID de la inscripción
   * @param contestId ID del concurso
   * @param contestTitle Título del concurso (opcional)
   */
  private addToIncompleteInscriptions(inscriptionId: string, contestId: number, contestTitle?: string): void {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      let inscriptions: Array<{id: string, contestId: number, timestamp: string, contestTitle?: string}> = [];

      if (data) {
        inscriptions = JSON.parse(data);
      }

      // Verificar si ya existe
      const existingIndex = inscriptions.findIndex(item => item.id === inscriptionId);
      if (existingIndex >= 0) {
        // Actualizar timestamp
        inscriptions[existingIndex].timestamp = new Date().toISOString();
        if (contestTitle) {
          inscriptions[existingIndex].contestTitle = contestTitle;
        }
      } else {
        // Agregar nueva inscripción
        inscriptions.push({
          id: inscriptionId,
          contestId,
          timestamp: new Date().toISOString(),
          contestTitle
        });
      }

      localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(inscriptions));
    } catch (error) {
      console.error('[InscriptionStateService] Error al agregar a inscripciones incompletas:', error);
    }
  }

  /**
   * Elimina una inscripción de la lista de incompletas
   * @param inscriptionId ID de la inscripción
   */
  private removeFromIncompleteInscriptions(inscriptionId: string): void {
    try {
      const data = localStorage.getItem(this.INCOMPLETE_INSCRIPTIONS_KEY);
      if (!data) {
        return;
      }

      let inscriptions = JSON.parse(data) as Array<{id: string, contestId: number, timestamp: string}>;
      inscriptions = inscriptions.filter(item => item.id !== inscriptionId);

      localStorage.setItem(this.INCOMPLETE_INSCRIPTIONS_KEY, JSON.stringify(inscriptions));
    } catch (error) {
      console.error('[InscriptionStateService] Error al eliminar de inscripciones incompletas:', error);
    }
  }
}
