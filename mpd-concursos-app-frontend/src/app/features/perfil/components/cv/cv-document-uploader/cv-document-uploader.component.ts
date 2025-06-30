/**
 * Componente Uploader Específico para Documentos de CV
 * 
 * @description Componente especializado para la carga de documentos que acrediten
 * experiencia laboral y educación en el CV del usuario
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

// Servicios
import { CvNotificationService } from '@core/services/cv/cv-notification.service';
import { BasicDialogService } from '@shared/services/dialog/basic-dialog.service';
import { TempDocumentCacheService, TempDocument } from '@core/services/cv/temp-document-cache.service';

// Componentes
import { DocumentoViewerComponent } from '../../documento-viewer/documento-viewer.component';

// Modelos para el uploader de documentos

/**
 * Interfaz base para documentos en el uploader
 * Usada tanto para documentos temporales como existentes
 */
export interface CvDocumentBase {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  documentType: 'work_experience' | 'education';
  uploadDate: Date;
  status: 'pending' | 'validated' | 'rejected';
  validationNotes?: string;
  entityId?: string;
}

/**
 * Interfaz para documentos temporales (en cache)
 * Extiende CvDocumentBase con propiedades específicas del cache
 */
export interface CvDocument extends CvDocumentBase, Omit<TempDocument, 'entityType' | 'id' | 'fileName' | 'originalFileName' | 'fileSize' | 'mimeType' | 'uploadDate'> {
  // Hereda todas las propiedades de TempDocument excepto las que ya están en CvDocumentBase
}

/**
 * Interfaz para documentos existentes (del servidor)
 * Solo las propiedades básicas sin cache
 */
export interface ExistingCvDocument extends CvDocumentBase {
  // Solo las propiedades básicas para documentos que ya existen en el servidor
}

export interface DocumentUploadResult {
  success: boolean;
  document?: CvDocumentBase;
  error?: string;
}

export interface DocumentValidationState {
  isValid: boolean;
  hasRequiredDocuments: boolean;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-cv-document-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-document-uploader.component.html',
  styleUrls: ['./cv-document-uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvDocumentUploaderComponent implements OnInit, OnChanges, OnDestroy {

  // ===== INPUTS =====
  @Input() documentType: 'work_experience' | 'education' = 'work_experience';
  @Input() entityId: string | null = null;
  @Input() required = true;
  @Input() maxFiles = 3;
  @Input() acceptedFormats: string[] = ['pdf', 'jpg', 'jpeg', 'png'];
  @Input() maxFileSize = 10; // MB
  @Input() disabled = false;

  // ===== OUTPUTS =====
  @Output() documentsChange = new EventEmitter<CvDocumentBase[]>();
  @Output() validationChange = new EventEmitter<DocumentValidationState>();
  @Output() uploadProgress = new EventEmitter<number>();

  // ===== SIGNALS =====
  public readonly documents = signal<CvDocumentBase[]>([]);
  public readonly isUploading = signal(false);
  public readonly uploadProgress$ = signal(0);
  public readonly isDragging = signal(false);
  public readonly validationState = signal<DocumentValidationState>({
    isValid: false,
    hasRequiredDocuments: false,
    errors: [],
    warnings: []
  });

  // ===== COMPUTED =====
  public readonly canUploadMore = computed(() =>
    this.documents().length < this.maxFiles && !this.disabled
  );

  public readonly acceptedFormatsText = computed(() =>
    this.acceptedFormats.map(format => format.toUpperCase()).join(', ')
  );

  public readonly documentTypeLabel = computed(() =>
    this.documentType === 'work_experience' ? 'Experiencia Laboral' : 'Educación'
  );

  public readonly hasDocuments = computed(() => this.documents().length > 0);

  public readonly totalSize = computed(() =>
    this.documents().reduce((total, doc) => total + doc.fileSize, 0)
  );

  // ===== PROPIEDADES PRIVADAS =====
  private readonly destroy$ = new Subject<void>();
  private previousEntityId: string | null = null;

  constructor(
    private notificationService: CvNotificationService,
    private dialog: BasicDialogService,
    private tempDocumentCache: TempDocumentCacheService
  ) { }

  ngOnInit(): void {
    this.previousEntityId = this.entityId;
    this.loadExistingDocuments();
    this.validateDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId']) {
      const currentEntityId = changes['entityId'].currentValue;
      const previousEntityId = changes['entityId'].previousValue;

      // Si el entityId cambió de un valor a null (nuevo formulario) o a otro valor diferente
      if (previousEntityId !== undefined && currentEntityId !== previousEntityId) {
        this.clearDocuments();
        this.loadExistingDocuments();
      }

      this.previousEntityId = currentEntityId;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Obtiene la cadena de formatos aceptados para el input file
   */
  getAcceptedFormatsString(): string {
    return this.acceptedFormats.map(format => '.' + format).join(',');
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
  }

  /**
   * Maneja el drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragging.set(true);
    }
  }

  /**
   * Maneja el drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /**
   * Maneja el drop de archivos
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  /**
   * Elimina un documento
   */
  removeDocument(document: CvDocumentBase): void {
    if (this.disabled) return;

    const currentDocs = this.documents();
    const updatedDocs = currentDocs.filter(doc => doc.id !== document.id);

    this.documents.set(updatedDocs);
    this.documentsChange.emit(updatedDocs);
    this.validateDocuments();

    // Si el documento ya está en el servidor, eliminarlo
    if (document.id) {
      this.deleteDocumentFromServer(document.id);
    }

    this.notificationService.showSuccess('Documento eliminado correctamente');
  }

  /**
   * Reintenta la carga de un documento
   */
  retryUpload(document: CvDocumentBase): void {
    // Implementar lógica de reintento
    this.notificationService.showInfo('Reintentando carga del documento...');
  }

  /**
   * Limpia todos los documentos del componente
   */
  clearDocuments(): void {
    this.documents.set([]);
    this.isUploading.set(false);
    this.uploadProgress$.set(0);
    this.isDragging.set(false);
    this.validationState.set({
      isValid: false,
      hasRequiredDocuments: false,
      errors: [],
      warnings: []
    });

    // Emitir cambios
    this.documentsChange.emit([]);
    this.validationChange.emit(this.validationState());
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Procesa los archivos seleccionados
   */
  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));

    if (validFiles.length === 0) return;

    // Verificar límite de archivos
    const currentCount = this.documents().length;
    const availableSlots = this.maxFiles - currentCount;

    if (validFiles.length > availableSlots) {
      this.notificationService.showWarning(
        `Solo puedes subir ${availableSlots} archivo(s) más. Límite máximo: ${this.maxFiles}`
      );
      validFiles.splice(availableSlots);
    }

    // Procesar cada archivo válido
    validFiles.forEach(file => this.uploadFile(file));
  }

