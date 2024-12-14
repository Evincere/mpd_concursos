import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './search-header.component.html',
  styleUrl: './search-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchHeaderComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() placeholder: string = 'Ingrese término de búsqueda';
  @Input() filtrosActivos: boolean = false;
  @Output() search = new EventEmitter<string>();
  @Output() filter = new EventEmitter<void>();

  searchForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      termino: ['']
    });

    this.searchForm.get('termino')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.search.emit(value);
      });
  }

  limpiarBusqueda(): void {
    this.searchForm.get('termino')?.reset();
  }
}
