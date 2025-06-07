import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { trigger, transition, style, animate } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { FiltrosPanelComponent } from './components/filtros-panel/filtros-panel.component';
import { ConcursoDetalleComponent } from './components/concurso-detalle/concurso-detalle.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { InscripcionButtonComponent } from './components/inscripcion/inscripcion-button/inscripcion-button.component';
import { ConcursoCardComponent } from './components/concurso-card/concurso-card.component';
import { FiltersConcurso } from '@shared/interfaces/filters/filters-concurso.interface';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { FiltersService } from '@core/services/filters/filters.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { translateContestStatus } from '@shared/utils/state-translations.util';


@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InscripcionButtonComponent,
    SearchHeaderComponent,
    FiltrosPanelComponent,
    ConcursoDetalleComponent,
    LoaderComponent,
    ConcursoCardComponent,
    CustomButtonComponent
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class ConcursosComponent implements OnInit, OnDestroy {
  concursos: Concurso[] = [];
  loading = false;
  error: HttpErrorResponse | null = null;
  concursoSeleccionado: Concurso | null = null;
  mostrarFiltros = false;
  filtrosActivos = false;
  filtros: FiltersConcurso = {
    estado: 'todos',
    dependencia: 'todos',
    cargo: 'todos',
    periodo: 'todos'
  };
  concursosSinFiltrar: Concurso[] = [];
  searchTerm = '';
  primeraConsulta = true;
  private destroy$ = new Subject<void>();

  constructor(
    private concursosService: ConcursosService,
    private filtersService: FiltersService,
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.cargarConcursos();

    // Suscribirse a los cambios en los parámetros de la URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Record<string, string>) => {
        console.log('[ConcursosComponent] Parámetros de URL detectados:', params);

        // Si hay un ID de concurso en la URL, seleccionarlo
        let concursoId = this.route.snapshot.paramMap.get('id');

        // También verificar si hay un ID de concurso en los parámetros de consulta
        if (!concursoId && params['contestId']) {
          concursoId = params['contestId'];
          console.log('[ConcursosComponent] ID de concurso detectado en los parámetros de consulta:', concursoId);
        }

        if (concursoId) {
          console.log('[ConcursosComponent] ID de concurso detectado:', concursoId);
          this.seleccionarConcursoPorId(parseInt(concursoId, 10));
        }

        // Si hay parámetros para continuar una inscripción, procesarlos
        if (params['continueInscription'] === 'true' && params['inscriptionId']) {
          console.log('[ConcursosComponent] Parámetros para continuar inscripción detectados:', {
            continueInscription: params['continueInscription'],
            inscriptionId: params['inscriptionId'],
            directContinuation: params['directContinuation']
          });

          // Si viene desde la pestaña de documentación, establecer el flag de continuación directa
          if (params['directContinuation'] === 'true') {
            this.inscriptionStateService.setDirectContinuation(true);
            console.log('[ConcursosComponent] Flag de continuación directa establecido');
          }

          // Esperar a que se carguen los concursos
          setTimeout(() => {
            if (this.concursoSeleccionado) {
              // Verificar si debemos abrir el diálogo de inscripción
              if (params['openDialog'] === 'true' && params['inscriptionId']) {
                console.log('[ConcursosComponent] Redirigiendo directamente a la página de inscripción');

                // Redirigir directamente a la página de inscripción con los parámetros necesarios
                this.router.navigate(['/dashboard/inscripcion'], {
                  queryParams: {
                    contestId: params['contestId'],
                    inscriptionId: params['inscriptionId'],
                    continueInscription: 'true',
                    timestamp: new Date().getTime().toString() // Para evitar caché
                  }
                });
              } else {
                // Método anterior como fallback
                const inscripcionButton = document.querySelector('app-inscripcion-button button') as HTMLButtonElement;
                if (inscripcionButton && params['openDialog'] === 'true') {
                  console.log('[ConcursosComponent] Forzando clic en botón de inscripción');
                  inscripcionButton.click();
                }
              }
            }
          }, 1000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarConcursos(): void {
    this.loading = true;
    this.concursosService.getConcursos().subscribe({
      next: (concursos: Concurso[]) => {
        console.log('[ConcursosComponent] Concursos recibidos:', concursos);
        this.concursosSinFiltrar = [...concursos];

        // Obtener los filtros actuales del servicio
        this.filtersService.getFiltros().subscribe((filtros: FiltersConcurso) => {
          console.log('[ConcursosComponent] Aplicando filtros después de cargar:', filtros);
          this.filtros = filtros;
          this.aplicarFiltros(filtros);
        });

        this.loading = false;
        this.primeraConsulta = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('[ConcursosComponent] Error al cargar los concursos:', error);
        this.error = error;
        this.loading = false;
        this.notification.error('Error al cargar los concursos. Por favor, inténtelo nuevamente.');
      }
    });
  }

  onSearch(event: any): void {
    // Extraer el término de búsqueda del evento
    const term = typeof event === 'string' ? event :
                (event && event.target && event.target.value ? event.target.value : '');

    this.searchTerm = term;
    if (!term || !term.trim()) {
      this.cargarConcursos();
      return;
    }

    const searchTermLower = term.toLowerCase();
    this.concursos = this.concursos.filter(concurso =>
      concurso.title.toLowerCase().includes(searchTermLower) ||
      concurso.position.toLowerCase().includes(searchTermLower) ||
      (concurso.dependencia && concurso.dependencia.toLowerCase().includes(searchTermLower)) ||
      (concurso.description && concurso.description.toLowerCase().includes(searchTermLower))
    );
  }

  onFilter(): void {
    console.log('Filtro activado:', this.mostrarFiltros);
    this.mostrarFiltros = !this.mostrarFiltros;
    console.log('Estado de mostrarFiltros después de cambiar:', this.mostrarFiltros);
  }

  aplicarFiltros(filtros: FiltersConcurso): void {
    this.filtros = filtros;
    this.filtrosActivos = this.hayFiltrosActivos(filtros);
    this.primeraConsulta = false;

    console.log('[ConcursosComponent] Iniciando aplicación de filtros:', {
      filtros,
      totalConcursos: this.concursosSinFiltrar.length
    });

    // Aplicar filtros
    this.concursos = this.concursosSinFiltrar.filter(concurso => {
      let cumpleFiltros = true;

      // Filtro por estado
      if (filtros.estado !== 'todos') {
        console.log('[ConcursosComponent] Evaluando concurso:', {
          id: concurso.id,
          titulo: concurso.title,
          estadoFiltro: filtros.estado,
          estadoConcurso: concurso.status
        });

        cumpleFiltros = concurso.status === filtros.estado;
      }

      // Resto de los filtros solo si el estado ya cumple
      if (cumpleFiltros) {
        if (filtros.dependencia !== 'todos') {
          cumpleFiltros = concurso.dependencia?.toLowerCase() === filtros.dependencia.toLowerCase();
        }

        if (cumpleFiltros && filtros.cargo !== 'todos') {
          cumpleFiltros = concurso.position?.toLowerCase().includes(filtros.cargo.toLowerCase());
        }

        if (cumpleFiltros && filtros.periodo !== 'todos') {
          const fechas = this.obtenerFechasPeriodo(filtros.periodo);
          if (fechas) {
            const fechaConcurso = new Date(concurso.startDate);
            cumpleFiltros = fechaConcurso >= fechas.fechaInicio && fechaConcurso <= fechas.fechaFin;
          }
        }
      }

      return cumpleFiltros;
    });

    console.log('[ConcursosComponent] Resultado del filtrado:', {
      totalOriginal: this.concursosSinFiltrar.length,
      totalFiltrado: this.concursos.length,
      filtrosAplicados: filtros
    });
  }

  private hayFiltrosActivos(filtros: FiltersConcurso): boolean {
    return Object.values(filtros).some(valor =>
      valor !== null &&
      valor !== undefined &&
      valor !== 'todos'
    );
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.cargarConcursos();
  }

  getEstadoConcursoLabel(status: string): string {
    return translateContestStatus(status);
  }

  retryLoad(): void {
    this.error = null;
    this.loading = true;
    this.cargarConcursos();
  }

  onInscriptionComplete(concurso: Concurso): void {
    console.log('[ConcursosComponent] Iniciando proceso de inscripción para concurso:', concurso.id);

    // CORRECCIÓN: Navegar al proceso de inscripción en lugar de asumir que ya está completada
    this.router.navigate(['/dashboard/inscripcion'], {
      queryParams: {
        contestId: concurso.id
      }
    });
  }

  // Método para cuando realmente se complete una inscripción (llamado desde otros lugares)
  onInscriptionReallyComplete(concurso: Concurso): void {
    console.log('[ConcursosComponent] Inscripción realmente completada para concurso:', concurso.id);

    // Forzar una actualización de las inscripciones del usuario
    this.inscriptionService.refreshInscriptions();

    // Actualizar la lista de concursos después de una inscripción exitosa
    // Agregamos un pequeño delay para dar tiempo a que se actualice el estado en el backend
    setTimeout(() => {
      this.cargarConcursos();
    }, 1000);

    this.notification.success(`Te has inscrito exitosamente al concurso "${concurso.title}"`);

    // Si el concurso está seleccionado, actualizar su vista de detalle
    if (this.concursoSeleccionado?.id === concurso.id) {
      this.concursoSeleccionado = { ...concurso };
    }
  }

  verDetalle(concurso: Concurso, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.concursoSeleccionado = concurso;
  }

  cerrarDetalle(): void {
    this.concursoSeleccionado = null;
  }

  private obtenerFechasPeriodo(periodo: string): { fechaInicio: Date, fechaFin: Date } | null {
    if (periodo === 'todos') return null;

    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        fechaFin = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'semana': {
        fechaInicio = new Date(hoy);
        const diaSemana = hoy.getDay();
        fechaInicio.setDate(hoy.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'mes': {
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'trimestre': {
        const trimestre = Math.floor(hoy.getMonth() / 3);
        fechaInicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
        fechaFin = new Date(hoy.getFullYear(), (trimestre + 1) * 3, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'anio': {
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = new Date(hoy.getFullYear(), 11, 31);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      default:
        return null;
    }

    return { fechaInicio, fechaFin };
  }

  hayFiltrosAplicados(): boolean {
    if (this.primeraConsulta) {
      return false;
    }
    return this.hayFiltrosActivos(this.filtros) || Boolean(this.searchTerm?.trim());
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtrosActivos = false;
    this.filtros = {
      estado: 'todos',
      dependencia: 'todos',
      cargo: 'todos',
      periodo: 'todos'
    };
    this.cargarConcursos();
  }

  onSeleccionarConcurso(concurso: Concurso): void {
    // Convertir el concurso al formato Contest
    const concursoConvertido = {
      ...concurso,
      department: concurso.dependencia,
      class: concurso.category, // Asumimos que la categoría actual se usará como clase
      category: concurso.category // Mantenemos la categoría actual
    };
    this.verDetalle(concursoConvertido);
  }

  /**
   * Selecciona un concurso por su ID
   * @param id ID del concurso a seleccionar
   */
  seleccionarConcursoPorId(id: number): void {
    console.log('[ConcursosComponent] Buscando concurso con ID:', id);

    // Si ya tenemos los concursos cargados, buscar el concurso
    if (this.concursos.length > 0) {
      const concurso = this.concursos.find(c => c.id === id);
      if (concurso) {
        console.log('[ConcursosComponent] Concurso encontrado:', concurso);
        this.onSeleccionarConcurso(concurso);
      } else {
        console.log('[ConcursosComponent] Concurso no encontrado en la lista actual');
      }
    } else {
      // Si no tenemos los concursos cargados, esperar a que se carguen
      console.log('[ConcursosComponent] Esperando a que se carguen los concursos...');
      setTimeout(() => {
        const concurso = this.concursos.find(c => c.id === id);
        if (concurso) {
          console.log('[ConcursosComponent] Concurso encontrado después de esperar:', concurso);
          this.onSeleccionarConcurso(concurso);
        } else {
          console.log('[ConcursosComponent] Concurso no encontrado después de esperar');
        }
      }, 1000);
    }
  }
}
