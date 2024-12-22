import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { ConcursosService } from '@core/services/concursos/concursos.service';
import { InscripcionService } from '@core/services/inscripcion/inscripcion.service';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { FiltrosPanelComponent } from './components/filtros-panel/filtros-panel.component';
import { ConcursoDetalleComponent } from './components/concurso-detalle/concurso-detalle.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { InscripcionButtonComponent } from './components/inscripcion/inscripcion-button/inscripcion-button.component';
import { FiltersConcurso } from '@shared/interfaces/filters/filters-concurso.interface';

@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InscripcionButtonComponent,
    SearchHeaderComponent,
    FiltrosPanelComponent,
    ConcursoDetalleComponent,
    LoaderComponent
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
export class ConcursosComponent implements OnInit {
  concursos: Concurso[] = [];
  loading = false;
  error: any = null;
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
  searchTerm: string = '';
  primeraConsulta = true;

  constructor(
    private concursosService: ConcursosService,
    private inscripcionService: InscripcionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarConcursos();
  }

  cargarConcursos(): void {
    this.loading = true;
    this.concursosService.getConcursos().subscribe({
      next: (concursos: Concurso[]) => {
        console.log('Concursos recibidos:', concursos);
        this.concursos = concursos;
        this.concursosSinFiltrar = [...concursos]; // Guardamos una copia sin filtrar
        this.loading = false;
        this.primeraConsulta = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar los concursos:', error);
        this.error = error;
        this.loading = false;
        this.snackBar.open('Error al cargar los concursos', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  onSearch(term: string): void {
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
    
    // Aquí implementar la lógica de filtrado
    this.concursos = this.concursosSinFiltrar.filter(concurso => {
      // Filtro por estado
      if (filtros.estado === 'activo') {
        if (concurso.status !== 'PUBLISHED') {
          return false;
        }
      } else if (filtros.estado === 'finalizado') {
        if (concurso.status !== 'CLOSED') {
          return false;
        }
      } else if (filtros.estado && filtros.estado !== 'todos') {
        console.log('Filtrando por estado:', filtros.estado);
        console.log('Estado del concurso:', concurso.status);
        if (concurso.status !== filtros.estado) {
          return false;
        }
      }

      // Filtro por dependencia
      if (filtros.dependencia && filtros.dependencia !== 'todos') {
        if (!concurso.dependencia || 
            concurso.dependencia.toLowerCase() !== filtros.dependencia.toLowerCase()) {
          return false;
        }
      }

      // Filtro por cargo
      if (filtros.cargo && filtros.cargo !== 'todos') {
        if (!concurso.position || 
            !concurso.position.toLowerCase().includes(filtros.cargo.toLowerCase())) {
          return false;
        }
      }

      // Filtro por período
      if (filtros.periodo && filtros.periodo !== 'todos') {
        const fechas = this.obtenerFechasPeriodo(filtros.periodo);
        if (fechas) {
          const fechaConcurso = new Date(concurso.startDate);
          if (fechaConcurso < fechas.fechaInicio || fechaConcurso > fechas.fechaFin) {
            return false;
          }
        }
      }

      return true;
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
    const estados: { [key: string]: string } = {
      'PUBLISHED': 'Publicado',
      'DRAFT': 'Borrador',
      'CLOSED': 'Cerrado'
    };
    return estados[status] || status;
  }

  retryLoad(): void {
    this.error = null;
    this.loading = true;
    this.cargarConcursos();
  }

  onInscriptionComplete(concurso: Concurso): void {
    // Actualizar la lista de concursos después de una inscripción exitosa
    this.cargarConcursos();
    // Opcional: actualizar el concurso seleccionado si es necesario
    if (this.concursoSeleccionado?.id === concurso.id) {
      this.concursoSeleccionado = { ...concurso };
    }
    this.snackBar.open(
      `Te has inscrito exitosamente al concurso "${concurso.title}"`,
      'Cerrar',
      { duration: 5000 }
    );
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
      case 'semana':
        fechaInicio = new Date(hoy);
        const diaSemana = hoy.getDay();
        fechaInicio.setDate(hoy.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'trimestre':
        const trimestre = Math.floor(hoy.getMonth() / 3);
        fechaInicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
        fechaFin = new Date(hoy.getFullYear(), (trimestre + 1) * 3, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = new Date(hoy.getFullYear(), 11, 31);
        fechaFin.setHours(23, 59, 59, 999);
        break;
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
}
