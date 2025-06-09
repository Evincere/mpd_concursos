import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Custom Components
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { TableColumn, SortEvent, PageEvent } from '@shared/components/custom-form/custom-table/custom-table.component';

// Module Components
import { UsuarioFiltrosComponent } from './usuario-filtros/usuario-filtros.component';
import { UsuarioDetalleComponent } from './usuario-detalle/usuario-detalle.component';
import { CrearUsuarioDialogComponent } from './crear-usuario-dialog/crear-usuario-dialog.component';
import { CustomConfirmDialogComponent } from '@shared/components/custom-confirm-dialog/custom-confirm-dialog.component';

// Services and Models
import { UserService } from './application/services/user.service';
import { NotificationService } from '@shared/services/notification.service'; // Assuming NotificationService is in this path
import { User, UserFilter, UserStatus, PaginatedUsersResponse, UserStatusChangeRequest } from './domain/models/user.model';
import { UserFilterEvent } from './domain/models/ui-events.model';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

// Providers
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
  // Provide UserService and its dependencies
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: OptimizedUserRepositoryAdapter
    },
    UserService
  ]
})
export class UsuariosAdminComponent implements OnInit, OnDestroy {
  // Expose UserStatus for use in the template
  UserStatus = UserStatus;
  // Data
  usuarios: User[] = [];

  // UI State
  isLoading = false;
  selectedUserId: string | null = null;
  showUserDetail = false;

  // Pagination and sorting
  totalUsuarios = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageSize = this.pageSizeOptions[0];
  pageIndex = 0;

  // Filters
  currentFilters: UserFilter = {}; // No status filter by default to show users of all statuses

  // Table columns
  tableColumns: TableColumn[] = [
    { property: 'username', header: 'Usuario', sortable: true },
    { property: 'fullName', header: 'Nombre Completo', sortable: true },
    { property: 'email', header: 'Email', sortable: true },
    { property: 'roles', header: 'Roles', sortable: false },
    { property: 'status', header: 'Estado', sortable: true },
    { property: 'createdAt', header: 'Fecha Creación', sortable: true },
    { property: 'actions', header: 'Acciones', sortable: false }
  ];

