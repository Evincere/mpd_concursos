/**
 * Componente de Input Numérico Localizado
 * 
 * @description Input numérico que maneja correctamente la localización argentina (coma como separador decimal)
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Component, Input, OnInit, Optional, Self, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, AbstractControl, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-number-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomNumberInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="custom-number-input" [class.has-error]="showError" [class.focused]="isFocused" [class.disabled]="isDisabled">
      <label *ngIf="label" class="field-label" [class.required]="required" [attr.for]="getInputId()">
        {{ label }}
      </label>

      <div class="input-container">
        <input
          #input
          class="field-input"
          type="text"
          [placeholder]="localizedPlaceholder"
          [value]="displayValue"
          [disabled]="isDisabled"
          [readonly]="readonly"
          [required]="required"
          [id]="getInputId()"
          [attr.aria-invalid]="showError"
          [attr.aria-required]="required"
          [attr.aria-describedby]="getAriaDescribedBy()"
          (input)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeyDown($event)"
        />

        <div *ngIf="showClearButton && displayValue"
             class="clear-button"
             (click)="clearValue()"
             (keydown.enter)="clearValue()"
             (keydown.space)="clearValue()"
             tabindex="0"
             role="button"
             aria-label="Limpiar campo">
          <i class="fas fa-times" aria-hidden="true"></i>
        </div>
      </div>

      <div *ngIf="showError && errorMessage" class="error-message" role="alert" [attr.id]="getErrorId()">
        {{ errorMessage }}
      </div>

      <div *ngIf="hint && !showError" class="hint-text" [attr.id]="getHintId()">
        {{ hint }}
      </div>
    </div>
  `,
  styles: [`
    .custom-number-input {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      width: 100%;
      font-family: inherit;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #d1d5db;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .field-label.required::after {
      content: "*";
      color: #ef4444;
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
      color: #ffffff;
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.6) 0%,
        rgba(75, 85, 99, 0.4) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .field-input::placeholder {
      color: #9ca3af;
      opacity: 0.8;
    }

    .field-input:focus {
      outline: none;
      border-color: rgba(96, 165, 250, 0.6);
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.6) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 
        0 0 0 2px rgba(96, 165, 250, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .field-input:hover:not(:focus):not(:disabled) {
      border-color: rgba(255, 255, 255, 0.25);
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.7) 0%,
        rgba(75, 85, 99, 0.5) 100%);
    }

    .field-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: rgba(55, 65, 81, 0.3);
    }

    .clear-button {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #9ca3af;
      transition: color 0.2s ease-in-out;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .clear-button:hover {
      color: #ef4444;
      background-color: rgba(239, 68, 68, 0.1);
    }

    .error-message {
      font-size: 0.875rem;
      color: #ef4444;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .hint-text {
      font-size: 0.875rem;
      color: #9ca3af;
      margin-top: 0.5rem;
    }

    .has-error .field-input {
      border-color: #ef4444;
      background: linear-gradient(135deg,
        rgba(239, 68, 68, 0.1) 0%,
        rgba(55, 65, 81, 0.6) 100%);
    }

    .focused .field-label {
      color: #60a5fa;
    }

    .disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  `]
})
export class CustomNumberInputComponent implements OnInit, ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() showClearButton = false;
  @Input() control: AbstractControl | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() decimals: number = 2; // Número de decimales permitidos
  @Input() locale: string = 'es-AR'; // Localización argentina por defecto

  value: number | null = null;
  displayValue = '';
  isFocused = false;
  isDisabled = false;
  showError = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get localizedPlaceholder(): string {
    if (this.placeholder) {
      // Convertir placeholder de formato punto a coma
      return this.placeholder.replace('.', ',');
    }
    return this.decimals > 0 ? '0,00' : '0';
  }

  ngOnInit(): void {
    if (this.control && !this.ngControl) {
      this.value = this.control.value || null;
      this.updateDisplayValue();

      this.control.valueChanges.subscribe(value => {
        this.value = value || null;
        this.updateDisplayValue();
      });

      this.control.statusChanges.subscribe(() => {
        this.showError = this.control?.invalid && (this.control?.touched || this.control?.dirty) || false;
      });

      this.control.statusChanges.subscribe(() => {
        this.isDisabled = this.control?.disabled || false;
      });
    } else if (this.ngControl?.control) {
      this.ngControl.control.statusChanges.subscribe(() => {
        this.showError = this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty) || false;
        this.isDisabled = this.ngControl?.disabled || false;
      });
    }
  }

  writeValue(value: number | null): void {
    this.value = value;
    this.updateDisplayValue();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.displayValue = inputValue;

    // Convertir el valor de display (con comas) a número
    const numericValue = this.parseLocalizedNumber(inputValue);
    
    if (numericValue !== this.value) {
      this.value = numericValue;
      
      // Validar rangos
      if (this.value !== null) {
        if (this.min !== null && this.value < this.min) {
          this.value = this.min;
          this.updateDisplayValue();
        }
        if (this.max !== null && this.value > this.max) {
          this.value = this.max;
          this.updateDisplayValue();
        }
      }

      // Actualizar control directo si no estamos usando ngControl
      if (this.control && !this.ngControl) {
        this.control.setValue(this.value);
        this.control.markAsTouched();
      }

      // Siempre llamar al onChange para ControlValueAccessor
      this.onChange(this.value);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Permitir teclas de control
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
    if (controlKeys.includes(event.key)) {
      return;
    }

    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Permitir números
    if (/^\d$/.test(event.key)) {
      return;
    }

    // Permitir coma como separador decimal (solo una)
    if (event.key === ',' && this.decimals > 0 && !this.displayValue.includes(',')) {
      return;
    }

    // Permitir signo menos al principio (si min permite negativos)
    if (event.key === '-' && (this.min === null || this.min < 0) && this.displayValue.length === 0) {
      return;
    }

    // Bloquear todo lo demás
    event.preventDefault();
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
    
    // Formatear el valor al perder el foco
    if (this.value !== null) {
      this.updateDisplayValue();
    }
  }

  clearValue(): void {
    this.value = null;
    this.displayValue = '';

    if (this.control && !this.ngControl) {
      this.control.setValue(null);
      this.control.markAsTouched();
    }

    this.onChange(null);
  }

  private updateDisplayValue(): void {
    if (this.value === null || this.value === undefined) {
      this.displayValue = '';
    } else {
      // Formatear número con localización argentina
      this.displayValue = this.value.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: this.decimals
      });
    }
  }

  private parseLocalizedNumber(value: string): number | null {
    if (!value || value.trim() === '') {
      return null;
    }

    // Remover espacios y convertir coma a punto
    const normalizedValue = value.trim().replace(',', '.');
    
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? null : parsed;
  }

  getInputId(): string {
    if (!this.label) return 'number-input-field';
    return 'number-input-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  getErrorId(): string {
    if (!this.label) return 'number-error-field';
    return 'number-error-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  getHintId(): string {
    if (!this.label) return 'number-hint-field';
    return 'number-hint-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  getAriaDescribedBy(): string {
    const ids: string[] = [];
    if (this.hint && !this.showError) {
      ids.push(this.getHintId());
    }
    if (this.showError && this.errorMessage) {
      ids.push(this.getErrorId());
    }
    return ids.join(' ') || '';
  }
}
