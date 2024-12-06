import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
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

@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    InscripcionButtonComponent,
    SearchHeaderComponent,
    FiltrosPanelComponent,
    ConcursoDetalleComponent,
    LoaderComponent
  ]
})
export class ConcursosComponent implements OnInit {
  loading = false;
  concursos: Concurso[] = [];
  showFilters = false;
  searchTerm: string = '';
  error: HttpErrorResponse | null = null;
  concursoSeleccionado: Concurso | null = null;

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
        this.loading = false;
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
    if (!term.trim()) {
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
    this.showFilters = !this.showFilters;
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

  onInscriptionComplete(concursoId: string): void {
    const concurso = this.concursos.find(c => c.id === concursoId);
    if (concurso) {
      this.snackBar.open(
        `Te has inscrito exitosamente al concurso "${concurso.title}"`,
        'Cerrar',
        { duration: 5000 }
      );
      // Recargar la lista de concursos para actualizar estados
      this.cargarConcursos();
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
}
