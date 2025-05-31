import { trigger, transition, style, animate, query, stagger, state, keyframes, animateChild, group } from '@angular/animations';

/**
 * Animaciones existentes
 */
export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({ transform: 'translateX(100%)' }),
    animate('200ms ease-out', style({ transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
  ])
]);

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
  ])
]);

export const listAnimation = trigger('listAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger(60, [
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true }),
    query(':leave', [
      stagger(40, [
        animate('200ms ease-out',
          style({ opacity: 0, transform: 'translateY(15px)' }))
      ])
    ], { optional: true })
  ])
]);

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('300ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-out',
      style({ opacity: 0, transform: 'translateY(-20px)' }))
  ])
]);

/**
 * Nuevas animaciones
 */

/**
 * Animación para tarjetas con efecto de expansión
 */
export const cardAnimation = trigger('cardAnimation', [
  state('void', style({
    transform: 'scale(0.95)',
    opacity: 0
  })),
  state('*', style({
    transform: 'scale(1)',
    opacity: 1
  })),
  transition('void => *', [
    animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
  ]),
  transition('* => void', [
    animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
  ])
]);

/**
 * Animación para contenedores con efecto de expansión
 * Utiliza una curva de aceleración natural para una transición más suave
 */
export const expandAnimation = trigger('expandAnimation', [
  state('collapsed', style({
    height: '0',
    minHeight: '0',
    opacity: 0,
    overflow: 'hidden',
    padding: '0',
    margin: '0',
    transform: 'translateY(-15px) scale(0.97)',
    boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
  })),
  state('expanded', style({
    height: '*',
    opacity: 1,
    overflow: 'visible',
    transform: 'translateY(0) scale(1)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
  })),
  transition('collapsed => expanded', [
    animate('400ms cubic-bezier(0.05, 0.7, 0.1, 1.0)') // Curva de aceleración natural para expansión
  ]),
  transition('expanded => collapsed', [
    animate('300ms cubic-bezier(0.3, 0.0, 0.8, 0.15)') // Curva de desaceleración natural para contracción
  ])
]);

/**
 * Animación para cambios de ruta
 */
export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      animate('200ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms ease-in', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);

/**
 * Animación para botones con efecto de pulso
 */
export const pulseAnimation = trigger('pulseAnimation', [
  transition('* => pulse', [
    animate('500ms', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.05)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 })
    ]))
  ])
]);

/**
 * Animación para cambios de estado con efecto de desvanecimiento
 */
export const statusChangeAnimation = trigger('statusChangeAnimation', [
  transition('* => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      animate('200ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms ease-in', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);
