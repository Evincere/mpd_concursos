import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Directiva para mejorar la experiencia táctil en formularios.
 * Aumenta el tamaño de los elementos de formulario en dispositivos táctiles.
 */
@Directive({
  selector: '[appTouchFriendly]',
  standalone: true
})
export class TouchFriendlyDirective implements OnInit {
  @Input() touchMinHeight = '48px';
  @Input() touchPadding = '12px';
  @Input() touchFontSize = '16px';

  private isTouchDevice = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    // Detectar si es un dispositivo táctil
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  ngOnInit(): void {
    if (this.isTouchDevice) {
      this.applyTouchStyles();
    }
  }

  private applyTouchStyles(): void {
    // Aplicar estilos para mejorar la experiencia táctil
    this.renderer.setStyle(this.el.nativeElement, 'min-height', this.touchMinHeight);
    this.renderer.setStyle(this.el.nativeElement, 'padding', this.touchPadding);
    this.renderer.setStyle(this.el.nativeElement, 'font-size', this.touchFontSize);
    
    // Aumentar el espacio entre elementos
    this.renderer.setStyle(this.el.nativeElement, 'margin-bottom', '16px');
    
    // Mejorar la visibilidad del foco
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'box-shadow 0.3s ease');
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.isTouchDevice) {
      // Mejorar la visibilidad del foco
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 0 0 2px rgba(25, 118, 210, 0.5)');
    }
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.isTouchDevice) {
      // Restaurar el estilo normal
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
    }
  }
}
