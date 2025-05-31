import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
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
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="timeline-container">
      <h3 class="timeline-title">Línea de Tiempo del Concurso</h3>

      <div class="timeline">
        <div class="timeline-line"></div>

        <div *ngFor="let event of timelineEvents" class="timeline-event" [ngClass]="event.status">
          <div class="event-connector"></div>

          <div class="event-icon" [ngClass]="event.color">
            <mat-icon>{{ event.icon }}</mat-icon>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h4 class="event-title">{{ event.title }}</h4>
              <span class="event-badge" *ngIf="event.important" matTooltip="Fecha importante">
                <mat-icon>priority_high</mat-icon>
              </span>
            </div>

            <div class="event-date">
              {{ event.date | date:'dd/MM/yyyy' }}
              <span *ngIf="event.endDate"> - {{ event.endDate | date:'dd/MM/yyyy' }}</span>
            </div>

            <p class="event-description" *ngIf="event.description">{{ event.description }}</p>

            <div class="event-status">
              <mat-chip [ngClass]="getStatusClass(event.status)">
                {{ getStatusLabel(event.status) }}
              </mat-chip>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-legend">
        <div class="legend-item">
          <div class="legend-icon past"></div>
          <span>Pasado</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon current"></div>
          <span>Actual</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon future"></div>
          <span>Futuro</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      padding: 1.5rem;
      background-color: var(--color-surface);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }

    .timeline-title {
      font-size: var(--font-size-lg);
      font-weight: 500;
      margin: 0 0 1.5rem;
      color: var(--color-text-primary);
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
      margin-bottom: 2rem;
    }

    .timeline-line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0.75rem;
      width: 2px;
      background-color: var(--color-border);
      transform: translateX(-50%);
    }

    .timeline-event {
      position: relative;
      margin-bottom: 2rem;

      &:last-child {
        margin-bottom: 0;
      }

      &.past .event-icon {
        background-color: var(--color-success-light);
        color: var(--color-success);
      }

      &.current .event-icon {
        background-color: var(--color-primary-light);
        color: var(--color-primary);
      }

      &.future .event-icon {
        background-color: var(--color-text-secondary-light);
        color: var(--color-text-secondary);
      }
    }

    .event-connector {
      position: absolute;
      top: 1rem;
      left: -2rem;
      width: 1rem;
      height: 2px;
      background-color: var(--color-border);
    }

    .event-icon {
      position: absolute;
      top: 0;
      left: -2rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      z-index: 1;

      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      &.primary {
        background-color: var(--color-primary-light);
        color: var(--color-primary);
      }

      &.success {
        background-color: var(--color-success-light);
        color: var(--color-success);
      }

      &.warning {
        background-color: var(--color-warn-light);
        color: var(--color-warn);
      }

      &.info {
        background-color: var(--color-info-light);
        color: var(--color-info);
      }
    }

    .event-content {
      padding: 1rem;
      background-color: var(--color-surface-light);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-xs);
    }

    .event-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .event-title {
      font-size: var(--font-size-md);
      font-weight: 500;
      margin: 0;
      color: var(--color-text-primary);
    }

    .event-badge {
      color: var(--color-warn);
    }

    .event-date {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: 0.5rem;
    }

    .event-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0 0 0.75rem;
    }

    .event-status {
      display: flex;
      justify-content: flex-end;
    }

    .timeline-legend {
      display: flex;
      gap: 1.5rem;
      justify-content: center;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .legend-icon {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;

        &.past {
          background-color: var(--color-success-light);
        }

        &.current {
          background-color: var(--color-primary-light);
        }

        &.future {
          background-color: var(--color-text-secondary-light);
        }
      }
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
}
