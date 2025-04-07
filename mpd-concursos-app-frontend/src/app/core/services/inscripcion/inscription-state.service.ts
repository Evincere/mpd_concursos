import { Injectable } from '@angular/core';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

@Injectable({
  providedIn: 'root'
})
export class InscriptionStateService {
  private readonly STORAGE_KEY = 'mpd_inscription_in_progress';
  private readonly REDIRECT_FROM_DOCS_KEY = 'mpd_redirect_from_inscription';

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
}
