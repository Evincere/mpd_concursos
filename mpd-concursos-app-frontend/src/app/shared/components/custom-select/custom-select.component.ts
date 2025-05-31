import { Component, EventEmitter, HostListener, Input, OnInit, Output, forwardRef, ElementRef } from   '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="custom-select-container" [class.disabled]="disabled">
      <div
        class="select-header"
        (click)="toggleDropdown()"
        role="combobox"
        [attr.aria-expanded]="isOpen"
        [attr.aria-label]="placeholder"
        [attr.aria-disabled]="disabled"
        [attr.aria-controls]="getDropdownId()"
        tabindex="0"
        (keydown.enter)="toggleDropdown()"
        (keydown.space)="toggleDropdown()"
        (keydown.arrowdown)="openDropdown()">
        <span class="selected-value">{{ selectedLabel || placeholder }}</span>
        <span class="select-arrow" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      <div
        class="select-dropdown"
        *ngIf="isOpen"
        role="listbox"
        [attr.id]="getDropdownId()"
        [attr.aria-label]="placeholder + ' opciones'">
        <div class="select-option"
             *ngFor="let option of options; let i = index"
             [class.selected]="option.value === selectedValue"
             (click)="selectOption(option)"
             role="option"
             [attr.aria-selected]="option.value === selectedValue"
             [attr.id]="'option-' + i"
             tabindex="0"
             (keydown.enter)="selectOption(option)"
             (keydown.space)="selectOption(option)">
          {{ option.label }}
        </div>
        <div class="no-options" *ngIf="options.length === 0" role="alert">
          No hay opciones disponibles
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-select-container {
      position: relative;
      width: 100%;
      font-family: inherit;
    }

    .select-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background-color: #2d2d2d;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      height: 52px;
      box-sizing: border-box;
    }

    .select-header:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .select-header:focus, .select-header:active {
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .selected-value {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .select-arrow {
      display: flex;
      align-items: center;
      margin-left: 8px;
      color: rgba(255, 255, 255, 0.5);
      transition: transform 0.3s ease;
    }

    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      background-color: #2d2d2d;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      margin-top: 4px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .select-option {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      color: white;
    }

    .select-option:hover, .select-option.selected {
      background-color: rgba(63, 81, 181, 0.1);
    }

    .select-option.selected {
      font-weight: 500;
      color: #1976d2;
    }

    .no-options {
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
      text-align: center;
    }

    .disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .disabled .select-header {
      cursor: not-allowed;
      background-color: rgba(45, 45, 45, 0.7);
    }
  `]
})
export class CustomSelectComponent implements OnInit, ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Seleccionar';
  @Input() disabled = false;
  @Input() selectedValue = '';
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  selectedLabel = '';

  // Funciones requeridas para ControlValueAccessor
  private onChange: (value: string) => void = () => {
    // Este método será reemplazado por el framework cuando se registre el control
  };
  private onTouched: () => void = () => {
    // Este método será reemplazado por el framework cuando se registre el control
  };

  constructor(
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.updateSelectedLabel();
  }

  // Implementación de ControlValueAccessor
  writeValue(value: string): void {
    this.selectedValue = value;
    this.updateSelectedLabel();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.onTouched();
    }
  }

  openDropdown(): void {
    if (!this.disabled && !this.isOpen) {
      this.isOpen = true;
      this.onTouched();
    }
  }

  selectOption(option: SelectOption): void {
    this.selectedValue = option.value;
    this.selectedLabel = option.label;
    this.isOpen = false;
    this.selectionChange.emit(option.value);

    // Notificar a Angular sobre el cambio de valor
    this.onChange(option.value);
    this.onTouched();
  }

  updateSelectedLabel(): void {
    if (this.selectedValue) {
      const selectedOption = this.options.find(option => option.value === this.selectedValue);
      if (selectedOption) {
        this.selectedLabel = selectedOption.label;
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.elementRef && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  /**
   * Genera un ID para el dropdown basado en el placeholder
   */
  getDropdownId(): string {
    const base = this.placeholder ? this.placeholder.toLowerCase().replace(/\s+/g, '-') : 'select';
    return `dropdown-${base}`;
  }
}
