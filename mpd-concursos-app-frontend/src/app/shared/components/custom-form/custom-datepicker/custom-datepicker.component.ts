import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-datepicker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="custom-datepicker" [class.disabled]="inputControl.disabled">
      <label *ngIf="label" class="datepicker-label" [class.required]="required" [attr.for]="getElementId()">
        {{ label }}
      </label>
      <div class="datepicker-container">
        <input
          type="date"
          class="datepicker-input"
          [formControl]="inputControl"
          [placeholder]="placeholder"
          [required]="required"
          [id]="getElementId()"
          (blur)="onTouched()"
        />
        <div *ngIf="clearable && inputControl.value"
             class="clear-button"
             (click)="clearDate($event)"
             (keydown.enter)="clearDate($event)"
             (keydown.space)="clearDate($event)"
             tabindex="0"
             role="button"
             aria-label="Limpiar fecha">
          <i class="fas fa-times" aria-hidden="true"></i>
        </div>
      </div>
      <div *ngIf="hint" class="datepicker-hint">{{ hint }}</div>
    </div>
  `,
  styles: [`
    .custom-datepicker {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      width: 100%;
    }

    .datepicker-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-text, #333);
    }

    .datepicker-label.required::after {
      content: '*';
      color: var(--color-warn, #f44336);
      margin-left: 0.25rem;
    }

    .datepicker-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .datepicker-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      background-color: var(--color-background, #fff);
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .datepicker-input:focus {
      border-color: var(--color-primary, #3f51b5);
      box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
    }

    .datepicker-input::placeholder {
      color: var(--color-text-hint, #999);
    }

    .datepicker-input:disabled {
      background-color: var(--color-disabled-background, #f5f5f5);
      color: var(--color-disabled-text, #999);
      cursor: not-allowed;
    }

    .clear-button {
      position: absolute;
      right: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      cursor: pointer;
      color: var(--color-text-secondary, #666);
      transition: color 0.2s;
    }

    .clear-button:hover {
      color: var(--color-warn, #f44336);
    }

    .datepicker-hint {
      font-size: 0.75rem;
      color: var(--color-text-hint, #999);
      margin-top: 0.25rem;
    }

    .custom-datepicker.disabled .datepicker-label {
      color: var(--color-disabled-text, #999);
    }

    /* Estilos para tema oscuro */
    @media (prefers-color-scheme: dark) {
      .datepicker-label {
        color: var(--color-text-dark, #e0e0e0);
      }

      .datepicker-input {
        background-color: var(--color-background-dark, #333);
        border-color: var(--color-border-dark, #555);
        color: var(--color-text-dark, #e0e0e0);
      }

      .datepicker-input:focus {
        border-color: var(--color-primary-dark, #7986cb);
        box-shadow: 0 0 0 2px rgba(121, 134, 203, 0.2);
      }

      .datepicker-input::placeholder {
        color: var(--color-text-hint-dark, #777);
      }

      .datepicker-input:disabled {
        background-color: var(--color-disabled-background-dark, #444);
        color: var(--color-disabled-text-dark, #777);
      }

      .clear-button {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .clear-button:hover {
        color: var(--color-warn-dark, #ef5350);
      }

      .datepicker-hint {
        color: var(--color-text-hint-dark, #777);
      }

      .custom-datepicker.disabled .datepicker-label {
        color: var(--color-disabled-text-dark, #777);
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatepickerComponent),
      multi: true
    }
  ]
})
export class CustomDatepickerComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'Seleccione una fecha';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() clearable = true;
  @Input() formControl: FormControl | null = null;

  inputControl = new FormControl<Date | null>(null);

  // ControlValueAccessor implementation
  onChange: (value: Date | null) => void = () => {
    // Este método será reemplazado por el framework
  };
  onTouched: () => void = () => {
    // Este método será reemplazado por el framework
  };

  ngOnInit(): void {
    // Inicializar el estado disabled del control interno basado en la propiedad @Input
    if (this.disabled) {
      this.inputControl.disable({ emitEvent: false });
    }

    // Sincronizar con formControl externo si existe
    if (this.formControl) {
      // Sincronizar valor
      this.inputControl.setValue(this.formControl.value, { emitEvent: false });

      // Sincronizar estado disabled
      if (this.formControl.disabled) {
        this.inputControl.disable({ emitEvent: false });
      } else if (this.formControl.enabled && this.disabled) {
        // Si el control externo está habilitado pero la propiedad @Input disabled es true,
        // respetamos la propiedad @Input
        this.formControl.disable({ emitEvent: false });
      }

      // Suscribirse a cambios de valor en el control externo
      this.formControl.valueChanges.subscribe(value => {
        if (value !== this.inputControl.value) {
          this.inputControl.setValue(value, { emitEvent: false });
        }
      });

      // Suscribirse a cambios de estado en el control externo
      this.formControl.statusChanges.subscribe(status => {
        const isDisabled = status === 'DISABLED';
        const inputIsDisabled = this.inputControl.disabled;

        if (isDisabled !== inputIsDisabled) {
          if (isDisabled) {
            this.inputControl.disable({ emitEvent: false });
          } else {
            this.inputControl.enable({ emitEvent: false });
          }
        }
      });
    }

    // Suscribirse a cambios en el control interno
    this.inputControl.valueChanges.subscribe(value => {
      // Notificar al ControlValueAccessor
      this.onChange(value);

      // Sincronizar con el control externo si existe
      if (this.formControl && value !== this.formControl.value) {
        this.formControl.setValue(value, { emitEvent: false });
      }
    });
  }

  writeValue(value: Date | null): void {
    this.inputControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Genera un ID para el elemento de fecha basado en la etiqueta
   */
  getElementId(): string {
    if (!this.label) return 'datepicker';
    return 'datepicker-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  setDisabledState(isDisabled: boolean): void {
    // No necesitamos actualizar this.disabled ya que ahora usamos inputControl.disabled directamente en el template
    if (isDisabled) {
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  clearDate(event: Event): void {
    event.stopPropagation();
    this.inputControl.setValue(null);
    this.onChange(null);
  }
}
