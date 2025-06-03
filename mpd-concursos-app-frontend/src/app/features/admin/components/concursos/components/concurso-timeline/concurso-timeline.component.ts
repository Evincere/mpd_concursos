import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { Concurso } from '@shared/interfaces/concurso/concurso.interface';


interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: 'start' | 'end' | 'milestone' | 'deadline' | 'exam' | 'result';
  status: 'past' | 'current' | 'future';
  important: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-concurso-timeline',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <!-- ===== ENHANCED GLASSMORPHISM TIMELINE ===== -->
    <div class="timeline-container">
      <div class="timeline-header">
        <h3 class="timeline-title">Línea de Tiempo del Concurso</h3>
        <span class="timeline-icon">⏰</span>
      </div>

      <div class="timeline">
        <div class="timeline-line"></div>

        <div *ngFor="let event of timelineEvents; let i = index"
             class="timeline-event"
             [class.past]="event.status === 'past'"
             [class.current]="event.status === 'current'"
             [class.future]="event.status === 'future'"
             [class.important]="event.important">

          <div class="event-connector"></div>

          <div class="event-icon" [class]="event.color">
            <span class="icon-emoji">{{ getEventEmoji(event.icon) }}</span>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h4 class="event-title">{{ event.title }}</h4>
              <div class="event-badges">
                <span class="event-badge important" *ngIf="event.important" title="Fecha importante">
                  <span class="badge-icon">⚠️</span>
                </span>
                <span class="event-badge priority" [class]="event.status">
                  <span class="badge-text">{{ getStatusLabel(event.status) }}</span>
                </span>
              </div>
            </div>

            <div class="event-date">
              <span class="date-icon">📅</span>
              <span class="date-text">{{ event.date | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="event.endDate" class="date-range"> - {{ event.endDate | date:'dd/MM/yyyy' }}</span>
            </div>

            <p class="event-description" *ngIf="event.description">{{ event.description }}</p>

            <div class="event-status">
              <div class="status-chip" [class]="getStatusClass(event.status)">
                <span class="status-icon">{{ getStatusIcon(event.status) }}</span>
                <span class="status-text">{{ getStatusLabel(event.status) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="timelineEvents.length === 0" class="timeline-empty">
          <span class="empty-icon">📅</span>
          <h4 class="empty-title">No hay eventos en la línea de tiempo</h4>
          <p class="empty-description">Los eventos aparecerán aquí cuando se agreguen fechas al concurso</p>
        </div>
      </div>

      <div class="timeline-legend" *ngIf="timelineEvents.length > 0">
        <div class="legend-header">
          <h4 class="legend-title">Leyenda</h4>
        </div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-icon past"></div>
            <span class="legend-text">Completado</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon current"></div>
            <span class="legend-text">En curso</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon future"></div>
            <span class="legend-text">Pendiente</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== ENHANCED GLASSMORPHISM TIMELINE DESIGN SYSTEM ===== */
    /* Consistent with admin dashboard and contest theme #4CAF50 */

    .timeline-container {
      padding: 1.5rem;
      background: transparent; /* Inherit dashboard background */
      color: #f9fafb;
    }

    .timeline-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #f9fafb;
      margin: 0 0 2rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      text-align: center;
    }

    /* ===== ENHANCED GLASSMORPHISM TIMELINE ===== */

    .timeline {
      position: relative;
      padding: 2rem 0 2rem 2rem;
      /* Premium glassmorphism for timeline container */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(76, 175, 80, 0.08) 50%, rgba(255, 255, 255, 0.06) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    }

    .timeline-line {
      position: absolute;
      left: 2rem;
      top: 1rem;
      bottom: 1rem;
      width: 3px;
      background: linear-gradient(to bottom,
        rgba(76, 175, 80, 0.8) 0%,
        rgba(76, 175, 80, 0.6) 50%,
        rgba(76, 175, 80, 0.4) 100%);
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
      transform: translateX(-50%);
    }

    /* ===== ENHANCED TIMELINE EVENTS ===== */

    .timeline-event {
      position: relative;
      margin-bottom: 2rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        transform: translateX(5px);
      }

      &.past .event-icon {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%);
        border-color: rgba(76, 175, 80, 0.6);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      &.current .event-icon {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 152, 0, 1) 100%);
        border-color: rgba(255, 152, 0, 0.6);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        animation: pulse 2s infinite;
      }

      &.future .event-icon {
        background: linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(158, 158, 158, 1) 100%);
        border-color: rgba(158, 158, 158, 0.6);
        box-shadow: 0 4px 12px rgba(158, 158, 158, 0.3);
      }
    }

    .event-connector {
      position: absolute;
      top: 1.5rem;
      left: -2.5rem;
      width: 1.5rem;
      height: 3px;
      background: linear-gradient(90deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.4) 100%);
      border-radius: 2px;
    }

    .event-icon {
      position: absolute;
      top: 0.5rem;
      left: -3.5rem;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
      border: 3px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(-50%);
      z-index: 1;

      .icon-emoji {
        font-size: 1.25rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      &:hover {
        transform: translateX(-50%) scale(1.1);
      }

      &.primary {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 1) 100%);
        border-color: rgba(59, 130, 246, 0.6);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      &.success {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%);
        border-color: rgba(76, 175, 80, 0.6);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      &.warning {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 152, 0, 1) 100%);
        border-color: rgba(255, 152, 0, 0.6);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      }

      &.info {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(33, 150, 243, 1) 100%);
        border-color: rgba(33, 150, 243, 0.6);
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      }
    }

    /* ===== ENHANCED EVENT CONTENT ===== */

    .event-content {
      /* Premium glassmorphism for event content */
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.8) 0%,
        rgba(55, 65, 81, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(76, 175, 80, 0.05) 50%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background-image:
          linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(76, 175, 80, 0.08) 50%, rgba(255, 255, 255, 0.06) 100%);
        transform: translateY(-1px);
        box-shadow:
          0 12px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .event-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #f9fafb;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      flex: 1;
    }

    .event-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 1) 100%);
      color: #ffffff;
      border: 1px solid rgba(239, 68, 68, 0.4);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }

    .event-date {
      font-size: 0.875rem;
      color: #4CAF50;
      font-weight: 600;
      margin-bottom: 1rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .event-description {
      color: #d1d5db;
      margin: 0 0 1rem 0;
      line-height: 1.6;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .event-status {
      display: flex;
      gap: 0.5rem;

      .success-chip,
      .primary-chip,
      .default-chip {
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .success-chip {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%);
        color: #ffffff;
        border-color: rgba(76, 175, 80, 0.4);
      }

      .primary-chip {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(33, 150, 243, 1) 100%);
        color: #ffffff;
        border-color: rgba(33, 150, 243, 0.4);
      }

      .default-chip {
        background: linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(158, 158, 158, 1) 100%);
        color: #ffffff;
        border-color: rgba(158, 158, 158, 0.4);
      }
    }

    /* ===== ENHANCED GLASSMORPHISM LEGEND ===== */

    .timeline-legend {
      margin-top: 2rem;
      /* Premium glassmorphism for legend */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(76, 175, 80, 0.08) 50%, rgba(255, 255, 255, 0.06) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);

      .legend-header {
        margin-bottom: 1rem;
        text-align: center;

        .legend-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #f9fafb;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      }

      .legend-items {
        display: flex;
        justify-content: center;
        gap: 1.5rem;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%);
          }

          .legend-icon {
            width: 1rem;
            height: 1rem;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

            &.past {
              background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%);
            }

            &.current {
              background: linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 152, 0, 1) 100%);
            }

            &.future {
              background: linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(158, 158, 158, 1) 100%);
            }
          }

          .legend-text {
            color: #d1d5db;
            font-size: 0.875rem;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }

    /* ===== ANIMATIONS ===== */

    @keyframes pulse {
      0% {
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3), 0 0 0 0 rgba(255, 152, 0, 0.7);
      }
      70% {
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3), 0 0 0 10px rgba(255, 152, 0, 0);
      }
      100% {
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3), 0 0 0 0 rgba(255, 152, 0, 0);
      }
    }

    /* ===== RESPONSIVE DESIGN ===== */

    @media (max-width: 768px) {
      .timeline-container {
        padding: 1rem;
      }

      .timeline {
        padding: 1.5rem 0 1.5rem 1.5rem;
      }

      .timeline-line {
        left: 1.25rem;
      }

      .timeline-event {
        .event-icon {
          left: -2.5rem;
          width: 2.5rem;
          height: 2.5rem;

          .icon-emoji {
            font-size: 1rem;
          }
        }

        .event-connector {
          left: -1.75rem;
          width: 1rem;
        }
      }

      .event-header {
        flex-direction: column;
        gap: 0.75rem;
      }

      .legend-items {
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .timeline {
        padding: 1rem 0 1rem 1rem;
      }

      .timeline-line {
        left: 0.75rem;
      }

      .timeline-event {
        .event-icon {
          left: -1.75rem;
          width: 2rem;
          height: 2rem;

          .icon-emoji {
            font-size: 0.875rem;
          }
        }

        .event-connector {
          left: -1.25rem;
          width: 0.75rem;
        }
      }

      .event-content {
        padding: 1rem;
      }
    }

    /* ===== ACCESSIBILITY ===== */

    @media (prefers-reduced-motion: reduce) {
      .timeline-event,
      .event-icon,
      .event-content {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
    }

    @media (prefers-contrast: high) {
      .timeline,
      .event-content,
      .timeline-legend {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    /* Focus states for keyboard navigation */
    .timeline-container *:focus-visible {
      outline: 2px solid rgba(76, 175, 80, 0.8);
      outline-offset: 2px;
      border-radius: 4px;
    }
  `]
})
export class ConcursoTimelineComponent implements OnInit, OnDestroy {
  @Input() concurso!: Concurso;
  @Input() showLegend = true;

  timelineEvents: TimelineEvent[] = [];

  private destroy$ = new Subject<void>();



  ngOnInit(): void {
    this.processTimelineEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Procesa los eventos de la línea de tiempo
   */
  processTimelineEvents(): void {
    if (!this.concurso) return;

    const events: TimelineEvent[] = [];
    const now = new Date();

    // Evento de inicio del concurso
    events.push({
      id: 'start',
      title: 'Inicio del Concurso',
      date: new Date(this.concurso.startDate),
      type: 'start',
      status: this.getEventStatus(new Date(this.concurso.startDate), now),
      important: true,
      icon: 'play_arrow',
      color: 'success'
    });

    // Evento de fin del concurso
    events.push({
      id: 'end',
      title: 'Fin del Concurso',
      date: new Date(this.concurso.endDate),
      type: 'end',
      status: this.getEventStatus(new Date(this.concurso.endDate), now),
      important: true,
      icon: 'flag',
      color: 'warning'
    });

    // Procesar fechas del concurso
    if (this.concurso.dates && this.concurso.dates.length > 0) {
      this.concurso.dates.forEach((date, index) => {
        events.push(this.createEventFromDate(date, index, now));
      });
    }

    // Ordenar eventos por fecha
    this.timelineEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Crea un evento de línea de tiempo a partir de una fecha del concurso
   * @param date Fecha del concurso
   * @param index Índice de la fecha
   * @param now Fecha actual
   * @returns Evento de línea de tiempo
   */
  createEventFromDate(date: unknown, index: number, now: Date): TimelineEvent {
    // Usar startDate si está disponible, de lo contrario usar date
    const dateObj = date as Record<string, unknown>;
    const startDate = dateObj['startDate'] ? new Date(dateObj['startDate'] as string) : (dateObj['date'] ? new Date(dateObj['date'] as string) : new Date());
    const endDate = dateObj['endDate'] ? new Date(dateObj['endDate'] as string) : undefined;

    let type: 'milestone' | 'deadline' | 'exam' | 'result' = 'milestone';
    let icon = 'event';
    let color = 'primary';

    // Determinar tipo y icono según el label o title
    const labelText = ((dateObj['label'] as string) || (dateObj['title'] as string) || '').toLowerCase();
    if (labelText.includes('examen') || labelText.includes('evaluación')) {
      type = 'exam';
      icon = 'assignment';
      color = 'info';
    } else if (labelText.includes('resultado') || labelText.includes('publicación')) {
      type = 'result';
      icon = 'assessment';
      color = 'success';
    } else if (labelText.includes('límite') || labelText.includes('cierre') || labelText.includes('vencimiento')) {
      type = 'deadline';
      icon = 'alarm';
      color = 'warning';
    }

    return {
      id: `date-${index}`,
      title: (dateObj['label'] as string) || (dateObj['title'] as string) || 'Fecha sin título',
      description: dateObj['description'] as string,
      date: startDate,
      endDate: endDate,
      type: type,
      status: this.getEventStatus(startDate, now, endDate),
      important: (dateObj['important'] as boolean) || false,
      icon: icon,
      color: color
    };
  }

  /**
   * Determina el estado de un evento según su fecha
   * @param date Fecha del evento
   * @param now Fecha actual
   * @param endDate Fecha de fin del evento (opcional)
   * @returns Estado del evento
   */
  getEventStatus(date: Date, now: Date, endDate?: Date): 'past' | 'current' | 'future' {
    if (endDate) {
      if (now > endDate) return 'past';
      if (now < date) return 'future';
      return 'current';
    }

    if (now > date) return 'past';
    if (now < date) return 'future';
    return 'current';
  }

  /**
   * Obtiene la clase CSS para un estado
   * @param status Estado del evento
   * @returns Clase CSS
   */
  getStatusClass(status: 'past' | 'current' | 'future'): string {
    switch (status) {
      case 'past':
        return 'success-chip';
      case 'current':
        return 'primary-chip';
      case 'future':
        return 'default-chip';
      default:
        return '';
    }
  }

  /**
   * Obtiene la etiqueta para un estado
   * @param status Estado del evento
   * @returns Etiqueta
   */
  getStatusLabel(status: 'past' | 'current' | 'future'): string {
    switch (status) {
      case 'past':
        return 'Completado';
      case 'current':
        return 'En curso';
      case 'future':
        return 'Pendiente';
      default:
        return '';
    }
  }

  /**
   * Convierte iconos de Material UI a emojis
   * @param icon Icono de Material UI
   * @returns Emoji correspondiente
   */
  getEventEmoji(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'event': '📅',
      'schedule': '⏰',
      'assignment': '📋',
      'publish': '📊',
      'mic': '🎤',
      'description': '📄',
      'check_circle': '✅',
      'pending': '⏳',
      'error': '❌',
      'info': 'ℹ️',
      'warning': '⚠️',
      'star': '⭐',
      'flag': '🏁',
      'play_arrow': '▶️',
      'stop': '⏹️',
      'pause': '⏸️',
      'default': '📅'
    };

    return iconMap[icon] || iconMap['default'];
  }

  /**
   * Obtiene el icono para un estado
   * @param status Estado del evento
   * @returns Icono emoji
   */
  getStatusIcon(status: 'past' | 'current' | 'future'): string {
    switch (status) {
      case 'past':
        return '✅';
      case 'current':
        return '⏳';
      case 'future':
        return '📅';
      default:
        return '📅';
    }
  }
}
