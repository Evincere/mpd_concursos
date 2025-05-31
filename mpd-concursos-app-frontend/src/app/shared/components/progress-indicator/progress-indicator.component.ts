import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnimateDirective } from '../../directives/animate.directive';

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    AnimateDirective
  ],
  template: `
    <div class="progress-container" [class]="'type-' + type" [appAnimate]="'fadeIn'" [animationDuration]="300">
      <!-- Spinner -->
      <div *ngIf="type === 'spinner'" class="spinner-wrapper">
        <mat-spinner [diameter]="size" [strokeWidth]="strokeWidth" [color]="color"></mat-spinner>
        <div *ngIf="showLabel" class="progress-label">
          <span *ngIf="!determinate">{{ label }}</span>
          <span *ngIf="determinate">{{ progress }}%</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div *ngIf="type === 'bar'" class="bar-wrapper">
        <div *ngIf="showLabel" class="progress-label">
          <span>{{ label }}</span>
          <span *ngIf="determinate">{{ progress }}%</span>
        </div>
        <mat-progress-bar
          [mode]="determinate ? 'determinate' : 'indeterminate'"
          [value]="progress"
          [color]="color">
        </mat-progress-bar>
      </div>

      <!-- Dots -->
      <div *ngIf="type === 'dots'" class="dots-wrapper">
        <div class="dots">
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
        </div>
        <div *ngIf="showLabel" class="progress-label">
          <span>{{ label }}</span>
        </div>
      </div>

      <!-- Circular Progress -->
      <div *ngIf="type === 'circular'" class="circular-wrapper">
        <svg class="circular" [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100">
          <circle class="path" cx="50" cy="50" r="40" fill="none" [attr.stroke]="getCircleColor()" stroke-width="6"></circle>
          <circle *ngIf="determinate" class="path-progress" cx="50" cy="50" r="40" fill="none"
                 [attr.stroke]="getCircleColor()" stroke-width="6"
                 [attr.stroke-dasharray]="getCircumference()"
                 [attr.stroke-dashoffset]="getDashOffset()"></circle>
        </svg>
        <div *ngIf="showLabel" class="progress-label circular-label">
          <span *ngIf="!determinate">{{ label }}</span>
          <span *ngIf="determinate">{{ progress }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }

    .spinner-wrapper, .bar-wrapper, .dots-wrapper, .circular-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-wrapper {
      width: 100%;
      max-width: 300px;
    }

    .progress-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    .circular-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
    }

    /* Dots animation */
    .dots {
      display: flex;
      gap: 0.5rem;
    }

    .dot {
      border-radius: 50%;
      background-color: currentColor;
      animation: dot-pulse 1.5s infinite ease-in-out;
    }

    .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.3s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes dot-pulse {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.6;
      }
      40% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    /* Circular progress */
    .circular-wrapper {
      position: relative;
    }

    .circular {
      transform: rotate(-90deg);
      transform-origin: center;
    }

    .path {
      stroke: rgba(255, 255, 255, 0.1);
    }

    .path-progress {
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    /* Color variations */
    .type-spinner, .type-bar, .type-dots, .type-circular {
      color: #1976d2;
    }

    .type-spinner.color-accent, .type-bar.color-accent, .type-dots.color-accent, .type-circular.color-accent {
      color: #ff4081;
    }

    .type-spinner.color-warn, .type-bar.color-warn, .type-dots.color-warn, .type-circular.color-warn {
      color: #f44336;
    }
  `]
})
export class ProgressIndicatorComponent implements OnInit, OnChanges {
  @Input() type: 'spinner' | 'bar' | 'dots' | 'circular' = 'spinner';
  @Input() size = 40;
  @Input() strokeWidth = 4;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() determinate = false;
  @Input() progress = 0;
  @Input() showLabel = false;
  @Input() label = 'Cargando...';
  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
    console.log('ProgressIndicatorComponent inicializado');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress']) {
      // Asegurar que el progreso esté entre 0 y 100
      this.progress = Math.max(0, Math.min(100, this.progress));
    }
  }

  /**
   * Obtiene el color del círculo según el color seleccionado
   */
  getCircleColor(): string {
    switch (this.color) {
      case 'primary':
        return '#1976d2';
      case 'accent':
        return '#ff4081';
      case 'warn':
        return '#f44336';
      default:
        return '#1976d2';
    }
  }

  /**
   * Obtiene la circunferencia del círculo
   */
  getCircumference(): number {
    return 2 * Math.PI * 40; // 2πr, donde r = 40
  }

  /**
   * Obtiene el desplazamiento del trazo según el progreso
   */
  getDashOffset(): number {
    const circumference = this.getCircumference();
    return circumference - (this.progress / 100) * circumference;
  }
}
