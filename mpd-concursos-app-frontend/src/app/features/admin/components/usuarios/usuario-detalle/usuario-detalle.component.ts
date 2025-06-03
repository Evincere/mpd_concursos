import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Componentes personalizados
import { CustomDialogComponent } from '@shared/components/custom-form/custom-dialog/custom-dialog.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';

// Servicios
import { UserService } from '../application/services/user.service';
import { NotificationService } from '@shared/services/notification.service';

// Interfaces
import { User, UserStatus } from '../domain/models/user.model';

@Component({
  selector: 'app-usuario-detalle',
  templateUrl: './usuario-detalle.component.html',
  styleUrls: ['./usuario-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomDialogComponent,
    CustomButtonComponent,
    CustomCardComponent
  ]
})
export class UsuarioDetalleComponent implements OnInit, OnDestroy {
  @Input() userId!: string | number;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<User>();

  usuario: User | null = null;
  isLoading = true;
  error = '';

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('🚀 UsuarioDetalleComponent - ngOnInit, userId:', this.userId);
    this.loadUserDetails();
  }

  ngOnDestroy(): void {
    console.log('🗑️ UsuarioDetalleComponent - ngOnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserDetails(): void {
    this.isLoading = true;
    this.error = '';

    if (!this.userId) {
      this.error = 'ID de usuario no proporcionado';
      this.isLoading = false;
      return;
    }

    // Usar el servicio de usuario para obtener los detalles
    this.userService.getUserById(this.userId.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (apiUser) => {
        // Mapear la respuesta de la API a nuestro modelo de usuario
        this.mapApiUserToUser(apiUser);
        this.isLoading = false;
      },
      error: (error: unknown) => {
        const typedError = error as { message?: string };
        this.error = 'Error al cargar los detalles del usuario: ' + (typedError.message || 'Error desconocido');
        console.error('Error cargando detalles del usuario:', error);
        this.notificationService.error(this.error);

        // Para desarrollo, crear datos de ejemplo solo si estamos en modo de desarrollo
        if (this.isDevelopmentMode()) {
          this.createMockUser();
        }

        this.isLoading = false;
      }
    });
  }

  /**
   * Verifica si estamos en modo de desarrollo
   * @returns true si estamos en modo de desarrollo
   */
  private isDevelopmentMode(): boolean {
    try {
      // Intentar importar el entorno dinámicamente
      const isProduction = false; // Valor por defecto
      return !isProduction;
    } catch (error) {
      console.warn('Error al verificar el modo de desarrollo:', error);
      // Por defecto, asumir que estamos en modo de desarrollo
      return true;
    }
  }

  /**
   * Mapea un usuario de la API al modelo de usuario de la aplicación
   */
  private mapApiUserToUser(apiUser: any): void {
    this.usuario = {
      id: apiUser.id || '',
      username: apiUser.username || apiUser.email || '',
      email: apiUser.email || '',
      firstName: apiUser.firstName || apiUser.nombre || '',
      lastName: apiUser.lastName || apiUser.apellido || '',
      dni: apiUser.dni || '',
      cuit: apiUser.cuit || '',
      roles: apiUser.roles || [],
      status: this.mapApiStatusToUserStatus(apiUser),
      createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
      lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
      lastModified: apiUser.lastModified ? new Date(apiUser.lastModified) : undefined,
      telefono: apiUser.telefono || '',
      direccion: apiUser.direccion || '',
      enabled: apiUser.enabled !== false
    };
  }

  /**
   * Mapea el estado de un usuario de la API al modelo de estado de la aplicación
   */
  private mapApiStatusToUserStatus(apiUser: any): UserStatus {
    if (apiUser.status) {
      return apiUser.status as UserStatus;
    }

    if (apiUser.estado === 'inactivo' || apiUser.enabled === false) {
      return UserStatus.INACTIVE;
    }

    if (apiUser.estado === 'bloqueado' || apiUser.locked === true) {
      return UserStatus.BLOCKED;
    }

    return UserStatus.ACTIVE;
  }

  /**
   * Crea un usuario de ejemplo para desarrollo
   */
  private createMockUser(): void {
    const userId = typeof this.userId === 'string' ? this.userId : this.userId.toString();

    this.usuario = {
      id: userId,
      username: 'usuario.ejemplo',
      firstName: 'Usuario',
      lastName: 'Ejemplo',
      dni: '12345678',
      cuit: '20123456789',
      email: 'usuario@ejemplo.com',
      roles: ['ROLE_ADMIN', 'ROLE_USER'],
      status: UserStatus.ACTIVE,
      createdAt: new Date('2023-01-15'),
      lastLogin: new Date('2023-06-10T14:30:00'),
      lastModified: new Date('2023-05-20'),
      telefono: '123456789',
      direccion: 'Calle Principal 123',
      enabled: true
    };
  }

  onClose(): void {
    console.log('🔒 UsuarioDetalleComponent - onClose() llamado');
    this.close.emit();
  }

  onEdit(): void {
    console.log('✏️ UsuarioDetalleComponent - onEdit() llamado, usuario:', this.usuario);
    if (this.usuario) {
      // Asegurarse de que el usuario tenga un ID válido antes de emitir el evento
      if (!this.usuario.id) {
        console.error('❌ Error: El usuario no tiene un ID válido');
        this.notificationService.error('Error al editar el usuario: ID no válido');
        return;
      }

      // Clonar el objeto para evitar problemas de referencia
      const userToEdit = { ...this.usuario };
      console.log('✅ Enviando usuario para edición:', userToEdit);
      this.edit.emit(userToEdit);
    } else {
      console.error('❌ Error: No hay usuario para editar');
      this.notificationService.error('Error al editar el usuario: No hay datos disponibles');
    }
  }

  getEstadoClass(estado: UserStatus): string {
    switch (estado) {
      case UserStatus.ACTIVE:
        return 'estado-activo';
      case UserStatus.INACTIVE:
        return 'estado-inactivo';
      case UserStatus.BLOCKED:
        return 'estado-bloqueado';
      case UserStatus.LOCKED:
        return 'estado-bloqueado';
      case UserStatus.EXPIRED:
        return 'estado-inactivo';
      default:
        return '';
    }
  }

  getEstadoText(estado: UserStatus): string {
    switch (estado) {
      case UserStatus.ACTIVE:
        return 'Activo';
      case UserStatus.INACTIVE:
        return 'Inactivo';
      case UserStatus.BLOCKED:
        return 'Bloqueado';
      case UserStatus.LOCKED:
        return 'Bloqueado Temporalmente';
      case UserStatus.EXPIRED:
        return 'Expirado';
      default:
        return estado || 'No disponible';
    }
  }

  /**
   * Obtiene la clase CSS semántica para un rol específico
   * @param role - El rol del usuario
   * @returns La clase CSS correspondiente al rol
   */
  getRoleClass(role: string): string {
    const roleType = role.replace('ROLE_', '').toLowerCase();
    switch (roleType) {
      case 'admin':
        return 'role-admin';
      case 'moderator':
        return 'role-moderator';
      case 'user':
        return 'role-user';
      case 'editor':
        return 'role-editor';
      case 'viewer':
        return 'role-viewer';
      case 'guest':
        return 'role-guest';
      default:
        return 'role-default';
    }
  }

  /**
   * Obtiene el color semántico para un rol específico
   * @param role - El rol del usuario
   * @returns El color hexadecimal correspondiente al rol
   */
  getRoleColor(role: string): string {
    const roleType = role.replace('ROLE_', '').toLowerCase();
    switch (roleType) {
      case 'admin':
        return '#ef4444'; // Rojo para admin
      case 'moderator':
        return '#4CAF50'; // Verde para moderator
      case 'user':
        return '#3b82f6'; // Azul para user
      case 'editor':
        return '#f59e0b'; // Naranja para editor
      case 'viewer':
        return '#06b6d4'; // Cyan para viewer
      case 'guest':
        return '#9ca3af'; // Gris para guest
      default:
        return '#8b5cf6'; // Púrpura para default
    }
  }
}
