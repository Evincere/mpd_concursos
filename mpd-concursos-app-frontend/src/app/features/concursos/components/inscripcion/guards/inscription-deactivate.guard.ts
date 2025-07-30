/**
 * ✅ SOLUCIÓN PROBLEMA 17: CanDeactivate Guard para Inscripciones
 *
 * Este guard previene la navegación accidental durante el proceso de inscripción,
 * resolviendo el comportamiento caótico identificado en la auditoría.
 *
 * Funcionalidades:
 * - Detecta navegación durante proceso de inscripción
 * - Muestra confirmación al usuario antes de permitir navegación
 * - Guarda estado automáticamente si el usuario confirma salir
 * - Distingue entre navegación interna (permitida) y externa (requiere confirmación)
 */

import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { InscripcionProcessPageComponent } from '../pages/inscripcion-process-page/inscripcion-process-page.component';
import { ConfirmationService } from '@shared/services/confirmation.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interface que define los métodos requeridos para el guard
 */
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean> | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionDeactivateGuard implements CanDeactivate<InscripcionProcessPageComponent> {

  constructor(
    private confirmationService: ConfirmationService,
    private loggingService: LoggingService
  ) {}

  /**
   * Determina si el componente puede ser desactivado (navegación permitida)
   * @param component Componente de inscripción
   * @returns Observable<boolean> - true si puede navegar, false si debe permanecer
   */
  canDeactivate(component: InscripcionProcessPageComponent): Observable<boolean> {
    // ✅ PERMITIR navegación si inscripción completada
    if (component.inscriptionCompleted || component.currentStep >= 5) {
      this.loggingService.debug('[InscriptionGuard] Navegación permitida - inscripción completada', {
        inscriptionId: component.inscriptionId,
        currentStep: component.currentStep,
        completed: component.inscriptionCompleted
      }, 'InscriptionDeactivateGuard');
      return of(true);
    }

    // ✅ PERMITIR navegación interna (entre pasos del mismo proceso)
    if (component.isInternalNavigation) {
      this.loggingService.debug('[InscriptionGuard] Navegación interna permitida', {
        inscriptionId: component.inscriptionId,
        currentStep: component.currentStep,
        isInternal: component.isInternalNavigation
      }, 'InscriptionDeactivateGuard');
      return of(true);
    }

    // ✅ PERMITIR navegación si no hay inscripción en progreso
    if (!component.inscriptionId || component.currentStep <= 1) {
      this.loggingService.debug('[InscriptionGuard] Navegación permitida - sin inscripción en progreso', {
        inscriptionId: component.inscriptionId,
        currentStep: component.currentStep
      }, 'InscriptionDeactivateGuard');
      return of(true);
    }

    // ✅ CONFIRMAR navegación cuando hay inscripción en progreso
    return this.showNavigationConfirmation(component);
  }

  /**
   * Muestra diálogo de confirmación para navegación durante inscripción
   * @param component Componente de inscripción
   * @returns Observable<boolean> - resultado de la confirmación
   */
  private showNavigationConfirmation(component: InscripcionProcessPageComponent): Observable<boolean> {
    this.loggingService.info('[InscriptionGuard] Solicitando confirmación de navegación', {
      inscriptionId: component.inscriptionId,
      currentStep: component.currentStep,
      contestId: component.contestId
    }, 'InscriptionDeactivateGuard');

    const message = `Tiene una inscripción en progreso (paso ${component.currentStep} de 4). Si sale ahora, su progreso se guardará automáticamente y podrá continuar más tarde.`;

    return this.confirmationService.warning(
      '¿Salir del proceso de inscripción?',
      message,
      'Su progreso se guardará automáticamente',
      'Salir del proceso',
      'Continuar inscripción'
    ).pipe(
      map(confirmed => {
        if (confirmed) {
          // ✅ GUARDAR estado antes de permitir navegación
          this.saveStateBeforeNavigation(component);

          this.loggingService.info('[InscriptionGuard] Usuario confirmó salir - navegación permitida', {
            inscriptionId: component.inscriptionId,
            currentStep: component.currentStep
          }, 'InscriptionDeactivateGuard');

          return true;
        } else {
          this.loggingService.debug('[InscriptionGuard] Usuario canceló navegación - permanece en proceso', {
            inscriptionId: component.inscriptionId,
            currentStep: component.currentStep
          }, 'InscriptionDeactivateGuard');

          return false;
        }
      }),
      catchError(error => {
        // En caso de error, permitir navegación para no bloquear al usuario
        this.loggingService.error('[InscriptionGuard] Error en confirmación - permitiendo navegación', error, 'InscriptionDeactivateGuard');
        this.saveStateBeforeNavigation(component);
        return of(true);
      })
    );
  }

  /**
   * Guarda el estado actual antes de permitir la navegación
   * @param component Componente de inscripción
   */
  private saveStateBeforeNavigation(component: InscripcionProcessPageComponent): void {
    try {
      // Llamar al método de guardado del componente
      component.guardarEstadoActual();

      this.loggingService.debug('[InscriptionGuard] Estado guardado antes de navegación', {
        inscriptionId: component.inscriptionId,
        currentStep: component.currentStep,
        timestamp: new Date().toISOString()
      }, 'InscriptionDeactivateGuard');

    } catch (error) {
      this.loggingService.error('[InscriptionGuard] Error guardando estado antes de navegación', error, 'InscriptionDeactivateGuard');
    }
  }
}
