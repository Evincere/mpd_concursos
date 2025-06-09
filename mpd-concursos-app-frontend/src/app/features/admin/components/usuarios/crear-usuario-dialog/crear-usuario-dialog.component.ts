import { Component, OnInit, Optional, ViewChild } from '@angular/core'; // Import ViewChild
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators'; // Import finalize operator

// Componentes personalizados
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { CustomDialogRef } from '@shared/components/custom-form/custom-dialog/custom-dialog-ref';

// Servicios
import { UserService } from '../application/services/user.service'; // Corrected service name to UserService
import { NotificationService } from '@shared/services/notification.service'; // Assuming NotificationService path
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

// Modelos
import { CreateUserRequest } from '../domain/models/user.model'; // Import CreateUserRequest model

@Component({
  selector: 'app-crear-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    UsuarioFormComponent
  ],
  template: `
    <app-usuario-form
      [isEditMode]="false"
      [usuario]="null"
      (saveUser)="onSaveUser($event)"
      (formCancel)="onClose()">
    </app-usuario-form>
  `,
  styleUrls: ['./crear-usuario-dialog.component.scss']
})
export class CrearUsuarioDialogComponent implements OnInit {
  @ViewChild(UsuarioFormComponent) userFormComponent!: UsuarioFormComponent; // Get reference to the child form component

  isLoading = false; // Component-level loading state

  constructor(
    private userService: UserService, // Corrected service name
    private notificationService: NotificationService,
    @Optional() private dialogRef: CustomDialogRef<any>, // Use any for dialog result type
    private loggingService: LoggingService // Inject LoggingService
  ) {}

  ngOnInit(): void {
    this.loggingService.debug('[CrearUsuarioDialogComponent] Dialog initialized.', undefined, 'CreateUserDialog');
  }

  /**
   * Handles the formCancel event emitted by UsuarioFormComponent.
   * Closes the dialog, indicating cancellation.
   */
  onClose(): void {
    this.loggingService.info('[CrearUsuarioDialogComponent] Form cancelled. Closing dialog.', undefined, 'CreateUserDialog');
    if (this.dialogRef) {
      this.dialogRef.close(false); // Close dialog and pass false for cancellation
    }
  }

  /**
   * Handles the saveUser event emitted by UsuarioFormComponent.
   * Sends the new user data to the UserService.
   * @param userData The user data emitted by the form (already an object matching CreateUserRequest structure).
   */
  onSaveUser(userData: any): void { // Changed type to any to accept form data with password
    this.isLoading = true; // Activate component-level loading state
    this.userFormComponent.isLoading = true; // Also activate loading state on the form component for visual feedback

    // Construct the create user request (data is already mostly in correct format from form)
    const createUserRequest: CreateUserRequest = {
      username: userData.dni, // Using DNI as username as per logic
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dni: userData.dni,
      cuit: userData.cuit || undefined, // Use undefined for empty string or null
      birthDate: userData.birthDate, // Already ISO string from form
      country: userData.country,
      province: userData.province,
      municipality: userData.municipality,
      legalAddress: userData.legalAddress,
      residentialAddress: userData.residentialAddress,
      password: userData.password!, // Password should be required in create mode, assert non-null
      roles: userData.roles,
      enabled: true, // Assuming new users are enabled by default
      sendWelcomeEmail: true, // Assuming this is a default behavior for new users
      telefono: userData.telefono || undefined, // Use undefined for empty string or null
      direccion: userData.direccion || undefined // Use direccion instead of address
    };

    this.loggingService.info('[CrearUsuarioDialogComponent] Sending create user request.', createUserRequest, 'CreateUserDialog');

    // Call the service to create the user
    this.userService.createUser(createUserRequest)
      .pipe(
        finalize(() => {
          this.isLoading = false; // Always reset component-level loading state
          this.userFormComponent.isLoading = false; // Always reset form component's loading state
          this.loggingService.debug('[CrearUsuarioDialogComponent] Create user request finalized.', undefined, 'CreateUserDialog');
        })
      )
      .subscribe({
        next: (newUser) => {
          this.loggingService.info('[CrearUsuarioDialogComponent] User created successfully.', newUser, 'CreateUserDialog');
          this.notificationService.success(`Usuario ${newUser.firstName} ${newUser.lastName} creado correctamente`);

          // Emit a custom event to notify other parts of the application (e.g., table refresh)
          const event = new CustomEvent('userCreated', { detail: newUser });
          document.dispatchEvent(event);
          this.loggingService.debug('[CrearUsuarioDialogComponent] "userCreated" event dispatched.', event.detail, 'CreateUserDialog');

          // Close the dialog with the result
          if (this.dialogRef) {
            this.dialogRef.close(newUser); // Pass the new user object as result
          }
        },
        error: (error) => {
          this.loggingService.error('[CrearUsuarioDialogComponent] Error creating user:', error, 'CreateUserDialog');
          console.error('Error creando usuario:', error);

          // Delegate API error handling to the form component to display field-specific errors
          if (this.userFormComponent) {
            this.userFormComponent.handleApiError(error);
          }

          // Show a general error notification (without closing the dialog)
          let errorMessage = 'Error al crear el usuario. Por favor, revise los datos.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.notificationService.error(errorMessage);
        }
      });
  }
}
