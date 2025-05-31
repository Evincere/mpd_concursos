import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from  '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AnimateDirective } from '../../directives/animate.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-transition',
  standalone: true,
  imports: [
    CommonModule,
    AnimateDirective
  ],
  template: `
    <div class="page-transition" *ngIf="show" [appAnimate]="'fadeIn'" [animationDuration]="200">
      <div class="transition-content">
        <div class="transition-bar" [style.width.%]="progress"></div>
      </div>
    </div>
  `,
  styles: [`
    .page-transition {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
    }

    .transition-content {
      height: 100%;
      width: 100%;
    }

    .transition-bar {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      transition: width 0.2s ease-in-out;
    }
  `]
})
export class PageTransitionComponent implements OnInit, OnDestroy {
  @Input() simulateDelay = false;
  @Input() minDuration = 300;

  show = false;
  progress = 0;

  private subscription: Subscription = new Subscription();
  private startTime = 0;
  private progressInterval: number | null = null;

  constructor(private router: Router) {}


  ngOnInit(): void {
    this.subscription.add(
      this.router.events
        .pipe(
          filter(event =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
          )
        )
        .subscribe(event => {
          if (event instanceof NavigationStart) {
            this.startNavigation();
          } else if (
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
          ) {
            this.endNavigation();
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.clearProgressInterval();
  }

  private startNavigation(): void {
    this.show = true;
    this.progress = 0;
    this.startTime = Date.now();

    // Iniciar animación de progreso
    this.clearProgressInterval();
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;

      // Calcular progreso basado en el tiempo transcurrido
      // Usar una función no lineal para que el progreso sea más rápido al principio
      // y se ralentice a medida que se acerca al 90%
      if (this.simulateDelay) {
        this.progress = Math.min(90, 100 * (1 - Math.exp(-elapsed / 1000)));
      } else {
        this.progress = Math.min(90, elapsed / 10);
      }
    }, 20);
  }

  private endNavigation(): void {
    // Asegurar que la barra de progreso se muestre por al menos minDuration ms
    const elapsed = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.minDuration - elapsed);

    // Completar el progreso
    this.clearProgressInterval();
    this.progress = 100;

    // Ocultar después de un retraso
    setTimeout(() => {
      this.show = false;
    }, remainingTime + 200); // 200ms adicionales para la animación de desvanecimiento
  }

  private clearProgressInterval(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
