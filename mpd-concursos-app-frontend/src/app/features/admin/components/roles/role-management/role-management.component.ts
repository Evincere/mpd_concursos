import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RoleManagementService } from '@core/services/roles/role-management.service';
import { AuthorizationService } from '@core/services/roles/authorization.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

import { 
  Role, 
  Permission, 
  RoleType, 
  RoleLevel, 
  RoleStatistics 
} from '@shared/interfaces/roles/role.interface';

import { HasPermissionDirective, HasRoleDirective } from '@shared/directives/has-permission.directive';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { AnimateDirective } from '@shared/directives/animate.directive';

/**
 * Componente para gestión de roles y permisos
 */
@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HasPermissionDirective,
    HasRoleDirective,
    TooltipDirective,
    AnimateDirective
  ]
})
export class RoleManagementComponent implements OnInit, OnDestroy {

  // Estados del componente
  roles: Role[] = [];
  permissions: Permission[] = [];
  filteredRoles: Role[] = [];
  selectedRole: Role | null = null;
  statistics: RoleStatistics | null = null;
  
  // Estados de UI
  loading = false;
  showCreateForm = false;
  showPermissionMatrix = false;
  viewMode: 'list' | 'cards' | 'matrix' = 'list';

  // Formularios
  roleForm: FormGroup;
  searchForm: FormGroup;

  // Filtros
  filters = {
    search: '',
    type: '',
    level: '',
    isActive: null as boolean | null,
    hasUsers: null as boolean | null
  };

  // Opciones para selects
  roleTypes: { value: RoleType; label: string }[] = [
    { value: 'SYSTEM', label: 'Sistema' },
    { value: 'CUSTOM', label: 'Personalizado' },
    { value: 'TEMPLATE', label: 'Plantilla' },
    { value: 'TEMPORARY', label: 'Temporal' }
  ];

