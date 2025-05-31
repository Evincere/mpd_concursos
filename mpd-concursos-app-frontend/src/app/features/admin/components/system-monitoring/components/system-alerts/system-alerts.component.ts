import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-system-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule
  ],
  template: `
    <div class="system-alerts-container">
      <mat-card class="alerts-card">
        <mat-card-header>
          <mat-card-title>Alertas del Sistema</mat-card-title>
          <mat-card-subtitle>Notificaciones y alertas del sistema</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="placeholder-content">
            <p>Componente en desarrollo. Próximamente se mostrarán alertas del sistema.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .system-alerts-container {
      padding: 16px;
    }

    .alerts-card {
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
export class SystemAlertsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Cargar alertas del sistema
    this.loadSystemAlerts();

    // Suscribirse a nuevas alertas
    this.subscribeToNewAlerts();
  }

  /**
   * Carga las alertas del sistema
   */
  private loadSystemAlerts(): void {
    // En una implementación real, esto cargaría las alertas desde un servicio
    console.log('Cargando alertas del sistema');
  }

  /**
   * Se suscribe a nuevas alertas
   */
  private subscribeToNewAlerts(): void {
    // En una implementación real, esto se suscribiría a un servicio de alertas
    console.log('Suscribiéndose a nuevas alertas');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
