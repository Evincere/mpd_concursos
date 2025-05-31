import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminRolesService, Role, RoleFilter } from '@core/services/admin/admin-roles.service';
import { RoleFormDialogComponent } from './components/role-form-dialog/role-form-dialog.component';
import { RoleDetailDialogComponent } from './components/role-detail-dialog/role-detail-dialog.component';

// Importar componentes personalizados
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { TableColumn, SortEvent, PageEvent } from '@shared/components/custom-form/custom-table/custom-table.component';

@Component({
  selector: 'app-roles-admin',
  templateUrl: './roles-admin.component.refactored.html',
  styleUrls: ['./roles-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule
  ]
})
export class RolesAdminComponent implements OnInit, OnDestroy {
  tableColumns: TableColumn[] = [
    { property: 'name', header: 'Nombre', sortable: true },
    { property: 'description', header: 'Descripción', sortable: true },
    { property: 'permissions', header: 'Permisos' },
    { property: 'userCount', header: 'Usuarios', sortable: true },
    { property: 'isSystem', header: 'Tipo', sortable: true },
    { property: 'actions', header: 'Acciones' }
  ];

  dataSource: Role[] = [];

  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rolesService: AdminRolesService,
    private dialogService: CustomDialogService
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
      search: this.filterForm.get('search')?.value,
      isSystem: this.filterForm.get('isSystem')?.value,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'name',
      direction: 'asc'
    };

    this.rolesService.getRoles(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.roles;
          this.totalItems = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando roles:', error);
          this.showNotification('Error al cargar los roles', 'error');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRoles();
  }

  onSortChange(_sort: SortEvent): void {
    // Implementar ordenamiento
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

  openRoleFormDialog(role?: Role): void {
    const dialogRef = this.dialogService.open(RoleFormDialogComponent, {
      title: role ? 'Editar Rol' : 'Nuevo Rol',
      icon: role ? 'edit' : 'plus',
      size: 'large',
      data: { role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles();
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

  deleteRole(role: Role): void {
    if (role.isSystem) {
      this.showNotification('No se pueden eliminar roles del sistema', 'error');
      return;
    }

    if (role.userCount && role.userCount > 0) {
      this.showNotification(`No se puede eliminar un rol que tiene ${role.userCount} usuarios asignados`, 'error');
      return;
    }

    const dialogRef = this.dialogService.open(RoleDetailDialogComponent, {
      title: 'Eliminar rol',
      icon: 'trash',
      size: 'small',
      confirmButtonText: 'Eliminar',
      confirmButtonColor: 'warn',
      data: {
        message: `¿Está seguro que desea eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
    });
  }

  getPermissionCount(role: Role): number {
    return role.permissions ? role.permissions.length : 0;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Implementar notificación personalizada
    console.log(`[${type}] ${message}`);
  }
}
