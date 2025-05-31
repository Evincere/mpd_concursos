import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-tab" [class.active]="active">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .custom-tab {
      display: none;
    }
    
    .custom-tab.active {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class CustomTabComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() badge = '';
  @Input() disabled = false;
  @Input() key = ''; // Add key property for compatibility

  active = false;
}
