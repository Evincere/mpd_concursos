import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { BasicDialogService } from '@shared/services/dialog/basic-dialog.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { DocumentManagerService } from '@core/services/documentos/document-manager.service';
import { ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoValidationService, DocumentoValidationError } from  '@core/services/documentos/documento-validation.service';
import { TipoDocumento, DocumentoUsuario, EstadoColaDocumento, EstadoProcesamiento } from '@core/models/documento.model';
import { of } from   'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CustomSelectComponent, SelectOption } from '@shared/components/custom-select/custom-select.component';
import { isArray, safeGet, safeArrayMethod, safeLength } from '@shared/utils/safe-access.utils';

interface DocumentoParaSubir {
  file: File;
  tipoDocumentoId: string;
  tipoDocumentoNombre: string;
  comentarios: string;
  progreso: number;
  estado: 'pendiente' | 'subiendo' | 'procesando' | 'completado' | 'error';
  mensajeError?: string;
  validationWarnings: DocumentoValidationError[];
  queueId?: string;
  documentoId?: string;
  configurado: boolean; // Indica si el documento ya tiene asignado un tipo y está listo para subir
  nombreEstandarizado: string; // Nombre estandarizado para mostrar en la interfaz: {tipo_documento}.pdf
}

// Interfaz para el documento en proceso de selección
interface DocumentoEnSeleccion {
  file: File | null;
  tipoDocumentoId: string;
  comentarios: string;
}

