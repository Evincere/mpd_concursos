import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { Postulacion } from '@shared/interfaces/postulacion/postulacion.interface';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="inscription-button-container">
      <app-custom-button
        *ngIf="shouldShowButton"
        [label]="buttonText"
        [variant]="buttonVariant"
        [disabled]="isDisabled"
        [icon]="buttonIcon"
        [tooltip]="buttonTooltip"
        [class]="getButtonClasses()"
        (buttonClick)="handleClick()">
      </app-custom-button>

      <!-- Indicador de urgencia para documentos pendientes -->
      <div *ngIf="shouldShowUrgencyIndicator" class="urgency-indicator">
        <i class="fas fa-exclamation-triangle text-orange-500"></i>
        <span class="text-xs text-orange-600 font-medium">{{ getUrgencyMessage() }}</span>
      </div>

      <!-- Mensaje cuando no se puede inscribir -->
      <div *ngIf="!shouldShowButton && userPostulation" class="inscription-blocked-message">
        <i class="fas fa-ban text-gray-400"></i>
        <span class="text-sm text-gray-500 ml-2">{{ getBlockedMessage() }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./inscripcion-button.component.scss']
})
export class InscripcionButtonComponent {
  @Input() contest!: Concurso;
  @Input() userPostulation: Postulacion | null = null;
  @Output() inscripcionClick = new EventEmitter<Concurso>();
  @Output() continuarClick = new EventEmitter<Concurso>();

  // Getter para acceder al concurso
  get currentContest(): Concurso {
    return this.contest;
  }

  get shouldShowButton(): boolean {
    // No mostrar botón si hay una inscripción en estado final (cancelada, rechazada, aprobada)
    if (this.userPostulation) {
      const finalStates = ['CANCELLED', 'REJECTED', 'APPROVED'];
      if (finalStates.includes(this.userPostulation.estado)) {
        return false;
      }
    }
    return true;
  }

