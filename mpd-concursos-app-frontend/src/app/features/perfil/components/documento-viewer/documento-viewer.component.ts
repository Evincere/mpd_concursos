import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="documento-viewer-dialog">
      <div class="viewer-header">
        <h2 mat-dialog-title>
          <i class="fas fa-file-pdf"></i>
          Visor de Documento
        </h2>
        <div class="viewer-actions">
          <button mat-icon-button (click)="descargarDocumento()" matTooltip="Descargar documento">
            <i class="fas fa-download"></i>
          </button>
          <button mat-icon-button (click)="cerrarVisor()" matTooltip="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <mat-dialog-content>
        <div class="viewer-container">
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando documento...</p>
          </div>

          <div *ngIf="!isLoading && pdfLoaded" class="pdf-preview-container">
            <div class="pdf-preview-message">
              <i class="fas fa-file-pdf pdf-icon"></i>
              <h3>Documento PDF listo</h3>
              <p>Por razones de seguridad, no se puede mostrar el PDF directamente en esta ventana.</p>
              <div class="action-buttons">
                <button mat-raised-button color="primary" (click)="descargarDocumento()">
                  <i class="fas fa-download"></i>
                  Descargar PDF
                </button>
                <button mat-raised-button (click)="abrirEnNuevaVentana()" *ngIf="pdfUrl">
                  <i class="fas fa-external-link-alt"></i>
                  Abrir en nueva ventana
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="!isLoading && !pdfLoaded && error" class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ error }}</p>
            <button mat-raised-button color="primary" (click)="cargarDocumento()">
              <i class="fas fa-sync-alt"></i>
              Reintentar
            </button>
          </div>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .documento-viewer-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--card-border);

      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;

        i {
          color: var(--primary-color);
        }
      }

      .viewer-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    mat-dialog-content {
      flex: 1;
      padding: 0 !important;
      margin: 0 !important;
      max-height: none !important;
      overflow: hidden !important;
    }

    .viewer-container {
      height: 100%;
      width: 100%;
      position: relative;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;

      p {
        color: var(--text-color);
        margin: 0;
      }
    }

    .pdf-preview-container {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
    }

    .pdf-preview-message {
      text-align: center;
      padding: 2rem;
      max-width: 500px;

      .pdf-icon {
        font-size: 4rem;
        color: #e53935;
        margin-bottom: 1rem;
      }

      h3 {
        margin-bottom: 1rem;
        color: var(--primary-color);
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.5rem;
      }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      padding: 2rem;
      text-align: center;

      i {
        font-size: 3rem;
        color: var(--color-error);
      }

      p {
        color: var(--text-color);
        margin: 0;
        font-size: 1.1rem;
      }
    }
  `]
})
export class DocumentoViewerComponent implements OnInit {
  isLoading = true;
  pdfUrl: SafeResourceUrl | null = null;
  pdfLoaded = false;
  error: string | null = null;
  blobUrl: string | null = null;

  constructor(
    private documentosService: DocumentosService,
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<DocumentoViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { documentoId: string }
  ) {}

  ngOnInit(): void {
    this.cargarDocumento();
  }

  cargarDocumento(): void {
    this.isLoading = true;
    this.error = null;

    this.documentosService.getDocumentoFile(this.data.documentoId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (blob) => {
          // Crear URL para el blob
          this.blobUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
          this.pdfLoaded = true;
        },
        error: (error) => {
          console.error('Error al cargar el documento:', error);
          this.error = 'No se pudo cargar el documento. Por favor, intente nuevamente.';
        }
      });
  }

  descargarDocumento(): void {
    if (this.blobUrl) {
      // Si ya tenemos el blob, usarlo directamente
      const a = document.createElement('a');
      a.href = this.blobUrl;
      a.download = `documento-${this.data.documentoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Si no tenemos el blob, solicitarlo nuevamente
      this.documentosService.getDocumentoFile(this.data.documentoId).subscribe({
        next: (blob) => {
          // Crear un enlace temporal para la descarga
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `documento-${this.data.documentoId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error) => {
          console.error('Error al descargar el documento:', error);
        }
      });
    }
  }

  abrirEnNuevaVentana(): void {
    if (this.blobUrl) {
      window.open(this.blobUrl, '_blank');
    }
  }

  cerrarVisor(): void {
    // Liberar recursos
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    this.dialogRef.close();
  }
}
