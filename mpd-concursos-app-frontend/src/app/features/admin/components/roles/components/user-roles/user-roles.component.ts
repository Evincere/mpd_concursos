import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  RolesPermissionsService, 
  Role, 
  UserRole, 
  UserRoleFilter 
} from '@core/services/admin/roles-permissions.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    ConfirmDialogComponent
  ]
})
export class UserRolesComponent implements OnInit, OnDestroy {
  // Datos
  userRoles: UserRole[] = [];
  roles: Role[] = [];
  
  // Estado de la UI
  isLoading = false;
  
  // Paginación y ordenamiento
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  
  // Columnas para la tabla de usuarios
  displayedColumns: string[] = ['username', 'fullName', 'email', 'roles', 'actions'];
  
  // Formulario de filtros
  filterForm: FormGroup;
  
  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private fb: FormBuilder,
    private rolesPermissionsService: RolesPermissionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: ['']
    });
  }
  
  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadRoles();
    this.loadUserRoles();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura los listeners para los filtros
   */
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
        this.loadUserRoles();
      });
    
    // Escuchar cambios en los demás filtros
    this.filterForm.get('role')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadUserRoles();
      });
  }
  
  /**
   * Carga los roles del sistema
   */
  loadRoles(): void {
    this.rolesPermissionsService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.roles = response.roles;
        },
        error: (error) => {
          console.error('Error cargando roles:', error);
        }
      });
  }
  
  /**
   * Carga los usuarios con sus roles asignados
   */
  loadUserRoles(): void {
    this.isLoading = true;
    
    const filter: UserRoleFilter = {
      search: this.filterForm.value.search,
      role: this.filterForm.value.role,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'username',
      direction: 'asc'
    };
    
    this.rolesPermissionsService.getUserRoles(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.userRoles = response.users;
          this.totalUsers = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando usuarios con roles:', error);
          this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Aplica los filtros de búsqueda
   */
  applyFilter(): void {
    this.pageIndex = 0;
    this.loadUserRoles();
  }
  
  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      role: ''
    });
    this.pageIndex = 0;
    this.loadUserRoles();
  }
  
  /**
   * Maneja el cambio de página
   * @param event Evento de cambio de página
   */
  onPageChange(event: unknown): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUserRoles();
  }
  
  /**
   * Abre el diálogo para editar los roles de un usuario
   * @param user Usuario a editar
   */
  openEditUserRolesDialog(user: UserRole): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: {
        title: `Editar roles de ${user.fullName}`,
        message: 'Seleccione los roles que desea asignar a este usuario:',
        confirmText: 'Guardar',
        cancelText: 'Cancelar',
        showRolesSelector: true,
        roles: this.roles,
        selectedRoles: user.roles
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.selectedRoles) {
        this.updateUserRoles(user.userId, result.selectedRoles);
      }
    });
  }
  
  /**
   * Actualiza los roles de un usuario
   * @param userId ID del usuario
   * @param roles Roles a asignar
   */
  updateUserRoles(userId: string, roles: string[]): void {
    this.isLoading = true;
    
    this.rolesPermissionsService.updateUserRoles(userId, roles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.snackBar.open('Roles actualizados correctamente', 'Cerrar', { duration: 3000 });
          
          // Actualizar el usuario en la lista
          const index = this.userRoles.findIndex(u => u.userId === userId);
          if (index !== -1) {
            this.userRoles[index] = user;
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error actualizando roles de usuario:', error);
          this.snackBar.open('Error al actualizar roles', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Obtiene el nombre de un rol
   * @param roleName Nombre del rol
   * @returns Nombre formateado
   */
  getRoleName(roleName: string): string {
    const role = this.roles.find(r => r.name === roleName);
    return role ? role.name.replace('ROLE_', '') : roleName;
  }
  
  /**
   * Obtiene el color de un rol
   * @param roleName Nombre del rol
   * @returns Clase CSS para el color
   */
  getRoleColor(roleName: string): string {
    switch (roleName) {
      case 'ROLE_ADMIN':
        return 'role-admin';
      case 'ROLE_EVALUATOR':
        return 'role-evaluator';
      case 'ROLE_SUPERVISOR':
        return 'role-supervisor';
      case 'ROLE_USER':
        return 'role-user';
      default:
        return 'role-default';
    }
  }
}