  /**
   * Valida un archivo individual
   */
  private validateFile(file: File): boolean {
    // Validar formato
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.acceptedFormats.includes(fileExtension)) {
      this.notificationService.showError(
        `Formato no permitido: ${fileExtension}. Formatos aceptados: ${this.acceptedFormatsText()}`
      );
      return false;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxFileSize) {
      this.notificationService.showError(
        `El archivo "${file.name}" excede el tamaño máximo de ${this.maxFileSize}MB`
      );
      return false;
    }

    return true;
  }

  /**
   * Procesa un archivo y lo guarda en cache temporal
   */
  private async uploadFile(file: File): Promise<void> {
    this.isUploading.set(true);
    this.uploadProgress$.set(0);

    try {
      console.log(`[CvDocumentUploader] 📁 Guardando archivo en cache temporal: ${file.name}`);

      // Guardar en cache temporal
      const tempDoc = await this.tempDocumentCache.saveDocument(
        file,
        this.documentType === 'work_experience' ? 'experience' : 'education',
        this.entityId || undefined
      );

      // Convertir a CvDocumentBase para compatibilidad
      const cvDocument: CvDocumentBase = {
        id: tempDoc.id,
        fileName: tempDoc.fileName,
        originalFileName: tempDoc.originalFileName,
        fileSize: tempDoc.fileSize,
        mimeType: tempDoc.mimeType,
        documentType: this.documentType,
        uploadDate: tempDoc.uploadDate,
        status: 'pending',
        entityId: tempDoc.entityId
      };

      // Agregar a la lista
      const currentDocs = this.documents();
      this.documents.set([...currentDocs, cvDocument]);
      this.documentsChange.emit([...currentDocs, cvDocument]);
      this.validateDocuments();

      // Simular progreso para UX
      this.simulateProgress();

      this.notificationService.showSuccess(
        `Documento "${file.name}" cargado en cache. Listo para previsualización.`
      );

    } catch (error) {
      console.error('[CvDocumentUploader] ❌ Error guardando archivo en cache:', error);
      this.notificationService.showError(
        `Error al cargar el documento "${file.name}": ${error}`
      );
    } finally {
      this.isUploading.set(false);
      this.uploadProgress$.set(0);
    }
  }



  /**
   * Simula progreso de carga para mejor UX
   */
  private simulateProgress(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      this.uploadProgress$.set(progress);
      this.uploadProgress.emit(progress);
    }, 100);
  }

  /**
   * Obtiene todos los documentos temporales para envío al servidor
   * Este método será llamado por el formulario principal al enviar
   */
  getTempDocuments(): TempDocument[] {
    const currentDocs = this.documents();
    return currentDocs
      .filter(doc => this.tempDocumentCache.isTempDocument(doc.id || ''))
      .map(doc => {
        const tempDoc = this.tempDocumentCache.getDocument(doc.id || '');
        return tempDoc;
      })
      .filter(doc => doc !== null) as TempDocument[];
  }

  /**
   * Limpia documentos temporales después del envío exitoso
   */
  clearTempDocuments(): void {
    const currentDocs = this.documents();
    const tempDocIds = currentDocs
      .filter(doc => this.tempDocumentCache.isTempDocument(doc.id || ''))
      .map(doc => doc.id || '');

    // Eliminar del cache
    tempDocIds.forEach(id => this.tempDocumentCache.removeDocument(id));

    // Limpiar la lista local
    this.documents.set([]);
    this.documentsChange.emit([]);
    this.validateDocuments();

    console.log('[CvDocumentUploader] 🧹 Documentos temporales limpiados');
  }

  /**
   * Carga documentos existentes
   */
  private loadExistingDocuments(): void {
    if (!this.entityId) return;

    // Implementar carga de documentos existentes desde el servidor
    // this.documentosService.getDocumentsByEntity(this.entityId, this.documentType)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(documents => {
    //     this.documents.set(documents);
    //     this.documentsChange.emit(documents);
    //     this.validateDocuments();
    //   });
  }

  /**
   * Elimina documento del servidor
   */
  private deleteDocumentFromServer(documentId: string): void {
    // Implementar eliminación en el servidor
    // this.documentosService.deleteDocument(documentId)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe();
  }

  /**
   * Valida el estado de los documentos
   */
  private validateDocuments(): void {
    const docs = this.documents();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar documentos requeridos
    const hasRequiredDocuments = this.required ? docs.length > 0 : true;

    if (this.required && docs.length === 0) {
      errors.push(`Es obligatorio adjuntar al menos un documento para ${this.documentTypeLabel()}`);
    }

    // Validar estado de documentos
    const rejectedDocs = docs.filter(doc => doc.status === 'rejected');
    if (rejectedDocs.length > 0) {
      errors.push(`${rejectedDocs.length} documento(s) fueron rechazados y deben ser reemplazados`);
    }

    const pendingDocs = docs.filter(doc => doc.status === 'pending');
    const validatedDocs = docs.filter(doc => doc.status === 'validated');

    // REGLA DE NEGOCIO: Los documentos pendientes son válidos para permitir guardar la experiencia
    // Solo se muestran como warnings informativos para el usuario
    if (pendingDocs.length > 0) {
      warnings.push(`${pendingDocs.length} documento(s) están pendientes de validación administrativa`);
    }

    if (validatedDocs.length > 0) {
      warnings.push(`${validatedDocs.length} documento(s) validados correctamente`);
    }

    // Los documentos son válidos si:
    // 1. Hay al menos un documento cargado (cuando es requerido)
    // 2. No hay documentos rechazados
    // 3. Los documentos pueden estar pendientes o validados
    const hasValidDocuments = this.required ? docs.length > 0 && rejectedDocs.length === 0 : true;

    const validationState: DocumentValidationState = {
      isValid: errors.length === 0 && hasValidDocuments,
      hasRequiredDocuments,
      errors,
      warnings
    };

    this.validationState.set(validationState);
    this.validationChange.emit(validationState);
  }

  // ===== MÉTODOS PARA EL TEMPLATE =====

  /**
   * TrackBy function para la lista de documentos
   */
  trackByDocumentId(index: number, document: CvDocumentBase): string {
    return document.id || document.fileName;
  }

  /**
   * Obtiene el icono según el tipo MIME
   */
  getDocumentIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('image')) return 'file-image';
    if (mimeType.includes('word')) return 'file-word';
    return 'file';
  }

  /**
   * Obtiene el icono del estado
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'clock';
      case 'validated': return 'check-circle';
      case 'rejected': return 'times-circle';
      default: return 'question-circle';
    }
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'validated': return 'Validado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  /**
   * Visualiza un documento usando el selector de visualizadores
   */
  viewDocument(document: CvDocumentBase): void {
    if (!document.id) {
      this.notificationService.showError('No se puede visualizar el documento: ID no disponible');
      return;
    }

    // Usar el visualizador de documentos con el servicio básico
    this.dialog.open(DocumentoViewerComponent, {
      title: 'Visualizador de documento',
      size: 'large',
      data: { documentoId: document.id },
      showCloseButton: true
    });
  }
}
