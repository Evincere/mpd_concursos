import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from  '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { AdminConcursosService } from '../../../../../../core/services/admin/admin-concursos.service';
import { ConcursoTimelineComponent } from '../concurso-timeline/concurso-timeline.component';
import { FechasImportantesComponent } from '../fechas-importantes/fechas-importantes.component';
import { ConcursoFechasComponent } from '../concurso-fechas/concurso-fechas.component';
import { DateAdapter } from '@shared/adapters/date-adapter';

@Component({
  selector: 'app-concurso-fechas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ConcursoTimelineComponent,
    FechasImportantesComponent,
    ConcursoFechasComponent
  ],
  template: `
    <div class="fechas-dashboard-container">
      <div class="header">
        <div class="title-section">
          <h2 class="title">Gestión de Fechas</h2>
          <p class="subtitle" *ngIf="concurso">{{ concurso.title }}</p>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando información del concurso...</p>
      </div>

      <div class="error-container" *ngIf="error">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ error }}</p>
        <button mat-flat-button color="primary" (click)="loadConcurso()">
          Reintentar
        </button>
      </div>

      <div class="content" *ngIf="concurso && !isLoading">
        <mat-card class="timeline-card">
          <mat-card-content>
            <app-concurso-timeline [concurso]="concurso"></app-concurso-timeline>
          </mat-card-content>
        </mat-card>

        <mat-divider></mat-divider>

        <mat-tab-group>
          <mat-tab label="Fechas Importantes">
            <app-fechas-importantes [dates]="concurso && concurso.dates ? DateAdapter.toConursoDates(concurso.dates) : []"></app-fechas-importantes>
          </mat-tab>

          <mat-tab label="Gestión de Fechas">
            <app-concurso-fechas
              [contestId]="concursoId"
              (fechasUpdated)="loadConcurso()">
            </app-concurso-fechas>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .fechas-dashboard-container {
      padding: 1.5rem;
      background: #1a1a1a;
      min-height: 100vh;
      color: #ffffff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;

      .title-section {
        .title {
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title::before {
          content: "📅";
          font-size: 1.75rem;
        }

        .subtitle {
          font-size: 1rem;
          color: #b0b0b0;
          margin: 0;
        }
      }
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #2a2a2a;
      border-radius: 8px;
      margin: 2rem 0;

      p {
        margin: 1rem 0;
        color: #b0b0b0;
        font-size: 1rem;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #666666;
      }
    }

    .error-container {
      mat-icon {
        color: #e74c3c;
      }
    }

    .content {
      .timeline-card {
        margin-bottom: 2rem;
        background: #2a2a2a !important;
        color: #ffffff !important;
      }

      mat-divider {
        margin: 2rem 0;
        border-color: #444444;
      }

      // Estilos para las pestañas de Material
      mat-tab-group {
        background: #2a2a2a;
        border-radius: 8px;
        overflow: hidden;

        .mat-mdc-tab-header {
          background: #333333;

          .mat-mdc-tab {
            color: #b0b0b0;

            &.mdc-tab--active {
              color: #3498db;
            }
          }

          .mat-mdc-tab-header-pagination-chevron {
            border-color: #b0b0b0;
          }

          .mdc-tab-indicator__content--underline {
            border-color: #3498db;
          }
        }

        .mat-mdc-tab-body-wrapper {
          background: #2a2a2a;
        }
      }
    }
  `]
})
export class ConcursoFechasDashboardComponent implements OnInit, OnDestroy {
  // Exponer DateAdapter para usarlo en la plantilla
  DateAdapter = DateAdapter;

  concursoId = '';
  concurso: Concurso | null = null;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private concursosService: AdminConcursosService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Record<string, string>) => {
        this.concursoId = params['id'];
        if (this.concursoId) {
          this.loadConcurso();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la información del concurso
   */
  loadConcurso(): void {
    if (!this.concursoId) return;

    this.isLoading = true;
    this.error = null;

    this.concursosService.getConcursoById(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (concurso: Concurso) => {
          this.concurso = concurso;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando concurso:', error);
          this.error = 'Error al cargar la información del concurso. Por favor, inténtelo de nuevo.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Navega de vuelta a la lista de concursos
   */
  goBack(): void {
    this.router.navigate(['/admin/concursos']);
  }
}
