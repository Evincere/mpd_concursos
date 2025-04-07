import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { TipoDocumento } from '../../../../core/models/documento.model';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-documento-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="documento-upload-dialog">
      <!-- Header con ícono y título -->
      <div class="dialog-header">
        <h2>
          <i class="fas fa-file-upload"></i>
          <ng-container *ngIf="tipoDocumentoSeleccionado; else tituloGenerico">
            Cargar {{ tipoDocumentoSeleccionado.nombre }}
          </ng-container>
          <ng-template #tituloGenerico>
            Cargar nuevo documento
          </ng-template>
        </h2>
        <button class="close-button" (click)="onCancel()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido scrollable -->
      <div class="dialog-scrollable-content">
        <!-- Formulario -->
        <form [formGroup]="documentoForm" class="documento-form">
          <!-- Sección de tipo de documento (solo se muestra si no hay uno seleccionado) -->
          <div class="form-section" *ngIf="!tipoDocumentoSeleccionado">
            <h3 class="section-title">Información del documento</h3>

            <div class="form-field">
              <label for="tipoDocumento">Tipo de documento *</label>
              <div class="select-container">
                <select
                  id="tipoDocumento"
                  formControlName="tipoDocumentoId"
                  class="form-control">
                  <option value="" disabled selected>Seleccione el tipo de documento</option>
                  <option *ngFor="let tipo of tiposDocumento" [value]="tipo.id">
                    {{ tipo.nombre }}
                  </option>
                </select>
                <i class="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div *ngIf="documentoForm.get('tipoDocumentoId')?.hasError('required') &&
                       documentoForm.get('tipoDocumentoId')?.touched"
                 class="error-message">
              <i class="fas fa-exclamation-circle"></i> Debe seleccionar un tipo de documento
            </div>
          </div>

          <!-- Sección de tipo de documento seleccionado (solo se muestra si hay uno seleccionado) -->
          <div class="form-section" *ngIf="tipoDocumentoSeleccionado">
            <h3 class="section-title">Información del documento</h3>

            <div class="form-field">
              <label>Tipo de documento</label>
              <div class="tipo-documento-seleccionado">
                <i class="fas fa-file-pdf"></i>
                <span>{{ tipoDocumentoSeleccionado.nombre }}</span>
              </div>
              <!-- Campo oculto para el tipo de documento cuando ya está seleccionado -->
              <input type="hidden" formControlName="tipoDocumentoId">
            </div>
          </div>

          <!-- Sección de carga de archivo -->
          <div class="form-section">
            <h3 class="section-title">Archivo</h3>

            <div class="file-upload-container"
                 [class.has-file]="selectedFile"
                 [class.drag-over]="isDragging"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">

              <ng-container *ngIf="!selectedFile; else fileSelected">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <p class="upload-text">Arrastra y suelta tu archivo PDF aquí</p>
                <p class="upload-divider">o</p>
                <button type="button" class="btn-upload" (click)="fileInput.click()">
                  <i class="fas fa-file-upload"></i>
                  Seleccionar archivo
                </button>
                <p class="upload-hint">Solo se permiten archivos PDF de máximo 5MB</p>
              </ng-container>

              <ng-template #fileSelected>
                <ng-container *ngIf="selectedFile">
                  <div class="selected-file">
                    <i class="fas fa-file-pdf file-icon"></i>
                    <div class="file-info">
                      <p class="file-name">{{ selectedFile.name }}</p>
                      <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                    </div>
                    <button type="button" class="btn-icon btn-danger" (click)="removeFile()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </ng-container>
              </ng-template>

              <input type="file" #fileInput hidden accept="application/pdf" (change)="onFileSelected($event)">
            </div>
          </div>

          <!-- Sección especial para DNI (frente/dorso) -->
          <div class="form-section" *ngIf="esTipoDNI()">
            <h3 class="section-title">Especificar lado del DNI</h3>

            <div class="form-field">
              <label>Seleccione qué lado del DNI está subiendo</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input type="radio" id="dni-frente" formControlName="ladoDNI" value="frente">
                  <label for="dni-frente">Frente (Anverso)</label>
                </div>
                <div class="radio-option">
                  <input type="radio" id="dni-dorso" formControlName="ladoDNI" value="dorso">
                  <label for="dni-dorso">Dorso (Reverso)</label>
                </div>
              </div>
              <div *ngIf="documentoForm.get('ladoDNI')?.touched && !documentoForm.get('ladoDNI')?.value" class="error-message">
                <i class="fas fa-exclamation-circle"></i> Por favor, especifique qué lado del DNI está subiendo
              </div>
            </div>
          </div>

          <!-- Sección de comentarios -->
          <div class="form-section">
            <h3 class="section-title">Información adicional</h3>

            <div class="form-field">
              <label for="comentarios">Comentarios (opcional)</label>
              <textarea
                id="comentarios"
                formControlName="comentarios"
                class="form-control"
                rows="3"
                placeholder="Agregue detalles adicionales sobre el documento"></textarea>
            </div>
          </div>
        </form>

        <!-- Indicador de progreso de carga -->
        <div *ngIf="isUploading" class="upload-progress">
          <p>Subiendo documento...</p>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="uploadProgress"></div>
          </div>
          <p class="progress-text">{{ uploadProgress }}%</p>
        </div>
      </div>

      <!-- Botones de acción fijos -->
      <div class="action-buttons">
        <button class="btn-cancel" [disabled]="isUploading" (click)="onCancel()">
          Cancelar
        </button>
        <button
          class="btn-submit"
          [disabled]="!documentoForm.valid || !selectedFile || isUploading"
          (click)="onSubmit()">
          <i class="fas fa-upload"></i>
          Cargar documento
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --primary-color: #3f51b5;
      --primary-light: rgba(63, 81, 181, 0.2);
      --primary-dark: #303f9f;
      --error-color: #f44336;
      --text-color: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.7);
      --border-color: rgba(255, 255, 255, 0.12);
      --bg-dark: #1e1e1e;
      --bg-card: #2d2d2d;
      --success-color: #4caf50;
      --header-height: 60px;
      --footer-height: 70px;
    }

    .documento-upload-dialog {
      background-color: var(--bg-dark);
      color: var(--text-color);
      width: 100%;
      max-width: 600px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      height: 80vh;
      max-height: 80vh;
    }

    .dialog-header {
      background-color: var(--bg-dark);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      min-height: var(--header-height);

      h2 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;

        i {
          color: var(--primary-color);
        }
      }

      .close-button {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 1.2rem;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;

        &:hover {
          color: var(--text-color);
        }
      }
    }

    .dialog-scrollable-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      max-height: calc(80vh - var(--header-height) - var(--footer-height));
    }

    .documento-form {
      display: flex;
      flex-direction: column;
    }

    .form-section {
      margin-bottom: 24px;

      .section-title {
        color: var(--text-color);
        font-size: 1rem;
        font-weight: 500;
        margin: 0 0 16px 0;
        padding-left: 10px;
        border-left: 3px solid var(--primary-color);
      }
    }

    .form-field {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 8px;
        color: var(--text-color);
        font-size: 0.9rem;
      }

      .form-control {
        width: 100%;
        padding: 12px 16px;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-color);
        font-size: 1rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }

      textarea.form-control {
        resize: vertical;
        min-height: 100px;
      }

      .select-container {
        position: relative;

        select {
          appearance: none;
          padding-right: 36px;
        }

        .select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--text-secondary);
        }
      }

      .tipo-documento-seleccionado {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background-color: rgba(63, 81, 181, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(63, 81, 181, 0.3);

        i {
          color: var(--primary-color);
          font-size: 18px;
        }

        span {
          color: var(--text-color);
          font-weight: 500;
        }
      }

      .radio-group {
        display: flex;
        gap: 20px;
        margin-top: 8px;

        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;

          input[type="radio"] {
            margin: 0;
            cursor: pointer;
          }

          label {
            cursor: pointer;
            margin: 0;
            font-weight: normal;
          }
        }
      }

      .error-message {
        color: var(--error-color);
        font-size: 0.85rem;
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
    }

    .file-upload-container {
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      background-color: rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &.drag-over {
        border-color: var(--primary-color);
        background-color: rgba(63, 81, 181, 0.1);
      }

      &.has-file {
        border-style: solid;
        border-color: var(--primary-color);
        background-color: rgba(63, 81, 181, 0.05);
        min-height: auto;
        padding: 16px;
      }

      .upload-icon {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 16px;
      }

      .upload-text {
        font-size: 1.1rem;
        margin-bottom: 8px;
      }

      .upload-divider {
        margin: 8px 0;
        color: var(--text-secondary);
      }

      .btn-upload {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 10px 16px;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--primary-dark);
        }

        i {
          margin-right: 4px;
        }
      }

      .upload-hint {
        color: var(--text-secondary);
        font-size: 0.8rem;
        margin-top: 16px;
      }
    }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 12px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 4px;

      .file-icon {
        font-size: 2.5rem;
        color: #f44336;
      }

      .file-info {
        flex: 1;

        .file-name {
          font-weight: 500;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          color: var(--text-secondary);
          font-size: 0.8rem;
          margin: 4px 0 0 0;
        }
      }
    }

    .upload-progress {
      margin-top: 24px;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;

      p {
        margin: 8px 0;
      }

      .progress-bar-container {
        height: 8px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin: 10px 0;
      }

      .progress-bar {
        height: 100%;
        background-color: var(--primary-color);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-text {
        text-align: center;
        font-weight: 500;
        color: var(--primary-color);
      }
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      background-color: var(--bg-dark);
      min-height: var(--footer-height);
    }

    .btn-cancel {
      background-color: transparent;
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px 16px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.05);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-submit {
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 16px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;

      &:hover:not(:disabled) {
        background-color: var(--primary-dark);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      padding: 0;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--error-color);
      color: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #d32f2f;
      }
    }

    /* Sobrescribir estilos de mat-dialog */
    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
      overflow: hidden !important;

      .mdc-dialog__surface {
        background-color: var(--bg-dark) !important;
        color: var(--text-color) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        max-height: 85vh !important;
      }

      .mat-mdc-dialog-content {
        display: none !important;
      }

      .mat-mdc-dialog-actions {
        display: none !important;
      }
    }
  `]
})
export class DocumentoUploadComponent implements OnInit {
  documentoForm: FormGroup;
  tiposDocumento: TipoDocumento[] = [];
  tipoDocumentoSeleccionado: TipoDocumento | null = null;
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  esDNIGenerico = false;

  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DocumentoUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipoDocumentoId?: string }
  ) {
    console.log(`[DocumentoUpload] Constructor - tipoDocumentoId recibido: ${data.tipoDocumentoId || 'ninguno'}`);

    // Inicializar el formulario con el ID del tipo de documento si está disponible
    this.documentoForm = this.fb.group({
      tipoDocumentoId: [data.tipoDocumentoId || '', Validators.required],
      ladoDNI: [''],
      comentarios: ['']
    });

    // Si tenemos un ID de tipo de documento, lo mostramos en el título del diálogo
    if (data.tipoDocumentoId) {
      console.log(`[DocumentoUpload] Tipo de documento preseleccionado: ${data.tipoDocumentoId}`);
    }
  }

  ngOnInit(): void {
    // Cargar los tipos de documento y luego buscar el tipo seleccionado
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        console.log(`[DocumentoUpload] Tipos de documento cargados: ${tipos.length}`);

        // Si tenemos un ID de tipo de documento, buscamos el objeto completo
        if (this.data.tipoDocumentoId) {
          console.log(`[DocumentoUpload] Buscando tipo de documento con ID/código: ${this.data.tipoDocumentoId}`);

          // Buscar por ID exacto
          let tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.id === this.data.tipoDocumentoId);

          // Si no encontramos por ID, buscar por código
          if (!tipoSeleccionado) {
            tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.code === this.data.tipoDocumentoId);
            if (tipoSeleccionado) {
              console.log(`[DocumentoUpload] Tipo de documento encontrado por código: ${tipoSeleccionado.nombre}`);
            }
          } else {
            console.log(`[DocumentoUpload] Tipo de documento encontrado por ID: ${tipoSeleccionado.nombre}`);
          }

          // Si encontramos el tipo, lo establecemos
          if (tipoSeleccionado) {
            this.tipoDocumentoSeleccionado = tipoSeleccionado;
            // Asegurarnos de que el valor esté en el formulario
            this.documentoForm.get('tipoDocumentoId')?.setValue(tipoSeleccionado.id);
          } else {
            // Si no encontramos el tipo exacto, buscamos por nombre similar
            console.log(`[DocumentoUpload] Buscando tipo de documento por nombre similar...`);

            // Casos especiales para DNI
            if (this.data.tipoDocumentoId === 'dni-frente' || this.data.tipoDocumentoId === 'dni-dorso') {
              // Buscar un tipo de documento relacionado con DNI
              tipoSeleccionado = this.tiposDocumento.find(tipo =>
                tipo.nombre.toLowerCase().includes('dni') ||
                (tipo.code && tipo.code.includes('dni'))
              );

              if (tipoSeleccionado) {
                console.log(`[DocumentoUpload] Tipo de documento DNI encontrado: ${tipoSeleccionado.nombre}`);
                this.tipoDocumentoSeleccionado = tipoSeleccionado;
                this.documentoForm.get('tipoDocumentoId')?.setValue(tipoSeleccionado.id);
              }
            }

            // Si aún no encontramos, buscar por coincidencia parcial en el nombre
            if (!this.tipoDocumentoSeleccionado) {
              for (const tipo of this.tiposDocumento) {
                // Convertir ambos a minúsculas para comparación insensible a mayúsculas/minúsculas
                const idBusqueda = this.data.tipoDocumentoId.toLowerCase();
                const nombreTipo = tipo.nombre.toLowerCase();
                const codigoTipo = tipo.code ? tipo.code.toLowerCase() : '';

                // Buscar coincidencias parciales en el nombre o código
                if (idBusqueda.includes(nombreTipo) || nombreTipo.includes(idBusqueda) ||
                    idBusqueda.includes(codigoTipo) || codigoTipo.includes(idBusqueda)) {
                  console.log(`[DocumentoUpload] Tipo de documento similar encontrado: ${tipo.nombre}`);
                  this.tipoDocumentoSeleccionado = tipo;
                  this.documentoForm.get('tipoDocumentoId')?.setValue(tipo.id);
                  break;
                }
              }
            }

            // Si aún no encontramos, crear un tipo de documento temporal para la UI
            if (!this.tipoDocumentoSeleccionado) {
              console.log(`[DocumentoUpload] Creando tipo de documento temporal para UI`);
              // Crear un objeto temporal solo para la UI (no se guarda en el backend)
              this.tipoDocumentoSeleccionado = {
                id: this.data.tipoDocumentoId,
                code: this.data.tipoDocumentoId,
                nombre: this.formatearNombreTipoDocumento(this.data.tipoDocumentoId),
                descripcion: '',
                requerido: true,
                orden: 0,
                activo: true
              };
              // No cambiamos el valor en el formulario para enviar el ID original al backend
            }
          }
        }
      },
      error: (error) => {
        console.error('[DocumentoUpload] Error al cargar tipos de documento:', error);
        this.snackBar.open('Error al cargar los tipos de documento', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Método para formatear el nombre de un tipo de documento a partir de su ID/código
  private formatearNombreTipoDocumento(id: string): string {
    // Eliminar prefijos comunes
    let nombre = id.replace(/^(doc-|documento-|tipo-)/i, '');

    // Reemplazar guiones por espacios
    nombre = nombre.replace(/-/g, ' ');

    // Capitalizar cada palabra
    nombre = nombre.split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');

    return nombre;
  }

  // Método para verificar si el documento es un DNI
  esTipoDNI(): boolean {
    // Verificar si el tipo seleccionado es DNI genérico
    if (this.tipoDocumentoSeleccionado) {
      const nombre = this.tipoDocumentoSeleccionado.nombre.toLowerCase();
      const codigo = this.tipoDocumentoSeleccionado.code?.toLowerCase() || '';

      // Si es un DNI genérico (no específico de frente o dorso)
      if ((nombre.includes('dni') || nombre.includes('documento nacional')) &&
          !nombre.includes('frente') && !nombre.includes('dorso') &&
          !nombre.includes('frontal') && !nombre.includes('reverso') &&
          !codigo.includes('frente') && !codigo.includes('dorso')) {
        return true;
      }

      // Si es un tipo genérico de DNI
      if (codigo === 'dni') {
        return true;
      }
    }

    // Verificar si el ID del tipo es genérico de DNI
    const tipoId = this.documentoForm.get('tipoDocumentoId')?.value;
    if (tipoId === 'dni') {
      return true;
    }

    return false;
  }

  // El método cargarTiposDocumento ha sido reemplazado por la lógica en ngOnInit

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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File): void {
    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.snackBar.open('El archivo excede el tamaño máximo de 5MB', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }

  onSubmit(): void {
    if (this.documentoForm.valid && this.selectedFile) {
      // Validar que si es DNI, se haya seleccionado el lado
      if (this.esTipoDNI() && !this.documentoForm.get('ladoDNI')?.value) {
        this.documentoForm.get('ladoDNI')?.markAsTouched();
        this.snackBar.open('Por favor, especifique qué lado del DNI está subiendo', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      this.isUploading = true;

      const formData = new FormData();
      // Asegurarnos de que el archivo se envíe como 'file'
      formData.append('file', this.selectedFile, this.selectedFile.name);

      // Obtener el ID o código del tipo de documento
      let tipoDocumentoId = this.documentoForm.get('tipoDocumentoId')?.value;

      // Si tenemos un tipo de documento seleccionado pero no está en el formulario, usamos su código o ID
      if (!tipoDocumentoId && this.tipoDocumentoSeleccionado) {
        // Preferir el código sobre el ID si está disponible
        tipoDocumentoId = this.tipoDocumentoSeleccionado.code || this.tipoDocumentoSeleccionado.id;
        console.log(`[DocumentoUpload] Usando código/ID del tipo de documento seleccionado: ${tipoDocumentoId}`);
      }

      // Si tenemos un ID en los datos de entrada, lo usamos como respaldo
      if (!tipoDocumentoId && this.data.tipoDocumentoId) {
        tipoDocumentoId = this.data.tipoDocumentoId;
        console.log(`[DocumentoUpload] Usando ID del tipo de documento de los datos de entrada: ${tipoDocumentoId}`);
      }

      // Si es un DNI genérico, modificamos el ID según el lado seleccionado
      if (this.esTipoDNI() && this.documentoForm.get('ladoDNI')?.value) {
        const lado = this.documentoForm.get('ladoDNI')?.value;
        if (lado === 'frente') {
          tipoDocumentoId = 'dni-frente';
          console.log(`[DocumentoUpload] Modificando tipo de documento a DNI Frente`);
        } else if (lado === 'dorso') {
          tipoDocumentoId = 'dni-dorso';
          console.log(`[DocumentoUpload] Modificando tipo de documento a DNI Dorso`);
        }
      }

      if (tipoDocumentoId) {
        formData.append('tipoDocumentoId', tipoDocumentoId);
      } else {
        console.error('[DocumentoUpload] No se pudo determinar el ID del tipo de documento');
        this.snackBar.open('Error: No se pudo determinar el tipo de documento', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isUploading = false;
        return;
      }

      // Agregar comentarios al FormData
      let comentarios = this.documentoForm.get('comentarios')?.value || '';

      // Si es un DNI, agregar información sobre el lado en los comentarios
      if (this.esTipoDNI() && this.documentoForm.get('ladoDNI')?.value) {
        const lado = this.documentoForm.get('ladoDNI')?.value;
        const ladoTexto = lado === 'frente' ? 'Frente (Anverso)' : 'Dorso (Reverso)';

        if (comentarios) {
          comentarios = `${ladoTexto} - ${comentarios}`;
        } else {
          comentarios = `${ladoTexto} del DNI`;
        }
      }

      if (comentarios) {
        formData.append('comentarios', comentarios);
      }

      // Imprimir el FormData para debug
      console.log('[DocumentoUpload] FormData contenido:', {
        file: this.selectedFile.name,
        tipoDocumentoId: tipoDocumentoId || 'no seleccionado',
        comentarios: comentarios || 'no proporcionados'
      });

      // Verificar si el tipo de documento es válido
      const tipoValido = this.tiposDocumento.some(tipo => tipo.id === tipoDocumentoId);
      if (!tipoValido) {
        console.warn(`[DocumentoUpload] El ID del tipo de documento '${tipoDocumentoId}' no coincide con ningún tipo disponible en el sistema`);
        console.log('[DocumentoUpload] Tipos disponibles:', this.tiposDocumento.map(t => ({ id: t.id, nombre: t.nombre })));

        // Intentar encontrar un tipo similar
        const tipoSimilar = this.tiposDocumento.find(tipo =>
          tipo.nombre.toLowerCase().includes(tipoDocumentoId.toLowerCase()) ||
          tipoDocumentoId.toLowerCase().includes(tipo.nombre.toLowerCase())
        );

        if (tipoSimilar) {
          console.log(`[DocumentoUpload] Se encontró un tipo similar: ${tipoSimilar.nombre} (${tipoSimilar.id})`);
          tipoDocumentoId = tipoSimilar.id;
          formData.delete('tipoDocumentoId');
          formData.append('tipoDocumentoId', tipoSimilar.id);
        }
      }

      this.documentosService.uploadDocumento(formData)
        .pipe(
          finalize(() => {
            this.isUploading = false;
            this.uploadProgress = 0;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('[DocumentoUpload] Respuesta del servidor:', response);
            this.snackBar.open('Documento cargado exitosamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('[DocumentoUpload] Error al cargar documento:', error);

            // Mostrar información detallada sobre el error
            let mensajeError = 'Error al cargar el documento. Por favor, intente nuevamente.';

            if (error.error) {
              console.error('[DocumentoUpload] Detalles del error:', error.error);
              mensajeError = error.error.message || mensajeError;
            }

            if (error.status === 500) {
              mensajeError = 'Error interno del servidor. Es posible que el tipo de documento no sea válido o que el archivo no cumpla con los requisitos.';
            }

            this.snackBar.open(mensajeError, 'Cerrar', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}