  get buttonText(): string {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'Retomar Inscripción';     // ✅ Documentación pendiente - permite completar
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'Ver Postulación';         // ✅ Inscripción completa - pendiente validación admin
        case 'APPROVED':
          return 'Ver Resultado';           // ✅ Proceso finalizado - mostrar resultado
        case 'REJECTED':
          return 'Ver Resultado';           // ✅ Proceso finalizado - mostrar motivos
        case 'ACTIVE':
          return 'Continuar Inscripción';   // ✅ Inscripción en proceso - permite continuar
        // Estados legacy para compatibilidad temporal
        case 'APPROVED':
          return 'Ver Resultado';           // Legacy: mapea a APPROVED
        case 'ACTIVE':
          return 'Continuar Inscripción';   // Legacy: mapea a ACTIVE
        case 'FROZEN':
          return 'Ver Estado';              // ✅ Inscripción congelada - solo visualización
        default:
          return 'Ver Postulación';
      }
    }
    return 'Inscribirse';
  }

  get buttonTooltip(): string {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'Debe completar la documentación requerida. Tiempo límite: 3 días hábiles después del cierre de inscripciones';
        case 'PENDING':
          return 'Su inscripción está completa y siendo revisada por el equipo administrativo';
        case 'COMPLETED_WITH_DOCS':
          return 'Su inscripción está completa con toda la documentación y pendiente de validación administrativa';
        case 'APPROVED':
          return 'Su inscripción ha sido aprobada. Puede ver los detalles y próximos pasos';
        case 'REJECTED':
          return 'Su inscripción fue rechazada. Puede ver los motivos y detalles';
        case 'ACTIVE':
          return 'Su inscripción está en proceso. Puede continuar completando los datos requeridos';
        // Estados legacy para compatibilidad temporal
        case 'APPROVED':
          return 'Su inscripción ha sido aprobada. Puede ver los detalles y próximos pasos';
        case 'ACTIVE':
          return 'Su inscripción está en proceso. Puede continuar completando los datos requeridos';
        case 'FROZEN':
          return 'Su inscripción fue congelada por vencimiento del plazo de documentación';
        default:
          return 'Ver el estado actual de su postulación';
      }
    }
    return 'Iniciar proceso de inscripción al concurso';
  }

  get buttonVariant(): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'warning';    // 🟡 Amarillo - Acción urgente requerida
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'secondary';  // 🔵 Azul - En revisión administrativa
        case 'APPROVED':
          return 'success';    // 🟢 Verde - Exitoso
        case 'REJECTED':
          return 'danger';     // 🔴 Rojo - Rechazado
        case 'ACTIVE':
          return 'primary';    // 🔵 Azul primario - Continuar
        // Estados legacy para compatibilidad temporal
        case 'APPROVED':
          return 'success';    // Legacy: mapea a APPROVED
        case 'ACTIVE':
          return 'primary';    // Legacy: mapea a ACTIVE
        case 'FROZEN':
          return 'danger';     // 🔴 Rojo - Estado crítico
        default:
          return 'secondary';
      }
    }
    return 'primary';
  }

  get buttonIcon(): string {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'fas fa-file-upload';    // 📄 Subir documentos
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'fas fa-eye';            // 👁️ Ver postulación
        case 'APPROVED':
          return 'fas fa-check-circle';   // ✅ Aprobado
        case 'REJECTED':
          return 'fas fa-times-circle';   // ❌ Rechazado
        case 'ACTIVE':
          return 'fas fa-play';           // ▶️ Continuar
        // Estados legacy para compatibilidad temporal
        case 'APPROVED':
          return 'fas fa-check-circle';   // Legacy: mapea a APPROVED
        case 'ACTIVE':
          return 'fas fa-play';           // Legacy: mapea a ACTIVE
        case 'FROZEN':
          return 'fas fa-snowflake';      // ❄️ Congelado
        default:
          return 'fas fa-eye';            // 👁️ Ver
      }
    }
    return 'fas fa-user-plus';            // ➕ Inscribirse
  }

  get isDisabled(): boolean {
    // Estados que permiten nuevas inscripciones
    const allowedStates = ['PUBLISHED', 'INSCRIPTION_OPEN'];
    return !allowedStates.includes(this.currentContest.status);
  }

  get shouldShowUrgencyIndicator(): boolean {
    if (!this.userPostulation) return false;

    // Mostrar indicador de urgencia para documentos pendientes
    if (this.userPostulation.estado === 'COMPLETED_PENDING_DOCS') {
      return this.isDocumentationDeadlineNear();
    }

    return false;
  }

  getButtonClasses(): string {
    const classes = ['inscription-button'];

    if (this.shouldShowUrgencyIndicator) {
      classes.push('urgent-action');
    }

    return classes.join(' ');
  }

  getUrgencyMessage(): string {
    if (this.userPostulation?.estado === 'COMPLETED_PENDING_DOCS') {
      const daysLeft = this.getDaysUntilDocumentationDeadline();
      if (daysLeft <= 1) {
        return `¡Último día para completar documentación!`;
      } else if (daysLeft <= 2) {
        return `Quedan ${daysLeft} días para completar documentación`;
      }
    }
    return '';
  }

  private isDocumentationDeadlineNear(): boolean {
    const daysLeft = this.getDaysUntilDocumentationDeadline();
    return daysLeft <= 2; // Mostrar urgencia cuando quedan 2 días o menos
  }

  private getDaysUntilDocumentationDeadline(): number {
    if (!this.currentContest.endDate) return 999;

    // Calcular deadline: 3 días hábiles después del cierre de inscripciones
    const contestEndDate = new Date(this.currentContest.endDate);
    const documentationDeadline = this.addBusinessDays(contestEndDate, 3);
    const today = new Date();

    const diffTime = documentationDeadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  private addBusinessDays(date: Date, businessDays: number): Date {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      // Si no es fin de semana (sábado = 6, domingo = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
  }

  getBlockedMessage(): string {
    if (!this.userPostulation) return '';

    switch (this.userPostulation.estado) {
      case 'CANCELLED':
        return 'No puede volver a inscribirse a un concurso donde canceló su inscripción';
      case 'REJECTED':
        return 'No puede volver a inscribirse a un concurso donde su inscripción fue rechazada';
      case 'APPROVED':
        return 'Ya tiene una inscripción aprobada para este concurso';
      default:
        return 'No puede inscribirse a este concurso';
    }
  }

  handleClick(): void {
    if (this.userPostulation?.estado === 'COMPLETED_PENDING_DOCS') {
      this.continuarClick.emit(this.currentContest);
    } else {
      this.inscripcionClick.emit(this.currentContest);
    }
  }
}