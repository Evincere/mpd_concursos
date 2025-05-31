import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from  '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConcursoDate } from '@shared/interfaces/concurso/concurso-date.interface';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

interface ImportantDate {
  id: string;
  title: string;
  description?: string;
  date: Date;
  daysRemaining: number;
  type: string;
  important: boolean;
  notificationSent: boolean;
  reminderEnabled: boolean;
}

@Component({
  selector: 'app-fechas-importantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    ConfirmDialogComponent
  ],
  template: `
    <div class="fechas-importantes-container">
      <div class="header">
        <h3 class="title">Fechas Importantes</h3>
        <p class="description">Configure recordatorios para fechas importantes de los concursos</p>
      </div>

      <div class="content">
        <div class="filter-section">
          <form [formGroup]="filterForm" class="filter-form">
            <mat-form-field appearance="outline">
              <mat-label>Filtrar por tipo</mat-label>
              <mat-select formControlName="type">
                <mat-option value="">Todos</mat-option>
                <mat-option value="deadline">Fechas límite</mat-option>
                <mat-option value="exam">Exámenes</mat-option>
                <mat-option value="result">Resultados</mat-option>
                <mat-option value="other">Otros</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Filtrar por proximidad</mat-label>
              <mat-select formControlName="proximity">
                <mat-option value="">Todos</mat-option>
                <mat-option value="week">Próximos 7 días</mat-option>
                <mat-option value="month">Próximos 30 días</mat-option>
                <mat-option value="past">Fechas pasadas</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-checkbox formControlName="onlyImportant" color="primary">
              Solo fechas importantes
            </mat-checkbox>
          </form>
        </div>

        <div class="dates-list">
          <mat-card *ngFor="let date of filteredDates" class="date-card" [ngClass]="getDateCardClass(date)">
            <mat-card-content>
              <div class="date-header">
                <div class="date-title">
                  <h4>{{ date.title }}</h4>
                  <mat-icon *ngIf="date.important" class="important-icon" matTooltip="Fecha importante">
                    priority_high
                  </mat-icon>
                </div>

                <div class="date-actions">
                  <mat-slide-toggle
                    [checked]="date.reminderEnabled"
                    (change)="toggleReminder(date, $event.checked)"
                    color="primary"
                    matTooltip="Activar/desactivar recordatorio">
                  </mat-slide-toggle>
                </div>
              </div>

              <div class="date-info">
                <div class="date-details">
                  <div class="date-value">
                    <mat-icon>event</mat-icon>
                    <span>{{ date.date | date:'dd/MM/yyyy' }}</span>
                  </div>

                  <div class="date-type">
                    <mat-icon>{{ getTypeIcon(date.type) }}</mat-icon>
                    <span>{{ getTypeLabel(date.type) }}</span>
                  </div>
                </div>

                <div class="date-countdown" [ngClass]="getCountdownClass(date)">
                  <mat-icon>{{ getCountdownIcon(date) }}</mat-icon>
                  <span>{{ formatDaysRemaining(date.daysRemaining) }}</span>
                </div>
              </div>

              <p *ngIf="date.description" class="date-description">
                {{ date.description }}
              </p>

              <div class="reminder-settings" *ngIf="date.reminderEnabled">
                <h5>Configuración de recordatorios</h5>

                <div class="reminder-options">
                  <mat-checkbox
                    [checked]="getReminderSetting(date.id, 'email')"
                    (change)="updateReminderSetting(date.id, 'email', $event.checked)"
                    color="primary">
                    Correo electrónico
                  </mat-checkbox>

                  <mat-checkbox
                    [checked]="getReminderSetting(date.id, 'notification')"
                    (change)="updateReminderSetting(date.id, 'notification', $event.checked)"
                    color="primary">
                    Notificación en la aplicación
                  </mat-checkbox>

                  <mat-checkbox
                    [checked]="getReminderSetting(date.id, 'browser')"
                    (change)="updateReminderSetting(date.id, 'browser', $event.checked)"
                    color="primary">
                    Notificación del navegador
                  </mat-checkbox>
                </div>

                <div class="reminder-timing">
                  <mat-form-field appearance="outline">
                    <mat-label>Enviar recordatorio</mat-label>
                    <mat-select
                      [value]="getReminderTiming(date.id)"
                      (selectionChange)="updateReminderTiming(date.id, $event.value)">
                      <mat-option value="day">1 día antes</mat-option>
                      <mat-option value="week">1 semana antes</mat-option>
                      <mat-option value="custom">Personalizado</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field
                    appearance="outline"
                    *ngIf="getReminderTiming(date.id) === 'custom'">
                    <mat-label>Días antes</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      [value]="getCustomReminderDays(date.id)"
                      (change)="onCustomDaysChange($event, date.id)">
                  </mat-form-field>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <div *ngIf="filteredDates.length === 0" class="no-dates">
            <mat-icon>event_busy</mat-icon>
            <p>No se encontraron fechas importantes con los filtros seleccionados</p>
            <button mat-stroked-button color="primary" (click)="resetFilters()">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fechas-importantes-container {
      padding: 1.5rem;
    }

    .header {
      margin-bottom: 1.5rem;

      .title {
        font-size: var(--font-size-lg);
        font-weight: 500;
        margin: 0 0 0.5rem;
        color: var(--color-text-primary);
      }

      .description {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }
    }

    .filter-section {
      margin-bottom: 1.5rem;

      .filter-form {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;

        mat-form-field {
          flex: 1;
          min-width: 200px;
        }
      }
    }

    .dates-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }

    .date-card {
      border-radius: var(--border-radius);
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.urgent {
        border-left: 4px solid var(--color-error);
      }

      &.warning {
        border-left: 4px solid var(--color-warn);
      }

      &.upcoming {
        border-left: 4px solid var(--color-info);
      }

      &.distant {
        border-left: 4px solid var(--color-text-secondary);
      }

      &.past {
        border-left: 4px solid var(--color-success);
        opacity: 0.8;
      }
    }

    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .date-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h4 {
          font-size: var(--font-size-md);
          font-weight: 500;
          margin: 0;
          color: var(--color-text-primary);
        }

        .important-icon {
          color: var(--color-warn);
        }
      }
    }

    .date-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;

      .date-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .date-value,
        .date-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .date-countdown {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;

        &.urgent {
          color: var(--color-error);
        }

        &.warning {
          color: var(--color-warn);
        }

        &.upcoming {
          color: var(--color-info);
        }

        &.distant {
          color: var(--color-text-secondary);
        }

        &.past {
          color: var(--color-success);
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .date-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0 0 1rem;
    }

    .reminder-settings {
      background-color: var(--color-surface-light);
      padding: 1rem;
      border-radius: var(--border-radius-sm);

      h5 {
        font-size: var(--font-size-sm);
        font-weight: 500;
        margin: 0 0 0.75rem;
        color: var(--color-text-primary);
      }

      .reminder-options {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .reminder-timing {
        display: flex;
        gap: 1rem;

        mat-form-field {
          flex: 1;
        }
      }
    }

    .no-dates {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;

      mat-icon {
        font-size: 48px;
        color: var(--color-text-secondary);
        margin-bottom: 1rem;
      }

      p {
        color: var(--color-text-secondary);
        margin-bottom: 1.5rem;
      }
    }
  `]
})
export class FechasImportantesComponent implements OnInit, OnDestroy {
  @Input() dates: ConcursoDate[] = [];

