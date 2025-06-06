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
  styles: [`
    .widget-container {
      background: rgba(55, 65, 81, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(156, 163, 175, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }

    .widget-container:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .widget-icon {
      color: #3b82f6;
      font-size: 1.5rem;
    }

    h3 {
      color: #f9fafb;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .completion-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .completion-badge.high {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .completion-badge.medium {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .completion-badge.low {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .widget-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-container {
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(75, 85, 99, 0.5);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.8s ease;
      border-radius: 4px;
    }

    .progress-fill.high {
      background: linear-gradient(90deg, #22c55e, #16a34a);
    }

    .progress-fill.medium {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .progress-fill.low {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .status-message p {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-message .success {
      color: #22c55e;
    }

    .status-message .warning {
      color: #f59e0b;
    }

    .status-message .error {
      color: #ef4444;
    }

    .pending-items {
      margin-top: 0.5rem;
    }

    .pending-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #f59e0b;
      font-size: 0.875rem;
    }

    .pending-item i {
      font-size: 0.75rem;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: auto;
    }

    .action-button.complete {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .action-button.complete:hover {
      background: rgba(34, 197, 94, 0.3);
      transform: translateY(-1px);
    }

    .action-button.incomplete {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .action-button.incomplete:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .widget-container {
        padding: 1rem;
      }

      h3 {
        font-size: 1rem;
      }

      .completion-badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
      }
    }
  `]
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
