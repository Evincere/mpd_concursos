import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Componentes personalizados
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { TableColumn, SortEvent, PageEvent } from '@shared/components/custom-form/custom-table/custom-table.component';

// Componentes del módulo
import { UsuarioFiltrosComponent } from './usuario-filtros/usuario-filtros.component';
import { UsuarioDetalleComponent } from './usuario-detalle/usuario-detalle.component';
import { CrearUsuarioDialogComponent } from './crear-usuario-dialog/crear-usuario-dialog.component';
import { CustomConfirmDialogComponent } from '@shared/components/custom-confirm-dialog/custom-confirm-dialog.component';

// Servicios y modelos
import { UserService } from './application/services/user.service';
import { NotificationService } from '@shared/services/notification.service';
import { User, UserFilter, UserStatus, PaginatedUsersResponse } from './domain/models/user.model';
import { UserFilterEvent } from './domain/models/ui-events.model';

// Proveedores
import { USER_REPOSITORY_TOKEN } from './infrastructure/providers/user-service.provider';
import { OptimizedUserRepositoryAdapter } from './infrastructure/adapters/optimized-user-repository.adapter';

@Component({
  selector: 'app-usuarios-admin',
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule,
    UsuarioFiltrosComponent,
    UsuarioDetalleComponent
  ],
  // Proporcionar el servicio UserService y sus dependencias
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: OptimizedUserRepositoryAdapter
    },
    UserService
  ]
})
export class UsuariosAdminComponent implements OnInit, OnDestroy {
  // Exponer UserStatus para usar en el template
  UserStatus = UserStatus;
  // Datos
  usuarios: User[] = [];

  // Estado de la UI
  isLoading = false;
  selectedUserId: string | null = null;
  showUserDetail = false;

  // Paginación y ordenamiento
  totalUsuarios = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageSize = this.pageSizeOptions[0]; // Usar el primer valor de pageSizeOptions
  pageIndex = 0;

  // Filtros
  currentFilters: UserFilter = {
    // No aplicar filtro de estado por defecto para mostrar usuarios de todos los estados
  };

  // Columnas para la tabla
  tableColumns: TableColumn[] = [
    { property: 'username', header: 'Usuario', sortable: true },
    { property: 'fullName', header: 'Nombre Completo', sortable: true },
    { property: 'email', header: 'Email', sortable: true },
    { property: 'roles', header: 'Roles', sortable: false },
    { property: 'status', header: 'Estado', sortable: true },
    { property: 'createdAt', header: 'Fecha Creación', sortable: true },
    { property: 'actions', header: 'Acciones', sortable: false }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private dialogService: CustomDialogService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Hacer que el servicio de diálogo esté disponible globalmente para facilitar el cierre de diálogos
    (window as any).dialogService = this.dialogService;
  }

  ngOnInit(): void {
    // Suscribirse a los cambios en los datos de la ruta
    this.route.data
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('Datos de ruta recibidos:', data);

        // Si hay un estado en los datos de la ruta, aplicarlo como filtro
        if (data && data['status']) {
          // Asegurarse de que el estado esté en mayúsculas para consistencia
          const statusFilter = data['status'].toUpperCase();

          this.currentFilters = {
            ...this.currentFilters,
            status: statusFilter
          };
          console.log(`Filtro de estado aplicado desde la ruta: ${statusFilter}`);

          // Actualizar el selector visual para reflejar el estado actual
          setTimeout(() => {
            const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
            if (statusSelect) {
              statusSelect.value = statusFilter;
            }
          }, 100);
        } else {
          // Si no hay estado en la ruta, mostrar todos los usuarios
          // Eliminar el filtro de estado si existe
          const { status, ...restFilters } = this.currentFilters;
          this.currentFilters = restFilters;
          console.log('Mostrando todos los usuarios (sin filtro de estado)');

          // Actualizar el selector visual para reflejar que no hay filtro
          setTimeout(() => {
            const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
            if (statusSelect) {
              statusSelect.value = '';
            }
          }, 100);
        }

        // Cargar los usuarios con los filtros actualizados
        this.loadUsers();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Eliminar cualquier event listener que pueda haber quedado
    window.removeEventListener('dialog-closed', this.handleDialogClosed);
  }