  // For cleaning up subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private dialogService: CustomDialogService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    // Make the dialog service globally available for easy closing of dialogs
    (window as any).dialogService = this.dialogService;
  }

  ngOnInit(): void {
    this.loggingService.debug('[UsuariosAdminComponent] Initializing component.', undefined, 'UsersAdmin');

    // Subscribe to route data changes to apply status filters from URL
    this.route.data
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.loggingService.debug('[UsuariosAdminComponent] Route data changed:', data, 'UsersAdmin');
        const statusFromRoute = data['status'] as UserStatus | undefined;

        if (statusFromRoute) {
          const statusFilter = statusFromRoute.toUpperCase() as UserStatus;
          this.currentFilters = {
            ...this.currentFilters,
            status: statusFilter
          };
          this.loggingService.info(`[UsuariosAdminComponent] Applying status filter from route: ${statusFilter}`, undefined, 'UsersAdmin');

          // Update the status select element in the DOM
          setTimeout(() => {
            const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
            if (statusSelect) {
              statusSelect.value = statusFilter;
              this.loggingService.debug(`[UsuariosAdminComponent] Updated status select to: ${statusFilter}`, undefined, 'UsersAdmin');
            }
          }, 100);
        } else {
          // If no status in route, show all users
          const { status, ...restFilters } = this.currentFilters;
          this.currentFilters = restFilters; // Remove status filter if present
          this.loggingService.info('[UsuariosAdminComponent] No status filter from route. Showing all users.', undefined, 'UsersAdmin');

          // Reset the status select element in the DOM
          setTimeout(() => {
            const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
            if (statusSelect) {
              statusSelect.value = ''; // Set to default/empty option
              this.loggingService.debug('[UsuariosAdminComponent] Reset status select to empty.', undefined, 'UsersAdmin');
            }
          }, 100);
        }

        // Load users with updated filters
        this.loadUsers();
      });

    // Add a generic listener for dialog closed events (can be removed in ngOnDestroy if needed)
    window.addEventListener('dialog-closed', this.handleDialogClosed);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loggingService.debug('[UsuariosAdminComponent] Component destroyed. Subscriptions cleaned.', undefined, 'UsersAdmin');

    // Remove any event listener that might have remained
    window.removeEventListener('dialog-closed', this.handleDialogClosed);
  }

  // Method to handle the dialog-closed event (to be able to remove it in ngOnDestroy)
  private handleDialogClosed = (event: any) => {
    // This method is intentionally left empty. Its purpose is to provide a function reference
    // for `removeEventListener` in `ngOnDestroy`. Specific dialog handling is done in `dialogRef.afterClosed().subscribe`.
    this.loggingService.debug('[UsuariosAdminComponent] Generic dialog closed event caught.', event.detail, 'UsersAdmin');
  };

  /**
   * Loads users based on current filters, pagination, and sorting.
   */
  loadUsers(): void {
    this.isLoading = true;
    this.loggingService.info('[UsuariosAdminComponent] Loading users...', {
      page: this.pageIndex,
      size: this.pageSize,
      filters: this.currentFilters
    }, 'UsersAdmin');

    // Ensure filters include current pagination
    const filters: UserFilter = {
      ...this.currentFilters,
      page: this.pageIndex,
      size: this.pageSize
    };

    // Clean empty or null filters to avoid backend issues
    Object.keys(filters).forEach(key => {
      const typedKey = key as keyof UserFilter;
      // Keep status filter even if it's empty, so the backend can show all statuses
      if (typedKey !== 'status' && (filters[typedKey] === '' || filters[typedKey] === null || filters[typedKey] === undefined)) {
        delete filters[typedKey];
      }
    });

    // Ensure status parameter is uppercase for the backend if it exists
    if (filters.status) {
      filters.status = (filters.status as string).toUpperCase();
      this.loggingService.debug(`[UsuariosAdminComponent] Normalized status filter to uppercase: ${filters.status}`, undefined, 'UsersAdmin');
    }

    // Add a timestamp to filters to prevent caching issues in some scenarios
    filters._t = new Date().getTime();

    // Force a small delay to ensure backend has processed changes or for UI responsiveness
    setTimeout(() => {
      this.userService.getUsers(filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginatedUsersResponse) => {
            this.loggingService.debug('[UsuariosAdminComponent] Users loaded successfully from backend:', response, 'UsersAdmin');

            let filteredUsers = response.users;
            let totalFiltered = response.total;

            // Frontend filtering for robustness (if backend sometimes doesn't perfectly filter)
            if (filters.status) {
              const usersWithStatus = response.users.filter(user => user.status === filters.status);
              if (usersWithStatus.length !== response.users.length) {
                this.loggingService.warn(`[UsuariosAdminComponent] Frontend filtering applied: ${usersWithStatus.length} of ${response.users.length} matched status ${filters.status}.`, undefined, 'UsersAdmin');
              }
              filteredUsers = usersWithStatus;
              totalFiltered = usersWithStatus.length; // Adjust total if frontend filtering is applied
            }

            this.usuarios = filteredUsers;
            this.totalUsuarios = totalFiltered;
            this.isLoading = false;
            this.cdr.detectChanges(); // Manually trigger change detection
            this.loggingService.info(`[UsuariosAdminComponent] Displaying ${this.usuarios.length} users. Total: ${this.totalUsuarios}`, undefined, 'UsersAdmin');
          },
          error: (error) => {
            this.loggingService.error('[UsuariosAdminComponent] Error loading users:', error, 'UsersAdmin');
            this.notificationService.error('Error al cargar usuarios');
            this.isLoading = false;
          }
        });
    }, 300); // Small delay to ensure backend has processed changes
  }

  /**
   * Handles page change events.
   * @param event The page event.
   */
  onPageChange(event: PageEvent): void {
    this.loggingService.debug('[UsuariosAdminComponent] Page changed event:', event, 'UsersAdmin');
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  /**
   * Handles sort change events.
   * @param event The sort event.
   */
  onSortChange(event: SortEvent | {column: string, direction: string}): void {
    this.loggingService.debug('[UsuariosAdminComponent] Sort changed event:', event, 'UsersAdmin');

    let column: string;
    let direction: string;

    // Handle both SortEvent interface and legacy column/direction format
    if ('property' in event) {
      column = event.property;
      direction = event.direction;
    } else if ('column' in event) {
      column = event.column;
      direction = event.direction;
    } else {
      // Reset sorting if event is invalid
      this.currentFilters.sort = undefined;
      this.currentFilters.direction = undefined;
      this.loadUsers();
      return;
    }

    // If already sorting by this column, reverse direction
    if (this.currentFilters.sort === column) {
      this.currentFilters.direction = this.currentFilters.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // If it's a new column, set direction to 'asc'
      this.currentFilters.sort = column;
      this.currentFilters.direction = 'asc';
    }

    this.loadUsers();
  }

  /**
   * Handles filter change events from the filter component.
   * @param event The user filter event.
   */
  onFilterChange(event: UserFilterEvent): void {
    this.loggingService.debug('[UsuariosAdminComponent] Filter changed event:', event, 'UsersAdmin');
    // Create a new filters object to avoid reference issues
    this.currentFilters = {
      // Keep only pagination and sorting from current object
      page: 0, // Reset to first page on new filter
      size: this.pageSize,
      sort: this.currentFilters.sort,
      direction: this.currentFilters.direction,
      // Overwrite with new filters
      ...event,
      // Add timestamp to prevent caching
      _t: new Date().getTime()
    };
    this.pageIndex = 0; // Reset page index when filters change
    this.loadUsers();
  }

  /**
   * Opens the dialog to create a new user.
   */
  openCreateUserDialog(): void {
    this.loggingService.info('[UsuariosAdminComponent] Opening create user dialog.', undefined, 'UsersAdmin');
    const dialogRef = this.dialogService.open(CrearUsuarioDialogComponent, {
      size: 'large',
      title: 'Crear Nuevo Usuario',
      icon: 'user-plus',
      showCloseButton: true,
      showFooter: false // Do not show dialog footer, as the form has its own buttons
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loggingService.info('[UsuariosAdminComponent] Create user dialog closed with success. Reloading users.', result, 'UsersAdmin');
        this.loadUsers();
        this.notificationService.success('Usuario creado correctamente');
      } else {
        this.loggingService.debug('[UsuariosAdminComponent] Create user dialog cancelled or closed without result.', undefined, 'UsersAdmin');
      }
    });
  }

  /**
   * Opens the detail view of a user.
   * @param user The user object to display details for.
   */
  openUserDetail(user: User): void {
    this.loggingService.info('[UsuariosAdminComponent] Opening user detail for:', user, 'UsersAdmin');
    const userId = (user as any).id; // Access 'id' property
    if (userId) {
      this.loggingService.debug(`[UsuariosAdminComponent] Selected user ID for detail: ${userId}`, undefined, 'UsersAdmin');
      // Use setTimeout to ensure state is fully updated before showing detail
      setTimeout(() => {
        this.selectedUserId = userId;
        this.showUserDetail = true;
        this.cdr.markForCheck(); // Mark for change detection if needed
        this.cdr.detectChanges(); // Force change detection
        this.loggingService.debug('[UsuariosAdminComponent] User detail component set to visible.', undefined, 'UsersAdmin');
      }, 0); // Use 0ms timeout for immediate next tick execution
    } else {
      this.loggingService.error('[UsuariosAdminComponent] Error: User object does not have a valid ID for detail view.', user, 'UsersAdmin');
      this.notificationService.error('Error al abrir el detalle del usuario');
    }
  }

  /**
   * Closes the user detail view.
   */
  closeUserDetail(): void {
    this.loggingService.info('[UsuariosAdminComponent] Closing user detail.', undefined, 'UsersAdmin');
    this.selectedUserId = null;
    this.showUserDetail = false;
    this.cdr.detectChanges(); // Force change detection to hide the component
    this.loggingService.debug('[UsuariosAdminComponent] User detail component hidden.', undefined, 'UsersAdmin');
  }

  /**
   * Opens the dialog to edit a user.
   * @param user The user object to edit.
   */
  editUser(user: User): void {
    this.loggingService.info('[UsuariosAdminComponent] Opening edit user dialog for:', user, 'UsersAdmin');
    try {
      const userObj: User = user; // Ensure it's treated as a User object
      if (userObj.id) {
        // Dynamically import the edit user component
        import('./editar-usuario-dialog/editar-usuario-dialog.component').then(module => {
          const EditarUsuarioDialogComponent = module.EditarUsuarioDialogComponent;

          // Open the edit dialog
          const dialogRef = this.dialogService.open(EditarUsuarioDialogComponent, {
            size: 'large',
            title: 'Editar Usuario',
            icon: 'user-edit',
            showCloseButton: true,
            showFooter: false, // Do not show dialog footer, as the form has its own buttons
            data: {
              usuario: userObj
            }
          });

          // Subscribe to dialog close event
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.loggingService.info('[UsuariosAdminComponent] Edit user dialog closed with success. Reloading users.', result, 'UsersAdmin');
              this.loadUsers();
              this.notificationService.success('Usuario actualizado correctamente');
            } else {
              this.loggingService.debug('[UsuariosAdminComponent] Edit user dialog cancelled or closed without result.', undefined, 'UsersAdmin');
            }
          });
        });
      } else {
        throw new Error('El usuario no tiene un ID válido para edición.');
      }
    } catch (error) {
      this.loggingService.error('[UsuariosAdminComponent] Error processing user for edit:', error, 'UsersAdmin');
      this.notificationService.error('Error al editar el usuario');
    }
  }

  /**
   * Changes the status of a user.
   * @param user The user whose status is to be changed.
   * @param newStatus The new status to set.
   */
  changeUserStatus(user: User, newStatus: UserStatus): void {
    this.isLoading = true;
    this.loggingService.info(`[UsuariosAdminComponent] Attempting to change status for user ${user.id} to ${newStatus}`, undefined, 'UsersAdmin');

    const statusChangeRequest: UserStatusChangeRequest = {
      userId: user.id,
      status: newStatus
    };

    this.userService.changeUserStatus(statusChangeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.loggingService.info(`[UsuariosAdminComponent] User ${user.id} status changed successfully to ${newStatus}.`, updatedUser, 'UsersAdmin');
          this.notificationService.success(`Estado del usuario cambiado a ${this.getStatusText(newStatus)}`);

          // Determine what to do based on the current status filter
          const currentStatusFilter = this.currentFilters.status;

          if (!currentStatusFilter) {
            // If no status filter (showing all), simply reload
            this.loggingService.debug('[UsuariosAdminComponent] No status filter active, reloading all users.', undefined, 'UsersAdmin');
            this.loadUsers();
          } else if (currentStatusFilter === newStatus) {
            // If filtering by the same status we changed to, reload
            this.loggingService.debug(`[UsuariosAdminComponent] Status filter matches new status (${newStatus}), reloading users.`, undefined, 'UsersAdmin');
            this.loadUsers();
          } else {
            // If filtering by a different status, the user should no longer appear in this view
            this.loggingService.debug(`[UsuariosAdminComponent] User's new status (${newStatus}) does not match current filter (${currentStatusFilter}). Removing from local view.`, undefined, 'UsersAdmin');

            if (this.usuarios && this.usuarios.length > 0) {
              const index = this.usuarios.findIndex(u => u.id === user.id);
              if (index !== -1) {
                // Remove the user from the local list
                this.usuarios = [
                  ...this.usuarios.slice(0, index),
                  ...this.usuarios.slice(index + 1)
                ];

                // Update total users count
                this.totalUsuarios--;

                // Show notification
                this.notificationService.info(
                  `El usuario ha sido eliminado de esta vista porque su estado ha cambiado a ${this.getStatusText(newStatus)}`
                );
              }
            }
            // Optional: If you prefer to automatically switch filter to new status:
            /*
            this.currentFilters.status = newStatus;
            setTimeout(() => {
              const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
              if (statusSelect) {
                statusSelect.value = newStatus;
              }
            }, 100);
            this.loadUsers();
            this.notificationService.info(
              `Filtro cambiado a "${this.getStatusText(newStatus)}" para seguir viendo el usuario actualizado`
            );
            */
          }
          this.isLoading = false; // Ensure loading state is reset
        },
        error: (error) => {
          this.loggingService.error(`[UsuariosAdminComponent] Error changing status for user ${user.id}:`, error, 'UsersAdmin');
          console.error('Error cambiando estado del usuario:', error);

          let errorMessage = 'Error al cambiar el estado del usuario.';

          if (error.status === 404) {
            errorMessage = 'No se encontró el usuario o el endpoint para cambiar el estado.';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para cambiar el estado de este usuario.';
          } else if (error.status === 400) {
            errorMessage = 'Datos inválidos para cambiar el estado del usuario. Verifique la solicitud.';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al cambiar el estado del usuario. Intente más tarde.';
          }

          this.notificationService.error(errorMessage);
          this.isLoading = false;
        }
      });
  }

  /**
   * Deletes a user after confirmation.
   * @param user The user to delete.
   */
  deleteUser(user: User): void {
    const currentUser = user;
    this.loggingService.info(`[UsuariosAdminComponent] Attempting to delete user: ${currentUser.id}`, undefined, 'UsersAdmin');

    // Show custom confirmation dialog
    const dialogRef = this.dialogService.open(CustomConfirmDialogComponent, {
      title: 'Eliminar Usuario',
      size: 'small',
      showCloseButton: true,
      showFooter: false, // Dialog component will handle its own footer/buttons
      data: {
        message: `¿Está seguro que desea eliminar al usuario "${currentUser.username}"? Esta acción es irreversible.`,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'danger',
        cancelButtonColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) { // Check for explicit true result from dialog
        this.loggingService.info(`[UsuariosAdminComponent] User deletion confirmed for: ${currentUser.id}. Proceeding with deletion.`, undefined, 'UsersAdmin');
        this.isLoading = true; // Set loading state
        this.userService.deleteUser(currentUser.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loggingService.info(`[UsuariosAdminComponent] User ${currentUser.id} deleted successfully.`, undefined, 'UsersAdmin');
              this.notificationService.success('Usuario eliminado correctamente');
              this.loadUsers(); // Reload the list to reflect changes
            },
            error: (error) => {
              this.loggingService.error(`[UsuariosAdminComponent] Error deleting user ${currentUser.id}:`, error, 'UsersAdmin');
              console.error('Error eliminando usuario:', error);
              this.notificationService.error('Error al eliminar el usuario. Por favor, intente de nuevo.');
              this.isLoading = false;
            }
          });
      } else {
        this.loggingService.debug(`[UsuariosAdminComponent] User deletion cancelled for: ${currentUser.id}.`, undefined, 'UsersAdmin');
      }
    });
  }

  /**
   * Gets the CSS class for the user's status for styling.
   * @param status The user's status.
   * @returns The CSS class string.
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
        // Try mapping the string to a known status
        if (typeof status === 'string') {
          if (status.toUpperCase() === 'ACTIVE') return 'status-active';
          if (status.toUpperCase() === 'INACTIVE') return 'status-inactive';
          if (status.toUpperCase() === 'BLOCKED') return 'status-blocked';
          if (status.toUpperCase() === 'LOCKED') return 'status-locked';
          if (status.toUpperCase() === 'EXPIRED') return 'status-expired';
        }
        return ''; // Default empty class
    }
  }

  /**
   * Gets the display text for the user's status.
   * @param status The user's status.
   * @returns The descriptive status text.
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
        return status as string; // Return as is if not found
    }
  }

  /**
   * Gets the CSS class for the role badge based on the role type, using glassmorphism styling.
   * @param role The role string.
   * @returns The CSS class string for the role badge.
   */
  getRoleClass(role: string): string {
    const roleType = role.replace('ROLE_', '').toLowerCase();

    switch (roleType) {
      case 'admin':
      case 'administrator':
        return 'role-admin'; // Red - Max privilege
      case 'moderator':
      case 'mod':
        return 'role-moderator'; // Green - Moderate privileges
      case 'user':
      case 'usuario':
        return 'role-user'; // Blue - Standard user
      case 'guest':
      case 'invitado':
        return 'role-guest'; // Gray - Limited access
      case 'editor':
        return 'role-editor'; // Orange - Editing permissions
      case 'viewer':
      case 'visualizador':
        return 'role-viewer'; // Cyan - Read-only
      default:
        return 'role-default'; // Default color
    }
  }

  /**
   * Gets the total number of pages based on total users and page size.
   * @returns The total number of pages.
   */
  getTotalPages(): number {
    return Math.ceil(this.totalUsuarios / this.pageSize);
  }

  /**
   * Gets the visible page numbers for pagination control.
   * @returns An array of visible page numbers.
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
   * Handles changes in page size from the dropdown.
   * @param event The change event from the select element.
   */
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.pageIndex = 0; // Reset to first page
    this.loggingService.debug(`[UsuariosAdminComponent] Page size changed to: ${this.pageSize}. Resetting page to 0.`, undefined, 'UsersAdmin');
    this.onPageChange({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  /**
   * Handles quick status filter changes from the dropdown, navigating to the corresponding route.
   * @param event The change event from the select element.
   */
  onQuickStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const statusValue = select.value;
    this.loggingService.info(`[UsuariosAdminComponent] Quick status filter changed to: ${statusValue}`, undefined, 'UsersAdmin');

    if (statusValue) {
      let targetRoute: string;
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

      // Navigate to the corresponding route (this will trigger the route.data subscription)
      this.router.navigate([targetRoute]);
      this.notificationService.info(`Mostrando usuarios con estado: ${this.getStatusText(statusValue)}`);
    } else {
      // If the value is empty, navigate to the base users route
      this.router.navigate(['/admin/usuarios']);
      this.notificationService.info('Mostrando usuarios de todos los estados');
    }
  }

  /**
   * Clears the status filter and shows all users by navigating to the base users route.
   */
  clearStatusFilter(): void {
    this.loggingService.info('[UsuariosAdminComponent] Clearing status filter and navigating to base users route.', undefined, 'UsersAdmin');
    // Navigate to the base users route
    this.router.navigate(['/admin/usuarios']);

    // Update the select element to reflect the change
    setTimeout(() => {
      const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
      if (statusSelect) {
        statusSelect.value = '';
        this.loggingService.debug('[UsuariosAdminComponent] Reset status select value to empty after clear filter.', undefined, 'UsersAdmin');
      }
    }, 100);

    this.notificationService.info('Mostrando usuarios de todos los estados');
  }
}
