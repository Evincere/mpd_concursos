import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Interfaces
import { Postulacion, PostulationStatus } from '@shared/interfaces/postulacion/postulacion.interface';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';

// Services
import { PostulacionesService } from '@core/services/postulaciones/postulaciones.service';
import { PostulacionesFilterService, FilterResult } from '@core/services/postulaciones/postulaciones-filter.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

// Utils
import { getInscriptionStatusMessage } from '@shared/utils/state-translations.util';

// Components
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { ActionMenuComponent, ActionMenuItem } from '@shared/components/action-menu/action-menu.component';
import { FiltrosPostulacionesComponent } from './components/filtros-postulaciones/filtros-postulaciones.component';
import { PostulacionDetalleComponent } from './components/postulacion-detalle/postulacion-detalle.component';

@Component({
  selector: 'app-postulaciones',
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SearchHeaderComponent,
    LoaderComponent,
    CustomButtonComponent,
    ContestStatusBadgeComponent,
    ActionMenuComponent,
    FiltrosPostulacionesComponent,
    PostulacionDetalleComponent
  ]
})
export class PostulacionesComponent implements OnInit, OnDestroy {
  // Data
  postulaciones: Postulacion[] = [];
  postulacionesFiltradas: Postulacion[] = [];
  
  // UI State
  loading = false;
  error: 'connection' | 'server' | 'no-results' | 'empty' | null = null;
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;
  
  // Filters
  terminoBusqueda = '';
  filtrosActivos = false;
  filtros: FiltrosPostulacion = {
    estado: null,
    periodo: null,
    dependencia: null,
    cargo: null,
    fechaDesde: null,
    fechaHasta: null
  };
  
  // UI Controls
  mostrarFiltros = false;
  postulacionSeleccionada: Postulacion | null = null;
  mostrarDialogoCancelacion = false;
  postulacionACancelar: Postulacion | null = null;
  cancelandoPostulacion = false;
  
