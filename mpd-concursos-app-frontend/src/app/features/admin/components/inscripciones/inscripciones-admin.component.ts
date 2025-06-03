import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
// Servicios personalizados (reemplazan Material UI)
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/services/custom-notification.service';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomConfirmDialogComponent } from '@shared/components/custom-confirm-dialog/custom-confirm-dialog.component';
import { CustomInscriptionsTableComponent } from './components/custom-inscriptions-table/custom-inscriptions-table.component';
import { CustomInscriptionDetailComponent } from './components/custom-inscription-detail/custom-inscription-detail.component';
import { CustomDocumentViewerComponent } from './components/custom-document-viewer/custom-document-viewer.component';
import { InscripcionDetalleAdminComponent } from './components/inscripcion-detalle/inscripcion-detalle-admin.component';

// Servicios
import { AdminInscriptionsService, InscriptionFilter, InscriptionPage, AdminInscription } from '../../../../core/services/admin/admin-inscriptions.service';
import { AdminConcursosService } from '../../../../core/services/admin/admin-concursos.service';
import { NotificationService } from '@shared/services/notification.service';

// Modelos
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

@Component({
  selector: 'app-inscripciones-admin',
  templateUrl: './inscripciones-admin.component.html',
  styleUrls: ['./inscripciones-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Componentes personalizados (sin Material UI)
    CustomButtonComponent,
    CustomCardComponent,
    CustomConfirmDialogComponent,
    CustomInscriptionsTableComponent,
    CustomInscriptionDetailComponent,
    CustomDocumentViewerComponent
  ]
})
export class InscripcionesAdminComponent implements OnInit, OnDestroy {
  // Tabla y paginación
  displayedColumns: string[] = ['id', 'userInfo', 'contestInfo', 'documents', 'dates', 'status', 'actions'];
  dataSource: AdminInscription[] = [];
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Filtros
  filterForm: FormGroup;
  contests: { value: number, label: string }[] = [];

  statusOptions: { value: InscripcionState | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' },
    { value: InscripcionState.CANCELLED, label: 'Cancelada' },
    { value: InscripcionState.IN_PROCESS, label: 'En Proceso' }
  ];

  documentStatusOptions: { value: string, label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobados' },
    { value: 'REJECTED', label: 'Rechazados' }
  ];

  // Estado de la UI
  isLoading = false;
  activeTab = 0;

  // Estado de ordenamiento (reemplaza MatSort)
  currentSort: { property: string, direction: 'asc' | 'desc' } = { property: 'id', direction: 'desc' };

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private concursosService: AdminConcursosService,
    private customDialogService: CustomDialogService,
    private customNotificationService: CustomNotificationService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      contestId: [''],
      documentStatus: ['ALL'],
      startDate: [null],
      endDate: [null]
    });

    // Aplicar filtros de la ruta si existen
    const routeData = this.route.snapshot.data;
    if (routeData && routeData['filter']) {
      const filter = routeData['filter'];
      if (filter.status) {
        this.filterForm.get('status')?.setValue(filter.status);
      }
      if (filter.documentStatus) {
        this.filterForm.get('documentStatus')?.setValue(filter.documentStatus);
      }
      if (filter.contestId) {
        this.filterForm.get('contestId')?.setValue(filter.contestId);
      }
    }
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.setupFilterListeners();
    this.loadInscripciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterOptions(): void {
    this.concursosService.getConcursos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.contests = response.content.map(concurso => ({
          value: concurso.id as number,
          label: concurso.title
        }));
      });
  }

  setupFilterListeners(): void {
    // Aplicar debounce al campo de búsqueda
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscripciones();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscripciones();
      });

    this.filterForm.get('contestId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscripciones();
      });

    this.filterForm.get('documentStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscripciones();
      });
  }

  loadInscripciones(): void {
    this.isLoading = true;

    const filters: InscriptionFilter = {
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      contestId: this.filterForm.get('contestId')?.value,
      documentStatus: this.filterForm.get('documentStatus')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.pageIndex,
      size: this.pageSize,
      sort: this.currentSort.property,
      direction: this.currentSort.direction
    };

    this.inscripcionesService.getInscriptions(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InscriptionPage) => {
          this.dataSource = response.content;
          this.totalItems = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando inscripciones:', error);
          this.customNotificationService.showError('Error al cargar las inscripciones');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: { pageIndex: number, pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInscripciones();
  }

  onSortChange(sort: { property: string, direction: 'asc' | 'desc' }): void {
    // Actualizar el ordenamiento según los valores de sort.property y sort.direction
    this.currentSort = sort;
    console.log('Ordenando por:', sort.property, 'en dirección:', sort.direction);
    this.loadInscripciones();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      contestId: '',
      documentStatus: 'ALL',
      startDate: null,
      endDate: null
    });
    this.pageIndex = 0;
    this.loadInscripciones();
  }

  viewInscripcion(inscripcion: AdminInscription): void {
    const dialogRef = this.customDialogService.open(InscripcionDetalleAdminComponent, {
      width: '90%',
      height: '90%',
      data: { inscriptionId: inscripcion.id }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadInscripciones();
      }
    });
  }

  updateStatus(inscripcion: AdminInscription, newStatus: InscripcionState | string): void {
    // Convertir el valor a InscripcionState si es una cadena
    const status = typeof newStatus === 'string' ?
      (Object.values(InscripcionState).includes(newStatus as InscripcionState) ?
        newStatus as InscripcionState :
        InscripcionState.ACTIVE) :
      newStatus;

    const dialogRef = this.customDialogService.open(CustomConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Cambiar Estado de Inscripción`,
        message: `¿Está seguro que desea cambiar el estado de la inscripción a "${this.getStatusLabel(status)}"?`,
        confirmButtonText: 'Cambiar Estado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.isLoading = true;
        this.inscripcionesService.updateInscriptionStatus(inscripcion.id, {
          status: status,
          observations: result.textareaValue
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInscripciones();
              this.customNotificationService.showSuccess(`Estado de inscripción cambiado a ${this.getStatusLabel(status)}`);
            },
            error: (error) => {
              console.error('Error cambiando estado de inscripción:', error);
              this.customNotificationService.showError('Error al cambiar el estado de la inscripción');
              this.isLoading = false;
            }
          });
      }
    });
  }

  getStatusLabel(status: InscripcionState | string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : String(status);
  }

  getStatusClass(status: InscripcionState | string): string {
    // Convertir el valor a InscripcionState si es una cadena
    const statusValue = typeof status === 'string' ?
      (Object.values(InscripcionState).includes(status as InscripcionState) ?
        status as InscripcionState :
        InscripcionState.ACTIVE) :
      status;

    switch (statusValue) {
      case InscripcionState.PENDING: return 'status-pending';
      case InscripcionState.APPROVED: return 'status-approved';
      case InscripcionState.REJECTED: return 'status-rejected';
      case InscripcionState.CANCELLED: return 'status-cancelled';
      case InscripcionState.IN_PROCESS: return 'status-in-process';
      default: return '';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
