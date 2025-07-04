import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterService } from '../../../../core/services/auth/register.service';
import { NewUser } from '../../../../shared/interfaces/auth/new-user.interface';
import { UserRegisterDTO } from '../../../../shared/interfaces/user/base-user.interface';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TouchFriendlyDirective } from '../../../../shared/directives/touch-friendly.directive';
import { InputRestrictionDirective } from '../../../../shared/directives/input-restriction.directive';
import { ErrorMappingService, MappedError, ErrorType, ErrorSeverity, FieldError, ValidationStatus } from '../../../../shared/services/error-mapping';
import { HttpErrorDisplayComponent } from '../../../../shared/components/http-error-display';
import { ValidationService } from '../../../../shared/services/validation.service';
import { LocationSelectorComponent, LocationValue } from '../../../../shared/components/location-selector/location-selector.component';
import { ErrorContextPanelComponent } from '../../../../shared/components/error-context-panel/error-context-panel.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    TouchFriendlyDirective,
    InputRestrictionDirective,
    LocationSelectorComponent,
    HttpErrorDisplayComponent,
    ErrorContextPanelComponent
  ],
  animations: [
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild(ErrorContextPanelComponent, { static: false }) errorContextPanel!: ErrorContextPanelComponent;

  registerForm: FormGroup;
  fieldErrors = new Map<string, string>();

  // Sistema unificado de manejo de errores HTTP con glassmorphism
  httpError: MappedError | null = null;
  showHttpError = false;

  // Sistema de Error Context Panel
  showErrorContextPanel = false;
  currentFieldError: FieldError | null = null;
  currentTargetElement: HTMLElement | null = null;

  isLoading = false;
  showMessage = false;
  isSuccess = false;
  responseMessage = '';
  private subscription = new Subscription();

  // Variable para controlar la visibilidad del modal de términos y condiciones
  showTermsModal = false;
  // Variable para controlar la visibilidad del indicador de scroll
  showScrollIndicator = false;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private snackBar: MatSnackBar,
    private errorMappingService: ErrorMappingService,
    private validationService: ValidationService
  ) {
    this.registerForm = fb.nonNullable.group({
      // Datos de acceso
      username: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(50),
        this.validationService.usernameCharacterValidator()
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.validationService.emailCharacterValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.validationService.passwordStrengthValidator()
      ]],
      confirmPassword: ['', Validators.required],

      // Datos personales
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.validationService.spanishNameValidator()
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.validationService.spanishNameValidator()
      ]],
      dni: ['', [
        Validators.required,
        this.validationService.dniCharacterValidator(),
        this.validationService.argentineDniValidator()
      ]],
      cuit: ['', [
        Validators.required,
        this.validationService.cuitFormatValidator()
      ]],
      birthDate: [null, [
        Validators.required,
        this.validationService.minAgeValidator(18)
      ]],

      // Datos de ubicación
      location: [null, Validators.required],
      legalAddress: ['', [Validators.required, Validators.maxLength(200)]],
      residentialAddress: ['', [Validators.required, Validators.maxLength(200)]],
      telefono: ['', [
        this.validationService.phoneCharacterValidator(),
        this.validationService.argentinePhoneValidator()
      ]],

      // Términos y condiciones
      termsAccepted: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Comprobar si el formulario necesita scroll después de una breve espera para permitir el renderizado
    setTimeout(() => this.checkFormOverflow(), 500);

    // Añadir listeners para eventos de scroll y redimensionamiento de ventana
    window.addEventListener('resize', this.checkFormOverflow.bind(this));

    // Mejorar el listener de scroll con un método debounced
    setTimeout(() => {
      const registerBox = document.querySelector('.register-box');
      if (registerBox) {
        registerBox.addEventListener('scroll', () => {
          // Utilizar el método checkFormOverflow para manejar tanto el scroll como el inicio
          this.checkFormOverflow();
        });
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();

    // Eliminar listeners para evitar memory leaks
    window.removeEventListener('resize', this.checkFormOverflow.bind(this));
    const registerBox = document.querySelector('.register-box');
    if (registerBox) {
      registerBox.removeEventListener('scroll', this.checkFormOverflow.bind(this));
    }
  }

  // Método para verificar si el contenido del formulario requiere scroll
  checkFormOverflow(): void {
    const registerBox = document.querySelector('.register-box');
    if (!registerBox) return;

    // Calcular la proporción del contenido visible vs. el contenido total
    const scrollHeight = registerBox.scrollHeight;
    const visibleHeight = registerBox.clientHeight;
    const scrollTop = registerBox.scrollTop;

    // Mostrar el indicador si hay contenido oculto abajo Y el usuario está cerca de la parte superior
    const hasHiddenContent = scrollHeight > visibleHeight + 50; // Añadimos un pequeño margen
    const isNearTop = scrollTop < 100; // Mostrar en la parte superior del formulario

    // Actualizar la visibilidad del indicador: mostrar cuando hay contenido oculto y estamos en la parte superior
    this.showScrollIndicator = hasHiddenContent && isNearTop;
  }

  // Método para hacer scroll al hacer clic en el indicador
  scrollToBottom(): void {
    const registerBox = document.querySelector('.register-box');
    if (registerBox) {
      // Calcular una posición razonable para desplazarse (un tercio del contenido)
      const scrollAmount = Math.min(300, (registerBox.scrollHeight - registerBox.clientHeight) / 2);

      // Usar scrollBy para un desplazamiento relativo más natural
      registerBox.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });

      // Esconder el indicador inmediatamente al hacer clic
      this.showScrollIndicator = false;
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { mismatch: true };
    }

    return null;
  }

  hasFieldError(field: string): boolean {
    return this.fieldErrors.has(field);
  }

  getFieldError(field: string): string {
    return this.fieldErrors.get(field) || '';
  }

  /**
   * Obtiene el estado de error de un campo específico
   */
  getFieldErrorStatus(field: string): ValidationStatus | null {
    if (!this.httpError?.fieldErrors) {
      return null;
    }

    const fieldError = this.httpError.fieldErrors.find(fe => fe.field === field);
    return fieldError?.status || null;
  }

  onInputFocus(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const fieldName = inputElement.getAttribute('formcontrolname');

    if (!fieldName) return;

    // Limpiar error específico del campo cuando el usuario empiece a escribir
    if (this.fieldErrors.has(fieldName)) {
      this.fieldErrors.delete(fieldName);
    }

    // Configurar validación en tiempo real para este campo
    this.setupRealTimeValidation(fieldName);
  }

  /**
   * Configura validación en tiempo real para un campo específico
   */
  private setupRealTimeValidation(fieldName: string): void {
    const control = this.registerForm.get(fieldName);
    if (!control) return;

    // Remover suscripciones anteriores para evitar duplicados
    const existingSubscription = (control as any)._realTimeValidationSub;
    if (existingSubscription) {
      existingSubscription.unsubscribe();
    }

    // Configurar nueva suscripción con debounce
    const subscription = control.valueChanges.pipe(
      debounceTime(500) // Esperar 500ms después del último cambio
    ).subscribe(() => {
      this.validateFieldRealTime(fieldName);
    });

    // Guardar referencia para poder limpiarla después
    (control as any)._realTimeValidationSub = subscription;
    this.subscription.add(subscription);
  }

  /**
   * Limpia los errores HTTP mostrados
   */
  clearHttpError(): void {
    this.httpError = null;
    this.showHttpError = false;
  }

  formatCuit(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    let formatted = '';
    if (value.length > 0) {
      formatted = value.slice(0, 2);
      if (value.length > 2) {
        formatted += '-' + value.slice(2, 10);
        if (value.length > 10) {
          formatted += '-' + value.slice(10);
        }
      }
    }

    input.value = formatted;
    this.registerForm.get('cuit')?.setValue(formatted);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    // Sanitizar el formulario antes de validar
    ValidationService.sanitizeFormGroup(this.registerForm);

    // Asegurarnos de que los términos sean marcados como tocados si no están aceptados
    this.ensureTermsFieldTouched();

    if (this.registerForm.invalid) {
      // Marcar todos los campos como tocados para mostrar los errores
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.fieldErrors.clear();
    this.clearHttpError();

    const formValue = this.registerForm.value;

    // Crear objeto con la nueva interfaz estandarizada y sanitizar
    const userRegisterData: UserRegisterDTO = ValidationService.sanitizeObject({
      username: formValue.username!,
      email: formValue.email!,
      password: formValue.password!,
      confirmPassword: formValue.confirmPassword!,
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      dni: formValue.dni!,
      cuit: formValue.cuit!.replace(/-/g, ''), // Eliminar guiones del CUIT
      birthDate: formValue.birthDate!,
      country: formValue.location?.country || 'Argentina',
      province: formValue.location?.province?.name || '',
      municipality: formValue.location?.municipality?.name || '',
      legalAddress: formValue.legalAddress!,
      residentialAddress: formValue.residentialAddress!,
      telefono: formValue.telefono!,
      termsAccepted: formValue.termsAccepted!
    });

    // Mantener compatibilidad con la interfaz anterior
    const userData: NewUser = {
      ...userRegisterData,
      roles: new Set<string>(['ROLE_USER'])
    };

    this.subscription.add(
      this.registerService.register(userData).subscribe({
        next: (_response: any) => {
          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = true;
          this.responseMessage = 'Registro exitoso! Redirigiendo al login...';

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 500);
        },
        error: (error: any) => {
          console.log('🔍 RegisterComponent - ERROR CALLBACK EJECUTADO');
          console.log('🔍 RegisterComponent - Constructor del error:', error?.constructor?.name);
          console.log('🔍 RegisterComponent - Prototipo del error:', Object.getPrototypeOf(error));
          console.log('🔍 RegisterComponent - Es HttpErrorResponse?', error instanceof HttpErrorResponse);
          console.log('🔍 RegisterComponent - Propiedades del error:', Object.keys(error || {}));

          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = false;

          // Verificar si es un HttpErrorResponse para usar el nuevo sistema
          console.log('🔍 RegisterComponent - Tipo de error recibido:');
          console.log('  - isHttpErrorResponse:', error instanceof HttpErrorResponse);
          console.log('  - errorType:', typeof error);
          console.log('  - error.status:', error?.status);
          console.log('  - error.error:', error?.error);
          console.log('  - error.message:', error?.message);
          console.log('  - error completo:', error);

          // FORZAR manejo como HttpErrorResponse si tiene las propiedades necesarias
          if (error instanceof HttpErrorResponse || (error?.status && error?.error)) {
            console.log('🔍 RegisterComponent - Llamando handleHttpError...');
            // Si no es HttpErrorResponse pero tiene las propiedades, crear uno
            const httpError = error instanceof HttpErrorResponse ? error : {
              status: error.status,
              error: error.error,
              message: error.message,
              url: error.url
            } as HttpErrorResponse;
            this.handleHttpError(httpError);
          } else if (error.error?.fieldErrors) {
            // Mantener compatibilidad con errores de campo existentes
            this.handleFieldErrors(error.error.fieldErrors);
            this.responseMessage = 'Error en el registro, verifique los datos ingresados.';
          } else {
            // Fallback para otros tipos de error - usar sistema unificado
            this.responseMessage = error.error?.message || 'Error en el servidor. Intente más tarde.';
            // Crear error HTTP genérico para mostrar con glassmorphism
            const genericError: MappedError = {
              type: ErrorType.SERVER,
              severity: ErrorSeverity.HIGH,
              message: this.responseMessage,
              title: 'Error del Servidor',
              recoverable: true,
              suggestions: ['Verifique su conexión a internet', 'Intente nuevamente en unos momentos']
            };
            this.httpError = genericError;
            this.showHttpError = true;
          }

          setTimeout(() => {
            this.showMessage = false;
          }, 3000);
        }
      })
    );
  }

  /**
   * Maneja errores HTTP usando el nuevo sistema de mapeo
   */
  handleHttpError(error: HttpErrorResponse): void {
    console.log('🔍 RegisterComponent - handleHttpError iniciado:', error);

    // Mapear el error HTTP a información específica
    this.httpError = this.errorMappingService.mapHttpError(error);
    this.showHttpError = true;

    console.log('🔍 RegisterComponent - httpError mapeado:', this.httpError);

    // Si el error tiene un campo específico, también agregarlo a fieldErrors para compatibilidad
    if (this.httpError.field) {
      this.fieldErrors.set(this.httpError.field, this.httpError.message);
      console.log('🔍 RegisterComponent - Campo específico agregado:', this.httpError.field);
    }

    // Si hay errores de campo múltiples, agregar todos a fieldErrors
    if (this.httpError.fieldErrors && this.httpError.fieldErrors.length > 0) {
      this.httpError.fieldErrors.forEach(fieldError => {
        this.fieldErrors.set(fieldError.field, fieldError.message);
        console.log('🔍 RegisterComponent - Campo múltiple agregado:', fieldError.field);
      });
    }

    // Configurar mensaje de respuesta para el sistema existente
    this.responseMessage = this.httpError.message;

    console.log('🔍 RegisterComponent - Programando scroll automático y panel contextual en 500ms...');

    // Navegación automática al primer campo con error después de un breve delay
    setTimeout(() => {
      console.log('🔍 RegisterComponent - Ejecutando scroll automático...');
      this.scrollToFirstErrorFieldWithContextPanel();
    }, 500);
  }

  /**
   * Hace scroll automático al primer campo con error y muestra el panel contextual
   */
  private scrollToFirstErrorFieldWithContextPanel(): void {
    console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Iniciando búsqueda de campo con error...');

    let firstErrorField: string | null = null;
    let firstFieldError: FieldError | null = null;

    // Buscar el primer campo con error
    if (this.httpError?.fieldErrors && this.httpError.fieldErrors.length > 0) {
      firstFieldError = this.httpError.fieldErrors[0];
      firstErrorField = firstFieldError.field;
      console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Campo encontrado en fieldErrors:', firstErrorField);
    } else if (this.httpError?.field) {
      firstErrorField = this.httpError.field;
      // Crear FieldError a partir del MappedError
      firstFieldError = {
        field: this.httpError.field,
        message: this.httpError.message,
        title: this.httpError.title,
        type: this.httpError.type,
        severity: this.httpError.severity,
        suggestions: this.httpError.suggestions,
        status: ValidationStatus.PENDING,
        critical: false
      };
      console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Campo encontrado en field:', firstErrorField);
    }

    console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Campo objetivo:', firstErrorField);

    if (firstErrorField && firstFieldError) {
      // Intentar múltiples selectores para encontrar el campo
      const selectors = [
        `[formcontrolname="${firstErrorField}"]`,
        `input[formcontrolname="${firstErrorField}"]`,
        `#${firstErrorField}`,
        `[name="${firstErrorField}"]`
      ];

      let fieldElement: HTMLElement | null = null;

      for (const selector of selectors) {
        fieldElement = document.querySelector(selector) as HTMLElement;
        console.log(`🔍 scrollToFirstErrorFieldWithContextPanel - Probando selector "${selector}":`, fieldElement);
        if (fieldElement) break;
      }

      if (fieldElement) {
        console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Elemento encontrado, iniciando scroll...');

        // Scroll suave al campo
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Focus en el campo y mostrar panel contextual después del scroll
        setTimeout(() => {
          console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Aplicando focus y mostrando panel contextual...');
          fieldElement.focus();

          // Agregar efecto visual temporal
          fieldElement.classList.add('field-highlight');

          // También resaltar el contenedor padre si existe
          const parentBox = fieldElement.closest('.user-box');
          if (parentBox) {
            parentBox.classList.add('field-highlight');
            console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Efecto aplicado al contenedor padre');
          }

          // Mostrar el panel contextual
          this.showErrorContextPanelForField(firstFieldError!, fieldElement);

          setTimeout(() => {
            fieldElement.classList.remove('field-highlight');
            if (parentBox) {
              parentBox.classList.remove('field-highlight');
            }
            console.log('🔍 scrollToFirstErrorFieldWithContextPanel - Efectos visuales removidos');
          }, 2000);
        }, 300);
      } else {
        console.error('🔍 scrollToFirstErrorFieldWithContextPanel - No se pudo encontrar el elemento del campo:', firstErrorField);
      }
    }
  }

  /**
   * Hace scroll automático al primer campo con error (método original mantenido para compatibilidad)
   */
  private scrollToFirstErrorField(): void {
    console.log('🔍 scrollToFirstErrorField - Iniciando búsqueda de campo con error...');

    let firstErrorField: string | null = null;

    // Buscar el primer campo con error
    if (this.httpError?.fieldErrors && this.httpError.fieldErrors.length > 0) {
      firstErrorField = this.httpError.fieldErrors[0].field;
      console.log('🔍 scrollToFirstErrorField - Campo encontrado en fieldErrors:', firstErrorField);
    } else if (this.httpError?.field) {
      firstErrorField = this.httpError.field;
      console.log('🔍 scrollToFirstErrorField - Campo encontrado en field:', firstErrorField);
    }

    console.log('🔍 scrollToFirstErrorField - Campo objetivo:', firstErrorField);

    if (firstErrorField) {
      // Intentar múltiples selectores para encontrar el campo
      const selectors = [
        `[formcontrolname="${firstErrorField}"]`,
        `input[formcontrolname="${firstErrorField}"]`,
        `#${firstErrorField}`,
        `[name="${firstErrorField}"]`
      ];

      let fieldElement: HTMLElement | null = null;

      for (const selector of selectors) {
        fieldElement = document.querySelector(selector) as HTMLElement;
        console.log(`🔍 scrollToFirstErrorField - Probando selector "${selector}":`, fieldElement);
        if (fieldElement) break;
      }

      if (fieldElement) {
        console.log('🔍 scrollToFirstErrorField - Elemento encontrado, iniciando scroll...');

        // Scroll suave al campo
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Focus en el campo después del scroll
        setTimeout(() => {
          console.log('🔍 scrollToFirstErrorField - Aplicando focus y efectos visuales...');
          fieldElement.focus();

          // Agregar efecto visual temporal
          fieldElement.classList.add('field-highlight');

          // También resaltar el contenedor padre si existe
          const parentBox = fieldElement.closest('.user-box');
          if (parentBox) {
            parentBox.classList.add('field-highlight');
            console.log('🔍 scrollToFirstErrorField - Efecto aplicado al contenedor padre');
          }

          setTimeout(() => {
            fieldElement.classList.remove('field-highlight');
            if (parentBox) {
              parentBox.classList.remove('field-highlight');
            }
            console.log('🔍 scrollToFirstErrorField - Efectos visuales removidos');
          }, 2000);
        }, 300);
      } else {
        console.error('🔍 scrollToFirstErrorField - No se pudo encontrar el elemento del campo:', firstErrorField);
        console.log('🔍 scrollToFirstErrorField - Elementos disponibles en el DOM:');
        document.querySelectorAll('[formcontrolname]').forEach((el, index) => {
          console.log(`  ${index}: formcontrolname="${el.getAttribute('formcontrolname')}"`, el);
        });
      }
    } else {
      console.log('🔍 scrollToFirstErrorField - No se encontró campo con error');
    }
  }

  handleFieldErrors(fieldErrors: { field: string; message: string }[]): void {
    fieldErrors.forEach(fieldError => {
      this.fieldErrors.set(fieldError.field, fieldError.message);
      // Los errores de campo se muestran inline en el formulario
      // No necesitamos crear errores adicionales para el sistema glassmorphism
    });
  }

  getErrorTitle(field: string): string {
    const titles: Record<string, string> = {
      username: 'Error en nombre de usuario',
      email: 'Error en correo electrónico',
      password: 'Error en contraseña',
      firstName: 'Error en nombre',
      lastName: 'Error en apellido',
      dni: 'Error en DNI',
      cuit: 'Error en CUIT',
      nombre: 'Error en nombre',
      apellido: 'Error en apellido',
      confirmPassword: 'Error en confirmación de contraseña',
      termsAccepted: 'Error en términos y condiciones'
    };

    return titles[field] || 'Error de Validación';
  }

  // Método para mostrar el modal con los términos y condiciones
  openTermsModal(): void {
    this.showTermsModal = true;
  }

  // Método para cerrar el modal
  closeTermsModal(): void {
    this.showTermsModal = false;
  }

  // Método para aceptar los términos y condiciones
  acceptTerms(): void {
    this.registerForm.get('termsAccepted')?.setValue(true);
    this.closeTermsModal();
  }

  /**
   * Maneja el evento de cierre del componente de error HTTP
   */
  onHttpErrorDismissed(): void {
    this.clearHttpError();
  }

  /**
   * Muestra el panel contextual para un campo específico
   */
  private showErrorContextPanelForField(fieldError: FieldError, targetElement: HTMLElement): void {
    console.log('🔍 showErrorContextPanelForField - Mostrando panel para campo:', fieldError.field);

    this.currentFieldError = fieldError;
    this.currentTargetElement = targetElement;
    this.showErrorContextPanel = true;

    // Si el componente está disponible, usar su método showForField
    if (this.errorContextPanel) {
      this.errorContextPanel.showForField(fieldError, targetElement);
    }
  }

  /**
   * Maneja el cierre del panel contextual
   */
  onErrorContextPanelClose(): void {
    console.log('🔍 onErrorContextPanelClose - Cerrando panel contextual');
    this.showErrorContextPanel = false;
    this.currentFieldError = null;
    this.currentTargetElement = null;
  }

  /**
   * Maneja el dismiss del panel contextual
   */
  onErrorContextPanelDismiss(): void {
    console.log('🔍 onErrorContextPanelDismiss - Dismissing panel contextual');
    this.onErrorContextPanelClose();
  }

  /**
   * Maneja el focus en campo desde el panel contextual
   */
  onErrorContextPanelFocusField(fieldName: string): void {
    console.log('🔍 onErrorContextPanelFocusField - Enfocando campo:', fieldName);

    const fieldElement = document.querySelector(`[formcontrolname="${fieldName}"]`) as HTMLElement;
    if (fieldElement) {
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        fieldElement.focus();
      }, 300);
    }
  }

  /**
   * Maneja el evento de acción del componente de error HTTP (ej: reintentar)
   */
  onHttpErrorAction(): void {
    // Limpiar el error y permitir al usuario intentar nuevamente
    this.clearHttpError();

    // Opcional: hacer scroll al primer campo con error
    if (this.httpError?.field) {
      const fieldElement = document.querySelector(`[formcontrolname="${this.httpError.field}"]`);
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (fieldElement as HTMLElement).focus();
      }
    }
  }

  /**
   * Maneja el evento de acción específica de campo
   */
  onFieldActionClicked(fieldError: FieldError): void {
    // Hacer scroll al campo específico
    const fieldElement = document.querySelector(`[formcontrolname="${fieldError.field}"]`) as HTMLElement;
    if (fieldElement) {
      // Scroll suave al campo
      fieldElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // Focus y efectos visuales después del scroll
      setTimeout(() => {
        fieldElement.focus();

        // Agregar efecto visual temporal más prominente
        fieldElement.classList.add('field-highlight');

        // Opcional: hacer que el campo "pulse" para llamar la atención
        const parentBox = fieldElement.closest('.user-box');
        if (parentBox) {
          parentBox.classList.add('field-highlight');
          setTimeout(() => {
            parentBox.classList.remove('field-highlight');
          }, 2000);
        }

        setTimeout(() => {
          fieldElement.classList.remove('field-highlight');
        }, 2000);
      }, 300);
    }
  }

  /**
   * Valida un campo específico en tiempo real
   */
  validateFieldRealTime(fieldName: string): void {
    if (!this.httpError?.fieldErrors) {
      return;
    }

    const control = this.registerForm.get(fieldName);
    if (!control) {
      return;
    }

    // Buscar el error de campo correspondiente
    const fieldErrorIndex = this.httpError.fieldErrors.findIndex(fe => fe.field === fieldName);
    if (fieldErrorIndex === -1) {
      return;
    }

    const fieldError = this.httpError.fieldErrors[fieldErrorIndex];

    // Validar según el tipo de campo
    let isValid = false;

    switch (fieldName) {
      case 'username':
        isValid = this.validateUsername(control.value);
        break;
      case 'email':
        isValid = this.validateEmail(control.value);
        break;
      case 'password':
        isValid = this.validatePassword(control.value);
        break;
      case 'confirmPassword':
        isValid = this.validateConfirmPassword(control.value);
        break;
      case 'dni':
        isValid = this.validateDNI(control.value);
        break;
      default:
        isValid = control.valid && control.value?.trim();
    }

    // Actualizar estado del error de campo
    const newStatus = isValid ? ValidationStatus.RESOLVED : ValidationStatus.PENDING;

    if (fieldError.status !== newStatus) {
      this.httpError = this.errorMappingService.updateFieldErrorStatus(
        this.httpError,
        fieldName,
        newStatus
      );

      // Limpiar error de campo si está resuelto
      if (newStatus === ValidationStatus.RESOLVED) {
        this.fieldErrors.delete(fieldName);
      }
    }
  }

  /**
   * Validaciones específicas por campo
   */
  private validateUsername(value: string): boolean {
    return !!(value && value.length >= 4 && /^[a-zA-Z0-9_]+$/.test(value));
  }

  private validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!(value && emailRegex.test(value));
  }

  private validatePassword(value: string): boolean {
    return !!(value && value.length >= 8);
  }

  private validateConfirmPassword(value: string): boolean {
    const password = this.registerForm.get('password')?.value;
    return !!(value && value === password);
  }

  private validateDNI(value: string): boolean {
    return !!(value && /^\d{7,8}$/.test(value.replace(/\D/g, '')));
  }

  // Método para marcar los términos como tocados para mostrar error visual
  ensureTermsFieldTouched(): void {
    const termsControl = this.registerForm.get('termsAccepted');
    if (termsControl && !termsControl.value) {
      termsControl.markAsTouched();

      // Añadir animación visual para llamar la atención
      const termsLabel = document.querySelector('label.flex.cursor-pointer');
      if (termsLabel) {
        termsLabel.classList.remove('terms-required');
        setTimeout(() => {
          termsLabel.classList.add('terms-required');
        }, 10);
      }
    }
  }

  /**
   * Maneja cambios en la ubicación seleccionada
   */
  onLocationChanged(location: LocationValue): void {
    this.registerForm.patchValue({
      location: location
    });
  }

  /**
   * Obtiene errores de ubicación para mostrar en el componente
   */
  getLocationErrors(): { [key: string]: string } {
    const locationControl = this.registerForm.get('location');
    const errors: { [key: string]: string } = {};

    if (locationControl?.touched && locationControl?.errors) {
      if (locationControl.errors['required']) {
        errors['location'] = 'Debe seleccionar una ubicación válida';
      }
    }

    return errors;
  }

  /**
   * Verifica si hay errores de ubicación
   */
  hasLocationErrors(): boolean {
    const locationControl = this.registerForm.get('location');
    return !!(locationControl?.touched && locationControl?.invalid);
  }
}
