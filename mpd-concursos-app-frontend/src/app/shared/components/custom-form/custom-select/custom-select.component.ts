import { Component, Input, OnInit, Optional, Self, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number | boolean | null;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="custom-select" [class.has-error]="showError" [class.focused]="isFocused" [class.disabled]="isDisabled">
      <label *ngIf="label" class="select-label" [class.required]="required" [attr.for]="getSelectId()">
        {{ label }}
      </label>

      <div class="select-container"
           (click)="toggleDropdown()"
           (keydown.enter)="toggleDropdown()"
           (keydown.space)="toggleDropdown()"
           (keydown.arrowdown)="openDropdown()"
           tabindex="0"
           role="combobox"
           [attr.aria-expanded]="isOpen"
           [attr.aria-label]="label || 'Seleccionar'"
           [attr.aria-required]="required"
           [attr.aria-invalid]="showError"
           [attr.aria-describedby]="getAriaDescribedBy()"
           [attr.id]="getSelectId()"
           [attr.aria-controls]="getDropdownId()">
        <span class="select-value" [class.placeholder]="!selectedLabel">
          {{ selectedLabel || placeholder }}
        </span>

        <i class="fas fa-chevron-down select-arrow" [class.open]="isOpen" aria-hidden="true"></i>
      </div>

      <div class="select-dropdown" *ngIf="isOpen" #dropdown role="listbox" [attr.id]="getDropdownId()" [attr.aria-label]="(label || 'Seleccionar') + ' opciones'">
        <div
          *ngFor="let option of options; let i = index"
          class="select-option"
          [class.selected]="option.value === value"
          [class.disabled]="option.disabled"
          (click)="selectOption(option)"
          (keydown.enter)="selectOption(option)"
          (keydown.space)="selectOption(option)"
          tabindex="0"
          role="option"
          [attr.id]="getOptionId(i)"
          [attr.aria-selected]="option.value === value"
          [attr.aria-disabled]="option.disabled"
        >
          {{ option.label }}
        </div>

        <div *ngIf="options.length === 0" class="select-no-options" role="alert">
          No hay opciones disponibles
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
    /* ===== GLASSMORPHISM DESIGN SYSTEM FOR CUSTOM SELECT ===== */
    .custom-select {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      width: 100%;
      position: relative;
      font-family: inherit;
    }

    .select-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #d1d5db;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .select-label.required::after {
      content: "*";
      color: #ef4444;
      margin-left: 0.25rem;
    }

    .select-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #f9fafb;

      /* Premium glassmorphism background */
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.4) 0%,
        rgba(55, 65, 81, 0.6) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .select-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.05),
        transparent);
      transition: left 0.6s ease;
    }

    .select-container:hover:not(.disabled) {
      border-color: rgba(255, 255, 255, 0.2);
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.5) 0%,
        rgba(55, 65, 81, 0.7) 100%);
      transform: translateY(-1px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .select-container:hover:not(.disabled)::before {
      left: 100%;
    }

    .select-value {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #f9fafb;
      font-weight: 400;
    }

    .select-value.placeholder {
      color: #9ca3af;
      font-style: italic;
    }

    .select-arrow {
      margin-left: 0.5rem;
      color: #d1d5db;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.875rem;
    }

    .select-arrow.open {
      transform: rotate(180deg);
      color: #3b82f6;
    }

    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      margin-top: 0.25rem;

      /* Enhanced glassmorphism for dropdown */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.95) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 6px;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.25),
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      max-height: 200px;
      overflow-y: auto;

      /* Custom scrollbar */
      scrollbar-width: thin;
      scrollbar-color: rgba(59, 130, 246, 0.6) rgba(55, 65, 81, 0.3);
    }

    .select-dropdown::-webkit-scrollbar {
      width: 6px;
    }

    .select-dropdown::-webkit-scrollbar-track {
      background: rgba(55, 65, 81, 0.3);
      border-radius: 3px;
    }

    .select-dropdown::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.6) 0%,
        rgba(59, 130, 246, 0.8) 100%);
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .select-dropdown::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.8) 0%,
        #3b82f6 100%);
    }

    .select-option {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #f9fafb;
      font-size: 0.875rem;
      border-radius: 4px;
      margin: 2px;
      position: relative;
      overflow: hidden;
    }

    .select-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(59, 130, 246, 0.1),
        transparent);
      transition: left 0.4s ease;
    }

    .select-option:hover:not(.disabled) {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.15) 0%,
        rgba(59, 130, 246, 0.1) 100%);
      color: #f9fafb;
      transform: translateX(2px);
      border-left: 2px solid #3b82f6;
    }

    .select-option:hover:not(.disabled)::before {
      left: 100%;
    }

    .select-option.selected {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.25) 0%,
        rgba(59, 130, 246, 0.15) 100%);
      color: #f9fafb;
      font-weight: 600;
      border-left: 3px solid #3b82f6;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .select-option.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: #6b7280;
    }

    .select-no-options {
      padding: 0.75rem 1rem;
      color: #9ca3af;
      font-style: italic;
      text-align: center;
      font-size: 0.875rem;
    }

    .error-message {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .hint-text {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .has-error .select-container {
      border-color: #ef4444;
      box-shadow:
        0 2px 8px rgba(239, 68, 68, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .has-error .select-label {
      color: #ef4444;
    }

    .focused .select-container {
      border-color: #3b82f6;
      box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .focused .select-arrow {
      color: #3b82f6;
    }

    .disabled .select-container {
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.2) 0%,
        rgba(55, 65, 81, 0.3) 100%);
      cursor: not-allowed;
      opacity: 0.6;
      border-color: rgba(255, 255, 255, 0.05);
    }

    .disabled .select-label {
      color: #6b7280;
    }

    .disabled .select-value {
      color: #6b7280;
    }

    .disabled .select-arrow {
      color: #6b7280;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .select-container {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
      }

      .select-dropdown {
        max-height: 150px;
      }

      .select-option {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
      }
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .select-container,
      .select-option,
      .select-arrow {
        transition: none;
      }

      .select-container::before,
      .select-option::before {
        display: none;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .select-container {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .select-option.selected {
        border-left-width: 4px;
        font-weight: 700;
      }

      .error-message {
        font-weight: 600;
      }
    }
  `]
})
export class CustomSelectComponent implements OnInit, ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Seleccionar';
  @Input() options: SelectOption[] = [];
  @Input() required = false;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() control: FormControl | null = null;

  @ViewChild('dropdown') dropdown!: ElementRef;

  value: unknown = null;
  isOpen = false;
  isFocused = false;
  isDisabled = false;
  showError = false;


  get selectedLabel(): string {
    const selected = this.options.find(option => option.value === this.value);
    return selected ? selected.label : '';
  }

  private onChange: (value: unknown) => void = () => {
    // Este método será reemplazado por el framework
  };
  private onTouched: () => void = () => {
    // Este método será reemplazado por el framework
  };

  constructor(
    private elementRef: ElementRef,
    @Optional() @Self() public ngControl: NgControl
  ) {
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

  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  toggleDropdown(): void {
    if (this.isDisabled) return;

    this.isOpen = !this.isOpen;
    this.isFocused = this.isOpen;

    if (this.isOpen) {
      this.onTouched();
    }
  }

  openDropdown(): void {
    if (this.isDisabled || this.isOpen) return;

    this.isOpen = true;
    this.isFocused = true;
    this.onTouched();
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    this.value = option.value;
    this.onChange(this.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.elementRef && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.isFocused = false;
    }
  }

  /**
   * Maneja la navegación por teclado dentro del dropdown
   * @param event Evento de teclado
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled) return;

    // Si el dropdown está cerrado, solo procesamos teclas que lo abren
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.openDropdown();
        event.preventDefault();
      }
      return;
    }

    // Si el dropdown está abierto, manejamos la navegación
    switch (event.key) {
      case 'Escape':
        this.isOpen = false;
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.navigateOptions(1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.navigateOptions(-1);
        event.preventDefault();
        break;
      case 'Home':
        this.navigateToFirstOption();
        event.preventDefault();
        break;
      case 'End':
        this.navigateToLastOption();
        event.preventDefault();
        break;
    }
  }

  /**
   * Navega entre las opciones del dropdown
   * @param direction Dirección de navegación (1 para abajo, -1 para arriba)
   */
  private navigateOptions(direction: number): void {
    if (!this.dropdown || this.options.length === 0) return;

    const options = this.dropdown.nativeElement.querySelectorAll('.select-option:not(.disabled)');
    if (options.length === 0) return;

    // Encontrar el índice de la opción seleccionada actualmente
    let currentIndex = -1;
    for (let i = 0; i < options.length; i++) {
      if (options[i].classList.contains('selected')) {
        currentIndex = i;
        break;
      }
    }

    // Calcular el nuevo índice
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;

    // Enfocar la nueva opción
    (options[newIndex] as HTMLElement).focus();
  }

  /**
   * Navega a la primera opción del dropdown
   */
  private navigateToFirstOption(): void {
    if (!this.dropdown) return;

    const firstOption = this.dropdown.nativeElement.querySelector('.select-option:not(.disabled)') as HTMLElement;
    if (firstOption) {
      firstOption.focus();
    }
  }

  /**
   * Navega a la última opción del dropdown
   */
  private navigateToLastOption(): void {
    if (!this.dropdown) return;

    const options = this.dropdown.nativeElement.querySelectorAll('.select-option:not(.disabled)');
    if (options.length > 0) {
      (options[options.length - 1] as HTMLElement).focus();
    }
  }

  /**
   * Genera un ID para el elemento select basado en la etiqueta
   */
  getSelectId(): string {
    if (!this.label) return 'select-field';
    return 'select-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera un ID para el dropdown basado en la etiqueta
   */
  getDropdownId(): string {
    if (!this.label) return 'dropdown-field';
    return 'dropdown-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera un ID para la opción basado en el índice y la etiqueta
   */
  getOptionId(index: number): string {
    if (!this.label) return `option-${index}`;
    return `option-${index}-${this.label.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Genera un ID para el mensaje de error basado en la etiqueta
   */
  getErrorId(): string {
    if (!this.label) return 'error-select-field';
    return 'error-select-' + this.label.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Genera un ID para el texto de ayuda basado en la etiqueta
   */
  getHintId(): string {
    if (!this.label) return 'hint-select-field';
    return 'hint-select-' + this.label.toLowerCase().replace(/\s+/g, '-');
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
