import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Importar componentes custom en lugar de Material UI
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

// Importar UnifiedDialogService en lugar de MatDialog
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';

import { Role } from '@core/services/admin/admin-roles.service';
import { PermissionsMatrixComponent } from '../permissions-matrix/permissions-matrix.component';

interface DialogData {
  title: string;
  role: Role | null;
  permissionCategories: string[];
}

@Component({
  selector: 'app-role-dialog',
  templateUrl: './role-dialog.component.html',
  styleUrls: ['./role-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule,
    CustomTabsComponent,
    CustomTabComponent,
    CustomButtonComponent,
    CustomFormFieldComponent,
    CustomTextareaComponent,
    PermissionsMatrixComponent
  ]
})
export class RoleDialogComponent implements OnInit {
  roleForm: FormGroup;
  isEditMode: boolean;
  selectedPermissions: string[] = [];
  activeTab = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: UnifiedDialogRef<RoleDialogComponent>,
    @Inject(DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = !!data.role;

    this.roleForm = this.fb.group({
      name: [
        { value: this.isEditMode ? data.role?.name : '', disabled: this.isEditMode && data.role?.isSystem },
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]
      ],
      description: [
        { value: this.isEditMode ? data.role?.description : '', disabled: this.isEditMode && data.role?.isSystem },
        [Validators.required]
      ]
    });

    if (this.isEditMode && data.role) {
      this.selectedPermissions = [...data.role.permissions];
    }
  }

  ngOnInit(): void {
    // Cargar permisos disponibles
    this.loadAvailablePermissions();

    // Verificar modo de edición
    if (this.isEditMode) {
      console.log('Editando rol:', this.data.role?.name);
    } else {
      console.log('Creando nuevo rol');
    }
  }

  /**
   * Carga los permisos disponibles
   */
  private loadAvailablePermissions(): void {
    // En una implementación real, esto cargaría los permisos desde un servicio
    console.log('Cargando permisos disponibles');
  }

  /**
   * Maneja el cambio de permisos seleccionados
   * @param permissions Lista de permisos seleccionados
   */
  onPermissionsChange(permissions: string[]): void {
    this.selectedPermissions = permissions;
  }

  /**
   * Maneja el cambio de pestaña
   * @param index Índice de la pestaña seleccionada
   */
  onTabChange(index: number): void {
    this.activeTab = index;
  }

  /**
   * Guarda el rol
   */
  save(): void {
    if (this.roleForm.invalid) {
      return;
    }

    const roleData: Partial<Role> = {
      name: this.roleForm.get('name')?.value,
      description: this.roleForm.get('description')?.value,
      permissions: this.selectedPermissions
    };

    this.dialogRef.close(roleData);
  }

  /**
   * Cierra el diálogo
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Verifica si el rol es del sistema
   */
  isSystemRole(): boolean {
    return this.isEditMode && this.data.role?.isSystem || false;
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o cadena vacía
   */
  getFieldError(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.hasError('required')) {
        return `${fieldName === 'name' ? 'El nombre del rol' : 'La descripción'} es obligatorio`;
      }
      if (field.hasError('pattern')) {
        return 'El nombre solo puede contener letras, números y guiones bajos';
      }
    }
    return '';
  }
}
