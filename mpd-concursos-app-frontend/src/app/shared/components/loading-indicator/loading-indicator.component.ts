import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnimateDirective } from '../../directives/animate.directive';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    AnimateDirective
  ],
  template: `
    <div class="loading-container" [class]="'type-' + type" [appAnimate]="'fadeIn'" [animationDuration]="300">
      <div class="loading-content">
        <!-- Spinner -->
        <div *ngIf="type === 'spinner'" class="spinner-container">
          <mat-spinner [diameter]="size" [strokeWidth]="strokeWidth" [color]="color"></mat-spinner>
        </div>

        <!-- Dots -->
        <div *ngIf="type === 'dots'" class="dots-container">
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
          <div class="dot" [style.width.px]="size / 5" [style.height.px]="size / 5"></div>
        </div>

        <!-- Progress Bar -->
        <div *ngIf="type === 'progress-bar'" class="progress-bar-container" [style.width.px]="size * 4">
          <mat-progress-bar
            [mode]="determinate ? 'determinate' : 'indeterminate'"
            [value]="progress"
            [color]="color">
          </mat-progress-bar>
          <div *ngIf="showPercentage && determinate" class="progress-percentage">
            {{progress}}%
          </div>
        </div>

        <!-- Pulse -->
        <div *ngIf="type === 'pulse'" class="pulse-container" [style.width.px]="size" [style.height.px]="size">
          <div class="pulse-circle" [style.width.px]="size" [style.height.px]="size"></div>
          <div class="pulse-circle" [style.width.px]="size" [style.height.px]="size"></div>
        </div>

        <!-- Text -->
        <div *ngIf="text" class="loading-text" [style.font-size.px]="size / 3">
          {{text}}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-text {
      color: rgba(255, 255, 255, 0.87);
      text-align: center;
      margin-top: 0.5rem;
    }

    /* Dots animation */
    .dots-container {
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

    /* Progress bar */
    .progress-bar-container {
      position: relative;
      width: 100%;
    }

    .progress-percentage {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.87);
    }

    /* Pulse animation */
    .pulse-container {
      position: relative;
    }

    .pulse-circle {
      position: absolute;
      border-radius: 50%;
      border: 2px solid currentColor;
      opacity: 0.6;
      top: 0;
      left: 0;
    }

    .pulse-circle:nth-child(1) {
      animation: pulse-animation 2s infinite;
    }

    .pulse-circle:nth-child(2) {
      animation: pulse-animation 2s infinite 0.5s;
    }

    @keyframes pulse-animation {
      0% {
        transform: scale(0.1);
        opacity: 0;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    /* Color variations */
    .type-spinner, .type-dots, .type-progress-bar, .type-pulse {
      color: #1976d2;
    }

    .type-spinner.color-accent, .type-dots.color-accent, .type-progress-bar.color-accent, .type-pulse.color-accent {
      color: #ff4081;
    }

    .type-spinner.color-warn, .type-dots.color-warn, .type-progress-bar.color-warn, .type-pulse.color-warn {
      color: #f44336;
    }
  `]
})
export class LoadingIndicatorComponent implements OnInit {
  @Input() type: 'spinner' | 'dots' | 'progress-bar' | 'pulse' = 'spinner';
  @Input() size = 40;
  @Input() strokeWidth = 4;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() text = '';
  @Input() determinate = false;
  @Input() progress = 0;
  @Input() showPercentage = true;

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
    // Logging implementado con LoggingService
  }
}