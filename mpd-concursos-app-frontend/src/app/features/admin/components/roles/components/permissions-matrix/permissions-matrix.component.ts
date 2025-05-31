import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { 
  RolesPermissionsService, 
  Permission
} from '@core/services/admin/roles-permissions.service';

@Component({
  selector: 'app-permissions-matrix',
  templateUrl: './permissions-matrix.component.html',
  styleUrls: ['./permissions-matrix.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class PermissionsMatrixComponent implements OnInit, OnDestroy {
  @Input() roleId = '';
  @Input() roleName = '';
  @Input() selectedPermissions: string[] = [];
  @Input() isSystemRole = false;
  @Output() permissionsChange = new EventEmitter<string[]>();
  
  permissionsByCategory: Record<string, Permission[]> = {};
  permissionCategories: string[] = [];
  permissionsForm: FormGroup;
  
  isLoading = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private rolesPermissionsService: RolesPermissionsService,
    private snackBar: MatSnackBar
  ) {
    this.permissionsForm = this.fb.group({
      categories: this.fb.array([])
    });
  }
  
  ngOnInit(): void {
    this.loadPermissions();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga los permisos del sistema
   */
  loadPermissions(): void {
    this.isLoading = true;
    
    this.rolesPermissionsService.getPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Agrupar permisos por categoría
          this.permissionsByCategory = {};
          
          response.permissions.forEach(permission => {
            if (!this.permissionsByCategory[permission.category]) {
              this.permissionsByCategory[permission.category] = [];
            }
            
            this.permissionsByCategory[permission.category].push(permission);
          });
          
          this.permissionCategories = Object.keys(this.permissionsByCategory).sort();
          
          // Crear formulario
          this.createPermissionsForm();
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando permisos:', error);
          this.snackBar.open('Error al cargar permisos', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Crea el formulario de permisos
   */
  createPermissionsForm(): void {
    const categoriesArray = this.fb.array([]);
    
    this.permissionCategories.forEach(category => {
      const permissions = this.permissionsByCategory[category];
      const permissionsGroup = this.fb.group({});
      
      permissions.forEach(permission => {
        const isSelected = this.selectedPermissions.includes(permission.name) || 
                          this.selectedPermissions.includes('*');
        
        permissionsGroup.addControl(
          permission.name,
          new FormControl({ value: isSelected, disabled: this.isSystemRole })
        );
      });
      
      categoriesArray.push(
        this.fb.group({
          name: category,
          selectAll: new FormControl({ 
            value: this.areAllPermissionsSelected(permissions), 
            disabled: this.isSystemRole 
          }),
          permissions: permissionsGroup
        })
      );
    });
    
    this.permissionsForm = this.fb.group({
      categories: categoriesArray
    });
    
    // Escuchar cambios en el formulario
    this.permissionsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSelectedPermissions();
      });
  }
  
  /**
   * Verifica si todos los permisos de una categoría están seleccionados
   * @param permissions Lista de permisos
   * @returns true si todos los permisos están seleccionados, false en caso contrario
   */
  areAllPermissionsSelected(permissions: Permission[]): boolean {
    if (this.selectedPermissions.includes('*')) {
      return true;
    }
    
    return permissions.every(permission => 
      this.selectedPermissions.includes(permission.name)
    );
  }
  
  /**
   * Actualiza la lista de permisos seleccionados
   */
  updateSelectedPermissions(): void {
    const selectedPermissions: string[] = [];
    
    const categoriesArray = this.permissionsForm.get('categories') as FormArray;
    
    categoriesArray.controls.forEach(categoryGroup => {
      const permissionsGroup = categoryGroup.get('permissions') as FormGroup;
      
      Object.keys(permissionsGroup.controls).forEach(permissionName => {
        if (permissionsGroup.get(permissionName)?.value) {
          selectedPermissions.push(permissionName);
        }
      });
    });
    
    this.permissionsChange.emit(selectedPermissions);
  }
  
  /**
   * Selecciona o deselecciona todos los permisos de una categoría
   * @param categoryIndex Índice de la categoría
   */
  toggleCategoryPermissions(categoryIndex: number): void {
    const categoriesArray = this.permissionsForm.get('categories') as FormArray;
    const categoryGroup = categoriesArray.at(categoryIndex);
    const selectAll = categoryGroup.get('selectAll')?.value;
    const permissionsGroup = categoryGroup.get('permissions') as FormGroup;
    
    Object.keys(permissionsGroup.controls).forEach(permissionName => {
      permissionsGroup.get(permissionName)?.setValue(selectAll);
    });
  }
  
  /**
   * Actualiza el estado del checkbox "Seleccionar todos" de una categoría
   * @param categoryIndex Índice de la categoría
   */
  updateCategorySelectAll(categoryIndex: number): void {
    const categoriesArray = this.permissionsForm.get('categories') as FormArray;
    const categoryGroup = categoriesArray.at(categoryIndex);
    const permissionsGroup = categoryGroup.get('permissions') as FormGroup;
    
    const allSelected = Object.keys(permissionsGroup.controls).every(
      permissionName => permissionsGroup.get(permissionName)?.value
    );
    
    categoryGroup.get('selectAll')?.setValue(allSelected, { emitEvent: false });
  }
  
  /**
   * Selecciona o deselecciona todos los permisos
   * @param selected true para seleccionar todos, false para deseleccionar todos
   */
  selectAllPermissions(selected: boolean): void {
    const categoriesArray = this.permissionsForm.get('categories') as FormArray;
    
    categoriesArray.controls.forEach(categoryGroup => {
      categoryGroup.get('selectAll')?.setValue(selected);
      
      const permissionsGroup = categoryGroup.get('permissions') as FormGroup;
      
      Object.keys(permissionsGroup.controls).forEach(permissionName => {
        permissionsGroup.get(permissionName)?.setValue(selected);
      });
    });
  }
  
  /**
   * Obtiene el FormArray de categorías
   */
  get categoriesArray(): FormArray {
    return this.permissionsForm.get('categories') as FormArray;
  }
  
  /**
   * Obtiene el FormGroup de permisos de una categoría
   * @param categoryIndex Índice de la categoría
   */
  getPermissionsGroup(categoryIndex: number): FormGroup {
    const categoryGroup = this.categoriesArray.at(categoryIndex);
    return categoryGroup.get('permissions') as FormGroup;
  }
  
  /**
   * Obtiene los permisos de una categoría
   * @param category Nombre de la categoría
   */
  getPermissionsByCategory(category: string): Permission[] {
    return this.permissionsByCategory[category] || [];
  }
  
  /**
   * Formatea el nombre de una categoría
   * @param category Nombre de la categoría
   * @returns Nombre formateado
   */
  formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
