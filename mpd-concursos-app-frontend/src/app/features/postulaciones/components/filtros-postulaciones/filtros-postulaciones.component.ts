import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-filtros-postulaciones',
  templateUrl: './filtros-postulaciones.component.html',
  styleUrls: ['./filtros-postulaciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatIconModule
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

  estadoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'list' },
    { value: 'pendiente', label: 'Pendiente', icon: 'hourglass_empty' },
    { value: 'aprobado', label: 'Aprobado', icon: 'check_circle' },
    { value: 'rechazado', label: 'Rechazado', icon: 'cancel' }
  ];

  periodoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'date_range' },
    { value: 'hoy', label: 'Hoy', icon: 'today' },
    { value: 'semana', label: 'Última semana', icon: 'date_range' },
    { value: 'mes', label: 'Último mes', icon: 'calendar_today' }
  ];

  dependenciaOptions: FilterOption[] = [
    { value: 'todas', label: 'Todas', icon: 'account_balance' },
    { value: 'fiscal', label: 'Fiscalía', icon: 'gavel' },
    { value: 'defensa', label: 'Defensoría', icon: 'security' },
    { value: 'admin', label: 'Administración', icon: 'business' }
  ];

  cargoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'work' },
    { value: 'fiscal', label: 'Fiscal', icon: 'assignment_ind' },
    { value: 'defensor', label: 'Defensor Público', icon: 'person' },
    { value: 'asistente', label: 'Asistente', icon: 'support_agent' },
    { value: 'administrativo', label: 'Administrativo', icon: 'badge' }
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      estado: [null],
      periodo: [null],
      dependencia: [null],
      cargo: [null]
    });
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
