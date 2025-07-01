import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoValidationService, DocumentoValidationError } from '@core/services/documentos/documento-validation.service';
import { TipoDocumento, DocumentoUsuario } from '@core/models/documento.model';
import { CustomSelectComponent, SelectOption } from '@shared/components/custom-select/custom-select.component';
import { firstValueFrom } from 'rxjs';

interface DocumentoParaSubir {
  file: File;
  tipoDocumentoId: string;
  tipoDocumentoNombre: string;
  comentarios: string;
  progreso: number;
  estado: 'pendiente' | 'subiendo' | 'completado' | 'error';
  mensajeError?: string;
  validationWarnings: DocumentoValidationError[];
  configurado: boolean;
  nombreEstandarizado: string;
}

interface DocumentoEnSeleccion {
  file: File | null;
  tipoDocumentoId: string;
  comentarios: string;
}

@Component({
  selector: 'app-profile-document-multiple-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomSpinnerComponent,
    ReactiveFormsModule,
    FormsModule,
    CustomSelectComponent
  ],
  template: `
    <div class="multiple-upload-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">Carga Múltiple de Documentos</h2>
        <app-custom-button
          type="button"
          variant="text"
          size="small"
          (click)="cerrar()"
          class="close-button">
          <i class="fas fa-times"></i>
        </app-custom-button>
      </div>

      <div class="dialog-content">
        <p class="dialog-description">
          Selecciona un documento, asígnale un tipo y continúa agregando más documentos según necesites.
        </p>

        <!-- Selector de documento actual -->
        <div class="document-selector" *ngIf="mostrarSelectorDocumento">
          <div class="selector-section">
            <h4>Seleccionar documento</h4>
            
            <!-- Drag & Drop Area -->
            <div class="upload-area"
                 [class.dragging]="isDragging"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDropSingle($event)">
              
              <input type="file"
                     #fileInput
                     id="fileInput"
                     accept=".pdf"
                     (change)="onSingleFileSelected($event)"
                     class="visually-hidden-input">

              <div class="upload-text">
                <ng-container *ngIf="!documentoActual.file">
                  <p>Arrastra y suelta tu archivo aquí o</p>
                  <label for="fileInput"
                         class="custom-file-button"
                         [class.disabled]="uploading">
                    <i class="fas fa-folder-open"></i>
                    Seleccionar archivo
                  </label>
                  <p class="upload-hint">Formatos permitidos: PDF (Máx. 10MB)</p>
                </ng-container>

                <ng-container *ngIf="documentoActual.file">
                  <p class="file-name">{{documentoActual.file.name}}</p>
                  <p class="file-size">{{formatFileSize(documentoActual.file.size)}}</p>
                  <app-custom-button
                    type="button"
                    variant="warn"
                    size="small"
                    (click)="removeCurrentFile()">
                    <i class="fas fa-trash"></i> Eliminar
                  </app-custom-button>
                </ng-container>
              </div>
            </div>

            <!-- Configuración del documento -->
            <form #documentoForm="ngForm" *ngIf="documentoActual.file">
              <div class="tipo-documento-select">
                <label class="custom-label" id="label-tipo-documento">Tipo de documento *</label>
                <app-custom-select
                  [(ngModel)]="documentoActual.tipoDocumentoId"
                  name="tipoDocumento"
                  [options]="tiposDocumentoOptions"
                  [disabled]="uploading"
                  placeholder="Selecciona el tipo de documento"
                  id="select-tipo-documento"
                  aria-labelledby="label-tipo-documento"
                  required>
                </app-custom-select>
              </div>

              <div class="comentarios-input">
                <label class="custom-label" id="label-comentarios">Comentarios (opcional)</label>
                <input
                  class="custom-input"
                  [(ngModel)]="documentoActual.comentarios"
                  name="comentarios"
                  [disabled]="uploading"
                  placeholder="Ingrese comentarios"
                  id="input-comentarios"
                  aria-labelledby="label-comentarios">
              </div>
            </form>

            <div class="documento-actions" *ngIf="documentoActual.file">
              <app-custom-button
                type="button"
                variant="primary"
                [disabled]="!canAddCurrentDocument()"
                (click)="addCurrentDocument()">
                <i class="fas fa-plus"></i> Agregar documento
              </app-custom-button>
            </div>
          </div>
        </div>

        <!-- Lista de documentos para subir -->
        <div class="documents-queue" *ngIf="documentosParaSubir.length > 0">
          <h4>Documentos para subir ({{documentosParaSubir.length}})</h4>
          
          <div class="file-list">
            <div class="file-item" *ngFor="let doc of documentosParaSubir; let i = index">
              <div class="file-item-header">
                <div class="file-icon">
                  <i class="fas fa-file-pdf"></i>
                </div>
                <div class="file-info">
                  <p class="file-name">{{doc.nombreEstandarizado}}</p>
                  <p class="file-size">{{formatFileSize(doc.file.size)}}</p>
                  <p class="file-type">{{doc.tipoDocumentoNombre}}</p>
                </div>
                <app-custom-button
                  type="button"
                  variant="warn"
                  size="small"
                  [disabled]="uploading"
                  (click)="removeFile(i)"
                  title="Eliminar archivo">
                  <i class="fas fa-trash"></i>
                </app-custom-button>
              </div>

              <!-- Progress bar -->
              <div class="progress-container" *ngIf="doc.estado !== 'pendiente'">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="doc.progreso"></div>
                </div>
                <span class="progress-text">{{doc.progreso}}%</span>
                <span class="estado-badge" [class]="getEstadoClass(doc.estado)">
                  {{getEstadoTexto(doc.estado)}}
                </span>
              </div>

              <!-- Error message -->
              <div class="error-message" *ngIf="doc.estado === 'error' && doc.mensajeError">
                <i class="fas fa-exclamation-triangle"></i>
                {{doc.mensajeError}}
              </div>
            </div>
          </div>
        </div>

        <!-- Progress global -->
        <div class="global-progress" *ngIf="uploading">
          <h4>Progreso global</h4>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progresoGlobal"></div>
          </div>
          <span class="progress-text">{{progresoGlobal}}%</span>
        </div>

        <!-- Botones de acción -->
        <div class="dialog-actions">
          <app-custom-button
            type="button"
            variant="stroked"
            (click)="cerrar()"
            [disabled]="uploading">
            Cancelar
          </app-custom-button>

          <app-custom-button
            type="button"
            variant="primary"
            [disabled]="!canUpload() || uploading"
            (click)="uploadDocuments()"
            *ngIf="!procesoFinalizado">
            <i class="fas fa-upload"></i>
            {{uploading ? 'Subiendo...' : 'Subir documentos'}}
          </app-custom-button>

          <app-custom-button
            type="button"
            variant="primary"
            (click)="confirmarYCerrar()"
            *ngIf="procesoFinalizado">
            <i class="fas fa-check"></i>
            Cerrar
          </app-custom-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .multiple-upload-dialog {
      max-width: 800px;
      background: rgba(55, 65, 81, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f9fafb;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #f9fafb;
    }

    .dialog-content {
      padding: 0 24px 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-description {
      margin-bottom: 24px;
      color: #d1d5db;
      line-height: 1.5;
    }

    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      transition: all 0.3s ease;
      margin-bottom: 16px;
    }

    .upload-area.dragging {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }

    .custom-file-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .custom-file-button:hover:not(.disabled) {
      background: #2563eb;
      transform: translateY(-2px);
    }

    .custom-file-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      pointer-events: none;
    }

    .visually-hidden-input {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
      opacity: 0 !important;
    }

    .file-item {
      background: rgba(75, 85, 99, 0.5);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .file-item-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-icon {
      color: #ef4444;
      font-size: 24px;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .file-size, .file-type {
      font-size: 0.875rem;
      color: #d1d5db;
      margin: 0;
    }

    .progress-container {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 40px;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-badge.completado {
      background: #10b981;
      color: white;
    }

    .estado-badge.error {
      background: #ef4444;
      color: white;
    }

    .estado-badge.subiendo {
      background: #3b82f6;
      color: white;
    }

    .error-message {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 4px;
      color: #fca5a5;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #f9fafb;
    }

    .custom-input {
      width: 100%;
      padding: 12px;
      background: rgba(75, 85, 99, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #f9fafb;
      font-size: 1rem;
    }

    .custom-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tipo-documento-select,
    .comentarios-input {
      margin-bottom: 16px;
    }

    .documento-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    h4 {
      margin: 0 0 16px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #f9fafb;
    }
  `]
})
export class ProfileDocumentMultipleUploadDialogComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() documentosSubidos = new EventEmitter<any[]>();

  tiposDocumento: TipoDocumento[] = [];
  tiposDocumentoOptions: SelectOption[] = [];
  documentosParaSubir: DocumentoParaSubir[] = [];
  isDragging = false;
  uploading = false;
  progresoGlobal = 0;
  procesoFinalizado = false;
  mostrarSelectorDocumento = true;

  documentoActual: DocumentoEnSeleccion = {
    file: null,
    tipoDocumentoId: '',
    comentarios: ''
  };

  constructor(
    private dialogRef: UnifiedDialogRef<any>,
    @Inject(DIALOG_DATA) public data: any,
    private documentosService: DocumentosService,
    private documentoValidationService: DocumentoValidationService,
    private notificationService: UnifiedNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTiposDocumento();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  cargarTiposDocumento(): void {
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        this.convertirTiposAOpciones();
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
        this.notificationService.error('Error al cargar tipos de documento');
      }
    });
  }

  convertirTiposAOpciones(): void {
    this.tiposDocumentoOptions = this.tiposDocumento.map(tipo => ({
      value: tipo.id,
      label: tipo.nombre,
      disabled: false
    }));
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDropSingle(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processSingleFile(file);
    }
  }

  onSingleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processSingleFile(file);
      input.value = '';
    }
  }

  processSingleFile(file: File): void {
    // Verificar si el archivo ya está en la lista
    const isDuplicate = this.documentosParaSubir.some(doc =>
      doc.file.name === file.name && doc.file.size === file.size
    );

    if (isDuplicate) {
      this.notificationService.warning('Este archivo ya ha sido seleccionado');
      return;
    }

    // Asignar el archivo al documento actual
    this.documentoActual.file = file;

    // Intentar adivinar el tipo de documento basado en el nombre del archivo
    const tipoDocumentoId = this.adivinarTipoDocumento(file.name);
    if (tipoDocumentoId) {
      this.documentoActual.tipoDocumentoId = tipoDocumentoId;
    }
  }

  adivinarTipoDocumento(fileName: string): string {
    const nombreLower = fileName.toLowerCase();
    
    for (const tipo of this.tiposDocumento) {
      const tipoLower = tipo.nombre.toLowerCase();
      if (nombreLower.includes(tipoLower) || tipoLower.includes(nombreLower.split('.')[0])) {
        return tipo.id;
      }
    }
    
    return '';
  }

  removeCurrentFile(): void {
    this.documentoActual.file = null;
    this.documentoActual.tipoDocumentoId = '';
    this.documentoActual.comentarios = '';
  }

  canAddCurrentDocument(): boolean {
    return !!(this.documentoActual.file && this.documentoActual.tipoDocumentoId);
  }

  addCurrentDocument(): void {
    if (!this.canAddCurrentDocument()) {
      return;
    }

    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.id === this.documentoActual.tipoDocumentoId);
    if (!tipoDocumento) {
      this.notificationService.error('Tipo de documento no encontrado');
      return;
    }

    const nuevoDocumento: DocumentoParaSubir = {
      file: this.documentoActual.file!,
      tipoDocumentoId: this.documentoActual.tipoDocumentoId,
      tipoDocumentoNombre: tipoDocumento.nombre,
      comentarios: this.documentoActual.comentarios,
      progreso: 0,
      estado: 'pendiente',
      validationWarnings: [],
      configurado: true,
      nombreEstandarizado: `${tipoDocumento.nombre}.pdf`
    };

    this.documentosParaSubir.push(nuevoDocumento);

    // Limpiar el documento actual
    this.removeCurrentFile();

    this.notificationService.success('Documento agregado correctamente');
  }

  removeFile(index: number): void {
    this.documentosParaSubir.splice(index, 1);
  }

  canUpload(): boolean {
    return this.documentosParaSubir.length > 0 && 
           this.documentosParaSubir.every(doc => doc.tipoDocumentoId);
  }

  async uploadDocuments(): Promise<void> {
    if (!this.canUpload() || this.uploading) {
      return;
    }

    this.uploading = true;
    this.progresoGlobal = 0;
    this.mostrarSelectorDocumento = false;

    try {
      for (let i = 0; i < this.documentosParaSubir.length; i++) {
        const doc = this.documentosParaSubir[i];
        
        if (doc.estado === 'error') {
          continue;
        }

        doc.estado = 'subiendo';
        doc.progreso = 20;
        this.actualizarProgresoGlobal();

        try {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('tipoDocumentoId', doc.tipoDocumentoId);
          formData.append('comentarios', doc.comentarios || '');

          await firstValueFrom(this.documentosService.uploadDocumento(formData));

          doc.estado = 'completado';
          doc.progreso = 100;
          this.actualizarProgresoGlobal();

        } catch (error) {
          console.error(`Error al subir documento ${doc.nombreEstandarizado}:`, error);
          doc.estado = 'error';
          doc.mensajeError = 'Error al subir el documento';
          this.actualizarProgresoGlobal();
        }
      }

      this.finalizarProceso();

    } catch (error) {
      console.error('Error durante la carga de documentos:', error);
      this.uploading = false;
      this.mostrarSelectorDocumento = true;
      this.notificationService.error('Error inesperado durante la carga de documentos');
    }
  }

  finalizarProceso(): void {
    this.procesoFinalizado = true;
    this.uploading = false;
    this.mostrarSelectorDocumento = true;

    const documentosCompletados = this.documentosParaSubir.filter(doc => doc.estado === 'completado').length;
    const documentosConError = this.documentosParaSubir.filter(doc => doc.estado === 'error').length;

    if (documentosCompletados > 0) {
      this.notificationService.success('Documentación subida exitosamente', 'Éxito');
      // CRITICAL FIX: Eliminar emisión duplicada - uploadDocumento() ya emite automáticamente
      // this.documentosService.notificarDocumentoActualizado();
    }

    if (documentosConError > 0) {
      this.notificationService.warning(`${documentosConError} documentos tuvieron errores`);
    }
  }

  actualizarProgresoGlobal(): void {
    const documentosValidos = this.documentosParaSubir.filter(doc => doc.estado !== 'error');
    if (documentosValidos.length === 0) {
      this.progresoGlobal = 0;
      return;
    }

    const sumaProgresos = documentosValidos.reduce((sum, doc) => sum + doc.progreso, 0);
    this.progresoGlobal = Math.round(sumaProgresos / documentosValidos.length);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getEstadoClass(estado: string): string {
    return estado;
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'subiendo': 'Subiendo',
      'completado': 'Completado',
      'error': 'Error'
    };
    return estados[estado] || estado;
  }

  confirmarYCerrar(): void {
    this.documentosSubidos.emit(this.documentosParaSubir.filter(doc => doc.estado === 'completado'));
    this.dialogRef.close({ success: true, confirmed: true });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
