import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';

// Componentes personalizados
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { CustomDialogRef } from '@shared/components/custom-form/custom-dialog/custom-dialog-ref';

// Servicios
import { AdminUsersService, CreateUserRequest } from '@core/services/admin/admin-users.service';
import { NotificationService } from '@shared/services/notification.service';

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
  isLoading = false;

  constructor(
    private usersService: AdminUsersService,
    private notificationService: NotificationService,
    @Optional() private dialogRef: CustomDialogRef
  ) {}

  ngOnInit(): void {
    console.log('CrearUsuarioDialogComponent inicializado');
  }

  onClose(): void {
    console.log('Cerrando diálogo de creación de usuario');

    // Simplemente delegar al dialogRef si está disponible
    if (this.dialogRef) {
      this.dialogRef.close(null);
    }
    // No hacemos nada más aquí, ya que el botón Cancelar en el formulario
    // ahora tiene su propia lógica para cerrar el diálogo
  }

  onConfirm(): void {
    // Este método no se usa directamente, pero es necesario para el diálogo
  }

  onSaveUser(userData: Record<string, unknown>): void {
    this.isLoading = true;

    // Construir el objeto de creación de usuario
    const createUserRequest: CreateUserRequest = {
      username: userData['dni'] as string, // Usar DNI como nombre de usuario
      email: userData['email'] as string,
      firstName: userData['nombre'] as string,
      lastName: userData['apellido'] as string,
      dni: userData['dni'] as string,
      cuit: userData['cuit'] as string || '',
      birthDate: userData['birthDate'] as Date,
      country: userData['country'] as string,
      province: userData['province'] as string,
      municipality: userData['municipality'] as string,
      legalAddress: userData['legalAddress'] as string,
      residentialAddress: userData['residentialAddress'] as string,
      password: userData['password'] as string,
      roles: userData['roles'] as string[],
      enabled: true,
      sendWelcomeEmail: true,
      telefono: userData['telefono'] as string || '',
      direccion: userData['direccion'] as string || ''
    };

    // Llamar al servicio para crear el usuario
    this.usersService.createUser(createUserRequest).subscribe({
      next: (newUser) => {
        this.isLoading = false;
        this.notificationService.success(`Usuario ${newUser.firstName} ${newUser.lastName} creado correctamente`);

        // Emitir un evento personalizado para notificar que se ha creado un usuario
        const event = new CustomEvent('userCreated', { detail: newUser });
        document.dispatchEvent(event);

        // Cerrar el diálogo con el resultado
        if (this.dialogRef) {
          this.dialogRef.close(newUser);
        } else {
          this.onClose();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creando usuario:', error);
        this.notificationService.error('Error al crear el usuario');
      }
    });
  }
}
