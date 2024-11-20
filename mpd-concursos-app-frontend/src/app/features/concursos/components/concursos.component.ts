import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ConcursosHeaderComponent } from './concursos-header/concursos-header.component';
import { ConcursosCategoriaComponent } from './concursos-categoria/concursos-categoria.component';
import { FiltrosPanelComponent } from './filtros-panel/filtros-panel.component';
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { CategoriaEnum } from '../../../shared/constants/enums/categoria-enum';
import { BusquedaConcurso, FiltrosConcurso } from '../../../shared/interfaces/filters/filtros.interface';
import { ConcursosService } from '../../../core/services/concursos/concursos.service';

@Component({
  selector: 'app-concursos',
  standalone: true,
  imports: [
    CommonModule,
    ConcursosHeaderComponent,
    ConcursosCategoriaComponent,
    FiltrosPanelComponent
  ],
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(60, [
            animate('300ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          stagger(40, [
            animate('200ms ease-out', 
              style({ opacity: 0, transform: 'translateY(15px)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', 
          style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class ConcursosComponent implements OnInit {
  @ViewChild(ConcursosHeaderComponent) header!: ConcursosHeaderComponent;

  concursos: Concurso[] = [];
  concursosFiltrados: Concurso[] = [];
  categorias: CategoriaEnum[] = [];
  mostrarFiltros = false;
  filtrosActivos: FiltrosConcurso = {};
  terminoBusqueda: string = '';

  constructor(private concursosService: ConcursosService) { }

  ngOnInit(): void {
    this.cargarConcursos();
  }
  cargarConcursos(): void {
    this.concursosService.getConcursos().subscribe({
      next: (concursos: Concurso[]) => {
        this.concursos = concursos;
        this.concursosFiltrados = concursos;
        this.categorias = [...new Set(concursos.map(c => c.categoria))] as CategoriaEnum[];
      }
    });
  }

  getConcursosPorCategoria(categoria: string): Concurso[] {
    return this.concursosFiltrados
      .filter(c => c.categoria === categoria)
      .filter(c => this.aplicarFiltrosActivos(c));
  }

  aplicarFiltrosActivos(concurso: Concurso): boolean {
    if (!this.filtrosActivos) return true;

    const { estado, fechaDesde, fechaHasta, dependencia, cargo } = this.filtrosActivos;

    if (estado && concurso.estado !== estado) return false;
    if (dependencia && concurso.dependencia !== dependencia) return false;
    if (cargo && concurso.cargo !== cargo) return false;

    if (fechaDesde) {
      const fechaInicio = new Date(concurso.fechaInicio);
      if (fechaInicio < new Date(fechaDesde)) return false;
    }

    if (fechaHasta) {
      const fechaFin = new Date(concurso.fechaFin);
      if (fechaFin > new Date(fechaHasta)) return false;
    }

    return true;
  }

  toggleFiltrosPanel(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
    console.log('Toggle filtros:', this.mostrarFiltros);
  }

  aplicarFiltros(filtros: FiltrosConcurso): void {
    this.filtrosActivos = filtros;
    this.mostrarFiltros = false;
  }

  realizarBusqueda(busqueda: BusquedaConcurso): void {
    this.terminoBusqueda = busqueda.termino?.toLowerCase() || '';
    
    if (!this.terminoBusqueda) {
      this.concursosFiltrados = this.concursos;
      return;
    }

    this.concursosFiltrados = this.concursos.filter(concurso => 
      concurso.titulo.toLowerCase().includes(this.terminoBusqueda) ||
      concurso.cargo.toLowerCase().includes(this.terminoBusqueda) ||
      concurso.dependencia.toLowerCase().includes(this.terminoBusqueda)
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.concursosFiltrados = this.concursos;
    // También limpiamos el formulario en el header
    this.header.searchForm.get('termino')?.setValue('');
  }
}
