import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldError, ErrorType } from '../../services/error-mapping/error-mapping.service';

export interface ErrorContextPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

@Component({
  selector: 'app-error-context-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #contextPanel
      class="error-context-panel"
      [class.visible]="visible"
      [style.top.px]="position.top"
      [style.left.px]="position.left"
      [attr.data-placement]="position.placement"
      role="alert"
      aria-live="polite"
      [attr.aria-label]="'Error en campo ' + fieldError?.field">
      
      <!-- Header del panel -->
      <div class="panel-header">
        <div class="error-icon">
          <i class="material-icons" [attr.aria-hidden]="true">{{ getErrorIcon() }}</i>
        </div>
        <div class="error-title">
          <h4>{{ fieldError?.title || 'Error de validación' }}</h4>
          <span class="field-name">Campo: {{ getFieldDisplayName() }}</span>
        </div>
        <button 
          class="close-btn"
          (click)="onClose()"
          [attr.aria-label]="'Cerrar panel de error'"
          type="button">
          <i class="material-icons" aria-hidden="true">close</i>
        </button>
      </div>

      <!-- Contenido del error -->
      <div class="panel-content">
        <p class="error-message">{{ fieldError?.message }}</p>
        
        <!-- Sugerencias -->
        <div class="suggestions" *ngIf="fieldError?.suggestions && (fieldError?.suggestions?.length || 0) > 0">
          <h5>¿Cómo solucionarlo?</h5>
          <ul>
            <li *ngFor="let suggestion of fieldError?.suggestions || []">
              <i class="material-icons suggestion-icon" aria-hidden="true">lightbulb</i>
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- Estado del error -->
        <div class="error-status" [attr.data-status]="fieldError?.status">
          <i class="material-icons status-icon" aria-hidden="true">{{ getStatusIcon() }}</i>
          <span>{{ getStatusText() }}</span>
        </div>
      </div>

      <!-- Acciones -->
      <div class="panel-actions">
        <button 
          class="action-btn primary"
          (click)="onFocusField()"
          type="button">
          <i class="material-icons" aria-hidden="true">edit</i>
          Corregir campo
        </button>
        <button 
          class="action-btn secondary"
          (click)="onDismiss()"
          type="button">
          Entendido
        </button>
      </div>

      <!-- Flecha indicadora -->
      <div class="panel-arrow" [attr.data-placement]="position.placement"></div>
    </div>

    <!-- Overlay para cerrar al hacer clic fuera -->
    <div 
      class="context-overlay"
      [class.visible]="visible"
      (click)="onOverlayClick()"
      [attr.aria-hidden]="true">
    </div>
  `,
  styleUrls: ['./error-context-panel.component.scss']
})
export class ErrorContextPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() fieldError: FieldError | null = null;
  @Input() targetElement: HTMLElement | null = null;
  @Input() visible: boolean = false;
  @Input() autoHide: boolean = true;
  @Input() hideDelay: number = 10000; // 10 segundos

  @Output() close = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
  @Output() focusField = new EventEmitter<string>();

  @ViewChild('contextPanel', { static: false }) panelRef!: ElementRef<HTMLElement>;

  position: ErrorContextPosition = {
    top: 0,
    left: 0,
    placement: 'bottom'
  };

  private hideTimeout?: number;
  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    if (this.autoHide && this.hideDelay > 0) {
      this.scheduleAutoHide();
    }
  }

  ngAfterViewInit(): void {
    if (this.visible && this.targetElement) {
      this.calculatePosition();
      this.setupResizeObserver();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoHide();
    this.cleanupResizeObserver();
  }

  /**
   * Calcula la posición óptima del panel relativo al campo objetivo
   */
  private calculatePosition(): void {
    if (!this.targetElement || !this.panelRef) {
      return;
    }

    const targetRect = this.targetElement.getBoundingClientRect();
    const panelElement = this.panelRef.nativeElement;
    const panelRect = panelElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const spacing = 12; // Espacio entre el campo y el panel
    const arrowSize = 8;

    // Intentar posicionar debajo del campo (preferido)
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    let top = targetRect.bottom + spacing;
    let left = targetRect.left + (targetRect.width / 2) - (panelRect.width / 2);

    // Verificar si cabe debajo
    if (top + panelRect.height > viewport.height - 20) {
      // Intentar arriba
      placement = 'top';
      top = targetRect.top - panelRect.height - spacing;
      
      // Si no cabe arriba, intentar a los lados
      if (top < 20) {
        if (targetRect.right + panelRect.width + spacing < viewport.width - 20) {
          // Posicionar a la derecha
          placement = 'right';
          top = targetRect.top + (targetRect.height / 2) - (panelRect.height / 2);
          left = targetRect.right + spacing;
        } else {
          // Posicionar a la izquierda
          placement = 'left';
          top = targetRect.top + (targetRect.height / 2) - (panelRect.height / 2);
          left = targetRect.left - panelRect.width - spacing;
        }
      }
    }

    // Ajustar horizontalmente si se sale del viewport
    if (placement === 'top' || placement === 'bottom') {
      if (left < 20) {
        left = 20;
      } else if (left + panelRect.width > viewport.width - 20) {
        left = viewport.width - panelRect.width - 20;
      }
    }

    // Ajustar verticalmente si se sale del viewport
    if (placement === 'left' || placement === 'right') {
      if (top < 20) {
        top = 20;
      } else if (top + panelRect.height > viewport.height - 20) {
        top = viewport.height - panelRect.height - 20;
      }
    }

    this.position = { top, left, placement };
  }

  /**
   * Configura el observer para reposicionar cuando cambie el tamaño
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculatePosition();
      });
      
      if (this.targetElement) {
        this.resizeObserver.observe(this.targetElement);
      }
    }
  }

  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  private scheduleAutoHide(): void {
    this.clearAutoHide();
    this.hideTimeout = window.setTimeout(() => {
      this.onDismiss();
    }, this.hideDelay);
  }

  private clearAutoHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }

  getErrorIcon(): string {
    if (!this.fieldError) return 'error';
    
    switch (this.fieldError.type) {
      case ErrorType.VALIDATION:
        return 'warning';
      case ErrorType.CONFLICT:
        return 'error';
      default:
        return 'info';
    }
  }

  getStatusIcon(): string {
    switch (this.fieldError?.status) {
      case 'resolved':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      default:
        return 'error';
    }
  }

  getStatusText(): string {
    switch (this.fieldError?.status) {
      case 'resolved':
        return 'Corregido';
      case 'pending':
        return 'Pendiente de corrección';
      default:
        return 'Requiere atención';
    }
  }

  getFieldDisplayName(): string {
    const fieldNames: Record<string, string> = {
      'birthDate': 'Fecha de nacimiento',
      'email': 'Correo electrónico',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar contraseña',
      'firstName': 'Nombre',
      'lastName': 'Apellido',
      'dni': 'DNI',
      'cuit': 'CUIT',
      'username': 'Nombre de usuario'
    };

    return fieldNames[this.fieldError?.field || ''] || this.fieldError?.field || 'Campo';
  }

  onClose(): void {
    this.close.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  onFocusField(): void {
    if (this.fieldError?.field) {
      this.focusField.emit(this.fieldError.field);
    }
  }

  onOverlayClick(): void {
    this.onDismiss();
  }

  /**
   * Actualiza la posición cuando cambia el elemento objetivo
   */
  updatePosition(): void {
    if (this.visible && this.targetElement) {
      setTimeout(() => {
        this.calculatePosition();
      }, 0);
    }
  }

  /**
   * Muestra el panel para un campo específico
   */
  showForField(fieldError: FieldError, targetElement: HTMLElement): void {
    this.fieldError = fieldError;
    this.targetElement = targetElement;
    this.visible = true;
    
    setTimeout(() => {
      this.calculatePosition();
      this.setupResizeObserver();
      if (this.autoHide) {
        this.scheduleAutoHide();
      }
    }, 0);
  }

  /**
   * Oculta el panel
   */
  hide(): void {
    this.visible = false;
    this.clearAutoHide();
    this.cleanupResizeObserver();
  }
}
