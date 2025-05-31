import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule } from  '@angular/forms';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoValidationService, DocumentoValidationError } from  '@core/services/documentos/documento-validation.service';
import { finalize, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { isArray, safeGet, safeArrayMethod, safeLength } from '@shared/utils/safe-access.utils';

@Component({
  selector: 'app-documento-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="upload-dialog">
      <h2 mat-dialog-title>Cargar Documento</h2>

      <mat-dialog-content>
        <p class="dialog-description">
          Estás cargando un documento de tipo: <strong>{{data.tipoDocumentoNombre}}</strong>
        </p>

        <form [formGroup]="uploadForm" class="upload-form">
          <div class="file-upload-container"
               [class.has-file]="selectedFile"
               [class.drag-over]="isDragging"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">

            <div class="upload-icon">
              <mat-icon>{{selectedFile ? 'description' : 'cloud_upload'}}</mat-icon>
            </div>

            <div class="upload-text">
              <ng-container *ngIf="!selectedFile">
                <p>Arrastra y suelta tu archivo aquí o</p>
                <button type="button" mat-raised-button color="primary" (click)="fileInput.click()">
                  Seleccionar archivo
                </button>
                <p class="upload-hint">Formatos permitidos: PDF, JPG, PNG (Máx. 10MB)</p>
              </ng-container>

              <ng-container *ngIf="selectedFile">
                <p class="file-name">{{selectedFile.name}}</p>
                <p class="file-size">{{formatFileSize(selectedFile.size)}}</p>

                <!-- Mostrar advertencias de validación -->
                <div class="validation-warnings" *ngIf="validationWarnings.length > 0">
                  <p class="warning-title">Advertencias:</p>
                  <ul>
                    <li *ngFor="let warning of validationWarnings">
                      <mat-icon>warning</mat-icon> {{warning.message}}
                    </li>
                  </ul>
                </div>

                <button type="button" mat-button color="warn" (click)="removeFile()">
                  <mat-icon>delete</mat-icon> Eliminar
                </button>
              </ng-container>
            </div>

            <input type="file"
                   #fileInput
                   style="display: none"
                   accept=".pdf,.jpg,.jpeg,.png"
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

        <div class="upload-progress" *ngIf="uploading">
          <p>Subiendo documento...</p>
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false" [disabled]="uploading">Cancelar</button>
        <button mat-raised-button
                color="primary"
                [disabled]="!selectedFile || uploading || uploadForm.invalid"
                (click)="uploadDocument()">
          <mat-icon>cloud_upload</mat-icon> Subir documento
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .upload-dialog {
      color: rgba(255, 255, 255, 0.87);
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #fff;
    }

    .dialog-description {
      margin-bottom: 1.5rem;
      color: rgba(255, 255, 255, 0.7);
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
      border-radius: 8px;
      padding: 2rem;
      transition: all 0.3s ease;
      background: rgba(0, 0, 0, 0.2);
      text-align: center;
    }

    .file-upload-container.drag-over {
      border-color: #3f51b5;
      background: rgba(63, 81, 181, 0.1);
    }

    .file-upload-container.has-file {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }

    .upload-icon {
      margin-bottom: 1rem;
    }

    .upload-icon mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .file-upload-container.has-file .upload-icon mat-icon {
      color: #4caf50;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-hint {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 0.5rem;
    }

    .file-name {
      font-weight: 500;
      color: #fff;
      margin: 0;
    }

    .file-size {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 0.5rem;
    }

    .validation-warnings {
      background-color: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 4px;
      padding: 0.5rem;
      margin: 0.5rem 0;
      width: 100%;
    }

    .warning-title {
      color: #ffc107;
      font-weight: 500;
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }

    .validation-warnings ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .validation-warnings li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 0.3rem;
    }

    .validation-warnings mat-icon {
      color: #ffc107;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .form-field textarea {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.75rem;
      color: rgba(255, 255, 255, 0.87);
      font-family: inherit;
      resize: vertical;
    }

    .form-field textarea:focus {
      outline: none;
      border-color: #3f51b5;
    }

    .upload-progress {
      margin-top: 1.5rem;
    }

    .upload-progress p {
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    mat-dialog-actions {
      padding-top: 1rem;
    }
  `]
})
export class DocumentoUploadDialogComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  uploading = false;
  isDragging = false;
  validationErrors: DocumentoValidationError[] = [];
  validationWarnings: DocumentoValidationError[] = [];

  constructor(
    private dialogRef: MatDialogRef<DocumentoUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipoDocumentoId: string, tipoDocumentoNombre: string },
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private documentoValidationService: DocumentoValidationService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      comentarios: ['']
    });
  }

  ngOnInit(): void {
    console.log('[DocumentoUploadDialog] Inicializado con datos:', this.data);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
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

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  processFile(file: File): void {
    // Limpiar errores y advertencias anteriores
    this.validationErrors = [];
    this.validationWarnings = [];

    // Primero validamos en el frontend para una respuesta inmediata
    const frontendValidationResult = this.documentoValidationService.validateFile(file);

    if (!frontendValidationResult.isValid) {
      // Guardar errores de validación
      this.validationErrors = frontendValidationResult.errors;
      // Mostrar el primer error encontrado
      this.mostrarErrorValidacion(frontendValidationResult.errors[0]);
      return;
    }

    // Si pasa la validación básica, validamos en el backend
    this.documentosService.validateDocument(file)
      .pipe(
        catchError(error => {
          console.error('Error al validar documento en el backend:', error);
          // En caso de error, continuamos con la validación local
          return of({ valid: true, errors: [] });
        })
      )
      .subscribe(backendResult => {
        // Si hay errores en el backend, los mostramos
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
          return;
        }

        // Si es una imagen, validar resolución y calidad
        if (file.type.startsWith('image/')) {
          this.documentoValidationService.validateImageResolution(file)
            .pipe(
              switchMap(resolutionResult => {
                if (!resolutionResult.isValid) {
                  this.validationErrors = resolutionResult.errors;
                  this.mostrarErrorValidacion(resolutionResult.errors[0]);
                  return of(null);
                }
                return this.documentoValidationService.detectBlurryImage(file);
              })
            )
            .subscribe(blurResult => {
              if (blurResult && !blurResult.isValid) {
                // Guardar advertencias pero permitir continuar
                this.validationWarnings = blurResult.errors;

                // Mostrar advertencia
                this.snackBar.open(
                  'Advertencia: ' + blurResult.errors[0].message + '. Considera subir una imagen de mejor calidad.',
                  'Entendido',
                  {
                    duration: 7000,
                    panelClass: ['warning-snackbar']
                  }
                );
              }

              // Aceptar el archivo
              this.selectedFile = file;
            });
        } else {
          // Si es PDF u otro tipo, aceptar directamente
          this.selectedFile = file;
        }
      });
  }

  /**
   * Muestra un mensaje de error basado en el error de validación
   */
  private mostrarErrorValidacion(error: DocumentoValidationError): void {
    this.snackBar.open(error.message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploading = true;

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('tipoDocumentoId', this.data.tipoDocumentoId);
    formData.append('comentarios', this.uploadForm.get('comentarios')?.value || '');

    this.documentosService.uploadDocumento(formData)
      .pipe(finalize(() => {
        this.uploading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('[DocumentoUploadDialog] Documento subido correctamente:', response);
          this.snackBar.open('Documento subido correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.documentosService.notificarDocumentoActualizado();
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('[DocumentoUploadDialog] Error al subir documento:', error);
          this.snackBar.open('Error al subir el documento. Por favor, intenta nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
