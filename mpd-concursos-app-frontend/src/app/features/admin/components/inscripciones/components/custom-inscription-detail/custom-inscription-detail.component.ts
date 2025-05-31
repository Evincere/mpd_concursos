import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';

// Servicios
import { AdminInscriptionsService, InscriptionDetail, InscriptionDocument, DocumentStatusUpdateRequest, InscriptionStatusUpdateRequest } from '@core/services/admin/admin-inscriptions.service';
import { NotificationService } from '@shared/services/notification.service';

// Modelos
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

@Component({
  selector: 'app-custom-inscription-detail',
  templateUrl: './custom-inscription-detail.component.html',
  styleUrls: ['./custom-inscription-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomTabsComponent,
    CustomTabComponent,
    CustomTextareaComponent,
    ValidationErrorComponent
  ]
})
export class CustomInscriptionDetailComponent implements OnInit, OnDestroy {
  @Input() inscriptionId!: string;
  @Input() isDialog = true;

  @Output() closeEvent = new EventEmitter<void>();
  @Output() inscriptionUpdated = new EventEmitter<void>();

  // Datos de la inscripción
  inscriptionDetail: InscriptionDetail | null = null;

  // Formularios
  statusForm: FormGroup;

  // Estado de la UI
  isLoading = true;
  isSaving = false;
  activeTab = 0;

  // Opciones para selects
  statusOptions = [
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' }
  ];

  documentStatusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'APPROVED', label: 'Aprobado' },
    { value: 'REJECTED', label: 'Rechazado' }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private notificationService: NotificationService
  ) {
    // Inicializar formulario de estado
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      observations: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit(): void {
    if (this.inscriptionId) {
      this.loadInscriptionDetail();
    } else {
      this.notificationService.error('No se ha especificado una inscripción para ver');
      this.closeEvent.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cargar detalle de inscripción
  loadInscriptionDetail(): void {
    this.isLoading = true;

    this.inscripcionesService.getInscriptionById(this.inscriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.inscriptionDetail = detail;
          this.statusForm.patchValue({
            status: detail.inscription.state,
            observations: detail.inscription.observations || ''
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error obteniendo detalle de inscripción con ID ${this.inscriptionId}:`, error);
          this.notificationService.error('Error al cargar el detalle de la inscripción');
          this.isLoading = false;
          this.closeEvent.emit();
        }
      });
  }

  // Actualizar estado de inscripción
  updateInscriptionStatus(): void {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const formValue = this.statusForm.value;
    const request: InscriptionStatusUpdateRequest = {
      status: formValue.status,
      observations: formValue.observations
    };

    this.isSaving = true;

    this.inscripcionesService.updateInscriptionStatus(this.inscriptionId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Estado de inscripción actualizado correctamente');
          this.loadInscriptionDetail();
          this.inscriptionUpdated.emit();
          this.isSaving = false;
        },
        error: (error) => {
          console.error(`Error actualizando estado de inscripción con ID ${this.inscriptionId}:`, error);
          this.notificationService.error('Error al actualizar el estado de la inscripción');
          this.isSaving = false;
        }
      });
  }

  // Actualizar estado de documento
  updateDocumentStatus(document: InscriptionDocument, newStatus: 'APPROVED' | 'REJECTED', observations?: string): void {
    const request: DocumentStatusUpdateRequest = {
      status: newStatus,
      observations: observations
    };

    this.isSaving = true;

    this.inscripcionesService.updateDocumentStatus(this.inscriptionId, document.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(`Documento ${newStatus === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente`);
          this.loadInscriptionDetail();
          this.inscriptionUpdated.emit();
          this.isSaving = false;
        },
        error: (error) => {
          console.error(`Error actualizando estado de documento con ID ${document.id}:`, error);
          this.notificationService.error('Error al actualizar el estado del documento');
          this.isSaving = false;
        }
      });
  }

  // Descargar documento
  downloadDocument(document: InscriptionDocument): void {
    window.open(document.downloadUrl, '_blank');
  }

  // Cerrar el componente
  onClose(): void {
    this.closeEvent.emit();
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

  // Formatear fecha
  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Obtener clase CSS según estado de documento
  getDocumentStatusClass(status: string): string {
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

  // Obtener etiqueta según estado de documento
  getDocumentStatusLabel(status: string): string {
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

  // Obtener cantidad de documentos por estado
  getDocumentsCount(status: string): number {
    if (!this.inscriptionDetail || !this.inscriptionDetail.documents) {
      return 0;
    }
    return this.inscriptionDetail.documents.filter(d => d.status === status).length;
  }
}
