import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Directiva para mejorar la accesibilidad de los elementos focusables
 * 
 * Ejemplo de uso:
 * ```html
 * <button appA11yFocus>Botón accesible</button>
 * ```
 */
@Directive({
  selector: '[appA11yFocus]',
  standalone: true
})
export class A11yFocusDirective implements OnInit {
  /**
   * Clase CSS para aplicar cuando el elemento está enfocado
   */
  @Input() focusClass = 'a11y-focus';
  
  /**
   * Indica si se debe mostrar un contorno visible
   */
  @Input() showOutline = true;
  
  /**
   * Color del contorno
   */
  @Input() outlineColor = 'var(--color-primary, #3f51b5)';
  
  /**
   * Ancho del contorno
   */
  @Input() outlineWidth = '2px';
  
  /**
   * Estilo del contorno
   */
  @Input() outlineStyle = 'solid';
  
  /**
   * Radio del contorno
   */
  @Input() outlineRadius = '4px';
  
  /**
   * Desplazamiento del contorno
   */
  @Input() outlineOffset = '2px';
  
  /**
   * Indica si el elemento está enfocado por teclado
   */
  private isKeyboardFocused = false;

  /**
   * Constructor
   * @param el Referencia al elemento
   * @param renderer Renderer
   */
  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  /**
   * Inicializa la directiva
   */
  ngOnInit(): void {
    // Asegurarse de que el elemento sea focusable
    this.ensureFocusable();
    
    // Aplicar estilos iniciales
    this.applyInitialStyles();
  }

  /**
   * Maneja el evento de enfoque
   * @param event Evento de enfoque
   */
  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    // Aplicar clase de enfoque solo si es enfoque por teclado
    if (this.isKeyboardFocused) {
      this.renderer.addClass(this.el.nativeElement, this.focusClass);
      
      if (this.showOutline) {
        this.applyFocusStyles();
      }
    }
  }

  /**
   * Maneja el evento de pérdida de enfoque
   */
  @HostListener('blur')
  onBlur(): void {
    // Quitar clase de enfoque
    this.renderer.removeClass(this.el.nativeElement, this.focusClass);
    
    if (this.showOutline) {
      this.removeFocusStyles();
    }
    
    // Restablecer el estado de enfoque por teclado
    this.isKeyboardFocused = false;
  }

  /**
   * Maneja el evento de pulsación de tecla
   */
  @HostListener('document:keydown')
  onKeyDown(): void {
    // Marcar que el próximo enfoque será por teclado
    this.isKeyboardFocused = true;
  }

  /**
   * Maneja el evento de clic del ratón
   */
  @HostListener('mousedown')
  onMouseDown(): void {
    // Marcar que el próximo enfoque no será por teclado
    this.isKeyboardFocused = false;
  }

  /**
   * Asegura que el elemento sea focusable
   */
  private ensureFocusable(): void {
    const element = this.el.nativeElement;
    
    // Verificar si el elemento es naturalmente focusable
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const isNaturallyFocusable = focusableTags.includes(element.tagName);
    
    // Si no es naturalmente focusable, hacerlo focusable
    if (!isNaturallyFocusable && element.getAttribute('tabindex') === null) {
      this.renderer.setAttribute(element, 'tabindex', '0');
    }
    
    // Asegurarse de que tenga un rol ARIA si no es un elemento estándar
    if (!isNaturallyFocusable && !element.getAttribute('role')) {
      this.renderer.setAttribute(element, 'role', 'button');
    }
  }

  /**
   * Aplica estilos iniciales
   */
  private applyInitialStyles(): void {
    const element = this.el.nativeElement;
    
    // Asegurarse de que el elemento tenga una transición suave
    this.renderer.setStyle(element, 'transition', 'outline 0.2s ease-in-out');
  }

  /**
   * Aplica estilos de enfoque
   */
  private applyFocusStyles(): void {
    const element = this.el.nativeElement;
    
    this.renderer.setStyle(element, 'outline', `${this.outlineWidth} ${this.outlineStyle} ${this.outlineColor}`);
    this.renderer.setStyle(element, 'outline-offset', this.outlineOffset);
    this.renderer.setStyle(element, 'border-radius', this.outlineRadius);
  }

  /**
   * Quita estilos de enfoque
   */
  private removeFocusStyles(): void {
    const element = this.el.nativeElement;
    
    this.renderer.removeStyle(element, 'outline');
    this.renderer.removeStyle(element, 'outline-offset');
  }
}
