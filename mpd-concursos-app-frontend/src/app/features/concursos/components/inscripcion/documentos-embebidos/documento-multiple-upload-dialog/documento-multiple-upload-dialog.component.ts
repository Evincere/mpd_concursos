import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { BasicDialogService } from '@shared/services/dialog/basic-dialog.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { UnifiedDocumentService } from '@core/services/documentos/unified-document.service';
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

              <!-- Barra de progreso individual -->
              <div class="file-progress" *ngIf="doc.estado !== 'pendiente'">
                <div class="progress-status">
                  <span [ngClass]="getEstadoClass(doc.estado)">
                    <i class="fas" [class]="'fa-' + getEstadoIcon(doc.estado)"></i>
                    {{getEstadoTexto(doc.estado)}}
                  </span>
                  <span class="progress-percentage" *ngIf="doc.estado === 'subiendo'">
                    {{doc.progreso}}%
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill"
                       [style.width.%]="doc.progreso"
                       [class.error]="doc.estado === 'error'"></div>
                </div>
                <p class="error-message" *ngIf="doc.mensajeError">{{doc.mensajeError}}</p>
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

      <!-- REDESIGNED CONTAINER LEVEL ACTIONS -->
      <div class="dialog-actions">
        <!-- Cancel Button - Always visible and enabled -->
        <app-custom-button
          type="button"
          variant="text"
          [disabled]="false"
          (click)="cancelarYCerrar()"
          class="cancel-button">
          <i class="fas fa-times"></i>
          {{getTextoCancelButton()}}
        </app-custom-button>

        <!-- Upload Documentation Button - Moved from internal component -->
        <app-custom-button
          type="button"
          [variant]="getUploadButtonVariant()"
          [disabled]="getUploadButtonDisabled()"
          (click)="handleUploadAction()"
          class="upload-button">
          <i class="fas" [class]="getUploadButtonIcon()"></i>
          {{getUploadButtonText()}}
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
  monitoringRetries = 0;
  procesoFinalizado = false; // Bandera para evitar múltiples finalizaciones
  fileInputActive = false; // Bandera para evitar múltiples activaciones del selector de archivos
  private monitoringInterval: any; // CRITICAL FIX: Variable para controlar el setInterval
  private maxMonitoringAttempts = 24; // 2 minutos máximo (5s * 24)
  private currentAttempts = 0;

  // CRITICAL FIX: Control mejorado del botón Cancelar
  documentosSubidosExitosamente = false; // Indica si al menos un documento se subió exitosamente

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

  // Propiedades para manejo de timeouts y limpieza de recursos
  // CRITICAL FIX: autoCloseTimeout eliminado - ya no se usa auto-close automático

  private progresoUpdateTimeout: any = null;

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
    private unifiedDocumentService: UnifiedDocumentService
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

    // CRITICAL FIX: autoCloseTimeout eliminado - ya no se usa auto-close automático

    // Limpiar intervalo de monitoreo
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // CRITICAL FIX: Limpiar timeout de actualización de progreso
    if (this.progresoUpdateTimeout) {
      clearTimeout(this.progresoUpdateTimeout);
      this.progresoUpdateTimeout = null;
    }
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
    if (!this.canUpload()) {
      return;
    }

    // Prevent double-clicking during upload
    if (this.uploading) {
      return;
    }

    this.uploading = true;
    this.progresoGlobal = 0;
    this.monitoringRetries = 0; // Reset retry counter for new upload
    this.procesoFinalizado = false; // Reset finalization flag

    // Hide document selector during upload
    this.mostrarSelectorDocumento = false;

    // Primero validamos todos los documentos
    this.validarDocumentos().then(() => {
      // Luego subimos los documentos uno por uno
      this.subirDocumentosSecuencialmente();
    }).catch((error) => {
      // Handle validation errors
      this.uploading = false;
      this.mostrarSelectorDocumento = true;
      this.notificationService.error('Error en la validación de documentos', 'Error');
      console.error('Validation error:', error);
    });
  }

  async validarDocumentos(): Promise<void> {
    for (const doc of this.documentosParaSubir) {
      doc.estado = 'procesando';
      doc.progreso = 10;

      try {
        // Validación en frontend
        const frontendValidationResult = this.documentoValidationService.validateFile(doc.file);

        if (!frontendValidationResult.isValid) {
          doc.estado = 'error';
          doc.mensajeError = frontendValidationResult.errors[0].message;
          continue;
        }

        // Validación en backend
        await new Promise<void>((resolve) => {
          this.documentosService.validateDocument(doc.file)
            .pipe(
              catchError(error => {
                console.error('Error al validar documento en el backend:', error);
                return of({ valid: true, errors: [] });
              })
            )
            .subscribe(backendResult => {
              if (backendResult && !safeGet(backendResult, 'valid', true) &&
                  safeGet(backendResult, 'errors') &&
                  safeLength(safeGet(backendResult, 'errors', [])) > 0) {
                doc.estado = 'error';
                const errors = safeGet(backendResult, 'errors', []) as any[];
                const errorMessage = isArray(errors) && errors.length > 0 ?
                  safeGet(errors[0], 'message', 'Error de validación') :
                  'Error de validación';
                doc.mensajeError = errorMessage || 'Error de validación';
              } else {
                doc.progreso = 20;

                // Si es una imagen, validar resolución y calidad
                if (doc.file.type.startsWith('image/')) {
                  this.documentoValidationService.validateImageResolution(doc.file)
                    .pipe(
                      catchError(error => {
                        console.error('Error al validar resolución de imagen:', error);
                        return of({ isValid: true, errors: [] });
                      }),
                      switchMap(resolutionResult => {
                        if (!resolutionResult.isValid) {
                          doc.estado = 'error';
                          doc.mensajeError = resolutionResult.errors[0].message;
                          return of(null);
                        }
                        return this.documentoValidationService.detectBlurryImage(doc.file);
                      }),
                      catchError(error => {
                        console.error('Error al detectar imagen borrosa:', error);
                        return of({ isValid: true, errors: [] });
                      })
                    )
                    .subscribe(blurResult => {
                      if (blurResult && !blurResult.isValid) {
                        // Guardar advertencias pero permitir continuar
                        doc.validationWarnings = blurResult.errors;
                      }
                      resolve();
                    });
                } else {
                  resolve();
                }
              }
            });
        });
      } catch (error) {
        console.error('Error durante la validación:', error);
        doc.estado = 'error';
        doc.mensajeError = 'Error inesperado durante la validación';
      }
    }
  }

  async subirDocumentosSecuencialmente(): Promise<void> {
    const totalDocumentos = this.documentosParaSubir.filter(doc => doc.estado !== 'error').length;

    if (totalDocumentos === 0) {
      this.uploading = false;
      this.mostrarError('No hay documentos válidos para subir');
      return;
    }

    console.log('[DocumentoMultipleUpload] 🚀 Iniciando carga directa de documentos (método simplificado):', {
      totalFiles: totalDocumentos
    });

    try {
      // Usar el método simple que funciona: subir documentos uno por uno
      for (let i = 0; i < this.documentosParaSubir.length; i++) {
        const doc = this.documentosParaSubir[i];

        if (doc.estado === 'error') {
          continue; // Saltar documentos con error
        }

        // Actualizar estado a 'subiendo'
        doc.estado = 'subiendo';
        doc.progreso = 20;
        this.documentosParaSubir = [...this.documentosParaSubir];
        this.cdr.markForCheck();

        console.log(`[DocumentoMultipleUpload] 📄 Subiendo documento ${i + 1}/${totalDocumentos}: ${doc.nombreEstandarizado}`);

        try {
          // CRITICAL FIX: Usar uploadDocumentWithProgress para progreso real
          doc.estado = 'subiendo';
          doc.progreso = 0;
          this.documentosParaSubir = [...this.documentosParaSubir];
          this.cdr.markForCheck();

          // Suscribirse al progreso de subida
          await new Promise<void>((resolve, reject) => {
            this.unifiedDocumentService.uploadDocumentWithProgress(
              doc.file,
              doc.tipoDocumentoId,
              doc.comentarios || ''
            ).subscribe({
              next: (event) => {
                if (event.type === 'progress') {
                  // Actualizar progreso en tiempo real
                  doc.progreso = event.progress || 0;
                  this.documentosParaSubir = [...this.documentosParaSubir];
                  this.actualizarProgresoGlobal();
                  this.cdr.markForCheck();
                  console.log(`[DocumentoMultipleUpload] 📊 Progreso ${doc.nombreEstandarizado}: ${event.progress || 0}%`);
                } else if (event.type === 'response') {
                  // Upload completado
                  console.log(`[DocumentoMultipleUpload] ✅ Documento subido exitosamente:`, event.response);
                  doc.estado = 'completado';
                  doc.progreso = 100;
                  this.documentosParaSubir = [...this.documentosParaSubir];
                  this.cdr.markForCheck();
                  console.log(`[DocumentoMultipleUpload] ✅ Documento completado: ${doc.nombreEstandarizado}`);
                  resolve();
                }
              },
              error: (error) => {
                console.error(`[DocumentoMultipleUpload] ❌ Error al subir documento ${doc.nombreEstandarizado}:`, error);
                reject(error);
              }
            });
          });

        } catch (error: any) {
          console.error(`[DocumentoMultipleUpload] ❌ Error al subir documento ${doc.nombreEstandarizado}:`, error);

          // El UnifiedDocumentService ya maneja duplicidad automáticamente
          // Si llega aquí es porque hubo un error real o el usuario canceló
          if (error?.message?.includes('cancelado por el usuario')) {
            doc.estado = 'error';
            doc.mensajeError = 'Subida cancelada por el usuario';
          } else if (error?.status === 409) {
            doc.estado = 'error';
            doc.mensajeError = 'Conflicto de concurrencia: el documento fue modificado o eliminado por otra operación. Se recargará la lista de documentos.';
            // Recargar la lista de documentos del usuario
            this.unifiedDocumentService.refreshDocuments(true);
          } else {
            doc.estado = 'error';
            doc.mensajeError = 'Error al subir el documento: ' + (error?.error?.message || error?.message || 'Error desconocido');
          }

          this.documentosParaSubir = [...this.documentosParaSubir];
          this.cdr.markForCheck();
        }
      }

      // Actualizar progreso global una sola vez al final
      this.actualizarProgresoGlobal();

      // Finalizar proceso
      console.log('[DocumentoMultipleUpload] 🏁 Proceso de carga completado');
      this.finalizarProceso();

    } catch (error) {
      console.error('Error durante la carga de documentos:', error);
      this.uploading = false;
      this.mostrarError('Error inesperado durante la carga de documentos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  actualizarProgresoGlobal(): void {
    // CRITICAL FIX: Debounce para evitar actualizaciones excesivas que causan congelamiento
    if (this.progresoUpdateTimeout) {
      clearTimeout(this.progresoUpdateTimeout);
    }

    this.progresoUpdateTimeout = setTimeout(() => {
      // Calcular progreso global basado en el progreso individual de cada documento
      const documentosValidos = this.documentosParaSubir.filter(doc => doc.estado !== 'error');
      if (documentosValidos.length === 0) {
        this.progresoGlobal = 0;
        this.documentosParaSubir = [...this.documentosParaSubir];
        this.cdr.markForCheck();
        return;
      }

      const nuevoProgreso = Math.round(
        documentosValidos.reduce((sum, doc) => sum + doc.progreso, 0) / documentosValidos.length
      );

      // Solo actualizar si realmente cambió para evitar detección de cambios innecesaria
      if (this.progresoGlobal !== nuevoProgreso) {
        this.progresoGlobal = nuevoProgreso;
        this.documentosParaSubir = [...this.documentosParaSubir];
        this.cdr.markForCheck();
      }
    }, 100); // Debounce de 100ms
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

  getEstadoClass(estado: string): string {
    return `estado-${estado}`;
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'validando': return 'clock';
      case 'subiendo': return 'cloud-upload-alt';
      case 'completado': return 'check-circle';
      case 'error': return 'exclamation-circle';
      default: return 'question-circle';
    }
  }

  /**
   * CRITICAL FIX: Lógica mejorada del botón Cancelar
   * Determina el texto del botón según el estado actual
   */
  getTextoCancelButton(): string {
    // Solo mostrar botón cancelar si no ha finalizado
    if (this.procesoFinalizado) {
      return '';
    } else if (this.uploading) {
      return 'Cancelando...';
    } else {
      return 'Cancelar';
    }
  }

  /**
   * CRITICAL FIX: Determina si el botón Cancelar debe estar deshabilitado
   */
  isCancelButtonDisabled(): boolean {
    // Deshabilitar solo durante la subida activa (no al finalizar)
    return this.uploading && !this.procesoFinalizado;
  }

  /**
   * CRITICAL FIX: Confirma la subida y cierra el diálogo
   * Se ejecuta cuando el usuario presiona "Confirmar" después de la subida
   */
  confirmarYCerrar(): void {
    console.log('[DocumentoMultipleUpload] 🔄 Confirmando y cerrando diálogo');

    // Emitir evento de confirmación para que el componente padre actualice el estado
    this.documentosSubidos.emit(this.documentosParaSubir.filter(doc => doc.estado === 'completado'));

    // Usar el mismo mecanismo que la cruz que sí funciona
    this.basicDialogService.closeAll();
  }

  /**
   * CRITICAL FIX: Confirma la cancelación durante la subida
   */
  confirmarCancelacion(): void {
    const confirmar = confirm(
      '¿Estás seguro de que deseas cancelar la subida? Los documentos que se estén procesando podrían perderse.'
    );

    if (confirmar) {
      // Marcar como cancelado y cerrar
      this.uploading = false;
      this.procesoFinalizado = true;
      this.mostrarAdvertencia('Subida cancelada por el usuario');
      this.cerrar();
    }
  }

  /**
   * Closes the dialog using the same robust mechanism as the X button.
   * This ensures proper cleanup of DOM elements and components.
   */
  cerrar(): void {
    console.log('[DocumentoMultipleUpload] 🔄 Cerrando diálogo con mecanismo robusto...');

    // Limpiar datos y estado antes de cerrar
    this.clearAllData();

    // Emitir evento de documentos subidos si hay documentos completados
    const documentosCompletados = this.documentosParaSubir.filter(doc => doc.estado === 'completado');
    if (documentosCompletados.length > 0) {
      this.documentosSubidos.emit(documentosCompletados);
    }

    // Usar el mismo mecanismo que la cruz que sí funciona
    this.basicDialogService.closeAll();
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'validando': return 'Validando...';
      case 'subiendo': return 'Subiendo...';
      case 'completado': return 'Completado';
      case 'error': return 'Error';
      default: return 'Pendiente';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Este método se añade por compatibilidad, pero ahora procesamos los archivos uno por uno
  processFiles(files: File[]): void {
    // Si hay archivos, procesar solo el primero
    if (files.length > 0) {
      this.processSingleFile(files[0]);
    }
  }

  navegarAPerfil(): void {
    this.cerrar();
    this.router.navigate(['/dashboard/perfil'], { fragment: 'documentacion' });
  }

  // ===== REDESIGNED BUTTON LOGIC =====

  /**
   * Cancel button handler - Smart behavior based on current state:
   * - During upload: Aborts process, clears data, and closes dialog
   * - When idle: Simply closes dialog (preserves user data for resume)
   */
  cancelarYCerrar(): void {
    if (this.procesoFinalizado) {
      return; // No hacer nada si el proceso ya terminó
    }
    if (this.uploading && !this.procesoFinalizado) {
      this.abortUpload();
      this.clearAllData();
      this.cerrar();
      return;
    }
    this.cerrar();
  }

  /**
   * Main upload action handler
   */
  handleUploadAction(): void {
    if (this.procesoFinalizado) {
      // CRITICAL FIX: Cuando el proceso está finalizado, el botón debe cerrar siempre
      console.log('[DocumentoMultipleUpload] 🔄 Proceso finalizado - Cerrando diálogo');
      this.confirmarYCerrar();
    } else {
      this.uploadDocuments();
    }
  }

  /**
   * Get upload button variant based on state
   */
  getUploadButtonVariant(): "flat" | "stroked" | "icon" | "text" | "primary" | "warn" {
    if (this.procesoFinalizado) {
      return 'primary'; // Use primary with success styling via CSS
    }
    return 'primary';
  }

  /**
   * Get upload button disabled state
   */
  getUploadButtonDisabled(): boolean {
    if (this.procesoFinalizado) {
      return false; // Always enabled when process is finished
    }

    if (this.uploading) {
      return true; // Disabled during upload to prevent double-clicking
    }

    return !this.canUpload(); // Disabled if no documents ready
  }

  /**
   * Get upload button icon based on state
   */
  getUploadButtonIcon(): string {
    if (this.procesoFinalizado) {
      return 'fa-times';
    }

    if (this.uploading) {
      return 'fa-spinner fa-spin';
    }

    return 'fa-cloud-upload-alt';
  }

  /**
   * Get upload button text based on state
   */
  getUploadButtonText(): string {
    if (this.procesoFinalizado) {
      return 'Cerrar';
    }

    if (this.uploading) {
      return 'Subiendo...';
    }

    const count = this.documentosParaSubir.length;
    if (count === 0) {
      return 'Subir Documentación';
    }

    return `Subir ${count} documento${count > 1 ? 's' : ''}`;
  }

  /**
   * Abort upload process
   */
  private abortUpload(): void {
    this.uploading = false;
    this.progresoGlobal = 0;

    // CRITICAL FIX: Limpiar el intervalo de monitoreo
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Reset all document states
    this.documentosParaSubir.forEach(doc => {
      if (doc.estado === 'subiendo' || doc.estado === 'procesando') {
        doc.estado = 'pendiente';
        doc.progreso = 0;
      }
    });

    this.notificationService.warning('Carga de documentos cancelada', 'Cancelado');
  }

  /**
   * Clear all temporary data and reset component state
   */
  private clearAllData(): void {
    console.log('[DocumentoMultipleUpload] 🧹 Limpiando todos los datos y reseteando estado...');

    // Limpiar intervalos y timeouts
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.progresoUpdateTimeout) {
      clearTimeout(this.progresoUpdateTimeout);
      this.progresoUpdateTimeout = null;
    }

    // Resetear datos de documentos
    this.documentosParaSubir = [];
    this.documentoActual = {
      file: null,
      tipoDocumentoId: '',
      comentarios: ''
    };

    // Resetear estado de UI
    this.uploading = false;
    this.progresoGlobal = 0;
    this.procesoFinalizado = false;
    this.mostrarSelectorDocumento = true;
    this.monitoringRetries = 0;

    // Limpiar input de archivo si existe
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }

    console.log('[DocumentoMultipleUpload] ✅ Estado completamente reseteado');
  }

  /**
   * Confirm and close with auto-close functionality
   */
  private confirmarYCerrarConAutoClose(): void {
    // Disable both buttons
    this.procesoFinalizado = true;

    // CRITICAL FIX: Diferir notificación para evitar conflictos con detección de cambios
    setTimeout(() => {
      this.notificationService.success('Documentación subida exitosamente. Presiona "Cerrar" para continuar.', 'Éxito');
    }, 500);

    // CRITICAL FIX: Eliminar auto-close automático para evitar congelamiento
    // El usuario debe cerrar manualmente presionando el botón "Cerrar"
    console.log('[DocumentoMultipleUpload] ✅ Documentación subida exitosamente - esperando que el usuario presione "Cerrar"');
  }

  private finalizarPorTimeout(): void {
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;

    // Marcar documentos como completados por timeout
    // Asumir que el procesamiento técnico se completó exitosamente
    this.documentosParaSubir.forEach(doc => {
      if (doc.estado === 'subiendo' || doc.estado === 'procesando') {
        doc.estado = 'completado'; // Procesamiento técnico completado
        doc.progreso = 100;
      }
    });

    this.finalizarProceso();
  }

  finalizarProceso(): void {
    if (this.procesoFinalizado) {
      console.log('[DocumentoMultipleUpload] Proceso ya finalizado, evitando duplicación');
      return;
    }
    console.log('[DocumentoMultipleUpload] 🏁 Finalizando proceso de carga de documentos');
    this.procesoFinalizado = true;
    this.uploading = false;

    // Verificar si hay documentos completados exitosamente
    const documentosCompletados = this.documentosParaSubir.filter(doc => doc.estado === 'completado');
    const hayExitos = documentosCompletados.length > 0;

    console.log('[DocumentoMultipleUpload] 📊 Documentos completados:', documentosCompletados.length);

    // Recargar documentos del usuario y recalcular faltantes
    this.documentosService.getDocumentosUsuario().subscribe({
      next: (documentos) => {
        this.documentosUsuario = documentos;
        this.calcularDocumentosFaltantes();
        this.cdr.markForCheck();

        // Solo mostrar éxito si realmente hubo documentos subidos exitosamente
        if (hayExitos) {
          // CRITICAL FIX: Notificar actualización de documentos para que las cards se actualicen
          this.documentosService.notificarDocumentoActualizado();

          setTimeout(() => {
            this.notificationService.success('Documentación subida exitosamente', 'Éxito');
            this.cdr.markForCheck();
          }, 500);
        }
      },
      error: () => {
        // Solo mostrar éxito si realmente hubo documentos subidos exitosamente
        if (hayExitos) {
          // CRITICAL FIX: Notificar actualización de documentos incluso si hay error al recargar
          this.documentosService.notificarDocumentoActualizado();

          setTimeout(() => {
            this.notificationService.success('Documentación subida exitosamente', 'Éxito');
            this.cdr.markForCheck();
          }, 500);
        }
      }
    });
  }

  // Nueva función para advertencia inteligente
  coincideConObligatorio(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    for (const tipo of this.tiposDocumento) {
      if (tipo.requerido && lowerFileName.includes(tipo.nombre.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  // Método para saber si el tipo seleccionado es genérico
  esTipoGenericoSeleccionado(): boolean {
    if (!this.documentoActual.tipoDocumentoId) return false;
    const tipo = this.tiposDocumento.find(t => t.id === this.documentoActual.tipoDocumentoId);
    return !!tipo && (tipo.nombre.toLowerCase().includes('genérico') || tipo.nombre.toLowerCase().includes('generico'));
  }
}
