import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from  '@angular/forms';
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
            <div class="filter-group">
              <label class="filter-label">Filtrar por tipo</label>
              <select formControlName="type" class="custom-select">
                <option value="">Todos</option>
                <option value="deadline">Fechas límite</option>
                <option value="exam">Exámenes</option>
                <option value="result">Resultados</option>
                <option value="other">Otros</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Filtrar por proximidad</label>
              <select formControlName="proximity" class="custom-select">
                <option value="">Todos</option>
                <option value="week">Próximos 7 días</option>
                <option value="month">Próximos 30 días</option>
                <option value="past">Fechas pasadas</option>
              </select>
            </div>

            <div class="filter-group checkbox-group">
              <label class="checkbox-container">
                <input type="checkbox" formControlName="onlyImportant" class="custom-checkbox">
                <span class="checkmark"></span>
                <span class="checkbox-label">Solo fechas importantes</span>
              </label>
            </div>
          </form>
        </div>

        <div class="dates-list">
          <div *ngFor="let date of filteredDates" class="date-card" [ngClass]="getDateCardClass(date)">
            <div class="date-header">
              <div class="date-title">
                <h4>{{ date.title }}</h4>
                <i *ngIf="date.important" class="fas fa-exclamation-triangle important-icon" title="Fecha importante"></i>
              </div>

              <div class="date-actions">
                <label class="toggle-container">
                  <input
                    type="checkbox"
                    [checked]="date.reminderEnabled"
                    (change)="onToggleReminderChange($event, date)"
                    class="custom-toggle">
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">Recordatorio</span>
                </label>
              </div>
            </div>

            <div class="date-info">
              <div class="date-details">
                <div class="date-value">
                  <i class="fas fa-calendar-alt"></i>
                  <span>{{ date.date | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="date-type">
                  <i class="fas {{ getTypeIcon(date.type) }}"></i>
                  <span>{{ getTypeLabel(date.type) }}</span>
                </div>
              </div>

              <div class="date-countdown" [ngClass]="getCountdownClass(date)">
                <i class="fas {{ getCountdownIcon(date) }}"></i>
                <span>{{ formatDaysRemaining(date.daysRemaining) }}</span>
              </div>
            </div>

            <p *ngIf="date.description" class="date-description">
              {{ date.description }}
            </p>

            <div class="reminder-settings" *ngIf="date.reminderEnabled">
              <h5>Configuración de recordatorios</h5>

              <div class="reminder-options">
                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    [checked]="getReminderSetting(date.id, 'email')"
                    (change)="onReminderSettingChange($event, date.id, 'email')"
                    class="custom-checkbox">
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Correo electrónico</span>
                </label>

                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    [checked]="getReminderSetting(date.id, 'notification')"
                    (change)="onReminderSettingChange($event, date.id, 'notification')"
                    class="custom-checkbox">
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Notificación en la aplicación</span>
                </label>

                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    [checked]="getReminderSetting(date.id, 'browser')"
                    (change)="onReminderSettingChange($event, date.id, 'browser')"
                    class="custom-checkbox">
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Notificación del navegador</span>
                </label>
              </div>

              <div class="reminder-timing">
                <div class="timing-group">
                  <label class="timing-label">Enviar recordatorio</label>
                  <select
                    [value]="getReminderTiming(date.id)"
                    (change)="onReminderTimingChange($event, date.id)"
                    class="custom-select">
                    <option value="day">1 día antes</option>
                    <option value="week">1 semana antes</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div class="timing-group" *ngIf="getReminderTiming(date.id) === 'custom'">
                  <label class="timing-label">Días antes</label>
                  <input
                    type="number"
                    min="1"
                    [value]="getCustomReminderDays(date.id)"
                    (change)="onCustomDaysChange($event, date.id)"
                    class="custom-input">
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredDates.length === 0" class="no-dates">
            <i class="fas fa-calendar-times no-dates-icon"></i>
            <h4>No se encontraron fechas importantes</h4>
            <p>No se encontraron fechas importantes con los filtros seleccionados</p>
            <button class="custom-button primary outlined" (click)="resetFilters()">
              <i class="fas fa-filter"></i>
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== ENHANCED GLASSMORPHISM DESIGN SYSTEM - FECHAS IMPORTANTES ===== */
    /* Consistent with admin dashboard and contest theme #4CAF50 */

    .fechas-importantes-container {
      padding: 1.5rem;
      background: transparent; /* Inherit dashboard background */
      min-height: 100%;
      color: #f9fafb;
    }

    .header {
      margin-bottom: 2rem;
      /* Premium glassmorphism header */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.85) 0%,
        rgba(75, 85, 99, 0.95) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(76, 175, 80, 0.1) 30%, rgba(255, 255, 255, 0.12) 70%, rgba(76, 175, 80, 0.08) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        color: #f9fafb;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);

        &::before {
          content: "📅";
          font-size: 1.25rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }
      }

      .description {
        font-size: 1rem;
        color: #d1d5db;
        margin: 0;
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        opacity: 0.9;
      }
    }

    .filter-section {
      margin-bottom: 2rem;
      /* Premium glassmorphism for filters */
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

      .filter-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        align-items: end;
      }
    }

    /* ===== CUSTOM FORM ELEMENTS GLASSMORPHISM ===== */

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label,
    .timing-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #d1d5db;
      margin-bottom: 0.25rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .custom-select,
    .custom-input {
      /* Enhanced glassmorphism for form elements */
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.8) 0%,
        rgba(55, 65, 81, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      color: #f9fafb;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      &:focus {
        outline: none;
        border-color: rgba(76, 175, 80, 0.6);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.15),
          0 0 0 3px rgba(76, 175, 80, 0.2);
        background-image: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }

      &:hover {
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
    }

    .custom-select option {
      background: #374151;
      color: #f9fafb;
      padding: 0.5rem;
    }

    .dates-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .date-card {
      /* Premium glassmorphism for date cards */
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 12px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        background-image:
          linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(76, 175, 80, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%);
      }

      &.urgent {
        border-left: 4px solid #ef4444;
        background-image:
          linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }

      &.warning {
        border-left: 4px solid #f59e0b;
        background-image:
          linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }

      &.upcoming {
        border-left: 4px solid #3b82f6;
        background-image:
          linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }

      &.distant {
        border-left: 4px solid #6b7280;
        background-image:
          linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }

      &.past {
        border-left: 4px solid #10b981;
        background-image:
          linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        opacity: 0.85;
      }
    }

    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;

      .date-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;

        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #f9fafb;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          line-height: 1.3;
        }

        .important-icon {
          color: #f59e0b;
          font-size: 1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          animation: pulse 2s infinite;
        }
      }
    }

    .date-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;

      .date-details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: 1;

        .date-value,
        .date-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #d1d5db;
          font-weight: 500;

          i {
            font-size: 0.875rem;
            width: 16px;
            color: #9ca3af;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          }
        }
      }

      .date-countdown {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

        &.urgent {
          color: #fecaca;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%);
          border-color: rgba(239, 68, 68, 0.4);
        }

        &.warning {
          color: #fde68a;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%);
          border-color: rgba(245, 158, 11, 0.4);
        }

        &.upcoming {
          color: #bfdbfe;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%);
          border-color: rgba(59, 130, 246, 0.4);
        }

        &.distant {
          color: #d1d5db;
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(107, 114, 128, 0.2) 100%);
          border-color: rgba(107, 114, 128, 0.4);
        }

        &.past {
          color: #bbf7d0;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-color: rgba(16, 185, 129, 0.4);
        }

        i {
          font-size: 0.875rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }
      }
    }

    .date-description {
      font-size: 0.875rem;
      color: #d1d5db;
      margin: 0 0 1.25rem;
      line-height: 1.5;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    /* ===== CUSTOM CHECKBOX GLASSMORPHISM ===== */

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      position: relative;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      }
    }

    .custom-checkbox {
      position: absolute;
      opacity: 0;
      cursor: pointer;

      &:checked ~ .checkmark {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.9) 100%);
        border-color: rgba(76, 175, 80, 0.6);

        &::after {
          display: block;
        }
      }

      &:focus ~ .checkmark {
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
      }
    }

    .checkmark {
      height: 18px;
      width: 18px;
      background: linear-gradient(135deg, rgba(75, 85, 99, 0.8) 0%, rgba(55, 65, 81, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);

      &::after {
        content: "";
        position: absolute;
        display: none;
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
    }

    .checkbox-label {
      font-size: 0.875rem;
      color: #d1d5db;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      user-select: none;
    }

    /* ===== CUSTOM TOGGLE GLASSMORPHISM ===== */

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .custom-toggle {
      position: absolute;
      opacity: 0;
      cursor: pointer;

      &:checked ~ .toggle-slider {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.9) 100%);
        border-color: rgba(76, 175, 80, 0.6);

        &::before {
          transform: translateX(20px);
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      }

      &:focus ~ .toggle-slider {
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
      }
    }

    .toggle-slider {
      position: relative;
      width: 44px;
      height: 24px;
      background: linear-gradient(135deg, rgba(75, 85, 99, 0.8) 0%, rgba(55, 65, 81, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);

      &::before {
        content: "";
        position: absolute;
        height: 18px;
        width: 18px;
        left: 2px;
        top: 2px;
        background: #9ca3af;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .toggle-label {
      font-size: 0.875rem;
      color: #d1d5db;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      user-select: none;
    }

    .reminder-settings {
      /* Enhanced glassmorphism for reminder settings */
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.6) 0%,
        rgba(55, 65, 81, 0.8) 100%);
      background-image: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      h5 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: #f9fafb;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &::before {
          content: "⚙️";
          font-size: 0.875rem;
        }
      }

      .reminder-options {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .reminder-timing {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .timing-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    .no-dates {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      /* Premium glassmorphism for empty state */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      .no-dates-icon {
        font-size: 3rem;
        color: #9ca3af;
        margin-bottom: 1rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        opacity: 0.7;
      }

      h4 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #f9fafb;
        margin: 0 0 0.5rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      p {
        color: #d1d5db;
        margin: 0 0 1.5rem;
        text-align: center;
        font-size: 0.875rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .custom-button {
        /* Enhanced glassmorphism for custom button */
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg,
          rgba(76, 175, 80, 0.8) 0%,
          rgba(76, 175, 80, 0.9) 100%);
        border: 1px solid rgba(76, 175, 80, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 6px;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

        &:hover {
          background: linear-gradient(135deg,
            rgba(76, 175, 80, 0.9) 0%,
            rgba(76, 175, 80, 1) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          border-color: rgba(76, 175, 80, 0.6);
        }

        &:focus {
          outline: none;
          box-shadow:
            0 4px 16px rgba(76, 175, 80, 0.3),
            0 0 0 3px rgba(76, 175, 80, 0.2);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        &.outlined {
          background: linear-gradient(135deg,
            rgba(75, 85, 99, 0.8) 0%,
            rgba(55, 65, 81, 0.9) 100%);
          border-color: rgba(76, 175, 80, 0.6);
          color: #4CAF50;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          &:hover {
            background: linear-gradient(135deg,
              rgba(76, 175, 80, 0.2) 0%,
              rgba(76, 175, 80, 0.3) 100%);
            color: #ffffff;
            border-color: rgba(76, 175, 80, 0.8);
          }
        }

        i {
          font-size: 0.875rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        span {
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      }
    }

    /* ===== RESPONSIVE DESIGN GLASSMORPHISM ===== */

    @media (max-width: 992px) {
      .dates-list {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.25rem;
      }

      .filter-section .filter-form {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .date-card {
        padding: 1.25rem;
        /* Optimize glassmorphism for tablets */
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
    }

    @media (max-width: 768px) {
      .fechas-importantes-container {
        padding: 1rem;
      }

      .header {
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        /* Optimize glassmorphism for mobile */
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);

        .title {
          font-size: 1.25rem;
          gap: 0.5rem;

          &::before {
            font-size: 1rem;
          }
        }

        .description {
          font-size: 0.875rem;
        }
      }

      .filter-section {
        padding: 1.25rem;
        margin-bottom: 1.5rem;
      }

      .dates-list {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .date-card {
        padding: 1rem;
        /* Enhanced mobile glassmorphism */
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        .date-header {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;

          .date-title h4 {
            font-size: 1rem;
          }
        }

        .date-info {
          flex-direction: column;
          gap: 1rem;

          .date-countdown {
            align-self: flex-start;
          }
        }

        .reminder-settings {
          padding: 1rem;

          .reminder-options {
            flex-direction: column;
            gap: 0.75rem;
          }

          .reminder-timing {
            grid-template-columns: 1fr;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .fechas-importantes-container {
        padding: 0.75rem;
      }

      .header {
        padding: 1rem;
        /* Minimal glassmorphism for very small screens */
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        .title {
          font-size: 1.125rem;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
      }

      .filter-section {
        padding: 1rem;
      }

      .date-card {
        padding: 0.875rem;

        .date-header .date-title h4 {
          font-size: 0.9375rem;
        }

        .reminder-settings h5 {
          font-size: 0.875rem;
        }
      }

      .no-dates {
        padding: 2rem 1rem;

        .no-dates-icon {
          font-size: 2.5rem;
        }

        h4 {
          font-size: 1.125rem;
        }
      }
    }

    /* ===== ACCESSIBILITY ENHANCEMENTS ===== */

    @media (prefers-reduced-motion: reduce) {
      .fechas-importantes-container,
      .header,
      .filter-section,
      .date-card,
      .custom-checkbox,
      .custom-toggle,
      .checkmark,
      .toggle-slider {
        transition: none !important;
        animation: none !important;
      }
    }

    @media (prefers-contrast: high) {
      .header,
      .filter-section,
      .date-card,
      .reminder-settings,
      .no-dates {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .custom-select,
      .custom-input,
      .checkmark,
      .toggle-slider {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.3);
      }
    }

    /* Focus states for keyboard navigation */
    .header:focus-within,
    .filter-section:focus-within,
    .date-card:focus-within {
      outline: 2px solid rgba(76, 175, 80, 0.6);
      outline-offset: 2px;
    }

    /* ===== ANIMATIONS ===== */

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
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
   * @returns Icono FontAwesome
   */
  getCountdownIcon(date: ImportantDate): string {
    if (date.daysRemaining < 0) return 'fa-check-circle';
    if (date.daysRemaining === 0) return 'fa-calendar-day';
    if (date.daysRemaining <= 3) return 'fa-bell';
    if (date.daysRemaining <= 7) return 'fa-clock';
    return 'fa-calendar-week';
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
   * @returns Icono FontAwesome
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'deadline':
        return 'fa-exclamation-triangle';
      case 'exam':
        return 'fa-file-alt';
      case 'result':
        return 'fa-chart-bar';
      default:
        return 'fa-calendar';
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
      {
        duration: 3000,
        panelClass: ['custom-snackbar']
      }
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

  /**
   * Maneja el cambio en el toggle de recordatorio
   * @param event Evento de cambio
   * @param date Fecha importante
   */
  onToggleReminderChange(event: Event, date: ImportantDate): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.toggleReminder(date, input.checked);
    }
  }

  /**
   * Maneja el cambio en la configuración de recordatorio
   * @param event Evento de cambio
   * @param dateId ID de la fecha
   * @param setting Tipo de configuración
   */
  onReminderSettingChange(event: Event, dateId: string, setting: 'email' | 'notification' | 'browser'): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.updateReminderSetting(dateId, setting, input.checked);
    }
  }

  /**
   * Maneja el cambio en el timing de recordatorio
   * @param event Evento de cambio
   * @param dateId ID de la fecha
   */
  onReminderTimingChange(event: Event, dateId: string): void {
    const select = event.target as HTMLSelectElement;
    if (select) {
      this.updateReminderTiming(dateId, select.value);
    }
  }
}
