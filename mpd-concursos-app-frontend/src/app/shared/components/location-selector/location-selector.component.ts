import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { AutocompleteComponent, AutocompleteItem } from '../autocomplete/autocomplete.component';
import { LocationDataService } from '../../services/location-data.service';
import { Province, Municipality } from '../../data/argentina-locations.data';

/**
 * Valor del selector de ubicación
 */
export interface LocationValue {
  country: string;
  province: Province | null;
  municipality: Municipality | null;
}

/**
 * Configuración del selector de ubicación
 */
export interface LocationSelectorConfig {
  showCountry?: boolean;
  countryLabel?: string;
  provinceLabel?: string;
  municipalityLabel?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Componente para seleccionar ubicación (País, Provincia, Municipio)
 * Implementa cascada inteligente: Municipio se habilita después de seleccionar Provincia
 */
@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutocompleteComponent],
  templateUrl: './location-selector.component.html',
  styleUrls: ['./location-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationSelectorComponent),
      multi: true
    }
  ]
})
export class LocationSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input() config: LocationSelectorConfig = {};
  @Input() showErrors: boolean = false;
  @Input() errors: { [key: string]: string } = {};

  @Output() locationChanged = new EventEmitter<LocationValue>();
  @Output() provinceChanged = new EventEmitter<Province | null>();
  @Output() municipalityChanged = new EventEmitter<Municipality | null>();

  // Formulario interno
  locationForm: FormGroup;

  // Estado del componente
  selectedProvince: Province | null = null;
  selectedMunicipality: Municipality | null = null;
  municipalitiesEnabled: boolean = false;

  // Control de formulario
  private onChange = (value: LocationValue) => {};
  public onTouched = () => {};
  private disabled: boolean = false;

  // Subjects
  private destroy$ = new Subject<void>();

  // Configuración por defecto
  private defaultConfig: LocationSelectorConfig = {
    showCountry: true,
    countryLabel: 'País',
    provinceLabel: 'Provincia',
    municipalityLabel: 'Municipio',
    required: false,
    disabled: false
  };

  constructor(
    private fb: FormBuilder,
    private locationService: LocationDataService
  ) {
    this.locationForm = this.fb.group({
      country: ['Argentina'],
      province: [''],
      municipality: ['']
    });
  }

  ngOnInit(): void {
    // Combinar configuración
    this.config = { ...this.defaultConfig, ...this.config };

    // Suscribirse a cambios en la provincia seleccionada del servicio
    this.locationService.selectedProvince$
      .pipe(takeUntil(this.destroy$))
      .subscribe(province => {
        if (province && province.id !== this.selectedProvince?.id) {
          this.selectedProvince = province;
          this.enableMunicipalities();
          this.clearMunicipality();
        }
      });

    // Suscribirse a cambios en el formulario
    this.locationForm.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.emitLocationChange();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Implementación de ControlValueAccessor
  writeValue(value: LocationValue | null): void {
    if (value) {
      this.locationForm.patchValue({
        country: value.country || 'Argentina',
        province: value.province?.name || '',
        municipality: value.municipality?.name || ''
      }, { emitEvent: false });

      this.selectedProvince = value.province;
      this.selectedMunicipality = value.municipality;

      if (this.selectedProvince) {
        this.enableMunicipalities();
      }
    } else {
      this.resetForm();
    }
  }

  registerOnChange(fn: (value: LocationValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.config.disabled = isDisabled;

    if (isDisabled) {
      this.locationForm.disable();
    } else {
      this.locationForm.enable();
      // Mantener país deshabilitado
      this.locationForm.get('country')?.disable();
    }
  }

  /**
   * Función de búsqueda para provincias
   */
  searchProvinces = (query: string): Observable<AutocompleteItem[]> => {
    return this.locationService.searchProvinces(query).pipe(
      takeUntil(this.destroy$),
      map(result => result.items.map(province => ({
        ...province,
        id: province.id,
        name: province.name
      })))
    );
  };

  /**
   * Función de búsqueda para municipios
   */
  searchMunicipalities = (query: string): Observable<AutocompleteItem[]> => {
    if (!this.selectedProvince) {
      return new Observable(observer => observer.next([]));
    }

    return this.locationService.searchMunicipalities(query, this.selectedProvince.id).pipe(
      takeUntil(this.destroy$),
      map(result => result.items.map(municipality => ({
        ...municipality,
        id: municipality.id,
        name: municipality.name
      })))
    );
  };

  /**
   * Maneja la selección de provincia
   */
  onProvinceSelected(item: AutocompleteItem): void {
    const province = item as Province;
    this.selectedProvince = province;
    this.locationService.setSelectedProvince(province);

    this.locationForm.patchValue({
      province: province.name
    });

    this.enableMunicipalities();
    this.clearMunicipality();
    this.provinceChanged.emit(province);
    this.onTouched();
  }

  /**
   * Maneja la selección de municipio
   */
  onMunicipalitySelected(item: AutocompleteItem): void {
    const municipality = item as Municipality;
    this.selectedMunicipality = municipality;

    this.locationForm.patchValue({
      municipality: municipality.name
    });

    this.municipalityChanged.emit(municipality);
    this.onTouched();
  }

  /**
   * Habilita el selector de municipios
   */
  private enableMunicipalities(): void {
    this.municipalitiesEnabled = true;
    this.locationForm.get('municipality')?.enable();
  }

  /**
   * Limpia la selección de municipio
   */
  private clearMunicipality(): void {
    this.selectedMunicipality = null;
    this.locationForm.patchValue({
      municipality: ''
    });
  }

  /**
   * Emite el cambio de ubicación
   */
  private emitLocationChange(): void {
    const locationValue: LocationValue = {
      country: 'Argentina',
      province: this.selectedProvince,
      municipality: this.selectedMunicipality
    };

    this.locationChanged.emit(locationValue);
    this.onChange(locationValue);
  }

  /**
   * Resetea el formulario
   */
  private resetForm(): void {
    this.selectedProvince = null;
    this.selectedMunicipality = null;
    this.municipalitiesEnabled = false;

    this.locationForm.reset({
      country: 'Argentina',
      province: '',
      municipality: ''
    });

    this.locationForm.get('country')?.disable();
    this.locationForm.get('municipality')?.disable();
  }

  /**
   * Verifica si un campo tiene error
   */
  hasError(fieldName: string): boolean {
    return this.showErrors && !!this.errors[fieldName];
  }

  /**
   * Obtiene el mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    return this.errors[fieldName] || '';
  }

  /**
   * Verifica si el formulario es válido
   */
  get isValid(): boolean {
    if (!this.config.required) return true;

    return !!(this.selectedProvince &&
             (this.municipalitiesEnabled ? this.selectedMunicipality : true));
  }

  /**
   * Obtiene el valor actual
   */
  get currentValue(): LocationValue {
    return {
      country: 'Argentina',
      province: this.selectedProvince,
      municipality: this.selectedMunicipality
    };
  }
}
