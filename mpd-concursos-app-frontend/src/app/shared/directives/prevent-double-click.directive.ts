import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ButtonLockService } from '@core/services/ui/button-lock.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Directiva para prevenir doble clic en botones
 * 
 * Uso:
 * <button appPreventDoubleClick [lockDuration]="3000" [buttonId]="'replace-doc-btn'">
 *   Reemplazar Documento
 * </button>
 * 
 * Características:
 * - Previene múltiples clics rápidos
 * - Bloqueo visual del botón
 * - Integración con ButtonLockService
 * - Configuración personalizable
 */
@Directive({
  selector: '[appPreventDoubleClick]',
  standalone: true
})
export class PreventDoubleClickDirective implements OnInit, OnDestroy {

  @Input() lockDuration: number = 2000; // Duración del bloqueo en ms
  @Input() buttonId: string = ''; // ID único del botón
  @Input() debounceTime: number = 300; // Tiempo de debounce para clics

  private clickSubscription?: Subscription;
  private originalText: string = '';
  private originalDisabled: boolean = false;

  constructor(
    private elementRef: ElementRef<HTMLButtonElement>,
    private renderer: Renderer2,
    private buttonLockService: ButtonLockService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.setupClickPrevention();
    this.generateButtonIdIfNeeded();
    this.storeOriginalState();
  }

  ngOnDestroy(): void {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
    
    // Limpiar el lock si existe
    if (this.buttonId) {
      this.buttonLockService.unlockButton(this.buttonId);
    }
  }

  /**
   * Configura la prevención de doble clic
   */
  private setupClickPrevention(): void {
    const button = this.elementRef.nativeElement;
    
    // Interceptar eventos de clic
    this.clickSubscription = fromEvent(button, 'click')
      .pipe(debounceTime(this.debounceTime))
      .subscribe((event: Event) => {
        this.handleClick(event);
      });
  }

  /**
   * Maneja el evento de clic
   */
  private handleClick(event: Event): void {
    const button = this.elementRef.nativeElement;
    
    // Si el botón ya está bloqueado, prevenir el clic
    if (this.buttonLockService.isButtonLocked(this.buttonId)) {
      event.preventDefault();
      event.stopPropagation();
      
      this.loggingService.warn(`🔒 [PreventDoubleClick] Clic bloqueado en botón: ${this.buttonId}`);
      return;
    }

    // Bloquear el botón
    if (this.buttonLockService.lockButton(this.buttonId, this.lockDuration)) {
      this.applyLockedState();
      
      // Programar la restauración del estado
      setTimeout(() => {
        this.restoreOriginalState();
      }, this.lockDuration);
      
      this.loggingService.debug(`🔒 [PreventDoubleClick] Botón bloqueado: ${this.buttonId}`);
    }
  }

  /**
   * Aplica el estado visual de bloqueado
   */
  private applyLockedState(): void {
    const button = this.elementRef.nativeElement;
    
    // Deshabilitar el botón
    this.renderer.setProperty(button, 'disabled', true);
    
    // Agregar clase CSS para styling
    this.renderer.addClass(button, 'btn-locked');
    
    // Cambiar el texto si es apropiado
    if (button.textContent && !button.textContent.includes('...')) {
      this.renderer.setProperty(button, 'textContent', button.textContent + '...');
    }
    
    // Agregar cursor de espera
    this.renderer.setStyle(button, 'cursor', 'wait');
  }

  /**
   * Restaura el estado original del botón
   */
  private restoreOriginalState(): void {
    const button = this.elementRef.nativeElement;
    
    // Restaurar estado de habilitado
    this.renderer.setProperty(button, 'disabled', this.originalDisabled);
    
    // Remover clase CSS
    this.renderer.removeClass(button, 'btn-locked');
    
    // Restaurar texto original
    if (this.originalText) {
      this.renderer.setProperty(button, 'textContent', this.originalText);
    }
    
    // Restaurar cursor
    this.renderer.removeStyle(button, 'cursor');
    
    this.loggingService.debug(`🔓 [PreventDoubleClick] Estado restaurado para botón: ${this.buttonId}`);
  }

  /**
   * Almacena el estado original del botón
   */
  private storeOriginalState(): void {
    const button = this.elementRef.nativeElement;
    this.originalText = button.textContent || '';
    this.originalDisabled = button.disabled;
  }

  /**
   * Genera un ID único para el botón si no se proporcionó
   */
  private generateButtonIdIfNeeded(): void {
    if (!this.buttonId) {
      const button = this.elementRef.nativeElement;
      const text = button.textContent?.trim().replace(/\s+/g, '-').toLowerCase() || 'button';
      const timestamp = Date.now();
      this.buttonId = `${text}-${timestamp}`;
    }
  }
}
