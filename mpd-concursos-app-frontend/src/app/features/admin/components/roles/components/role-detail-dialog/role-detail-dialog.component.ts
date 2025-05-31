import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminRolesService, Role, Permission, RoleAuditLog } from '@core/services/admin/admin-roles.service';

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-detail-dialog',
  templateUrl: './role-detail-dialog.component.html',
  styleUrls: ['./role-detail-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatExpansionModule
  ]
})
export class RoleDetailDialogComponent implements OnInit, OnDestroy {
  role: Role | null = null;
  auditLogs: RoleAuditLog[] = [];
  permissionGroups: PermissionGroup[] = [];
  
  isLoading = true;
  activeTab = 0;
  
  auditColumns: string[] = ['action', 'details', 'performedBy', 'performedAt'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private rolesService: AdminRolesService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roleId: string }
  ) { }

  ngOnInit(): void {
    this.loadRoleData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadRoleData(): void {
    this.isLoading = true;
    
    this.rolesService.getRoleById(this.data.roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (role) => {
          this.role = role;
          this.groupPermissionsByModule();
          this.loadAuditLogs();
        },
        error: (error) => {
          console.error('Error cargando rol:', error);
          this.snackBar.open('Error al cargar los datos del rol', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  loadAuditLogs(): void {
    this.rolesService.getRoleAuditLogs(this.data.roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs) => {
          this.auditLogs = logs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando historial de auditoría:', error);
          this.snackBar.open('Error al cargar el historial de auditoría', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  groupPermissionsByModule(): void {
    if (!this.role || !this.role.permissions) {
      return;
    }
    
    // Agrupar permisos por módulo
    const moduleMap = new Map<string, Permission[]>();
    
    this.role.permissions.forEach(permission => {
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
  
  getActionIcon(action: string): string {
    switch (action) {
      case 'READ': return 'visibility';
      case 'WRITE': return 'edit';
      case 'DELETE': return 'delete';
      case 'ADMIN': return 'admin_panel_settings';
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      default: return 'check';
    }
  }
  
  getActionClass(action: string): string {
    switch (action) {
      case 'READ': return 'action-read';
      case 'WRITE': return 'action-write';
      case 'DELETE': return 'action-delete';
      case 'ADMIN': return 'action-admin';
      case 'CREATE': return 'action-success';
      case 'UPDATE': return 'action-warning';
      default: return 'action-info';
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
  
  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }
}
