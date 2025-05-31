import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { Role } from '@core/services/admin/roles-permissions.service';
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
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
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
    public dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
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
}
