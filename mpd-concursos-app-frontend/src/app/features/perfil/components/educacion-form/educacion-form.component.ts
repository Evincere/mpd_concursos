import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
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
import { Subscription } from 'rxjs';
import { DateAdapter } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Educacion, TipoEducacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../../../core/services/profile/profile.service';

@Component({
  selector: 'app-educacion-form',
  templateUrl: './educacion-form.component.html',
  styleUrls: ['./educacion-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: '0px' }))
      ])
    ])
  ],
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
  private formInitialized = false;
  private datepickerLoaded = false;
  private readonly destroyRef = new EventEmitter<void>();

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyRef.emit();
    this.destroyRef.complete();
    this.educacionForm?.reset();
    this.cdr.detach();
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
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Date>,
    private ngZone: NgZone
  ) {
    this.dateAdapter.setLocale('es-ES');
    this.dateAdapter.getFirstDayOfWeek = () => 1;
  }

  private actualizarValidacionesPorTipo(tipo: TipoEducacion): void {
    if (!tipo || !this.formInitialized) return;
  
    // Ejecutar las actualizaciones en el siguiente ciclo de detección de cambios
    Promise.resolve().then(() => {
      const form = this.educacionForm;
      const controlsToUpdate = new Map<string, ValidatorFn[]>();
  
      // Configuración base de validadores
      controlsToUpdate.set('tipo', [Validators.required]);
      controlsToUpdate.set('estado', [Validators.required]);
      controlsToUpdate.set('titulo', [Validators.required]);
      controlsToUpdate.set('institucion', [Validators.required]);
  
      // Agregar validaciones específicas de manera asíncrona
      switch (tipo) {
        case TipoEducacion.GRADO:
        case TipoEducacion.NIVEL_SUPERIOR:
          controlsToUpdate.set('duracionAnios', [Validators.required, Validators.min(1)]);
          break;
        case TipoEducacion.POSGRADO_ESPECIALIZACION:
        case TipoEducacion.POSGRADO_MAESTRIA:
        case TipoEducacion.POSGRADO_DOCTORADO:
          controlsToUpdate.set('temaTesis', [Validators.required]);
          break;
        case TipoEducacion.CURSO:
        case TipoEducacion.DIPLOMATURA:
          controlsToUpdate.set('cargaHoraria', [Validators.required, Validators.min(1)]);
          break;
        case TipoEducacion.ACTIVIDAD_CIENTIFICA:
          controlsToUpdate.set('tipoActividad', [Validators.required]);
          controlsToUpdate.set('caracter', [Validators.required]);
          break;
      }
  
      // Actualizar validadores de manera eficiente
      this.ngZone.runOutsideAngular(() => {
        controlsToUpdate.forEach((validators, controlName) => {
          const control = form.get(controlName);
          if (control) {
            control.clearValidators();
            control.setValidators(validators);
            control.updateValueAndValidity({ emitEvent: false, onlySelf: true });
          }
        });
  
        // Forzar la detección de cambios solo una vez después de todas las actualizaciones
        this.ngZone.run(() => {
          queueMicrotask(() => this.cdr.markForCheck());
        });
      });
    });
  }

  private initializeForm(): void {
    const baseControls = {
      tipo: ['', Validators.required],
      estado: ['', Validators.required],
      titulo: ['', Validators.required],
      institucion: ['', Validators.required]
    };
  
    // Initialize only the base form controls initially
    this.educacionForm = this.fb.group(baseControls);
  
    // Lazy initialize additional controls when needed
    const additionalControls = {
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
    };
  
    // Add additional controls asynchronously
    queueMicrotask(() => {
      Object.entries(additionalControls).forEach(([key, value]) => {
        this.educacionForm.addControl(key, this.fb.control(value[0]));
      });
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.cdr.detach(); // Detach change detector initially
    
    // Inicializar el formulario de manera asíncrona
    Promise.resolve().then(() => {
      this.initializeForm();
      
      if (this.educacion) {
        this.educacionForm.patchValue(this.educacion, { emitEvent: false });
        this.actualizarValidacionesPorTipo(this.educacion.tipo);
      }
      
      this.formInitialized = true;
      this.cdr.reattach(); // Reattach change detector after initialization

      // Suscribirse a los cambios de tipo con debounce
      const tipoControl = this.educacionForm.get('tipo');
      if (tipoControl) {
        this.subscription.add(
          tipoControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(tipo => !!tipo),
            takeUntil(this.destroyRef)
          ).subscribe(tipo => {
            this.actualizarValidacionesPorTipo(tipo);
          })
        );
      }
    });
  }

  loadDatepickerResources(): void {
    if (!this.datepickerLoaded) {
      this.ngZone.runOutsideAngular(() => {
        // Defer datepicker initialization
        setTimeout(() => {
          this.datepickerLoaded = true;
          this.ngZone.run(() => this.cdr.markForCheck());
        }, 0);
      });
    }
  }

  onSubmit(): void {
    if (this.educacionForm.valid) {
      this.isLoading = true;
      this.submitEducacion.emit(this.educacionForm.value);
    }
  }

  onCancel(): void {
    this.cancelar.emit();
  }
}