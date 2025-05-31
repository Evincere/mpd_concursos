import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { InscriptionFormData, InscriptionFormState } from '../models/inscription-form.model';

@Injectable({
  providedIn: 'root'
})
export class InscriptionFormService {
  private formStateSubject = new BehaviorSubject<InscriptionFormState | null>(null);
  formState$ = this.formStateSubject.asObservable();



  /**
   * Carga el estado del formulario desde el almacenamiento local
   * @param inscriptionId ID de la inscripción
   * @returns true si se encontró un estado guardado, false en caso contrario
   */
  loadFormState(inscriptionId: string): boolean {
    const savedState = this.inscriptionStateService.getInscriptionState(inscriptionId);
    if (savedState) {
      this.formStateSubject.next(savedState);
      return true;
    }
    return false;
  }

  /**
   * Guarda el estado del formulario en el almacenamiento local
   * @param inscriptionId ID de la inscripción
   * @param contestId ID del concurso
   * @param currentStep Paso actual del proceso
   * @param formData Datos del formulario
   * @param contestTitle Título del concurso (opcional)
   */
  saveFormState(
    inscriptionId: string,
    contestId: number,
    currentStep: InscriptionStep,
    formData: InscriptionFormData,
    contestTitle?: string
  ): void {
    this.inscriptionStateService.saveInscriptionState(
      inscriptionId,
      contestId,
      currentStep,
      formData,
      contestTitle
    );

    // Actualizar el estado local
    const state = this.inscriptionStateService.getInscriptionState(inscriptionId);
    if (state) {
      this.formStateSubject.next(state);
    }
  }

  /**
   * Limpia el estado del formulario
   * @param inscriptionId ID de la inscripción
   */
  clearFormState(inscriptionId: string): void {
    this.inscriptionStateService.clearInscriptionState(inscriptionId);
    this.formStateSubject.next(null);
  }

  /**
   * Actualiza el paso de la inscripción en el backend
   * @param inscriptionId ID de la inscripción
   * @param step Paso de la inscripción
   * @param formData Datos del formulario
   * @returns Observable con la respuesta del servidor
   */
  updateInscriptionStep(
    inscriptionId: string,
    step: InscriptionStep,
    formData: InscriptionFormData
  ): Observable<Record<string, unknown>> {
    return this.inscriptionService.updateInscriptionStep(inscriptionId, {
      step,
      centroDeVida: formData.centroDeVida,
      selectedCircunscripciones: formData.selectedCircunscripciones,
      acceptedTerms: formData.termsAccepted,
      confirmedPersonalData: formData.confirmedPersonalData
    });
  }

  /**
   * Actualiza el estado de la inscripción en el backend
   * @param inscriptionId ID de la inscripción
   * @param state Estado de la inscripción
   * @returns Observable con la respuesta del servidor
   */
  updateInscriptionStatus(inscriptionId: string, state: string): Observable<Record<string, unknown>> {
    return this.inscriptionService.updateInscriptionStatus(inscriptionId, {
      state
    });
  }

  /**
   * Obtiene el estado actual del formulario
   * @returns Estado actual del formulario o null si no hay estado
   */
  getCurrentFormState(): InscriptionFormState | null {
    return this.formStateSubject.getValue();
  }
}
