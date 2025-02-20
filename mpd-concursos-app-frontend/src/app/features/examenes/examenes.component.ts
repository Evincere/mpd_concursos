import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';
import { Examen } from '@shared/interfaces/examen/examen.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { Subject, takeUntil } from 'rxjs';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-examenes',
  templateUrl: './examenes.component.html',
  styleUrls: ['./examenes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SearchHeaderComponent,
    LoaderComponent,
    RouterModule
  ]
})
export class ExamenesComponent implements OnInit, OnDestroy {
  examenes: Examen[] = [];
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private examenesState: ExamenesStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios de estado
    this.examenesState.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(examenes => this.examenes = examenes);

    this.examenesState.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.examenesState.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    // Cargar exámenes iniciales
    this.examenesState.loadExamenes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(termino: string): void {
    this.examenesState.filterExamenes(termino);
  }

  onFilter(): void {
    // Implementar filtros
  }

  iniciarExamen(examenId: string): void {
    this.router.navigate([`/dashboard/examenes/${examenId}/rendir`]);
  }
}
