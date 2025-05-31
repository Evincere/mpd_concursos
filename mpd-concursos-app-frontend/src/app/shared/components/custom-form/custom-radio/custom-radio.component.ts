import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface RadioOption {
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="custom-radio-group" [class.disabled]="disabled" role="radiogroup" [attr.aria-label]="groupLabel">
      <label *ngIf="groupLabel" class="radio-group-label" [class.required]="required">
        {{ groupLabel }}
      </label>
      
      <div class="radio-options">
        <div *ngFor="let option of options; let i = index" class="custom-radio-container">
          <label class="custom-radio">
            <input
              type="radio"
              [name]="name"
              [value]="option.value"
              [checked]="value === option.value"
              [disabled]="disabled || option.disabled"
              [attr.aria-checked]="value === option.value"
              [attr.aria-disabled]="disabled || option.disabled"
              [attr.aria-label]="option.label"
              [id]="'radio-' + name + '-' + i"
              (change)="onChange($event, option)"
              (blur)="onTouched()"
              (keydown.space)="selectOption($event, option)"
            />
            <span class="radio-mark"></span>
            <span class="radio-label">{{ option.label }}</span>
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-radio-group {
      margin-bottom: 1rem;
    }

    .radio-group-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #333);
    }

    .radio-group-label.required::after {
      content: "*";
      color: var(--color-error, #f44336);
      margin-left: 0.25rem;
    }

    .radio-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .custom-radio-container {
      margin-bottom: 0.25rem;
    }

    .custom-radio {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 30px;
      cursor: pointer;
      font-size: 14px;
      user-select: none;
    }

    .custom-radio input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .radio-mark {
      position: absolute;
      left: 0;
      height: 20px;
      width: 20px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .custom-radio:hover input ~ .radio-mark {
      background-color: #eee;
    }

    .custom-radio input:checked ~ .radio-mark {
      background-color: var(--color-primary, #3f51b5);
      border-color: var(--color-primary, #3f51b5);
    }

    .radio-mark:after {
      content: "";
      position: absolute;
      display: none;
      left: 7px;
      top: 7px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: white;
    }

    .custom-radio input:checked ~ .radio-mark:after {
      display: block;
    }

    .radio-label {
      margin-left: 5px;
    }

    .disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .disabled .custom-radio {
      cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
      .radio-group-label {
        color: var(--color-text-primary-dark, #e0e0e0);
      }

      .radio-mark {
        background-color: #333;
        border-color: #555;
      }

      .custom-radio:hover input ~ .radio-mark {
        background-color: #444;
      }

      .custom-radio input:checked ~ .radio-mark {
        background-color: var(--color-primary-dark, #7986cb);
        border-color: var(--color-primary-dark, #7986cb);
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomRadioComponent),
      multi: true
    }
  ]
})
export class CustomRadioComponent implements ControlValueAccessor {
  @Input() options: RadioOption[] = [];
  @Input() groupLabel = '';
  @Input() name = 'radio-group-' + Math.random().toString(36).substring(2, 9);
  @Input() disabled = false;
  @Input() required = false;

  value: string | number | boolean | null = null;

  onChange: (value: string | number | boolean) => void = () => {
    // Este método será reemplazado por el framework
  };
  onTouched: () => void = () => {
    // Este método será reemplazado por el framework
  };

  writeValue(value: string | number | boolean | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: unknown): void {
    this.onTouched = fn as () => void;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(event: Event, option: RadioOption): void {
    if (this.disabled || option.disabled) return;
    
    this.value = option.value;
    this.onChange(option.value);
  }

  selectOption(event: KeyboardEvent, option: RadioOption): void {
    if (this.disabled || option.disabled) return;
    
    event.preventDefault();
    this.value = option.value;
    
    // Simular un evento de cambio para el input
    const changeEvent = new Event('change', { bubbles: true });
    const inputElement = event.target as HTMLInputElement;
    inputElement.checked = true;
    inputElement.dispatchEvent(changeEvent);
    
    // Llamar a los métodos de control de formulario
    this.onChange(option.value);
    this.onTouched();
  }
}
