import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva que elimina automáticamente los espacios en blanco al inicio y final
 * cuando el usuario sale del campo (evento blur).
 * 
 * Uso:
 * <input formControlName="nombre" appTrimOnBlur>
 * <input [(ngModel)]="valor" appTrimOnBlur>
 */
@Directive({
  selector: '[appTrimOnBlur]',
  standalone: true
})
export class TrimOnBlurDirective {

  constructor(
    private elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    private ngControl: NgControl | null
  ) {}

  @HostListener('blur')
  onBlur(): void {
    const element = this.elementRef.nativeElement;
    const currentValue = element.value;

    if (typeof currentValue === 'string') {
      const trimmedValue = currentValue.trim();
      
      // Solo actualizar si el valor cambió
      if (trimmedValue !== currentValue) {
        // Actualizar el valor del elemento
        element.value = trimmedValue;
        
        // Actualizar el control del formulario si existe
        if (this.ngControl && this.ngControl.control) {
          this.ngControl.control.setValue(trimmedValue);
          this.ngControl.control.markAsTouched();
        }
        
        // Disparar evento input para notificar cambios
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}
