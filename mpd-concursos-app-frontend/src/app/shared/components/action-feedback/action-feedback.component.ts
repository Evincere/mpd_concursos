import { Component, Input, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AnimateDirective } from '../../directives/animate.directive';

@Component({
  selector: 'app-action-feedback',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    AnimateDirective
  ],
  template: `
    <div class="action-feedback" [class]="'type-' + type" [appAnimate]="getAnimationType()" [animationDuration]="duration">
      <div class="feedback-icon">
        <mat-icon *ngIf="type === 'success'">check_circle</mat-icon>
        <mat-icon *ngIf="type === 'error'">error</mat-icon>
        <mat-icon *ngIf="type === 'info'">info</mat-icon>
        <mat-icon *ngIf="type === 'warning'">warning</mat-icon>
      </div>
      <div class="feedback-text" *ngIf="message">
        {{message}}
      </div>
    </div>
  `,
  styles: [`
    .action-feedback {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      background: #424242;
      color: white;
    }

    .feedback-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feedback-text {
      font-size: 0.9rem;
    }

    /* Types */
    .type-success {
      background: #43a047;
    }

    .type-error {
      background: #e53935;
    }

    .type-info {
      background: #1e88e5;
    }

    .type-warning {
      background: #fb8c00;
    }
  `]
})
export class ActionFeedbackComponent implements OnInit, OnDestroy {
  @Input() type: 'success' | 'error' | 'info' | 'warning' = 'success';
  @Input() message = '';
  @Input() duration = 300;
  @Input() autoHide = true;
  @Input() autoHideDuration = 3000;

  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}



  getAnimationType(): 'fadeIn' | 'fadeOut' | 'slideInRight' | 'slideOutRight' {
    return 'fadeIn';
  }



  ngOnInit(): void {
    // Auto-ocultar después de un tiempo
    if (this.autoHide) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.autoHideDuration);
    }
  }

  ngOnDestroy(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Oculta el componente con una animación
   */
  hide(): void {
    // Eliminar el componente del DOM después de la animación
    setTimeout(() => {
      const element = this.el.nativeElement;
      if (element.parentNode) {
        this.renderer.removeChild(element.parentNode, element);
      }
    }, this.duration);
  }
}
