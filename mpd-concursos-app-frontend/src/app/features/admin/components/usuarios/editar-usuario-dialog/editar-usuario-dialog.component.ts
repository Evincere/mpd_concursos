import { Component, OnInit, Inject, Optional, ViewChild } from '@angular/core'; // Import ViewChild
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators'; // Import finalize

// Custom Components
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { CustomDialogRef } from '@shared/components/custom-form/custom-dialog/custom-dialog-ref';
import { DIALOG_DATA } from '@shared/components/custom-form/custom-dialog/dialog-ref';

// Services
import { UserService } from '../application/services/user.service';
import { NotificationService } from '@shared/services/notification.service'; // Assuming NotificationService path
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

// Models
import { User, UpdateUserRequest } from '../domain/models/user.model';

@Component({
  selector: 'app-editar-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    UsuarioFormComponent
  ],
  template: `
    <app-usuario-form
      [isEditMode]="true"
      [usuario]="usuario"
      (saveUser)="onSaveUser($event)"
      (formCancel)="onClose()">
    </app-usuario-form>
  `,
  styles: [`
    :host {
      display: contents; /* Allows the dialog content to stretch full width/height */
    }
  `]
})
export class EditarUsuarioDialogComponent implements OnInit {
  @ViewChild(UsuarioFormComponent) userFormComponent!: UsuarioFormComponent; // Get reference to the child form component

  usuario: User | null = null;
  isLoading = false; // State to manage loading indicator

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    @Optional() private dialogRef: CustomDialogRef<any>,
    @Optional() @Inject(DIALOG_DATA) private dialogData: { usuario: User },
    private loggingService: LoggingService // Inject LoggingService
  ) {
    if (this.dialogData && this.dialogData.usuario) {
      this.usuario = this.dialogData.usuario;
      this.loggingService.debug('[EditarUsuarioDialogComponent] Dialog initialized with user data.', this.usuario, 'EditUserDialog');
    } else {
      this.loggingService.warn('[EditarUsuarioDialogComponent] Dialog initialized without user data. This might be an error.', undefined, 'EditUserDialog');
    }
  }

  ngOnInit(): void {
    // No additional initialization logic needed here, as the form is handled by UsuarioFormComponent
  }

  /**
   * Handles the formCancel event emitted by UsuarioFormComponent.
   * Closes the dialog, indicating cancellation.
   */
  onClose(): void {
    this.loggingService.info('[EditarUsuarioDialogComponent] Form cancelled. Closing dialog.', undefined, 'EditUserDialog');
    if (this.dialogRef) {
      this.dialogRef.close(false); // Close dialog and pass false for cancellation
    }
  }

  /**
   * Handles the saveUser event emitted by UsuarioFormComponent.
   * Sends the updated user data to the UserService.
   * @param userData The user data emitted by the form.
   */
  onSaveUser(userData: any): void { // Changed type to any to accept form data with password
    if (!this.usuario || !this.usuario.id) {
      this.notificationService.error('Error: No se puede editar el usuario sin un ID válido');
      this.loggingService.error('[EditarUsuarioDialogComponent] Attempted to save user without a valid ID.', userData, 'EditUserDialog');
      return;
    }

    this.isLoading = true; // Set loading state to true
    this.userFormComponent.isLoading = true; // Also set loading state on the form component for visual feedback

    // Construct the update user request
    const updateUserRequest: UpdateUserRequest = {
      id: this.usuario.id, // Ensure ID is from the original user being edited
      firstName: userData.firstName,
      lastName: userData.lastName,
      dni: userData.dni,
      cuit: userData.cuit,
      birthDate: userData.birthDate, // Already ISO string from form
      email: userData.email,
      telefono: userData.telefono,
      country: userData.country,
      province: userData.province,
      municipality: userData.municipality,
      legalAddress: userData.legalAddress,
      residentialAddress: userData.residentialAddress,
      direccion: userData.direccion, // Use direccion instead of address
      roles: userData.roles,
      enabled: userData.enabled // Use enabled property instead of status
    };

    // Clean undefined or null properties from the request to avoid sending unnecessary data
    Object.keys(updateUserRequest).forEach(key => {
      const typedKey = key as keyof UpdateUserRequest;
      if (updateUserRequest[typedKey] === undefined || updateUserRequest[typedKey] === null) {
        delete updateUserRequest[typedKey];
      }
    });

    this.loggingService.info(`[EditarUsuarioDialogComponent] Sending update request for user ${this.usuario.id}.`, updateUserRequest, 'EditUserDialog');

    this.userService.updateUser(updateUserRequest)
      .pipe(
        finalize(() => {
          this.isLoading = false; // Always reset loading state
          this.userFormComponent.isLoading = false; // Reset form component's loading state
          this.loggingService.debug('[EditarUsuarioDialogComponent] User update request finalized.', undefined, 'EditUserDialog');
        })
      )
      .subscribe({
        next: (updatedUser) => {
          this.loggingService.info(`[EditarUsuarioDialogComponent] User ${updatedUser.id} updated successfully.`, updatedUser, 'EditUserDialog');
          this.notificationService.success(`Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado correctamente`);

          if (this.dialogRef) {
            this.dialogRef.close(true); // Close dialog and pass true for success
          }

          // Emit a custom event to notify other parts of the application (e.g., table refresh)
          const event = new CustomEvent('userUpdated', { detail: updatedUser });
          document.dispatchEvent(event);
          this.loggingService.debug('[EditarUsuarioDialogComponent] "userUpdated" event dispatched.', event.detail, 'EditUserDialog');
        },
        error: (error) => {
          this.loggingService.error('[EditarUsuarioDialogComponent] Error updating user:', error, 'EditUserDialog');
          console.error('[EditarUsuarioDialogComponent] Error actualizando usuario:', error);

          // Delegate error handling to the form component to display field-specific errors
          if (this.userFormComponent) {
            this.userFormComponent.handleApiError(error);
          }

          // Generate a more descriptive error message for the notification
          let errorMessage = 'Error al actualizar el usuario.';

          if (error.status === 400) {
            errorMessage = 'Error de validación en los datos del usuario. Por favor, revise los campos marcados.';
            if (error.error && error.error.detail) {
              errorMessage += ` Detalles: ${error.error.detail}`;
            }
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al procesar la solicitud.';
            if (error.error && error.error.detail) {
              errorMessage += ` Detalles: ${error.error.detail}`;
            } else {
              errorMessage += ' Por favor, verifique los datos e intente nuevamente.';
            }

            // Check if the error is related to CUIT (specific backend validation)
            const errorString = JSON.stringify(error).toLowerCase();
            if (errorString.includes('cuit')) {
              errorMessage = 'Error al validar el CUIT. Asegúrese de que el CUIT tenga 11 dígitos numéricos y un formato válido, o déjelo en blanco.';
              // Optionally, try to clear the CUIT in the form if it was the issue
              if (this.usuario) {
                 // Note: this.usuario is an @Input, directly modifying might not reflect on form unless re-patched
                 // It's better for the form component itself to handle its own error display/clearing.
              }
            }
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.';
          }

          // Show error notification without closing the dialog
          this.notificationService.error(errorMessage);
        }
      });
  }
}
