import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
  badge?: string;
}

@Component({
  selector: 'app-acciones-rapidas-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <div class="header-content">
          <i class="fas fa-bolt widget-icon"></i>
          <h3>Acciones Rápidas</h3>
        </div>
      </div>
      
      <div class="widget-body">
        <div class="actions-grid">
          <div 
            class="action-item" 
            *ngFor="let action of quickActions"
            [class.disabled]="!action.enabled"
            (click)="executeAction(action)">
            
            <div class="action-icon" [style.color]="action.color">
              <i [class]="action.icon"></i>
              <span class="action-badge" *ngIf="action.badge">{{ action.badge }}</span>
            </div>
            
            <div class="action-content">
              <div class="action-title">{{ action.title }}</div>
              <div class="action-description">{{ action.description }}</div>
            </div>
            
            <div class="action-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
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
      color: #8b5cf6;
      font-size: 1.5rem;
    }

    h3 {
      color: #f9fafb;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .widget-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .actions-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(75, 85, 99, 0.3);
      border: 1px solid rgba(156, 163, 175, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .action-item:hover:not(.disabled) {
      background: rgba(75, 85, 99, 0.5);
      transform: translateX(4px);
      border-color: rgba(156, 163, 175, 0.3);
    }

    .action-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .action-icon i {
      font-size: 1.25rem;
    }

    .action-badge {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 10px;
      min-width: 1rem;
      text-align: center;
      line-height: 1;
    }

    .action-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .action-title {
      color: #f9fafb;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .action-description {
      color: #d1d5db;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .action-arrow {
      color: #9ca3af;
      font-size: 0.75rem;
      transition: all 0.2s ease;
    }

    .action-item:hover:not(.disabled) .action-arrow {
      color: #f9fafb;
      transform: translateX(2px);
    }

    @media (max-width: 768px) {
      .widget-container {
        padding: 1rem;
      }

      h3 {
        font-size: 1rem;
      }

      .action-item {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .action-icon {
        width: 2rem;
        height: 2rem;
      }

      .action-icon i {
        font-size: 1rem;
      }

      .action-title {
        font-size: 0.8rem;
      }

      .action-description {
        font-size: 0.7rem;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        gap: 0.5rem;
      }

      .action-item {
        padding: 0.5rem;
      }

      .action-description {
        display: none;
      }
    }
  `]
})
export class AccionesRapidasWidgetComponent implements OnInit {
  @Input() dashboardData: SimpleDashboardData | null = null;

  quickActions: QuickAction[] = [
    {
      id: 'view-contests',
      title: 'Ver Concursos',
      description: 'Explorar concursos disponibles para postularse',
      icon: 'fas fa-search',
      route: '/dashboard/concursos',
      color: '#3b82f6',
      enabled: true
    },
    {
      id: 'my-applications',
      title: 'Mis Postulaciones',
      description: 'Revisar el estado de tus postulaciones',
      icon: 'fas fa-file-alt',
      route: '/dashboard/postulaciones',
      color: '#10b981',
      enabled: true
    },
    {
      id: 'complete-profile',
      title: 'Completar Perfil',
      description: 'Actualizar información personal y documentos',
      icon: 'fas fa-user-edit',
      route: '/dashboard/perfil',
      color: '#f59e0b',
      enabled: true
    },
    {
      id: 'take-exam',
      title: 'Rendir Examen',
      description: 'Acceder a exámenes disponibles',
      icon: 'fas fa-graduation-cap',
      route: '/dashboard/examenes',
      color: '#8b5cf6',
      enabled: true
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateActionBadges();
  }

  private updateActionBadges(): void {
    if (!this.dashboardData) return;

    // Actualizar badge para postulaciones
    const applicationsAction = this.quickActions.find(a => a.id === 'my-applications');
    if (applicationsAction && this.dashboardData.activeApplications > 0) {
      applicationsAction.badge = this.dashboardData.activeApplications.toString();
    }

    // Actualizar badge para completar perfil
    const profileAction = this.quickActions.find(a => a.id === 'complete-profile');
    if (profileAction && this.dashboardData.pendingDocuments > 0) {
      profileAction.badge = this.dashboardData.pendingDocuments.toString();
    }

    // Actualizar badge para exámenes
    const examAction = this.quickActions.find(a => a.id === 'take-exam');
    if (examAction && this.dashboardData.availableExams > 0) {
      examAction.badge = this.dashboardData.availableExams.toString();
    }
  }

  executeAction(action: QuickAction): void {
    if (!action.enabled) return;

    console.log(`[AccionesRapidasWidget] Ejecutando acción: ${action.title}`);
    this.router.navigate([action.route]);
  }
}
