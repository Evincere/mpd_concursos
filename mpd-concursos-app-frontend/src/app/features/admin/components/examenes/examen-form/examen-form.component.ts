import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TipoExamen } from '@shared/interfaces/examen/examen.interface';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-examen-form',
  templateUrl: './examen-form.component.html',
  styleUrls: ['./examen-form.component.scss'],
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
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class ExamenFormComponent implements OnInit {
  examenForm: FormGroup;
  mode: 'create' | 'edit' = 'create';
  title: string = 'Crear Examen';

  tiposExamen = [
    { value: TipoExamen.TECNICO_JURIDICO, label: 'Técnico Jurídico' },
    { value: TipoExamen.TECNICO_ADMINISTRATIVO, label: 'Técnico Administrativo' },
    { value: TipoExamen.PSICOLOGICO, label: 'Psicológico' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExamenFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.examenForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tipo: [TipoExamen.TECNICO_JURIDICO, Validators.required],
      duracion: [60, [Validators.required, Validators.min(15), Validators.max(240)]],
      puntajeMaximo: [100, [Validators.required, Validators.min(10)]],
      fechaInicio: [null, Validators.required],
      intentosPermitidos: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      requisitos: this.fb.array([this.createRequisito()]),
      reglasExamen: this.fb.array([this.createRegla()]),
      materialesPermitidos: this.fb.array([this.createMaterial()])
    });

    if (data) {
      this.mode = data.mode;
      if (this.mode === 'edit' && data.examen) {
        this.title = 'Editar Examen';
        this.populateForm(data.examen);
      }
    }
  }

  ngOnInit(): void {
  }

  populateForm(examen: any): void {
    // Resetear los FormArrays
    while (this.requisitos.length > 0) {
      this.requisitos.removeAt(0);
    }
    while (this.reglasExamen.length > 0) {
      this.reglasExamen.removeAt(0);
    }
    while (this.materialesPermitidos.length > 0) {
      this.materialesPermitidos.removeAt(0);
    }

    // Añadir los elementos de los arrays
    if (examen.requisitos && examen.requisitos.length > 0) {
      examen.requisitos.forEach((requisito: string) => {
        this.requisitos.push(this.fb.control(requisito, Validators.required));
      });
    } else {
      this.requisitos.push(this.createRequisito());
    }

    if (examen.reglasExamen && examen.reglasExamen.length > 0) {
      examen.reglasExamen.forEach((regla: string) => {
        this.reglasExamen.push(this.fb.control(regla, Validators.required));
      });
    } else {
      this.reglasExamen.push(this.createRegla());
    }

    if (examen.materialesPermitidos && examen.materialesPermitidos.length > 0) {
      examen.materialesPermitidos.forEach((material: string) => {
        this.materialesPermitidos.push(this.fb.control(material, Validators.required));
      });
    } else {
      this.materialesPermitidos.push(this.createMaterial());
    }

    // Establecer los valores del formulario
    this.examenForm.patchValue({
      titulo: examen.titulo,
      descripcion: examen.descripcion,
      tipo: examen.tipo,
      duracion: examen.duracion,
      puntajeMaximo: examen.puntajeMaximo,
      fechaInicio: examen.fechaInicio,
      intentosPermitidos: examen.intentosPermitidos
    });
  }

  get requisitos(): FormArray {
    return this.examenForm.get('requisitos') as FormArray;
  }

  get reglasExamen(): FormArray {
    return this.examenForm.get('reglasExamen') as FormArray;
  }

  get materialesPermitidos(): FormArray {
    return this.examenForm.get('materialesPermitidos') as FormArray;
  }

  createRequisito() {
    return this.fb.control('', Validators.required);
  }

  createRegla() {
    return this.fb.control('', Validators.required);
  }

  createMaterial() {
    return this.fb.control('', Validators.required);
  }

  addRequisito(): void {
    this.requisitos.push(this.createRequisito());
  }

  addRegla(): void {
    this.reglasExamen.push(this.createRegla());
  }

  addMaterial(): void {
    this.materialesPermitidos.push(this.createMaterial());
  }

  removeRequisito(index: number): void {
    if (this.requisitos.length > 1) {
      this.requisitos.removeAt(index);
    }
  }

  removeRegla(index: number): void {
    if (this.reglasExamen.length > 1) {
      this.reglasExamen.removeAt(index);
    }
  }

  removeMaterial(index: number): void {
    if (this.materialesPermitidos.length > 1) {
      this.materialesPermitidos.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.examenForm.valid) {
      this.dialogRef.close(this.examenForm.value);
    } else {
      this.markFormGroupTouched(this.examenForm);
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
