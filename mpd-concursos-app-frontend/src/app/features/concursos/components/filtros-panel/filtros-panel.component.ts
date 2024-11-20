import { Component, EventEmitter, Output } from '@angular/core';
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
export class FiltrosPanelComponent {
  @Output() filtrosChange = new EventEmitter<FiltrosConcurso>();
  @Output() cerrarPanel = new EventEmitter<void>();

  filtrosForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      estado: [''],
      fechaDesde: [null],
      fechaHasta: [null],
      dependencia: [''],
      cargo: ['']
    });
  }

  aplicarFiltros(): void {
    if (this.filtrosForm.valid) {
      this.filtrosChange.emit(this.filtrosForm.value);
      this.cerrarPanel.emit();
    }
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
  }

  cerrar(): void {
    this.cerrarPanel.emit();
  }
} 