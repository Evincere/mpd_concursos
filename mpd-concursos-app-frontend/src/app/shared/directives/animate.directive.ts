import { Directive, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from  '@angular/core';

import { AnimationPlayer } from '@angular/animations';
import { ElementRef } from '@angular/core';
import { AnimationService } from '@shared/services/animation.service';

/**
 * Directiva para aplicar animaciones a elementos del DOM.
 * Ejemplo de uso:
 * <div [appAnimate]="'fadeIn'" [animationDuration]="300" [animationDelay]="0" [animationTrigger]="someValue"></div>
 */
@Directive({
  selector: '[appAnimate]',
  standalone: true
})
export class AnimateDirective implements OnInit, OnChanges, OnDestroy {


  @Input('appAnimate') animationType:
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
  @Input() animationTrigger: unknown;

  private player: AnimationPlayer | null = null;

  constructor(
    private el: ElementRef,
    private animationService: AnimationService
  ) {}



  ngOnInit(): void {
    this.runAnimation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia el trigger, volver a ejecutar la animación
    if (changes['animationTrigger']) {
      this.runAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.destroy();
    }
  }

  private runAnimation(): void {
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

      case 'fadeOut':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createFadeOut(this.animationDuration, this.animationDelay)
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

      case 'slideOutLeft':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideOut('left', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;

      case 'slideOutRight':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideOut('right', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;

      case 'slideOutTop':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideOut('top', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;

      case 'slideOutBottom':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createSlideOut('bottom', this.animationDistance, this.animationDuration, this.animationDelay)
        );
        break;

      case 'scaleIn':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createScaleIn(this.animationScale, this.animationDuration, this.animationDelay)
        );
        break;

      case 'scaleOut':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createScaleOut(this.animationScale, this.animationDuration, this.animationDelay)
        );
        break;

      case 'rotate':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createRotate(0, this.animationRotation, this.animationDuration, this.animationDelay)
        );
        break;

      case 'pulse':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createPulse(this.animationScale, this.animationDuration, this.animationDelay)
        );
        break;

      case 'shake':
        this.player = this.animationService.runAnimation(
          element,
          this.animationService.createShake(this.animationIntensity, this.animationDuration, this.animationDelay)
        );
        break;
    }
  }
}
