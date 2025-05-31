import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-card" [class.elevated]="elevated" [class.outlined]="outlined">
      <div *ngIf="title || subtitle" class="card-header">
        <h2 *ngIf="title" class="card-title">
          <i *ngIf="icon" class="fas fa-{{ icon }} card-icon"></i>
          {{ title }}
        </h2>
        <p *ngIf="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="hasFooter" class="card-footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .custom-card {
      background-color: #374151;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-card.elevated {
      box-shadow:
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 4px 10px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .custom-card.elevated:hover {
      transform: translateY(-2px);
      box-shadow:
        0 15px 35px rgba(0, 0, 0, 0.4),
        0 6px 15px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .custom-card.outlined {
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow:
        0 4px 15px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    }

    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #ffffff;
      display: flex;
      align-items: center;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .card-icon {
      margin-right: 0.75rem;
      color: #6b7280;
      text-shadow: 0 0 10px rgba(107, 114, 128, 0.3);
    }

    .card-subtitle {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #9ca3af;
    }
    
    .card-content {
      padding: 1.5rem;
    }
    
    .card-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
    }

    /* Focus states for accessibility */
    .custom-card:focus-within {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .custom-card {
        transition: none;
      }

      .custom-card.elevated:hover {
        transform: none;
      }
    }
  `]
})
export class CustomCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() elevated = true;
  @Input() outlined = false;
  @Input() hasFooter = false;
}
