import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-divider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="custom-divider" 
      [class.vertical]="vertical"
      [class.inset]="inset"
      [attr.aria-orientation]="vertical ? 'vertical' : 'horizontal'"
      role="separator"
    ></div>
  `,
  styles: [`
    .custom-divider {
      display: block;
      border: none;
      margin: 0;
      flex-shrink: 0;
    }
    
    .custom-divider:not(.vertical) {
      height: 1px;
      width: 100%;
      background-color: var(--color-border, rgba(0, 0, 0, 0.12));
      margin: 8px 0;
    }
    
    .custom-divider.vertical {
      width: 1px;
      height: 100%;
      background-color: var(--color-border, rgba(0, 0, 0, 0.12));
      margin: 0 8px;
    }
    
    .custom-divider.inset:not(.vertical) {
      margin-left: 16px;
      margin-right: 16px;
      width: calc(100% - 32px);
    }
    
    .custom-divider.inset.vertical {
      margin-top: 8px;
      margin-bottom: 8px;
      height: calc(100% - 16px);
    }
    
    /* Tema oscuro */
    @media (prefers-color-scheme: dark) {
      .custom-divider:not(.vertical),
      .custom-divider.vertical {
        background-color: var(--color-border-dark, rgba(255, 255, 255, 0.12));
      }
    }
  `]
})
export class CustomDividerComponent {
  @Input() vertical = false;
  @Input() inset = false;
}
