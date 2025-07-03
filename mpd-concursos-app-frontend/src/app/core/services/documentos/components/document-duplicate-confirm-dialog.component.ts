import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Servicios y modelos
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { BasicDialogService } from '@shared/services/dialog/basic-dialog.service';
import { DocumentoUsuario } from '../../../models/documento.model';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

interface DialogData {
  existingDocument: DocumentoUsuario;
  newFile: File;
  message: string;
}

@Component({
  selector: 'app-document-duplicate-confirm-dialog',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="duplicate-confirm-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <i class="fas fa-exclamation-triangle warning-icon" aria-hidden="true"></i>
          <h2>Documento Duplicado Detectado</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <div class="warning-message">
          <p>{{ data.message }}</p>
        </div>

        <!-- Comparación de documentos -->
        <div class="document-comparison">
          <div class="document-info existing">
            <h3><i class="fas fa-file-alt"></i> Documento Actual</h3>
            <div class="document-details">
              <p><strong>Tipo:</strong> {{ data.existingDocument.tipoDocumento?.nombre }}</p>
              <p><strong>Archivo:</strong> {{ data.existingDocument.nombreArchivo }}</p>
              <p><strong>Fecha de carga:</strong> {{ formatDate(data.existingDocument.fechaCarga) }}</p>
              <p><strong>Estado:</strong>
                <span [class]="'status-' + data.existingDocument.estado?.toLowerCase()">
                  {{ getEstadoTexto(data.existingDocument.estado) }}
                </span>
              </p>
            </div>
          </div>

          <div class="arrow-separator">
            <i class="fas fa-arrow-right"></i>
          </div>

          <div class="document-info new">
            <h3><i class="fas fa-file-upload"></i> Nuevo Documento</h3>
            <div class="document-details">
              <p><strong>Archivo:</strong> {{ data.newFile.name }}</p>
              <p><strong>Tamaño:</strong> {{ formatFileSize(data.newFile.size) }}</p>
              <p><strong>Tipo:</strong> {{ data.newFile.type }}</p>
              <p><strong>Última modificación:</strong> {{ formatDate(data.newFile.lastModified) }}</p>
            </div>
          </div>
        </div>

        <!-- Advertencia -->
        <div class="replacement-warning">
          <i class="fas fa-info-circle"></i>
          <div class="warning-text">
            <p><strong>¿Qué sucederá si continúas?</strong></p>
            <ul>
              <li>El documento actual será archivado (no eliminado)</li>
              <li>El nuevo documento se convertirá en la versión activa</li>
              <li>Podrás acceder al historial de versiones desde tu perfil</li>
              <li>Los administradores verán el cambio en el registro de auditoría</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <app-custom-button
          type="button"
          variant="stroked"
          size="medium"
          (click)="cancel()">
          <i class="fas fa-times"></i>
          Cancelar
        </app-custom-button>

        <app-custom-button
          type="button"
          variant="flat"
          size="medium"
          class="replace-button"
          (click)="confirm()">
          <i class="fas fa-exchange-alt"></i>
          Reemplazar Documento
        </app-custom-button>
      </div>
    </div>
  `,
  styles: [`
    .duplicate-confirm-dialog {
      max-width: 700px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      border-radius: 12px 12px 0 0;

      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .warning-icon {
          font-size: 1.5rem;
          color: #fef3c7;
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
      }
    }

    .dialog-content {
      padding: 2rem;
      background: #1f2937;
      color: #f9fafb;
    }

    .warning-message {
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;

      p {
        margin: 0;
        font-size: 1rem;
        color: #fbbf24;
        text-align: center;
      }
    }

    .document-comparison {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .document-info {
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &.existing {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
      }

      &.new {
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.3);
      }

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          font-size: 1.1rem;
        }
      }

      .document-details {
        p {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          line-height: 1.4;

          strong {
            color: #d1d5db;
          }
        }
      }
    }

    .arrow-separator {
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: #6b7280;
      }
    }

    .status-pending { color: #fbbf24; }
    .status-approved { color: #10b981; }
    .status-rejected { color: #ef4444; }

    .replacement-warning {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;

      i {
        font-size: 1.25rem;
        color: #3b82f6;
        margin-top: 0.25rem;
      }

      .warning-text {
        flex: 1;

        p {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: #3b82f6;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;

          li {
            margin: 0.5rem 0;
            font-size: 0.875rem;
            line-height: 1.4;
            color: #d1d5db;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(75, 85, 99, 0.8);
      border-radius: 0 0 12px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .replace-button {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
      }
    }

    @media (max-width: 768px) {
      .document-comparison {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .arrow-separator {
        transform: rotate(90deg);
      }
    }
  `]
})
export class DocumentDuplicateConfirmDialogComponent {

  private userAction: 'confirm' | 'cancel' | null = null;

  constructor(
    public dialogRef: UnifiedDialogRef<{ confirmed: boolean }>,
    @Inject(DIALOG_DATA) public data: DialogData,
    private basicDialogService: BasicDialogService
  ) {}

  confirm(): void {
    console.log('[DocumentDuplicateConfirm] 🔄 Usuario confirmó reemplazo');
    this.userAction = 'confirm';

    // Guardar la decisión en sessionStorage para que el servicio la pueda leer
    sessionStorage.setItem('duplicateDialogAction', 'confirm');

    // Pequeño delay para asegurar que se escriba el sessionStorage
    setTimeout(() => {
      // Usar el mismo mecanismo que la cruz que sí funciona
      this.basicDialogService.closeAll();
    }, 50);
  }

  cancel(): void {
    console.log('[DocumentDuplicateConfirm] 🔄 Usuario canceló reemplazo');
    this.userAction = 'cancel';

    // Guardar la decisión en sessionStorage para que el servicio la pueda leer
    sessionStorage.setItem('duplicateDialogAction', 'cancel');

    // Pequeño delay para asegurar que se escriba el sessionStorage
    setTimeout(() => {
      // Usar el mismo mecanismo que la cruz que sí funciona
      this.basicDialogService.closeAll();
    }, 50);
  }

  formatDate(date: Date | number): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getEstadoTexto(estado: string | undefined): string {
    switch (estado?.toUpperCase()) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return 'Desconocido';
    }
  }
}
