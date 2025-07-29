import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';

/**
 * Componente para mostrar badges de estado de inscripción
 * con colores y estilos apropiados para cada estado
 */
@Component({
  selector: 'app-inscription-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="inscription-status-badge"
      [class]="getBadgeClass()"
      [title]="getTooltipText()">
      <i [class]="getIconClass()"></i>
      {{ getDisplayText() }}
    </span>
  `,
  styleUrls: ['./inscription-status-badge.component.scss']
})
export class InscriptionStatusBadgeComponent {
  @Input() state!: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showIcon: boolean = true;

  /**
   * Obtiene la clase CSS apropiada para el badge según el estado
   */
  getBadgeClass(): string {
    const baseClass = `badge-${this.size}`;
    const stateClass = this.getStateClass();
    return `${baseClass} ${stateClass}`;
  }

  /**
   * Obtiene la clase CSS específica del estado
   */
  private getStateClass(): string {
    switch (this.state) {
      case 'ACTIVE':
        return 'badge-active';
      case 'PENDING':
        return 'badge-pending';
      case 'COMPLETED_WITH_DOCS':
        return 'badge-completed-docs';
      case 'COMPLETED_PENDING_DOCS':
        return 'badge-completed-pending';
      case 'FROZEN':
        return 'badge-frozen';
      case 'APPROVED':
        return 'badge-approved';
      case 'REJECTED':
        return 'badge-rejected';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-unknown';
    }
  }

  /**
   * Obtiene el icono apropiado para el estado
   */
  getIconClass(): string {
    if (!this.showIcon) return '';

    switch (this.state) {
      case 'ACTIVE':
        return 'fas fa-edit';
      case 'PENDING':
        return 'fas fa-clock';
      case 'COMPLETED_WITH_DOCS':
        return 'fas fa-check-circle';
      case 'COMPLETED_PENDING_DOCS':
        return 'fas fa-exclamation-triangle';
      case 'FROZEN':
        return 'fas fa-snowflake';
      case 'APPROVED':
        return 'fas fa-thumbs-up';
      case 'REJECTED':
        return 'fas fa-thumbs-down';
      case 'CANCELLED':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  }

  /**
   * Obtiene el texto a mostrar en el badge
   */
  getDisplayText(): string {
    switch (this.state) {
      case 'ACTIVE':
        return 'En Proceso';
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED_WITH_DOCS':
        return 'Completa con Docs';
      case 'COMPLETED_PENDING_DOCS':
        return 'Docs Pendientes';
      case 'FROZEN':
        return 'Congelada';
      case 'APPROVED':
        return 'Aprobada';
      case 'REJECTED':
        return 'Rechazada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el texto del tooltip con información adicional
   */
  getTooltipText(): string {
    switch (this.state) {
      case 'ACTIVE':
        return 'Inscripción en proceso. El usuario puede cargar documentos y completar la inscripción.';
      case 'PENDING':
        return 'Inscripción enviada, pendiente de revisión administrativa.';
      case 'COMPLETED_WITH_DOCS':
        return 'Inscripción completada con toda la documentación. Lista para revisión administrativa.';
      case 'COMPLETED_PENDING_DOCS':
        return 'Inscripción completada pero con documentos pendientes. El usuario tiene plazo para completar.';
      case 'FROZEN':
        return 'Inscripción congelada por vencimiento del plazo de documentación.';
      case 'APPROVED':
        return 'Inscripción aprobada por el administrador. Estado final.';
      case 'REJECTED':
        return 'Inscripción rechazada por el administrador. Estado final.';
      case 'CANCELLED':
        return 'Inscripción cancelada por el usuario. Estado final.';
      default:
        return 'Estado desconocido';
    }
  }
}
