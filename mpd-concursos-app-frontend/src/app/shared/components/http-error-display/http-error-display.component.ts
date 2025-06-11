import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MappedError, ErrorType, ErrorSeverity } from '../../services/error-mapping/error-mapping.service';

/**
 * Configuración de visualización para el componente de error HTTP
 */
export interface HttpErrorDisplayConfig {
  /** Mostrar icono del error */
  showIcon?: boolean;
  /** Mostrar sugerencias de resolución */
  showSuggestions?: boolean;
  /** Permitir cerrar el error manualmente */
  dismissible?: boolean;
  /** Duración de auto-cierre en milisegundos (0 = no auto-cerrar) */
  autoDismiss?: number;
  /** Posición del error */
  position?: 'top' | 'bottom' | 'inline';
  /** Tamaño del componente */
  size?: 'small' | 'medium' | 'large';
  /** Mostrar botón de acción personalizada */
  showActionButton?: boolean;
  /** Texto del botón de acción */
  actionButtonText?: string;
}

/**
 * Componente especializado para mostrar errores HTTP con diseño glassmorphism
 * Optimizado para errores de registro, login y operaciones del servidor
 */
@Component({
  selector: 'app-http-error-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './http-error-display.component.html',
  styleUrls: ['./http-error-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('errorSlideIn', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px) scale(0.95)',
        filter: 'blur(4px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        filter: 'blur(0px)'
      })),
      transition('void => visible', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('visible => void', [
        animate('250ms cubic-bezier(0.4, 0, 0.6, 1)')
      ])
    ]),
    trigger('iconPulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulse', style({ transform: 'scale(1.1)' })),
      transition('normal <=> pulse', [
        animate('600ms ease-in-out')
      ])
    ])
  ]
})
export class HttpErrorDisplayComponent implements OnInit, OnDestroy {
  
  /** Error mapeado a mostrar */
  @Input() error: MappedError | null = null;
  
  /** Configuración de visualización */
  @Input() config: HttpErrorDisplayConfig = {};
  
  /** Estado de visibilidad */
  @Input() visible = true;

  /** Evento emitido cuando se cierra el error */
  @Output() dismissed = new EventEmitter<void>();

  /** Evento emitido cuando se hace clic en el botón de acción */
  @Output() actionClicked = new EventEmitter<void>();

  /** Configuración por defecto */
  private readonly defaultConfig: HttpErrorDisplayConfig = {
    showIcon: true,
    showSuggestions: true,
    dismissible: true,
    autoDismiss: 0,
    position: 'inline',
    size: 'medium',
    showActionButton: false,
    actionButtonText: 'Reintentar'
  };

  /** Configuración final combinada */
  finalConfig: HttpErrorDisplayConfig = {};

  /** Timer para auto-cierre */
  private autoDismissTimer?: number;

  /** Estado de animación */
  animationState = 'visible';
  iconState = 'normal';

  ngOnInit(): void {
    // Combinar configuración por defecto con la proporcionada
    this.finalConfig = { ...this.defaultConfig, ...this.config };
    
    // Configurar auto-cierre si está habilitado
    if (this.finalConfig.autoDismiss && this.finalConfig.autoDismiss > 0) {
      this.setupAutoDismiss();
    }

    // Iniciar animación de icono para errores críticos
    if (this.error?.severity === ErrorSeverity.CRITICAL) {
      this.startIconPulse();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoDismissTimer();
  }

  /**
   * Configura el timer de auto-cierre
   */
  private setupAutoDismiss(): void {
    this.clearAutoDismissTimer();
    this.autoDismissTimer = window.setTimeout(() => {
      this.dismiss();
    }, this.finalConfig.autoDismiss);
  }

  /**
   * Limpia el timer de auto-cierre
   */
  private clearAutoDismissTimer(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = undefined;
    }
  }

  /**
   * Inicia la animación de pulso del icono
   */
  private startIconPulse(): void {
    setInterval(() => {
      this.iconState = this.iconState === 'normal' ? 'pulse' : 'normal';
    }, 1200);
  }

  /**
   * Cierra el error manualmente
   */
  dismiss(): void {
    if (this.finalConfig.dismissible) {
      this.visible = false;
      this.animationState = 'void';
      this.clearAutoDismissTimer();
      this.dismissed.emit();
    }
  }

  /**
   * Maneja el clic en el botón de acción
   */
  onActionClick(): void {
    this.actionClicked.emit();
  }

  /**
   * Obtiene las clases CSS para el contenedor principal
   */
  getContainerClasses(): string[] {
    const classes = ['http-error-display'];
    
    if (this.error) {
      classes.push(`error-type-${this.error.type}`);
      classes.push(`error-severity-${this.error.severity}`);
    }
    
    if (this.finalConfig.size) {
      classes.push(`size-${this.finalConfig.size}`);
    }
    
    if (this.finalConfig.position) {
      classes.push(`position-${this.finalConfig.position}`);
    }

    return classes;
  }

  /**
   * Obtiene el color del borde izquierdo basado en el tipo de error
   */
  getBorderColor(): string {
    if (!this.error) return 'var(--color-warning)';
    
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return 'var(--color-warning)';
      case ErrorType.CONFLICT:
        return 'var(--color-danger)';
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return 'var(--color-danger)';
      case ErrorType.SERVER:
      case ErrorType.NETWORK:
        return 'var(--color-danger)';
      default:
        return 'var(--color-warning)';
    }
  }

  /**
   * Obtiene el icono a mostrar basado en el tipo de error
   */
  getErrorIcon(): string {
    if (!this.error) return 'info';
    
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return 'warning';
      case ErrorType.CONFLICT:
        return 'error';
      case ErrorType.AUTHENTICATION:
        return 'lock';
      case ErrorType.AUTHORIZATION:
        return 'block';
      case ErrorType.SERVER:
        return 'error_outline';
      case ErrorType.NETWORK:
        return 'wifi_off';
      default:
        return 'info';
    }
  }

  /**
   * Obtiene el color del icono
   */
  getIconColor(): string {
    return this.getBorderColor();
  }

  /**
   * Maneja el evento de clic en el botón de cerrar
   */
  onDismissClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismiss();
  }

  /**
   * Maneja el evento de teclado para accesibilidad
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.finalConfig.dismissible) {
      this.dismiss();
    }
  }

  /**
   * Obtiene el ID único para accesibilidad
   */
  getErrorId(): string {
    return `http-error-${this.error?.field || 'general'}-${Date.now()}`;
  }

  /**
   * Obtiene el texto del aria-label para accesibilidad
   */
  getAriaLabel(): string {
    if (!this.error) return 'Error HTTP';
    
    let label = `Error: ${this.error.title}. ${this.error.message}`;
    
    if (this.error.suggestions && this.error.suggestions.length > 0) {
      label += ` Sugerencias: ${this.error.suggestions.join('. ')}`;
    }
    
    if (this.finalConfig.dismissible) {
      label += ' Presione Escape para cerrar.';
    }
    
    return label;
  }

  /**
   * Obtiene el nivel de contraste WCAG AA
   */
  getContrastLevel(): string {
    if (!this.error) return 'normal';

    switch (this.error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'high-contrast';
      default:
        return 'normal';
    }
  }

  /**
   * TrackBy function para optimizar el renderizado de sugerencias
   */
  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }
}