@Component({
  selector: 'app-documento-multiple-upload-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <!-- Cruz interna removida - se usa la cruz externa del diálogo principal -->
      </div>

      <div class="dialog-content">
        <p class="dialog-description">
          Selecciona un documento, asígnale un tipo y continúa agregando más documentos según necesites.
        </p>

        <!-- Mensaje informativo cuando todos los documentos requeridos están completos -->
        <div class="info-message" *ngIf="mensajeOptativos">
          <i class="fas fa-check-circle info-icon"></i>
          <div class="info-text">
            <h3>{{mensajeOptativos}}</h3>
          </div>
        </div>

        <!-- Mensaje cuando no hay opciones disponibles -->
        <div class="no-options-message" *ngIf="tiposDocumentoOptions.length === 0 && !uploading && tiposDocumento.length > 0">
          <i class="fas fa-info-circle"></i>
          <p>No hay tipos de documentos disponibles para subir. Todos los documentos requeridos ya han sido subidos.</p>
        </div>

        <!-- Mensaje de error de carga con botón de reintento -->
        <div class="error-message" *ngIf="tiposDocumento.length === 0 && !uploading">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="error-content">
            <p>No se pudieron cargar los tipos de documento. Esto puede deberse a un problema de conexión o sesión expirada.</p>
            <app-custom-button
              type="button"
              variant="primary"
              size="small"
              (click)="reintentarCarga()">
              <i class="fas fa-refresh"></i>
              Reintentar
            </app-custom-button>
          </div>
        </div>

        <!-- Selector de documento actual -->
        <div class="documento-actual-container" *ngIf="mostrarSelectorDocumento && tiposDocumentoOptions.length > 0 && !todosDocumentosRequeridosCompletos">
          <h3>Seleccionar documento</h3>

          <!-- Área de selección de archivo -->
          <div class="file-upload-container"
               [class.has-file]="documentoActual.file !== null"
               [class.drag-over]="isDragging"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDropSingle($event)">

            <div class="upload-icon">
              <i class="fas" [class]="'fa-' + (documentoActual.file ? getFileIcon(documentoActual.file) : 'cloud-upload-alt')"></i>
            </div>

            <div class="upload-text">
              <ng-container *ngIf="!documentoActual.file">
                <p>Arrastra y suelta tu archivo aquí o</p>
                <label for="fileInput"
                       class="custom-file-button"
                       [class.disabled]="uploading || fileInputActive">
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

            <input type="file"
                   id="fileInput"
                   #fileInput
                   class="visually-hidden-input"
                   accept=".pdf"
                   [disabled]="uploading || fileInputActive"
                   (change)="onSingleFileSelected($event)"
                   tabindex="-1">
          </div>

          <!-- Configuración del documento actual -->
          <div class="documento-config" *ngIf="documentoActual.file">
            <form #documentoForm="ngForm">
              <div class="tipo-documento-select">
                <label class="custom-label" id="label-tipo-documento">Tipo de documento</label>
                <app-custom-select
                  [options]="tiposDocumentoOptions"
                  [(ngModel)]="documentoActual.tipoDocumentoId"
                  name="tipoDocumentoId"
                  [disabled]="uploading"
                  placeholder="Seleccionar tipo de documento"
                  aria-labelledby="label-tipo-documento">
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

            <div class="documento-actions">
              <app-custom-button
                type="button"
                variant="primary"
                [disabled]="!canAddCurrentDocument()"
                (click)="addCurrentDocument()">
                <i class="fas fa-plus"></i> Agregar documento
              </app-custom-button>
            </div>
          </div>

          <!-- Nueva función para advertencia inteligente -->
          <div class="hint-message" *ngIf="esTipoGenericoSeleccionado()">
            <i class="fas fa-info-circle"></i>
            Puedes subir tantos documentos genéricos como necesites. Recuerda: los documentos obligatorios deben subirse en su tipo correspondiente, no como genéricos.
          </div>
        </div>

        <!-- Lista de documentos configurados -->
        <div class="selected-files-container" *ngIf="documentosParaSubir.length > 0">
          <h3>Documentos seleccionados ({{documentosParaSubir.length}})</h3>

          <!-- Progreso global -->
          <div class="global-progress" *ngIf="uploading">
            <p>Progreso global: {{progresoGlobal}}%</p>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progresoGlobal"></div>
            </div>
          </div>

          <div class="file-list">
            <div class="file-item" *ngFor="let doc of documentosParaSubir; let i = index">
              <div class="file-item-header">
                <div class="file-icon">
                  <i class="fas" [class]="'fa-' + getFileIcon(doc.file)"></i>
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

              

              <!-- Advertencias de validación -->
              <div class="validation-warnings" *ngIf="doc.validationWarnings && doc.validationWarnings.length > 0">
                <p class="warning-title">Advertencias:</p>
                <ul>
                  <li *ngFor="let warning of doc.validationWarnings">
                    <i class="fas fa-exclamation-triangle"></i> {{warning.message}}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <app-custom-button
          type="button"
          variant="text"
          (click)="cancelarYCerrar()"
          class="cancel-button">
          <i class="fas fa-times"></i>
          Cancelar
        </app-custom-button>

        <app-custom-button
          type="button"
          variant="primary"
          [disabled]="!canUpload() || operationInProgress"
          (click)="uploadDocuments()"
          class="upload-button">
          <i class="fas fa-cloud-upload-alt"></i>
          Subir {{documentosParaSubir.length}} documento(s)
        </app-custom-button>
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

    .close-button {
      padding: 8px;
      min-width: auto;
    }

    .dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-description {
      margin-bottom: 1rem;
      color: #d1d5db;
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      background: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4caf50;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .info-icon {
      color: #4caf50;
      margin-right: 12px;
      font-size: 24px;
    }

    .info-text h3 {
      margin: 0 0 8px 0;
      color: #4caf50;
      font-size: 16px;
      font-weight: 500;
    }

    .info-text p {
      margin: 0 0 12px 0;
      color: #d1d5db;
      font-size: 14px;
      line-height: 1.4;
    }

    .profile-link {
      margin-top: 12px;
    }

    .documento-actual-container {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .documento-actual-container h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: #f9fafb;
    }

    .documento-config {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .documento-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .file-type {
      margin: 0;
      font-size: 0.9rem;
      color: #4caf50;
      font-weight: 500;
    }

    .no-options-message {
      display: flex;
      align-items: center;
      background: rgba(59, 130, 246, 0.1);
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .no-options-message i {
      color: #3b82f6;
      margin-right: 12px;
      font-size: 20px;
    }

    .no-options-message p {
      margin: 0;
      color: #d1d5db;
    }

    .error-message {
      display: flex;
      align-items: flex-start;
      background: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .error-message i {
      color: #ef4444;
      margin-right: 12px;
      font-size: 20px;
      margin-top: 2px;
    }

    .error-content {
      flex: 1;
    }

    .error-content p {
      margin: 0 0 12px 0;
      color: #d1d5db;
      font-size: 14px;
      line-height: 1.4;
    }

    .file-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 2rem;
      transition: all 0.3s ease;
      background: rgba(0, 0, 0, 0.2);
      text-align: center;
      min-height: 200px;
      margin-bottom: 1.5rem;
    }

    .file-upload-container.drag-over {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }

    .file-upload-container.has-file {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }

    .upload-icon {
      margin-bottom: 1rem;
    }

    .upload-icon i {
      font-size: 3rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .upload-hint {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #d1d5db;
    }

    .file-name {
      margin: 0;
      font-weight: 500;
      color: #f9fafb;
      word-break: break-all;
    }

    .file-size {
      margin: 0;
      font-size: 0.85rem;
      color: #d1d5db;
    }

    .selected-files-container {
      margin-top: 1.5rem;
    }

    .selected-files-container h3 {
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: #f9fafb;
    }

    .global-progress {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .global-progress p {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #d1d5db;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-fill.error {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .file-item {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .file-item:hover {
      background: rgba(0, 0, 0, 0.3);
      transform: translateY(-1px);
    }

    .file-item-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }

    .file-icon {
      margin-right: 1rem;
    }

    .file-icon i {
      font-size: 2rem;
      color: #d1d5db;
    }

    .file-info {
      flex: 1;
    }

    .file-config {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .tipo-documento-select {
      flex: 2;
    }

    .comentarios-input {
      flex: 3;
    }

    .custom-label {
      display: block;
      margin-bottom: 10px;
      color: #f9fafb;
      font-size: 14px;
      font-weight: 500;
    }

    .custom-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(75, 85, 99, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #f9fafb;
      font-size: 16px;
      transition: all 0.3s ease;
      height: 52px;
      box-sizing: border-box;
    }

    .custom-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .custom-input::placeholder {
      color: #d1d5db;
    }

    .custom-input:disabled {
      opacity: 0.6;
      background: rgba(75, 85, 99, 0.4);
      cursor: not-allowed;
    }

    .file-progress {
      margin-top: 0.5rem;
    }

    .progress-status {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.85rem;
    }

    .progress-status span {
      display: flex;
      align-items: center;
    }

    .progress-status i {
      font-size: 16px;
      margin-right: 4px;
    }

    .estado-validando {
      color: #f59e0b;
    }

    .estado-subiendo {
      color: #3b82f6;
    }

    .estado-completado {
      color: #10b981;
    }

    .estado-error {
      color: #ef4444;
    }

    .error-message {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #ef4444;
    }

    /* ===== REDESIGNED DIALOG ACTIONS ===== */
    .dialog-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .cancel-button {
      /* Always visible cancel button */
      min-width: 120px;
      transition: all 0.3s ease;
    }

    .upload-button {
      /* Primary upload action button */
      min-width: 180px;
      transition: all 0.3s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.success-state {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
        }
      }
    }

    .validation-warnings {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 8px;
      border-left: 3px solid #f59e0b;
    }

    .warning-title {
      margin: 0 0 0.5rem;
      font-weight: 500;
      color: #f59e0b;
      font-size: 0.9rem;
    }

    .validation-warnings ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .validation-warnings li {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      color: #d1d5db;
      margin-bottom: 0.25rem;
    }

    .validation-warnings i {
      font-size: 16px;
      margin-right: 4px;
      color: #f59e0b;
    }

    .custom-file-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: rgba(59, 130, 246, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      outline: none;
      text-decoration: none;
      user-select: none;
    }

    .custom-file-button:hover:not(.disabled):not(:disabled) {
      background: rgba(59, 130, 246, 1);
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .custom-file-button:active:not(.disabled):not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
    }

    .custom-file-button.disabled,
    .custom-file-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      pointer-events: none;
    }

    .custom-file-button i {
      font-size: 16px;
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
  `]
})
export class DocumentoMultipleUploadDialogComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentoForm') documentoForm: NgForm | null = null;
  @Output() documentosSubidos = new EventEmitter<any[]>();

  tiposDocumento: TipoDocumento[] = [];
  tiposDocumentoOptions: SelectOption[] = [];
  documentosParaSubir: DocumentoParaSubir[] = [];
  isDragging = false;
  uploading = false;
  progresoGlobal = 0;
  operationInProgress = false; // Use a single flag to disable buttons
  fileInputActive = false; // Bandera para evitar múltiples activaciones del selector de archivos

  // Documentos requeridos y ya subidos
  documentosRequeridos: TipoDocumento[] = [];
  documentosUsuario: DocumentoUsuario[] = [];
  documentosFaltantes: TipoDocumento[] = [];
  todosDocumentosRequeridosCompletos = false;

  // Nuevo sistema de selección secuencial
  documentoActual: DocumentoEnSeleccion = {
    file: null,
    tipoDocumentoId: '',
    comentarios: ''
  };
  mostrarSelectorDocumento = true; // Controla si se muestra el selector de documentos

  // Nuevo sistema de mensajes
  mensajeOptativos = '';

  constructor(
    private dialogRef: UnifiedDialogRef<any>,
    @Inject(DIALOG_DATA) public data: any,
    private documentosService: DocumentosService,
    private documentoValidationService: DocumentoValidationService,
    private notificationService: UnifiedNotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private basicDialogService: BasicDialogService,
    private documentManager: DocumentManagerService
  ) {
    console.log('[DocumentoMultipleUpload] 🚧 Constructor ejecutado');
  }

  ngOnInit(): void {
    // Inicialización robusta: cargar tipos y documentos, luego calcular estado
    this.cargarTiposYDocumentos();
  }

  /**
   * Carga ambos: tipos de documento y documentos del usuario, y luego calcula el estado real
   */
  private cargarTiposYDocumentos(): void {
    console.log('[DocumentoMultipleUpload] 📋 Iniciando carga de tipos y documentos...');

    this.tiposDocumento = [];
    this.documentosUsuario = [];
    this.documentosFaltantes = [];
    this.tiposDocumentoOptions = [];
    this.mostrarSelectorDocumento = false;
    this.todosDocumentosRequeridosCompletos = false;

    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        console.log('[DocumentoMultipleUpload] ✅ Tipos de documento cargados:', tipos.length);
        this.tiposDocumento = tipos;
        this.documentosRequeridos = tipos.filter(tipo => tipo.requerido);
        this.documentosService.getDocumentosUsuario().subscribe({
          next: (documentos) => {
            console.log('[DocumentoMultipleUpload] ✅ Documentos del usuario cargados:', documentos.length);
            this.documentosUsuario = documentos;
            this.calcularDocumentosFaltantes();
            this.cdr.markForCheck();
          },
          error: () => {
            console.error('[DocumentoMultipleUpload] ❌ Error cargando documentos del usuario');
            this.mostrarError('Error al cargar tus documentos');
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        console.error('[DocumentoMultipleUpload] ❌ Error cargando tipos de documento');
        this.mostrarError('Error al cargar los tipos de documento');
        this.cdr.markForCheck();
      }
    });
  }

  calcularDocumentosFaltantes(): void {
    // Faltantes requeridos
    const requeridosFaltantes = this.tiposDocumento.filter(tipo => tipo.requerido && !this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipo.id));
    // Faltantes opcionales
    const opcionalesFaltantes = this.tiposDocumento.filter(tipo => !tipo.requerido && !this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipo.id));

    this.documentosFaltantes = [...requeridosFaltantes, ...opcionalesFaltantes];

    // Opciones para el select
    this.convertirTiposAOpciones();

    // Mensaje de estado y control de UI según contexto de perfil
    if (requeridosFaltantes.length === 0 && opcionalesFaltantes.length > 0) {
      // Solo faltan optativos: mostrar mensaje informativo y permitir subir optativos
      this.mostrarSelectorDocumento = true;
      this.todosDocumentosRequeridosCompletos = false;
      this.mensajeOptativos = '¡Documentación obligatoria completa! Puedes seguir subiendo documentación adicional optativa.';
    } else if (requeridosFaltantes.length === 0 && opcionalesFaltantes.length === 0) {
      // Todo completo: mostrar mensaje final
      this.mostrarSelectorDocumento = false;
      this.todosDocumentosRequeridosCompletos = true;
      this.mensajeOptativos = '';
    } else {
      // Faltan requeridos
      this.mostrarSelectorDocumento = true;
      this.todosDocumentosRequeridosCompletos = false;
      this.mensajeOptativos = '';
    }
  }

  reintentarCarga(): void {
    console.log('[DocumentoMultipleUpload] 🔄 Reintentando carga de tipos de documento...');
    this.cargarTiposYDocumentos();
  }

  ngOnDestroy(): void {
    console.log('[DocumentoMultipleUpload] 🔥 Componente destruido (ngOnDestroy)');
    console.log('[DocumentoMultipleUpload] 🧹 Limpiando recursos en ngOnDestroy');
  }

  convertirTiposAOpciones(): void {
    // Obtener los tipos de documento ya seleccionados en la sesión actual
    const tiposSeleccionados = this.documentosParaSubir.map(doc => doc.tipoDocumentoId);

    // Permitir múltiples documentos genéricos: no filtrar el tipo genérico
    this.tiposDocumentoOptions = this.documentosFaltantes
      .filter(tipo => {
        // Si es genérico, siempre permitir seleccionarlo
        if (tipo.nombre.toLowerCase().includes('genérico') || tipo.nombre.toLowerCase().includes('generico')) {
          return true;
        }
        // Para los demás, filtrar si ya están seleccionados
        return !tiposSeleccionados.includes(tipo.id);
      })
      .map(tipo => ({
        value: tipo.id,
        label: tipo.requerido ? `${tipo.nombre} (Requerido)` : tipo.nombre
      }))
      .sort((a, b) => {
        // Ordenar: primero los requeridos, luego los opcionales
        const aEsRequerido = a.label.includes('(Requerido)');
        const bEsRequerido = b.label.includes('(Requerido)');
        if (aEsRequerido && !bEsRequerido) return -1;
        if (!aEsRequerido && bEsRequerido) return 1;
        return a.label.localeCompare(b.label);
      });

    // Si no quedan opciones disponibles, ocultar el selector
    if (this.tiposDocumentoOptions.length === 0) {
      this.mostrarSelectorDocumento = false;
    } else {
      this.mostrarSelectorDocumento = true;
    }
  }

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
      // Tomar solo el primer archivo
      const file = event.dataTransfer.files[0];
      this.processSingleFile(file);
    }
  }

  onSingleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Tomar solo el primer archivo
      const file = input.files[0];
      this.processSingleFile(file);
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      input.value = '';
    }
  }

  processSingleFile(file: File): void {
    // Verificar si el archivo ya está en la lista
    const isDuplicate = this.documentosParaSubir.some(doc =>
      doc.file.name === file.name && doc.file.size === file.size
    );

    if (isDuplicate) {
      this.mostrarAdvertencia('Este archivo ya ha sido seleccionado');
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

  removeCurrentFile(): void {
    this.documentoActual.file = null;
    this.documentoActual.tipoDocumentoId = '';
    this.documentoActual.comentarios = '';
  }

  canAddCurrentDocument(): boolean {
    return this.documentoActual.file !== null &&
           this.documentoActual.tipoDocumentoId !== '';
  }

  addCurrentDocument(): void {
    if (!this.canAddCurrentDocument()) {
      return;
    }

    // Obtener el nombre del tipo de documento
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.id === this.documentoActual.tipoDocumentoId);

    if (!tipoDocumento) {
      this.mostrarError('Tipo de documento no encontrado');
      return;
    }

    // Advertencia inteligente: si es genérico y el nombre coincide con un obligatorio
    if ((tipoDocumento.nombre.toLowerCase().includes('genérico') || tipoDocumento.nombre.toLowerCase().includes('generico')) && this.coincideConObligatorio(this.documentoActual.file?.name || '')) {
      this.mostrarAdvertencia('Este archivo parece corresponder a un documento obligatorio. Por favor, súbelo en la categoría correspondiente.');
    }

    // Crear un nuevo documento para subir
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
    this.actualizarTiposDocumentoDisponibles();
    this.resetDocumentoActual();
    this.mostrarExito('Documento agregado correctamente');
  }

  resetDocumentoActual(): void {
    this.documentoActual = {
      file: null,
      tipoDocumentoId: '',
      comentarios: ''
    };
  }

  actualizarTiposDocumentoDisponibles(): void {
    // Recalcular los tipos de documento disponibles
    this.calcularDocumentosFaltantes();

    // Si no quedan tipos de documento disponibles, ocultar el selector
    if (this.tiposDocumentoOptions.length === 0) {
      this.mostrarSelectorDocumento = false;
    }
  }

  onDrop(event: DragEvent): void {
    // Mantener este método para compatibilidad, pero redirigir al nuevo método
    this.onDropSingle(event);
  }

  onFilesSelected(event: Event): void {
    // Mantener este método para compatibilidad, pero redirigir al nuevo método
    this.onSingleFileSelected(event);
  }

  adivinarTipoDocumento(fileName: string): string {
    // Convertir a minúsculas para facilitar la comparación
    const lowerFileName = fileName.toLowerCase();

    // Buscar coincidencias en los nombres de los tipos de documento
    for (const tipo of this.tiposDocumento) {
      const nombreTipo = tipo.nombre.toLowerCase();
      if (lowerFileName.includes(nombreTipo)) {
        return tipo.id;
      }
    }

    // Reglas específicas basadas en patrones comunes
    if (lowerFileName.includes('dni') || lowerFileName.includes('documento')) {
      const dniTipo = this.tiposDocumento.find(t => t.nombre.toLowerCase().includes('dni'));
      return dniTipo?.id || '';
    }

    if (lowerFileName.includes('curriculum') || lowerFileName.includes('cv')) {
      const cvTipo = this.tiposDocumento.find(t =>
        t.nombre.toLowerCase().includes('curriculum') ||
        t.nombre.toLowerCase().includes('cv')
      );
      return cvTipo?.id || '';
    }

    if (lowerFileName.includes('titulo') || lowerFileName.includes('diploma')) {
      const tituloTipo = this.tiposDocumento.find(t =>
        t.nombre.toLowerCase().includes('titulo') ||
        t.nombre.toLowerCase().includes('diploma')
      );
      return tituloTipo?.id || '';
    }

    // Si no se encuentra coincidencia, devolver vacío
    return '';
  }

  onTipoDocumentoChange(index: number, tipoDocumentoId: string): void {
    this.documentosParaSubir[index].tipoDocumentoId = tipoDocumentoId;
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.id === tipoDocumentoId);
    if (tipoDocumento) {
      this.documentosParaSubir[index].tipoDocumentoNombre = tipoDocumento.nombre;
    }
  }

  removeFile(index: number): void {
    // Eliminar el documento de la lista
    this.documentosParaSubir.splice(index, 1);

    // Actualizar las opciones de tipos de documento disponibles
    this.actualizarTiposDocumentoDisponibles();

    // Si el selector estaba oculto y ahora hay opciones disponibles, mostrarlo
    if (!this.mostrarSelectorDocumento && this.tiposDocumentoOptions.length > 0) {
      this.mostrarSelectorDocumento = true;
    }
  }

  canUpload(): boolean {
    // Verificar que haya al menos un documento configurado para subir
    return this.documentosParaSubir.length > 0 &&
           this.documentosParaSubir.every(doc => doc.tipoDocumentoId);
  }

  uploadDocuments(): void {
    if (!this.canUpload() || this.operationInProgress) {
      return;
    }

    this.operationInProgress = true;

    for (const doc of this.documentosParaSubir) {
      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('tipoDocumentoId', doc.tipoDocumentoId);
      formData.append('comentarios', doc.comentarios);
      this.documentManager.subirDocumento(formData);
    }

    this.dialogRef.close();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) {
      return 'file-image';
    } else if (file.type === 'application/pdf') {
      return 'file-pdf';
    } else {
      return 'file-alt';
    }
  }

  esTipoGenericoSeleccionado(): boolean {
    if (!this.documentoActual.tipoDocumentoId) return false;
    const tipo = this.tiposDocumento.find(t => t.id === this.documentoActual.tipoDocumentoId);
    return !!tipo && (tipo.nombre.toLowerCase().includes('genérico') || tipo.nombre.toLowerCase().includes('generico'));
  }

  coincideConObligatorio(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    for (const tipo of this.tiposDocumento) {
      if (tipo.requerido && lowerFileName.includes(tipo.nombre.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  mostrarError(mensaje: string): void {
    this.notificationService.error(mensaje, 'Error');
  }

  mostrarExito(mensaje: string): void {
    this.notificationService.success(mensaje, 'Éxito');
  }

  mostrarAdvertencia(mensaje: string): void {
    this.notificationService.warning(mensaje, 'Advertencia');
  }

  cancelarYCerrar(): void {
    this.dialogRef.close();
  }
}

  

  
