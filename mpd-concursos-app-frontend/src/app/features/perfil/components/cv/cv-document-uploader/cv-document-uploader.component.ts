/**
 * Componente Uploader Específico para Documentos de CV
 * 
 * @description Componente especializado para la carga de documentos que acrediten
 * experiencia laboral y educación en el CV del usuario
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

// Servicios
import { CvNotificationService } from '@core/services/cv/cv-notification.service';

// Modelos
export interface CvDocument {
  id?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  documentType: 'work_experience' | 'education';
  entityId?: string;
  uploadDate: Date;
  status: 'pending' | 'validated' | 'rejected';
  validationNotes?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: CvDocument;
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
export class CvDocumentUploaderComponent implements OnInit, OnDestroy {

  // ===== INPUTS =====
  @Input() documentType: 'work_experience' | 'education' = 'work_experience';
  @Input() entityId: string | null = null;
  @Input() required = true;
  @Input() maxFiles = 3;
  @Input() acceptedFormats: string[] = ['pdf', 'jpg', 'jpeg', 'png'];
  @Input() maxFileSize = 10; // MB
  @Input() disabled = false;

  // ===== OUTPUTS =====
  @Output() documentsChange = new EventEmitter<CvDocument[]>();
  @Output() validationChange = new EventEmitter<DocumentValidationState>();
  @Output() uploadProgress = new EventEmitter<number>();

  // ===== SIGNALS =====
  public readonly documents = signal<CvDocument[]>([]);
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

  constructor(
    private notificationService: CvNotificationService
  ) { }

  ngOnInit(): void {
    this.loadExistingDocuments();
    this.validateDocuments();
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
  removeDocument(document: CvDocument): void {
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
  retryUpload(document: CvDocument): void {
    // Implementar lógica de reintento
    this.notificationService.showInfo('Reintentando carga del documento...');
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
   * Sube un archivo al servidor
   */
  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.uploadProgress$.set(0);

    // Crear documento temporal
    const tempDocument: CvDocument = {
      fileName: `temp_${Date.now()}`,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType: this.documentType,
      entityId: this.entityId || undefined,
      uploadDate: new Date(),
      status: 'pending'
    };

    // Agregar a la lista temporalmente
    const currentDocs = this.documents();
    this.documents.set([...currentDocs, tempDocument]);

    // Simular progreso de carga (reemplazar con llamada real al servicio)
    this.simulateUploadProgress(tempDocument, file);
  }

  /**
   * Simula el progreso de carga (temporal)
   */
  private simulateUploadProgress(document: CvDocument, file: File): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.completeUpload(document, file);
      }
      this.uploadProgress$.set(progress);
      this.uploadProgress.emit(progress);
    }, 200);
  }

  /**
   * Completa la carga del archivo
   */
  private completeUpload(tempDocument: CvDocument, file: File): void {
    // Actualizar documento con datos reales del servidor
    const completedDocument: CvDocument = {
      ...tempDocument,
      id: `doc_${Date.now()}`, // En producción, esto vendría del servidor
      fileName: `cv_${this.documentType}_${Date.now()}.${file.name.split('.').pop()}`,
      status: 'pending'
    };

    // Actualizar en la lista
    const currentDocs = this.documents();
    const updatedDocs = currentDocs.map(doc =>
      doc.fileName === tempDocument.fileName ? completedDocument : doc
    );

    this.documents.set(updatedDocs);
    this.documentsChange.emit(updatedDocs);
    this.validateDocuments();

    this.isUploading.set(false);
    this.uploadProgress$.set(0);

    this.notificationService.showSuccess(
      `Documento "${file.name}" cargado correctamente. Pendiente de validación.`
    );
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
  trackByDocumentId(index: number, document: CvDocument): string {
    return document.id || document.fileName;
  }

  /**
   * Obtiene el icono según el tipo MIME
   */
  getDocumentIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word')) return 'description';
    return 'insert_drive_file';
  }

  /**
   * Obtiene el icono del estado
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'validated': return 'check_circle';
      case 'rejected': return 'cancel';
      default: return 'help';
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
   * Visualiza un documento
   */
  viewDocument(document: CvDocument): void {
    // Implementar visualización del documento
    this.notificationService.showInfo('Abriendo documento...');
  }
}
