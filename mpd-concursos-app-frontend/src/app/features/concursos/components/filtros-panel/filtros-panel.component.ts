import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FiltrosConcurso } from '../../../../shared/interfaces/filters/filtros.interface';

@Component({
  selector: 'app-filtros-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './filtros-panel.component.html',
  styleUrls: ['./filtros-panel.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class FiltrosPanelComponent implements OnInit {
  @Output() filtrosChange = new EventEmitter<FiltrosConcurso>();
  @Output() cerrarPanel = new EventEmitter<void>();

  filtrosForm!: FormGroup;

  estadoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'Activo' },
    { value: 'proximo', label: 'Próximo' },
    { value: 'finalizado', label: 'Finalizado' }
  ];

  periodoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Última semana' },
    { value: 'mes', label: 'Último mes' },
    { value: 'trimestre', label: 'Último trimestre' },
    { value: 'anio', label: 'Último año' }
  ];

  dependenciaOptions = [
    { value: 'todos', label: 'Todas' },
    { value: 'defensoria1', label: 'Defensoría Civil Nº 1' },
    { value: 'defensoria2', label: 'Defensoría Civil Nº 2' },
    { value: 'defensoria3', label: 'Defensoría Penal Nº 1' },
    { value: 'defensoria4', label: 'Defensoría Penal Nº 2' },
    { value: 'asesoria1', label: 'Asesoría de Menores Nº 1' },
    { value: 'asesoria2', label: 'Asesoría de Menores Nº 2' }
  ];

  cargoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'defensor', label: 'Defensor/a' },
    { value: 'asesor', label: 'Asesor/a' },
    { value: 'secretario', label: 'Secretario/a' },
    { value: 'prosecretario', label: 'Prosecretario/a' },
    { value: 'administrativo', label: 'Administrativo/a' },
    { value: 'auxiliar', label: 'Auxiliar' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.filtrosForm = this.fb.group({
      estado: ['todos'],
      periodo: ['todos'],
      dependencia: ['todos'],
      cargo: ['todos']
    });
  }

  aplicarFiltros(): void {
    if (this.filtrosForm.valid) {
      this.filtrosChange.emit(this.filtrosForm.value);
      this.cerrarPanel.emit();
    }
  }

  limpiarFiltros(): void {
    this.filtrosForm.patchValue({
      estado: 'todos',
      periodo: 'todos',
      dependencia: 'todos',
      cargo: 'todos'
    });
  }

  cerrar(): void {
    this.cerrarPanel.emit();
  }

  ngOnInit(): void {
    this.initForm();
  }
} 