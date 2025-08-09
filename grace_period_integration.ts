// AGREGAR estas importaciones al inicio del archivo
import { GracePeriodService, GracePeriodInfo } from '@core/services/inscripcion/grace-period.service';

// AGREGAR estas propiedades a la clase del componente (después de las propiedades existentes)
export class InscripcionProcessPageComponent implements OnInit, OnDestroy {
  // ... propiedades existentes ...

  // NUEVAS PROPIEDADES para período de gracia
  gracePeriodInfo: GracePeriodInfo | null = null;
  currentProvisionalMessage: any = null;

  constructor(
    // ... constructores existentes ...
    private gracePeriodService: GracePeriodService // AGREGAR esta inyección
  ) {
    // ... resto del constructor
  }

  // AGREGAR este método después de ngOnInit()
  private updateProvisionalMessage(): void {
    // Obtener información del concurso y deadline
    const contestEndDate = this.contestInfo?.inscriptionEndDate || null;
    const documentationDeadline = this.inscripcion?.documentationDeadline || null;
    const contestStatus = this.contestInfo?.status || null;

    // Calcular información del período de gracia
    this.gracePeriodInfo = this.gracePeriodService.calculateGracePeriodInfo(
      contestEndDate,
      documentationDeadline,
      contestStatus
    );

    // Obtener mensaje dinámico
    this.currentProvisionalMessage = this.gracePeriodService.getProvisionalMessage(this.gracePeriodInfo);

    this.loggingService.debug('[InscripcionProcess] Mensaje provisional actualizado:', {
      gracePeriodInfo: this.gracePeriodInfo,
      message: this.currentProvisionalMessage
    }, 'InscripcionProcessPage');
  }

  // AGREGAR estos métodos para el template
  getAlertIcon(): string {
    if (!this.gracePeriodInfo) return 'fa-exclamation-triangle';
    
    if (this.gracePeriodInfo.isExpired) return 'fa-times-circle';
    if (this.gracePeriodInfo.isInGracePeriod) return 'fa-clock';
    return 'fa-exclamation-triangle';
  }

  getWarningClass(): string {
    if (!this.gracePeriodInfo) return '';
    
    if (this.gracePeriodInfo.isExpired) return 'expired-warning';
    if (this.gracePeriodInfo.isInGracePeriod) return 'grace-period-warning';
    return '';
  }

  getWarningIcon(): string {
    if (!this.gracePeriodInfo) return 'fa-exclamation-circle';
    
    if (this.gracePeriodInfo.isExpired) return 'fa-times-circle';
    if (this.gracePeriodInfo.isInGracePeriod) return 'fa-exclamation-triangle';
    return 'fa-exclamation-circle';
  }

  getHoursInDay(totalHours: number): number {
    return totalHours % 24;
  }

  // MODIFICAR el método existente shouldHideProvisionalSection
  shouldHideProvisionalSection(): boolean {
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) {
      return true;
    }

    const obligatoryDocs = this.documentacionRequerida.filter(doc => doc.required === true);
    const completedObligatory = obligatoryDocs.filter(doc => doc.completed === true);
    const allObligatoryComplete = obligatoryDocs.length > 0 && completedObligatory.length === obligatoryDocs.length;

    // NUEVA LÓGICA: Actualizar mensaje cada vez que se evalúa la sección
    this.updateProvisionalMessage();

    // Si estamos en período de gracia expirado, siempre mostrar el mensaje
    if (this.gracePeriodInfo?.isExpired) {
      return false;
    }

    return allObligatoryComplete;
  }
}

// AGREGAR estos estilos CSS al final del archivo de estilos del componente
/*
.grace-period-alert {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  border: 2px solid rgba(245, 158, 11, 0.3);
}

.expired-alert {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border: 2px solid rgba(239, 68, 68, 0.3);
}

.grace-period-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.expired-warning {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.grace-period-details {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.deadline-countdown {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  min-width: 50px;
}

.countdown-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f59e0b;
  line-height: 1;
}

.countdown-label {
  font-size: 0.75rem;
  color: #d1d5db;
  margin-top: 0.25rem;
}

.deadline-text {
  flex: 1;
  font-size: 0.9rem;
  color: #f3f4f6;
  font-weight: 500;
  margin-left: 1rem;
}

.checkbox-container {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.provisional-checkbox {
  color: #f3f4f6;
}

@media (max-width: 768px) {
  .deadline-countdown {
    flex-direction: column;
    align-items: stretch;
  }
  
  .deadline-text {
    margin-left: 0;
    margin-top: 0.5rem;
    text-align: center;
  }
}
*/
