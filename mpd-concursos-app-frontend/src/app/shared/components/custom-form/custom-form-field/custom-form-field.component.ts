import { Component, Input, OnInit, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="custom-form-field" [class.has-error]="showError" [class.focused]="isFocused" [class.disabled]="isDisabled">
      <label *ngIf="label" class="field-label" [class.required]="required" [attr.for]="getInputId()">
        {{ label }}
      </label>

      <div class="input-container">
        <input
          #input
          class="field-input"
          [type]="type"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="isDisabled"
          [readonly]="readonly"
          [required]="required"
          [id]="getInputId()"
          [attr.aria-invalid]="showError"
          [attr.aria-required]="required"
          [attr.aria-describedby]="getAriaDescribedBy()"
          [attr.min]="min"
          [attr.max]="max"
          (input)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />

        <div *ngIf="showClearButton && value"
             class="clear-button"
             (click)="clearValue()"
             (keydown.enter)="clearValue()"
             (keydown.space)="clearValue()"
             tabindex="0"
             role="button"
             aria-label="Limpiar campo">
          <i class="fas fa-times" aria-hidden="true"></i>
        </div>

        <div *ngIf="iconRight" class="icon-right">
          <i class="fas fa-{{ iconRight }}"></i>
        </div>
      </div>

      <div *ngIf="showError" class="error-message" role="alert" [attr.id]="getErrorId()">
        {{ errorMessage }}
      </div>

      <div *ngIf="hint && !showError" class="hint-text" [attr.id]="getHintId()">
        {{ hint }}
      </div>
    </div>
  `,
  styles: [`
    .custom-form-field {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      width: 100%;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #333);
    }

    .field-label.required::after {
      content: "*";
      color: var(--color-error, #f44336);
      margin-left: 0.25rem;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--color-text-primary, #333);
      background-color: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .field-input:focus {
      outline: none;
      border-color: var(--color-primary, #3f51b5);
      box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
    }

    .field-input:disabled {
      background-color: var(--color-background-disabled, #f5f5f5);
      cursor: not-allowed;
      opacity: 0.7;
    }

    .error-message {
      font-size: 0.75rem;
      color: var(--color-error, #f44336);
      margin-top: 0.25rem;
    }

    .hint-text {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #666);
      margin-top: 0.25rem;
    }

    .clear-button {
      position: absolute;
      right: 0.75rem;
      cursor: pointer;
      color: var(--color-text-secondary, #666);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
    }

    .clear-button:hover {
      color: var(--color-text-primary, #333);
    }

    .icon-right {
      position: absolute;
      right: 0.75rem;
      color: var(--color-text-secondary, #666);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .has-error .field-input {
      border-color: var(--color-error, #f44336);
    }

    .focused .field-label {
      color: var(--color-primary, #3f51b5);
    }

    .disabled .field-label {
      color: var(--color-text-disabled, #999);
    }

    /* Dark theme styles - improved contrast for accessibility */
    .field-label {
      color: #f9fafb;
      font-weight: 500;
    }

    .field-input {
      color: #f9fafb;
      background-color: #4b5563;
      border-color: #6b7280;
      font-weight: 400;
    }

    .field-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      background-color: #4b5563;
    }

    .field-input:hover:not(:focus) {
      border-color: #9ca3af;
      background-color: #4b5563;
    }

    .field-input:disabled {
      background-color: #374151;
      color: #9ca3af;
      opacity: 0.7;
    }

    .field-input::placeholder {
      color: #9ca3af;
      opacity: 1;
    }

    .hint-text {
      color: #d1d5db;
    }

    .error-message {
      color: #fca5a5;
      font-weight: 500;
    }

    .clear-button {
      color: #9ca3af;
    }

    .clear-button:hover {
      color: #f9fafb;
    }

    .icon-right {
      color: #9ca3af;
    }

    .focused .field-label {
      color: #3b82f6;
    }

    .disabled .field-label {
      color: #9ca3af;
    }
  `]
})
export class CustomFormFieldComponent implements OnInit, ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false; // Add readonly property
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() iconRight = '';
  @Input() showClearButton = false;
  @Input() control: FormControl | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;

  value = '';
  isFocused = false;
  isDisabled = false;
  showError = false;

  private onChange: (value: string) => void = () => {
    // Este método será reemplazado por el framework
  };
  private onTouched: () => void = () => {
    // Este método será reemplazado por el framework
  };

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (this.control) {
      this.control.statusChanges.subscribe(() => {
        this.showError = this.control?.invalid && (this.control?.touched || this.control?.dirty) || false;
      });
    } else if (this.ngControl?.control) {
      this.ngControl.control.statusChanges.subscribe(() => {
        this.showError = this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty) || false;
      });
    }
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  clearValue(): void {
    this.value = '';
    this.onChange('');
  }

  /**
   * Genera un ID para el elemento de entrada basado en la etiqueta
   */
  getInputId(): string {
    if (!this.label) return 'input-field';
    return 'input-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera un ID para el mensaje de error basado en la etiqueta
   */
  getErrorId(): string {
    if (!this.label) return 'error-field';
    return 'error-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera un ID para el texto de ayuda basado en la etiqueta
   */
  getHintId(): string {
    if (!this.label) return 'hint-field';
    return 'hint-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera el valor para el atributo aria-describedby
   */
  getAriaDescribedBy(): string | null {
    if (this.showError) {
      return this.getErrorId();
    } else if (this.hint) {
      return this.getHintId();
    }
    return null;
  }
}
