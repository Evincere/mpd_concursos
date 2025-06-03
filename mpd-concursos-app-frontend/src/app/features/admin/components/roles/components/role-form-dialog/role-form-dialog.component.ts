import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from  '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminRolesService, Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '@core/services/admin/admin-roles.service';
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { NotificationService } from '@core/services/notification/notification.service';

// Componentes personalizados
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form-dialog',
  templateUrl: './role-form-dialog.component.html',
  styleUrls: ['./role-form-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomTextareaComponent,
    CustomSelectComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomCheckboxComponent,
    ContestStatusBadgeComponent
  ]
})
export class RoleFormDialogComponent implements OnInit, OnDestroy {
  roleForm: FormGroup;
  isLoading = false;
  isEditMode = false;

  availablePermissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rolesService: AdminRolesService,
    private notificationService: NotificationService,
    public dialogRef: UnifiedDialogRef<boolean>,
    @Inject(DIALOG_DATA) public data: { role?: Role }
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      permissions: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.role;
    this.loadPermissions();

    if (this.isEditMode) {
      // Cargar datos del rol
      this.roleForm.patchValue({
        name: this.data.role?.name,
        description: this.data.role?.description,
        permissions: this.data.role?.permissions.map(p => p.id) || []
      });

      // Si es un rol del sistema, deshabilitar campos
      if (this.data.role?.isSystem) {
        this.roleForm.disable();
        this.notificationService.showWarning('Los roles del sistema no pueden ser modificados');
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.isLoading = true;

    this.rolesService.getPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          this.availablePermissions = permissions;
          this.groupPermissionsByModule();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando permisos:', error);
          this.notificationService.showError('Error al cargar los permisos disponibles');
          this.isLoading = false;
        }
      });
  }

  groupPermissionsByModule(): void {
    // Agrupar permisos por módulo
    const moduleMap = new Map<string, Permission[]>();

    this.availablePermissions.forEach(permission => {
      if (!moduleMap.has(permission.module)) {
        moduleMap.set(permission.module, []);
      }
      moduleMap.get(permission.module)?.push(permission);
    });

    // Convertir el mapa a un array de grupos
    this.permissionGroups = Array.from(moduleMap.entries()).map(([module, permissions]) => ({
      module,
      permissions
    }));

    // Ordenar los grupos por nombre de módulo
    this.permissionGroups.sort((a, b) => a.module.localeCompare(b.module));
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode) {
      this.updateRole();
    } else {
      this.createRole();
    }
  }

  createRole(): void {
    const formValue = this.roleForm.value;

    const newRole: CreateRoleRequest = {
      name: formValue.name,
      description: formValue.description,
      permissions: formValue.permissions
    };

    this.rolesService.createRole(newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_role) => {
          this.notificationService.showSuccess('Rol creado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al crear rol:', error);
          this.notificationService.showError('Error al crear el rol');
          this.isLoading = false;
        }
      });
  }

  updateRole(): void {
    const formValue = this.roleForm.value;

    const updatedRole: UpdateRoleRequest = {
      id: this.data.role!.id,
      name: formValue.name,
      description: formValue.description,
      permissions: formValue.permissions
    };

    this.rolesService.updateRole(updatedRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_role) => {
          this.notificationService.showSuccess('Rol actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al actualizar rol:', error);
          this.notificationService.showError('Error al actualizar el rol');
          this.isLoading = false;
        }
      });
  }

  togglePermission(permissionId: string): void {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    const index = permissions.indexOf(permissionId);

    if (index === -1) {
      // Añadir permiso
      permissions.push(permissionId);
    } else {
      // Quitar permiso
      permissions.splice(index, 1);
    }

    this.roleForm.get('permissions')?.setValue(permissions);
  }

  isPermissionSelected(permissionId: string): boolean {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    return permissions.includes(permissionId);
  }

  selectAllModulePermissions(module: string): void {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    const modulePermissions = this.availablePermissions.filter(p => p.module === module);

    // Verificar si todos los permisos del módulo ya están seleccionados
    const allSelected = modulePermissions.every(p => permissions.includes(p.id));

    if (allSelected) {
      // Quitar todos los permisos del módulo
      const newPermissions = permissions.filter(id =>
        !modulePermissions.some(p => p.id === id)
      );
      this.roleForm.get('permissions')?.setValue(newPermissions);
    } else {
      // Añadir todos los permisos del módulo que no estén ya seleccionados
      modulePermissions.forEach(permission => {
        if (!permissions.includes(permission.id)) {
          permissions.push(permission.id);
        }
      });
      this.roleForm.get('permissions')?.setValue([...permissions]);
    }
  }

  isAllModulePermissionsSelected(module: string): boolean {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    const modulePermissions = this.availablePermissions.filter(p => p.module === module);

    return modulePermissions.every(p => permissions.includes(p.id));
  }

  isSomeModulePermissionsSelected(module: string): boolean {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    const modulePermissions = this.availablePermissions.filter(p => p.module === module);

    return modulePermissions.some(p => permissions.includes(p.id)) &&
           !modulePermissions.every(p => permissions.includes(p.id));
  }

  getModulePermissionCount(module: string): { selected: number, total: number } {
    const permissions = this.roleForm.get('permissions')?.value as string[];
    const modulePermissions = this.availablePermissions.filter(p => p.module === module);
    const selectedCount = modulePermissions.filter(p => permissions.includes(p.id)).length;

    return {
      selected: selectedCount,
      total: modulePermissions.length
    };
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'READ': return 'eye';
      case 'WRITE': return 'edit';
      case 'DELETE': return 'trash';
      case 'ADMIN': return 'cog';
      default: return 'check';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'READ': return 'action-read';
      case 'WRITE': return 'action-write';
      case 'DELETE': return 'action-delete';
      case 'ADMIN': return 'action-admin';
      default: return '';
    }
  }

  getModuleIcon(module: string): string {
    switch (module.toLowerCase()) {
      case 'users': return 'users';
      case 'roles': return 'shield-alt';
      case 'profile': return 'user';
      case 'contests': return 'trophy';
      case 'inscriptions': return 'clipboard-list';
      case 'documents': return 'file-alt';
      case 'system': return 'cogs';
      default: return 'folder';
    }
  }
}
