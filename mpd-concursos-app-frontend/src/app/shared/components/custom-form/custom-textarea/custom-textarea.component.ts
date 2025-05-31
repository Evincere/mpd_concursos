import { Component, Input, OnInit, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="custom-textarea-field" [class.has-error]="showError" [class.focused]="isFocused" [class.disabled]="isDisabled">
      <label *ngIf="label" class="field-label" [class.required]="required" [attr.for]="'textarea-' + (label ? label.toLowerCase().replace(' ', '-') : '')">
        {{ label }}
      </label>

      <div class="textarea-container">
        <textarea
          #textarea
          class="field-textarea"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="isDisabled"
          [required]="required"
          [rows]="rows"
          [id]="'textarea-' + (label ? label.toLowerCase().replace(' ', '-') : '')"
          (input)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        ></textarea>
      </div>

      <div *ngIf="showError" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="hint && !showError" class="hint-text">
        {{ hint }}
      </div>
    </div>
  `,
  styles: [`
    .custom-textarea-field {
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

    .textarea-container {
      position: relative;
      display: flex;
      align-items: flex-start;
    }

    .field-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--color-text-primary, #333);
      background-color: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
    }

    .field-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #3f51b5);
      box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
    }

    .field-textarea:disabled {
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

    .has-error .field-textarea {
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

    .field-textarea {
      color: #f9fafb;
      background-color: #4b5563;
      border-color: #6b7280;
      font-weight: 400;
    }

    .field-textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      background-color: #4b5563;
    }

    .field-textarea:hover:not(:focus) {
      border-color: #9ca3af;
      background-color: #4b5563;
    }

    .field-textarea:disabled {
      background-color: #374151;
      color: #9ca3af;
      opacity: 0.7;
    }

    .field-textarea::placeholder {
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

    .focused .field-label {
      color: #3b82f6;
    }

    .disabled .field-label {
      color: #9ca3af;
    }
  `]
})
export class CustomTextareaComponent implements OnInit, ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() rows = 4;
  @Input() control: FormControl | null = null;

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
    const value = (event.target as HTMLTextAreaElement).value;
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
}
