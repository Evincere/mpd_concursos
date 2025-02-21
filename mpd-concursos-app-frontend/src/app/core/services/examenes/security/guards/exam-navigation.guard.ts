import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ExamenNotificationService } from '../../examen-notification.service';
import { ExamenSecurityService } from '../examen-security.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export interface ComponentWithExam {
  isExamInProgress?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExamNavigationGuard implements CanDeactivate<ComponentWithExam> {
  constructor(
    private notificationService: ExamenNotificationService,
    private securityService: ExamenSecurityService
  ) {}

  async canDeactivate(
    component: ComponentWithExam
  ): Promise<boolean> {
    if (component.isExamInProgress) {
      // Mostrar diálogo de advertencia primero
      await this.notificationService.showSecurityWarning(
        SecurityViolationType.SUSPICIOUS_BEHAVIOR,
        'La navegación durante el examen no está permitida. Si decide salir, esto será registrado como una violación de seguridad.'
      );

      // Registrar el intento de navegación como una violación de seguridad
      this.securityService.reportSecurityViolation(
        SecurityViolationType.SUSPICIOUS_BEHAVIOR,
        { action: 'NAVIGATION_ATTEMPT', timestamp: new Date().toISOString() }
      );

      // Mostrar diálogo de confirmación
      const confirmed = await this.notificationService.confirmAction('salir');

      if (confirmed) {
        // Registrar la decisión del usuario de salir
        this.securityService.reportSecurityViolation(
          SecurityViolationType.SUSPICIOUS_BEHAVIOR,
          { action: 'EXAM_ABANDONED', timestamp: new Date().toISOString() }
        );
      }

      return confirmed;
    }

    return true;
  }
}