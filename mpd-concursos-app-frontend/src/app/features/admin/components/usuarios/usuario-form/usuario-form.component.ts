import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder, AbstractControl } from '@angular/forms'; // Import AbstractControl

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { FormErrorComponent } from '@shared/components/form-error/form-error.component';

// Services
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ApiErrorService } from '@core/services/error/api-error.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

// Validation
import { UserValidationService } from '../domain/validation/user-validation.service';

// Models
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

  @Output() saveUser = new EventEmitter<any>(); // Emit User object or partial user data
  @Output() formCancel = new EventEmitter<void>();

  userForm!: FormGroup;
  isLoading = false;
  formSubmitted = false; // Tracks if form has been submitted to show errors

  // Custom validation messages
  validationMessages = {
    firstName: { // Changed from 'nombre' to 'firstName'
      required: 'El nombre es obligatorio',
      minlength: 'El nombre debe tener al menos 2 caracteres',
      maxlength: 'El nombre no debe exceder los 50 caracteres',
      invalidName: 'El nombre no debe contener números ni caracteres especiales'
    },
    lastName: { // Changed from 'apellido' to 'lastName'
      required: 'El apellido es obligatorio',
      minlength: 'El apellido debe tener al menos 2 caracteres',
      maxlength: 'El apellido no debe exceder los 50 caracteres',
      invalidName: 'El apellido no debe contener números ni caracteres especiales'
    },
    // Aliases para compatibilidad con templates
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
      invalidDni: 'El DNI debe tener entre 7 y 8 dígitos numéricos',
      dniExists: 'Este DNI ya está registrado' // Add async validation message
    },
    cuit: {
      pattern: 'El CUIT debe tener 11 dígitos numéricos sin guiones'
    },
    birthDate: {
      required: 'La fecha de nacimiento es obligatoria',
      invalidDate: 'La fecha de nacimiento no es válida'
    },
    email: {
      required: 'El email es obligatorio',
      email: 'Debe ingresar un email válido',
      emailExists: 'Este email ya está registrado' // Add async validation message
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
    },
    address: { // Assuming 'address' is an additional field for general address validation
      addressInvalid: 'La dirección contiene caracteres no permitidos' // Custom validation message
    }
  };

  availableRoles = [
    { value: 'ROLE_ADMIN', label: 'Administrador' },
    { value: 'ROLE_EVALUATOR', label: 'Evaluador' },
    { value: 'ROLE_USER', label: 'Usuario' }
  ];

  estadoOptions = [
    { value: UserStatus.ACTIVE, label: 'Activo' },
    { value: UserStatus.INACTIVE, label: 'Inactivo' },
    { value: UserStatus.BLOCKED, label: 'Bloqueado' }
  ];

  constructor(
    private fb: FormBuilder,
    private validationService: UserValidationService,
    private notificationService: CustomNotificationService,
    private apiErrorService: ApiErrorService,
    private loggingService: LoggingService // Inject LoggingService
  ) {}

  ngOnInit(): void {
    this.loggingService.debug('[UsuarioFormComponent] Initializing form.', undefined, 'UserForm');
    this.initForm();

    if (this.isEditMode && this.usuario) {
      this.loggingService.info('[UsuarioFormComponent] Populating form in edit mode.', this.usuario, 'UserForm');
      this.populateForm();
    }
  }

  /**
   * Initializes the user registration form with validation rules.
   */
  initForm(): void {
    this.userForm = this.fb.group({
      // Personal Data
      firstName: ['', [ // Changed from 'nombre' to 'firstName'
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.validationService.nameValidator()
      ]],
      lastName: ['', [ // Changed from 'apellido' to 'lastName'
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.validationService.nameValidator()
      ]],
      dni: ['', {
        validators: [
          Validators.required,
          this.validationService.dniValidator()
        ],
        asyncValidators: this.isEditMode && this.usuario ? null : [this.validationService.dniExistsValidator()],
        updateOn: 'blur' // Trigger async validation on blur
      }],
      cuit: ['', [
        Validators.pattern(/^\d{11}$/) // 11 numeric digits pattern
      ]],
      birthDate: [null, [
        Validators.required
        // Consider adding a custom date validation, e.g., this.validationService.minAgeValidator(18)
      ]],

      // Contact Data
      email: ['', {
        validators: [
          Validators.required,
          Validators.email // Basic email format validation
        ],
        asyncValidators: this.isEditMode && this.usuario ? null : [this.validationService.emailExistsValidator()],
        updateOn: 'blur' // Trigger async validation on blur
      }],
      telefono: ['', [
        this.validationService.phoneValidator() // Custom phone format validation
      ]],

      // Location Data
      country: ['Argentina', Validators.required],
      province: ['', Validators.required],
      municipality: ['', Validators.required],
      legalAddress: ['', Validators.required],
      residentialAddress: ['', Validators.required],
      // Assuming 'address' is a composite or specific field for general address. Adjust as per backend.
      address: ['', [
        // Add custom address validation if needed, e.g., this.validationService.addressValidator()
      ]],

      // Roles and Status
      admin: [false],
      evaluador: [false],
      usuario: [false],
      status: [UserStatus.ACTIVE], // Use UserStatus enum directly

      // Credentials (only for create mode or when explicitly changing password in edit mode)
      password: ['', this.isEditMode ? [] : [ // Password is required only in create mode
        Validators.required,
        Validators.minLength(8),
        this.validationService.passwordValidator() // Custom password complexity validation
      ]],
      confirmPassword: ['', this.isEditMode ? [] : [ // Confirm password is required only in create mode
        Validators.required
      ]]
    }, {
      // Cross-field validation for password match, only in create mode
      validators: this.isEditMode ? [] : this.validationService.passwordMatchValidator('password', 'confirmPassword')
    });

    // Subscriptions to clear async validation errors when control value changes
    this.userForm.get('dni')?.valueChanges.subscribe(() => {
      // If dniExists error is present, update validity to re-run async validation
      if (this.userForm.get('dni')?.hasError('dniExists')) {
        this.userForm.get('dni')?.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.userForm.get('email')?.valueChanges.subscribe(() => {
      // If emailExists error is present, update validity to re-run async validation
      if (this.userForm.get('email')?.hasError('emailExists')) {
        this.userForm.get('email')?.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.loggingService.debug('[UsuarioFormComponent] Form initialized with validators.', undefined, 'UserForm');
  }

  /**
   * Populates the form with existing user data in edit mode.
   */
  populateForm(): void {
    if (!this.usuario) {
      this.loggingService.warn('[UsuarioFormComponent] Attempted to populate form with null user. Aborting.', undefined, 'UserForm');
      return;
    };

    this.userForm.patchValue({
      firstName: this.usuario.firstName,
      lastName: this.usuario.lastName,
      dni: this.usuario.dni,
      cuit: this.usuario.cuit || '',
      // Ensure birthDate is a Date object for form input
      birthDate: this.usuario.birthDate ? new Date(this.usuario.birthDate) : null,
      email: this.usuario.email,
      telefono: this.usuario.telefono || '',
      country: this.usuario.country || 'Argentina',
      province: this.usuario.province || '',
      municipality: this.usuario.municipality || '',
      legalAddress: this.usuario.legalAddress || '',
      residentialAddress: this.usuario.residentialAddress || '',
      address: this.usuario.direccion || '', // Using 'direccion' from User model
      status: this.usuario.status || UserStatus.ACTIVE
    });

    // Mark selected roles
    if (this.usuario.roles) {
      this.usuario.roles.forEach(rol => {
        if (rol === 'ROLE_ADMIN') this.userForm.get('admin')?.setValue(true);
        if (rol === 'ROLE_EVALUATOR') this.userForm.get('evaluador')?.setValue(true);
        if (rol === 'ROLE_USER') this.userForm.get('usuario')?.setValue(true);
      });
    }

    // Disable DNI and Email fields in edit mode as they are usually immutable identifiers
    this.userForm.get('dni')?.disable();
    this.userForm.get('email')?.disable();
    this.loggingService.debug('[UsuarioFormComponent] Form populated and DNI/Email fields disabled for editing.', undefined, 'UserForm');
  }

  /**
   * Handles form submission. Validates the form and emits user data if valid.
   */
  onSubmit(): void {
    this.formSubmitted = true; // Mark form as submitted to trigger error display
    this.loggingService.info('[UsuarioFormComponent] Form submission attempt.', undefined, 'UserForm');

    // If form is invalid after initial checks
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched(); // Mark all controls as touched to display errors

      // Check for pending asynchronous validations
      const asyncValidationPending = Object.values(this.userForm.controls).some(
        control => control.status === 'PENDING'
      );

      if (asyncValidationPending) {
        this.showError('Validando datos, por favor espere...', 'Validación en progreso');
        this.loggingService.warn('[UsuarioFormComponent] Form submission blocked: Pending asynchronous validations.', undefined, 'UserForm');
        return; // Prevent submission if async validations are still running
      }

      // Collect specific error messages for display
      const errorMessages: string[] = [];
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control?.invalid && (control.touched || this.formSubmitted)) {
          // Iterate over all errors on the control
          const errors = control.errors || {};
          for (const errorKey in errors) {
            if (errors.hasOwnProperty(errorKey)) {
              // Check if it's a custom validation error with a 'message' property (e.g., from async validators)
              const error = errors[errorKey];
              if (error && typeof error === 'object' && 'message' in error) {
                errorMessages.push(error.message as string);
              } else {
                // Fallback to predefined validation messages if no specific message is found
                const validationMsgsForControl = this.validationMessages[key as keyof typeof this.validationMessages];
                if (validationMsgsForControl && (validationMsgsForControl as any)[errorKey]) {
                  errorMessages.push((validationMsgsForControl as any)[errorKey]);
                } else {
                  // Generic fallback if no specific message is found (should be rare with good validationMessages)
                  errorMessages.push(`Error en ${key}: ${errorKey}`);
                }
              }
            }
          }
        }
      });

      // Handle cross-field validation errors like passwordMismatch on the form group level
      if (this.userForm.hasError('passwordMismatch') && (this.formSubmitted || this.userForm.get('confirmPassword')?.touched)) {
        errorMessages.push(this.validationMessages.confirmPassword.passwordMismatch);
      }


      // Show a concise error notification
      const uniqueMessages = Array.from(new Set(errorMessages));
      const displayErrors = uniqueMessages.slice(0, 3).join('. ') + (errorMessages.length > 3 ? '...' : '');
      this.showError(displayErrors || 'Por favor, complete todos los campos requeridos correctamente.', 'Error de Validación');

      // Scroll to the first invalid field for better UX
      const firstInvalidControl = Object.keys(this.userForm.controls)
        .find(key => this.userForm.get(key)?.invalid);

      if (firstInvalidControl) {
        const element = document.querySelector(`[formControlName="${firstInvalidControl}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      this.loggingService.warn('[UsuarioFormComponent] Form invalid due to synchronous validations. Displaying errors.', this.userForm.errors, 'UserForm');
      return; // Stop submission if form is invalid
    }

    this.isLoading = true; // Set loading state when form is valid and ready to submit

    // Construct user object using getRawValue to include disabled fields (like DNI, Email in edit mode)
    const formData = this.userForm.getRawValue();
    const roles: string[] = [];

    if (formData.admin) roles.push('ROLE_ADMIN');
    if (formData.evaluador) roles.push('ROLE_EVALUATOR');
    if (formData.usuario) roles.push('ROLE_USER');

    const userData: Partial<User> & { id?: string; password?: string; enabled?: boolean; createdAt?: Date } = {
      id: this.isEditMode && this.usuario ? this.usuario.id : undefined, // Include ID only if in edit mode
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.email, // Assuming username is derived from email
      dni: formData.dni,
      cuit: formData.cuit,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined, // Convert to Date object
      email: formData.email,
      telefono: formData.telefono,
      country: formData.country,
      province: formData.province,
      municipality: formData.municipality,
      legalAddress: formData.legalAddress,
      residentialAddress: formData.residentialAddress,
      direccion: formData.address,
      roles: roles,
      status: formData.status,
      // Include password only if in create mode or if password fields are filled in edit mode
      password: this.isEditMode && !formData.password ? undefined : formData.password // Only send password if it was entered
    };

    // Remove confirmPassword as it's only for frontend validation
    delete (userData as any).confirmPassword;

    this.loggingService.info('[UsuarioFormComponent] Emitting saveUser event with processed user data.', userData, 'UserForm');
    this.saveUser.emit(userData); // Emit the event with the constructed User object
  }

  /**
   * Emits the formCancel event to notify the parent component about cancellation.
   */
  onCancel(): void {
    this.loggingService.debug('[UsuarioFormComponent] Form cancelled. Emitting formCancel event.', undefined, 'UserForm');
    this.formCancel.emit();
  }

  /**
   * Displays an error notification.
   * @param message The error message.
   * @param title The title of the notification.
   */
  private showError(message: string, title = 'Error'): void {
    this.notificationService.error(message, title);
    this.loggingService.error(`[UsuarioFormComponent] Displaying notification error: ${message}`, undefined, 'UserForm');
  }

  /**
   * Handles API errors by applying validation errors to the form.
   * This method would typically be called by the parent component after an API call fails.
   * @param error HTTP Error response.
   */
  handleApiError(error: any): void {
    this.loggingService.error('[UsuarioFormComponent] Handling API error received from parent:', error, 'UserForm');
    // Assuming ApiErrorService can parse the error response and apply it to form controls
    this.apiErrorService.applyValidationErrorsToForm(this.userForm, error);

    // Mark the form as touched to display errors
    this.userForm.markAllAsTouched();
    this.isLoading = false; // Reset loading state
  }

  /**
   * Checks if a form control has errors that should be displayed.
   * @param controlName The name of the form control.
   * @returns True if the control has errors and should display them, false otherwise.
   */
  hasError(controlName: string): boolean {
    const control = this.userForm.get(controlName);
    if (!control) return false;

    // Check for errors on the control itself (touched or form submitted)
    const controlHasErrors = control.invalid && (control.touched || this.formSubmitted);

    // Additionally, check for cross-field validation errors if applicable
    if (controlName === 'confirmPassword' && this.userForm.hasError('passwordMismatch')) {
        return controlHasErrors || (this.userForm.getError('passwordMismatch') && (control.touched || this.formSubmitted));
    }

    return controlHasErrors;
  }

  /**
   * Gets the error messages for a specific form control.
   * @param controlName The name of the form control.
   * @returns An array of unique error messages.
   */
  getErrorMessages(controlName: string): string[] {
    const control = this.userForm.get(controlName);
    if (!control || !control.errors) return [];

    const messages: string[] = [];
    const controlErrors = control.errors;

    // Handle cross-field validation errors (e.g., passwordMismatch)
    if (this.userForm.hasError('passwordMismatch') && (controlName === 'password' || controlName === 'confirmPassword')) {
        // Only show if the form has been submitted or the control is touched
        if (this.formSubmitted || control.touched) {
            messages.push(this.validationMessages.confirmPassword.passwordMismatch);
        }
    }

    // Handle individual field validation errors
    const validationMsgsForControl = this.validationMessages[controlName as keyof typeof this.validationMessages];
    for (const errorKey in controlErrors) {
        if (controlErrors.hasOwnProperty(errorKey)) {
            // Check for custom validation errors from async validators (e.g., dniExists, emailExists)
            const error = controlErrors[errorKey];
            if (error && typeof error === 'object' && 'message' in error) {
                messages.push(error.message as string);
            } else if (validationMsgsForControl && (validationMsgsForControl as any)[errorKey]) {
                messages.push((validationMsgsForControl as any)[errorKey]);
            } else {
                // Fallback for any unexpected errors
                messages.push(`Error desconocido en ${controlName}: ${errorKey}`);
            }
        }
    }

    return Array.from(new Set(messages)); // Return unique messages to avoid duplicates
  }

  /**
   * Cierra el diálogo directamente sin guardar
   */
  closeDialogDirectly(): void {
    console.log('Cerrando diálogo directamente');
    // TODO: Implementar lógica para cerrar diálogo
    // this.dialogRef.close();
  }
}
