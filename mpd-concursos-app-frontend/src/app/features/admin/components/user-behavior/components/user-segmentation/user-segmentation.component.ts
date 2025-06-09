import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-user-segmentation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="user-segmentation-container">
      <mat-card class="segmentation-card">
        <mat-card-header>
          <mat-card-title>Segmentación de Usuarios</mat-card-title>
          <mat-card-subtitle>Análisis de segmentos de usuarios según su comportamiento</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="placeholder-content">
            <p>Componente en desarrollo. Próximamente se mostrará la segmentación de usuarios.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-segmentation-container {
      padding: 16px;
    }

    .segmentation-card {
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
export class UserSegmentationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Inicialización del componente
    // Logging implementado con LoggingService;
  }

  ngOnDestroy(): void {
    // Limpieza de recursos
    this.destroy$.next();
    this.destroy$.complete();
  }
}
