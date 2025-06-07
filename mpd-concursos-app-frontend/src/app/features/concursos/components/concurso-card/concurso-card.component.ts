import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { AnimateDirective } from '@shared/directives/animate.directive';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

@Component({
  selector: 'app-concurso-card',
  standalone: true,
  imports: [
    CommonModule,
    AnimateDirective,
    InscripcionButtonComponent,
    ContestStatusBadgeComponent,
    CustomButtonComponent
  ],
  template: `
    <div class="concurso-card"
         [appAnimate]="'fadeIn'"
         [animationDuration]="300"
         [animationDelay]="index * 100"
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
        <app-custom-button
          [variant]="'stroked'"
          [color]="'primary'"
          [icon]="'eye'"
          [label]="'Ver Detalles'"
          [tooltip]="'Ver detalles del concurso'"
          (buttonClick)="onVerDetalle($event)"
          class="details-button">
        </app-custom-button>

        <app-inscripcion-button
          *ngIf="concurso.status === 'ACTIVE' || concurso.status === 'PUBLISHED'"
          [contest]="concurso"
          (inscripcionClick)="onInscripcionClick($event)"
          (continuarClick)="onContinuarClick($event)">
        </app-inscripcion-button>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CONCURSO CARD GLASSMORPHISM PREMIUM DARK ===== */
    .concurso-card {
      /* Glassmorphism premium dark base */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.9) 0%,
        rgba(75, 85, 99, 0.85) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%),
        radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);

      /* Layout and interaction */
      display: flex;
      flex-direction: column;
      cursor: pointer;
      overflow: hidden;
      height: 100%;
      position: relative;

      /* Premium shadows */
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);

      /* Smooth transitions */
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      /* Glassmorphism shine effect */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent);
        transition: left 0.6s ease;
        z-index: 1;
        pointer-events: none;
      }

      /* Content positioning */
      > * {
        position: relative;
        z-index: 2;
      }

      /* Premium hover effects */
      &:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg,
          rgba(75, 85, 99, 0.95) 0%,
          rgba(55, 65, 81, 0.9) 100%);
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.4),
          0 6px 20px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.15);
        border-color: rgba(59, 130, 246, 0.3);

        &::before {
          left: 100%;
        }

        .card-content h3 {
          color: #60a5fa;
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
        }
      }

      &:active {
        transform: translateY(-1px);
      }

      /* Card header with glassmorphism */
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg,
          rgba(255, 255, 255, 0.05) 0%,
          rgba(255, 255, 255, 0.02) 100%);
        backdrop-filter: blur(8px);

        .fecha {
          font-size: 0.875rem;
          color: #d1d5db;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          transition: color 0.3s ease;

          i {
            color: #60a5fa;
            opacity: 0.9;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
        }
      }

      /* Card content with premium typography */
      .card-content {
        padding: 1.25rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: linear-gradient(135deg,
          rgba(255, 255, 255, 0.02) 0%,
          rgba(255, 255, 255, 0.01) 100%);

        h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f9fafb;
          transition: all 0.3s ease;
          line-height: 1.4;
          letter-spacing: -0.025em;
        }

        .cargo {
          margin: 0;
          font-size: 1rem;
          color: #d1d5db;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .dependencia {
          margin: 0;
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 400;
          transition: color 0.3s ease;
        }
      }

      /* Card actions with glassmorphism */
      .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg,
          rgba(255, 255, 255, 0.05) 0%,
          rgba(255, 255, 255, 0.02) 100%);
        backdrop-filter: blur(8px);
        gap: 0.75rem;

        /* Custom button styling integration */
        ::ng-deep app-custom-button {
          .custom-button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
            }
          }
        }
      }
    }

    /* ===== RESPONSIVE DESIGN ===== */
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

          h3 {
            font-size: 1.125rem;
          }
        }

        .card-actions {
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;

          ::ng-deep app-custom-button {
            width: 100%;

            .custom-button {
              width: 100%;
              justify-content: center;
            }
          }
        }
      }
    }

    /* ===== ACCESSIBILITY SUPPORT ===== */
    @media (prefers-reduced-motion: reduce) {
      .concurso-card {
        transition: none;

        &::before {
          transition: none;
        }

        &:hover {
          transform: none;
        }

        .card-actions ::ng-deep app-custom-button .custom-button:hover {
          transform: none;
        }
      }
    }

    /* Focus states for accessibility - WCAG AA compliance */
    .concurso-card:focus-visible {
      outline: 2px solid #60a5fa;
      outline-offset: 2px;
      box-shadow:
        0 0 0 4px rgba(96, 165, 250, 0.2),
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
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

  onInscripcionClick(concurso: Concurso): void {
    console.log('[ConcursoCard] Iniciando inscripción para concurso:', concurso.id);
    this.inscriptionComplete.emit(concurso);
  }

  onContinuarClick(concurso: Concurso): void {
    console.log('[ConcursoCard] Continuando inscripción para concurso:', concurso.id);
    this.inscriptionComplete.emit(concurso);
  }
}
