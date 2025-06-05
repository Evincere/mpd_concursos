import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FiltersConcurso } from '@shared/interfaces/filters/filters-concurso.interface';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';

interface FilterOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-filtros-panel',
  templateUrl: './filtros-panel.component.html',
  styleUrls: ['./filtros-panel.component.scss'],
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
export class FiltrosPanelComponent implements OnInit, OnDestroy {
  @Output() filtrosChange = new EventEmitter<FiltersConcurso>();
  @Output() cerrar = new EventEmitter<void>();

  filtrosForm: FormGroup;
  private destroy$ = new Subject<void>();

  estadoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'list' },
    { value: 'activo', label: 'Activo', icon: 'check-circle' },
    { value: 'proximo', label: 'Próximo', icon: 'clock' },
    { value: 'finalizado', label: 'Finalizado', icon: 'times-circle' }
  ];

  periodoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'calendar' },
    { value: 'hoy', label: 'Hoy', icon: 'calendar-day' },
    { value: 'semana', label: 'Esta semana', icon: 'calendar-week' },
    { value: 'mes', label: 'Este mes', icon: 'calendar-alt' },
    { value: 'trimestre', label: 'Este trimestre', icon: 'calendar-check' },
    { value: 'anio', label: 'Este año', icon: 'calendar-plus' }
  ];

  dependenciaOptions: FilterOption[] = [
    { value: 'todos', label: 'Todas', icon: 'building' },
    { value: 'defensa_penal', label: 'Defensa Penal', icon: 'gavel' },
    { value: 'recursos_humanos', label: 'Recursos Humanos', icon: 'users' },
    { value: 'informatica', label: 'Informática', icon: 'laptop' }
  ];

  cargoOptions: FilterOption[] = [
    { value: 'todos', label: 'Todos', icon: 'briefcase' },
    { value: 'defensor', label: 'Defensor', icon: 'user-tie' },
    { value: 'analista', label: 'Analista', icon: 'chart-line' },
    { value: 'asistente', label: 'Asistente', icon: 'user-cog' }
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      estado: ['todos'],
      periodo: ['todos'],
      dependencia: ['todos'],
      cargo: ['todos']
    });
  }

  ngOnInit(): void {
    this.filtrosForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filtros => {
        const filtrosFormateados: FiltersConcurso = {
          estado: filtros.estado as FiltersConcurso['estado'],
          periodo: filtros.periodo as FiltersConcurso['periodo'],
          dependencia: filtros.dependencia,
          cargo: filtros.cargo
        };
        this.filtrosChange.emit(filtrosFormateados);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cerrarPanel(): void {
    this.cerrar.emit();
  }

  onToggleChange(controlName: string, value: string): void {
    this.filtrosForm.get(controlName)?.setValue(value);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      estado: 'todos',
      periodo: 'todos',
      dependencia: 'todos',
      cargo: 'todos'
    });
  }

  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente por el valueChanges
    // Este método puede usarse para feedback visual o cerrar el panel
    this.cerrarPanel();
  }

  getDependenciaControl(): FormControl {
    return this.filtrosForm.get('dependencia') as FormControl;
  }

  getCargoControl(): FormControl {
    return this.filtrosForm.get('cargo') as FormControl;
  }
}
