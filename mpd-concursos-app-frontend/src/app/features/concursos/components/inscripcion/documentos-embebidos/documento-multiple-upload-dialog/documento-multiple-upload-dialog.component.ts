import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoValidationService, DocumentoValidationError } from  '@core/services/documentos/documento-validation.service';
import { TipoDocumento, DocumentoUsuario } from '@core/models/documento.model';
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
  estado: 'pendiente' | 'validando' | 'subiendo' | 'completado' | 'error';
  mensajeError?: string;
  validationWarnings: DocumentoValidationError[];
  queueId?: string;
  documentoId?: string;
  configurado: boolean; // Indica si el documento ya tiene asignado un tipo y está listo para subir
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
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    CustomSelectComponent
  ],
  template: `
    <div class="multiple-upload-dialog">
      <h2 mat-dialog-title>Carga Múltiple de Documentos</h2>

      <mat-dialog-content>
        <p class="dialog-description">
          Selecciona un documento, asígnale un tipo y continúa agregando más documentos según necesites.
        </p>

        <!-- Mensaje informativo cuando todos los documentos requeridos están completos -->
        <div class="info-message" *ngIf="todosDocumentosRequeridosCompletos">
          <mat-icon class="info-icon">check_circle</mat-icon>
          <div class="info-text">
            <h3>¡Documentación requerida completa!</h3>
            <p>Has subido todos los documentos requeridos. Si deseas adjuntar documentación adicional, puedes hacerlo aquí o en la sección de Curriculum en Mi Perfil.</p>
          </div>
        </div>

        <!-- Mensaje cuando no hay opciones disponibles -->
        <div class="no-options-message" *ngIf="tiposDocumentoOptions.length === 0 && !uploading">
          <mat-icon>info</mat-icon>
          <p>No hay tipos de documentos disponibles para subir. Todos los documentos requeridos ya han sido subidos.</p>
        </div>

        <!-- Selector de documento actual -->
        <div class="documento-actual-container" *ngIf="mostrarSelectorDocumento && tiposDocumentoOptions.length > 0">
          <h3>Seleccionar documento</h3>

          <!-- Área de selección de archivo -->
          <div class="file-upload-container"
               [class.has-file]="documentoActual.file !== null"
               [class.drag-over]="isDragging"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDropSingle($event)">

            <div class="upload-icon">
              <mat-icon>{{documentoActual.file ? getFileIcon(documentoActual.file) : 'cloud_upload'}}</mat-icon>
            </div>

            <div class="upload-text">
              <ng-container *ngIf="!documentoActual.file">
                <p>Arrastra y suelta tu archivo aquí o</p>
                <button type="button" mat-raised-button color="primary" (click)="fileInput.click()">
                  Seleccionar archivo
                </button>
                <p class="upload-hint">Formatos permitidos: PDF, JPG, PNG (Máx. 10MB)</p>
              </ng-container>

              <ng-container *ngIf="documentoActual.file">
                <p class="file-name">{{documentoActual.file.name}}</p>
                <p class="file-size">{{formatFileSize(documentoActual.file.size)}}</p>
                <button type="button" mat-button color="warn" (click)="removeCurrentFile()">
                  <mat-icon>delete</mat-icon> Eliminar
                </button>
              </ng-container>
            </div>

            <input type="file"
                   #fileInput
                   style="display: none"
                   accept=".pdf,.jpg,.jpeg,.png"
                   (change)="onSingleFileSelected($event)">
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
              <button mat-raised-button color="primary"
                      [disabled]="!canAddCurrentDocument()"
                      (click)="addCurrentDocument()">
                <mat-icon>add</mat-icon> Agregar documento
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de documentos configurados -->
        <div class="selected-files-container" *ngIf="documentosParaSubir.length > 0">
          <h3>Documentos seleccionados ({{documentosParaSubir.length}})</h3>

          <!-- Progreso global -->
          <div class="global-progress" *ngIf="uploading">
            <p>Progreso global: {{progresoGlobal}}%</p>
            <mat-progress-bar [value]="progresoGlobal"></mat-progress-bar>
          </div>

          <div class="file-list">
            <div class="file-item" *ngFor="let doc of documentosParaSubir; let i = index">
              <div class="file-item-header">
                <div class="file-icon">
                  <mat-icon>{{getFileIcon(doc.file)}}</mat-icon>
                </div>
                <div class="file-info">
                  <p class="file-name">{{doc.file.name}}</p>
                  <p class="file-size">{{formatFileSize(doc.file.size)}}</p>
                  <p class="file-type">{{doc.tipoDocumentoNombre}}</p>
                </div>
                <button mat-icon-button color="warn" (click)="removeFile(i)"
                        [disabled]="uploading"
                        matTooltip="Eliminar archivo">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <!-- Barra de progreso individual -->
              <div class="file-progress" *ngIf="doc.estado !== 'pendiente'">
                <div class="progress-status">
                  <span [ngClass]="getEstadoClass(doc.estado)">
                    <mat-icon>{{getEstadoIcon(doc.estado)}}</mat-icon>
                    {{getEstadoTexto(doc.estado)}}
                  </span>
                  <span class="progress-percentage" *ngIf="doc.estado === 'subiendo'">
                    {{doc.progreso}}%
                  </span>
                </div>
                <mat-progress-bar [value]="doc.progreso"
                                  [color]="doc.estado === 'error' ? 'warn' : 'primary'">
                </mat-progress-bar>
                <p class="error-message" *ngIf="doc.mensajeError">{{doc.mensajeError}}</p>
              </div>

              <!-- Advertencias de validación -->
              <div class="validation-warnings" *ngIf="doc.validationWarnings && doc.validationWarnings.length > 0">
                <p class="warning-title">Advertencias:</p>
                <ul>
                  <li *ngFor="let warning of doc.validationWarnings">
                    <mat-icon>warning</mat-icon> {{warning.message}}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false" [disabled]="uploading">Cancelar</button>
        <button mat-raised-button color="primary"
                (click)="uploadDocuments()"
                [disabled]="!canUpload() || uploading">
          <mat-icon>cloud_upload</mat-icon>
          Subir {{documentosParaSubir.length}} documentos
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .multiple-upload-dialog {
      max-width: 800px;
    }

    .dialog-description {
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      background-color: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4caf50;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .info-icon {
      color: #4caf50;
      margin-right: 12px;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .info-text h3 {
      margin: 0 0 8px 0;
      color: #4caf50;
      font-size: 16px;
      font-weight: 500;
    }

    .info-text p {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      line-height: 1.4;
    }

    .documento-actual-container {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .documento-actual-container h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.9);
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
      border-color: #3f51b5;
      background: rgba(63, 81, 181, 0.1);
    }

    .file-upload-container.has-files {
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

    .upload-hint {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .selected-files-container {
      margin-top: 1.5rem;
    }

    .selected-files-container h3 {
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .global-progress {
      margin-bottom: 1.5rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .global-progress p {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
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
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
    }

    .file-item-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }

    .file-icon {
      margin-right: 1rem;
    }

    .file-icon mat-icon {
      font-size: 2rem;
      height: 2rem;
      width: 2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      margin: 0;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      word-break: break-all;
    }

    .file-size {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
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
      color: rgba(255, 255, 255, 0.87);
      font-size: 14px;
      font-weight: 500;
    }

    .custom-input {
      width: 100%;
      padding: 14px 16px;
      background-color: #2d2d2d;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 16px;
      transition: all 0.3s ease;
      height: 52px;
      box-sizing: border-box;
    }

    .custom-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .custom-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .custom-input:disabled {
      opacity: 0.6;
      background-color: rgba(45, 45, 45, 0.7);
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

    .progress-status mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }

    .estado-validando {
      color: #ff9800;
    }

    .estado-subiendo {
      color: #2196f3;
    }

    .estado-completado {
      color: #4caf50;
    }

    .estado-error {
      color: #f44336;
    }

    .error-message {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #f44336;
    }

    .validation-warnings {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 152, 0, 0.1);
      border-radius: 4px;
      border-left: 3px solid #ff9800;
    }

    .warning-title {
      margin: 0 0 0.5rem;
      font-weight: 500;
      color: #ff9800;
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
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0.25rem;
    }

    .validation-warnings mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
      color: #ff9800;
    }

    .no-options-message {
      display: flex;
      align-items: center;
      background-color: rgba(33, 150, 243, 0.1);
      border-left: 4px solid #2196f3;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .no-options-message mat-icon {
      color: #2196f3;
      margin-right: 12px;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .no-options-message p {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      line-height: 1.4;
    }

    mat-dialog-content {
      max-height: 70vh;
    }
  `]
})
export class DocumentoMultipleUploadDialogComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentoForm') documentoForm: NgForm | null = null;

  tiposDocumento: TipoDocumento[] = [];
  tiposDocumentoOptions: SelectOption[] = [];
  documentosParaSubir: DocumentoParaSubir[] = [];
  isDragging = false;
  uploading = false;
  progresoGlobal = 0;

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

  constructor(
    private dialogRef: MatDialogRef<DocumentoMultipleUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private documentosService: DocumentosService,
    private documentoValidationService: DocumentoValidationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Si se proporcionaron tipos de documento en los datos, usarlos
    if (this.data && this.data.tiposDocumento) {
      console.log('[DocumentoMultipleUpload] Usando tipos de documento proporcionados:', this.data.tiposDocumento);
      this.documentosRequeridos = this.data.tiposDocumento.filter((tipo: TipoDocumento) => tipo.requerido);
      this.tiposDocumento = this.data.tiposDocumento;

      // Cargar los documentos del usuario para saber cuáles faltan
      this.cargarDocumentosUsuario();
    } else {
      // Si no, cargarlos desde el servicio
      this.cargarTiposDocumento();
    }
  }

  cargarDocumentosUsuario(): void {
    this.documentosService.getDocumentosUsuario().subscribe({
      next: (documentos) => {
        console.log('[DocumentoMultipleUpload] Documentos del usuario obtenidos:', documentos);
        this.documentosUsuario = documentos;
        this.calcularDocumentosFaltantes();
      },
      error: (error) => {
        console.error('[DocumentoMultipleUpload] Error al cargar documentos del usuario:', error);
        this.mostrarError('Error al cargar tus documentos');
        // En caso de error, mostrar todos los tipos de documento
        this.convertirTiposAOpciones();
      }
    });
  }

  calcularDocumentosFaltantes(): void {
    // Filtrar los documentos requeridos que aún no han sido subidos
    this.documentosFaltantes = this.documentosRequeridos.filter(tipoDoc =>
      !this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipoDoc.id)
    );

    console.log('[DocumentoMultipleUpload] Documentos faltantes:', this.documentosFaltantes);

    // Verificar si todos los documentos requeridos están completos
    this.todosDocumentosRequeridosCompletos = this.documentosFaltantes.length === 0;

    // Convertir a opciones para el select
    this.convertirTiposAOpciones();
  }

  cargarTiposDocumento(): void {
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        console.log('[DocumentoMultipleUpload] Tipos de documento obtenidos:', tipos);
        this.tiposDocumento = tipos;
        this.documentosRequeridos = tipos.filter(tipo => tipo.requerido);

        // Cargar los documentos del usuario para saber cuáles faltan
        this.cargarDocumentosUsuario();
      },
      error: (error) => {
        console.error('[DocumentoMultipleUpload] Error al cargar tipos de documento:', error);
        this.mostrarError('Error al cargar los tipos de documento');
      }
    });
  }

  convertirTiposAOpciones(): void {
    // Obtener los tipos de documento ya seleccionados en la sesión actual
    const tiposSeleccionados = this.documentosParaSubir.map(doc => doc.tipoDocumentoId);

    if (this.todosDocumentosRequeridosCompletos) {
      // Si todos los documentos requeridos están completos, mostrar todos los tipos de documento
      // excepto los que ya están seleccionados
      this.tiposDocumentoOptions = this.tiposDocumento
        .filter(tipo => !tiposSeleccionados.includes(tipo.id))
        .map(tipo => ({
          value: tipo.id,
          label: tipo.nombre
        }));
    } else {
      // Si faltan documentos requeridos, mostrar solo los faltantes
      // excepto los que ya están seleccionados
      this.tiposDocumentoOptions = this.documentosFaltantes
        .filter(tipo => !tiposSeleccionados.includes(tipo.id))
        .map(tipo => ({
          value: tipo.id,
          label: tipo.nombre + ' (Requerido)'
        }));

      // Agregar los documentos no requeridos al final
      // excepto los que ya están seleccionados o ya subidos
      const documentosNoRequeridos = this.tiposDocumento.filter(tipo =>
        !tipo.requerido &&
        !this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipo.id) &&
        !tiposSeleccionados.includes(tipo.id)
      );

      documentosNoRequeridos.forEach(tipo => {
        this.tiposDocumentoOptions.push({
          value: tipo.id,
          label: tipo.nombre
        });
      });
    }

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

    // Crear un nuevo documento para subir
    const nuevoDocumento: DocumentoParaSubir = {
      file: this.documentoActual.file!,
      tipoDocumentoId: this.documentoActual.tipoDocumentoId,
      tipoDocumentoNombre: tipoDocumento.nombre,
      comentarios: this.documentoActual.comentarios,
      progreso: 0,
      estado: 'pendiente',
      validationWarnings: [],
      configurado: true
    };

    // Añadir a la lista de documentos para subir
    this.documentosParaSubir.push(nuevoDocumento);

    // Actualizar las opciones de tipos de documento disponibles
    this.actualizarTiposDocumentoDisponibles();

    // Limpiar el documento actual para permitir seleccionar otro
    this.resetDocumentoActual();

    // Mostrar mensaje de éxito
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

    this.uploading = true;
    this.progresoGlobal = 0;

    // Primero validamos todos los documentos
    this.validarDocumentos().then(() => {
      // Luego subimos los documentos uno por uno
      this.subirDocumentosSecuencialmente();
    });
  }

  async validarDocumentos(): Promise<void> {
    for (const doc of this.documentosParaSubir) {
      doc.estado = 'validando';
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

    try {
      // Preparar arrays para la carga múltiple
      const files: File[] = [];
      const tipoDocumentoIds: string[] = [];
      const comentarios: string[] = [];

      // Mapear documentos válidos a los arrays
      this.documentosParaSubir.forEach(doc => {
        if (doc.estado !== 'error') {
          files.push(doc.file);
          tipoDocumentoIds.push(doc.tipoDocumentoId);
          comentarios.push(doc.comentarios || '');

          // Actualizar estado a 'validando'
          doc.estado = 'validando';
          doc.progreso = 10;
        }
      });

      // Actualizar progreso global
      this.actualizarProgresoGlobal();

      // Encolar documentos en el backend
      this.documentosService.enqueueMultipleDocumentos(files, tipoDocumentoIds, comentarios)
        .subscribe({
          next: (queueIds) => {
            console.log('Documentos encolados correctamente:', queueIds);

            // Asignar IDs de cola a los documentos
            let index = 0;
            this.documentosParaSubir.forEach(doc => {
              if (doc.estado !== 'error') {
                doc.queueId = queueIds[index++];
                doc.estado = 'subiendo';
                doc.progreso = 30;
              }
            });

            // Actualizar progreso global
            this.actualizarProgresoGlobal();

            // Iniciar monitoreo de estado
            this.monitorearEstadoDocumentos(queueIds);
          },
          error: (error) => {
            console.error('Error al encolar documentos:', error);

            // Marcar todos los documentos como error
            this.documentosParaSubir.forEach(doc => {
              if (doc.estado !== 'error') {
                doc.estado = 'error';
                doc.mensajeError = 'Error al encolar el documento: ' + (error.message || 'Error desconocido');
              }
            });

            this.uploading = false;
            this.mostrarError('Error al encolar documentos para su procesamiento');
          }
        });
    } catch (error) {
      console.error('Error inesperado al subir documentos:', error);
      this.uploading = false;
      this.mostrarError('Error inesperado al subir documentos');
    }
  }

  /**
   * Monitorea el estado de los documentos en cola
   * @param queueIds IDs de las tareas en cola
   */
  monitorearEstadoDocumentos(queueIds: string[]): void {
    // Crear un intervalo para consultar el estado
    const intervalo = setInterval(() => {
      // Verificar si todos los documentos están completados o con error
      const todosCompletados = this.documentosParaSubir.every(doc =>
        doc.estado === 'completado' || doc.estado === 'error' || doc.estado === 'pendiente'
      );

      if (todosCompletados) {
        // Detener el intervalo
        clearInterval(intervalo);

        // Finalizar proceso
        this.finalizarProceso();
        return;
      }

      // Obtener estado de los documentos en cola
      this.documentosService.getMultipleDocumentosStatus(queueIds)
        .subscribe({
          next: (statuses) => {
            // Actualizar estado de los documentos
            statuses.forEach(status => {
              const doc = this.documentosParaSubir.find(d => d.queueId === safeGet(status, 'queueId'));
              if (doc) {
                // Actualizar progreso
                doc.progreso = safeGet(status, 'progress', 0) as number;

                // Actualizar estado
                const statusValue = safeGet(status, 'status', '') as string;

                if (statusValue === 'PENDING') {
                  doc.estado = 'pendiente';
                } else if (statusValue === 'PROCESSING' || statusValue === 'VALIDATING') {
                  doc.estado = 'validando';
                } else if (statusValue === 'UPLOADING') {
                  doc.estado = 'subiendo';
                } else if (statusValue === 'COMPLETED') {
                  doc.estado = 'completado';
                  doc.documentoId = safeGet(status, 'documentId', '') as string;
                  doc.progreso = 100;
                } else if (statusValue === 'ERROR') {
                  doc.estado = 'error';
                  doc.mensajeError = safeGet(status, 'errorMessage', 'Error desconocido') as string;
                }
              }
            });

            // Actualizar progreso global
            this.actualizarProgresoGlobal();

            // Verificar si todos los documentos están completados o con error después de la actualización
            const completadosDespuesDeActualizar = this.documentosParaSubir.every(doc =>
              doc.estado === 'completado' || doc.estado === 'error' || doc.estado === 'pendiente'
            );

            if (completadosDespuesDeActualizar) {
              // Detener el intervalo
              clearInterval(intervalo);

              // Finalizar proceso
              this.finalizarProceso();
            }
          },
          error: (error) => {
            console.error('Error al obtener estado de documentos:', error);
          }
        });
    }, 2000); // Consultar cada 2 segundos
  }

  /**
   * Finaliza el proceso de carga de documentos
   */
  finalizarProceso(): void {
    this.uploading = false;

    // Contar documentos completados y totales
    const documentosCompletados = this.documentosParaSubir.filter(doc => doc.estado === 'completado').length;
    const totalDocumentos = this.documentosParaSubir.filter(doc => doc.estado !== 'pendiente').length;

    if (documentosCompletados === totalDocumentos) {
      this.mostrarExito(`Se han subido ${documentosCompletados} documentos correctamente`);
      this.dialogRef.close(true);
    } else if (documentosCompletados > 0) {
      this.mostrarAdvertencia(`Se han subido ${documentosCompletados} de ${totalDocumentos} documentos`);
    } else {
      this.mostrarError('No se pudo subir ningún documento');
    }
  }

  actualizarProgresoGlobal(): void {
    // Calcular progreso global basado en el progreso individual de cada documento
    const documentosValidos = this.documentosParaSubir.filter(doc => doc.estado !== 'error');
    if (documentosValidos.length === 0) {
      this.progresoGlobal = 0;
      return;
    }

    const sumaProgresos = documentosValidos.reduce((sum, doc) => sum + doc.progreso, 0);
    this.progresoGlobal = Math.round(sumaProgresos / documentosValidos.length);
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type === 'application/pdf') {
      return 'picture_as_pdf';
    } else {
      return 'insert_drive_file';
    }
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado}`;
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'validando': return 'pending';
      case 'subiendo': return 'cloud_upload';
      case 'completado': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
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
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['warning-snackbar']
    });
  }

  // Este método se añade por compatibilidad, pero ahora procesamos los archivos uno por uno
  processFiles(files: File[]): void {
    // Si hay archivos, procesar solo el primero
    if (files.length > 0) {
      this.processSingleFile(files[0]);
    }
  }
}
