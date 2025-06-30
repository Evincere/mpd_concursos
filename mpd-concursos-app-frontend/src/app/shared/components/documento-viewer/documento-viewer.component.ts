import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BASIC_DIALOG_DATA } from '@shared/services/dialog/basic-dialog.service';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { SafePipe } from '@shared/pipes/safe.pipe';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent, SafePipe],
  template: `
    <div class="documento-viewer-modal">
      <!-- Header con título y botones -->
      <div class="modal-header">
        <div class="header-content">
          <i class="fas fa-file-pdf header-icon"></i>
          <h3 class="modal-title">Visualizador de Documento</h3>
        </div>
        <div class="header-actions">
          <button class="btn-download" (click)="descargarDocumento()" title="Descargar">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-close" (click)="cerrar()" title="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Contenido del PDF -->
      <div class="modal-body">
        <div class="pdf-container" *ngIf="documentUrl">
          <iframe
            [src]="documentUrl | safe"
            class="pdf-iframe"
            frameborder="0">
          </iframe>
        </div>

        <!-- Estado de carga -->
        <div class="loading-container" *ngIf="!documentUrl && !error">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p class="loading-text">Cargando documento...</p>
        </div>

        <!-- Estado de error -->
        <div class="error-container" *ngIf="error">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p class="error-text">{{ error }}</p>
          <button class="btn-retry" (click)="cargarDocumento()">
            <i class="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      </div>

      <!-- Footer con información -->
      <div class="modal-footer">
        <div class="document-info">
          <span class="info-text">
            <i class="fas fa-info-circle"></i>
            Documento PDF - Use los controles del visor para navegar
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .documento-viewer-modal {
      display: flex;
      flex-direction: column;
      height: 90vh;
      width: 90vw;
      max-width: 1200px;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      color: white;
    }

    /* Header */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 1.5rem;
      color: #ffd700;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-download,
    .btn-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1.1rem;
    }

    .btn-download:hover {
      background: rgba(255, 215, 0, 0.2);
      color: #ffd700;
      transform: translateY(-2px);
    }

    .btn-close:hover {
      background: rgba(255, 69, 58, 0.2);
      color: #ff453a;
      transform: translateY(-2px);
    }

    /* Body */
    .modal-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.05);
    }

    .pdf-container {
      flex: 1;
      padding: 1rem;
      overflow: hidden;
    }

    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    /* Loading */
    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
    }

    .loading-spinner {
      font-size: 3rem;
      color: #ffd700;
    }

    .loading-text {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    /* Error */
    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
    }

    .error-icon {
      font-size: 3rem;
      color: #ff453a;
    }

    .error-text {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      margin: 0;
    }

    .btn-retry {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      background: rgba(255, 215, 0, 0.2);
      color: #ffd700;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
      font-weight: 500;
    }

    .btn-retry:hover {
      background: rgba(255, 215, 0, 0.3);
      transform: translateY(-2px);
    }

    /* Footer */
    .modal-footer {
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .document-info {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .info-text i {
      color: #ffd700;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .documento-viewer-modal {
        width: 95vw;
        height: 95vh;
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-title {
        font-size: 1.2rem;
      }

      .header-icon {
        font-size: 1.2rem;
      }

      .pdf-container {
        padding: 0.5rem;
      }
    }
  `]
})
export class DocumentoViewerComponent implements OnDestroy {
  documentUrl: string | null = null;
  error: string | null = null;
  private documentBlob: Blob | null = null;

  constructor(
    @Inject(BASIC_DIALOG_DATA) private data: { documentoId: string },
    private documentosService: DocumentosService
  ) {
    this.cargarDocumento();
  }

  cargarDocumento(): void {
    this.error = null;
    this.documentUrl = null;

    if (!this.data.documentoId) {
      this.error = 'No se proporcionó ID de documento';
      return;
    }

    // Usar el servicio para obtener el archivo como blob y crear URL
    this.documentosService.getDocumentoFile(this.data.documentoId).subscribe({
      next: (response) => {
        try {
          // Verificar si la respuesta es un Blob directamente
          if (response instanceof Blob) {
            this.documentBlob = response;
            this.documentUrl = URL.createObjectURL(response);
          } else {
            this.error = 'El formato del documento no es válido';
          }
        } catch (error) {
          console.error('Error al procesar el documento:', error);
          this.error = 'Error al procesar el documento';
        }
      },
      error: (error) => {
        console.error('Error al cargar el documento:', error);
        this.error = 'Error al cargar el documento. Verifique su conexión e intente nuevamente.';
      }
    });
  }

  descargarDocumento(): void {
    if (!this.documentBlob) {
      console.warn('No hay documento disponible para descargar');
      return;
    }

    try {
      // Crear un enlace temporal para la descarga
      const link = document.createElement('a');
      link.href = URL.createObjectURL(this.documentBlob);
      link.download = `documento_${this.data.documentoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar la URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      console.error('Error al descargar el documento:', error);
    }
  }

  cerrar(): void {
    // Limpiar la URL del objeto para liberar memoria
    if (this.documentUrl) {
      URL.revokeObjectURL(this.documentUrl);
    }

    // Cerrar el modal usando el método global del BasicDialogService
    const backdrop = document.querySelector('.basic-dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  ngOnDestroy(): void {
    // Limpiar la URL del objeto al destruir el componente
    if (this.documentUrl) {
      URL.revokeObjectURL(this.documentUrl);
    }
  }
}
