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
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #f9fafb; /* Texto blanco para fondo oscuro */
    }

    .datepicker-label.required::after {
      content: '*';
      color: #ef4444;
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
      font-weight: 500;

      /* Glassmorphism styling */
      background: rgba(55, 65, 81, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #ffffff;

      transition: all 0.2s ease;
      outline: none;
    }

    .datepicker-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
    }

    .datepicker-input::placeholder {
      color: #d1d5db;
    }

    .datepicker-input:disabled {
      background: rgba(55, 65, 81, 0.5);
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
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
      color: #d1d5db;
      transition: all 0.2s ease;
      border-radius: 4px;
    }

    .clear-button:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .clear-button:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }

    .datepicker-hint {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .custom-datepicker.disabled .datepicker-label {
      color: #6b7280;
    }

    /* Mejoras de accesibilidad */
    .datepicker-input:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Estilos específicos para el selector de fecha nativo */
    .datepicker-input::-webkit-calendar-picker-indicator {
      background: transparent;
      color: #d1d5db;
      cursor: pointer;
      filter: invert(1) brightness(1.2);
      width: 20px;
      height: 20px;
      margin-right: 4px;
    }

    .datepicker-input::-webkit-calendar-picker-indicator:hover {
      filter: invert(0.8) brightness(1.4);
      transform: scale(1.1);
    }

    /* Para Firefox */
    .datepicker-input::-moz-calendar-picker-indicator {
      background: transparent;
      color: #d1d5db;
      cursor: pointer;
      filter: invert(1) brightness(1.2);
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

  inputControl = new FormControl<string | null>(null);

  // ControlValueAccessor implementation
  onChange: (value: string | null) => void = () => {
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

  writeValue(value: string | null): void {
    this.inputControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: string | null) => void): void {
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