  roleLevels: { value: RoleLevel; label: string }[] = [
    { value: 'SUPER_ADMIN', label: 'Super Administrador' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'MANAGER', label: 'Gestor' },
    { value: 'OPERATOR', label: 'Operador' },
    { value: 'USER', label: 'Usuario' },
    { value: 'GUEST', label: 'Invitado' }
  ];

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roleManagementService: RoleManagementService,
    private authorizationService: AuthorizationService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['CUSTOM', Validators.required],
      level: ['USER', Validators.required],
      isActive: [true],
      permissions: [[]]
    });

    this.searchForm = this.fb.group({
      search: [''],
      type: [''],
      level: [''],
      isActive: [null],
      hasUsers: [null]
    });
  }

  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    this.loading = true;

    combineLatest([
      this.roleManagementService.loadRoles(),
      this.roleManagementService.loadPermissions(),
      this.roleManagementService.getRoleStatistics()
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([roles, permissions, statistics]) => {
        this.roles = roles;
        this.permissions = permissions;
        this.statistics = statistics;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.showError('Error al cargar los datos');
        this.loading = false;
      }
    });
  }

  /**
   * Configura los filtros reactivos
   */
  private setupFilters(): void {
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.filters = { ...this.filters, ...filters };
      this.applyFilters();
    });
  }

  /**
   * Aplica los filtros a la lista de roles
   */
  private applyFilters(): void {
    let filtered = [...this.roles];

    // Filtro por búsqueda
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(role => 
        role.name.toLowerCase().includes(search) ||
        role.description.toLowerCase().includes(search)
      );
    }

    // Filtro por tipo
    if (this.filters.type) {
      filtered = filtered.filter(role => role.type === this.filters.type);
    }

    // Filtro por nivel
    if (this.filters.level) {
      filtered = filtered.filter(role => role.level === this.filters.level);
    }

    // Filtro por estado activo
    if (this.filters.isActive !== null) {
      filtered = filtered.filter(role => role.isActive === this.filters.isActive);
    }

    // Filtro por usuarios asignados
    if (this.filters.hasUsers !== null) {
      filtered = filtered.filter(role => {
        const hasUsers = (role.userCount || 0) > 0;
        return hasUsers === this.filters.hasUsers;
      });
    }

    this.filteredRoles = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  /**
   * Obtiene los roles paginados
   */
  getPaginatedRoles(): Role[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredRoles.slice(startIndex, endIndex);
  }

  /**
   * Cambia la página
   */
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  /**
   * Selecciona un rol
   */
  selectRole(role: Role): void {
    this.selectedRole = role;
    this.populateRoleForm(role);
  }

  /**
   * Rellena el formulario con los datos del rol
   */
  private populateRoleForm(role: Role): void {
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      type: role.type,
      level: role.level,
      isActive: role.isActive,
      permissions: role.permissions.map(p => p.id)
    });
  }

  /**
   * Muestra el formulario de creación
   */
  showCreateRoleForm(): void {
    this.selectedRole = null;
    this.roleForm.reset({
      type: 'CUSTOM',
      level: 'USER',
      isActive: true,
      permissions: []
    });
    this.showCreateForm = true;
  }

  /**
   * Cancela la edición/creación
   */
  cancelEdit(): void {
    this.showCreateForm = false;
    this.selectedRole = null;
    this.roleForm.reset();
  }

  /**
   * Guarda el rol (crear o actualizar)
   */
  saveRole(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }

    const formValue = this.roleForm.value;
    this.loading = true;

    if (this.selectedRole) {
      // Actualizar rol existente
      this.roleManagementService.updateRole(this.selectedRole.id, formValue).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedRole) => {
          this.notificationService.showSuccess('Rol actualizado exitosamente');
          this.updateRoleInList(updatedRole);
          this.cancelEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating role:', error);
          this.notificationService.showError('Error al actualizar el rol');
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo rol
      this.roleManagementService.createRole(formValue).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (newRole) => {
          this.notificationService.showSuccess('Rol creado exitosamente');
          this.roles.push(newRole);
          this.applyFilters();
          this.cancelEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating role:', error);
          this.notificationService.showError('Error al crear el rol');
          this.loading = false;
        }
      });
    }
  }

  /**
   * Actualiza un rol en la lista
   */
  private updateRoleInList(updatedRole: Role): void {
    const index = this.roles.findIndex(r => r.id === updatedRole.id);
    if (index !== -1) {
      this.roles[index] = updatedRole;
      this.applyFilters();
    }
  }

  /**
   * Elimina un rol
   */
  deleteRole(role: Role): void {
    if (role.isSystem) {
      this.notificationService.showWarning('No se pueden eliminar roles del sistema');
      return;
    }

    if (role.userCount && role.userCount > 0) {
      this.notificationService.showWarning(
        `No se puede eliminar el rol "${role.name}" porque tiene ${role.userCount} usuarios asignados`
      );
      return;
    }

    this.dialogService.showConfirmDialog({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar el rol "${role.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.roleManagementService.deleteRole(role.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.showSuccess('Rol eliminado exitosamente');
            this.roles = this.roles.filter(r => r.id !== role.id);
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting role:', error);
            this.notificationService.showError('Error al eliminar el rol');
            this.loading = false;
          }
        });
      }
    });
  }

  /**
   * Cambia el estado activo de un rol
   */
  toggleRoleStatus(role: Role): void {
    if (role.isSystem) {
      this.notificationService.showWarning('No se puede cambiar el estado de roles del sistema');
      return;
    }

    this.roleManagementService.toggleRoleStatus(role.id, !role.isActive).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedRole) => {
        this.notificationService.showSuccess(
          `Rol ${updatedRole.isActive ? 'activado' : 'desactivado'} exitosamente`
        );
        this.updateRoleInList(updatedRole);
      },
      error: (error) => {
        console.error('Error toggling role status:', error);
        this.notificationService.showError('Error al cambiar el estado del rol');
      }
    });
  }

  /**
   * Cambia el modo de vista
   */
  setViewMode(mode: 'list' | 'cards' | 'matrix'): void {
    this.viewMode = mode;
  }

  /**
   * Obtiene el color del badge según el tipo de rol
   */
  getRoleTypeColor(type: RoleType): string {
    const colors = {
      'SYSTEM': 'primary',
      'CUSTOM': 'success',
      'TEMPLATE': 'info',
      'TEMPORARY': 'warning'
    };
    return colors[type] || 'secondary';
  }

  /**
   * Obtiene el color del badge según el nivel de rol
   */
  getRoleLevelColor(level: RoleLevel): string {
    const colors = {
      'SUPER_ADMIN': 'danger',
      'ADMIN': 'warning',
      'MANAGER': 'info',
      'OPERATOR': 'primary',
      'USER': 'success',
      'GUEST': 'secondary'
    };
    return colors[level] || 'secondary';
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo del formulario es inválido
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  /**
   * Obtiene los permisos agrupados por módulo
   */
  getPermissionsByModule(): Map<string, Permission[]> {
    const grouped = new Map<string, Permission[]>();
    this.permissions.forEach(permission => {
      const module = permission.module;
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(permission);
    });
    return grouped;
  }

  /**
   * Verifica si un permiso está seleccionado
   */
  isPermissionSelected(permissionId: string): boolean {
    const selectedPermissions = this.roleForm.get('permissions')?.value || [];
    return selectedPermissions.includes(permissionId);
  }

  /**
   * Cambia la selección de un permiso
   */
  togglePermission(permissionId: string): void {
    const permissionsControl = this.roleForm.get('permissions');
    const currentPermissions = permissionsControl?.value || [];

    if (currentPermissions.includes(permissionId)) {
      const filtered = currentPermissions.filter((id: string) => id !== permissionId);
      permissionsControl?.setValue(filtered);
    } else {
      permissionsControl?.setValue([...currentPermissions, permissionId]);
    }
  }

  /**
   * Selecciona/deselecciona todos los permisos de un módulo
   */
  toggleModulePermissions(modulePermissions: Permission[]): void {
    const permissionsControl = this.roleForm.get('permissions');
    const currentPermissions = permissionsControl?.value || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);

    const allSelected = modulePermissionIds.every(id => currentPermissions.includes(id));

    if (allSelected) {
      // Deseleccionar todos los permisos del módulo
      const filtered = currentPermissions.filter((id: string) => !modulePermissionIds.includes(id));
      permissionsControl?.setValue(filtered);
    } else {
      // Seleccionar todos los permisos del módulo
      const newPermissions = [...new Set([...currentPermissions, ...modulePermissionIds])];
      permissionsControl?.setValue(newPermissions);
    }
  }

  /**
   * Verifica si todos los permisos de un módulo están seleccionados
   */
  areAllModulePermissionsSelected(modulePermissions: Permission[]): boolean {
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    return modulePermissions.every(p => currentPermissions.includes(p.id));
  }

  /**
   * Verifica si algunos permisos de un módulo están seleccionados
   */
  areSomeModulePermissionsSelected(modulePermissions: Permission[]): boolean {
    const currentPermissions = this.roleForm.get('permissions')?.value || [];
    return modulePermissions.some(p => currentPermissions.includes(p.id));
  }
}
