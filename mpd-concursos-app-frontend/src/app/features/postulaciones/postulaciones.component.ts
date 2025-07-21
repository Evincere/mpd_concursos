import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, switchMap } from 'rxjs/operators';

// Interfaces
import { Postulacion, PostulationStatus } from '@shared/interfaces/postulacion/postulacion.interface';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

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
    private route: ActivatedRoute,
    private notificationService: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.cargarPostulaciones();
    this.verificarParametrosQuery();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verifica los parámetros de query para abrir automáticamente el detalle de una postulación
   */
  private verificarParametrosQuery(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['postulacionId'] && params['openDetail'] === 'true') {
        // Esperar a que se carguen las postulaciones antes de abrir el detalle
        setTimeout(() => {
          this.abrirDetalleDesdeQuery(params['postulacionId']);
        }, 1000);
      }
    });
  }

  /**
   * Abre el detalle de una postulación específica basado en el ID de los parámetros de query
   */
  private abrirDetalleDesdeQuery(postulacionId: string): void {
    const postulacion = this.postulaciones.find(p => p.id === postulacionId);
    if (postulacion) {
      this.verDetalle(postulacion);
      // Limpiar los parámetros de query después de abrir el detalle
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  cargarPostulaciones(): void {
    this.loading = true;
    this.error = null;
    this.todasCanceladas = false;

    // CRITICAL FIX: Forzar limpieza de cache antes de cargar postulaciones
    this.inscriptionService.clearCacheAndRefresh().pipe(
      switchMap(() => this.postulacionesService.getPostulaciones(
        this.pageIndex,
        this.pageSize,
        'inscriptionDate',
        'DESC'
      )),
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

  /**
   * Formatea una fecha para mostrar en formato dd/MM/yyyy
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'No especificada';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Determina el paso correcto del proceso de inscripción basado en el estado
   */
  private determinarPasoSegunEstado(estado: string): number {
    switch (estado) {
      case 'COMPLETED_PENDING_DOCS':
        // Si la inscripción está completa pero faltan documentos, ir al paso 3 (documentación)
        return 3;
      case 'ACTIVE':
        // Para inscripciones activas, ir al paso 2 (circunscripción) por defecto
        // El componente de inscripción determinará el paso exacto basado en el estado guardado
        return 2;
      case 'PENDING':
      case 'COMPLETED_WITH_DOCS':
        // Para estados completos, ir al paso 4 (confirmación/resumen)
        return 4;
      default:
        // Por defecto, ir al paso 1
        return 1;
    }
  }



  retomarInscripcion(postulacion: Postulacion): void {
    if (postulacion.contestId) {
      // CRITICAL FIX: Determinar el paso correcto basado en el estado de la inscripción
      const step = this.determinarPasoSegunEstado(postulacion.estado);

      // DEBUG: Logging para diagnosticar el problema de navegación
      console.log('[PostulacionesComponent] Retomando inscripción:', {
        estado: postulacion.estado,
        stepCalculado: step,
        contestId: postulacion.contestId,
        inscriptionId: postulacion.id
      });

      // CRITICAL FIX: Navegar al proceso de inscripción con la ruta correcta del dashboard y el paso apropiado
      this.router.navigate(['/dashboard/inscripcion'], {
        queryParams: {
          contestId: postulacion.contestId,
          inscriptionId: postulacion.id,
          resume: 'true',
          step: step
        }
      });
    }
  }

  completarDocumentacion(postulacion: Postulacion): void {
    if (postulacion.contestId) {
      // CRITICAL FIX: Para completar documentación, siempre ir al paso 3 (documentación)
      const step = 3;

      // CRITICAL FIX: Navegar al proceso de inscripción con la ruta correcta del dashboard
      this.router.navigate(['/dashboard/inscripcion'], {
        queryParams: {
          contestId: postulacion.contestId,
          inscriptionId: postulacion.id,
          resume: 'true',
          step: step
        }
      });
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

  /**
   * ✅ NUEVO MÉTODO: Obtiene mensaje específico sobre plazo de documentación
   */
  getDocumentationDeadlineMessage(postulacion: Postulacion): string {
    if (!postulacion.concurso?.endDate) {
      return 'Fecha límite no disponible';
    }

    const contestEndDate = new Date(postulacion.concurso.endDate);
    const documentationDeadline = this.addBusinessDays(contestEndDate, 3);
    documentationDeadline.setHours(23, 59, 59, 999);

    const now = new Date();
    const diffTime = documentationDeadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return '⚠️ Plazo vencido - Inscripción será congelada';
    } else if (diffDays === 0) {
      return '🚨 ¡ÚLTIMO DÍA! Vence hoy a las 23:59';
    } else if (diffDays === 1) {
      return `⏰ Vence mañana (${documentationDeadline.toLocaleDateString('es-AR')})`;
    } else {
      return `📅 ${diffDays} días restantes (vence ${documentationDeadline.toLocaleDateString('es-AR')})`;
    }
  }

  /**
   * ✅ MÉTODO AUXILIAR: Agregar días hábiles a una fecha
   */
  private addBusinessDays(date: Date, businessDays: number): Date {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      // Si no es fin de semana (sábado = 6, domingo = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
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

    // Ya no agregamos ninguna acción aquí porque:
    // - El botón de cancelar está en la esquina superior derecha
    // - El botón de ver detalle está en la esquina superior derecha
    // - No hay otras acciones necesarias por ahora

    return actions; // Retorna array vacío para que no se muestre el menú
  }

  getPrimaryActionId(postulacion: Postulacion): string {
    // No hay acciones primarias en el menú
    return '';
  }

  onActionClick(action: ActionMenuItem, postulacion: Postulacion): void {
    // No hay acciones que manejar ya que el array está vacío
    console.log('No hay acciones disponibles en el menú');
  }

  puedesCancelarPostulacion(postulacion: Postulacion): boolean {
    // CRITICAL FIX: Verificar que la postulación NO esté ya cancelada
    if (postulacion.estado === PostulationStatus.CANCELLED) {
      return false;
    }

    // Permitir cancelar postulaciones en proceso (interrumpidas) y completadas
    return postulacion.estado === PostulationStatus.PENDING ||
           postulacion.estado === PostulationStatus.APPROVED ||
           postulacion.estado === PostulationStatus.ACTIVE ||
           postulacion.estado === PostulationStatus.COMPLETED_WITH_DOCS ||
           postulacion.estado === PostulationStatus.COMPLETED_PENDING_DOCS;
  }

  cancelarPostulacion(postulacion: Postulacion): void {
    // CRITICAL FIX: Verificar estado real desde el backend antes de permitir cancelación
    if (postulacion.id) {
      this.inscriptionService.verifyInscriptionState(postulacion.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (realState) => {
          // Mapear InscripcionState a PostulationStatus
          const mappedState = this.mapInscripcionStateToPostulationStatus(realState);

          if (mappedState === PostulationStatus.CANCELLED) {
            this.notificationService.warning('Esta postulación ya está cancelada');
            // Forzar recarga de datos para sincronizar estado
            this.cargarPostulaciones();
            return;
          }

          // Actualizar estado local si es diferente
          if (postulacion.estado !== mappedState) {
            postulacion.estado = mappedState;
          }

          if (!this.puedesCancelarPostulacion(postulacion)) {
            this.notificationService.warning('No se puede cancelar esta postulación en su estado actual');
            return;
          }

          this.postulacionACancelar = postulacion;
          this.mostrarDialogoCancelacion = true;
        },
        error: (error) => {
          console.error('Error verificando estado de postulación:', error);
          this.notificationService.error('Error al verificar el estado de la postulación');
        }
      });
    } else {
      this.notificationService.error('ID de postulación no válido');
    }
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
      .pipe(takeUntil(this.destroy$))
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
          this.dashboardService.getDashboardCards()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        },
        error: (error: any) => {
          console.error('Error al cancelar postulación:', error);

          // CRITICAL FIX: Manejar errores específicos de estado
          if (error.status === 400 && error.error?.message?.includes('CANCELLED')) {
            this.notificationService.warning('Esta postulación ya está cancelada');
            // Forzar recarga para sincronizar estado
            this.cargarPostulaciones();
          } else {
            this.notificationService.error('Error al cancelar la postulación. Por favor, inténtelo nuevamente.');
          }

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
   * Determina si se puede retomar una inscripción (está incompleta)
   * @param postulacion La postulación a evaluar
   * @returns true si se puede retomar la inscripción
   */
  puedeRetomarInscripcion(postulacion: Postulacion): boolean {
    return postulacion.estado === PostulationStatus.ACTIVE ||
           postulacion.estado === PostulationStatus.COMPLETED_PENDING_DOCS;
  }

  /**
   * Determina si una inscripción está completada y pendiente de validación
   * @param postulacion La postulación a evaluar
   * @returns true si la inscripción está completada
   */
  inscripcionCompletada(postulacion: Postulacion): boolean {
    return postulacion.estado === PostulationStatus.COMPLETED_WITH_DOCS ||
           postulacion.estado === PostulationStatus.PENDING;
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

  /**
   * Mapea InscripcionState a PostulationStatus
   */
  private mapInscripcionStateToPostulationStatus(inscripcionState: InscripcionState): PostulationStatus {
    switch (inscripcionState) {
      case InscripcionState.ACTIVE:
        return PostulationStatus.ACTIVE;
      case InscripcionState.PENDING:
        return PostulationStatus.PENDING;
      case InscripcionState.COMPLETED_WITH_DOCS:
        return PostulationStatus.COMPLETED_WITH_DOCS;
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return PostulationStatus.COMPLETED_PENDING_DOCS;
      case InscripcionState.FROZEN:
        return PostulationStatus.FROZEN;
      case InscripcionState.APPROVED:
        return PostulationStatus.APPROVED;
      case InscripcionState.REJECTED:
        return PostulationStatus.REJECTED;
      case InscripcionState.CANCELLED:
        return PostulationStatus.CANCELLED;
      default:
        return PostulationStatus.ACTIVE;
    }
  }
}
