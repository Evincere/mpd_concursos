import { Injectable } from '@angular/core';
import { AnimationFactory, AnimationPlayer, style, animate } from  '@angular/animations';
import { AnimationBuilder } from '@angular/animations';

/**
 * Servicio para gestionar animaciones en la aplicación.
 * Proporciona métodos para crear y ejecutar animaciones dinámicamente.
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor(
    private builder: AnimationBuilder
  ) {}



  /**
   * Crea una animación de fade in
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createFadeIn(duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ opacity: 0 }),
      animate(`${duration}ms ${delay}ms ease-in-out`, style({ opacity: 1 }))
    ]);
  }

  /**
   * Crea una animación de fade out
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createFadeOut(duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ opacity: 1 }),
      animate(`${duration}ms ${delay}ms ease-in-out`, style({ opacity: 0 }))
    ]);
  }

  /**
   * Crea una animación de slide in desde la dirección especificada
   * @param direction Dirección desde donde aparece el elemento ('left', 'right', 'top', 'bottom')
   * @param distance Distancia en px desde donde aparece el elemento
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createSlideIn(direction: 'left' | 'right' | 'top' | 'bottom', distance = 30, duration = 300, delay = 0): AnimationFactory {
    const initialStyle: any = { opacity: 0 };

    switch (direction) {
      case 'left':
        initialStyle.transform = `translateX(-${distance}px)`;
        break;
      case 'right':
        initialStyle.transform = `translateX(${distance}px)`;
        break;
      case 'top':
        initialStyle.transform = `translateY(-${distance}px)`;
        break;
      case 'bottom':
        initialStyle.transform = `translateY(${distance}px)`;
        break;
    }

    return this.builder.build([
      style(initialStyle),
      animate(`${duration}ms ${delay}ms cubic-bezier(0.35, 0, 0.25, 1)`,
        style({ opacity: 1, transform: 'translate(0)' }))
    ]);
  }

  /**
   * Crea una animación de slide out hacia la dirección especificada
   * @param direction Dirección hacia donde desaparece el elemento ('left', 'right', 'top', 'bottom')
   * @param distance Distancia en px hacia donde desaparece el elemento
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createSlideOut(direction: 'left' | 'right' | 'top' | 'bottom', distance = 30, duration = 300, delay = 0): AnimationFactory {
    const finalStyle: any = { opacity: 0 };

    switch (direction) {
      case 'left':
        finalStyle.transform = `translateX(-${distance}px)`;
        break;
      case 'right':
        finalStyle.transform = `translateX(${distance}px)`;
        break;
      case 'top':
        finalStyle.transform = `translateY(-${distance}px)`;
        break;
      case 'bottom':
        finalStyle.transform = `translateY(${distance}px)`;
        break;
    }

    return this.builder.build([
      style({ opacity: 1, transform: 'translate(0)' }),
      animate(`${duration}ms ${delay}ms cubic-bezier(0.35, 0, 0.25, 1)`,
        style(finalStyle))
    ]);
  }

  /**
   * Crea una animación de scale in (zoom in)
   * @param initialScale Escala inicial (0.8 = 80% del tamaño final)
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createScaleIn(initialScale = 0.8, duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ opacity: 0, transform: `scale(${initialScale})` }),
      animate(`${duration}ms ${delay}ms cubic-bezier(0.35, 0, 0.25, 1)`,
        style({ opacity: 1, transform: 'scale(1)' }))
    ]);
  }

  /**
   * Crea una animación de scale out (zoom out)
   * @param finalScale Escala final (0.8 = 80% del tamaño inicial)
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createScaleOut(finalScale = 0.8, duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ opacity: 1, transform: 'scale(1)' }),
      animate(`${duration}ms ${delay}ms cubic-bezier(0.35, 0, 0.25, 1)`,
        style({ opacity: 0, transform: `scale(${finalScale})` }))
    ]);
  }

  /**
   * Crea una animación de rotación
   * @param startDegrees Grados iniciales
   * @param endDegrees Grados finales
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createRotate(startDegrees = 0, endDegrees = 360, duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ transform: `rotate(${startDegrees}deg)` }),
      animate(`${duration}ms ${delay}ms ease-in-out`,
        style({ transform: `rotate(${endDegrees}deg)` }))
    ]);
  }

  /**
   * Crea una animación de pulso (scale up and down)
   * @param scale Escala máxima durante el pulso (1.1 = 110% del tamaño original)
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createPulse(scale = 1.1, duration = 300, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ transform: 'scale(1)' }),
      animate(`${duration / 2}ms ${delay}ms ease-in-out`, style({ transform: `scale(${scale})` })),
      animate(`${duration / 2}ms ease-in-out`, style({ transform: 'scale(1)' }))
    ]);
  }

  /**
   * Crea una animación de shake (vibración)
   * @param intensity Intensidad de la vibración en px
   * @param duration Duración de la animación en ms
   * @param delay Retraso antes de iniciar la animación en ms
   * @returns Factory de animación
   */
  createShake(intensity = 5, duration = 500, delay = 0): AnimationFactory {
    return this.builder.build([
      style({ transform: 'translateX(0)' }),
      animate(`${duration / 5}ms ${delay}ms ease-in-out`, style({ transform: `translateX(-${intensity}px)` })),
      animate(`${duration / 5}ms ease-in-out`, style({ transform: `translateX(${intensity}px)` })),
      animate(`${duration / 5}ms ease-in-out`, style({ transform: `translateX(-${intensity}px)` })),
      animate(`${duration / 5}ms ease-in-out`, style({ transform: `translateX(${intensity}px)` })),
      animate(`${duration / 5}ms ease-in-out`, style({ transform: 'translateX(0)' }))
    ]);
  }

  /**
   * Ejecuta una animación en un elemento
   * @param element Elemento DOM a animar
   * @param factory Factory de animación a ejecutar
   * @returns Player de animación
   */
  runAnimation(element: HTMLElement, factory: AnimationFactory): AnimationPlayer {
    const player = factory.create(element);
    player.play();
    return player;
  }
}
