import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { AnimateDirective } from '@shared/directives/animate.directive';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';

@Component({
  selector: 'app-concurso-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    AnimateDirective,
    InscripcionButtonComponent,
    ContestStatusBadgeComponent
  ],
  template: `
    <div class="concurso-card"
         [appAnimate]="'fadeIn'"
         [animationDuration]="300"
         [animationDelay]="index * 100"
         matRipple
         (click)="verDetalle.emit(concurso)"
         (keydown.enter)="verDetalle.emit(concurso)"
         (keydown.space)="verDetalle.emit(concurso); $event.preventDefault()"
         tabindex="0"
         role="button"
         [attr.aria-label]="'Ver detalles de concurso: ' + concurso.title">

      <div class="card-header">
        <app-contest-status-badge
          [status]="concurso.status"
          [showIcon]="true">
        </app-contest-status-badge>
        <div class="fecha">
          <i class="fas fa-calendar-alt" aria-hidden="true"></i>
          <span>{{ concurso.startDate | date:'dd/MM/yyyy' }} - {{ concurso.endDate | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>

      <div class="card-content">
        <h3>{{ concurso.title }}</h3>
        <p class="cargo">{{ concurso.position }}</p>
        <p class="dependencia">{{ concurso.dependencia }}</p>
      </div>

      <div class="card-actions" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="0" role="group" aria-label="Acciones del concurso">
        <button mat-stroked-button
                class="details-button"
                (click)="onVerDetalle($event)"
                aria-label="Ver detalles del concurso">
          <mat-icon class="details-icon" aria-hidden="true">visibility</mat-icon>
          <span>Ver Detalles</span>
        </button>

        <app-inscripcion-button
          *ngIf="concurso.status === 'ACTIVE'"
          [contest]="concurso"
          (inscriptionComplete)="inscriptionComplete.emit(concurso)">
        </app-inscripcion-button>
      </div>
    </div>
  `,
  styles: [`
    .concurso-card {
      background: #374151;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      overflow: hidden;
      height: 100%;
      position: relative;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);

      // Glassmorphism gradient overlay
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        pointer-events: none;
        z-index: 1;
      }

      // Content positioning
      > * {
        position: relative;
        z-index: 2;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.4),
          0 6px 20px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);

        .card-content h3 {
          color: #3b82f6;
        }

        .details-button {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }
      }

      &:active {
        transform: translateY(0);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);

        .fecha {
          font-size: 0.875rem;
          color: #d1d5db;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;

          i {
            color: #3b82f6;
            opacity: 0.8;
          }
        }
      }

      .card-content {
        padding: 1.25rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f9fafb;
          transition: color 0.3s ease;
          line-height: 1.4;
        }

        .cargo {
          margin: 0;
          font-size: 1rem;
          color: #d1d5db;
          font-weight: 500;
        }

        .dependencia {
          margin: 0;
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 400;
        }
      }

      .card-actions {
        display: flex;
        justify-content: space-between;
        padding: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
        gap: 0.75rem;

        .details-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          border-color: rgba(255, 255, 255, 0.2);
          color: #f9fafb;
          font-weight: 500;

          &:hover {
            transform: translateY(-1px);
          }

          .details-icon {
            font-size: 1.1rem;
            height: 1.1rem;
            width: 1.1rem;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .concurso-card {
        .card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
        }

        .card-content {
          padding: 1rem;
          gap: 0.5rem;
        }

        .card-actions {
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;

          button {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }

    // Accessibility and reduced motion support
    @media (prefers-reduced-motion: reduce) {
      .concurso-card {
        transition: none;

        &:hover {
          transform: none;
        }

        .details-button:hover {
          transform: none;
        }
      }
    }

    // Focus states for accessibility
    .concurso-card:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `]
})
export class ConcursoCardComponent {
  @Input() concurso!: Concurso;
  @Input() index = 0;

  @Output() verDetalle = new EventEmitter<Concurso>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();

  onVerDetalle(event: Event): void {
    event.stopPropagation();
    this.verDetalle.emit(this.concurso);
  }
}
