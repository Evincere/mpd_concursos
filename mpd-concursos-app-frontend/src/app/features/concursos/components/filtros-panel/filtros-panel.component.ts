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
import { FiltrosConcurso } from '@shared/interfaces/filters/filtros.interface';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-filtros-panel',
  templateUrl: './filtros-panel.component.html',
  styleUrls: ['./filtros-panel.component.scss'],
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
export class FiltrosPanelComponent implements OnInit, OnDestroy {
  @Output() filtrosChange = new EventEmitter<FiltrosConcurso>();
  @Output() cerrar = new EventEmitter<void>();

  filtrosForm: FormGroup;
  private destroy$ = new Subject<void>();

  estadoOptions: FilterOption[] = [
    { value: 'activo', label: 'Activo', icon: 'check_circle' },
    { value: 'finalizado', label: 'Finalizado', icon: 'cancel' },
    { value: 'todos', label: 'Todos', icon: 'all_inclusive' }
  ];

  categoriaOptions: FilterOption[] = [
    { value: 'administrativo', label: 'Administrativo', icon: 'business' },
    { value: 'tecnico', label: 'Técnico', icon: 'build' },
    { value: 'profesional', label: 'Profesional', icon: 'school' }
  ];

  dependenciaOptions: FilterOption[] = [
    { value: 'defensa_penal', label: 'Defensa Penal', icon: 'gavel' },
    { value: 'recursos_humanos', label: 'Recursos Humanos', icon: 'people' },
    { value: 'informatica', label: 'Informática', icon: 'computer' }
  ];

  cargoOptions: FilterOption[] = [
    { value: 'defensor', label: 'Defensor', icon: 'person' },
    { value: 'analista', label: 'Analista', icon: 'analytics' },
    { value: 'asistente', label: 'Asistente', icon: 'support_agent' }
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      estado: ['todos'],
      categoria: [''],
      dependencia: [''],
      cargo: ['']
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
        this.filtrosChange.emit(filtros);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cerrarPanel(): void {
    this.cerrar.emit();
  }
}
