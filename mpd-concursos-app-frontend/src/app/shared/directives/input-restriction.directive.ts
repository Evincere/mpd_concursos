import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  Optional,
  Self
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  InputRestrictionService,
  InputRestrictionType,
  InputRestrictionConfig
} from '../services/input-restriction.service';

/**
 * Directiva para restringir la entrada de caracteres en campos de formulario
 *
 * Uso:
 * <input appInputRestriction="name" placeholder="Nombre">
 * <input [appInputRestriction]="restrictionConfig" placeholder="Campo personalizado">
 */
@Directive({
  selector: '[appInputRestriction]',
  standalone: true
})
export class InputRestrictionDirective implements OnInit, OnDestroy {

  @Input('appInputRestriction')
  set restrictionType(value: InputRestrictionType | InputRestrictionConfig | string) {
    if (typeof value === 'string') {
      this.config = this.restrictionService.getDefaultConfig(value as InputRestrictionType);
    } else if (typeof value === 'object') {
      this.config = value as InputRestrictionConfig;
    } else {
      this.config = this.restrictionService.getDefaultConfig(value as InputRestrictionType);
    }
    this.updateInputAttributes();
  }

  @Input() maxLength?: number;
  @Input() allowPaste: boolean = true;
  @Input() showFeedback: boolean = true;
  @Input() fieldName: string = 'campo';

