import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Servicios y modelos
import { AdminRolesService, Role, RoleFilter, Permission } from '@core/services/admin/admin-roles.service';
import { NotificationService } from '@shared/services/notification.service';
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';

// Directivas
import { DropdownOverflowFixDirective } from '@shared/directives/dropdown-overflow-fix.directive';

// Componentes de diálogo
import { RoleFormDialogComponent } from './components/role-form-dialog/role-form-dialog.component';
import { RoleDetailDialogComponent } from './components/role-detail-dialog/role-detail-dialog.component';

@Component({
  selector: 'app-roles-admin',
  templateUrl: './roles-admin.component.html',
  styleUrls: ['./roles-admin.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    DropdownOverflowFixDirective
  ]
})
export class RolesAdminComponent implements OnInit, OnDestroy {
  // Exponer Math para usar en el template
  Math = Math;

  // Datos
  roles: Role[] = [];

  // Estado de la UI
  isLoading = false;
  
  // Paginación
  totalRoles = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  
  // Filtros
  filterForm: FormGroup;
  currentFilters: RoleFilter = {};
  
  // Opciones para filtros
  tipoOptions = [
    { value: '', label: 'Todos' },
    { value: true, label: 'Sistema' },
    { value: false, label: 'Personalizados' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rolesService: AdminRolesService,
    private notificationService: NotificationService,
    private dialogService: UnifiedDialogService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      isSystem: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterListeners(): void {
    // Aplicar debounce al campo de búsqueda
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadRoles();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('isSystem')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadRoles();
      });
  }

  loadRoles(): void {
    this.isLoading = true;

    const filters: RoleFilter = {
      search: this.filterForm.get('search')?.value || '',
      isSystem: this.filterForm.get('isSystem')?.value !== '' ? this.filterForm.get('isSystem')?.value : undefined,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'name',
      direction: 'asc'
    };

    this.currentFilters = filters;

    this.rolesService.getRoles(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.roles = response.roles;
          this.totalRoles = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando roles:', error);
          this.showNotification('Error al cargar los roles', 'error');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRoles();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      isSystem: ''
    });
    this.pageIndex = 0;
    this.loadRoles();
  }

  // === ACCIONES DE ROLES ===

  openCreateRoleDialog(): void {
    const dialogRef = this.dialogService.open(RoleFormDialogComponent, {
      title: 'Nuevo Rol',
      icon: 'plus',
      size: 'large',
      data: { role: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles();
        this.showNotification('Rol creado correctamente', 'success');
      }
    });
  }

  openRoleDetailDialog(role: Role): void {
    this.dialogService.open(RoleDetailDialogComponent, {
      title: 'Detalles del Rol',
      icon: 'eye',
      size: 'large',
      data: { roleId: role.id }
    });
  }

  openEditRoleDialog(role: Role, event: Event): void {
    event.stopPropagation();
    
    if (role.isSystem) {
      this.showNotification('No se pueden editar roles del sistema', 'error');
      return;
    }

    const dialogRef = this.dialogService.open(RoleFormDialogComponent, {
      title: 'Editar Rol',
      icon: 'edit',
      size: 'large',
      data: { role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles();
        this.showNotification('Rol actualizado correctamente', 'success');
      }
    });
  }

  deleteRole(role: Role, event: Event): void {
    event.stopPropagation();
    
    if (role.isSystem) {
      this.showNotification('No se pueden eliminar roles del sistema', 'error');
      return;
    }

    if (role.userCount && role.userCount > 0) {
      this.showNotification(`No se puede eliminar un rol que tiene ${role.userCount} usuarios asignados`, 'error');
      return;
    }

    // Aquí implementarías el diálogo de confirmación
    // Por ahora, simulamos la confirmación
    if (confirm(`¿Está seguro que desea eliminar el rol "${role.name}"?`)) {
      this.isLoading = true;

      this.rolesService.deleteRole(role.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showNotification('Rol eliminado correctamente', 'success');
            this.loadRoles();
          },
          error: (error) => {
            console.error('Error al eliminar rol:', error);
            this.showNotification('Error al eliminar el rol', 'error');
            this.isLoading = false;
          }
        });
    }
  }

  // === MÉTODOS AUXILIARES ===

  getPermissionCount(role: Role): number {
    return role.permissions ? role.permissions.length : 0;
  }

  getPermissionNames(role: Role): string[] {
    if (!role.permissions || role.permissions.length === 0) {
      return [];
    }
    return role.permissions.map(p => p.name);
  }

  getDeleteButtonTitle(role: Role): string {
    if (role.isSystem) {
      return 'No se pueden eliminar roles del sistema';
    }
    if (role.userCount && role.userCount > 0) {
      return `No se puede eliminar: ${role.userCount} usuarios asignados`;
    }
    return 'Eliminar rol';
  }

  getRoleTypeLabel(isSystem: boolean): string {
    return isSystem ? 'Sistema' : 'Personalizado';
  }

  getRoleTypeClass(isSystem: boolean): string {
    return isSystem ? 'system-role' : 'custom-role';
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    switch (type) {
      case 'success':
        this.notificationService.success(message);
        break;
      case 'error':
        this.notificationService.error(message);
        break;
      case 'info':
      default:
        this.notificationService.info(message);
        break;
    }
  }
}
