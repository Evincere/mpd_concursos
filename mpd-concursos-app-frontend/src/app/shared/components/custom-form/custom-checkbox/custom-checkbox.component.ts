import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="custom-checkbox-container" [class.disabled]="disabled">
      <label class="custom-checkbox" (click)="onLabelClick($event)">
        <input
          type="checkbox"
          [checked]="value"
          [disabled]="disabled"
          [attr.aria-checked]="value"
          [attr.aria-disabled]="disabled"
          [attr.aria-label]="label"
          (change)="onInputChange($event)"
          (blur)="onTouched()"
          (keydown.space)="toggleCheckbox($event)"
          (click)="onInputClick($event)"
        />
        <span class="checkmark" (click)="onCheckmarkClick($event)"></span>
        <span class="checkbox-label" (click)="onLabelTextClick($event)">{{ label }}</span>
      </label>
    </div>
  `,
  styles: [`
    .custom-checkbox-container {
      margin-bottom: 0.5rem;
    }

    .custom-checkbox {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 30px;
      cursor: pointer;
      font-size: 14px;
      user-select: none;
      
      /* 🔧 FIX: Asegurar máxima clickeabilidad */
      z-index: 10;
      pointer-events: auto;
      
      /* 🔧 FIX: Aumentar área clickeable */
      min-height: 44px; /* Área mínima recomendada para touch */
      padding: 8px 8px 8px 30px;
      margin: -8px;
    }

    .custom-checkbox input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      
      /* 🔧 FIX: Aumentar área clickeable del input oculto */
      height: 44px;
      width: 100%;
      left: 0;
      top: 0;
      
      /* 🔧 FIX: Asegurar máxima prioridad de eventos */
      z-index: 15;
      pointer-events: auto;
    }

    .checkmark {
      position: absolute;
      left: 8px; /* Ajustado por el nuevo padding */
      top: 50%;
      transform: translateY(-50%);
      height: 20px;
      width: 20px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      border-radius: 3px;
      transition: all 0.2s ease;
      
      /* 🔧 FIX: Asegurar que el checkmark sea clickeable */
      z-index: 12;
      pointer-events: auto;
    }

    .custom-checkbox:hover input ~ .checkmark {
      background-color: #eee;
    }

    .custom-checkbox input:checked ~ .checkmark {
      background-color: var(--color-primary, #3f51b5);
      border-color: var(--color-primary, #3f51b5);
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }

    .custom-checkbox input:checked ~ .checkmark:after {
      display: block;
    }

    .custom-checkbox .checkmark:after {
      left: 7px;
      top: 3px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label {
      margin-left: 5px;
      color: #ffffff; /* ✅ UX/UI: Color blanco por defecto para labels */
      
      /* 🔧 FIX: Asegurar que el label sea clickeable */
      position: relative;
      z-index: 12;
      pointer-events: auto;
      cursor: pointer;
      
      /* 🔧 FIX: Mejorar área clickeable del texto */
      padding: 4px;
      margin: -4px -4px -4px 1px;
    }

    .disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .disabled .custom-checkbox {
      cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
      .checkmark {
        background-color: #333;
        border-color: #555;
      }

      .custom-checkbox:hover input ~ .checkmark {
        background-color: #444;
      }

      .custom-checkbox input:checked ~ .checkmark {
        background-color: var(--color-primary-dark, #7986cb);
        border-color: var(--color-primary-dark, #7986cb);
      }

      .checkbox-label {
        color: #ffffff !important; /* ✅ UX/UI: Color blanco para tema oscuro */
      }
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
  @Input() set checked(val: boolean) {
    this.value = val;
  }
  get checked(): boolean {
    return this.value;
  }

  value = false;

  onChange: (value: boolean) => void = () => {
    // Este método será reemplazado por el framework
  };
  onTouched: () => void = () => {
    // Este método será reemplazado por el framework
  };

  writeValue(value: boolean): void {
    this.value = value;
    // No emitir evento de cambio aquí para evitar ciclos infinitos
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.checked;
    this.onChange(this.value);
  }

  registerOnTouched(fn: unknown): void {
    this.onTouched = fn as () => void;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleCheckbox(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.disabled) return;

    event.preventDefault();
    this.value = !this.value;

    // No necesitamos simular un evento de cambio para el input
    // ya que estamos manejando directamente el cambio de valor

    // Llamar a los métodos de control de formulario
    this.onChange(this.value);
    this.onTouched();
  }

  /**
   * 🔧 FIX: Manejo específico de clic en el label principal
   */
  onLabelClick(event: Event): void {
    if (this.disabled) return;
    
    // Prevenir propagación para evitar conflictos
    event.stopPropagation();
    
    // Solo procesar si el clic no fue en el input (que ya maneja su propio evento)
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() !== 'input') {
      this.toggleValue();
    }
  }

  /**
   * 🔧 FIX: Manejo específico de clic en el input
   */
  onInputClick(event: Event): void {
    if (this.disabled) return;
    
    // Asegurar que el evento se procese correctamente
    event.stopPropagation();
  }

  /**
   * 🔧 FIX: Manejo específico de clic en el checkmark
   */
  onCheckmarkClick(event: Event): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.toggleValue();
  }

  /**
   * 🔧 FIX: Manejo específico de clic en el texto del label
   */
  onLabelTextClick(event: Event): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.toggleValue();
  }

  /**
   * 🔧 FIX: Método centralizado para cambiar el valor
   */
  private toggleValue(): void {
    if (this.disabled) return;
    
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
  }
}
