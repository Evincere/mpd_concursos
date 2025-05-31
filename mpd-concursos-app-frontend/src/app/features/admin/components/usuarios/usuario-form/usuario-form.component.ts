import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from  '@angular/forms';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { FormErrorComponent } from '@shared/components/form-error/form-error.component';

// Servicios
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ApiErrorService } from '@core/services/error/api-error.service';

// Validación
import { UserValidationService } from '../domain/validation/user-validation.service';

// Modelos
import { User, UserStatus } from '../domain/models/user.model';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomCheckboxComponent,
    FormErrorComponent
  ]
})
export class UsuarioFormComponent implements OnInit {
  @Input() usuario: User | null = null;
  @Input() isEditMode = false;

  @Output() saveUser = new EventEmitter<Record<string, unknown>>();
  @Output() formCancel = new EventEmitter<void>();

  userForm!: FormGroup;
  isLoading = false;
  formSubmitted = false;

  // Mensajes de error personalizados
  validationMessages = {
    nombre: {
      required: 'El nombre es obligatorio',
      minlength: 'El nombre debe tener al menos 2 caracteres',
      maxlength: 'El nombre no debe exceder los 50 caracteres',
      invalidName: 'El nombre no debe contener números ni caracteres especiales'
    },
    apellido: {
      required: 'El apellido es obligatorio',
      minlength: 'El apellido debe tener al menos 2 caracteres',
      maxlength: 'El apellido no debe exceder los 50 caracteres',
      invalidName: 'El apellido no debe contener números ni caracteres especiales'
    },
    dni: {
      required: 'El DNI es obligatorio',
      invalidDni: 'El DNI debe tener entre 7 y 8 dígitos numéricos'
    },
    cuit: {
      pattern: 'El CUIT debe tener 11 dígitos numéricos sin guiones'
    },
    birthDate: {
      required: 'La fecha de nacimiento es obligatoria'
    },
    email: {
      required: 'El email es obligatorio',
      email: 'Debe ingresar un email válido',
      duplicateEmail: 'Este email ya está registrado'
    },
    password: {
      required: 'La contraseña es obligatoria',
      minlength: 'La contraseña debe tener al menos 8 caracteres',
      pattern: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
    },
    confirmPassword: {
      required: 'Debe confirmar la contraseña',
      passwordMismatch: 'Las contraseñas no coinciden'
    },
    telefono: {
      invalidPhone: 'El teléfono debe tener un formato válido'
    },
    country: {
      required: 'El país es obligatorio'
    },
    province: {
      required: 'La provincia es obligatoria'
    },
    municipality: {
      required: 'El municipio es obligatorio'
    },
    legalAddress: {
      required: 'El domicilio legal es obligatorio'
    },
    residentialAddress: {
      required: 'El domicilio real es obligatorio'
    }
  };

  availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'evaluador', label: 'Evaluador' },
    { value: 'usuario', label: 'Usuario' }
  ];

  estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'bloqueado', label: 'Bloqueado' }
  ];

  constructor(
    private fb: FormBuilder,
    private validationService: UserValidationService,
    private notificationService: CustomNotificationService,
    private apiErrorService: ApiErrorService
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.isEditMode && this.usuario) {
      this.populateForm();
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      // Datos personales
      nombre: ['', [
        Validators.required,
        this.validationService.nameValidator()
      ]],
      apellido: ['', [
        Validators.required,
        this.validationService.nameValidator()
      ]],
      dni: ['', [
        Validators.required,
        this.validationService.dniValidator()
      ],
      this.isEditMode && this.usuario ? [] : [
        this.validationService.dniExistsValidator()
      ]],
      cuit: ['', [
        Validators.pattern(/^\d{11}$/)
      ]],
      birthDate: [null, [
        Validators.required
      ]],

      // Datos de contacto
      email: ['', [
        Validators.required,
        this.validationService.emailValidator()
      ],
      this.isEditMode && this.usuario ? [] : [
        this.validationService.emailExistsValidator()
      ]],
      telefono: ['', [
        this.validationService.phoneValidator()
      ]],

      // Datos de ubicación
      country: ['Argentina', Validators.required],
      province: ['', Validators.required],
      municipality: ['', Validators.required],
      legalAddress: ['', Validators.required],
      residentialAddress: ['', Validators.required],
      direccion: ['', [
        this.validationService.addressValidator()
      ]],

      // Roles y estado
      admin: [false],
      evaluador: [false],
      usuario: [false],
      estado: ['activo' as UserStatus],

      // Credenciales
      password: ['', this.isEditMode ? [] : [
        Validators.required,
        this.validationService.passwordValidator()
      ]],
      confirmPassword: ['', this.isEditMode ? [] : [
        Validators.required
      ]]
    }, {
      validators: this.isEditMode ? [] : this.validationService.passwordMatchValidator('password', 'confirmPassword')
    });
  }

  populateForm(): void {
    if (!this.usuario) return;

    this.userForm.patchValue({
      nombre: this.usuario.firstName,
      apellido: this.usuario.lastName,
      dni: this.usuario.dni,
      cuit: this.usuario.cuit || '',
      birthDate: this.usuario.birthDate ? new Date(this.usuario.birthDate) : null,
      email: this.usuario.email,
      telefono: this.usuario.telefono || '',
      country: this.usuario.country || 'Argentina',
      province: this.usuario.province || '',
      municipality: this.usuario.municipality || '',
      legalAddress: this.usuario.legalAddress || '',
      residentialAddress: this.usuario.residentialAddress || '',
      direccion: this.usuario.direccion || '',
      estado: this.usuario.status || UserStatus.ACTIVE
    });

    // Marcar los roles seleccionados
    if (this.usuario.roles) {
      this.usuario.roles.forEach(rol => {
        if (rol === 'ROLE_ADMIN') this.userForm.get('admin')?.setValue(true);
        if (rol === 'ROLE_EVALUATOR') this.userForm.get('evaluador')?.setValue(true);
        if (rol === 'ROLE_USER') this.userForm.get('usuario')?.setValue(true);
      });
    }
  }

  passwordMatchValidator(group: FormGroup): Record<string, boolean> | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();

      // Verificar si hay errores de validación asíncrona pendientes
      const asyncValidationPending = Object.values(this.userForm.controls).some(
        control => control.status === 'PENDING'
      );

      if (asyncValidationPending) {
        this.showError('Validando datos, por favor espere...', 'Validación en progreso');
        return;
      }

      // Mostrar errores específicos
      const errorMessages: string[] = [];

      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control?.invalid) {
          // Usar el componente FormErrorComponent para obtener los mensajes de error
          const errors = control.errors || {};

          Object.keys(errors).forEach(errorKey => {
            const error = errors[errorKey];
            if (error && typeof error === 'object' && 'message' in error) {
              errorMessages.push(error.message as string);
            } else {
              // Fallback a los mensajes personalizados
              const validationMessages = this.validationMessages;
              const messages = validationMessages[key as keyof typeof validationMessages];
              if (messages && errorKey in messages) {
                errorMessages.push(messages[errorKey as keyof typeof messages]);
              }
            }
          });
        }
      });

      // Mostrar hasta 3 errores para no sobrecargar al usuario
      const displayErrors = errorMessages.slice(0, 3).join('. ');
      this.showError(displayErrors || 'Por favor, complete todos los campos requeridos correctamente', 'Error de Validación');

      // Hacer scroll al primer campo con error
      const firstInvalidControl = Object.keys(this.userForm.controls)
        .find(key => this.userForm.get(key)?.invalid);

      if (firstInvalidControl) {
        const element = document.querySelector(`[formControlName="${firstInvalidControl}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      return;
    }

    this.isLoading = true;

    // Construir objeto de usuario
    const formData = this.userForm.value;
    const roles: string[] = [];

    if (formData.admin) roles.push('ROLE_ADMIN');
    if (formData.evaluador) roles.push('ROLE_EVALUATOR');
    if (formData.usuario) roles.push('ROLE_USER');

    const userData = {
      id: this.isEditMode && this.usuario ? this.usuario.id : undefined,
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      cuit: formData.cuit,
      birthDate: formData.birthDate,
      email: formData.email,
      telefono: formData.telefono,
      country: formData.country,
      province: formData.province,
      municipality: formData.municipality,
      legalAddress: formData.legalAddress,
      residentialAddress: formData.residentialAddress,
      direccion: formData.direccion,
      roles: roles,
      estado: formData.estado,
      password: formData.password
    };

    // Emitir el evento con los datos del usuario
    this.saveUser.emit(userData);
  }

  onClose(): void {
    console.log('Cerrando formulario desde el botón Cancelar');

    // Simplemente emitir el evento - sin intentar cerrar el diálogo directamente
    this.formCancel.emit();
  }

  /**
   * Cierra el diálogo directamente buscando el componente de diálogo padre
   * y llamando a su método closeDialog()
   */
  closeDialogDirectly(): void {
    console.log('Cerrando diálogo directamente desde el botón Cancelar');

    // Emitir el evento formCancel para mantener compatibilidad
    this.formCancel.emit();

    try {
      // 1. Intentar usar el método global expuesto por el componente de diálogo
      const globalCloseMethod = (window as any).customDialogCloseMethod;
      if (typeof globalCloseMethod === 'function') {
        console.log('Usando método global customDialogCloseMethod');
        globalCloseMethod();
        return;
      }

      // 2. Buscar el componente de diálogo padre y llamar a su método closeDialog
      const dialogComponent = document.querySelector('app-custom-dialog');
      if (dialogComponent) {
        console.log('Encontrado componente de diálogo padre, llamando a closeDialog()');

        // Llamar al método closeDialog del componente de diálogo
        const closeDialogMethod = (dialogComponent as any).closeDialog;
        if (typeof closeDialogMethod === 'function') {
          closeDialogMethod.call(dialogComponent);
          return;
        }
      }

      // 3. Buscar el botón de cierre (X) y hacer clic en él
      const closeButton = document.querySelector('.close-button');
      if (closeButton && closeButton instanceof HTMLElement) {
        console.log('Encontrado botón de cierre, simulando clic');
        closeButton.click();
        return;
      }

      // 4. Si no se encuentra el botón de cierre, intentar cerrar usando el servicio de diálogo global
      const dialogService = (window as any).dialogService;
      if (dialogService && typeof dialogService.close === 'function') {
        console.log('Cerrando diálogo usando dialogService global');
        dialogService.close();
        return;
      }

      // 5. Como último recurso, eliminar manualmente los elementos de diálogo del DOM
      console.log('Eliminando manualmente elementos de diálogo del DOM');
      const selectors = [
        '.dialog-backdrop',
        '.custom-dialog-container',
        '.dialog-container',
        '.unified-dialog-container',
        '.cdk-overlay-container',
        '.cdk-overlay-backdrop'
      ];

      // Combinar todos los selectores en una sola consulta
      const combinedSelector = selectors.join(', ');
      const dialogElements = document.querySelectorAll(combinedSelector);

      if (dialogElements.length > 0) {
        console.log(`Eliminando ${dialogElements.length} elementos de diálogo del DOM`);

        dialogElements.forEach(element => {
          try {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          } catch (removeErr) {
            console.error('Error al eliminar elemento del DOM:', removeErr);
          }
        });

        // Restaurar el desplazamiento del body
        document.body.style.overflow = '';
      }
    } catch (error) {
      console.error('Error al intentar cerrar el diálogo:', error);
    }
  }

  private showError(message: string, title = 'Error'): void {
    this.notificationService.error(message, title);
  }

  /**
   * Maneja errores de la API aplicándolos al formulario
   * @param error Error HTTP
   */
  handleApiError(error: any): void {
    // Aplicar errores de validación al formulario
    this.apiErrorService.applyValidationErrorsToForm(this.userForm, error);

    // Marcar el formulario como tocado para mostrar los errores
    this.userForm.markAllAsTouched();
  }

  // Método para verificar si un campo tiene errores
  hasError(controlName: string): boolean {
    const control = this.userForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

  // Método para obtener los mensajes de error de un campo
  getErrorMessages(controlName: string): string[] {
    const control = this.userForm.get(controlName);
    if (!control || !control.errors) return [];

    return Object.keys(control.errors).map(errorKey => {
      const messages = this.validationMessages[controlName as keyof typeof this.validationMessages];
      return messages && messages[errorKey as keyof typeof messages]
        ? messages[errorKey as keyof typeof messages]
        : `Error: ${errorKey}`;
    });
  }
}
