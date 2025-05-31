import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';

// Componentes personalizados
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { CustomDialogRef } from '@shared/components/custom-form/custom-dialog/custom-dialog-ref';
import { DIALOG_DATA } from '@shared/components/custom-form/custom-dialog/dialog-ref';

// Servicios
import { UserService } from '../application/services/user.service';
import { NotificationService } from '@shared/services/notification.service';

// Modelos
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
      display: contents;
    }
  `]
})
export class EditarUsuarioDialogComponent implements OnInit {
  usuario: User | null = null;
  isLoading = false;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    @Optional() private dialogRef: CustomDialogRef,
    @Optional() @Inject(DIALOG_DATA) private dialogData: { usuario: User }
  ) {
    if (this.dialogData && this.dialogData.usuario) {
      this.usuario = this.dialogData.usuario;
    }
  }

  ngOnInit(): void {
    console.log('EditarUsuarioDialogComponent inicializado con usuario:', this.usuario);
  }



  onClose(): void {
    console.log('Cerrando diálogo de edición de usuario');

    // Simplemente delegar al dialogRef si está disponible
    if (this.dialogRef) {
      this.dialogRef.close(null);
    }
    // No hacemos nada más aquí, ya que el botón Cancelar en el formulario
    // ahora tiene su propia lógica para cerrar el diálogo
  }

  onSaveUser(userData: Record<string, unknown>): void {
    if (!this.usuario || !this.usuario.id) {
      this.notificationService.error('Error: No se puede editar el usuario sin un ID válido');
      return;
    }

    this.isLoading = true;

    // Construir el objeto de actualización de usuario
    const updateUserRequest: UpdateUserRequest = {
      id: this.usuario.id,
      email: userData['email'] as string,
      firstName: userData['nombre'] as string,
      lastName: userData['apellido'] as string,
      dni: userData['dni'] as string,
      cuit: (userData['cuit'] as string) ? (userData['cuit'] as string) : undefined,
      birthDate: userData['birthDate'] as Date,
      country: userData['country'] as string,
      province: userData['province'] as string,
      municipality: userData['municipality'] as string,
      legalAddress: userData['legalAddress'] as string,
      residentialAddress: userData['residentialAddress'] as string,
      roles: userData['roles'] as string[],
      enabled: userData['estado'] === 'activo',
      telefono: (userData['telefono'] as string) ? (userData['telefono'] as string) : undefined,
      direccion: (userData['direccion'] as string) ? (userData['direccion'] as string) : undefined
    };

    // Eliminar propiedades undefined o null
    Object.keys(updateUserRequest).forEach(key => {
      const typedKey = key as keyof UpdateUserRequest;
      if (updateUserRequest[typedKey] === undefined || updateUserRequest[typedKey] === null) {
        delete updateUserRequest[typedKey];
      }
    });

    // Validar datos antes de enviar
    if (!this.validarDatos(updateUserRequest)) {
      this.isLoading = false;
      return;
    }

    console.log('Enviando solicitud de actualización:', updateUserRequest);

    // Llamar al servicio para actualizar el usuario
    console.log('[EditarUsuarioDialog] Enviando solicitud de actualización al servicio:', updateUserRequest);

    this.userService.updateUser(updateUserRequest).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        console.log('[EditarUsuarioDialog] Usuario actualizado correctamente:', updatedUser);

        // Primero cerrar el diálogo para evitar superposiciones
        if (this.dialogRef) {
          this.dialogRef.close(updatedUser);
        } else {
          this.onClose();
        }

        // Mostrar notificación después de cerrar el diálogo
        setTimeout(() => {
          this.notificationService.success(`Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado correctamente`);

          // Emitir un evento personalizado para notificar que se ha actualizado un usuario
          const event = new CustomEvent('userUpdated', { detail: updatedUser });
          document.dispatchEvent(event);
        }, 300);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('[EditarUsuarioDialog] Error actualizando usuario:', error);

        // Mostrar más detalles del error
        if (error.status) {
          console.error(`[EditarUsuarioDialog] Status: ${error.status}, Mensaje: ${error.message}`);
        }

        if (error.error) {
          console.error('[EditarUsuarioDialog] Error detallado:', error.error);
        }

        // Generar mensaje de error más descriptivo
        let errorMessage = 'Error al actualizar el usuario';

        if (error.status === 400) {
          errorMessage = 'Error de validación en los datos del usuario';

          if (error.error && error.error.detail) {
            errorMessage += `: ${error.error.detail}`;
          }
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor al procesar la solicitud';

          // Intentar proporcionar más información sobre el error
          if (error.error && error.error.detail) {
            errorMessage += `. ${error.error.detail}`;
          } else {
            errorMessage += '. Por favor, verifique los datos e intente nuevamente.';
          }

          // Verificar si el error está relacionado con el CUIT
          const errorString = JSON.stringify(error).toLowerCase();
          if (errorString.includes('cuit')) {
            errorMessage = 'Error al validar el CUIT. Asegúrese de que el CUIT tenga 11 dígitos numéricos y un formato válido, o déjelo en blanco.';

            // Limpiar el CUIT en el formulario
            if (this.usuario) {
              this.usuario.cuit = undefined;
            }
          }

          // Mostrar el error
          this.notificationService.error(errorMessage);
          return;
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.';
        }

        // Mostrar notificación de error sin cerrar el diálogo para permitir corregir los datos
        this.notificationService.error(errorMessage);
      }
    });
  }

  /**
   * Valida los datos del usuario antes de enviarlos al servidor
   * @param user Datos del usuario a validar
   * @returns true si los datos son válidos, false en caso contrario
   */
  private validarDatos(user: UpdateUserRequest): boolean {
    // Validar email
    if (user.email && !this.validarEmail(user.email)) {
      this.notificationService.error('El formato del email no es válido');
      return false;
    }

    // Validar que tenga al menos un rol
    if (!user.roles || user.roles.length === 0) {
      this.notificationService.error('El usuario debe tener al menos un rol asignado');
      return false;
    }

    // Validar DNI
    if (user.dni && !this.validarDNI(user.dni)) {
      this.notificationService.error('El formato del DNI no es válido');
      return false;
    }

    // Validar CUIT si está presente
    if (user.cuit && !this.validarCUIT(user.cuit)) {
      this.notificationService.error('El formato del CUIT no es válido. Debe tener 11 dígitos numéricos');
      return false;
    }

    return true;
  }

  /**
   * Valida el formato de un CUIT
   * @param cuit CUIT a validar
   * @returns true si el CUIT es válido, false en caso contrario
   */
  private validarCUIT(cuit: string): boolean {
    // Validar que el CUIT tenga 11 dígitos numéricos
    const cuitRegex = /^\d{11}$/;
    return cuitRegex.test(cuit);
  }

  /**
   * Valida el formato de un email
   * @param email Email a validar
   * @returns true si el email es válido, false en caso contrario
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Valida el formato de un DNI
   * @param dni DNI a validar
   * @returns true si el DNI es válido, false en caso contrario
   */
  private validarDNI(dni: string): boolean {
    // Validar que el DNI tenga entre 7 y 9 dígitos
    const dniRegex = /^\d{7,9}$/;
    return dniRegex.test(dni);
  }


}
