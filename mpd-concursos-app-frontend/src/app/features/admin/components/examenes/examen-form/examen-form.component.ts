import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { TipoExamen } from '../../../../../shared/interfaces/examen/examen.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-examen-form',
  templateUrl: './examen-form.component.html',
  styleUrls: ['./examen-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ExamenFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() examenData: Record<string, unknown> | null = null;
  @Input() isVisible = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  examenForm: FormGroup;
  title = 'Crear Examen';

  tiposExamen = [
    { value: TipoExamen.TECNICO_JURIDICO, label: 'Técnico Jurídico' },
    { value: TipoExamen.TECNICO_ADMINISTRATIVO, label: 'Técnico Administrativo' },
    { value: TipoExamen.PSICOLOGICO, label: 'Psicológico' }
  ];

  constructor(private fb: FormBuilder) {
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
  }

  ngOnInit(): void {
    // Configurar el título según el modo
    this.title = this.mode === 'edit' ? 'Editar Examen' : 'Crear Examen';

    // Si hay datos de examen para editar, poblar el formulario
    if (this.mode === 'edit' && this.examenData) {
      this.populateForm(this.examenData);
    }
  }

  private populateForm(examenData: Record<string, unknown>): void {
    // Limpiar arrays existentes
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
    if (examenData['requisitos'] && Array.isArray(examenData['requisitos']) && examenData['requisitos'].length > 0) {
      (examenData['requisitos'] as string[]).forEach((requisito: string) => {
        this.requisitos.push(this.fb.control(requisito, Validators.required));
      });
    } else {
      this.requisitos.push(this.createRequisito());
    }

    if (examenData['reglasExamen'] && Array.isArray(examenData['reglasExamen']) && examenData['reglasExamen'].length > 0) {
      (examenData['reglasExamen'] as string[]).forEach((regla: string) => {
        this.reglasExamen.push(this.fb.control(regla, Validators.required));
      });
    } else {
      this.reglasExamen.push(this.createRegla());
    }

    if (examenData['materialesPermitidos'] && Array.isArray(examenData['materialesPermitidos']) && examenData['materialesPermitidos'].length > 0) {
      (examenData['materialesPermitidos'] as string[]).forEach((material: string) => {
        this.materialesPermitidos.push(this.fb.control(material, Validators.required));
      });
    } else {
      this.materialesPermitidos.push(this.createMaterial());
    }

    // Establecer los valores del formulario
    this.examenForm.patchValue({
      titulo: examenData['titulo'],
      descripcion: examenData['descripcion'],
      tipo: examenData['tipo'],
      duracion: examenData['duracion'],
      puntajeMaximo: examenData['puntajeMaximo'],
      fechaInicio: examenData['fechaInicio'],
      intentosPermitidos: examenData['intentosPermitidos']
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
      this.formSubmit.emit(this.examenForm.value);
    } else {
      this.markFormGroupTouched(this.examenForm);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
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
