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
    /* ===== GLASSMORPHISM DESIGN SYSTEM FOR CUSTOM CARD ===== */
    .custom-card {
      /* Premium glassmorphism base */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.95) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%),
        radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 1.5rem;
      overflow: hidden;
      position: relative;
    }

    /* Efecto de brillo sutil en hover */
    .custom-card::before {
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
      transition: left 0.8s ease;
      z-index: 1;
      pointer-events: none;
    }

    .custom-card:hover::before {
      left: 100%;
    }

    .custom-card.elevated {
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.3),
        0 6px 16px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    }

    .custom-card.elevated:hover {
      transform: translateY(-2px);
      box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.4),
        0 8px 20px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .custom-card.outlined {
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
    
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.08) 0%,
        rgba(255, 255, 255, 0.04) 100%);
      position: relative;
      z-index: 2;
    }

    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #f9fafb;
      display: flex;
      align-items: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

      /* Gradient text effect */
      background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .card-icon {
      margin-right: 0.75rem;
      color: #9ca3af;
      text-shadow: 0 0 10px rgba(156, 163, 175, 0.4);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .card-subtitle {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #d1d5db;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .card-content {
      padding: 1.5rem;
      position: relative;
      z-index: 2;
      background: transparent;
    }

    .card-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.02) 100%);
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 2;
    }

    /* Enhanced focus states for accessibility */
    .custom-card:focus-within {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.3),
        0 6px 16px rgba(0, 0, 0, 0.15),
        0 0 0 4px rgba(59, 130, 246, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    /* High contrast support */
    @media (prefers-contrast: high) {
      .custom-card {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .card-title {
        color: #ffffff;
        -webkit-text-fill-color: #ffffff;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .custom-card {
        transition: none;
      }

      .custom-card::before {
        display: none;
      }

      .custom-card.elevated:hover {
        transform: none;
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .card-header,
      .card-content,
      .card-footer {
        padding: 1rem;
      }

      .card-title {
        font-size: 1.125rem;
      }
    }

    /* Print styles */
    @media print {
      .custom-card {
        background: white !important;
        color: black !important;
        border: 1px solid #ccc !important;
        box-shadow: none !important;
        break-inside: avoid;
      }

      .card-title {
        color: black !important;
        -webkit-text-fill-color: black !important;
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
