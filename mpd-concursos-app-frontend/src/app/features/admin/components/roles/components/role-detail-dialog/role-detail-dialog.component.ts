import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios y modelos
import { AdminRolesService, Role, Permission, RoleAuditLog } from '@core/services/admin/admin-roles.service';
import { NotificationService } from '@shared/services/notification.service';
import { DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';

// Token para datos del diálogo
export interface RoleDetailDialogData {
  roleId: string;
}

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
    CustomButtonComponent,
    CustomCardComponent
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
    private notificationService: NotificationService,
    @Inject(DIALOG_DATA) public data: RoleDetailDialogData
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
          this.notificationService.error('Error al cargar los datos del rol');
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
          this.notificationService.error('Error al cargar el historial de auditoría');
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
      case 'READ': return 'fa-eye';
      case 'WRITE': return 'fa-edit';
      case 'DELETE': return 'fa-trash';
      case 'ADMIN': return 'fa-user-shield';
      case 'CREATE': return 'fa-plus-circle';
      case 'UPDATE': return 'fa-edit';
      default: return 'fa-check';
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
      case 'users': return 'fa-users';
      case 'roles': return 'fa-user-shield';
      case 'profile': return 'fa-user';
      case 'contests': return 'fa-gavel';
      case 'inscriptions': return 'fa-clipboard-list';
      case 'documents': return 'fa-file-alt';
      case 'system': return 'fa-cogs';
      default: return 'fa-folder';
    }
  }
  
  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }
}
