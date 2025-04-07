import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, finalize, filter, switchMap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { Router } from '@angular/router';

import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { FiltrosPostulacionesComponent } from './components/filtros-postulaciones/filtros-postulaciones.component';
import { PostulacionesService } from '@core/services/postulaciones/postulaciones.service';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';
import { Postulacion } from '@shared/interfaces/postulacion/postulacion.interface';
import { PostulacionDetalleComponent } from './components/postulacion-detalle/postulacion-detalle.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { PostulationStatus } from '@shared/interfaces/postulacion/postulacion.interface';
import { EventsService, EventType } from '@core/services/events/events.service';
import { DashboardService } from '@core/services/dashboard/dashboard.service';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    SearchHeaderComponent,
    LoaderComponent,
    FiltrosPostulacionesComponent,
    PostulacionDetalleComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PostulacionesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'concurso',
    'cargo',
    'dependencia',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<Postulacion>([]);
  postulaciones: Postulacion[] = [];
  postulacionesFiltradas: Postulacion[] = [];
  loading = false;
  error: any = null;
  filtrosPanelActivo = false;
  pageSize = 10;
  pageIndex = 0;
  postulacionSeleccionada: Postulacion | null = null;

  private destroy$ = new Subject<void>();
  public filtrosActuales: FiltrosPostulacion | null = null;
  public terminoBusqueda = '';
  public filtrosModificados = false;
  private dialogRef: MatDialogRef<FiltrosPostulacionesComponent> | null = null;

  mostrarFiltros = false;
  filtrosActivos = false;
  filtros: FiltrosPostulacion = {
    estado: 'todos',
    periodo: 'todos',
    dependencia: 'todas',
    cargo: 'todos'
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  primeraConsulta = true; // Nueva variable para controlar si es la primera carga
  todasCanceladas = false;

  constructor(
    private postulacionesService: PostulacionesService,
    private inscriptionService: InscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private eventsService: EventsService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    // Cerrar el panel de filtros y limpiar estado
    this.filtrosPanelActivo = false;
    this.filtrosActuales = {
      estado: 'todos',
      periodo: 'todos',
      dependencia: 'todas',
      cargo: 'todos'
    };
    this.filtrosModificados = false;

    // Limpiar subscripciones
    this.destroy$.next();
    this.destroy$.complete();

    // Cerrar el diálogo si está abierto
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
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
        if (!this.terminoBusqueda && this.filtrosActuales?.estado === 'todos' &&
            this.filtrosActuales?.periodo === 'todos' &&
            this.filtrosActuales?.dependencia === 'todas' &&
            this.filtrosActuales?.cargo === 'todos') {
          this.filtrosModificados = false;
        }
      })
    ).subscribe({
      next: (response) => {
        // Verificar si todas las postulaciones están canceladas
        const postulacionesActivas = response.content.filter(p => p.estado !== PostulationStatus.CANCELLED);
        this.todasCanceladas = response.content.length > 0 && postulacionesActivas.length === 0;
        
        // Asignar solo las postulaciones activas
        this.postulaciones = postulacionesActivas;
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error al cargar las postulaciones:', error);
        this.error = error.status === 0 ? 'connection' : 'server';
        this.snackBar.open(
          error.status === 0 
            ? 'Error de conexión' 
            : 'Error al cargar las postulaciones',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  onSearch(termino: string): void {
    this.terminoBusqueda = termino;
    this.filtrosModificados = termino.length > 0;
    this.aplicarFiltros();
  }

  onFilter(): void {
    this.toggleFiltros();
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  aplicarFiltros(nuevosFiltros?: FiltrosPostulacion): void {
    if (nuevosFiltros) {
      this.filtros = nuevosFiltros;
      this.filtrosActivos = true;
    }

    // Primero filtrar las postulaciones canceladas
    let postulacionesFiltradas = this.postulaciones.filter(p => p.estado !== PostulationStatus.CANCELLED);

    // Luego aplicar el resto de los filtros
    this.postulacionesFiltradas = postulacionesFiltradas.filter(postulacion => {
      let cumpleFiltros = true;

      // Aplicar filtros solo si están activos
      if (this.filtrosActivos) {
        if (this.filtros.estado !== 'todos' && postulacion.estado) {
          const estadoApi = this.getEstadoApiValue(this.filtros.estado || 'todos');
          cumpleFiltros = cumpleFiltros && postulacion.estado === estadoApi;
        }
        if (this.filtros.dependencia !== 'todas' && postulacion.concurso?.dependencia) {
          cumpleFiltros = cumpleFiltros && postulacion.concurso.dependencia === this.filtros.dependencia;
        }
        if (this.filtros.cargo !== 'todos' && postulacion.concurso?.cargo) {
          cumpleFiltros = cumpleFiltros && postulacion.concurso.cargo === this.filtros.cargo;
        }
      }

      // Aplicar búsqueda si hay un término
      if (this.terminoBusqueda) {
        const terminoLower = this.terminoBusqueda.toLowerCase();
        const concursoTitulo = postulacion.concurso?.titulo?.toLowerCase() || '';
        const concursoCargo = postulacion.concurso?.cargo?.toLowerCase() || '';
        const concursoDependencia = postulacion.concurso?.dependencia?.toLowerCase() || '';

        const coincideTermino =
          concursoTitulo.includes(terminoLower) ||
          concursoCargo.includes(terminoLower) ||
          concursoDependencia.includes(terminoLower);

        cumpleFiltros = cumpleFiltros && coincideTermino;
      }

      return cumpleFiltros;
    });

    // Actualizar el datasource
    this.dataSource.data = this.postulacionesFiltradas;

    // Si no hay postulaciones después de aplicar los filtros, mostrar mensaje apropiado
    if (this.postulacionesFiltradas.length === 0 && !this.primeraConsulta) {
      if (this.filtrosModificados || this.terminoBusqueda) {
        this.error = 'no-results';
      } else {
        this.error = 'empty';
      }
    } else {
      this.error = null;
    }
  }

  private getEstadoApiValue(estadoFiltro: string): string {
    const estadosMap: { [key: string]: string } = {
      'pendiente': 'PENDING',
      'aprobada': 'APPROVED',
      'rechazada': 'REJECTED'
    };
    return estadosMap[estadoFiltro.toLowerCase()] || estadoFiltro.toUpperCase();
  }

  hayFiltrosAplicados(): boolean {
    if (this.primeraConsulta) return false; // Si es la primera consulta, no hay filtros aplicados

    return !!(
      this.filtrosActuales?.estado ||
      this.filtrosActuales?.periodo ||
      this.filtrosActuales?.dependencia ||
      this.filtrosActuales?.cargo ||
      this.filtrosActuales?.fechaDesde ||
      this.filtrosActuales?.fechaHasta ||
      this.terminoBusqueda
    );
  }

  limpiarFiltros(): void {
    this.filtrosActuales = {
      estado: null,
      periodo: null,
      dependencia: null,
      cargo: null,
      fechaDesde: null,
      fechaHasta: null
    };
    this.terminoBusqueda = '';
    this.cargarPostulaciones();
  }

  retryLoad(): void {
    this.cargarPostulaciones();
  }

  verDetalle(postulacion: Postulacion) {
    this.postulacionSeleccionada = postulacion;
  }

  cerrarDetalle() {
    this.postulacionSeleccionada = null;
  }

  getEstadoPostulacionLabel(estado: string | undefined): string {
    if (!estado) return 'Desconocido';

    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobada',
      'REJECTED': 'Rechazada'
    };
    return labels[estado] || estado;
  }

  getEstadoPostulacionClass(estado: string | undefined): string {
    if (!estado) return 'pending';
    return estado.toLowerCase();
  }

  cancelarPostulacion(postulacion: Postulacion): void {
    const postulacionId = postulacion.id?.toString();
    if (!postulacionId) {
      this.snackBar.open('Error: ID de postulación no válido', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log('[PostulacionesComponent] Iniciando proceso de cancelación para postulación:', postulacionId);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'confirm-dialog-container',
      data: {
        titulo: 'Cancelar Postulación',
        mensaje: `¿Está seguro que desea cancelar su postulación para el concurso "${postulacion.concurso?.titulo}"?`,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('[PostulacionesComponent] Usuario confirmó cancelación de postulación');
        this.inscriptionService.cancelInscription(postulacionId)
          .subscribe({
            next: () => {
              console.log('[PostulacionesComponent] Postulación cancelada exitosamente');
              this.snackBar.open('Postulación cancelada exitosamente', 'Cerrar', {
                duration: 3000
              });
              
              // Actualizar el listado de postulaciones
              this.postulaciones = this.postulaciones.filter(p => p.id !== postulacion.id);
              this.postulacionesFiltradas = this.postulacionesFiltradas.filter(p => p.id !== postulacion.id);
              this.dataSource.data = this.postulacionesFiltradas;

              // Si no quedan postulaciones, mostrar mensaje de bienvenida
              if (this.postulaciones.length === 0) {
                this.error = 'empty';
              }

              // Si hay una postulación seleccionada, cerrar el detalle
              if (this.postulacionSeleccionada?.id === postulacion.id) {
                this.postulacionSeleccionada = null;
              }

              // Forzar actualización del dashboard
              console.log('[PostulacionesComponent] Actualizando dashboard después de cancelación');
              this.dashboardService.getDashboardCards().subscribe();
            },
            error: (error) => {
              console.error('[PostulacionesComponent] Error al cancelar postulación:', error);
              this.snackBar.open('Error al cancelar la postulación', 'Cerrar', {
                duration: 3000
              });
            }
          });
      } else {
        console.log('[PostulacionesComponent] Usuario canceló la operación de cancelación');
      }
    });
  }

  navegarAConcursos(): void {
    this.router.navigate(['/dashboard/concursos']);
  }

  loadInscriptions() {
    this.cargarPostulaciones();
  }

  puedesCancelarPostulacion(postulacion: Postulacion): boolean {
    // Solo se puede cancelar si está en estado PENDING o ACCEPTED
    return postulacion.estado === PostulationStatus.PENDING ||
           postulacion.estado === PostulationStatus.ACCEPTED;
  }
}
