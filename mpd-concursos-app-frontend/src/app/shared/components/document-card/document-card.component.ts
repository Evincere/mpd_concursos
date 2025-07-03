/**
 * Document Card Component
 * 
 * @description Componente reutilizable para mostrar cards de documentos
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentViewModel } from '../../../core/services/documentos/document-state-manager.service';

/**
 * Acciones disponibles en la card
 */
export interface DocumentCardAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * Configuración de la card
 */
export interface DocumentCardConfig {
  showActions: boolean;
  showProgress: boolean;
  showStatus: boolean;
  showFileInfo: boolean;
  allowPreview: boolean;
  compactMode: boolean;
  customActions?: DocumentCardAction[];
}

/**
 * Eventos emitidos por la card
 */
export interface DocumentCardEvent {
  action: string;
  documentId?: string;
  documentType: string;
  data?: any;
}

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="document-card" 
         [class.compact]="config.compactMode"
         [class.loading]="viewModel.isLoading">
      
      <!-- Header -->
      <div class="card-header">
        <div class="document-type">
          <i class="fas fa-file-pdf text-red-500 mr-2"></i>
          <span class="font-medium">{{ viewModel.tipo.nombre }}</span>
          <span *ngIf="viewModel.tipo.requerido" 
                class="required-badge ml-2">
            Requerido
          </span>
        </div>
        
        <div class="status-indicator" 
             [ngClass]="viewModel.estadoColor">
          <i [class]="viewModel.estadoIcon"></i>
          <span class="ml-1">{{ viewModel.estadoTexto }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="card-content">
        
        <!-- Document Info -->
        <div *ngIf="viewModel.documento && config.showFileInfo" 
             class="document-info">
          <div class="file-name">{{ viewModel.documento.nombreArchivo }}</div>
          <div class="file-details">
            <span class="file-size">{{ formatFileSize(viewModel.documento.tamanoArchivo) }}</span>
            <span class="file-date">{{ formatDate(viewModel.documento.fechaCarga) }}</span>
          </div>
        </div>

        <!-- No Document State -->
        <div *ngIf="!viewModel.documento" 
             class="no-document">
          <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">{{ getNoDocumentMessage() }}</p>
        </div>

        <!-- Progress Bar -->
        <div *ngIf="viewModel.isLoading && config.showProgress" 
             class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" 
                 [style.width.%]="viewModel.progress || 0"></div>
          </div>
          <span class="progress-text">{{ viewModel.progress || 0 }}%</span>
        </div>

        <!-- Description -->
        <div *ngIf="viewModel.tipo.descripcion" 
             class="description">
          {{ viewModel.tipo.descripcion }}
        </div>
      </div>

      <!-- Actions -->
      <div *ngIf="config.showActions && !viewModel.isLoading" 
           class="card-actions">
        
        <!-- Default Actions -->
        <button *ngIf="viewModel.canUpload"
                class="action-btn upload-btn"
                [disabled]="viewModel.isLoading"
                (click)="onAction('upload')">
          <i class="fas fa-upload mr-1"></i>
          {{ viewModel.documento ? 'Reemplazar' : 'Subir' }}
        </button>

        <button *ngIf="viewModel.canView"
                class="action-btn view-btn"
                (click)="onAction('view')">
          <i class="fas fa-eye mr-1"></i>
          Ver
        </button>

        <button *ngIf="viewModel.canDelete"
                class="action-btn delete-btn"
                (click)="onAction('delete')">
          <i class="fas fa-trash mr-1"></i>
          Eliminar
        </button>

        <!-- Custom Actions -->
        <button *ngFor="let action of config.customActions"
                class="action-btn custom-btn"
                [ngClass]="action.color"
                [disabled]="action.disabled"
                [title]="action.tooltip"
                (click)="onAction(action.id)">
          <i [class]="action.icon + ' mr-1'"></i>
          {{ action.label }}
        </button>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="viewModel.isLoading" 
           class="loading-overlay">
        <div class="spinner"></div>
        <span class="loading-text">Procesando...</span>
      </div>
    </div>
  `,
  styles: [`
    .document-card {
      @apply bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 transition-all duration-300;
      @apply hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:-translate-y-1;
      position: relative;
      min-height: 200px;
    }

    .document-card.compact {
      @apply p-3;
      min-height: 120px;
    }

    .document-card.loading {
      @apply pointer-events-none;
    }

    .card-header {
      @apply flex justify-between items-start mb-4;
    }

    .document-type {
      @apply flex items-center text-white font-medium;
    }

    .required-badge {
      @apply bg-orange-500 text-white text-xs px-2 py-1 rounded-full;
    }

    .status-indicator {
      @apply flex items-center text-sm font-medium;
    }

    .card-content {
      @apply mb-4;
    }

    .document-info {
      @apply bg-black/20 rounded-lg p-3 mb-3;
    }

    .file-name {
      @apply text-white font-medium truncate mb-1;
    }

    .file-details {
      @apply flex justify-between text-sm text-gray-300;
    }

    .no-document {
      @apply text-center py-6;
    }

    .progress-container {
      @apply mb-3;
    }

    .progress-bar {
      @apply w-full bg-gray-700 rounded-full h-2 mb-1;
    }

    .progress-fill {
      @apply bg-blue-500 h-2 rounded-full transition-all duration-300;
    }

    .progress-text {
      @apply text-xs text-gray-300;
    }

    .description {
      @apply text-sm text-gray-300 italic;
    }

    .card-actions {
      @apply flex flex-wrap gap-2;
    }

    .action-btn {
      @apply px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
      @apply focus:outline-none focus:ring-2 focus:ring-blue-500/50;
    }

    .upload-btn {
      @apply bg-blue-600 hover:bg-blue-700 text-white;
    }

    .view-btn {
      @apply bg-gray-600 hover:bg-gray-700 text-white;
    }

    .delete-btn {
      @apply bg-red-600 hover:bg-red-700 text-white;
    }

    .custom-btn {
      @apply bg-gray-600 hover:bg-gray-700 text-white;
    }

    .loading-overlay {
      @apply absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg;
      @apply flex flex-col items-center justify-center;
    }

    .spinner {
      @apply w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2;
    }

    .loading-text {
      @apply text-white text-sm;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .card-actions {
        @apply flex-col;
      }
      
      .action-btn {
        @apply w-full justify-center;
      }
    }
  `]
})
export class DocumentCardComponent {
  
  @Input({ required: true }) viewModel!: DocumentViewModel;
  @Input() config: DocumentCardConfig = {
    showActions: true,
    showProgress: true,
    showStatus: true,
    showFileInfo: true,
    allowPreview: true,
    compactMode: false
  };

  @Output() actionClicked = new EventEmitter<DocumentCardEvent>();

  /**
   * Maneja clicks en acciones
   */
  onAction(action: string): void {
    const event: DocumentCardEvent = {
      action,
      documentId: this.viewModel.documento?.id,
      documentType: this.viewModel.tipo.id,
      data: {
        documentType: this.viewModel.tipo,
        document: this.viewModel.documento,
        viewModel: this.viewModel
      }
    };

    this.actionClicked.emit(event);
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtiene el mensaje cuando no hay documento
   */
  getNoDocumentMessage(): string {
    if (this.viewModel.tipo.requerido) {
      return 'Documento requerido - Haga clic en "Subir" para cargar';
    }
    return 'Documento opcional - Puede cargar si lo desea';
  }
}
