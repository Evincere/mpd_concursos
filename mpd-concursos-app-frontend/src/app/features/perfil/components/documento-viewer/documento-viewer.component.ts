import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { HttpEventType, HttpResponse, HttpDownloadProgressEvent } from '@angular/common/http';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatSliderModule,
    MatProgressBarModule,
    FormsModule,
    PdfViewerModule
  ],
  template: `
    <div class="documento-viewer-dialog">
      <div class="viewer-header">
        <h2 mat-dialog-title>
          <i class="fas" [ngClass]="{'fa-file-pdf': documentType === 'pdf' || documentType === 'unknown', 'fa-image': documentType === 'image'}"></i>
          Visor de {{ documentType === 'pdf' ? 'PDF' : documentType === 'image' ? 'Imagen' : 'Documento' }}
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

      <div class="viewer-toolbar" *ngIf="pdfLoaded">
        <div class="toolbar-section">
          <button mat-icon-button (click)="zoomOut()" matTooltip="Reducir">
            <i class="fas fa-search-minus"></i>
          </button>
          <span class="zoom-value">{{ zoom * 100 }}%</span>
          <button mat-icon-button (click)="zoomIn()" matTooltip="Ampliar">
            <i class="fas fa-search-plus"></i>
          </button>
          <button mat-icon-button (click)="resetZoom()" matTooltip="Restablecer zoom">
            <i class="fas fa-undo"></i>
          </button>
        </div>

        <div class="toolbar-section">
          <button mat-icon-button (click)="rotateCounterClockwise()" matTooltip="Rotar a la izquierda">
            <i class="fas fa-undo"></i>
          </button>
          <button mat-icon-button (click)="rotateClockwise()" matTooltip="Rotar a la derecha">
            <i class="fas fa-redo"></i>
          </button>
        </div>

        <div class="toolbar-section" *ngIf="totalPages > 1">
          <button mat-icon-button (click)="prevPage()" [disabled]="currentPage === 1" matTooltip="Página anterior">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button mat-icon-button (click)="nextPage()" [disabled]="currentPage === totalPages" matTooltip="Página siguiente">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <mat-dialog-content>
        <div class="viewer-container">
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner *ngIf="!showProgress || loadProgress === 0" diameter="50"></mat-spinner>
            <div *ngIf="showProgress && loadProgress > 0" class="progress-container">
              <mat-progress-bar [value]="loadProgress" color="primary"></mat-progress-bar>
              <p class="progress-text">
                Cargando documento: {{ loadProgress }}%
                <span *ngIf="fileSize > 0">
                  ({{ (loadedSize / 1024 / 1024).toFixed(2) }} MB / {{ (fileSize / 1024 / 1024).toFixed(2) }} MB)
                </span>
              </p>
            </div>
            <p *ngIf="!showProgress || loadProgress === 0">Cargando documento...</p>
          </div>

          <div *ngIf="!isLoading && pdfLoaded" class="document-container">
            <!-- Visor de PDF -->
            <div *ngIf="documentType === 'pdf'" class="pdf-container">
              <pdf-viewer
                [src]="pdfSrc"
                [render-text]="true"
                [original-size]="originalSize"
                [show-all]="showAll"
                [zoom]="zoom"
                [rotation]="rotation"
                [page]="currentPage"
                (after-load-complete)="onPdfLoaded($event)"
                style="width: 100%; height: 100%;"
              ></pdf-viewer>
            </div>

            <!-- Visor de imágenes -->
            <div *ngIf="documentType === 'image'" class="image-container">
              <img [src]="imageUrl" [style.transform]="'rotate(' + rotation + 'deg) scale(' + zoom + ')'" alt="Documento" />
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

    .viewer-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background-color: #f5f5f5;
      border-bottom: 1px solid var(--card-border);

      .toolbar-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .zoom-value, .page-info {
        font-size: 0.9rem;
        min-width: 60px;
        text-align: center;
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
      background-color: #f5f5f5;
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

      .progress-container {
        width: 80%;
        max-width: 500px;

        .progress-text {
          text-align: center;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
      }
    }

    .document-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      background-color: #f5f5f5;
    }

    .pdf-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      background-color: #f5f5f5;

      ::ng-deep .ng2-pdf-viewer-container {
        background-color: #f5f5f5 !important;
      }
    }

    .image-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease;
        transform-origin: center center;
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

  // Propiedades para el visor de PDF
  pdfSrc: Uint8Array | undefined = undefined;
  zoom = 1;
  rotation = 0;
  originalSize = true;
  showAll = true;
  currentPage = 1;
  totalPages = 0;

  // Propiedades para el progreso de carga
  loadProgress = 0;
  showProgress = false;
  fileSize = 0;
  loadedSize = 0;

  // Propiedades para el tipo de documento
  documentType: 'pdf' | 'image' | 'unknown' = 'unknown';
  imageUrl: SafeResourceUrl | null = null;

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
    this.showProgress = true;
    this.loadProgress = 0;
    this.fileSize = 0;
    this.loadedSize = 0;

    this.documentosService.getDocumentoFile(this.data.documentoId, true)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.showProgress = false;
        })
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.DownloadProgress) {
            // Actualizar el progreso de la descarga
            // Verificar si es un evento de progreso de descarga
            const progressEvent = event as unknown as HttpDownloadProgressEvent;
            if (progressEvent.total) {
              this.fileSize = progressEvent.total;
              this.loadedSize = progressEvent.loaded;
              this.loadProgress = Math.round(100 * progressEvent.loaded / progressEvent.total);
            }
          } else if (event.type === HttpEventType.Response) {
            // Verificar si es un evento de respuesta completa
            const responseEvent = event as unknown as HttpResponse<Blob>;
            const blob = responseEvent.body;

            // Crear URL para el blob (para descarga y apertura en nueva ventana)
            this.blobUrl = blob ? URL.createObjectURL(blob) : '';

            // Detectar el tipo de documento
            this.documentType = blob ? this.detectDocumentType(blob) : 'unknown';

            if (this.documentType === 'pdf') {
              // Procesar como PDF
              this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);

              // Convertir blob a ArrayBuffer para el visor de PDF
              const reader = new FileReader();
              reader.onload = () => {
                if (reader.result) {
                  this.pdfSrc = new Uint8Array(reader.result as ArrayBuffer);
                  this.pdfLoaded = true;
                } else {
                  this.error = 'Error al procesar el documento PDF.';
                }
              };
              if (blob) {
                reader.readAsArrayBuffer(blob);
              } else {
                this.error = 'Error al procesar el documento PDF: archivo no disponible.';
              }
            } else if (this.documentType === 'image') {
              // Procesar como imagen
              this.imageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
              this.pdfLoaded = true; // Usamos la misma variable para indicar que el documento está listo
            } else {
              // Tipo desconocido
              this.error = 'Tipo de documento no soportado. Solo se pueden visualizar archivos PDF e imágenes.';
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar el documento:', error);
          this.error = 'No se pudo cargar el documento. Por favor, intente nuevamente.';
        }
      });
  }

  // Método para manejar cuando se carga el PDF
  onPdfLoaded(pdf: unknown): void {
    if (pdf && typeof pdf === 'object' && 'numPages' in pdf) {
      this.totalPages = (pdf as { numPages: number }).numPages;
    } else {
      this.totalPages = 1; // Valor predeterminado si no se puede determinar
    }
  }

  // Método para detectar el tipo de documento
  detectDocumentType(blob: Blob): 'pdf' | 'image' | 'unknown' {
    const mimeType = blob.type.toLowerCase();

    if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else {
      return 'unknown';
    }
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
          // Asegurarse de que blob es un Blob válido
          const validBlob = blob instanceof Blob ? blob : new Blob([]);
          const url = window.URL.createObjectURL(validBlob);
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

  // Métodos para controlar el zoom
  zoomIn(): void {
    this.zoom += 0.25;
  }

  zoomOut(): void {
    if (this.zoom > 0.5) {
      this.zoom -= 0.25;
    }
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  // Métodos para controlar la rotación
  rotateClockwise(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  rotateCounterClockwise(): void {
    this.rotation = (this.rotation - 90) % 360;
    if (this.rotation < 0) {
      this.rotation += 360;
    }
  }

  // Métodos para la navegación de páginas
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
