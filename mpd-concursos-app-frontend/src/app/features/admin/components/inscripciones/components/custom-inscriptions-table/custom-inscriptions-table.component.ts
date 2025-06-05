import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';

// Interfaces y modelos
import { AdminInscription, InscriptionFilter } from '@core/services/admin/admin-inscriptions.service';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';

// Servicios
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-custom-inscriptions-table',
  templateUrl: './custom-inscriptions-table.component.html',
  styleUrls: ['./custom-inscriptions-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomTableComponent,
    CustomTableColumnComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    ValidationErrorComponent
  ]
})
export class CustomInscriptionsTableComponent implements OnInit, OnChanges {
  @Input() inscriptions: AdminInscription[] = [];
  @Input() isLoading = false;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() contests: { value: number, label: string }[] = [];

  @Output() viewInscription = new EventEmitter<AdminInscription>();
  @Output() approveInscription = new EventEmitter<AdminInscription>();
  @Output() rejectInscription = new EventEmitter<AdminInscription>();
  @Output() filterChange = new EventEmitter<InscriptionFilter>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number, pageSize: number }>();
  @Output() sortChange = new EventEmitter<{ property: string, direction: 'asc' | 'desc' }>();

  // Columnas de la tabla
  columns = [
    { property: 'id', header: 'ID', sortable: true, width: '80px' },
    { property: 'userFullName', header: 'Postulante', sortable: true },
    { property: 'contestTitle', header: 'Concurso', sortable: true },
    { property: 'documentsCount', header: 'Documentos', sortable: true, width: '120px' },
    { property: 'state', header: 'Estado', sortable: true, width: '120px' },
    { property: 'updatedAt', header: 'Actualización', sortable: true, width: '150px' },
    { property: 'actions', header: 'Acciones', width: '120px' }
  ];

  // Opciones para filtros
  statusOptions = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: InscripcionState.ACTIVE, label: 'Activa' },
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.COMPLETED_WITH_DOCS, label: 'Completada con Documentos' },
    { value: InscripcionState.COMPLETED_PENDING_DOCS, label: 'Completada - Documentos Pendientes' },
    { value: InscripcionState.FROZEN, label: 'Congelada' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' },
    { value: InscripcionState.CANCELLED, label: 'Cancelada' },
    { value: InscripcionState.IN_PROCESS, label: 'En Proceso (Legacy)' }
  ];

  documentStatusOptions = [
    { value: 'ALL', label: 'Todos los documentos' },
    { value: 'PENDING', label: 'Documentos pendientes' },
    { value: 'APPROVED', label: 'Documentos aprobados' },
    { value: 'REJECTED', label: 'Documentos rechazados' }
  ];

  // Formulario de filtros
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      contestId: [''],
      documentStatus: ['ALL'],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    // Suscribirse a cambios en el formulario
    this.filterForm.valueChanges.subscribe(() => {
      this.emitFilterChange();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Actualizar datos cuando cambian las entradas
    if (changes['contests'] && !changes['contests'].firstChange) {
      // Actualizar opciones de concursos si es necesario
    }
  }

  // Emitir cambios en filtros
  emitFilterChange(): void {
    const formValues = this.filterForm.value;

    const filter: InscriptionFilter = {
      search: formValues.search,
      status: formValues.status !== 'ALL' ? formValues.status : undefined,
      contestId: formValues.contestId || undefined,
      documentStatus: formValues.documentStatus !== 'ALL' ? formValues.documentStatus : undefined,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      page: this.pageIndex + 1,
      size: this.pageSize
    };

    this.filterChange.emit(filter);
  }

  // Manejar cambio de página
  onPageChange(event: { pageIndex: number, pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.pageChange.emit(event);
    this.emitFilterChange();
  }

  // Manejar cambio de ordenamiento
  onSortChange(event: { property: string, direction: string }): void {
    this.sortChange.emit({
      property: event.property,
      direction: event.direction as 'asc' | 'desc'
    });
  }

  // Manejar clic en fila
  onRowClick(inscription: AdminInscription): void {
    this.viewInscription.emit(inscription);
  }

  // Manejar clic en botón de aprobar
  onApproveClick(inscription: AdminInscription, event: Event): void {
    event.stopPropagation(); // Evitar que se propague al clic de fila
    this.approveInscription.emit(inscription);
  }

  // Manejar clic en botón de rechazar
  onRejectClick(inscription: AdminInscription, event: Event): void {
    event.stopPropagation(); // Evitar que se propague al clic de fila
    this.rejectInscription.emit(inscription);
  }

  // Limpiar filtros
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      contestId: '',
      documentStatus: 'ALL',
      startDate: null,
      endDate: null
    });

    this.emitFilterChange();
  }

  // Obtener clase CSS según estado
  getStatusClass(status: InscripcionState): string {
    switch (status) {
      case InscripcionState.PENDING:
        return 'status-pending';
      case InscripcionState.APPROVED:
        return 'status-approved';
      case InscripcionState.REJECTED:
        return 'status-rejected';
      case InscripcionState.CANCELLED:
        return 'status-cancelled';
      case InscripcionState.IN_PROCESS:
        return 'status-in-process';
      default:
        return '';
    }
  }

  // Obtener etiqueta según estado usando la nueva lógica unificada
  getStatusLabel(status: InscripcionState): string {
    return InscripcionStateUtils.getStateLabel(status);
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
}
