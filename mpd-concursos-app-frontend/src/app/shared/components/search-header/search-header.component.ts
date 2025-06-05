import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

@Component({
  selector: 'app-search-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomButtonComponent
  ],
  templateUrl: './search-header.component.html',
  styleUrl: './search-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchHeaderComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() placeholder = 'Ingrese término de búsqueda';
  @Input() filtrosActivos = false;
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterClick = new EventEmitter<void>();

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
        this.searchChange.emit(value || '');
      });
  }

  limpiarBusqueda(): void {
    this.searchForm.get('termino')?.reset();
    this.searchChange.emit('');
  }

  getTerminoControl(): FormControl {
    return this.searchForm.get('termino') as FormControl;
  }
}
