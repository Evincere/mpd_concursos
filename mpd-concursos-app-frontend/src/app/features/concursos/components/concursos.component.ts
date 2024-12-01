import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ConcursosCategoriaComponent } from './concursos-categoria/concursos-categoria.component';
import { FiltrosPanelComponent } from './filtros-panel/filtros-panel.component';
import { listAnimation, fadeSlide, slideInOut, fadeInOut } from '@shared/animations/animations';
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { CategoriaEnum } from '../../../shared/constants/enums/categoria-enum';
import { FiltrosConcurso } from '../../../shared/interfaces/filters/filtros.interface';
import { ConcursosService } from '../../../core/services/concursos/concursos.service';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';

@Component({
  selector: 'app-concursos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SearchHeaderComponent,
    ConcursosCategoriaComponent,
    FiltrosPanelComponent
  ],
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  animations: [listAnimation, fadeSlide, slideInOut, fadeInOut]
})
export class ConcursosComponent implements OnInit {
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

  onSearch(termino: string): void {
    this.realizarBusqueda(termino);
  }

  onFilter(): void {
    this.toggleFiltrosPanel();
  }

  realizarBusqueda(busqueda: string): void {
    this.terminoBusqueda = busqueda.toLowerCase();
    
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
  }
}
