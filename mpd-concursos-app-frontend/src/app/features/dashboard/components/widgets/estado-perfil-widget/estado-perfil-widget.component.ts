/**
 * EstadoPerfilWidgetComponent
 * ✅ LIMPIEZA: Estilos y template extraídos a archivos separados
 */

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

@Component({
  selector: 'app-estado-perfil-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" *ngIf="dashboardData">
      <div class="widget-header">
        <div class="header-content">
          <i class="fas fa-user-circle widget-icon"></i>
          <h3>Estado del Perfil</h3>
        </div>
        <div class="completion-badge" [class]="getCompletionClass()">
          {{ dashboardData.profileCompletion }}%
        </div>
      </div>

      <div class="widget-body">
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="dashboardData.profileCompletion"
              [class]="getProgressClass()">
            </div>
          </div>
        </div>

        <div class="status-message">
          <p [class]="getMessageClass()">
            {{ getStatusMessage() }}
          </p>
        </div>

        <div class="pending-items" *ngIf="dashboardData.pendingDocuments > 0">
          <div class="pending-item">
            <i class="fas fa-file-alt"></i>
            <span>{{ dashboardData.pendingDocuments }} documentos pendientes</span>
          </div>
        </div>

        <button
          class="action-button"
          (click)="navigateToProfile()"
          [class]="getButtonClass()">
          <i class="fas fa-edit"></i>
          {{ getActionText() }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./estado-perfil-widget.component.scss']
})
export class EstadoPerfilWidgetComponent implements OnInit {
  @Input() dashboardData: SimpleDashboardData | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  getCompletionClass(): string {
    if (!this.dashboardData) return 'low';
    
    const completion = this.dashboardData.profileCompletion;
    if (completion >= 80) return 'high';
    if (completion >= 50) return 'medium';
    return 'low';
  }

  getProgressClass(): string {
    return this.getCompletionClass();
  }

  getMessageClass(): string {
    const baseClass = this.getCompletionClass();
    if (baseClass === 'high') return 'success';
    if (baseClass === 'medium') return 'warning';
    return 'error';
  }

  getButtonClass(): string {
    if (!this.dashboardData) return 'incomplete';
    return this.dashboardData.profileCompletion >= 80 ? 'complete' : 'incomplete';
  }

  getStatusMessage(): string {
    if (!this.dashboardData) return 'Cargando información del perfil...';
    
    const completion = this.dashboardData.profileCompletion;
    if (completion >= 80) {
      return 'Tu perfil está completo y listo para postulaciones.';
    } else if (completion >= 50) {
      return 'Tu perfil está parcialmente completo. Completa la información restante.';
    } else {
      return 'Tu perfil necesita más información para poder postularte.';
    }
  }

  getActionText(): string {
    if (!this.dashboardData) return 'Ver Perfil';
    return this.dashboardData.profileCompletion >= 80 ? 'Ver Perfil' : 'Completar Perfil';
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/perfil']);
  }
}
