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
import { LoggingService } from '../../../../core/services/logging/logging.service'; // Import LoggingService

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
    ConfirmDialogComponent // Ensure ConfirmDialogComponent is standalone or imported correctly
  ]
})
export class ConcursosAdminComponent implements OnInit, OnDestroy {
  // Data and pagination
  dataSource: Concurso[] = [];
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Filters
  filterForm: FormGroup;
  departments: string[] = [];
  positions: string[] = [];
  categories: string[] = [];

  // UI State
  isLoading = false;
  viewMode: 'cards' | 'table' = 'cards';

  // Action menu state
  openMenuId: string | null = null;

  // For cleaning up subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private exportService: ExportService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ConcursosAdminComponent] Constructor: Initializing filter form.', undefined, 'ConcursosAdmin');
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      department: [''],
      position: [''],
      category: [''],
      startDate: [null],
      endDate: [null],
      sortBy: ['id'], // Default sort by ID
      sortDirection: ['desc'] // Default sort direction descending
    });
  }

  ngOnInit(): void {
    this.loggingService.info('[ConcursosAdminComponent] Component initialized.', undefined, 'ConcursosAdmin');
    this.loadFilterOptions();
    this.setupFilterListeners();
    this.loadConcursos();
    this.setupDocumentClickListener();
  }

  ngOnDestroy(): void {
    this.loggingService.info('[ConcursosAdminComponent] Component destroyed. Cleaning up subscriptions.', undefined, 'ConcursosAdmin');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads filter options (departments, positions, categories) from the service.
   */
  loadFilterOptions(): void {
    this.loggingService.debug('[ConcursosAdminComponent] Loading filter options.', undefined, 'ConcursosAdmin');
    this.concursosService.getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments: any) => {
          this.departments = departments;
          this.loggingService.debug('[ConcursosAdminComponent] Departments loaded:', departments, 'ConcursosAdmin');
        },
        error: (error: any) => {
          this.loggingService.error('[ConcursosAdminComponent] Error loading departments:', error, 'ConcursosAdmin');
        }
      });

    this.concursosService.getPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (positions: any) => {
          this.positions = positions;
          this.loggingService.debug('[ConcursosAdminComponent] Positions loaded:', positions, 'ConcursosAdmin');
        },
        error: (error: any) => {
          this.loggingService.error('[ConcursosAdminComponent] Error loading positions:', error, 'ConcursosAdmin');
        }
      });

    this.concursosService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: any) => {
          this.categories = categories;
          this.loggingService.debug('[ConcursosAdminComponent] Categories loaded:', categories, 'ConcursosAdmin');
        },
        error: (error: any) => {
          this.loggingService.error('[ConcursosAdminComponent] Error loading categories:', error, 'ConcursosAdmin');
        }
      });
  }

  /**
   * Sets up listeners for filter form changes to trigger data reloading.
   */
  setupFilterListeners(): void {
    this.loggingService.debug('[ConcursosAdminComponent] Setting up filter listeners.', undefined, 'ConcursosAdmin');
    // Apply debounce to the search field
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] Search filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    // Listen for changes in other filters
    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] Status filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('department')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] Department filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('position')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] Position filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] Category filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    // Listen for date range changes
    this.filterForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] StartDate filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });

    this.filterForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursosAdminComponent] EndDate filter changed. Reloading concursos.', undefined, 'ConcursosAdmin');
        this.pageIndex = 0;
        this.loadConcursos();
      });
  }

  /**
   * Loads contests based on current filters and pagination settings.
   */
  loadConcursos(): void {
    this.isLoading = true;
    const filters: ConcursoFilter = {
      ...this.filterForm.value, // Get all form values directly
      page: this.pageIndex,
      size: this.pageSize
    };

    // Clean up empty string filters to avoid sending unnecessary params
    Object.keys(filters).forEach(key => {
      const typedKey = key as keyof ConcursoFilter;
      if (filters[typedKey] === '' || filters[typedKey] === null) {
        delete filters[typedKey];
      }
    });

    this.loggingService.info('[ConcursosAdminComponent] Loading concursos with filters:', filters, 'ConcursosAdmin');

    this.concursosService.getConcursos(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ConcursoPage) => {
          this.dataSource = response.content;
          this.totalItems = response.totalElements;
          this.isLoading = false;
          this.loggingService.info(`[ConcursosAdminComponent] Concursos loaded successfully. Total: ${this.totalItems}`, response, 'ConcursosAdmin');
        },
        error: (error) => {
          this.loggingService.error('[ConcursosAdminComponent] Error loading contests:', error, 'ConcursosAdmin');
          this.notificationService.error('Error al cargar los concursos. Por favor, intente de nuevo.');
          this.isLoading = false;
        }
      });
  }

  /**
   * Handles page change events from the custom table.
   * @param event The PageEvent containing pageIndex and pageSize.
   */
  onPageChange(event: PageEvent): void {
    this.loggingService.debug('[ConcursosAdminComponent] Page change event:', event, 'ConcursosAdmin');
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadConcursos();
  }

  /**
   * Handles sort change events from the custom table.
   * @param event The SortEvent containing the column and direction.
   */
  onSortChange(event: SortEvent): void {
    this.loggingService.debug('[ConcursosAdminComponent] Sort change event received:', event, 'ConcursosAdmin');
    if (event && event.property) {
      const currentSortBy = this.filterForm.get('sortBy')?.value;
      const currentSortDirection = this.filterForm.get('sortDirection')?.value;

      if (currentSortBy === event.property) {
        // Toggle direction if same column
        this.filterForm.get('sortDirection')?.setValue(currentSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // Set new column and default to asc
        this.filterForm.get('sortBy')?.setValue(event.property);
        this.filterForm.get('sortDirection')?.setValue('asc');
      }
    } else {
      // Reset sorting if no column is provided
      this.filterForm.get('sortBy')?.setValue('id'); // Default sort field
      this.filterForm.get('sortDirection')?.setValue('desc'); // Default sort direction
    }
    this.pageIndex = 0; // Reset page index on sort change
    this.loadConcursos();
  }

  /**
   * Resets all filters in the form and reloads contests.
   */
  resetFilters(): void {
    this.loggingService.info('[ConcursosAdminComponent] Resetting filters.', undefined, 'ConcursosAdmin');
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      department: '',
      position: '',
      category: '',
      startDate: null,
      endDate: null,
      sortBy: 'id',
      sortDirection: 'desc'
    });
    this.pageIndex = 0;
    this.loadConcursos();
  }

  /**
   * Navigates to the contest creation page.
   */
  createConcurso(): void {
    this.loggingService.info('[ConcursosAdminComponent] Navigating to create new contest page.', undefined, 'ConcursosAdmin');
    this.router.navigate(['/admin/concursos/nuevo']);
  }

  /**
   * Opens a dialog to edit an existing contest.
   * @param concurso The contest to edit.
   */
  editConcurso(concurso: Concurso): void {
    this.loggingService.info('[ConcursosAdminComponent] Attempting to edit contest:', concurso, 'ConcursosAdmin');
    if (!concurso || !concurso.id) {
      this.loggingService.warn('[ConcursosAdminComponent] Cannot edit contest: Invalid contest object or missing ID.', concurso, 'ConcursosAdmin');
      this.notificationService.error('No se puede editar el concurso. Faltan datos.');
      return;
    }

    const dialogRef = this.dialogService.open(ConcursoFormDialogComponent, {
      title: 'Editar Concurso',
      icon: 'edit',
      size: 'large',
      data: { mode: 'edit', concurso: concurso },
      panelClass: ['glassmorphism-dialog', 'concurso-form-dialog-container'],
      showCloseButton: true,
      showFooter: false,
      showCancelButton: false, // Ensure these are correctly handled by the dialog component
      showConfirmButton: false
    });

    dialogRef.afterClosed$.subscribe((result: unknown) => {
      if (result) {
        this.loggingService.info('[ConcursosAdminComponent] Concurso edit dialog closed with success. Reloading contests.', result, 'ConcursosAdmin');
        this.loadConcursos();
        this.notificationService.success('Concurso actualizado correctamente');
      } else {
        this.loggingService.debug('[ConcursosAdminComponent] Concurso edit dialog cancelled or closed without result.', undefined, 'ConcursosAdmin');
      }
    });
  }

  /**
   * Deletes a contest after user confirmation.
   * Only allows deletion of contests in 'DRAFT' status.
   * @param concurso The contest to delete.
   */
  deleteConcurso(concurso: Concurso): void {
    this.loggingService.info('[ConcursosAdminComponent] Attempting to delete contest:', concurso, 'ConcursosAdmin');
    if (!concurso || !concurso.id) {
      this.loggingService.warn('[ConcursosAdminComponent] Cannot delete contest: Invalid contest object or missing ID.', concurso, 'ConcursosAdmin');
      this.notificationService.error('No se puede eliminar el concurso. Faltan datos.');
      return;
    }

    // Verify that the contest is in DRAFT status
    if (concurso.status !== 'DRAFT') {
      this.loggingService.warn(`[ConcursosAdminComponent] Attempted to delete non-DRAFT contest (ID: ${concurso.id}, Status: ${concurso.status}).`, undefined, 'ConcursosAdmin');
      this.notificationService.error('Solo se pueden eliminar concursos en estado borrador.');
      return;
    }

    this.dialogService.confirm({
      title: 'Eliminar Concurso',
      message: `¿Está seguro que desea eliminar el concurso "${concurso.title}"? Esta acción es irreversible.`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      icon: 'trash',
      size: 'small'
    }).afterClosed$.subscribe((result: boolean) => {
      if (result) {
        this.loggingService.info(`[ConcursosAdminComponent] User confirmed deletion for contest ID: ${concurso.id}.`, undefined, 'ConcursosAdmin');
        this.isLoading = true;
        this.concursosService.deleteConcurso(concurso.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loggingService.info(`[ConcursosAdminComponent] Contest ID: ${concurso.id} deleted successfully. Reloading contests.`, undefined, 'ConcursosAdmin');
              this.loadConcursos();
              this.notificationService.success('Concurso eliminado correctamente');
            },
            error: (error: unknown) => {
              this.loggingService.error(`[ConcursosAdminComponent] Error deleting contest ID: ${concurso.id}:`, error, 'ConcursosAdmin');
              console.error('Error eliminando concurso:', error);
              this.notificationService.error('Error al eliminar el concurso. Por favor, intente de nuevo.');
              this.isLoading = false; // Reset loading on error
            }
          });
      } else {
        this.loggingService.debug(`[ConcursosAdminComponent] Contest deletion cancelled for ID: ${concurso.id}.`, undefined, 'ConcursosAdmin');
      }
    });
  }

  /**
   * Navigates to the previous page in the pagination.
   */
  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loggingService.debug(`[ConcursosAdminComponent] Navigating to previous page: ${this.pageIndex}`, undefined, 'ConcursosAdmin');
      this.onPageChange({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    } else {
      this.loggingService.debug('[ConcursosAdminComponent] Already on the first page, cannot go back.', undefined, 'ConcursosAdmin');
    }
  }

  /**
   * Navigates to the next page in the pagination.
   */
  nextPage(): void {
    if ((this.pageIndex + 1) * this.pageSize < this.totalItems) {
      this.pageIndex++;
      this.loggingService.debug(`[ConcursosAdminComponent] Navigating to next page: ${this.pageIndex}`, undefined, 'ConcursosAdmin');
      this.onPageChange({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    } else {
      this.loggingService.debug('[ConcursosAdminComponent] Already on the last page, cannot go forward.', undefined, 'ConcursosAdmin');
    }
  }

  /**
   * Toggles the action menu visibility for a given contest.
   * @param concursoId The ID of the contest.
   * @param event The click event.
   */
  toggleActionMenu(concursoId: string, event: Event): void {
    event.stopPropagation(); // Prevent document click listener from closing it immediately
    this.openMenuId = this.openMenuId === concursoId ? null : concursoId;
    this.loggingService.debug(`[ConcursosAdminComponent] Action menu toggled for ID: ${concursoId}. Open state: ${!!this.openMenuId}`, undefined, 'ConcursosAdmin');
  }

  /**
   * Views the details of a specific contest.
   * @param concurso The contest to view.
   */
  viewConcursoDetails(concurso: Concurso): void {
    this.loggingService.info('[ConcursosAdminComponent] Viewing contest details:', concurso, 'ConcursosAdmin');
    this.closeActionMenu();
    this.router.navigate(['/admin/concursos/detalle', concurso.id]);
  }

  /**
   * Manages the dates for a specific contest.
   * @param concurso The contest to manage dates for.
   */
  manageConcursoDates(concurso: Concurso): void {
    this.loggingService.info('[ConcursosAdminComponent] Managing contest dates:', concurso, 'ConcursosAdmin');
    this.closeActionMenu();
    this.router.navigate(['/admin/concursos/fechas', concurso.id]);
  }

  /**
   * Closes the currently open action menu.
   */
  private closeActionMenu(): void {
    if (this.openMenuId) {
      this.loggingService.debug('[ConcursosAdminComponent] Closing action menu.', undefined, 'ConcursosAdmin');
      this.openMenuId = null;
    }
  }

  /**
   * Sets up a global document click listener to close action menus when clicking outside.
   */
  private setupDocumentClickListener(): void {
    this.loggingService.debug('[ConcursosAdminComponent] Setting up document click listener for action menus.', undefined, 'ConcursosAdmin');
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      // Check if the click target is outside any action menu container
      if (!target.closest('.action-menu-container')) {
        this.closeActionMenu();
      }
    });
  }

  /**
   * Toggles the view mode between 'cards' and 'table'.
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
    this.loggingService.info(`[ConcursosAdminComponent] View mode toggled to: ${this.viewMode}`, undefined, 'ConcursosAdmin');
  }

  /**
   * Handles click to switch to cards view.
   */
  handleCardsViewClick(): void {
    if (this.viewMode === 'table') {
      this.toggleViewMode();
    }
  }

  /**
   * Handles click to switch to table view.
   */
  handleTableViewClick(): void {
    if (this.viewMode === 'cards') {
      this.toggleViewMode();
    }
  }

  /**
   * Gets the display label for a given contest status.
   * @param status The contest status.
   * @returns The human-readable label.
   */
  getStatusLabel(status: ContestStatus | string): string {
    if (!status) return 'Sin estado';
    const statusLabels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'ACTIVE': 'Activo',
      'IN_PROGRESS': 'En Proceso',
      'CLOSED': 'Cerrado',
      'CANCELLED': 'Cancelado'
    };
    return statusLabels[status] || status; // Return label or the original status if not found
  }

  /**
   * Gets the CSS class for a given contest status for styling.
   * @param status The contest status.
   * @returns The CSS class string.
   */
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

  /**
   * Formats a date to a localized date string.
   * @param date The date string or Date object.
   * @returns Formatted date string or empty string if invalid.
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      this.loggingService.error(`[ConcursosAdminComponent] Error formatting date: ${date}`, e, 'ConcursosAdmin');
      return 'Fecha inválida';
    }
  }

  /**
   * Returns options for department select.
   */
  getDepartmentOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todas las dependencias' },
      ...this.departments.map(dept => ({ value: dept, label: dept }))
    ];
  }

  /**
   * Returns options for position select.
   */
  getPositionOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todos los cargos' },
      ...this.positions.map(pos => ({ value: pos, label: pos }))
    ];
  }

  /**
   * Returns options for category select.
   */
  getCategoryOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Todas las categorías' },
      ...this.categories.map(cat => ({ value: cat, label: cat }))
    ];
  }

  /**
   * Returns options for status select.
   */
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

  /**
   * Exports the current table data to an Excel file.
   */
  exportData(): void {
    this.loggingService.info('[ConcursosAdminComponent] Exporting data.', undefined, 'ConcursosAdmin');
    if (!this.dataSource || this.dataSource.length === 0) {
      this.notificationService.error('No hay datos para exportar');
      this.loggingService.warn('[ConcursosAdminComponent] No data available for export.', undefined, 'ConcursosAdmin');
      return;
    }

    // Prepare data for export
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

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `concursos_${timestamp}`;

    // Export in Excel format by default
    this.exportService.exportData(dataToExport, {
      format: 'excel',
      fileName: fileName,
      includeHeaders: true
    });

    this.notificationService.success(`Datos exportados como ${fileName}.xlsx`);
    this.loggingService.info(`[ConcursosAdminComponent] Data exported successfully as ${fileName}.xlsx`, undefined, 'ConcursosAdmin');
  }

  // Expose Math for the template (already exists)
  Math = Math;
}
