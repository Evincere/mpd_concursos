import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import Validators

// Custom Components
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-spinner/custom-spinner.component';

// Services
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoValidationService, DocumentoValidationError } from '@core/services/documentos/documento-validation.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService
import { DocumentManagerService } from '@core/services/documentos/document-manager.service';
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';


// RxJS
import { finalize, switchMap, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs'; // Import throwError

// Utils
import { isArray, safeGet, safeArrayMethod, safeLength } from '@shared/utils/safe-access.utils';



@Component({
  selector: 'app-documento-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomSpinnerComponent
  ],
  template: `
    <div class="upload-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <i class="fas" [class.fa-upload]="!data.modoReemplazo" [class.fa-sync-alt]="data.modoReemplazo" aria-hidden="true"></i>
          <h2>{{data.modoReemplazo ? 'Reemplazar' : 'Cargar'}} Documento</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <p class="dialog-description">
          Estás {{data.modoReemplazo ? 'reemplazando' : 'cargando'}} un documento de tipo: <strong>{{data.tipoDocumentoNombre}}</strong>
          <span *ngIf="data.modoReemplazo" class="replacement-info">
            <br><small class="text-warning">⚠️ El documento actual será reemplazado por el nuevo archivo.</small>
          </span>
        </p>

        <form [formGroup]="uploadForm" class="upload-form">
          <div class="file-upload-container"
                [class.has-file]="selectedFile"
                [class.drag-over]="isDragging"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)">

            <div class="upload-icon">
              <i class="fas"
                 [class.fa-file-alt]="selectedFile"
                 [class.fa-cloud-upload-alt]="!selectedFile"
                 aria-hidden="true"></i>
            </div>

            <div class="upload-text">
              <ng-container *ngIf="!selectedFile">
                <p>Arrastra y suelta tu archivo aquí o</p>
                <label for="fileInputSingle" class="custom-file-button">
                  <i class="fas fa-folder-open"></i>
                  Seleccionar archivo
                </label>
                <p class="upload-hint">Formatos permitidos: PDF (Máx. 10MB)</p>
              </ng-container>

              <ng-container *ngIf="selectedFile">
                <p class="file-name">{{selectedFile.name}}</p>
                <p class="file-size">{{formatFileSize(selectedFile.size)}}</p>

                <!-- Mostrar advertencias de validación -->
                <div class="validation-warnings" *ngIf="validationWarnings.length > 0">
                  <p class="warning-title">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    Advertencias:
                  </p>
                  <ul>
                    <li *ngFor="let warning of validationWarnings">
                      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                      {{warning.message}}
                    </li>
                  </ul>
                </div>

                <app-custom-button
                  variant="stroked"
                  color="warn"
                  icon="trash"
                  label="Eliminar"
                  (buttonClick)="removeFile()">
                </app-custom-button>
              </ng-container>
            </div>

            <input type="file"
                   id="fileInputSingle"
                   #fileInput
                   class="hidden-file-input"
                   accept=".pdf"
                   (change)="onFileSelected($event)">
          </div>

          <div class="form-field">
            <label for="comentarios">Comentarios (opcional):</label>
            <textarea id="comentarios"
                      formControlName="comentarios"
                      rows="3"
                      placeholder="Añade información adicional sobre este documento..."></textarea>
          </div>
        </form>


      </div>

      <!-- Actions -->
      <div class="dialog-actions">
          <app-custom-button
            variant="stroked"
            label="Cancelar"
            [disabled]="operationInProgress"
            (buttonClick)="cancelar()">
          </app-custom-button>

          <app-custom-button
            variant="primary"
            icon="cloud-upload-alt"
            label="Subir documento"
            [disabled]="!selectedFile || operationInProgress || uploadForm.invalid || validationErrors.length > 0"
            [loading]="operationInProgress"
            (buttonClick)="uploadDocument()">
          </app-custom-button>
      </div>
    </div>
  `,
  styles: [`
    .upload-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #f9fafb;
      /* Glassmorphism premium dark design */
      background: rgba(55, 65, 81, 0.95);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(20px);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 10px 30px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .dialog-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(75, 85, 99, 0.8);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 12px 12px 0 0;
      backdrop-filter: blur(10px);

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .header-icon {
          color: #3b82f6;
          font-size: 1.5rem;
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f9fafb;
        }
      }
    }

    .dialog-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .dialog-description {
      margin-bottom: 1.5rem;
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.5;

      strong {
        color: #f9fafb;
        font-weight: 600;
      }
    }

    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .file-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 2.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(31, 41, 55, 0.6);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      backdrop-filter: blur(8px);
      text-align: center;
      min-height: 200px;
    }

    .file-upload-container.drag-over {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      transform: scale(1.02);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
    }

    .file-upload-container.has-file {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
    }

    .upload-icon {
      margin-bottom: 1.5rem;

      i {
        font-size: 3rem;
        color: rgba(255, 255, 255, 0.5);
        transition: color 0.3s ease;
      }
    }

    .file-upload-container.has-file .upload-icon i {
      color: #10b981;
    }

    .file-upload-container.drag-over .upload-icon i {
      color: #3b82f6;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;

      p {
        margin: 0;
        color: #d1d5db;
        font-size: 1rem;
      }
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #9ca3af;
      margin-top: 0.5rem;
    }

    .file-name {
      font-weight: 600;
      color: #f9fafb;
      margin: 0;
      font-size: 1.1rem;
    }

    .file-size {
      font-size: 0.875rem;
      color: #9ca3af;
      margin: 0 0 1rem;
    }

    .validation-warnings {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      width: 100%;
      backdrop-filter: blur(8px);

      .warning-title {
        color: #f59e0b;
        font-weight: 600;
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          font-size: 1rem;
        }
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #fbbf24;
          margin-bottom: 0.5rem;

          i {
            font-size: 0.875rem;
            color: #f59e0b;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      label {
        font-size: 0.9rem;
        color: #d1d5db;
        font-weight: 500;
      }

      textarea {
        background: rgba(31, 41, 55, 0.8);
        background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.75rem;
        color: #f9fafb;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
        min-height: 80px;
        backdrop-filter: blur(8px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &::placeholder {
          color: #9ca3af;
        }
      }
    }

    .upload-progress {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: rgba(31, 41, 55, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(8px);

      .progress-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        p {
          margin: 0;
          color: #d1d5db;
          font-weight: 500;
        }
      }
    }

    .upload-success {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 8px;
      backdrop-filter: blur(8px);

      .success-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.75rem;

        .success-icon {
          font-size: 3rem;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        h4 {
          margin: 0;
          color: #10b981;
          font-size: 1.25rem;
          font-weight: 600;
        }

        p {
          margin: 0;
          color: #d1d5db;
          font-size: 0.9rem;
          line-height: 1.5;

          strong {
            color: #f9fafb;
            font-weight: 600;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(75, 85, 99, 0.8);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: 0 0 12px 12px;
      backdrop-filter: blur(10px);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding: 1rem;
      }

      .file-upload-container {
        padding: 1.5rem;
        min-height: 150px;
      }

      .upload-icon i {
        font-size: 2.5rem;
      }

      .dialog-actions {
        flex-direction: column;

        app-custom-button {
          width: 100%;
        }
      }
    }

    .hidden-file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      pointer-events: none;
      z-index: 1;
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

    .custom-file-button:hover:not(.disabled) {
      background: rgba(59, 130, 246, 1);
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .custom-file-button:active:not(.disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
    }

    .custom-file-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      pointer-events: none;
    }

    .custom-file-button i {
      font-size: 16px;
    }
  `]
})
export class DocumentoUploadDialogComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  validationErrors: DocumentoValidationError[] = [];
  validationWarnings: DocumentoValidationError[] = [];

  // CRITICAL FIX: Prevención de doble clic
  operationInProgress = false;
  private operationStartTime: number | null = null;

  // Progress notification reference
  private progressNotificationRef: any = null;

  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private documentoValidationService: DocumentoValidationService,
    private notificationService: UnifiedNotificationService,
    public dialogRef: UnifiedDialogRef<any>,
    private loggingService: LoggingService,
    private documentManager: DocumentManagerService,
    private unifiedDialogService: UnifiedDialogService,
    @Inject(DIALOG_DATA) public data: {
      tipoDocumentoId: string;
      tipoDocumentoNombre: string;
      modoReemplazo?: boolean;
      documentoExistente?: any;
    }
  ) {
    this.loggingService.debug('[DocumentoUploadDialog] Constructor: Initializing form and injecting data.', { data: this.data }, 'DocumentoUploadDialog');
    this.uploadForm = this.fb.group({
      comentarios: [''] // No validation needed for optional comments
    });
  }

  ngOnInit(): void {
    this.loggingService.debug('[DocumentoUploadDialog] ngOnInit: Component initialized.', undefined, 'DocumentoUploadDialog');
  }

  /**
   * Handles the file selection event from the hidden input.
   * @param event The change event from the file input.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.loggingService.debug('[DocumentoUploadDialog] File selected event triggered.', { files: input.files }, 'DocumentoUploadDialog');
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  /**
   * Prevents default dragover behavior and sets dragging state.
   * @param event The DragEvent.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.loggingService.debug('[DocumentoUploadDialog] Drag over event.', undefined, 'DocumentoUploadDialog');
  }

  /**
   * Prevents default dragleave behavior and resets dragging state.
   * @param event The DragEvent.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.loggingService.debug('[DocumentoUploadDialog] Drag leave event.', undefined, 'DocumentoUploadDialog');
  }

  /**
   * Handles the file drop event, processing the dropped file.
   * @param event The DragEvent.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.loggingService.debug('[DocumentoUploadDialog] Drop event triggered.', { files: event.dataTransfer?.files }, 'DocumentoUploadDialog');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  /**
   * Processes the selected or dropped file, performing frontend and backend validations.
   * @param file The file to process.
   */
  processFile(file: File): void {
    this.loggingService.debug('[DocumentoUploadDialog] Processing file:', { fileName: file.name, fileSize: file.size, fileType: file.type }, 'DocumentoUploadDialog');

    // Clear previous errors and warnings
    this.validationErrors = [];
    this.validationWarnings = [];
    this.selectedFile = null; // Clear selected file until all validations pass

    // First, perform frontend validation for immediate feedback
    const frontendValidationResult = this.documentoValidationService.validateFile(file);

    if (!frontendValidationResult.isValid) {
      this.loggingService.warn('[DocumentoUploadDialog] Frontend validation failed:', frontendValidationResult.errors, 'DocumentoUploadDialog');
      this.validationErrors = frontendValidationResult.errors;
      this.mostrarErrorValidacion(frontendValidationResult.errors[0]);
      return;
    }

    // If frontend validation passes, proceed with backend validation
    this.documentosService.validateDocument(file)
      .pipe(
        catchError(error => {
          console.error('[DocumentoUploadDialog] Error during backend document validation:', error);
          this.notificationService.error('Error al validar el documento con el servidor. Se procederá con validación local.', 'Error de Conexión');
          // In case of a backend error, gracefully continue assuming local validation passed for now.
          // This should ideally return a specific error result from backend.
          return of({ valid: true, errors: [] }); // Return a dummy success to continue observable chain
        }),
        switchMap(backendResult => {
          if (backendResult && !safeGet(backendResult, 'valid', true) &&
              safeGet(backendResult, 'errors') &&
              safeLength(safeGet(backendResult, 'errors', [])) > 0) {

            const errors = safeGet(backendResult, 'errors', []) as any[];
            this.validationErrors = isArray(errors)
              ? safeArrayMethod(errors, 'map', [(error: any) => ({
                    code: safeGet(error, 'code', ''),
                    message: safeGet(error, 'message', 'Error de validación'),
                    details: safeGet(error, 'details', {})
                  })], []) as DocumentoValidationError[]
              : [];

            if (this.validationErrors.length > 0) {
              this.mostrarErrorValidacion(this.validationErrors[0]);
            }
            return of(null); // Stop further processing if backend validation fails
          }

          // If it's an image, validate resolution and quality
          if (file.type.startsWith('image/')) {
            return this.documentoValidationService.validateImageResolution(file).pipe(
              switchMap(resolutionResult => {
                if (!(resolutionResult as any).isValid) {
                  this.validationErrors = (resolutionResult as any).errors;
                  this.mostrarErrorValidacion((resolutionResult as any).errors[0]);
                  return of(null);
                }
                return this.documentoValidationService.detectBlurryImage(file);
              })
            );
          } else {
            // If it's a PDF or other type, accept directly after basic validation
            return of({ isValid: true, errors: [] }); // Return a valid result
          }
        })
      )
      .subscribe(validationResult => {
        if (validationResult === null) {
          // A previous step in the pipeline (backend or image validation) failed
          this.loggingService.debug('[DocumentoUploadDialog] File processing stopped due to validation error.', undefined, 'DocumentoUploadDialog');
          return;
        }

        if (!validationResult.isValid && validationResult.errors.length > 0) {
          // This would typically be from the blurry image detection, which is a warning
          this.validationWarnings = validationResult.errors;
          this.notificationService.warning(
            `Advertencia: ${validationResult.errors[0].message}. Considera subir una imagen de mejor calidad.`,
            'Calidad de Imagen',
            { duration: 7000 }
          );
        }

        // If all validations pass (or only warnings are present), accept the file
        this.selectedFile = file;
        this.loggingService.debug('[DocumentoUploadDialog] File accepted after all validations.', { fileName: file.name }, 'DocumentoUploadDialog');
      });
  }

  /**
   * Displays an error message based on a DocumentoValidationError.
   * @param error The validation error to display.
   */
  private mostrarErrorValidacion(error: DocumentoValidationError): void {
    this.notificationService.error(error.message, 'Error de Validación');
    this.loggingService.error('[DocumentoUploadDialog] Validation Error:', error, 'DocumentoUploadDialog');
  }

  /**
   * Removes the currently selected file and clears validation messages.
   */
  removeFile(): void {
    this.selectedFile = null;
    this.validationErrors = [];
    this.validationWarnings = [];
    this.loggingService.debug('[DocumentoUploadDialog] File removed.', undefined, 'DocumentoUploadDialog');
  }

  /**
   * Uploads the selected document to the server.
   * ✅ CRITICAL FIX: Esperar a que termine la carga antes de cerrar el modal
   * ✅ ENHANCEMENT: Manejo de errores mejorado
   */
  uploadDocument(): void {
    if (this.operationInProgress) {
      this.loggingService.warn('[DocumentoUploadDialog] 🚫 Operación ya en progreso - ignorando clic adicional', undefined, 'DocumentoUploadDialog');
      return;
    }

    if (!this.selectedFile) {
      this.notificationService.error('No hay archivo seleccionado para subir.', 'Error de Subida');
      return;
    }

    // Log información del upload
    this.loggingService.debug('[DocumentoUploadDialog] 🔄 Iniciando upload:', {
      fileName: this.selectedFile.name,
      fileSize: this.selectedFile.size,
      tipoDocumentoId: this.data.tipoDocumentoId,
      timestamp: new Date().toISOString()
    }, 'DocumentoUploadDialog');

    // ENHANCEMENT: Validación adicional antes del upload
    if (this.selectedFile.size > 20 * 1024 * 1024) { // 20MB
      this.notificationService.error(
        `El archivo es demasiado grande (${this.formatBytes(this.selectedFile.size)}). El tamaño máximo permitido es 20MB.`,
        'Archivo Demasiado Grande'
      );
      return;
    }

    if (this.selectedFile.type !== 'application/pdf') {
      this.notificationService.error(
        `Tipo de archivo no permitido: ${this.selectedFile.type}. Solo se permiten archivos PDF.`,
        'Tipo de Archivo No Válido'
      );
      return;
    }

    this.operationInProgress = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('tipoDocumentoId', this.data.tipoDocumentoId);
    const comentarios = this.uploadForm.get('comentarios')?.value || '';
    formData.append('comentarios', comentarios);

    // ENHANCEMENT: Mostrar indicador de progreso y guardar referencia
    this.progressNotificationRef = this.notificationService.info(
      `Subiendo archivo: ${this.selectedFile.name} (${this.formatBytes(this.selectedFile.size)})...`,
      'Upload en Progreso',
      { duration: 0 } // No auto-dismiss
    );

    // ✅ CRITICAL FIX: Usar el servicio directamente y suscribirse al resultado
    this.documentosService.uploadDocumento(formData).subscribe({
      next: (response) => {
        this.loggingService.debug('[DocumentoUploadDialog] ✅ Documento subido exitosamente', response, 'DocumentoUploadDialog');

        // ✅ CRITICAL FIX: Cerrar notificación de progreso
        if (this.progressNotificationRef) {
          this.progressNotificationRef.instance.dismiss();
          this.progressNotificationRef = null;
        }

        this.notificationService.success(
          `Documento "${this.selectedFile?.name}" subido exitosamente`,
          'Éxito'
        );
        this.operationInProgress = false;
        this.dialogRef.close(response); // ✅ Cerrar con el resultado exitoso
      },
      error: (error) => {
        this.loggingService.error('[DocumentoUploadDialog] ❌ Error al subir documento:', {
          error: error,
          fileName: this.selectedFile?.name,
          fileSize: this.selectedFile?.size,
          timestamp: new Date().toISOString()
        }, 'DocumentoUploadDialog');

        // ✅ CRITICAL FIX: Cerrar notificación de progreso también en caso de error
        if (this.progressNotificationRef) {
          this.progressNotificationRef.instance.dismiss();
          this.progressNotificationRef = null;
        }

        // ENHANCEMENT: Mensaje de error más informativo
        let errorMessage = error.message || 'Error desconocido al subir el documento';
        let errorTitle = 'Error de Subida';

        // Personalizar mensaje según el tipo de error
        if (error.message?.includes('conexión') || error.message?.includes('timeout')) {
          errorTitle = 'Error de Conexión';
          errorMessage += '\n\nSugerencias:\n• Verifique su conexión a internet\n• Intente con un archivo más pequeño\n• Intente nuevamente en unos minutos';
        } else if (error.message?.includes('demasiado grande')) {
          errorTitle = 'Archivo Demasiado Grande';
          errorMessage += `\n\nArchivo actual: ${this.selectedFile ? this.formatBytes(this.selectedFile.size) : 'desconocido'}`;
        } else if (error.message?.includes('tipo de archivo')) {
          errorTitle = 'Tipo de Archivo No Válido';
          errorMessage += `\n\nTipo detectado: ${this.selectedFile?.type || 'desconocido'}`;
        }

        this.notificationService.error(errorMessage, errorTitle, { duration: 10000 });
        this.operationInProgress = false;
        // ✅ NO cerrar el modal en caso de error para que el usuario pueda reintentar
      }
    });
  }

  /**
   * Formatea bytes en formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }



  /**
   * Closes the dialog, indicating cancellation.
   * CRITICAL FIX: Usar dialogRef.close() con resultado de cancelación para consistencia
   */
  cancelar(): void {
    this.dialogRef.close();
  }

  /**
   * Closes the dialog after successful upload.
   */
  cerrarDialogo(): void {
    this.dialogRef.close();
  }

  /**
   * Formats file size into a human-readable string (e.g., KB, MB).
   * @param bytes The size in bytes.
   * @returns Formatted size string.
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
