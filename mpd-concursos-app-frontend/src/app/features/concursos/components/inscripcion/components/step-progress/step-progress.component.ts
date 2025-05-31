import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface Step {
  label: string;
}

@Component({
  selector: 'app-step-progress',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="step-progress-container">
      <div class="progress-bar-container">
        <div class="progress-bar" [style.width.%]="progressPercentage"></div>
      </div>
      <div class="progress-text">{{ progressPercentage }}% Completado</div>

      <div class="steps-container">
        <div class="step-line"></div>
        <div class="step-progress" [style.width.%]="(currentStep - 1) / (steps.length - 1) * 100"></div>

        <div *ngFor="let step of steps; let i = index"
             class="step"
             [class.active]="currentStep === i + 1"
             [class.completed]="currentStep > i + 1"
             [class.clickable]="currentStep > i + 1 && allowNavigation"
             (click)="onStepClick(i + 1)"
             (keydown.enter)="onStepClick(i + 1)"
             (keydown.space)="onStepClick(i + 1); $event.preventDefault()"
             [attr.tabindex]="currentStep > i + 1 && allowNavigation ? '0' : '-1'"
             [attr.role]="currentStep > i + 1 && allowNavigation ? 'button' : 'presentation'"
             [attr.aria-label]="'Ir al paso ' + (i + 1) + ': ' + step.label">
          <div class="step-number">
            <mat-icon *ngIf="currentStep > i + 1">check</mat-icon>
            <span *ngIf="currentStep <= i + 1">{{ i + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-progress-container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .progress-bar-container {
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3f51b5 0%, #4caf50 100%);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .progress-text {
      text-align: right;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 20px;
    }

    .steps-container {
      display: flex;
      justify-content: space-between;
      position: relative;
      margin-bottom: 30px;
    }

    .step-line {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-50%);
      z-index: 1;
    }

    .step-progress {
      position: absolute;
      top: 50%;
      left: 0;
      height: 2px;
      background-color: #4caf50;
      transform: translateY(-50%);
      z-index: 2;
      transition: width 0.4s ease;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 3;
      transition: all 0.3s ease;
    }

    .step.active .step-number {
      background-color: #3f51b5;
      border-color: #3f51b5;
      color: white;
    }

    .step.active .step-label {
      color: white;
      font-weight: 500;
    }

    .step.completed .step-number {
      background-color: #4caf50;
      border-color: #4caf50;
      color: white;
    }

    .step.completed .step-label {
      color: rgba(255, 255, 255, 0.9);
    }

    .step.clickable {
      cursor: pointer;
    }

    .step.clickable:hover .step-number {
      transform: scale(1.1);
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: all 0.3s ease;
      color: rgba(255, 255, 255, 0.7);
    }

    .step-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      transition: all 0.3s ease;
    }

    @media (max-width: 768px) {
      .step-label {
        display: none;
      }
    }
  `]
})
export class StepProgressComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep = 1;
  @Input() allowNavigation = true;
  @Output() stepChange = new EventEmitter<number>();

  get progressPercentage(): number {
    return Math.round((this.currentStep / this.steps.length) * 100);
  }

  onStepClick(step: number): void {
    if (this.allowNavigation && step < this.currentStep) {
      this.stepChange.emit(step);
    }
  }
}
