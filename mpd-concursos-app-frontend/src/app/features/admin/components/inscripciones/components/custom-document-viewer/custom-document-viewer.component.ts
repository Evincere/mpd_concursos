import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';

// Servicios
import { AdminInscriptionsService, InscriptionDocument, DocumentStatusUpdateRequest } from '@core/services/admin/admin-inscriptions.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-custom-document-viewer',
  templateUrl: './custom-document-viewer.component.html',
  styleUrls: ['./custom-document-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomTextareaComponent,
    ValidationErrorComponent
  ]
})
export class CustomDocumentViewerComponent implements OnInit, OnDestroy {
  @Input() document!: InscriptionDocument;
  @Input() inscriptionId!: string;
  @Input() isDialog = true;

  @Output() closeEvent = new EventEmitter<void>();
  @Output() documentUpdated = new EventEmitter<InscriptionDocument>();

  @ViewChild('pdfViewer') pdfViewer!: ElementRef;

  // Estado del visor
  isLoading = true;
  isSaving = false;
  pdfSrc: string | ArrayBuffer | null = null;
  currentPage = 1;
  totalPages = 0;
  zoom = 1;
  rotation = 0;

  // Formulario de comentarios
  commentForm: FormGroup;

  // Opciones para selects
  statusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'APPROVED', label: 'Aprobado' },
    { value: 'REJECTED', label: 'Rechazado' }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscriptionsService: AdminInscriptionsService,
    private notificationService: NotificationService
  ) {
    // Inicializar formulario de comentarios
    this.commentForm = this.fb.group({
      status: ['', Validators.required],
      observations: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit(): void {
    if (this.document) {
      this.loadDocument();

      // Inicializar formulario con valores actuales
      this.commentForm.patchValue({
        status: this.document.status,
        observations: this.document.observations || ''
      });
    } else {
      this.notificationService.error('No se ha especificado un documento para visualizar');
      this.closeEvent.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cargar documento
  loadDocument(): void {
    this.isLoading = true;

    // Abrir documento en nueva pestaña (para simplificar)
    window.open(this.document.downloadUrl, '_blank');

    // Simular carga completada
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);

    // Nota: En una implementación real, aquí se cargaría el PDF en el visor integrado
    // utilizando una biblioteca como pdf.js o ngx-extended-pdf-viewer
  }

  // Actualizar estado del documento
  updateDocumentStatus(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const formValue = this.commentForm.value;
    const request: DocumentStatusUpdateRequest = {
      status: formValue.status as 'APPROVED' | 'REJECTED',
      observations: formValue.observations
    };

    this.isSaving = true;

    this.inscriptionsService.updateDocumentStatus(this.inscriptionId, this.document.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDocument) => {
          this.notificationService.success(`Documento ${formValue.status === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente`);
          this.documentUpdated.emit(updatedDocument);
          this.isSaving = false;

          // Actualizar documento local
          this.document = {
            ...this.document,
            status: formValue.status as 'APPROVED' | 'REJECTED',
            observations: formValue.observations
          };
        },
        error: (error) => {
          console.error(`Error actualizando estado de documento con ID ${this.document.id}:`, error);
          this.notificationService.error('Error al actualizar el estado del documento');
          this.isSaving = false;
        }
      });
  }

  // Descargar documento
  downloadDocument(): void {
    window.open(this.document.downloadUrl, '_blank');
  }

  // Cerrar el componente
  onClose(): void {
    this.closeEvent.emit();
  }

  // Controles del visor
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

  zoomIn(): void {
    this.zoom = Math.min(this.zoom + 0.25, 3);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - 0.25, 0.5);
  }

  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  // Formatear fecha y hora
  formatDateTime(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Obtener clase CSS según estado
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  // Obtener etiqueta según estado
  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  }
}
