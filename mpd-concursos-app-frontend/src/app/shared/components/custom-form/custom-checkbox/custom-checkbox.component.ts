import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-checkbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-checkbox-container">
      <label 
        class="checkbox-wrapper" 
        [class.disabled]="disabled"
        [attr.for]="checkboxId"
      >
        <input
          [id]="checkboxId"
          type="checkbox"
          class="checkbox-input"
          [checked]="value"
          [disabled]="disabled"
          [attr.aria-checked]="value"
          [attr.aria-disabled]="disabled"
          [attr.aria-label]="label"
          (change)="onInputChange($event)"
          (blur)="onTouched()"
          (click)="$event.stopPropagation()"
        />
        <span class="checkmark" (click)="onCheckmarkClick($event)"></span>
        <span class="checkbox-label" (click)="onLabelClick($event)">{{ label }}</span>
      </label>
    </div>
  `,
  styles: [`
    .custom-checkbox-container {
      margin-bottom: 0.5rem;
    }

    .checkbox-wrapper {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      user-select: none;
      padding: 0.75rem 0.5rem;
      border-radius: 6px;
      transition: background-color 0.15s ease;
      position: relative;
      /* ✅ CRÍTICO: Evitar efectos de pulsación inesperados */
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    .checkbox-wrapper:hover:not(.disabled) {
      background-color: rgba(59, 130, 246, 0.08);
    }

    .checkbox-wrapper.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
      /* ✅ CRÍTICO: Input completamente oculto pero funcional */
      pointer-events: none;
      z-index: -1;
    }

    .checkmark {
      height: 20px;
      width: 20px;
      background-color: transparent;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-radius: 4px;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      /* ✅ CRÍTICO: Área de clic clara y estable */
      box-sizing: border-box;
    }

    .checkbox-wrapper:hover .checkmark:not(.disabled) {
      border-color: #3b82f6;
      background-color: rgba(59, 130, 246, 0.1);
    }

    .checkbox-input:checked ~ .checkmark {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }

    .checkbox-input:checked ~ .checkmark:after {
      content: "";
      position: absolute;
      display: block;
      left: 6px;
      top: 2px;
      width: 6px;
      height: 12px;
      border: solid #ffffff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label {
      color: #ffffff;
      font-size: 0.9rem;
      line-height: 1.5;
      cursor: pointer;
      flex: 1;
      /* ✅ CRÍTICO: Evitar selección de texto */
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    .disabled .checkbox-label {
      color: rgba(255, 255, 255, 0.6);
      cursor: not-allowed;
    }

    .disabled .checkmark {
      border-color: rgba(255, 255, 255, 0.4);
      cursor: not-allowed;
    }

    /* ✅ CRÍTICO: Estados de focus mejorados */
    .checkbox-input:focus ~ .checkmark {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomCheckboxComponent),
      multi: true
    }
  ]
})
export class CustomCheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;
  
  // ✅ CRÍTICO: Output para comunicar cambios directamente
  @Output() change = new EventEmitter<boolean>();
  
  @Input() set checked(val: boolean) {
    this.value = val;
  }
  get checked(): boolean {
    return this.value;
  }

  value = false;
  
  // ✅ CRÍTICO: ID único para asociar label con input
  checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  // ✅ CRÍTICO: Control de múltiples clicks
  private isToggling = false;
  
  // Control Value Accessor
  onChange = (value: boolean) => {};
  onTouched = () => {};

  writeValue(value: boolean): void {
    this.value = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * ✅ CRÍTICO: Manejo principal del cambio a través del input
   */
  onInputChange(event: Event): void {
    if (this.disabled || this.isToggling) return;
    
    const target = event.target as HTMLInputElement;
    this.updateValue(target.checked);
  }

  /**
   * ✅ CRÍTICO: Manejo de clic en el checkmark (icono)
   */
  onCheckmarkClick(event: MouseEvent): void {
    if (this.disabled || this.isToggling) return;
    
    // ✅ CRITICAL FIX: Evitar propagación y comportamiento por defecto
    event.stopPropagation();
    event.preventDefault();
    
    // Alternar valor directamente
    this.updateValue(!this.value);
  }

  /**
   * ✅ CRÍTICO: Manejo de clic en el label de texto
   */
  onLabelClick(event: MouseEvent): void {
    if (this.disabled || this.isToggling) return;
    
    // ✅ CRITICAL FIX: Evitar propagación y comportamiento por defecto
    event.stopPropagation();
    event.preventDefault();
    
    // Alternar valor directamente
    this.updateValue(!this.value);
  }

  /**
   * ✅ CRÍTICO: Método centralizado para actualizar valor
   * Previene múltiples actualizaciones simultáneas
   */
  private updateValue(newValue: boolean): void {
    if (this.isToggling || this.disabled || this.value === newValue) return;
    
    this.isToggling = true;
    this.value = newValue;
    
    // Notificar cambios
    this.onChange(this.value);
    this.onTouched();
    
    // ✅ CRÍTICO: Emitir evento personalizado para componentes padre
    this.change.emit(this.value);
    
    console.log(`✅ CustomCheckbox value updated: ${this.label} = ${this.value}`);
    
    // Resetear flag después de un pequeño delay
    setTimeout(() => {
      this.isToggling = false;
    }, 100);
  }
}