  // Flags
  primeraConsulta = true;
  filtrosModificados = false;
  todasCanceladas = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private postulacionesService: PostulacionesService,
    private filterService: PostulacionesFilterService,
    private inscriptionService: InscriptionService,
    private dashboardService: DashboardService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPostulaciones(): void {
    this.loading = true;
    this.error = null;
    this.todasCanceladas = false;

    this.postulacionesService.getPostulaciones(
      this.pageIndex,
      this.pageSize,
      'inscriptionDate',
      'DESC'
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        this.primeraConsulta = false;
      })
    ).subscribe({
      next: (response) => {
        // Usar el servicio de filtros para procesar los datos
        const postulacionesActivas = this.filterService.getActivePostulations(response.content);
        this.todasCanceladas = this.filterService.areAllCancelled(response.content);

        // Asignar solo las postulaciones activas
        this.postulaciones = postulacionesActivas;
        this.aplicarFiltros();
      },
      error: (error: Error) => {
        // Solo mostrar errores reales, no cuando simplemente no hay datos
        if (error.message.includes('Network error') || error.message.includes('Error de conexión')) {
          this.error = 'connection';
        } else if (error.message.includes('No autorizado') || error.message.includes('401') || error.message.includes('403')) {
          this.error = 'server';
        } else {
          // Para otros errores, verificar si realmente es un error del servidor
          // y no simplemente una respuesta vacía
          console.warn('[PostulacionesComponent] Error al cargar postulaciones:', error.message);
          // No establecer error para permitir que se muestre el estado vacío normal
          this.error = null;
        }
        this.postulaciones = [];
        this.postulacionesFiltradas = [];
        this.totalItems = 0;
      }
    });
  }

  aplicarFiltros(nuevosFiltros?: FiltrosPostulacion): void {
    if (nuevosFiltros) {
      this.filtros = nuevosFiltros;
      this.filtrosActivos = true;
    }

    // Usar el servicio de filtros
    const filterResult: FilterResult = this.filterService.applyFilters(
      this.postulaciones,
      this.filtros,
      this.terminoBusqueda,
      this.filtrosActivos
    );

    // Actualizar datos filtrados
    this.postulacionesFiltradas = filterResult.filteredData;
    this.totalItems = filterResult.totalItems;

    // Determinar estado de error usando el servicio
    this.error = this.filterService.determineErrorType(
      !filterResult.isEmpty,
      filterResult.hasActiveFilters,
      this.primeraConsulta
    );
  }

  // Event Handlers
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const termino = target?.value || '';
    this.terminoBusqueda = termino;
    this.filtrosModificados = termino.length > 0;
    this.aplicarFiltros();
  }

  onFilter(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  onFiltrosChange(filtros: FiltrosPostulacion): void {
    this.aplicarFiltros(filtros);
    this.mostrarFiltros = false;
  }

  onCerrarFiltros(): void {
    this.mostrarFiltros = false;
  }

  // Pagination
  get paginatedPostulaciones(): Postulacion[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.postulacionesFiltradas.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(newPageIndex: number): void {
    this.pageIndex = newPageIndex;
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.pageIndex = 0;
  }

  // Actions
  verDetalle(postulacion: Postulacion): void {
    this.postulacionSeleccionada = postulacion;
  }

  cerrarDetalle(): void {
    this.postulacionSeleccionada = null;
  }

  retomarInscripcion(postulacion: Postulacion): void {
    if (postulacion.contestId) {
      // Navegar al proceso de inscripción para retomar donde se dejó
      this.router.navigate(['/concursos', postulacion.contestId, 'inscripcion'], {
        queryParams: {
          inscriptionId: postulacion.id,
          resume: 'true'
        }
      });
    }
  }

  completarDocumentacion(postulacion: Postulacion): void {
    if (postulacion.contestId) {
      this.router.navigate(['/concursos', postulacion.contestId, 'inscripcion', 'documentos']);
    }
  }

  retryLoad(): void {
    this.cargarPostulaciones();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: null,
      periodo: null,
      dependencia: null,
      cargo: null,
      fechaDesde: null,
      fechaHasta: null
    };
    this.terminoBusqueda = '';
    this.filtrosActivos = false;
    this.filtrosModificados = false;
    this.aplicarFiltros();
  }

  navegarAConcursos(): void {
    this.router.navigate(['/dashboard/concursos']);
  }

  hayFiltrosAplicados(): boolean {
    if (this.primeraConsulta) return false;
    return !!(
      this.filtros.estado ||
      this.filtros.periodo ||
      this.filtros.dependencia ||
      this.filtros.cargo ||
      this.filtros.fechaDesde ||
      this.filtros.fechaHasta ||
      this.terminoBusqueda
    );
  }

  // Método eliminado - ahora usamos directamente el estado de inscripción con statusType="inscription"

  // Action Menu
  getActionsForPostulacion(postulacion: Postulacion): ActionMenuItem[] {
    const actions: ActionMenuItem[] = [];

    // Solo mostrar acciones adicionales (no "ver detalle" ya que tiene su propio botón)
    if (this.puedesCancelarPostulacion(postulacion)) {
      actions.push({
        id: 'cancel',
        label: 'Cancelar postulación',
        icon: 'fas fa-times',
        variant: 'danger'
      });
    }

    // Si no hay acciones disponibles, agregar una acción de información
    if (actions.length === 0) {
      actions.push({
        id: 'info',
        label: 'Información',
        icon: 'fas fa-info-circle',
        variant: 'secondary'
      });
    }

    return actions;
  }

  getPrimaryActionId(postulacion: Postulacion): string {
    if (this.puedesCancelarPostulacion(postulacion)) {
      return 'cancel';
    }
    return 'info';
  }

  onActionClick(action: ActionMenuItem, postulacion: Postulacion): void {
    switch (action.id) {
      case 'cancel':
        this.cancelarPostulacion(postulacion);
        break;
      case 'info':
        // Mostrar información adicional - funcionalidad futura
        break;
    }
  }

  puedesCancelarPostulacion(postulacion: Postulacion): boolean {
    // Permitir cancelar postulaciones en proceso (interrumpidas) y completadas
    return postulacion.estado === PostulationStatus.PENDING ||
           postulacion.estado === PostulationStatus.APPROVED ||
           postulacion.estado === PostulationStatus.ACTIVE ||
           postulacion.estado === PostulationStatus.COMPLETED_WITH_DOCS ||
           postulacion.estado === PostulationStatus.COMPLETED_PENDING_DOCS;
  }

  cancelarPostulacion(postulacion: Postulacion): void {
    this.postulacionACancelar = postulacion;
    this.mostrarDialogoCancelacion = true;
  }

  onConfirmarCancelacion(): void {
    // CORRECCIÓN: Validar que existe la postulación y que el ID no sea null/undefined/empty
    if (!this.postulacionACancelar || !this.postulacionACancelar.id || this.postulacionACancelar.id.trim() === '') {
      return;
    }

    // Prevenir múltiples clicks
    if (this.cancelandoPostulacion) {
      return;
    }

    // Agregar estado de loading para prevenir múltiples clicks
    this.cancelandoPostulacion = true;
    const postulacionId = this.postulacionACancelar.id; // Ya es string, no necesita conversión

    // CORRECCIÓN: Determinar si es cancelación de proceso basado en el estado
    const isProcessCancellation = this.postulacionACancelar.estado === PostulationStatus.ACTIVE ||
                                  this.postulacionACancelar.estado === PostulationStatus.COMPLETED_PENDING_DOCS;

    this.inscriptionService.cancelInscription(postulacionId, isProcessCancellation)
      .subscribe({
        next: () => {
          // Mostrar notificación de éxito
          this.notificationService.success('Postulación cancelada exitosamente');

          // Recargar la lista
          this.cargarPostulaciones();

          // Cerrar diálogo
          this.mostrarDialogoCancelacion = false;
          this.postulacionACancelar = null;
          this.cancelandoPostulacion = false;

          // Actualizar dashboard
          this.dashboardService.getDashboardCards().subscribe();
        },
        error: (error: Error) => {
          // Mostrar notificación de error
          this.notificationService.error('Error al cancelar la postulación. Por favor, inténtelo nuevamente.');

          // Cerrar diálogo y resetear estado
          this.mostrarDialogoCancelacion = false;
          this.postulacionACancelar = null;
          this.cancelandoPostulacion = false;
        }
      });
  }

  onCancelarDialogo(): void {
    this.mostrarDialogoCancelacion = false;
    this.postulacionACancelar = null;
    this.cancelandoPostulacion = false; // Reset loading state
  }

  /**
   * Obtiene un mensaje descriptivo para el estado de una postulación
   * @param postulacion La postulación para la cual obtener el mensaje
   * @returns Mensaje descriptivo para el usuario
   */
  getStatusMessage(postulacion: Postulacion): string {
    return getInscriptionStatusMessage(postulacion.estado);
  }

  /**
   * Determina si una postulación requiere acción urgente del usuario
   * @param postulacion La postulación a evaluar
   * @returns true si requiere acción urgente
   */
  requiresUrgentAction(postulacion: Postulacion): boolean {
    return postulacion.estado === PostulationStatus.COMPLETED_PENDING_DOCS;
  }

  /**
   * Obtiene la clase CSS para el indicador de urgencia
   * @param postulacion La postulación a evaluar
   * @returns Clase CSS apropiada
   */
  getUrgencyClass(postulacion: Postulacion): string {
    if (this.requiresUrgentAction(postulacion)) {
      return 'urgent-action';
    }
    return '';
  }
}
