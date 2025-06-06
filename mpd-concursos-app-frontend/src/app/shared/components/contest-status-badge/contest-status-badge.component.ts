import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContestStatus, ContestStatusConfig } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentStatusConfig {
  value: DocumentStatus;
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon?: string;
}

export interface InscriptionStatusConfig {
  value: string;
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon?: string;
}

@Component({
  selector: 'app-contest-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="contest-status-badge"
      [class]="'status-' + (status || '').toLowerCase()"
      [attr.aria-label]="getStatusLabel()"
      [title]="getStatusLabel()">
      <i *ngIf="statusConfig?.icon && showIcon" [class]="statusConfig?.icon || ''" aria-hidden="true"></i>
      {{ getStatusLabel() }}
    </span>
  `,
  styleUrls: ['./contest-status-badge.component.scss']
})
export class ContestStatusBadgeComponent {
  @Input() status: ContestStatus | InscripcionState | string = 'DRAFT';
  @Input() showIcon = true;
  @Input() statusType: 'contest' | 'document' | 'inscription' = 'contest';

  private readonly contestStatusConfigs: Record<ContestStatus, ContestStatusConfig> = {
    'DRAFT': {
      value: 'DRAFT',
      label: 'Borrador',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-edit'
    },
    'PUBLISHED': {
      value: 'PUBLISHED',
      label: 'Publicado',
      color: '#f0fdf4',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: 'fas fa-play-circle'
    },
    'PAUSED': {
      value: 'PAUSED',
      label: 'Pausado',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-pause-circle'
    },
    'CLOSED': {
      value: 'CLOSED',
      label: 'Cerrado',
      color: '#fef2f2',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: 'fas fa-times-circle'
    },
    'FINISHED': {
      value: 'FINISHED',
      label: 'Finalizado',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-check-circle'
    },
    'CANCELLED': {
      value: 'CANCELLED',
      label: 'Cancelado',
      color: '#f9fafb',
      backgroundColor: 'rgba(107, 114, 128, 0.15)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
      icon: 'fas fa-ban'
    },
    'ARCHIVED': {
      value: 'ARCHIVED',
      label: 'Archivado',
      color: '#f9fafb',
      backgroundColor: 'rgba(75, 85, 99, 0.15)',
      borderColor: 'rgba(75, 85, 99, 0.3)',
      icon: 'fas fa-archive'
    },
    // Estados específicos para postulaciones
    'PENDING_VALIDATION': {
      value: 'PENDING_VALIDATION',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'PENDING_DOCS': {
      value: 'PENDING_DOCS',
      label: 'Documentos Pendientes',
      color: '#fef3c7',
      backgroundColor: 'rgba(217, 119, 6, 0.15)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      icon: 'fas fa-file-upload'
    },
    'IN_PROGRESS': {
      value: 'IN_PROGRESS',
      label: 'En Progreso',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-spinner'
    }
  };

  private readonly documentStatusConfigs: Record<DocumentStatus, DocumentStatusConfig> = {
    'PENDING': {
      value: 'PENDING',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'APPROVED': {
      value: 'APPROVED',
      label: 'Aprobado',
      color: '#f0fdf4',
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
      icon: 'fas fa-check-circle'
    },
    'REJECTED': {
      value: 'REJECTED',
      label: 'Rechazado',
      color: '#fef2f2',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: 'fas fa-times-circle'
    }
  };

  private readonly inscriptionStatusConfigs: Record<string, InscriptionStatusConfig> = {
    'ACTIVE': {
      value: 'ACTIVE',
      label: 'En Proceso',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-spinner'
    },
    'PENDING': {
      value: 'PENDING',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'COMPLETED_WITH_DOCS': {
      value: 'COMPLETED_WITH_DOCS',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'COMPLETED_PENDING_DOCS': {
      value: 'COMPLETED_PENDING_DOCS',
      label: 'Documentos Pendientes',
      color: '#fef3c7',
      backgroundColor: 'rgba(217, 119, 6, 0.15)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      icon: 'fas fa-file-upload'
    },
    'APPROVED': {
      value: 'APPROVED',
      label: 'Aprobada',
      color: '#f0fdf4',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: 'fas fa-check-circle'
    },
    'REJECTED': {
      value: 'REJECTED',
      label: 'Rechazada',
      color: '#fef2f2',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: 'fas fa-times-circle'
    },
    'CANCELLED': {
      value: 'CANCELLED',
      label: 'Cancelada',
      color: '#f9fafb',
      backgroundColor: 'rgba(107, 114, 128, 0.15)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
      icon: 'fas fa-ban'
    },
    'FROZEN': {
      value: 'FROZEN',
      label: 'Congelada',
      color: '#f9fafb',
      backgroundColor: 'rgba(75, 85, 99, 0.15)',
      borderColor: 'rgba(75, 85, 99, 0.3)',
      icon: 'fas fa-snowflake'
    },
    // Estados legacy para compatibilidad
    'IN_PROCESS': {
      value: 'IN_PROCESS',
      label: 'En Proceso',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-spinner'
    },
    'PENDIENTE': {
      value: 'PENDIENTE',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'INSCRIPTO': {
      value: 'INSCRIPTO',
      label: 'Aprobada',
      color: '#f0fdf4',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: 'fas fa-check-circle'
    },
    'CONFIRMADA': {
      value: 'CONFIRMADA',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'PENDING_VALIDATION': {
      value: 'PENDING_VALIDATION',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'PENDING_DOCS': {
      value: 'PENDING_DOCS',
      label: 'Documentos Pendientes',
      color: '#fef3c7',
      backgroundColor: 'rgba(217, 119, 6, 0.15)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      icon: 'fas fa-file-upload'
    },
    'IN_PROGRESS': {
      value: 'IN_PROGRESS',
      label: 'En Progreso',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-spinner'
    }
  };

  get statusConfig(): ContestStatusConfig | DocumentStatusConfig | InscriptionStatusConfig | undefined {
    if (!this.status) return undefined;
    const normalizedStatus = this.status.toUpperCase();

    if (this.statusType === 'document') {
      return this.documentStatusConfigs[normalizedStatus as DocumentStatus];
    } else if (this.statusType === 'inscription') {
      return this.inscriptionStatusConfigs[normalizedStatus];
    } else {
      return this.contestStatusConfigs[normalizedStatus as ContestStatus];
    }
  }

  getStatusLabel(): string {
    const config = this.statusConfig;
    const label = config?.label || this.status || 'Desconocido';

    // Debug logging para identificar el problema
    console.log(`[ContestStatusBadge] Estado: "${this.status}", Tipo: "${this.statusType}", Config encontrada:`, config, 'Label final:', label);

    if (!config) {
      console.warn(`[ContestStatusBadge] No se encontró configuración para estado: "${this.status}" con tipo: "${this.statusType}"`);
    }

    return label;
  }

  getStatusClass(): string {
    return `status-${(this.status || 'unknown').toLowerCase()}`;
  }
}
