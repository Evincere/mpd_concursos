import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ]
})
export class UsuarioFormComponent implements OnInit {
  usuarioForm: FormGroup;
  mode: 'create' | 'edit';
  title: string;
  hidePassword = true;

  roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'evaluador', label: 'Evaluador' },
    { value: 'usuario', label: 'Usuario' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UsuarioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode;
    this.title = this.mode === 'create' ? 'Crear Usuario' : 'Editar Usuario';

    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.mode === 'create' ? [Validators.required, Validators.minLength(6)] : []],
      roles: [[], [Validators.required]],
      telefono: [''],
      direccion: ['']
    });

    if (this.mode === 'edit' && data.usuario) {
      this.populateForm(data.usuario);
    }
  }

  ngOnInit(): void {
  }

  populateForm(usuario: any): void {
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      roles: usuario.roles,
      telefono: usuario.telefono,
      direccion: usuario.direccion
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.valid) {
      const formData = { ...this.usuarioForm.value };

      // Si estamos en modo edición y no se ha proporcionado una contraseña, la eliminamos del objeto
      if (this.mode === 'edit' && !formData.password) {
        delete formData.password;
      }

      this.dialogRef.close(formData);
    } else {
      this.markFormGroupTouched(this.usuarioForm);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Marcar todos los controles como tocados para mostrar errores
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
