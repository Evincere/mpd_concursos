import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Custom Components
import { CustomDialogRef, CUSTOM_DIALOG_DATA } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { HttpEventType, HttpResponse, HttpDownloadProgressEvent, HttpEvent } from '@angular/common/http';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    CustomButtonComponent,
    CustomSpinnerComponent
  ],
  template: `
    <div class="documento-viewer-content">
      <div class="viewer-header">
        <h2>
          <i class="fas" [ngClass]="{'fa-file-pdf': documentType === 'pdf' || documentType === 'unknown', 'fa-image': documentType === 'image'}" aria-hidden="true"></i>
          Visor de {{ documentType === 'pdf' ? 'PDF' : documentType === 'image' ? 'Imagen' : 'Documento' }}
        </h2>
        <div class="viewer-actions">
          <app-custom-button
            variant="flat"
            color="primary"
            icon="download"
            [tooltip]="'Descargar documento PDF'"
            [disabled]="!pdfLoaded || !!error"
            (buttonClick)="descargarDocumento()">
          </app-custom-button>
          <app-custom-button
            variant="stroked"
            icon="times"
            [tooltip]="'Cerrar visor'"
            (buttonClick)="cerrarVisor()">
          </app-custom-button>
        </div>
      </div>

      <div class="viewer-toolbar" *ngIf="pdfLoaded && !error">
        <div class="toolbar-section">
          <app-custom-button
            variant="icon"
            icon="search-minus"
            [tooltip]="'Reducir zoom'"
            [disabled]="zoom <= 0.5"
            (buttonClick)="zoomOut()">
          </app-custom-button>
          <span class="zoom-value">{{ (zoom * 100).toFixed(0) }}%</span>
          <app-custom-button
            variant="icon"
            icon="search-plus"
            [tooltip]="'Ampliar zoom'"
            [disabled]="zoom >= 3"
            (buttonClick)="zoomIn()">
          </app-custom-button>
          <app-custom-button
            variant="icon"
            icon="expand-arrows-alt"
            [tooltip]="'Restablecer zoom (100%)'"
            [disabled]="zoom === 1"
            (buttonClick)="resetZoom()">
          </app-custom-button>
        </div>

        <div class="toolbar-section">
          <app-custom-button
            variant="icon"
            icon="undo-alt"
            [tooltip]="'Rotar 90° a la izquierda'"
            (buttonClick)="rotateCounterClockwise()">
          </app-custom-button>
          <app-custom-button
            variant="icon"
            icon="redo-alt"
            [tooltip]="'Rotar 90° a la derecha'"
            (buttonClick)="rotateClockwise()">
          </app-custom-button>
          <app-custom-button
            variant="icon"
            icon="external-link-alt"
            [tooltip]="'Abrir en nueva ventana'"
            (buttonClick)="abrirEnNuevaVentana()">
          </app-custom-button>
        </div>

        <div class="toolbar-section" *ngIf="totalPages > 1">
          <app-custom-button
            variant="icon"
            icon="chevron-left"
            [tooltip]="'Página anterior'"
            [disabled]="currentPage === 1"
            (buttonClick)="prevPage()">
          </app-custom-button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <app-custom-button
            variant="icon"
            icon="chevron-right"
            [tooltip]="'Página siguiente'"
            [disabled]="currentPage === totalPages"
            (buttonClick)="nextPage()">
          </app-custom-button>
        </div>
      </div>

      <div class="dialog-content">
        <div class="viewer-container">
          <!-- Estado de carga -->
          <div *ngIf="isLoading" class="loading-container">
            <div class="loading-content">
              <app-custom-spinner *ngIf="!showProgress || loadProgress === 0" [size]="'large'"></app-custom-spinner>
              <div *ngIf="showProgress && loadProgress > 0" class="progress-container">
                <div class="custom-progress-bar">
                  <div class="progress-fill" [style.width.%]="loadProgress"></div>
                </div>
                <p class="progress-text">
                  <i class="fas fa-file-pdf" aria-hidden="true"></i>
                  Cargando documento: {{ loadProgress }}%
                  <span *ngIf="fileSize > 0" class="file-size">
                    ({{ (loadedSize / 1024 / 1024).toFixed(2) }} MB / {{ (fileSize / 1024 / 1024).toFixed(2) }} MB)
                  </span>
                </p>
              </div>
              <p *ngIf="!showProgress || loadProgress === 0" class="loading-text">
                <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                Preparando visor de documentos...
              </p>
            </div>
          </div>

          <!-- Documento cargado -->
          <div *ngIf="!isLoading && pdfLoaded && !error" class="document-container">
            <!-- Visor de PDF -->
            <div *ngIf="documentType === 'pdf'" class="pdf-container">
              <div class="pdf-status" *ngIf="pdfSrc">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                <span>PDF cargado correctamente</span>
              </div>
              <pdf-viewer
                [src]="pdfSrc"
                [render-text]="true"
                [original-size]="false"
                [show-all]="false"
                [zoom]="zoom"
                [rotation]="rotation"
                [page]="currentPage"
                [fit-to-page]="true"
                (after-load-complete)="onPdfLoaded($event)"
                (error)="onPdfError($event)"
                (page-rendered)="onPageRendered($event)"
                style="width: 100%; height: 100%; display: block;"
              ></pdf-viewer>
            </div>

            <!-- Visor de imágenes -->
            <div *ngIf="documentType === 'image'" class="image-container">
              <div class="image-status">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                <span>Imagen cargada correctamente</span>
              </div>
              <img [src]="imageUrl" [style.transform]="'rotate(' + rotation + 'deg) scale(' + zoom + ')'" alt="Documento" />
            </div>
          </div>

          <!-- Estado de error -->
          <div *ngIf="!isLoading && error" class="error-container">
            <div class="error-content">
              <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
              <h3>Error al cargar el documento</h3>
              <p>{{ error }}</p>
              <div class="error-details" *ngIf="debugInfo">
                <details>
                  <summary>Información técnica</summary>
                  <pre>{{ debugInfo }}</pre>
                </details>
              </div>
              <app-custom-button
                variant="flat"
                color="primary"
                icon="sync-alt"
                label="Reintentar carga"
                (buttonClick)="cargarDocumento()">
              </app-custom-button>
            </div>
          </div>

          <!-- Estado vacío (sin documento) -->
          <div *ngIf="!isLoading && !pdfLoaded && !error" class="empty-container">
            <div class="empty-content">
              <i class="fas fa-file-pdf" aria-hidden="true"></i>
              <h3>Preparando visor</h3>
              <p>El documento se está preparando para la visualización...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .documento-viewer-content {
      display: flex;
      flex-direction: column;
      height: 95vh;
      width: 100%;
      overflow: hidden;
      /* Remove dialog-specific styles since we're inside a dialog */
      background: transparent;
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      /* Simplified header for dialog content */
      background: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;

      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
        color: #f9fafb;
        font-weight: 600;
        font-size: 1.1rem;

        i {
          color: #3b82f6;
          font-size: 1.2rem;
        }
      }

      .viewer-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .viewer-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      /* Glassmorphism toolbar */
      background: rgba(75, 85, 99, 0.8);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);

      .toolbar-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .zoom-value, .page-info {
        font-size: 0.9rem;
        min-width: 70px;
        text-align: center;
        color: #d1d5db;
        font-weight: 500;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }

    .dialog-content {
      flex: 1;
      padding: 0;
      margin: 0;
      overflow: hidden;
      position: relative;
      min-height: 80vh;
    }

    .viewer-container {
      height: 100%;
      width: 100%;
      position: relative;
      /* Simplified background for dialog content */
      background: rgba(31, 41, 55, 0.3);
      border-radius: 8px;
      min-height: 80vh;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        max-width: 500px;
        width: 100%;
      }

      .loading-text {
        color: #f9fafb;
        margin: 0;
        font-size: 1.1rem;
        text-align: center;
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          color: #3b82f6;
          font-size: 1.2rem;
        }
      }

      .progress-container {
        width: 100%;

        .custom-progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(75, 85, 99, 0.4);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            border-radius: 8px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
          }
        }

        .progress-text {
          text-align: center;
          margin: 0;
          font-size: 1rem;
          color: #d1d5db;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;

          i {
            color: #3b82f6;
          }

          .file-size {
            font-size: 0.9rem;
            color: #9ca3af;
            margin-left: 0.5rem;
          }
        }
      }
    }

    .document-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      /* Simplified document background */
      background: rgba(17, 24, 39, 0.2);
      border-radius: 8px;
      min-height: 75vh;
    }

    .pdf-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      padding: 0.5rem;
      background: transparent;
      position: relative;
      min-height: 70vh;

      .pdf-status {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

        i {
          font-size: 1rem;
        }
      }

      ::ng-deep .ng2-pdf-viewer-container {
        background: rgba(255, 255, 255, 0.98) !important;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
      }

      ::ng-deep .pdfViewer {
        padding: 1rem !important;
      }

      ::ng-deep .pdfViewer .page {
        margin: 1rem auto !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
        border-radius: 8px !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }

      ::ng-deep .pdfViewer .textLayer {
        opacity: 0.8;
      }
    }

    .image-container {
      height: 100%;
      width: 100%;
      overflow: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      position: relative;

      .image-status {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center center;
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 3rem;

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        text-align: center;
        max-width: 500px;

        i {
          font-size: 4rem;
          color: #ef4444;
          opacity: 0.9;
          animation: pulse 2s infinite;
        }

        h3 {
          color: #f9fafb;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        p {
          color: #d1d5db;
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .error-details {
          width: 100%;
          margin-top: 1rem;

          details {
            background: rgba(75, 85, 99, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;

            summary {
              color: #9ca3af;
              cursor: pointer;
              font-size: 0.9rem;
              font-weight: 500;
              margin-bottom: 0.5rem;

              &:hover {
                color: #d1d5db;
              }
            }

            pre {
              color: #f3f4f6;
              font-size: 0.8rem;
              background: rgba(17, 24, 39, 0.5);
              padding: 0.75rem;
              border-radius: 4px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
              margin: 0;
            }
          }
        }
      }
    }

    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 3rem;

      .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        text-align: center;

        i {
          font-size: 4rem;
          color: #6b7280;
          opacity: 0.7;
        }

        h3 {
          color: #f9fafb;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        p {
          color: #9ca3af;
          margin: 0;
          font-size: 1rem;
          line-height: 1.6;
        }
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
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

  // Propiedades para debugging
  debugInfo: string | null = null;

  constructor(
    private documentosService: DocumentosService,
    private sanitizer: DomSanitizer,
    public dialogRef: CustomDialogRef<DocumentoViewerComponent>,
    @Inject(CUSTOM_DIALOG_DATA) public data: { documentoId: string }
  ) {}

  ngOnInit(): void {
    this.cargarDocumento();
  }

  cargarDocumento(): void {
    this.isLoading = true;
    this.error = null;
    this.debugInfo = null;
    this.pdfLoaded = false;
    this.showProgress = true;
    this.loadProgress = 0;
    this.fileSize = 0;
    this.loadedSize = 0;

    this.documentosService.getDocumentoFile(this.data.documentoId, true)
      .pipe(
        finalize(() => {
          this.isLoading = false; // Always set isLoading to false when the observable completes
          this.showProgress = false;
        })
      )
      .subscribe({
        next: (response: Blob | HttpEvent<Blob>) => {
          // Si es un Blob directo (sin progreso)
          if (response instanceof Blob) {
            this.procesarBlob(response);
            return;
          }

          // Si es un HttpEvent (con progreso)
          const event = response as HttpEvent<Blob>;
          if (event.type === HttpEventType.DownloadProgress) {
            const progressEvent = event as HttpDownloadProgressEvent;
            if (progressEvent.total) {
              this.fileSize = progressEvent.total;
              this.loadedSize = progressEvent.loaded;
              this.loadProgress = Math.round(100 * progressEvent.loaded / progressEvent.total);
            }
          } else if (event.type === HttpEventType.Response) {
            const responseEvent = event as HttpResponse<Blob>;
            if (responseEvent.body) {
              const blob = responseEvent.body;
              this.procesarBlob(blob);
            } else {
              this.error = 'El servidor no devolvió un archivo válido.';
              this.debugInfo = 'HttpResponse.body es null';
            }
          }
        },
        error: (error) => {
          console.error('[DocumentoViewer] Error al cargar el documento:', error);
          this.error = 'No se pudo cargar el documento. Por favor, intente nuevamente.';
          this.debugInfo = `Error: ${error.message || error}\nURL: ${this.documentosService['apiUrl']}/${this.data.documentoId}/file`;
        }
      });
  }

  private procesarBlob(blob: Blob): void {
    this.documentType = this.determineDocumentType(blob.type);
    this.blobUrl = URL.createObjectURL(blob); // Create object URL for download/new tab

    if (this.documentType === 'pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          this.pdfSrc = new Uint8Array(reader.result);
          this.pdfLoaded = true;
          this.debugInfo = `PDF procesado correctamente\nTamaño: ${blob.size} bytes\nTipo MIME: ${blob.type}\nArrayBuffer: ${this.pdfSrc.length} bytes`;
        } else {
          console.error('[DocumentoViewer] FileReader result es null o no es ArrayBuffer');
          this.error = 'Error al procesar el documento PDF: no se pudo leer el archivo.';
          this.debugInfo = 'FileReader.result es null o no es un ArrayBuffer';
        }
      };
      reader.onerror = (error) => {
        console.error('[DocumentoViewer] Error en FileReader:', error);
        this.error = 'Error al leer el archivo PDF.';
        this.debugInfo = `Error en FileReader: ${error}`;
      };
      reader.readAsArrayBuffer(blob);
    } else if (this.documentType === 'image') {
      // Procesar como imagen
      this.imageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
      this.pdfLoaded = true; // Usamos la misma variable para indicar que el documento está listo
      this.debugInfo = `Imagen procesada correctamente\nTamaño: ${blob.size} bytes\nTipo MIME: ${blob.type}`;
    } else {
      // Tipo desconocido
      console.error('[DocumentoViewer] Tipo de documento no soportado:', blob.type);
      this.error = 'Tipo de documento no soportado. Solo se pueden visualizar archivos PDF e imágenes.';
      this.debugInfo = `Tipo MIME no soportado: ${blob.type}\nTamaño: ${blob.size} bytes`;
    }
  }

  private determineDocumentType(mimeType: string): 'pdf' | 'image' | 'unknown' {
    if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else {
      return 'unknown';
    }
  }

  // Método para manejar cuando se carga el PDF
  onPdfLoaded(pdf: any): void { // `pdf` is typically the PDFDocumentProxy object
    this.totalPages = pdf.numPages || 1;
    this.pdfLoaded = true; // Confirm PDF is loaded
    this.isLoading = false; // Ensure loading is false
    this.error = null; // Clear any previous errors related to loading
    this.debugInfo = `PDF cargado exitosamente. Páginas: ${this.totalPages}`;
  }

  // Método para manejar errores del PDF
  onPdfError(error: unknown): void {
    console.error('[DocumentoViewer] Error en el visor de PDF:', error);
    this.error = 'Error al mostrar el documento PDF. El archivo podría estar corrupto o no ser un PDF válido.';
    this.debugInfo = `Error del visor PDF: ${JSON.stringify(error)}`; // Stringify for better debugging
    this.pdfLoaded = false;
    this.isLoading = false;
  }

  // Método para manejar cuando se renderiza una página
  onPageRendered(_event: unknown): void {
    // console.log('[DocumentoViewer] Página renderizada:', _event);
  }

  descargarDocumento(): void {
    if (this.blobUrl) {
      // Si ya tenemos el blob, usarlo directamente
      const a = document.createElement('a');
      a.href = this.blobUrl;
      // Intenta obtener un nombre de archivo más significativo
      const filename = `documento-${this.data.documentoId}.${this.documentType === 'pdf' ? 'pdf' : 'png'}`; // Default to png for images
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Si no tenemos el blob, solicitarlo nuevamente (sin seguimiento de progreso para descarga)
      this.documentosService.getDocumentoFile(this.data.documentoId, false).subscribe({
        next: (response: Blob | HttpEvent<Blob>) => {
          let blob: Blob;

          // Si es un Blob directo
          if (response instanceof Blob) {
            blob = response;
          } else {
            // Si es un HttpEvent, extraer el blob de la respuesta
            const event = response as HttpEvent<Blob>;
            if (event.type === HttpEventType.Response) {
              const responseEvent = event as HttpResponse<Blob>;
              if (responseEvent.body) {
                blob = responseEvent.body;
              } else {
                console.error('Error: HttpResponse.body es null');
                return;
              }
            } else {
              // Si no es una respuesta completa, ignorar
              return;
            }
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const filename = `documento-${this.data.documentoId}.${this.determineDocumentType(blob.type) === 'pdf' ? 'pdf' : 'png'}`;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error) => {
          console.error('Error al descargar el documento:', error);
          // show a notification here as well
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
    if (this.zoom < 3) {
      this.zoom = Math.min(3, this.zoom + 0.25);
    }
  }

  zoomOut(): void {
    if (this.zoom > 0.5) {
      this.zoom = Math.max(0.5, this.zoom - 0.25);
    }
  }

  resetZoom(): void {
    this.zoom = 1;
  }

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