  private config!: InputRestrictionConfig;
  private destroy$ = new Subject<void>();
  private feedbackElement?: HTMLElement;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2,
    private restrictionService: InputRestrictionService,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      console.warn('InputRestrictionDirective: No se especificó tipo de restricción');
      return;
    }

    // Aplicar configuración personalizada
    if (this.maxLength) {
      this.config.maxLength = this.maxLength;
    }
    if (this.allowPaste !== undefined) {
      this.config.allowPaste = this.allowPaste;
    }
    if (this.showFeedback !== undefined) {
      this.config.showFeedback = this.showFeedback;
    }

    this.updateInputAttributes();
    this.setupFormControlListener();

    if (this.config.showFeedback) {
      this.createFeedbackElement();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeFeedbackElement();
  }

  /**
   * Maneja eventos de teclado para prevenir caracteres no válidos
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.config.preventInvalidChars) return;

    if (!this.restrictionService.shouldAllowKeyEvent(event, this.config)) {
      event.preventDefault();
      this.showInvalidCharacterFeedback();
    }
  }

  /**
   * Maneja eventos de entrada para validar el contenido
   */
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const filteredValue = this.restrictionService.filterString(originalValue, this.config);

    if (originalValue !== filteredValue) {
      input.value = filteredValue;

      // Actualizar el FormControl si existe
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(filteredValue, { emitEvent: false });
      }

      this.showInvalidCharacterFeedback();
    }
  }

  /**
   * Maneja eventos de pegado para filtrar contenido
   */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.config.allowPaste) {
      event.preventDefault();
      this.showPasteNotAllowedFeedback();
      return;
    }

    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') || '';
    const input = this.el.nativeElement;
    const currentValue = input.value;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;

    // Construir el nuevo valor
    const newValue = currentValue.substring(0, selectionStart) +
                    pastedText +
                    currentValue.substring(selectionEnd);

    // Filtrar el nuevo valor
    const filteredValue = this.restrictionService.filterString(newValue, this.config);

    input.value = filteredValue;

    // Actualizar el FormControl si existe
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(filteredValue);
    }

    // Posicionar el cursor
    const newCursorPosition = selectionStart + this.restrictionService.processPastedText(pastedText, this.config).length;
    input.setSelectionRange(newCursorPosition, newCursorPosition);

    if (pastedText !== this.restrictionService.processPastedText(pastedText, this.config)) {
      this.showInvalidCharacterFeedback();
    }
  }

  /**
   * Maneja eventos de arrastrar y soltar
   */
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();

    const droppedText = event.dataTransfer?.getData('text') || '';
    const filteredText = this.restrictionService.processPastedText(droppedText, this.config);

    const input = this.el.nativeElement;
    input.value = filteredText;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(filteredText);
    }

    if (droppedText !== filteredText) {
      this.showInvalidCharacterFeedback();
    }
  }

  /**
   * Actualiza atributos del input basado en la configuración
   */
  private updateInputAttributes(): void {
    if (!this.config) return;

    const input = this.el.nativeElement;

    // Establecer longitud máxima
    if (this.config.maxLength) {
      this.renderer.setAttribute(input, 'maxlength', this.config.maxLength.toString());
    }

    // Agregar clases CSS para estilos
    this.renderer.addClass(input, 'input-restricted');
    this.renderer.addClass(input, `input-restricted-${this.config.type}`);

    // Establecer atributos de accesibilidad
    const description = this.restrictionService.getAllowedCharsDescription(this.config.type);
    this.renderer.setAttribute(input, 'aria-describedby', `${input.id || 'input'}-restriction-help`);
    this.renderer.setAttribute(input, 'data-restriction-type', this.config.type);
    this.renderer.setAttribute(input, 'data-allowed-chars', description);
  }

  /**
   * Configura listener para cambios en el FormControl
   */
  private setupFormControlListener(): void {
    if (this.ngControl?.control) {
      this.ngControl.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          if (value && !this.restrictionService.isStringValid(value, this.config)) {
            const filteredValue = this.restrictionService.filterString(value, this.config);
            this.ngControl.control?.setValue(filteredValue, { emitEvent: false });
          }
        });
    }
  }

  /**
   * Crea elemento de feedback para mostrar información al usuario
   */
  private createFeedbackElement(): void {
    const input = this.el.nativeElement;
    const parent = input.parentElement;

    if (!parent) return;

    this.feedbackElement = this.renderer.createElement('div');
    this.renderer.addClass(this.feedbackElement, 'input-restriction-feedback');
    this.renderer.setAttribute(this.feedbackElement, 'id', `${input.id || 'input'}-restriction-help`);
    this.renderer.setAttribute(this.feedbackElement, 'role', 'status');
    this.renderer.setAttribute(this.feedbackElement, 'aria-live', 'polite');

    const description = this.restrictionService.getFieldDescription(this.config.type);
    this.renderer.setProperty(this.feedbackElement, 'textContent', description);

    this.renderer.insertBefore(parent, this.feedbackElement, input.nextSibling);
  }

  /**
   * Elimina elemento de feedback
   */
  private removeFeedbackElement(): void {
    if (this.feedbackElement && this.feedbackElement.parentNode) {
      this.renderer.removeChild(this.feedbackElement.parentNode, this.feedbackElement);
    }
  }

  /**
   * Muestra feedback cuando se intenta ingresar un carácter no válido
   */
  private showInvalidCharacterFeedback(): void {
    if (!this.config.showFeedback || !this.feedbackElement) return;

    const errorMessage = this.restrictionService.getErrorMessage(this.config.type, this.fieldName);

    this.renderer.setProperty(this.feedbackElement, 'textContent', errorMessage);
    this.renderer.addClass(this.feedbackElement, 'error');

    // Remover clase de error después de 3 segundos
    setTimeout(() => {
      if (this.feedbackElement) {
        this.renderer.removeClass(this.feedbackElement, 'error');
        const description = this.restrictionService.getFieldDescription(this.config.type);
        this.renderer.setProperty(this.feedbackElement, 'textContent', description);
      }
    }, 3000);
  }

  /**
   * Muestra feedback cuando no se permite pegar
   */
  private showPasteNotAllowedFeedback(): void {
    if (!this.config.showFeedback || !this.feedbackElement) return;

    this.renderer.setProperty(this.feedbackElement, 'textContent',
      'No se permite pegar texto en este campo');
    this.renderer.addClass(this.feedbackElement, 'warning');

    setTimeout(() => {
      if (this.feedbackElement) {
        this.renderer.removeClass(this.feedbackElement, 'warning');
        const description = this.restrictionService.getFieldDescription(this.config.type);
        this.renderer.setProperty(this.feedbackElement, 'textContent', description);
      }
    }, 3000);
  }
}
