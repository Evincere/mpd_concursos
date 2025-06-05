import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSelectComponent, SelectOption } from '@shared/components/custom-form/custom-select/custom-select.component';

@Component({
  selector: 'app-filtros-postulaciones',
  templateUrl: './filtros-postulaciones.component.html',
  styleUrls: ['./filtros-postulaciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomSelectComponent
  ],
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ],
  host: {
    'class': 'filtros-panel-container',
    '[@slidePanel]': ''
  }
})
export class FiltrosPostulacionesComponent implements OnInit, OnDestroy {
  @Output() filtrosChange = new EventEmitter<FiltrosPostulacion>();
  @Output() cerrar = new EventEmitter<void>();

  filtrosForm: FormGroup;
  private destroy$ = new Subject<void>();

  estadoOptions: SelectOption[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' }
  ];

  periodoOptions: SelectOption[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Última semana' },
    { value: 'mes', label: 'Último mes' }
  ];

  dependenciaOptions: SelectOption[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'fiscal', label: 'Fiscalía' },
    { value: 'defensa', label: 'Defensoría' },
    { value: 'admin', label: 'Administración' }
  ];

  cargoOptions: SelectOption[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'fiscal', label: 'Fiscal' },
    { value: 'defensor', label: 'Defensor Público' },
    { value: 'asistente', label: 'Asistente' },
    { value: 'administrativo', label: 'Administrativo' }
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      estado: [null],
      periodo: [null],
      dependencia: [null],
      cargo: [null]
    });
  }

  // Métodos para obtener FormControl de manera type-safe
  get estadoControl(): FormControl {
    return this.filtrosForm.get('estado') as FormControl;
  }

  get periodoControl(): FormControl {
    return this.filtrosForm.get('periodo') as FormControl;
  }

  get dependenciaControl(): FormControl {
    return this.filtrosForm.get('dependencia') as FormControl;
  }

  get cargoControl(): FormControl {
    return this.filtrosForm.get('cargo') as FormControl;
  }

  ngOnInit() {
    // Inicializar con valores por defecto
    this.filtrosForm.patchValue({
      estado: 'todos',
      periodo: 'todos',
      dependencia: 'todas',
      cargo: 'todos'
    });

    // Suscribirse a los cambios del formulario
    this.filtrosForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(valores => {
        this.filtrosChange.emit(valores);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  limpiarFiltros(): void {
    this.filtrosForm.patchValue({
      estado: 'todos',
      periodo: 'todos',
      dependencia: 'todas',
      cargo: 'todos'
    });
  }

  cerrarPanel(): void {
    this.cerrar.emit();
  }
}
