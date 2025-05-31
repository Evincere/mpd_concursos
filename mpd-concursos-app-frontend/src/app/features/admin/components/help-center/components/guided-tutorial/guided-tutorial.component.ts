import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GuidedTutorial, TutorialStep, AdminHelpService } from  '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-guided-tutorial',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="guided-tutorial" *ngIf="tutorial">
      <mat-card class="tutorial-card">
        <mat-card-content>
          <div class="tutorial-header">
            <div class="tutorial-info">
              <div class="tutorial-meta">
                <span class="tutorial-level" [ngClass]="getLevelClass(tutorial.level)">
                  {{getLevelName(tutorial.level)}}
                </span>
                <span class="tutorial-time">
                  <mat-icon>schedule</mat-icon>
                  {{tutorial.estimatedTime}} min
                </span>
                <span class="tutorial-category">
                  <mat-icon>folder</mat-icon>
                  {{tutorial.category}}
                </span>
              </div>
              <div class="tutorial-description">
                {{tutorial.description}}
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="tutorial-progress">
            <div class="progress-info">
              <span class="progress-text">Progreso: {{currentStep + 1}} de {{tutorial.steps.length}}</span>
              <span class="progress-percentage">{{progressPercentage}}%</span>
            </div>
            <mat-progress-bar [value]="progressPercentage"></mat-progress-bar>
          </div>

          <div class="tutorial-content">
            <div class="step-content" *ngIf="currentStepData">
              <h3 class="step-title">{{currentStepData.title}}</h3>
              <div class="step-description">{{currentStepData.description}}</div>

              <div *ngIf="currentStepData.imageUrl" class="step-image">
                <img [src]="currentStepData.imageUrl" [alt]="currentStepData.title">
              </div>

              <div *ngIf="currentStepData.videoUrl" class="step-video">
                <iframe
                  [src]="getSafeVideoUrl(currentStepData.videoUrl)"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
                </iframe>
              </div>
            </div>
          </div>

          <div class="tutorial-navigation">
            <button
              mat-stroked-button
              color="primary"
              (click)="previousStep()"
              [disabled]="currentStep === 0">
              <mat-icon>arrow_back</mat-icon>
              Anterior
            </button>

            <div class="step-indicators">
              <div
                *ngFor="let step of tutorial.steps; let i = index"
                class="step-indicator"
                [class.active]="i === currentStep"
                [class.completed]="i < currentStep"
                (click)="goToStep(i)"
                (keydown.enter)="goToStep(i)"
                (keydown.space)="goToStep(i)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Ir al paso ' + (i + 1)">
              </div>
            </div>

            <button
              mat-raised-button
              color="primary"
              (click)="nextStep()"
              [disabled]="currentStep === tutorial.steps.length - 1">
              <span *ngIf="currentStep < tutorial.steps.length - 1">Siguiente</span>
              <span *ngIf="currentStep === tutorial.steps.length - 1">Finalizar</span>
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="tutorial-actions">
        <button mat-stroked-button color="warn" (click)="endTutorial()">
          <mat-icon>close</mat-icon>
          Salir del tutorial
        </button>
      </div>
    </div>
  `,
  styles: [`
    .guided-tutorial {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tutorial-card {
      border-radius: var(--border-radius);
    }

    .tutorial-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;

      .tutorial-info {
        flex: 1;
      }

      .tutorial-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;

        .tutorial-level {
          padding: 0.25rem 0.75rem;
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-xs);
          font-weight: 500;

          &.level-basic {
            background-color: var(--color-success-light);
            color: var(--color-success);
          }

          &.level-intermediate {
            background-color: var(--color-info-light);
            color: var(--color-info);
          }

          &.level-advanced {
            background-color: var(--color-warn-light);
            color: var(--color-warn);
          }
        }

        .tutorial-time,
        .tutorial-category {
          display: flex;
          align-items: center;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            margin-right: 0.25rem;
          }
        }
      }

      .tutorial-description {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }
    }

    mat-divider {
      margin-bottom: 1.5rem;
    }

    .tutorial-progress {
      margin-bottom: 1.5rem;

      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;

        .progress-text,
        .progress-percentage {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
      }
    }

    .tutorial-content {
      min-height: 300px;
      margin-bottom: 1.5rem;

      .step-content {
        .step-title {
          font-size: var(--font-size-lg);
          font-weight: 500;
          margin: 0 0 1rem;
          color: var(--color-text-primary);
        }

        .step-description {
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .step-image {
          margin-bottom: 1.5rem;

          img {
            max-width: 100%;
            border-radius: var(--border-radius-sm);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }

        .step-video {
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          height: 0;
          overflow: hidden;

          iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: var(--border-radius-sm);
          }
        }
      }
    }

    .tutorial-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .step-indicators {
        display: flex;
        gap: 0.5rem;

        .step-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s ease;

          &.active {
            background-color: var(--color-primary);
            transform: scale(1.2);
          }

          &.completed {
            background-color: var(--color-success);
          }
        }
      }
    }

    .tutorial-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class GuidedTutorialComponent implements OnInit, OnDestroy {
  @Input() tutorial!: GuidedTutorial;

  currentStep = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private adminHelpService: AdminHelpService
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios en el paso actual
    this.adminHelpService.getCurrentStep()
      .pipe(takeUntil(this.destroy$))
      .subscribe((step: number) => {
        this.currentStep = step;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep(): void {
    if (this.currentStep < this.tutorial.steps.length - 1) {
      this.adminHelpService.nextStep();
    } else {
      this.endTutorial();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  previousStep(): void {
    this.adminHelpService.previousStep();
  }

  /**
   * Va a un paso específico
   * @param step Número de paso
   */
  goToStep(step: number): void {
    if (step >= 0 && step < this.tutorial.steps.length) {
      // Implementar lógica para ir a un paso específico
      // Por ahora, simplemente actualizamos el paso actual
      this.currentStep = step;
    }
  }

  /**
   * Finaliza el tutorial
   */
  endTutorial(): void {
    this.adminHelpService.endTutorial();
  }

  /**
   * Obtiene el nombre de un nivel
   * @param level Nivel
   * @returns Nombre del nivel
   */
  getLevelName(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'Básico';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level;
    }
  }

  /**
   * Obtiene la clase CSS para un nivel
   * @param level Nivel
   * @returns Clase CSS
   */
  getLevelClass(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'level-basic';
      case 'intermediate':
        return 'level-intermediate';
      case 'advanced':
        return 'level-advanced';
      default:
        return '';
    }
  }

  /**
   * Obtiene el porcentaje de progreso
   */
  get progressPercentage(): number {
    return Math.round(((this.currentStep + 1) / this.tutorial.steps.length) * 100);
  }

  /**
   * Obtiene los datos del paso actual
   */
  get currentStepData(): TutorialStep | undefined {
    return this.tutorial.steps[this.currentStep];
  }

  /**
   * Obtiene una URL segura para un video
   * @param url URL del video
   * @returns URL segura
   */
  getSafeVideoUrl(url: string): string {
    // En una implementación real, esto utilizaría DomSanitizer para crear una URL segura
    // Por ahora, simplemente devolvemos la URL
    return url;
  }
}
