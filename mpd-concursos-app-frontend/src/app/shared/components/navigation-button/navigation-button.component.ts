import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';
import { TooltipDirective } from '../../directives/tooltip.directive';

/**
 * Componente para botones de navegación con animaciones y estilos consistentes.
 * Puede ser usado para botones de "Volver", "Siguiente", etc.
 */
@Component({
  selector: 'app-navigation-button',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomButtonComponent,
    TooltipDirective
  ],
  template: `
    <div class="navigation-button-container" [@fadeInAnimation]>
      <app-custom-button
        [label]="label"
        [icon]="icon"
        [color]="color"
        [variant]="variant"
        [disabled]="disabled"
        [loading]="loading"
        [tooltip]="tooltip"
        [type]="type"
        (buttonClick)="onClick()"
        [class]="customClass">
      </app-custom-button>
    </div>
  `,
  styles: [`
    .navigation-button-container {
      display: inline-block;
    }
    
    :host-context(.navigation-back) app-custom-button {
      position: relative;
      left: 0;
      transition: left 0.3s ease;
    }
    
    :host-context(.navigation-back) app-custom-button:hover {
      left: -5px;
    }
    
    :host-context(.navigation-forward) app-custom-button {
      position: relative;
      right: 0;
      transition: right 0.3s ease;
    }
    
    :host-context(.navigation-forward) app-custom-button:hover {
      right: -5px;
    }
  `],
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class NavigationButtonComponent {
  @Input() label = 'Volver';
  @Input() icon = 'arrow-left';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' | 'danger' = 'primary';
  @Input() variant: 'flat' | 'text' | 'stroked' | 'icon' = 'stroked';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() tooltip = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() customClass = '';
  @Input() direction: 'back' | 'forward' = 'back';
  
  @Output() buttonClick = new EventEmitter<void>();
  
  onClick(): void {
    this.buttonClick.emit();
  }
}
