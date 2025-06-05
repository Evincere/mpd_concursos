import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContestStatus, ContestStatusConfig } from '@shared/interfaces/concurso/concurso.interface';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentStatusConfig {
  value: DocumentStatus;
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
  @Input() status: ContestStatus | string = 'DRAFT';
  @Input() showIcon: boolean = true;
  @Input() statusType: 'contest' | 'document' = 'contest';

  private readonly contestStatusConfigs: Record<ContestStatus, ContestStatusConfig> = {
    'ACTIVE': {
      value: 'ACTIVE',
      label: 'Activo',
      color: '#f0fdf4',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: 'fas fa-play-circle'
    },
    'DRAFT': {
      value: 'DRAFT',
      label: 'Borrador',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-edit'
    },
    'PENDING': {
      value: 'PENDING',
      label: 'Pendiente',
      color: '#fefce8',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'IN_PROGRESS': {
      value: 'IN_PROGRESS',
      label: 'En Progreso',
      color: '#eff6ff',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-clock'
    },
    'CLOSED': {
      value: 'CLOSED',
      label: 'Cerrado',
      color: '#fef2f2',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: 'fas fa-times-circle'
    },
    'CANCELLED': {
      value: 'CANCELLED',
      label: 'Cancelado',
      color: '#f9fafb',
      backgroundColor: 'rgba(107, 114, 128, 0.15)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
      icon: 'fas fa-ban'
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

  get statusConfig(): ContestStatusConfig | DocumentStatusConfig | undefined {
    if (!this.status) return undefined;
    const normalizedStatus = this.status.toUpperCase();

    if (this.statusType === 'document') {
      return this.documentStatusConfigs[normalizedStatus as DocumentStatus];
    } else {
      return this.contestStatusConfigs[normalizedStatus as ContestStatus];
    }
  }

  getStatusLabel(): string {
    return this.statusConfig?.label || this.status || 'Desconocido';
  }

  getStatusClass(): string {
    return `status-${(this.status || 'unknown').toLowerCase()}`;
  }
}
