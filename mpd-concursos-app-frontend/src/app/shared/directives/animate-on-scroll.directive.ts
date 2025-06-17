import { Directive, Input, ElementRef, OnInit, OnDestroy, NgZone, inject } from '@angular/core';
import { AnimationService } from '../services/animation.service';
import { AnimationPlayer } from '@angular/animations';
import { AccessibilityPreferencesService } from '@core/services/accessibility/accessibility-preferences.service';

/**
 * Directiva para animar elementos cuando entran en el viewport.
 * Ejemplo de uso:
 * <div [appAnimateOnScroll]="'fadeIn'" [animationDuration]="300" [animationDelay]="0" [threshold]="0.2"></div>
 */
@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  @Input('appAnimateOnScroll') animationType:
    'fadeIn' | 'fadeOut' |
    'slideInLeft' | 'slideInRight' | 'slideInTop' | 'slideInBottom' |
    'slideOutLeft' | 'slideOutRight' | 'slideOutTop' | 'slideOutBottom' |
    'scaleIn' | 'scaleOut' | 'rotate' | 'pulse' | 'shake' = 'fadeIn';

  @Input() animationDuration = 300;
  @Input() animationDelay = 0;
  @Input() animationDistance = 30;
  @Input() animationScale = 0.8;
  @Input() animationRotation = 360;
  @Input() animationIntensity = 5;
  @Input() threshold = 0.2;
  @Input() once = true;
  
  private observer: IntersectionObserver | null = null;
  private player: AnimationPlayer | null = null;
  private hasAnimated = false;
  
  private accessibilityPreferences = inject(AccessibilityPreferencesService);

  constructor(
    private el: ElementRef,
    private animationService: AnimationService,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    // Verificar si el usuario prefiere reducir el movimiento usando el servicio
    if (this.accessibilityPreferences.shouldDisableAnimations()) {
      // Si el usuario prefiere reducir el movimiento, mostrar el elemento sin animación
      this.el.nativeElement.style.opacity = '1';
      return;
    }
    
    // Ocultar el elemento inicialmente
    this.el.nativeElement.style.opacity = '0';
    
    // Crear el observador de intersección
    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.ngZone.run(() => {
                this.animate();
                
                if (this.once && this.observer) {
                  this.observer.disconnect();
                  this.observer = null;
                }
              });
            } else if (!this.once && this.hasAnimated) {
              // Si no es 'once' y el elemento sale del viewport, resetear la animación
              this.el.nativeElement.style.opacity = '0';
              this.hasAnimated = false;
            }
          });
        },
        {
          threshold: this.threshold,
          rootMargin: '0px'
        }
      );
      
      this.observer.observe(this.el.nativeElement);
    });
  }
  
  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
  
  /**
   * Ejecuta la animación
   */
  private animate(): void {
    if (this.hasAnimated && this.once) {
      return;
    }
    
    if (this.player) {
      this.player.destroy();
    }
    
    const element = this.el.nativeElement;
    
    switch (this.animationType) {
      case 'fadeIn':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createFadeIn(this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'slideInLeft':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideIn('left', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'slideInRight':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideIn('right', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'slideInTop':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideIn('top', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'slideInBottom':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideIn('bottom', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'scaleIn':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createScaleIn(this.animationScale, this.animationDuration, this.animationDelay)
        );
        break;
        
      case 'pulse':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createPulse(this.animationScale, this.animationDuration, this.animationDelay)
        );
        break;
        
      default:
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createFadeIn(this.animationDuration, this.animationDelay)
        );
    }
    
    this.hasAnimated = true;
  }
  
  /**
   * Verifica si el usuario prefiere reducir el movimiento
   * @returns true si el usuario prefiere reducir el movimiento
   * @deprecated Use accessibilityPreferences.shouldDisableAnimations() instead
   */
  private prefersReducedMotion(): boolean {
    return this.accessibilityPreferences.shouldDisableAnimations();
  }
}
