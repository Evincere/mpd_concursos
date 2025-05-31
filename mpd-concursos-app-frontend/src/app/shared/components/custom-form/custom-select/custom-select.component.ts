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
        <div class="select-value">
          {{ selectedLabel || placeholder }}
        </div>

        <div class="select-arrow">
          <i class="fas" [class.fa-chevron-down]="!isOpen" [class.fa-chevron-up]="isOpen" aria-hidden="true"></i>
        </div>
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
    .custom-select {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      width: 100%;
      position: relative;
    }

    .select-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #333);
    }

    .select-label.required::after {
      content: "*";
      color: var(--color-error, #f44336);
      margin-left: 0.25rem;
    }

    .select-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--color-text-primary, #333);
      background-color: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .select-container:hover:not(.disabled) {
      border-color: var(--color-primary, #3f51b5);
    }

    .select-value {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .select-arrow {
      margin-left: 0.5rem;
      color: var(--color-text-secondary, #666);
      transition: transform 0.2s ease-in-out;
    }

    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      margin-top: 0.25rem;
      background-color: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
    }

    .select-option {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s ease-in-out;
    }

    .select-option:hover:not(.disabled) {
      background-color: var(--color-background-hover, #f5f5f5);
    }

    .select-option.selected {
      background-color: var(--color-primary-light, #e8eaf6);
      color: var(--color-primary, #3f51b5);
      font-weight: 500;
    }

    .select-option.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .select-no-options {
      padding: 0.75rem 1rem;
      color: var(--color-text-secondary, #666);
      font-style: italic;
      text-align: center;
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

    .has-error .select-container {
      border-color: var(--color-error, #f44336);
    }

    .focused .select-container {
      border-color: var(--color-primary, #3f51b5);
      box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
    }

    .disabled .select-container {
      background-color: var(--color-background-disabled, #f5f5f5);
      cursor: not-allowed;
      opacity: 0.7;
    }

    /* Estilos para tema oscuro */
    @media (prefers-color-scheme: dark) {
      .select-label {
        color: var(--color-text-primary-dark, #e0e0e0);
      }

      .select-container {
        color: var(--color-text-primary-dark, #e0e0e0);
        background-color: var(--color-surface-dark, #333);
        border-color: var(--color-border-dark, #555);
      }

      .select-container:hover:not(.disabled) {
        border-color: var(--color-primary-dark, #7986cb);
      }

      .select-arrow {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .select-dropdown {
        background-color: var(--color-surface-dark, #333);
        border-color: var(--color-border-dark, #555);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .select-option:hover:not(.disabled) {
        background-color: var(--color-background-hover-dark, #444);
      }

      .select-option.selected {
        background-color: var(--color-primary-dark-light, #3f51b5);
        color: var(--color-primary-dark, #7986cb);
      }

      .select-no-options {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .hint-text {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .focused .select-container {
        border-color: var(--color-primary-dark, #7986cb);
        box-shadow: 0 0 0 2px rgba(121, 134, 203, 0.2);
      }

      .disabled .select-container {
        background-color: var(--color-background-disabled-dark, #444);
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
