import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmDialogService } from '../../../../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminInscriptionsService, InscriptionFilter, AdminInscription } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { CustomButtonComponent } from 'src/app/shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from 'src/app/shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from 'src/app/shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from 'src/app/shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from 'src/app/shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTableComponent } from 'src/app/shared/components/custom-form/custom-table/custom-table.component';
import { ConcursosService } from 'src/app/core/services/concursos/concursos.service';

@Component({
  selector: 'app-inscripciones-lifecycle',
  templateUrl: './inscripciones-lifecycle.component.html',
  styleUrls: ['./inscripciones-lifecycle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    PaginatorComponent,
    LoadingSpinnerComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomTableComponent
  ]
})
export class InscripcionesLifecycleComponent implements OnInit, OnDestroy {
  dataSource: AdminInscription[] = [];

  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;

  statusOptions: { value: InscripcionState | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' },
    { value: InscripcionState.CANCELLED, label: 'Cancelada' },
    { value: InscripcionState.IN_PROCESS, label: 'En Proceso' }
  ];

  selectedInscription: AdminInscription | null = null;

  // Estado para el manejo del ciclo de vida
  newState: InscripcionState | null = null;
  canChangeStatus = false;
  availableStates: { value: InscripcionState, label: string }[] = [];

  private destroy$ = new Subject<void>();

  // Columnas para la tabla custom-table
  columns = [
    { property: 'userFullName', header: 'Postulante' },
    { property: 'contestTitle', header: 'Concurso' },
    { property: 'state', header: 'Estado' },
    { property: 'createdAt', header: 'Creada' },
    { property: 'updatedAt', header: 'Actualizada' },
    { property: 'actions', header: 'Acciones' }
  ];

  // Opciones de concursos para el filtro (dinámico)
  contestOptions: { value: string | number, label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private concursosService: ConcursosService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      contestId: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.concursosService.getConcursos().subscribe(concursos => {
      this.contestOptions = [
        { value: '', label: 'Todos' },
        ...concursos.map(c => ({ value: c.id, label: c.title }))
      ];
    });
    this.setupFilterListeners();
    this.loadInscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterListeners(): void {
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscriptions();
      });

    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscriptions();
      });

    this.filterForm.get('contestId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscriptions();
      });

    this.filterForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscriptions();
      });

    this.filterForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadInscriptions();
      });
  }

  loadInscriptions(): void {
    this.isLoading = true;

    const filters: InscriptionFilter = {
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value !== 'ALL' ? this.filterForm.get('status')?.value : undefined,
      contestId: this.filterForm.get('contestId')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.pageIndex,
      size: this.pageSize
    };

    this.inscripcionesService.getInscriptions(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.content;
          this.totalItems = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando inscripciones:', error);
          this.toast.error('Error al cargar las inscripciones');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInscriptions();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      contestId: '',
      startDate: null,
      endDate: null
    });
    this.pageIndex = 0;
    this.loadInscriptions();
  }

  getStatusLabel(state: InscripcionState): string {
    const option = this.statusOptions.find(opt => opt.value === state);
    return option?.label || state;
  }

  getStatusClass(state: string): string {
    return `status-${state.toLowerCase()}`;
  }

  selectInscription(inscription: AdminInscription): void {
    this.selectedInscription = inscription;
    this.updateAvailableStates();
  }

  clearSelection(): void {
    this.selectedInscription = null;
    this.newState = null;
    this.availableStates = [];
  }

  updateAvailableStates(): void {
    if (!this.selectedInscription) return;

    // Lógica para determinar los estados disponibles según el estado actual
    this.availableStates = [];
    const currentState = this.selectedInscription.state;

    switch (currentState) {
      case InscripcionState.PENDING:
        this.availableStates = [
          { value: InscripcionState.IN_PROCESS, label: 'En Proceso' },
          { value: InscripcionState.REJECTED, label: 'Rechazar' }
        ];
        break;
      case InscripcionState.IN_PROCESS:
        this.availableStates = [
          { value: InscripcionState.APPROVED, label: 'Aprobar' },
          { value: InscripcionState.REJECTED, label: 'Rechazar' }
        ];
        break;
      case InscripcionState.APPROVED:
        this.availableStates = [
          { value: InscripcionState.CANCELLED, label: 'Cancelar' }
        ];
        break;
      default:
        this.availableStates = [];
    }

    this.canChangeStatus = this.availableStates.length > 0;
  }

  cancelStateChange(): void {
    this.newState = null;
  }

  applyStateChange(): void {
    if (!this.selectedInscription || !this.newState) return;

    this.confirmDialog.confirm({
      title: 'Confirmar cambio de estado',
      message: `¿Está seguro que desea cambiar el estado de la inscripción a "${this.getStatusLabel(this.newState)}"?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.inscripcionesService.updateInscriptionStatus(this.selectedInscription!.id, { status: this.newState! })
          .subscribe({
            next: (updatedInscription: AdminInscription) => {
              this.toast.success('Estado actualizado correctamente');
              this.selectedInscription = updatedInscription;
              this.newState = null;
              this.updateAvailableStates();
              this.loadInscriptions(); // Recargar la lista
            },
            error: (error) => {
              this.toast.error('Error al actualizar el estado');
              console.error('Error updating inscription state:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          });
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
