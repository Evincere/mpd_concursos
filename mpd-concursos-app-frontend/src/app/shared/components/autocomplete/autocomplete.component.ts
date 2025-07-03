import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  forwardRef,
  HostListener
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

/**
 * Interfaz para elementos del autocomplete
 */
export interface AutocompleteItem {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Configuración del autocomplete
 */
export interface AutocompleteConfig {
  placeholder?: string;
  maxResults?: number;
  minQueryLength?: number;
  debounceTime?: number;
  showAllOnFocus?: boolean;
  clearOnSelect?: boolean;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Componente autocomplete reutilizable sin dependencias de Material Design
 * Implementa ControlValueAccessor para integración con Angular Forms
 */
@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input() config: AutocompleteConfig = {};
  @Input() searchFunction!: (query: string) => Observable<AutocompleteItem[]>;
  @Input() displayFunction: (item: AutocompleteItem) => string = (item) => item.name;
  @Input() fieldName: string = 'campo';
  @Input() errorMessage: string = '';
  @Input() showError: boolean = false;

  @Output() itemSelected = new EventEmitter<AutocompleteItem>();
  @Output() queryChanged = new EventEmitter<string>();
  @Output() focusChanged = new EventEmitter<boolean>();

  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownElement') dropdownElement!: ElementRef<HTMLDivElement>;

  // Estado del componente
  query: string = '';
  items: AutocompleteItem[] = [];
  selectedItem: AutocompleteItem | null = null;
  isOpen: boolean = false;
  isLoading: boolean = false;
  highlightedIndex: number = -1;

  // Control de formulario
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private disabled: boolean = false;

  // Subjects para manejo de eventos
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Configuración por defecto
  private defaultConfig: AutocompleteConfig = {
    placeholder: 'Buscar...',
    maxResults: 10,
    minQueryLength: 2,
    debounceTime: 300,
    showAllOnFocus: false,
    clearOnSelect: false,
    disabled: false,
    required: false
  };

  ngOnInit(): void {
    // Combinar configuración por defecto con la proporcionada
    this.config = { ...this.defaultConfig, ...this.config };

    // Configurar búsqueda con debounce
    this.searchSubject
      .pipe(
        debounceTime(this.config.debounceTime!),
        distinctUntilChanged(),
        switchMap(query => this.performSearch(query)),
        takeUntil(this.destroy$)
      )
      .subscribe(items => {
        this.items = items;
        this.isLoading = false;
        this.highlightedIndex = -1;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Implementación de ControlValueAccessor
  writeValue(value: any): void {
    if (value && typeof value === 'object' && value.name) {
      this.selectedItem = value;
      this.query = this.displayFunction(value);
    } else if (typeof value === 'string') {
      this.query = value;
      this.selectedItem = null;
    } else {
      this.query = '';
      this.selectedItem = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.config.disabled = isDisabled;
  }

  /**
   * Maneja el evento de entrada de texto
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query = target.value;
    this.selectedItem = null;

    this.queryChanged.emit(this.query);
    this.onChange(this.query);

    if (this.query.length >= this.config.minQueryLength!) {
      this.isLoading = true;
      this.searchSubject.next(this.query);
      this.openDropdown();
    } else {
      this.items = [];
      this.closeDropdown();
    }
  }

  /**
   * Maneja el evento de foco
   */
  onFocus(): void {
    this.onTouched();
    this.focusChanged.emit(true);

    if (this.config.showAllOnFocus && this.query.length === 0) {
      this.isLoading = true;
      this.searchSubject.next('');
      this.openDropdown();
    } else if (this.items.length > 0) {
      this.openDropdown();
    }
  }

  /**
   * Maneja el evento de pérdida de foco
   */
  onBlur(): void {
    // Delay para permitir clicks en el dropdown
    setTimeout(() => {
      this.closeDropdown();
      this.focusChanged.emit(false);
    }, 150);
  }

  /**
   * Maneja eventos de teclado
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.openDropdown();
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        this.highlightNext();
        event.preventDefault();
        break;

      case 'ArrowUp':
        this.highlightPrevious();
        event.preventDefault();
        break;

      case 'Enter':
        if (this.highlightedIndex >= 0 && this.items[this.highlightedIndex]) {
          this.selectItem(this.items[this.highlightedIndex]);
        }
        event.preventDefault();
        break;

      case 'Escape':
        this.closeDropdown();
        event.preventDefault();
        break;
    }
  }

  /**
   * Selecciona un elemento
   */
  selectItem(item: AutocompleteItem): void {
    this.selectedItem = item;
    this.query = this.config.clearOnSelect ? '' : this.displayFunction(item);

    this.itemSelected.emit(item);
    this.onChange(item);

    this.closeDropdown();
    this.inputElement.nativeElement.focus();
  }

  /**
   * Resalta el siguiente elemento
   */
  private highlightNext(): void {
    if (this.highlightedIndex < this.items.length - 1) {
      this.highlightedIndex++;
      this.scrollToHighlighted();
    }
  }

  /**
   * Resalta el elemento anterior
   */
  private highlightPrevious(): void {
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
      this.scrollToHighlighted();
    }
  }

  /**
   * Hace scroll al elemento resaltado
   */
  private scrollToHighlighted(): void {
    if (this.dropdownElement && this.highlightedIndex >= 0) {
      const highlightedElement = this.dropdownElement.nativeElement
        .children[this.highlightedIndex] as HTMLElement;

      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }

  /**
   * Abre el dropdown
   */
  private openDropdown(): void {
    if (!this.disabled && !this.isOpen) {
      this.isOpen = true;
    }
  }

  /**
   * Cierra el dropdown
   */
  private closeDropdown(): void {
    this.isOpen = false;
    this.highlightedIndex = -1;
    this.isLoading = false;
  }

  /**
   * Realiza la búsqueda
   */
  private performSearch(query: string): Observable<AutocompleteItem[]> {
    if (!this.searchFunction) {
      return of([]);
    }

    return this.searchFunction(query);
  }

  /**
   * Resalta el texto coincidente en el resultado
   */
  highlightMatch(text: string, query: string): string {
    if (!query || query.length < 2) {
      return text;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Limpia el campo
   */
  clear(): void {
    this.query = '';
    this.selectedItem = null;
    this.items = [];
    this.closeDropdown();
    this.onChange('');
    this.queryChanged.emit('');
    this.inputElement.nativeElement.focus();
  }

  /**
   * Verifica si el campo está vacío
   */
  get isEmpty(): boolean {
    return !this.query || this.query.trim().length === 0;
  }

  /**
   * Verifica si hay elementos para mostrar
   */
  get hasItems(): boolean {
    return this.items && this.items.length > 0;
  }

  /**
   * Función de tracking para ngFor (optimización de performance)
   */
  trackByFunction = (index: number, item: AutocompleteItem): string => {
    return item.id || index.toString();
  };

  // Listener global para cerrar dropdown al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isInsideComponent = this.inputElement.nativeElement.contains(target) ||
      (this.dropdownElement && this.dropdownElement.nativeElement.contains(target));

    if (!isInsideComponent) {
      this.closeDropdown();
    }
  }
}
