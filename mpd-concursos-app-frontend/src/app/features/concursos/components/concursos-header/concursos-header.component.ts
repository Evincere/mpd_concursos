import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BusquedaConcurso } from '@shared/interfaces/filters/filtros.interface';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-concursos-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './concursos-header.component.html',
  styleUrl: './concursos-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcursosHeaderComponent {
  @Output() filtrar = new EventEmitter<void>();
  @Output() buscar = new EventEmitter<BusquedaConcurso>();
  @Output() limpiar = new EventEmitter<void>();

  searchForm!: FormGroup;
  filterForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.searchForm.get('termino')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(termino => {
        this.buscar.emit({ termino });
      });
  }

  private initializeForms() {
    this.searchForm = this.fb.group({
      termino: ['']
    });

    this.filterForm = this.fb.group({
      estado: [''],
      fechaDesde: [null],
      fechaHasta: [null],
      dependencia: [''],
      cargo: ['']
    });
  }

  onFiltrar(): void {
    this.filtrar.emit();
  }

  limpiarBusqueda(): void {
    this.searchForm.get('termino')?.setValue('');
    this.buscar.emit({ termino: '' });
  }
}
