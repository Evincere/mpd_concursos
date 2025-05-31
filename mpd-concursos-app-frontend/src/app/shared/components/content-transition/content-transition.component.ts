import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  trigger, 
  state, 
  style, 
  animate, 
  transition 
} from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnimationService } from '../../services/animation.service';

/**
 * Componente para manejar las transiciones de contenido.
 * Envuelve el contenido y aplica animaciones de transición.
 */
@Component({
  selector: 'app-content-transition',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-transition-container" [@contentAnimation]="animationState">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .content-transition-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `],
  animations: [
    trigger('contentAnimation', [
      // Estado inicial (oculto)
      state('void', style({
        opacity: 0
      })),
      
      // Estado visible
      state('visible', style({
        opacity: 1
      })),
      
      // Transición de entrada con desvanecimiento
      transition('void => fade', [
        style({ opacity: 0 }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1 }))
      ]),
      
      // Transición de salida con desvanecimiento
      transition('fade => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0 }))
      ]),
      
      // Transición de entrada con deslizamiento desde la izquierda
      transition('void => slide-left', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      
      // Transición de salida con deslizamiento hacia la izquierda
      transition('slide-left => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'translateX(-30px)' }))
      ]),
      
      // Transición de entrada con deslizamiento desde la derecha
      transition('void => slide-right', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      
      // Transición de salida con deslizamiento hacia la derecha
      transition('slide-right => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'translateX(30px)' }))
      ]),
      
      // Transición de entrada con deslizamiento desde arriba
      transition('void => slide-up', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      
      // Transición de salida con deslizamiento hacia arriba
      transition('slide-up => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'translateY(-30px)' }))
      ]),
      
      // Transición de entrada con deslizamiento desde abajo
      transition('void => slide-down', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      
      // Transición de salida con deslizamiento hacia abajo
      transition('slide-down => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'translateY(30px)' }))
      ]),
      
      // Transición de entrada con zoom
      transition('void => zoom', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      
      // Transición de salida con zoom
      transition('zoom => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class ContentTransitionComponent implements OnInit, OnDestroy {
  @Input() type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' = 'fade';
  
  animationState: string = 'void';
  private destroy$ = new Subject<void>();
  
  constructor(private animationService: AnimationService) {}
  
  ngOnInit(): void {
    // Verificar si el usuario prefiere reducir el movimiento
    this.checkReducedMotionPreference();
    
    // Iniciar la animación
    setTimeout(() => {
      this.animationState = this.type;
    }, 10);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Verifica si el usuario prefiere reducir el movimiento
   */
  private checkReducedMotionPreference(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Deshabilitar animaciones si el usuario prefiere reducir el movimiento
    if (mediaQuery.matches) {
      this.type = 'fade';
    }
  }
}
