/**
 * Componente de Búsqueda Avanzada del Sistema CV
 * 
 * @description Componente para búsqueda y filtrado avanzado del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Servicios del CV
import {
  CvSearchService,
  CvAutocompleteService,
  AutocompleteCategory,
  AdvancedSearchFilters,
  SearchResult,
  SearchFacets,
  AutocompleteSuggestion
} from '@core/services/cv';

// Modelos
import { WorkExperience, EducationEntry, EducationType, EducationStatus } from '@core/models/cv';

// Componentes compartidos
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

/**
 * Evento de cambio de filtros
 */
export interface FilterChangeEvent {
  filters: AdvancedSearchFilters;
  experienceResults: SearchResult<WorkExperience>;
  educationResults: SearchResult<EducationEntry>;
}

@Component({
  selector: 'app-cv-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomButtonComponent
  ],
  templateUrl: './cv-search.component.html',
  styleUrls: ['./cv-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvSearchComponent implements OnInit, OnDestroy {

  // ===== INPUTS Y OUTPUTS =====
  @Input() experiences: WorkExperience[] = [];
  @Input() education: EducationEntry[] = [];
  @Input() isLoading = false;

  @Output() filtersChange = new EventEmitter<FilterChangeEvent>();
  @Output() quickSearch = new EventEmitter<string>();

  // ===== SIGNALS =====
  public readonly searchForm = signal<FormGroup | null>(null);
  public readonly showAdvancedFilters = signal<boolean>(false);
  public readonly facets = signal<SearchFacets | null>(null);
  public readonly suggestions = signal<AutocompleteSuggestion[]>([]);
  public readonly isSearching = signal<boolean>(false);

  // ===== COMPUTED SIGNALS =====
  public readonly hasActiveFilters = computed(() => {
    const form = this.searchForm();
    if (!form) return false;

    const values = form.value;

    return !!(
      values.searchTerm ||
      values.companies?.length > 0 ||
      values.positions?.length > 0 ||
      values.technologies?.length > 0 ||
      values.institutions?.length > 0 ||
      values.educationTypes?.length > 0 ||
      values.educationStatuses?.length > 0 ||
      values.dateFrom ||
      values.dateTo ||
      values.isCurrentJob !== undefined ||
      values.isOngoing !== undefined
    );
  });

  public readonly activeFiltersCount = computed(() => {
    const form = this.searchForm();
    if (!form) return 0;

    const values = form.value;
    let count = 0;

    if (values.searchTerm) count++;
    if (values.companies?.length > 0) count++;
    if (values.positions?.length > 0) count++;
    if (values.technologies?.length > 0) count++;
    if (values.institutions?.length > 0) count++;
    if (values.educationTypes?.length > 0) count++;
    if (values.educationStatuses?.length > 0) count++;
    if (values.dateFrom || values.dateTo) count++;
    if (values.isCurrentJob !== undefined) count++;
    if (values.isOngoing !== undefined) count++;

    return count;
  });

  // ===== OPCIONES DE FILTROS =====
  public readonly educationTypeOptions = [
    { value: EducationType.SECONDARY, label: 'Educación Secundaria' },
    { value: EducationType.HIGHER_EDUCATION_CAREER, label: 'Carrera de Nivel Superior' },
    { value: EducationType.UNDERGRADUATE_CAREER, label: 'Carrera de grado' },
    { value: EducationType.POSTGRADUATE_SPECIALIZATION, label: 'Posgrado: especialización' },
    { value: EducationType.POSTGRADUATE_MASTERS, label: 'Posgrado: maestría' },
    { value: EducationType.POSTGRADUATE_DOCTORATE, label: 'Posgrado: doctorado' },
    { value: EducationType.DIPLOMA, label: 'Diplomatura' },
    { value: EducationType.TRAINING_COURSE, label: 'Curso de Capacitación' },
    { value: EducationType.SCIENTIFIC_ACTIVITY, label: 'Actividad Científica (investigación y/o difusión)' }
  ];

  public readonly educationStatusOptions = [
    { value: EducationStatus.IN_PROGRESS, label: 'en proceso' },
    { value: EducationStatus.COMPLETED, label: 'finalizado' }
  ];

  public readonly sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'relevance', label: 'Relevancia' },
    { value: 'alphabetical', label: 'Alfabético' },
    { value: 'duration', label: 'Duración' }
  ];

  public readonly sortOrderOptions = [
    { value: 'desc', label: 'Descendente' },
    { value: 'asc', label: 'Ascendente' }
  ];

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();

  // ===== CONSTRUCTOR =====
  constructor(
    private readonly fb: FormBuilder,
    private readonly searchService: CvSearchService,
    private readonly autocompleteService: CvAutocompleteService
  ) {}

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.searchForm.set(this.createSearchForm());
    this.setupFormWatchers();
    this.updateSearchData();
    this.loadFacets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Maneja la entrada de búsqueda rápida
   */
  onQuickSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const form = this.searchForm();
      if (form) {
        form.patchValue({ searchTerm: target.value });
        this.quickSearch.emit(target.value);
      }
    }
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    const form = this.searchForm();
    if (form) {
      form.patchValue({ searchTerm: '' });
      this.quickSearch.emit('');
    }
  }

  /**
   * Alterna la visibilidad de filtros avanzados
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(show => !show);
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    const form = this.searchForm();
    if (form) {
      form.reset({
        searchTerm: '',
        companies: [],
        positions: [],
        technologies: [],
        institutions: [],
        educationTypes: [],
        educationStatuses: [],
        dateFrom: null,
        dateTo: null,
        isCurrentJob: undefined,
        isOngoing: undefined,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    }

    this.searchService.resetFilters();
  }

  /**
   * Aplica filtros desde facetas
   */
  applyFacetFilter(facetType: string, value: string, selected: boolean): void {
    const form = this.searchForm();
    if (!form) return;

    const currentValues = form.get(facetType)?.value || [];

    if (selected) {
      // Agregar valor si no existe
      if (!currentValues.includes(value)) {
        form.patchValue({
          [facetType]: [...currentValues, value]
        });
      }
    } else {
      // Remover valor
      form.patchValue({
        [facetType]: currentValues.filter((v: string) => v !== value)
      });
    }
  }

  /**
   * Obtiene sugerencias de autocompletado (simplificado)
   */
  getSuggestions(term: string, category: string): void {
    // Implementación simplificada - por ahora solo limpia las sugerencias
    this.suggestions.set([]);
  }

  /**
   * Selecciona una sugerencia (simplificado)
   */
  selectSuggestion(suggestion: any, fieldName: string): void {
    // Implementación simplificada
    this.suggestions.set([]);
  }

  /**
   * Remueve un valor de un campo de array
   */
  removeArrayValue(fieldName: string, value: string): void {
    const form = this.searchForm();
    if (!form) return;

    const currentValues = form.get(fieldName)?.value || [];

    form.patchValue({
      [fieldName]: currentValues.filter((v: string) => v !== value)
    });

    this.performSearch();
  }

  /**
   * Exporta filtros actuales
   */
  exportFilters(): AdvancedSearchFilters {
    return this.buildFiltersFromForm();
  }

  /**
   * Importa filtros
   */
  importFilters(filters: AdvancedSearchFilters): void {
    const form = this.searchForm();
    if (!form) return;

    form.patchValue({
      searchTerm: filters.searchTerm,
      companies: filters.companies,
      positions: filters.positions,
      technologies: filters.technologies,
      institutions: filters.institutions,
      educationTypes: filters.educationTypes,
      educationStatuses: filters.educationStatuses,
      dateFrom: filters.dateRange.from,
      dateTo: filters.dateRange.to,
      datePreset: filters.dateRange.preset,
      isCurrentJob: filters.isCurrentJob,
      isOngoing: filters.isOngoing,
      keywords: filters.keywords,
      excludeKeywords: filters.excludeKeywords,
      locationFilters: filters.locationFilters,
      minSalary: filters.salaryRange?.min,
      maxSalary: filters.salaryRange?.max,
      minGrade: filters.gradeRange?.min,
      maxGrade: filters.gradeRange?.max,
      hasAchievements: filters.hasAchievements,
      hasProjects: filters.hasProjects,
      fuzzySearch: filters.fuzzySearch,
      exactMatch: filters.exactMatch,
      caseSensitive: filters.caseSensitive,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });
  }

  /**
   * Aplica un preset de rango de fechas
   */
  applyDatePreset(preset: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year'): void {
    this.searchService.applyDatePreset(preset);
    const form = this.searchForm();
    if (form) {
      form.patchValue({ datePreset: preset });
    }
  }

  /**
   * Aplica filtros combinados inteligentes
   */
  applyCombinedFilters(filters: Partial<AdvancedSearchFilters>): void {
    this.searchService.applyCombinedFilters(filters);
  }

  /**
   * Obtiene opciones de preset de fechas
   */
  getDatePresetOptions(): Array<{value: string, label: string}> {
    return [
      { value: '', label: 'Personalizado' },
      { value: 'last_month', label: 'Último mes' },
      { value: 'last_3_months', label: 'Últimos 3 meses' },
      { value: 'last_6_months', label: 'Últimos 6 meses' },
      { value: 'last_year', label: 'Último año' }
    ];
  }

  /**
   * Maneja el cambio de preset de fechas
   */
  onDatePresetChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const preset = select.value as 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year';

    if (preset) {
      this.applyDatePreset(preset);
    }
  }

  /**
   * Agrega un valor a un campo de array
   */
  addFilterValue(fieldName: string, event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value) {
      const form = this.searchForm();
      if (form) {
        const currentValues = form.get(fieldName)?.value || [];
        if (!currentValues.includes(value)) {
          form.get(fieldName)?.setValue([...currentValues, value]);
          this.performSearch();
        }
        input.value = '';
      }
    }
  }



  // ===== MÉTODOS PRIVADOS =====

  /**
   * Crea el formulario de búsqueda
   */
  private createSearchForm(): FormGroup {
    return this.fb.group({
      searchTerm: [''],
      companies: [[]],
      positions: [[]],
      technologies: [[]],
      institutions: [[]],
      educationTypes: [[]],
      educationStatuses: [[]],
      dateFrom: [null],
      dateTo: [null],
      datePreset: [''],
      isCurrentJob: [undefined],
      isOngoing: [undefined],
      keywords: [[]],
      excludeKeywords: [[]],
      locationFilters: [[]],
      minSalary: [null],
      maxSalary: [null],
      minGrade: [null],
      maxGrade: [null],
      minDuration: [null],
      maxDuration: [null],
      hasAchievements: [undefined],
      hasProjects: [undefined],
      fuzzySearch: [true],
      exactMatch: [false],
      caseSensitive: [false],
      sortBy: ['date'],
      sortOrder: ['desc']
    });
  }

  /**
   * Configura los watchers del formulario
   */
  private setupFormWatchers(): void {
    const form = this.searchForm();
    if (!form) return;

    form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });
  }

  /**
   * Actualiza los datos en el servicio de búsqueda
   */
  private updateSearchData(): void {
    this.searchService.updateExperiences(this.experiences);
    this.searchService.updateEducation(this.education);
  }

  /**
   * Carga las facetas de filtros
   */
  private loadFacets(): void {
    const facets = this.searchService.getFacets();
    this.facets.set(facets);
  }

  /**
   * Realiza la búsqueda con los filtros actuales
   */
  private performSearch(): void {
    this.isSearching.set(true);
    
    const filters = this.buildFiltersFromForm();
    this.searchService.updateFilters(filters);

    // Suscribirse a los resultados
    this.searchService.experienceResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(experienceResults => {
      this.searchService.educationResults$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(educationResults => {
        this.isSearching.set(false);
        
        const event: FilterChangeEvent = {
          filters,
          experienceResults,
          educationResults
        };
        
        this.filtersChange.emit(event);
        this.loadFacets(); // Actualizar facetas
      });
    });
  }

  /**
   * Construye los filtros desde el formulario
   */
  private buildFiltersFromForm(): AdvancedSearchFilters {
    const form = this.searchForm();
    if (!form) {
      // Retornar filtros vacíos si no hay formulario
      return {
        searchTerm: '',
        dateRange: { from: undefined, to: undefined, preset: undefined },
        companies: [],
        positions: [],
        technologies: [],
        institutions: [],
        educationTypes: [],
        educationStatuses: [],
        keywords: [],
        excludeKeywords: [],
        locationFilters: [],
        salaryRange: { min: undefined, max: undefined },
        gradeRange: { min: undefined, max: undefined },
        minDurationMonths: undefined,
        maxDurationMonths: undefined,
        isCurrentJob: undefined,
        isOngoing: undefined,
        hasAchievements: undefined,
        hasProjects: undefined,
        fuzzySearch: true,
        exactMatch: false,
        caseSensitive: false,
        sortBy: 'date',
        sortOrder: 'desc'
      };
    }

    const formValue = form.value;

    return {
      searchTerm: formValue.searchTerm || '',
      dateRange: {
        from: formValue.dateFrom,
        to: formValue.dateTo,
        preset: formValue.datePreset
      },
      companies: formValue.companies || [],
      positions: formValue.positions || [],
      technologies: formValue.technologies || [],
      institutions: formValue.institutions || [],
      educationTypes: formValue.educationTypes || [],
      educationStatuses: formValue.educationStatuses || [],
      keywords: formValue.keywords || [],
      excludeKeywords: formValue.excludeKeywords || [],
      locationFilters: formValue.locationFilters || [],
      salaryRange: {
        min: formValue.minSalary,
        max: formValue.maxSalary
      },
      gradeRange: {
        min: formValue.minGrade,
        max: formValue.maxGrade
      },
      minDurationMonths: formValue.minDuration,
      maxDurationMonths: formValue.maxDuration,
      isCurrentJob: formValue.isCurrentJob,
      isOngoing: formValue.isOngoing,
      hasAchievements: formValue.hasAchievements,
      hasProjects: formValue.hasProjects,
      fuzzySearch: formValue.fuzzySearch,
      exactMatch: formValue.exactMatch,
      caseSensitive: formValue.caseSensitive,
      sortBy: formValue.sortBy || 'date',
      sortOrder: formValue.sortOrder || 'desc'
    };
  }
}
