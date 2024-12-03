import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { fadeInOut, fadeSlide, listAnimation, slideInOut } from '@shared/animations/animations';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { FiltrosPanelComponent } from './components/filtros-panel/filtros-panel.component';

@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterModule,
    MatButtonModule,
    SearchHeaderComponent,
    MatProgressSpinnerModule,
    LoaderComponent,
    FiltrosPanelComponent
  ],
  animations: [fadeInOut, fadeSlide, listAnimation, slideInOut]
})
export class ConcursosComponent implements OnInit {
  loading = false;
  concursos: Concurso[] = [];
  showFilters = false;
  searchTerm: string = '';
  error: HttpErrorResponse | null = null;

  constructor(private concursosService: ConcursosService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.cargarConcursos();
  }

  cargarConcursos(): void {
    this.loading = true;
    this.concursosService.getConcursos().subscribe({
      next: (concursos: Concurso[]) => {
        this.concursos = concursos;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar los concursos:', error);
        this.snackBar.open('Error al cargar los concursos', 'Cerrar', {
          duration: 3000
        });
        this.error = error;
        this.loading = false;
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    if (!term.trim()) {
      this.cargarConcursos();
      return;
    }
    
    const searchTermLower = term.toLowerCase();
    this.concursos = this.concursos.filter(concurso => 
      concurso.titulo.toLowerCase().includes(searchTermLower) ||
      concurso.cargo.toLowerCase().includes(searchTermLower) ||
      (concurso.dependencia && concurso.dependencia.toLowerCase().includes(searchTermLower)) ||
      (concurso.descripcion && concurso.descripcion.toLowerCase().includes(searchTermLower))
    );
  }

  onFilter(): void {
    this.showFilters = !this.showFilters;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.cargarConcursos();
  }

  getEstadoConcursoLabel(status: string): string {
    const estados: { [key: string]: string } = {
      'ACTIVO': 'Activo',
      'PROXIMO': 'Próximo',
      'FINALIZADO': 'Finalizado'
    };
    return estados[status] || status;
  }

  retryLoad() {
    this.error = null;
    this.loading = true;
    this.cargarConcursos();
  }
}