  importantDates: ImportantDate[] = [];
  filteredDates: ImportantDate[] = [];

  filterForm: FormGroup;

  // Configuración de recordatorios
  reminderSettings: Record<string, { email: boolean, notification: boolean, browser: boolean, timing: string, customDays: number }> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      type: [''],
      proximity: [''],
      onlyImportant: [false]
    });
  }

  ngOnInit(): void {
    this.processImportantDates();

    // Suscribirse a cambios en los filtros
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Procesa las fechas importantes
   */
  processImportantDates(): void {
    const now = new Date();

    this.importantDates = this.dates.map(date => {
      // Usar startDate si está disponible, de lo contrario usar date
      const dateObj = date.startDate ? new Date(date.startDate) : (date.date ? new Date(date.date) : new Date());
      const daysRemaining = this.calculateDaysRemaining(dateObj, now);

      // Determinar tipo
      let type = 'other';
      const labelText = (date.label || date.title || '').toLowerCase();
      if (labelText.includes('examen') || labelText.includes('evaluación')) {
        type = 'exam';
      } else if (labelText.includes('resultado') || labelText.includes('publicación')) {
        type = 'result';
      } else if (labelText.includes('límite') || labelText.includes('cierre') || labelText.includes('vencimiento')) {
        type = 'deadline';
      }

      // Crear configuración de recordatorio por defecto
      this.reminderSettings[date.id] = {
        email: true,
        notification: true,
        browser: false,
        timing: 'day',
        customDays: 3
      };

      return {
        id: date.id,
        title: date.label || date.title || 'Fecha sin título',
        description: date.description,
        date: dateObj,
        daysRemaining,
        type,
        important: date.important || false,
        notificationSent: false,
        reminderEnabled: date.important || false // Activar recordatorios por defecto para fechas importantes
      };
    });

    // Aplicar filtros iniciales
    this.applyFilters();
  }

  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    const { type, proximity, onlyImportant } = this.filterForm.value;

    this.filteredDates = this.importantDates.filter(date => {
      // Filtrar por tipo
      if (type && date.type !== type) {
        return false;
      }

      // Filtrar por proximidad
      if (proximity) {
        if (proximity === 'week' && (date.daysRemaining < 0 || date.daysRemaining > 7)) {
          return false;
        } else if (proximity === 'month' && (date.daysRemaining < 0 || date.daysRemaining > 30)) {
          return false;
        } else if (proximity === 'past' && date.daysRemaining >= 0) {
          return false;
        }
      }

      // Filtrar por importancia
      if (onlyImportant && !date.important) {
        return false;
      }

      return true;
    });

    // Ordenar por proximidad (fechas más cercanas primero)
    this.filteredDates.sort((a, b) => {
      // Fechas pasadas al final
      if (a.daysRemaining < 0 && b.daysRemaining >= 0) return 1;
      if (a.daysRemaining >= 0 && b.daysRemaining < 0) return -1;

      // Ordenar por días restantes
      return a.daysRemaining - b.daysRemaining;
    });
  }

  /**
   * Restablece los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      type: '',
      proximity: '',
      onlyImportant: false
    });
  }

  /**
   * Calcula los días restantes hasta una fecha
   * @param date Fecha objetivo
   * @param now Fecha actual
   * @returns Días restantes
   */
  calculateDaysRemaining(date: Date, now: Date): number {
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene la clase CSS para una tarjeta de fecha
   * @param date Fecha importante
   * @returns Clase CSS
   */
  getDateCardClass(date: ImportantDate): string {
    if (date.daysRemaining < 0) return 'past';
    if (date.daysRemaining === 0) return 'urgent';
    if (date.daysRemaining <= 3) return 'urgent';
    if (date.daysRemaining <= 7) return 'warning';
    if (date.daysRemaining <= 14) return 'upcoming';
    return 'distant';
  }

  /**
   * Obtiene la clase CSS para la cuenta regresiva
   * @param date Fecha importante
   * @returns Clase CSS
   */
  getCountdownClass(date: ImportantDate): string {
    if (date.daysRemaining < 0) return 'past';
    if (date.daysRemaining === 0) return 'urgent';
    if (date.daysRemaining <= 3) return 'urgent';
    if (date.daysRemaining <= 7) return 'warning';
    if (date.daysRemaining <= 14) return 'upcoming';
    return 'distant';
  }

  /**
   * Obtiene el icono para la cuenta regresiva
   * @param date Fecha importante
   * @returns Icono
   */
  getCountdownIcon(date: ImportantDate): string {
    if (date.daysRemaining < 0) return 'check_circle';
    if (date.daysRemaining === 0) return 'today';
    if (date.daysRemaining <= 3) return 'alarm_on';
    if (date.daysRemaining <= 7) return 'alarm';
    return 'schedule';
  }

  /**
   * Formatea los días restantes
   * @param days Días restantes
   * @returns Texto formateado
   */
  formatDaysRemaining(days: number): string {
    if (days < 0) {
      return `Hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
    }
    if (days === 0) {
      return 'Hoy';
    }
    return `En ${days} día${days !== 1 ? 's' : ''}`;
  }

  /**
   * Obtiene el icono para un tipo de fecha
   * @param type Tipo de fecha
   * @returns Icono
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'deadline':
        return 'alarm';
      case 'exam':
        return 'assignment';
      case 'result':
        return 'assessment';
      default:
        return 'event';
    }
  }

  /**
   * Obtiene la etiqueta para un tipo de fecha
   * @param type Tipo de fecha
   * @returns Etiqueta
   */
  getTypeLabel(type: string): string {
    switch (type) {
      case 'deadline':
        return 'Fecha límite';
      case 'exam':
        return 'Examen';
      case 'result':
        return 'Resultado';
      default:
        return 'Otro';
    }
  }

  /**
   * Activa o desactiva un recordatorio
   * @param date Fecha importante
   * @param enabled Estado del recordatorio
   */
  toggleReminder(date: ImportantDate, enabled: boolean): void {
    date.reminderEnabled = enabled;

    this.snackBar.open(
      `Recordatorio ${enabled ? 'activado' : 'desactivado'} para "${date.title}"`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  /**
   * Obtiene la configuración de un recordatorio
   * @param dateId ID de la fecha
   * @param setting Configuración a obtener
   * @returns Valor de la configuración
   */
  getReminderSetting(dateId: string, setting: 'email' | 'notification' | 'browser'): boolean {
    return this.reminderSettings[dateId]?.[setting] || false;
  }

  /**
   * Actualiza la configuración de un recordatorio
   * @param dateId ID de la fecha
   * @param setting Configuración a actualizar
   * @param value Nuevo valor
   */
  updateReminderSetting(dateId: string, setting: 'email' | 'notification' | 'browser', value: boolean): void {
    if (this.reminderSettings[dateId]) {
      this.reminderSettings[dateId][setting] = value;
    }
  }

  /**
   * Obtiene el tiempo de envío de un recordatorio
   * @param dateId ID de la fecha
   * @returns Tiempo de envío
   */
  getReminderTiming(dateId: string): string {
    return this.reminderSettings[dateId]?.timing || 'day';
  }

  /**
   * Actualiza el tiempo de envío de un recordatorio
   * @param dateId ID de la fecha
   * @param timing Nuevo tiempo de envío
   */
  updateReminderTiming(dateId: string, timing: string): void {
    if (this.reminderSettings[dateId]) {
      this.reminderSettings[dateId].timing = timing;
    }
  }

  /**
   * Obtiene los días personalizados para un recordatorio
   * @param dateId ID de la fecha
   * @returns Días personalizados
   */
  getCustomReminderDays(dateId: string): number {
    return this.reminderSettings[dateId]?.customDays || 3;
  }

  /**
   * Actualiza los días personalizados para un recordatorio
   * @param dateId ID de la fecha
   * @param days Nuevos días personalizados
   */
  updateCustomReminderDays(dateId: string, days: number | string): void {
    if (this.reminderSettings[dateId]) {
      const daysNum = typeof days === 'string' ? parseInt(days, 10) : days;
      this.reminderSettings[dateId].customDays = Math.max(1, daysNum || 3);
    }
  }

  /**
   * Maneja el cambio en el campo de días personalizados
   * @param event Evento de cambio
   * @param dateId ID de la fecha
   */
  onCustomDaysChange(event: Event, dateId: string): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.updateCustomReminderDays(dateId, input.value);
    }
  }
}
