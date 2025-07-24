import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

@Component({
  selector: 'app-proximos-vencimientos-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" *ngIf="dashboardData">
      <div class="widget-header">
        <div class="header-content">
          <i class="fas fa-clock widget-icon"></i>
          <h3>Próximos Vencimientos</h3>
        </div>
        <div class="urgency-badge" [class]="getUrgencyClass()">
          {{ getUrgencyText() }}
        </div>
      </div>

      <div class="widget-body">
        <div class="vencimientos-list" *ngIf="dashboardData.upcomingDeadlines.length > 0; else noVencimientos">
          <div
            class="vencimiento-item"
            *ngFor="let deadline of dashboardData.upcomingDeadlines; let i = index"
            [class]="getDeadlineClass(deadline.daysRemaining)">
            <div class="deadline-info">
              <div class="deadline-title">{{ deadline.title }}</div>
              <div class="deadline-date">{{ formatDate(deadline.date) }}</div>
              <!-- ✅ MEJORA: Mostrar tipo de vencimiento -->
              <div class="deadline-type" *ngIf="getDeadlineTypeText(deadline.title)">
                {{ getDeadlineTypeText(deadline.title) }}
              </div>
            </div>
            <div class="deadline-countdown">
              <span class="days-number">{{ deadline.daysRemaining }}</span>
              <span class="days-text">{{ getDaysText(deadline.daysRemaining) }}</span>
            </div>
          </div>
        </div>

        <ng-template #noVencimientos>
          <div class="no-deadlines">
            <i class="fas fa-check-circle"></i>
            <p>No tienes vencimientos próximos</p>
            <span class="subtitle">¡Estás al día con tus postulaciones!</span>
          </div>
        </ng-template>

        <button
          class="action-button"
          (click)="navigateToPostulaciones()"
          *ngIf="dashboardData.upcomingDeadlines.length > 0">
          <i class="fas fa-list"></i>
          Ver Todas las Postulaciones
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
      color: #f59e0b;
      font-size: 1.5rem;
    }

    h3 {
      color: #f9fafb;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .urgency-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .urgency-badge.urgent {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .urgency-badge.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .urgency-badge.normal {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .widget-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .vencimientos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .vencimiento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 8px;
      border-left: 4px solid;
      transition: all 0.2s ease;
    }

    .vencimiento-item:hover {
      transform: translateX(4px);
    }

    .vencimiento-item.urgent {
      background: rgba(239, 68, 68, 0.1);
      border-left-color: #ef4444;
    }

    .vencimiento-item.warning {
      background: rgba(245, 158, 11, 0.1);
      border-left-color: #f59e0b;
    }

    .vencimiento-item.normal {
      background: rgba(59, 130, 246, 0.1);
      border-left-color: #3b82f6;
    }

    .deadline-info {
      flex: 1;
    }

    .deadline-title {
      color: #f9fafb;
      font-weight: 500;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .deadline-date {
      color: #d1d5db;
      font-size: 0.75rem;
    }

    .deadline-type {
      color: #9ca3af;
      font-size: 0.6875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.125rem;
      padding: 0.125rem 0.375rem;
      background: rgba(156, 163, 175, 0.1);
      border-radius: 4px;
      display: inline-block;
    }

    .deadline-countdown {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .days-number {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .days-text {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    .urgent .days-number,
    .urgent .days-text {
      color: #ef4444;
    }

    .warning .days-number,
    .warning .days-text {
      color: #f59e0b;
    }

    .normal .days-number,
    .normal .days-text {
      color: #3b82f6;
    }

    .no-deadlines {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1rem;
      flex: 1;
    }

    .no-deadlines i {
      font-size: 3rem;
      color: #22c55e;
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .no-deadlines p {
      color: #f9fafb;
      font-weight: 500;
      margin: 0 0 0.5rem 0;
    }

    .no-deadlines .subtitle {
      color: #d1d5db;
      font-size: 0.875rem;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: auto;
    }

    .action-button:hover {
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

      .urgency-badge {
        font-size: 0.625rem;
        padding: 0.2rem 0.6rem;
      }

      .vencimiento-item {
        padding: 0.5rem;
      }

      .deadline-title {
        font-size: 0.8rem;
      }

      .days-number {
        font-size: 1.25rem;
      }
    }
  `]
})
export class ProximosVencimientosWidgetComponent implements OnInit, OnChanges {
  @Input() dashboardData: SimpleDashboardData | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.logDeadlineData('ngOnInit');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboardData']) {
      this.logDeadlineData('ngOnChanges');
    }
  }

  private logDeadlineData(source: string): void {
    console.log(`🔍 [ProximosVencimientosWidget] ${source} - Dashboard data:`, this.dashboardData);
    if (this.dashboardData?.upcomingDeadlines) {
      console.log(`🔍 [ProximosVencimientosWidget] ${source} - Upcoming deadlines:`, this.dashboardData.upcomingDeadlines);
      console.log(`🔍 [ProximosVencimientosWidget] ${source} - Urgency class:`, this.getUrgencyClass());
      console.log(`🔍 [ProximosVencimientosWidget] ${source} - Urgency text:`, this.getUrgencyText());
    } else {
      console.log(`⚠️ [ProximosVencimientosWidget] ${source} - No upcoming deadlines data`);
    }
  }

  getUrgencyClass(): string {
    if (!this.dashboardData || this.dashboardData.upcomingDeadlines.length === 0) {
      return 'normal';
    }

    // ✅ CORREGIDO: Usar lógica alineada con backend (≤1 día = urgent, 2-7 días = warning)
    const minDays = Math.min(...this.dashboardData.upcomingDeadlines.map((d: any) => d.daysRemaining));

    if (minDays <= 1) return 'urgent';   // Alineado con backend HIGH priority
    if (minDays <= 7) return 'warning';  // Alineado con backend MEDIUM priority
    return 'normal';                     // Alineado con backend LOW priority
  }

  getUrgencyText(): string {
    const urgencyClass = this.getUrgencyClass();

    switch (urgencyClass) {
      case 'urgent': return 'Urgente';
      case 'warning': return 'Atención';
      default: return 'Normal';
    }
  }

  getDeadlineClass(daysRemaining: number): string {
    // ✅ CORREGIDO: Alineado con backend y getUrgencyClass()
    if (daysRemaining <= 1) return 'urgent';   // HIGH priority
    if (daysRemaining <= 7) return 'warning';  // MEDIUM priority
    return 'normal';                           // LOW priority
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * ✅ MEJORA: Texto más descriptivo para días restantes
   */
  getDaysText(daysRemaining: number): string {
    if (daysRemaining < 0) return 'vencido';
    if (daysRemaining === 0) return 'hoy';
    if (daysRemaining === 1) return 'día';
    return 'días';
  }

  /**
   * ✅ MEJORA: Extraer tipo de vencimiento del título
   */
  getDeadlineTypeText(title: string): string {
    if (title.toLowerCase().includes('inscripción')) return 'Inscripción';
    if (title.toLowerCase().includes('documentos')) return 'Documentación';
    if (title.toLowerCase().includes('examen')) return 'Examen';
    if (title.toLowerCase().includes('resultado')) return 'Resultado';
    return '';
  }

  navigateToPostulaciones(): void {
    // ✅ MEJORADO: Navegar a postulaciones con filtro de vencimientos próximos
    this.router.navigate(['/dashboard/postulaciones'], {
      queryParams: {
        filter: 'upcoming-deadlines',
        sortBy: 'deadline'
      }
    });
  }
}
