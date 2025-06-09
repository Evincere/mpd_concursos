import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { ContestStatus, ContestStatusConfig } from '@shared/interfaces/concurso/concurso.interface';

@Injectable({
  providedIn: 'root'
})
export class ContestStatusService {

  private readonly statusConfigs: Record<ContestStatus, ContestStatusConfig> = {
    'ACTIVE': {
      value: 'ACTIVE',
      label: 'Activo',
      color: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: 'fas fa-play-circle'
    },
    'DRAFT': {
      value: 'DRAFT',
      label: 'Borrador',
      color: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-edit'
    },
    'PENDING': {
      value: 'PENDING',
      label: 'Pendiente',
      color: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: 'fas fa-clock'
    },
    'IN_PROGRESS': {
      value: 'IN_PROGRESS',
      label: 'En Progreso',
      color: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: 'fas fa-clock'
    },
    'CLOSED': {
      value: 'CLOSED',
      label: 'Cerrado',
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: 'fas fa-times-circle'
    },
    'CANCELLED': {
      value: 'CANCELLED',
      label: 'Cancelado',
      color: '#6b7280',
      backgroundColor: 'rgba(107, 114, 128, 0.15)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
      icon: 'fas fa-ban'
    }
  };

  /**
   * Get configuration for a specific contest status
   */
  getStatusConfig(status: ContestStatus | string): ContestStatusConfig | undefined {
    const normalizedStatus = status?.toUpperCase() as ContestStatus;
    return this.statusConfigs[normalizedStatus];
  }

  /**
   * Get the Spanish label for a contest status
   */
  getStatusLabel(status: ContestStatus | string): string {
    const config = this.getStatusConfig(status);
    return config?.label || status?.toString() || 'Desconocido';
  }

  /**
   * Get all available status configurations
   */
  getAllStatusConfigs(): ContestStatusConfig[] {
    return Object.values(this.statusConfigs);
  }

  /**
   * Get status options for dropdowns/selects
   */
  getStatusOptions(): { value: ContestStatus; label: string }[] {
    return Object.values(this.statusConfigs).map(config => ({
      value: config.value,
      label: config.label
    }));
  }

  /**
   * Check if a status is valid
   */
  isValidStatus(status: string): status is ContestStatus {
    return Object.keys(this.statusConfigs).includes(status.toUpperCase());
  }

  /**
   * Get CSS class name for a status
   */
  getStatusClass(status: ContestStatus | string): string {
    const normalizedStatus = status?.toLowerCase();
    return `status-${normalizedStatus || 'unknown'}`;
  }

  /**
   * Get semantic color information for a status
   */
  getStatusColors(status: ContestStatus | string): {
    primary: string;
    background: string;
    border: string;
  } {
    const config = this.getStatusConfig(status);
    return {
      primary: config?.color || '#6b7280',
      background: config?.backgroundColor || 'rgba(107, 114, 128, 0.15)',
      border: config?.borderColor || 'rgba(107, 114, 128, 0.3)'
    };
  }

  /**
   * Check if a status represents an active/open contest
   * CORRECCIÓN INMEDIATA: PUBLISHED también permite inscripciones
   */
  isActiveStatus(status: ContestStatus | string): boolean {
    const upperStatus = status?.toUpperCase();
    return upperStatus === 'ACTIVE' || upperStatus === 'PUBLISHED';
  }

  /**
   * Check if a status represents a closed/finished contest
   */
  isClosedStatus(status: ContestStatus | string): boolean {
    const upperStatus = status?.toUpperCase();
    return upperStatus === 'CLOSED' || upperStatus === 'CANCELLED';
  }

  /**
   * Check if a status represents a contest in progress
   */
  isInProgressStatus(status: ContestStatus | string): boolean {
    return status?.toUpperCase() === 'IN_PROGRESS';
  }

  /**
   * Check if a status represents a draft contest
   */
  isDraftStatus(status: ContestStatus | string): boolean {
    return status?.toUpperCase() === 'DRAFT';
  }
}
