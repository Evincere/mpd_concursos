import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from  '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminRolesService, Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '@core/services/admin/admin-roles.service';

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
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule
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
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role?: Role }
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
        this.snackBar.open('Los roles del sistema no pueden ser modificados', 'Cerrar', { duration: 3000 });
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
          this.snackBar.open('Error al cargar los permisos disponibles', 'Cerrar', { duration: 3000 });
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
          this.snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al crear rol:', error);
          this.snackBar.open('Error al crear el rol', 'Cerrar', { duration: 3000 });
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
          this.snackBar.open('Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al actualizar rol:', error);
          this.snackBar.open('Error al actualizar el rol', 'Cerrar', { duration: 3000 });
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
      case 'READ': return 'visibility';
      case 'WRITE': return 'edit';
      case 'DELETE': return 'delete';
      case 'ADMIN': return 'admin_panel_settings';
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
      case 'users': return 'people';
      case 'roles': return 'admin_panel_settings';
      case 'profile': return 'person';
      case 'contests': return 'gavel';
      case 'inscriptions': return 'assignment';
      case 'documents': return 'description';
      case 'system': return 'settings';
      default: return 'folder';
    }
  }
}