  // Método para manejar el evento dialog-closed (para poder eliminarlo en ngOnDestroy)
  private handleDialogClosed = (event: any) => {
    // Este método está vacío porque cada instancia de deleteUser crea su propio listener
    // Pero necesitamos una referencia para poder eliminar listeners genéricos en ngOnDestroy
  }

  /**
   * Carga los usuarios con los filtros actuales
   */
  loadUsers(): void {
    this.isLoading = true;

    // Asegurarse de que los filtros incluyan la paginación actual
    const filters: UserFilter = {
      ...this.currentFilters,
      page: this.pageIndex,
      size: this.pageSize
    };

    // Limpiar filtros vacíos o nulos para evitar problemas en el backend
    Object.keys(filters).forEach(key => {
      const typedKey = key as keyof UserFilter;
      // Mantener el filtro de estado incluso si está vacío, para que el backend muestre todos los estados
      if (typedKey !== 'status' && (filters[typedKey] === '' || filters[typedKey] === null || filters[typedKey] === undefined)) {
        delete filters[typedKey];
      }
    });

    console.log('Cargando usuarios con filtros:', filters);

    // Verificar explícitamente si hay un filtro de estado
    if (filters.status) {
      console.log(`Filtrando por estado: ${filters.status}`);

      // Actualizar el selector visual para reflejar el estado actual
      setTimeout(() => {
        const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
        if (statusSelect && filters.status) {
          statusSelect.value = filters.status;
        }
      }, 100);

      // Asegurarse de que el parámetro status esté en mayúsculas para el backend
      filters.status = filters.status.toUpperCase();
    } else {
      // Si no hay filtro de estado, mostrar todos los estados
      console.log('No se está aplicando filtro de estado específico, mostrando todos los estados');

      // No establecer un valor por defecto para status, para que el backend muestre todos los estados
      // Esto es importante para que funcione correctamente cuando se navega a /admin/users sin filtro
    }

    // Invalidar cualquier caché que pueda existir
    if (window.caches) {
      window.caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('api') || cacheName.includes('users')) {
            console.log(`Intentando eliminar caché del navegador antes de cargar usuarios: ${cacheName}`);
            window.caches.delete(cacheName);
          }
        });
      });
    }

    // Añadir un timestamp a los filtros para evitar caché
    filters._t = new Date().getTime();

    // Forzar una pequeña espera para asegurarnos de que el backend haya procesado los cambios
    setTimeout(() => {
      this.userService.getUsers(filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginatedUsersResponse) => {
            // Aplicar filtro adicional en el frontend para asegurar que solo se muestren usuarios con el estado correcto
            let filteredUsers = response.users;
            let totalFiltered = response.total;

            // Si hay un filtro de estado, asegurarnos de que solo se muestren usuarios con ese estado
            if (filters.status) {
              const usersWithStatus = response.users.filter(user => user.status === filters.status);
              console.log(`Usuarios con estado ${filters.status}: ${usersWithStatus.length}`);

              // Si el backend no filtró correctamente, hacerlo en el frontend
              if (usersWithStatus.length !== response.users.length) {
                console.warn('El backend no filtró correctamente por estado. Aplicando filtro en el frontend.');
                filteredUsers = usersWithStatus;
                totalFiltered = usersWithStatus.length;
              }
            }

            this.usuarios = filteredUsers;
            this.totalUsuarios = totalFiltered;
            this.isLoading = false;
            console.log(`Usuarios cargados: ${filteredUsers.length} de ${totalFiltered} (después de filtrado adicional)`);
          },
          error: (error) => {
            console.error('Error cargando usuarios:', error);
            this.notificationService.error('Error al cargar usuarios');
            this.isLoading = false;
          }
        });
    }, 300); // Pequeña espera para asegurarnos de que el backend haya procesado los cambios
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: any): void {
    // Asegurarse de que event.column existe antes de asignarlo
    if (event && 'column' in event) {
      // Si ya estamos ordenando por esta columna, invertir la dirección
      if (this.currentFilters.sort === event.column) {
        this.currentFilters.direction = this.currentFilters.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // Si es una nueva columna, establecer la dirección a 'asc'
        this.currentFilters.sort = event.column;
        this.currentFilters.direction = 'asc';
      }
    } else {
      this.currentFilters.sort = '';
      this.currentFilters.direction = 'asc';
    }

    this.loadUsers();
  }

  /**
   * Maneja el evento de filtrado
   */
  onFilterChange(event: UserFilterEvent): void {
    // Crear un nuevo objeto de filtros para evitar referencias
    this.currentFilters = {
      // Mantener solo la paginación y ordenamiento del objeto actual
      page: this.pageIndex,
      size: this.pageSize,
      // Sobrescribir con los nuevos filtros
      ...event,
      // Añadir timestamp para evitar caché
      _t: new Date().getTime()
    };

    console.log('Filtros actualizados:', this.currentFilters);

    // Resetear a la primera página cuando se aplican filtros
    this.pageIndex = 0;
    this.loadUsers();
  }

  /**
   * Abre el diálogo para crear un nuevo usuario
   */
  openCreateUserDialog(): void {
    const dialogRef = this.dialogService.open(CrearUsuarioDialogComponent, {
      size: 'large',
      title: 'Crear Nuevo Usuario',
      icon: 'user-plus',
      showCloseButton: true,
      showFooter: false // No mostrar el footer del diálogo, ya que el formulario tiene sus propios botones
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.notificationService.success('Usuario creado correctamente');
      }
    });
  }

  /**
   * Abre el detalle de un usuario
   */
  openUserDetail(user: unknown): void {
    console.log('🔍 Intentando abrir detalle de usuario:', user);
    console.log('🔍 Estado actual - showUserDetail:', this.showUserDetail, 'selectedUserId:', this.selectedUserId);

    // Verificar que user es un objeto y tiene la propiedad id
    if (user && typeof user === 'object' && 'id' in user) {
      const userId = (user as User).id;
      console.log('✅ Usuario válido, ID:', userId);

      // Limpiar completamente el estado antes de abrir
      this.resetUserDialogState();

      // Usar setTimeout para asegurar que el estado se actualice completamente
      setTimeout(() => {
        this.selectedUserId = userId;
        this.showUserDetail = true;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        console.log('✅ Detalle de usuario abierto - showUserDetail:', this.showUserDetail, 'selectedUserId:', this.selectedUserId);
      }, 100);
    } else {
      console.error('❌ Error: El usuario no tiene un ID válido', user);
      this.notificationService.error('Error al abrir el detalle del usuario');
    }
  }

  /**
   * Cierra el detalle de un usuario
   */
  closeUserDetail(): void {
    console.log('🔒 Cerrando detalle de usuario - Estado antes:', { showUserDetail: this.showUserDetail, selectedUserId: this.selectedUserId });
    this.selectedUserId = null;
    this.showUserDetail = false;
    this.cdr.detectChanges();
    console.log('🔒 Detalle de usuario cerrado - Estado después:', { showUserDetail: this.showUserDetail, selectedUserId: this.selectedUserId });
  }

  /**
   * Limpia completamente el estado de los diálogos de usuario
   */
  private resetUserDialogState(): void {
    console.log('🧹 Limpiando estado completo de diálogos de usuario');
    this.selectedUserId = null;
    this.showUserDetail = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Método de debugging para verificar el estado actual
   */
  debugUserDetailState(): void {
    console.log('🐛 DEBUG - Estado actual:', {
      showUserDetail: this.showUserDetail,
      selectedUserId: this.selectedUserId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Edita un usuario
   */
  editUser(user: unknown): void {
    // Verificar que user es un objeto válido
    if (user && typeof user === 'object') {
      // Convertir a User si es posible
      try {
        const userObj = user as User;
        if (userObj.id) {
          // Limpiar completamente el estado antes de abrir el diálogo de edición
          this.resetUserDialogState();

          // Importar dinámicamente el componente de edición
          import('./editar-usuario-dialog/editar-usuario-dialog.component').then(module => {
            const EditarUsuarioDialogComponent = module.EditarUsuarioDialogComponent;

            // Abrir el diálogo de edición
            const dialogRef = this.dialogService.open(EditarUsuarioDialogComponent, {
              size: 'large',
              title: 'Editar Usuario',
              icon: 'user-edit',
              showCloseButton: true,
              showFooter: false, // No mostrar el footer del diálogo, ya que el formulario tiene sus propios botones
              data: {
                usuario: userObj
              }
            });

            // Suscribirse al evento de cierre del diálogo
            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                console.log('Usuario actualizado, recargando lista de usuarios');
                // Recargar la lista de usuarios
                this.loadUsers();
                this.notificationService.success('Usuario actualizado correctamente');
              } else {
                // Si se canceló la edición, simplemente cerrar todo y volver a la lista
                console.log('Edición cancelada, volviendo a la lista de usuarios');
                // Asegurar que el estado esté completamente limpio
                this.resetUserDialogState();
              }
            });
          });
        } else {
          throw new Error('El usuario no tiene un ID válido');
        }
      } catch (error) {
        console.error('Error al procesar el usuario para edición:', error);
        this.notificationService.error('Error al editar el usuario');
      }
    } else {
      console.error('Error: El objeto de usuario no es válido', user);
      this.notificationService.error('Error al editar el usuario');
    }
  }

  /**
   * Cambia el estado de un usuario
   */
  changeUserStatus(user: User, newStatus: UserStatus): void {
    this.isLoading = true;

    console.log(`Cambiando estado del usuario ${user.id} a ${newStatus}`);

    // Crear objeto de solicitud con todos los datos necesarios
    const statusChangeRequest = {
      userId: user.id,
      status: newStatus,
      reason: `Estado cambiado por administrador a ${newStatus}`
    };

    this.userService.changeUserStatus(statusChangeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          console.log('Usuario actualizado correctamente:', updatedUser);

          // Forzar una recarga completa de la lista de usuarios
          console.log('Forzando recarga completa de la lista de usuarios después de cambiar el estado');

          // Invalidar cualquier caché que pueda existir
          if (window.caches) {
            window.caches.keys().then(cacheNames => {
              cacheNames.forEach(cacheName => {
                if (cacheName.includes('api') || cacheName.includes('users')) {
                  console.log(`Intentando eliminar caché del navegador: ${cacheName}`);
                  window.caches.delete(cacheName);
                }
              });
            });
          }

          // Esperar un momento para asegurar que el backend haya procesado el cambio
          setTimeout(() => {
            // Recargar la lista de usuarios con los filtros actuales
            this.loadUsers();
          }, 500);

          // Determinar qué hacer según el filtro de estado actual
          const currentStatus = this.currentFilters.status;

          if (!currentStatus) {
            // Si no hay filtro de estado (mostrando todos), simplemente recargar
            this.loadUsers();
          }
          else if (currentStatus === newStatus) {
            // Si estamos filtrando por el mismo estado al que cambiamos, recargar
            this.loadUsers();
          }
          else {
            // Si estamos filtrando por un estado diferente, el usuario ya no debería aparecer en esta vista

            // Opción 1: Mantener el filtro actual y eliminar el usuario de la vista local
            if (this.usuarios && this.usuarios.length > 0) {
              const index = this.usuarios.findIndex(u => u.id === user.id);
              if (index !== -1) {
                // Eliminar el usuario de la lista local
                this.usuarios = [
                  ...this.usuarios.slice(0, index),
                  ...this.usuarios.slice(index + 1)
                ];

                // Actualizar el total de usuarios
                this.totalUsuarios--;

                // Mostrar notificación
                this.notificationService.info(
                  `El usuario ha sido eliminado de esta vista porque su estado ha cambiado a ${this.getStatusText(newStatus)}`
                );
              }
            }

            // Opción 2 (alternativa): Cambiar automáticamente al nuevo filtro para seguir viendo el usuario
            // Descomentar si prefieres esta opción
            /*
            // Cambiar el filtro al nuevo estado
            this.currentFilters.status = newStatus;

            // Actualizar el selector de estado
            setTimeout(() => {
              const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
              if (statusSelect) {
                statusSelect.value = newStatus;
              }
            }, 100);

            // Recargar con el nuevo filtro
            this.loadUsers();

            // Mostrar notificación
            this.notificationService.info(
              `Filtro cambiado a "${this.getStatusText(newStatus)}" para seguir viendo el usuario actualizado`
            );
            */
          }

          this.notificationService.success(`Estado del usuario cambiado a ${this.getStatusText(newStatus)}`);
        },
        error: (error) => {
          console.error('Error cambiando estado del usuario:', error);

          // Mensaje de error más descriptivo
          let errorMessage = 'Error al cambiar el estado del usuario';

          if (error.status === 404) {
            errorMessage = 'No se encontró el endpoint para cambiar el estado del usuario';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para cambiar el estado del usuario';
          } else if (error.status === 400) {
            errorMessage = 'Datos inválidos para cambiar el estado del usuario';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al cambiar el estado del usuario';
          }

          this.notificationService.error(errorMessage);
          this.isLoading = false;
        }
      });
  }

  /**
   * Elimina un usuario
   */
  deleteUser(user: User): void {
    // Guardar referencia al usuario actual para usar en el evento
    const currentUser = user;

    // Mostrar diálogo de confirmación personalizado
    this.dialogService.open(CustomConfirmDialogComponent, {
      title: 'Eliminar Usuario',
      size: 'small',
      showCloseButton: true,
      showFooter: false,
      data: {
        message: `¿Está seguro que desea eliminar al usuario ${currentUser.username}?`,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'danger',
        cancelButtonColor: 'primary'
      }
    });

    // Escuchar el evento personalizado para la confirmación
    const dialogClosedListener = (event: any) => {
      // Verificar que el evento tenga el detalle esperado
      if (event.detail && event.detail.result === true) {
        console.log(`Confirmado: Eliminando usuario con ID: ${currentUser.id}`);
        this.isLoading = true;

        // Eliminar el listener para evitar duplicados
        window.removeEventListener('dialog-closed', dialogClosedListener);

        // Proceder con la eliminación
        this.userService.deleteUser(currentUser.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              console.log('Resultado de eliminación:', result);
              this.loadUsers();
              this.notificationService.success('Usuario eliminado correctamente');
            },
            error: (error) => {
              console.error('Error eliminando usuario:', error);
              this.notificationService.error('Error al eliminar el usuario');
              this.isLoading = false;
            }
          });
      } else if (event.detail) {
        // Si el resultado es false, solo eliminar el listener
        window.removeEventListener('dialog-closed', dialogClosedListener);
      }
    };

    // Añadir el listener para el evento personalizado
    window.addEventListener('dialog-closed', dialogClosedListener);
  }

  /**
   * Obtiene la clase CSS para el estado del usuario
   */
  getStatusClass(status: UserStatus | string): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'status-active';
      case UserStatus.INACTIVE:
        return 'status-inactive';
      case UserStatus.BLOCKED:
        return 'status-blocked';
      case UserStatus.LOCKED:
        return 'status-locked';
      case UserStatus.EXPIRED:
        return 'status-expired';
      default:
        // Intentar mapear el string a un estado conocido
        if (typeof status === 'string') {
          if (status.toUpperCase() === 'ACTIVE') return 'status-active';
          if (status.toUpperCase() === 'INACTIVE') return 'status-inactive';
          if (status.toUpperCase() === 'BLOCKED') return 'status-blocked';
          if (status.toUpperCase() === 'LOCKED') return 'status-locked';
          if (status.toUpperCase() === 'EXPIRED') return 'status-expired';
        }
        return '';
    }
  }

  /**
   * Obtiene el texto para el estado del usuario
   */
  getStatusText(status: UserStatus | string): string {
    switch (status) {
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
        return status as string;
    }
  }

  /**
   * Obtiene la clase CSS para el badge de rol basado en el tipo de rol
   * Implementa colores distintivos para diferentes roles siguiendo el sistema glassmorphism
   */
  getRoleClass(role: string): string {
    const roleType = role.replace('ROLE_', '').toLowerCase();

    switch (roleType) {
      case 'admin':
      case 'administrator':
        return 'role-admin'; // Rojo - Máximo privilegio
      case 'moderator':
      case 'mod':
        return 'role-moderator'; // Verde - Privilegios moderados
      case 'user':
      case 'usuario':
        return 'role-user'; // Azul - Usuario estándar
      case 'guest':
      case 'invitado':
        return 'role-guest'; // Gris - Acceso limitado
      case 'editor':
        return 'role-editor'; // Naranja - Permisos de edición
      case 'viewer':
      case 'visualizador':
        return 'role-viewer'; // Cyan - Solo lectura
      default:
        return 'role-default'; // Color por defecto
    }
  }

  /**
   * Obtiene el número total de páginas
   */
  getTotalPages(): number {
    return Math.ceil(this.totalUsuarios / this.pageSize);
  }

  /**
   * Obtiene las páginas visibles para la paginación
   */
  getVisiblePages(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.pageIndex;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  /**
   * Maneja el cambio de tamaño de página
   */
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.pageIndex = 0; // Reset to first page

    this.onPageChange({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  /**
   * Maneja el cambio rápido de filtro de estado
   */
  onQuickStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const statusValue = select.value;

    console.log('Filtro rápido de estado cambiado a:', statusValue || 'Todos');

    // Actualizar la URL para reflejar el filtro seleccionado
    if (statusValue) {
      // Si hay un valor de estado, navegar a la ruta correspondiente
      let targetRoute = '';

      switch (statusValue) {
        case UserStatus.ACTIVE:
          targetRoute = '/admin/usuarios/activos';
          break;
        case UserStatus.INACTIVE:
          targetRoute = '/admin/usuarios/inactivos';
          break;
        case UserStatus.BLOCKED:
          targetRoute = '/admin/usuarios/bloqueados';
          break;
        case UserStatus.LOCKED:
          targetRoute = '/admin/usuarios/bloqueados-temporalmente';
          break;
        case UserStatus.EXPIRED:
          targetRoute = '/admin/usuarios/expirados';
          break;
        default:
          targetRoute = `/admin/usuarios/${statusValue.toLowerCase()}`;
      }

      // Navegar a la ruta correspondiente (esto activará la suscripción a route.data)
      this.router.navigate([targetRoute]);

      // Mostrar notificación del filtro aplicado
      this.notificationService.info(`Mostrando usuarios con estado: ${this.getStatusText(statusValue)}`);
    } else {
      // Si el valor está vacío, navegar a la ruta base de usuarios
      this.router.navigate(['/admin/usuarios']);

      // Mostrar notificación
      this.notificationService.info('Mostrando usuarios de todos los estados');
    }

    // No es necesario actualizar manualmente los filtros ni cargar los usuarios
    // ya que la navegación activará la suscripción a route.data que se encargará de eso
  }

  /**
   * Limpia el filtro de estado y muestra todos los usuarios
   */
  clearStatusFilter(): void {
    // Navegar a la ruta base de usuarios (corregida a /admin/usuarios)
    this.router.navigate(['/admin/usuarios']);

    // Actualizar el selector para reflejar el cambio
    setTimeout(() => {
      const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
      if (statusSelect) {
        statusSelect.value = '';
      }
    }, 100);

    // Mostrar notificación
    this.notificationService.info('Mostrando usuarios de todos los estados');
  }
}
