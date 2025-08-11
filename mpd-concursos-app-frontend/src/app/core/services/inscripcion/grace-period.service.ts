import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interfaz para información del período de gracia
 */
export interface GracePeriodInfo {
  isInGracePeriod: boolean;
  isContestClosed: boolean;
  documentationDeadline: Date | null;
  hoursRemaining: number;
  daysRemaining: number;
  isExpired: boolean;
  contestEndDate: Date | null;
}

/**
 * Servicio para manejar lógica del período de gracia de documentación
 * Determina si estamos en período de gracia y proporciona información relevante
 */
@Injectable({
  providedIn: 'root'
})
export class GracePeriodService {
  private readonly LOG_TAG = 'GracePeriodService';
  private gracePeriodInfoSubject = new BehaviorSubject<GracePeriodInfo | null>(null);

  constructor(private loggingService: LoggingService) {}

  /**
   * Calcula información del período de gracia basado en fechas de concurso e inscripción
   */
  calculateGracePeriodInfo(
    contestEndDate: Date | null,
    documentationDeadline: Date | null,
    contestStatus?: string
  ): GracePeriodInfo {
    const now = new Date();
    
    // Determinar si el concurso está cerrado
    const isContestClosed = contestStatus === 'CLOSED' || 
                           (contestEndDate && now > contestEndDate);
    
    // Calcular tiempo restante si hay deadline
    let hoursRemaining = 0;
    let daysRemaining = 0;
    let isExpired = false;
    
    if (documentationDeadline) {
      const remainingMs = documentationDeadline.getTime() - now.getTime();
      isExpired = remainingMs <= 0;
      
      if (!isExpired) {
        hoursRemaining = Math.ceil(remainingMs / (1000 * 60 * 60));
        daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      }
    }
    
    // Estamos en período de gracia si:
    // 1. El concurso está cerrado
    // 2. Hay un deadline de documentación
    // 3. El deadline no ha expirado
    const isInGracePeriod = isContestClosed && 
                           documentationDeadline && 
                           !isExpired;

    const info: GracePeriodInfo = {
      isInGracePeriod: !!isInGracePeriod,
      isContestClosed: !!isContestClosed,
      documentationDeadline,
      hoursRemaining,
      daysRemaining,
      isExpired,
      contestEndDate
    };

    this.loggingService.debug(`[${this.LOG_TAG}] Grace period info calculated:`, info, this.LOG_TAG);
    
    this.gracePeriodInfoSubject.next(info);
    return info;
  }

  /**
   * Obtiene el mensaje apropiado según el estado del período
   */
  getProvisionalMessage(gracePeriodInfo: GracePeriodInfo): {
    title: string;
    description: string;
    warningNote: string;
    checkboxText: string;
    alertClass: string;
  } {
    if (gracePeriodInfo.isExpired) {
      return {
        title: 'Plazo de Documentación Vencido',
        description: `El plazo para completar la documentación ha vencido. Su inscripción ha sido congelada y no puede continuar el proceso.`,
        warningNote: 'Su inscripción ha sido marcada como rechazada automáticamente por falta de documentación.',
        checkboxText: 'Entiendo que mi inscripción ha sido rechazada por falta de documentación',
        alertClass: 'expired-alert'
      };
    }
    
    if (gracePeriodInfo.isInGracePeriod) {
      const timeText = gracePeriodInfo.daysRemaining > 1 
        ? `${gracePeriodInfo.daysRemaining} días`
        : `${gracePeriodInfo.hoursRemaining} horas`;
      
      return {
        title: 'Período de Gracia - Completar Documentación',
        description: `Está en el período de gracia para completar su documentación. El concurso ya cerró, pero tiene hasta ${gracePeriodInfo.documentationDeadline?.toLocaleDateString('es-AR')} a las ${gracePeriodInfo.documentationDeadline?.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})} para completar los documentos faltantes.`,
        warningNote: `⚠️ CRÍTICO: Quedan solo ${timeText}. Si no completa la documentación antes del vencimiento, su inscripción será automáticamente rechazada y no podrá continuar en el proceso de selección.`,
        checkboxText: 'Entiendo que debo completar la documentación antes del vencimiento para que mi inscripción sea válida',
        alertClass: 'grace-period-alert'
      };
    }
    
    // Período de inscripción normal (mensaje original)
    return {
      title: 'Inscripción Provisional',
      description: 'Si no puede completar toda la documentación ahora, puede proceder con una inscripción provisional. Tendrá 3 días hábiles después del cierre de inscripciones para completar la documentación pendiente.',
      warningNote: 'La falta de documentación completa dentro del plazo resultará en la descalificación automática.',
      checkboxText: 'Acepto proceder con inscripción provisional y comprometerme a completar la documentación dentro del plazo establecido',
      alertClass: 'provisional-alert'
    };
  }

  /**
   * Observable para suscribirse a cambios en la información del período de gracia
   */
  get gracePeriodInfo$(): Observable<GracePeriodInfo | null> {
    return this.gracePeriodInfoSubject.asObservable();
  }

  /**
   * Obtiene la información actual del período de gracia
   */
  getCurrentGracePeriodInfo(): GracePeriodInfo | null {
    return this.gracePeriodInfoSubject.value;
  }
}
