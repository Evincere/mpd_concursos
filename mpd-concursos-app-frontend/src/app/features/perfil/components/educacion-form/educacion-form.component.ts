import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap, tap, delay } from 'rxjs/operators';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BehaviorSubject, Subscription, of, EMPTY } from 'rxjs';
import { Educacion, TipoEducacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../../../core/services/profile/profile.service';

@Component({
  selector: 'app-educacion-form',
  templateUrl: './educacion-form.component.html',
  styleUrls: ['./educacion-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class EducacionFormComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  @Input() educacion?: Educacion;
  @Output() submitEducacion = new EventEmitter<Educacion>();
  @Output() cancelar = new EventEmitter<void>();

  educacionForm!: FormGroup;
  tiposEducacion = Object.values(TipoEducacion);
  estadosEducacion = Object.values(EstadoEducacion);
  tiposActividadCientifica = Object.values(TipoActividadCientifica);
  caracteresActividadCientifica = Object.values(CaracterActividadCientifica);
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    if (this.educacion) {
      this.educacionForm.patchValue(this.educacion, { emitEvent: false });
      this.actualizarValidacionesPorTipo(this.educacion.tipo);
    }

    const tipoControl = this.educacionForm.get('tipo');
    if (tipoControl) {
      this.subscription.add(
        tipoControl.valueChanges
          .pipe(
            debounceTime(100),
            distinctUntilChanged()
          )
          .subscribe(tipo => {
            if (tipo) {
              this.actualizarValidacionesPorTipo(tipo);
            }
          })
      );
    }
  }

  private actualizarValidacionesPorTipo(tipo: TipoEducacion): void {
    if (!tipo) return;

    // Establecer validaciones básicas sin usar queueMicrotask
    const form = this.educacionForm;
    
    // Restablecer validaciones
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Aplicar validaciones comunes
    form.get('tipo')?.setValidators([Validators.required]);
    form.get('estado')?.setValidators([Validators.required]);
    form.get('titulo')?.setValidators([Validators.required]);
    form.get('institucion')?.setValidators([Validators.required]);

    // Aplicar validaciones específicas
    switch (tipo) {
      case TipoEducacion.GRADO:
      case TipoEducacion.NIVEL_SUPERIOR:
        form.get('duracionAnios')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        form.get('temaTesis')?.setValidators([Validators.required]);
        break;
      case TipoEducacion.CURSO:
      case TipoEducacion.DIPLOMATURA:
        form.get('cargaHoraria')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        form.get('tipoActividad')?.setValidators([Validators.required]);
        form.get('caracter')?.setValidators([Validators.required]);
        break;
    }

    // Actualizar validaciones sin forzar detección de cambios
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private initializeForm(): void {
    this.educacionForm = this.fb.group({
      tipo: ['', Validators.required],
      estado: ['', Validators.required],
      titulo: ['', Validators.required],
      institucion: ['', Validators.required],
      fechaEmision: [null],
      documentoId: [null],
      duracionAnios: [null],
      promedio: [null],
      temaTesis: [null],
      cargaHoraria: [null],
      evaluacionFinal: [false],
      tipoActividad: [null],
      caracter: [null],
      lugarFechaExposicion: [null],
      comentarios: [null],
      fechaInicio: [null],
      fechaFin: [null]
    });
  }

  onSubmit(): void {
    if (this.educacionForm.valid) {
      this.isLoading = true;
      const educacionData = this.educacionForm.getRawValue();
      this.submitEducacion.emit(educacionData);
      this.isLoading = false;
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      this.educacionForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancelar.emit();
  }
}