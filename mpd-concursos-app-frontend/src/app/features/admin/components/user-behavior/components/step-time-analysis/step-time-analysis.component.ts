import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-step-time-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="step-time-analysis-container">
      <mat-card class="analysis-card">
        <mat-card-header>
          <mat-card-title>Análisis de Tiempo por Paso</mat-card-title>
          <mat-card-subtitle>Tiempo promedio que los usuarios pasan en cada paso del proceso de inscripción</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="placeholder-content">
            <p>Componente en desarrollo. Próximamente se mostrará el análisis de tiempo por paso.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .step-time-analysis-container {
      padding: 16px;
    }

    .analysis-card {
      margin-bottom: 16px;
    }

    .placeholder-content {
      padding: 20px;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      margin: 16px 0;
    }
  `]
})
export class StepTimeAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Inicialización del componente
    console.log('StepTimeAnalysisComponent inicializado');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
