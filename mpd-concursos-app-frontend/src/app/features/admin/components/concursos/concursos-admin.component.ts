import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminConcursosService, ConcursoFilter, ConcursoPage } from '../../../../core/services/admin/admin-concursos.service';
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { NotificationService } from '@shared/services/notification.service';
import { DialogService } from '@shared/services/dialog/dialog.service';
import { ExportService } from '../../../../core/services/admin/export.service';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTableComponent, TableColumn, SortEvent, PageEvent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';

import { ConcursoFormDialogComponent } from './components/concurso-form-dialog/concurso-form-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-concursos-admin',
  templateUrl: './concursos-admin.component.html',
  styleUrls: ['./concursos-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomTableComponent,
    CustomTableColumnComponent,
    ConfirmDialogComponent
  ]
})
export class ConcursosAdminComponent implements OnInit, OnDestroy {
  // Datos y paginación
  dataSource: Concurso[] = [];
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Filtros
  filterForm: FormGroup;
  departments: string[] = [];
  positions: string[] = [];
  categories: string[] = [];


  // Estado de la UI
  isLoading = false;
  viewMode: 'cards' | 'table' = 'cards';

  // Menú de acciones
  openMenuId: string | null = null;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private exportService: ExportService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      department: [''],
      position: [''],
      category: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.setupFilterListeners();
    this.loadConcursos();
    this.setupDocumentClickListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterOptions(): void {
    this.concursosService.getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(departments => this.departments = departments);

    this.concursosService.getPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(positions => this.positions = positions);

    this.concursosService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => this.categories = categories);
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
        this.loadConcursos();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('department')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('position')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadConcursos();
      });
  }

  loadConcursos(): void {
    this.isLoading = true;

    const filters: ConcursoFilter = {
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      department: this.filterForm.get('department')?.value,
      position: this.filterForm.get('position')?.value,
      category: this.filterForm.get('category')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.pageIndex,
      size: this.pageSize,
      sortBy: 'id',
      sortDirection: 'desc'
    };

    this.concursosService.getConcursos(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ConcursoPage) => {
          this.dataSource = response.content;
          this.totalItems = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando concursos:', error);
          this.notificationService.error('Error al cargar los concursos');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadConcursos();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      department: '',
      position: '',
      category: '',
      startDate: null,
      endDate: null
    });
    this.pageIndex = 0;
    this.loadConcursos();
  }

  createConcurso(): void {
    this.router.navigate(['/admin/concursos/nuevo']);
  }

  editConcurso(concurso: Concurso): void {
    if (!concurso) return;

    const dialogRef = this.dialogService.open(ConcursoFormDialogComponent, {
      title: 'Editar Concurso',
      icon: 'edit',
      size: 'large',
      data: { mode: 'edit', concurso: concurso },
      panelClass: ['glassmorphism-dialog', 'concurso-form-dialog-container'],
      showCloseButton: true,
      showFooter: false,
      showCancelButton: false,
      showConfirmButton: false
    });

    dialogRef.afterClosed$.subscribe((result: unknown) => {
      if (result) {
        this.loadConcursos();
        this.notificationService.success('Concurso actualizado correctamente');
      }
    });
  }

  deleteConcurso(concurso: Concurso): void {
    if (!concurso) return;

    // Verificar que el concurso esté en estado DRAFT
    if (concurso.status !== 'DRAFT') {
      this.notificationService.error('Solo se pueden eliminar concursos en estado borrador');
      return;
    }

    this.dialogService.confirm({
      title: 'Eliminar Concurso',
      message: `¿Está seguro que desea eliminar el concurso "${concurso.title}"?`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      icon: 'trash',
      size: 'small'
    }).afterClosed$.subscribe((result: boolean) => {
      if (result) {
        this.isLoading = true;
        this.concursosService.deleteConcurso(concurso.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadConcursos();
              this.notificationService.success('Concurso eliminado correctamente');
            },
            error: (error: unknown) => {
              console.error('Error eliminando concurso:', error);
              this.notificationService.error('Error al eliminar el concurso');
              this.isLoading = false;
            }
          });
      }
    });
  }



  getStatusLabel(status: ContestStatus | string): string {
    if (!status) return 'Sin estado';

    // Mapeo directo de estados sin depender de statusOptions
    const statusLabels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'ACTIVE': 'Activo',
      'IN_PROGRESS': 'En Proceso',
      'CLOSED': 'Cerrado',
      'CANCELLED': 'Cancelado'
    };

    return statusLabels[status] || status;
  }

  getStatusClass(status: ContestStatus | string): string {
    if (!status) return 'status-unknown';
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'ACTIVE': return 'status-active';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'CLOSED': return 'status-closed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  // Métodos para el template refactorizado
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  getDepartmentOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todas las dependencias' },
      ...this.departments.map(dept => ({ value: dept, label: dept }))
    ];
  }

  getPositionOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todos los cargos' },
      ...this.positions.map(pos => ({ value: pos, label: pos }))
    ];
  }

  getCategoryOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todas las categorías' },
      ...this.categories.map(cat => ({ value: cat, label: cat }))
    ];
  }

  getStatusOptions(): { value: string; label: string }[] {
    return [
      { value: 'ALL', label: 'Todos' },
      { value: 'DRAFT', label: 'Borrador' },
      { value: 'ACTIVE', label: 'Activo' },
      { value: 'IN_PROGRESS', label: 'En Proceso' },
      { value: 'CLOSED', label: 'Cerrado' },
      { value: 'CANCELLED', label: 'Cancelado' }
    ];
  }

  exportData(): void {
    if (!this.dataSource || this.dataSource.length === 0) {
      this.notificationService.error('No hay datos para exportar');
      return;
    }

    // Preparar los datos para exportación
    const dataToExport = this.dataSource.map(concurso => ({
      ID: concurso.id,
      Título: concurso.title || 'Sin título',
      Descripción: concurso.description || 'Sin descripción',
      Cargo: concurso.position || 'No especificado',
      Categoría: concurso.category || 'No especificado',
      Clase: concurso.class || 'No especificado',
      Funciones: concurso.functions || 'No especificado',
      Dependencia: concurso.department || 'No especificado',
      Organismo: concurso.dependencia || 'No especificado',
      Estado: this.getStatusLabel(concurso.status || ''),
      'Fecha de Inicio': this.formatDate(concurso.startDate) || 'No definida',
      'Fecha de Fin': this.formatDate(concurso.endDate) || 'No definida',
      'URL de Términos': concurso.termsUrl || 'No especificado',
      'URL de Perfil': concurso.profileUrl || 'No especificado'
    }));

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `concursos_${timestamp}`;

    // Exportar en formato Excel por defecto
    this.exportService.exportData(dataToExport, {
      format: 'excel',
      fileName: fileName,
      includeHeaders: true
    });

    this.notificationService.success(`Datos exportados como ${fileName}.xlsx`);
  }

  onSortChange(event: SortEvent): void {
    // TODO: Implementar ordenamiento
    console.log('Sort change:', event);
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadConcursos();
    }
  }

  nextPage(): void {
    if ((this.pageIndex + 1) * this.pageSize < this.totalItems) {
      this.pageIndex++;
      this.loadConcursos();
    }
  }

  // Métodos para el menú de acciones
  toggleActionMenu(concursoId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === concursoId ? null : concursoId;
  }

  viewConcursoDetails(concurso: Concurso): void {
    this.closeActionMenu();
    this.router.navigate(['/admin/concursos/detalle', concurso.id]);
  }

  manageConcursoDates(concurso: Concurso): void {
    this.closeActionMenu();
    this.router.navigate(['/admin/concursos/fechas', concurso.id]);
  }



  private closeActionMenu(): void {
    this.openMenuId = null;
  }

  private setupDocumentClickListener(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        this.closeActionMenu();
      }
    });
  }

  // Exponer Math para el template
  Math = Math;
}
