import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modelos
import { DocumentoUsuario } from '@core/models/documento.model';

@Component({
  selector: 'app-document-status-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="document-status-container">
      <!-- Estado principal del documento -->
      <div class="status-badge" [ngClass]="getStatusClass()">
        <i [class]="getStatusIcon()"></i>
        <span>{{ getStatusText() }}</span>
      </div>

      <!-- Indicadores adicionales -->
      <div class="additional-indicators" *ngIf="hasAdditionalIndicators()">
        <!-- Indicador de versión más reciente -->
        <div 
          class="indicator latest-version" 
          *ngIf="documento.isLatestVersion"
          title="Versión más reciente">
          <i class="fas fa-star"></i>
        </div>

        <!-- Indicador de duplicados -->
        <div 
          class="indicator has-duplicates" 
          *ngIf="documento.hasDuplicates"
          title="Tiene múltiples versiones">
          <i class="fas fa-copy"></i>
        </div>

        <!-- Indicador de documento archivado -->
        <div 
          class="indicator archived" 
          *ngIf="documento.isArchived"
          title="Documento archivado">
          <i class="fas fa-archive"></i>
        </div>
      </div>

      <!-- Información de fecha -->
      <div class="date-info">
        <small>{{ getDateText() }}</small>
      </div>
    </div>
  `,
  styles: [`
    .document-status-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.3s ease;

      i {
        font-size: 0.875rem;
      }

      &.pending {
        background: rgba(251, 191, 36, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      &.approved {
        background: rgba(34, 197, 94, 0.1);
        color: #10b981;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      &.rejected {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      &.processing {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      &.archived {
        background: rgba(107, 114, 128, 0.1);
        color: #6b7280;
        border: 1px solid rgba(107, 114, 128, 0.3);
      }
    }

    .additional-indicators {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 0.75rem;
      cursor: help;
      transition: all 0.3s ease;

      &.latest-version {
        background: rgba(251, 191, 36, 0.2);
        color: #f59e0b;
        border: 1px solid rgba(251, 191, 36, 0.4);

        &:hover {
          background: rgba(251, 191, 36, 0.3);
          transform: scale(1.1);
        }
      }

      &.has-duplicates {
        background: rgba(139, 69, 19, 0.2);
        color: #8b4513;
        border: 1px solid rgba(139, 69, 19, 0.4);

        &:hover {
          background: rgba(139, 69, 19, 0.3);
          transform: scale(1.1);
        }
      }

      &.archived {
        background: rgba(107, 114, 128, 0.2);
        color: #6b7280;
        border: 1px solid rgba(107, 114, 128, 0.4);

        &:hover {
          background: rgba(107, 114, 128, 0.3);
          transform: scale(1.1);
        }
      }
    }

    .date-info {
      color: #9ca3af;
      font-size: 0.75rem;
      line-height: 1.2;

      small {
        display: block;
      }
    }

    @media (max-width: 768px) {
      .document-status-container {
        align-items: center;
        text-align: center;
      }

      .additional-indicators {
        justify-content: center;
      }

      .status-badge {
        font-size: 0.8rem;
        padding: 0.2rem 0.6rem;
      }

      .indicator {
        width: 18px;
        height: 18px;
        font-size: 0.7rem;
      }
    }
  `]
})
export class DocumentStatusIndicatorComponent {
  @Input() documento!: DocumentoUsuario;

  getStatusClass(): string {
    if (this.documento.isArchived) {
      return 'archived';
    }

    switch (this.documento.estado?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'approved';
      case 'rejected':
      case 'rechazado':
        return 'rejected';
      case 'pending':
      case 'pendiente':
        return 'pending';
      case 'processing':
      case 'procesando':
        return 'processing';
      default:
        return 'pending';
    }
  }

  getStatusIcon(): string {
    if (this.documento.isArchived) {
      return 'fas fa-archive';
    }

    switch (this.documento.estado?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'fas fa-check-circle';
      case 'rejected':
      case 'rechazado':
        return 'fas fa-times-circle';
      case 'pending':
      case 'pendiente':
        return 'fas fa-clock';
      case 'processing':
      case 'procesando':
        return 'fas fa-spinner fa-spin';
      default:
        return 'fas fa-clock';
    }
  }

  getStatusText(): string {
    if (this.documento.isArchived) {
      return 'Archivado';
    }

    switch (this.documento.estado?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'Aprobado';
      case 'rejected':
      case 'rechazado':
        return 'Rechazado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'processing':
      case 'procesando':
        return 'Procesando';
      default:
        return 'Pendiente';
    }
  }

  hasAdditionalIndicators(): boolean {
    return this.documento.isLatestVersion || 
           this.documento.hasDuplicates || 
           this.documento.isArchived;
  }

  getDateText(): string {
    const fecha = new Date(this.documento.fechaCarga);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }
}
