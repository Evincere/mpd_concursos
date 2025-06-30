/**
 * Componente Contenedor del Sistema CV
 * 
 * @description Componente principal que orquesta la funcionalidad completa del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, catchError, timeout, retry } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// Modelos y servicios del CV
import {
  WorkExperience,
  WorkExperienceDto,
  EducationEntry,
  EducationDto,
  EducationType,
  EducationStatus,
  CurriculumVitae,
  CvSearchFilters,
  LoadingState,
  ComponentState,
  CV_DEFAULTS,
  FormMode,
  UniversityEducation,
  DiplomaEducation,
  PostgraduateEducation,
  ScientificActivity,
  ScientificActivityType,
  ScientificActivityRole,
  // Servicios HTTP reales
  ExperienceCvService,
  EducationCvService,
  CvStateService,
  CvState as CvServiceState
} from '@core/services/cv';

// Servicios de utilidad
import { CvValidationService } from '@core/services/cv/cv-validation.service';
import { CvTransformService } from '@core/services/cv/cv-transform.service';
import { CvNotificationService } from '@core/services/cv/cv-notification.service';
import { CvPdfExportService } from '@core/services/cv/cv-pdf-export.service';
import { CvSearchService } from '@core/services/cv/cv-search.service';
// Servicios especializados de educación
import { EducationDisplayService, FormattedDateInfo } from '@core/services/cv/education-display.service';
import { CvDragDropService } from '@core/services/cv/cv-drag-drop.service';
import { CvBackendIntegrationService } from '@core/services/cv/cv-backend-integration.service';

// Modelos de usuario
import { UserProfile } from '@core/models/perfil.model';

// Componentes compartidos
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-spinner/custom-spinner.component';
import { CustomTabsComponent, TabItem } from '@shared/components/custom-tabs/custom-tabs.component';

// Componentes del CV
import { CvSearchComponent, FilterChangeEvent } from './cv-search.component';
import { EducationModalWrapperComponent, EducationModalResult } from './education-modal-wrapper.component';
import { ExperienceModalWrapperComponent, ExperienceModalResult } from './experience-modal-wrapper.component';

// Componentes de modales
import { ExperienceModalComponent } from './experience-modal/experience-modal.component';
import { EducationModalComponent } from './education-modal/education-modal.component';

// Angular CDK para drag & drop
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

/**
 * Estado del componente CV
 */
interface CvState {
  experiences: ComponentState<WorkExperience>;
  education: ComponentState<EducationEntry>;
  isExporting: boolean;
  lastUpdated: Date | null;
}

/**
 * Configuración de tabs del CV
 */
interface CvTab {
  id: string;
  label: string;
  icon: string;
  count: number;
  isActive: boolean;
}

@Component({
  selector: 'app-cv-container',
  standalone: true,
  imports: [
    CommonModule,
    CustomCardComponent,
    CustomButtonComponent,
    CustomSpinnerComponent,
    CustomTabsComponent,
    CvSearchComponent,
    EducationModalWrapperComponent,
    ExperienceModalWrapperComponent,
    ExperienceModalComponent,
    EducationModalComponent,
    DragDropModule
  ],
  templateUrl: './cv-container.component.html',
  styleUrls: ['./cv-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvContainerComponent implements OnInit, OnDestroy {

  // ===== VIEW CHILDREN =====
  @ViewChild('experienceModal') experienceModalComponent!: ExperienceModalComponent;
  @ViewChild('educationModal') educationModalComponent!: EducationModalComponent;

  // ===== INPUTS =====
  @Input() userProfile: UserProfile | null = null;
  @Input() isLoading = false;

  // ===== SIGNALS =====
  public readonly cvState = signal<CvState>({
    experiences: {
      data: [],
      selectedItem: null,
      isLoading: false,
      error: null,
      filters: CV_DEFAULTS.SEARCH_FILTERS,
      pagination: CV_DEFAULTS.PAGINATION
    },
    education: {
      data: [],
      selectedItem: null,
      isLoading: false,
      error: null,
      filters: CV_DEFAULTS.SEARCH_FILTERS,
      pagination: CV_DEFAULTS.PAGINATION
    },
    isExporting: false,
    lastUpdated: null
  });

  // ===== COMPUTED SIGNALS =====
  public readonly tabs = computed<CvTab[]>(() => {
    const state = this.cvState();
    return [
      {
        id: 'experience',
        label: 'Experiencia Laboral',
        icon: 'briefcase',
        count: state.experiences.data.length,
        isActive: this.activeTab() === 'experience'
      },
      {
        id: 'education',
        label: 'Educación',
        icon: 'graduation-cap',
        count: state.education.data.length,
        isActive: this.activeTab() === 'education'
      }
    ];
  });

  public readonly totalEntries = computed(() => {
    const state = this.cvState();
    return state.experiences.data.length + state.education.data.length;
  });

  public readonly hasData = computed(() => this.totalEntries() > 0);

  public readonly isAnyLoading = computed(() => {
    const state = this.cvState();
    return state.experiences.isLoading || state.education.isLoading || state.isExporting;
  });

  // ===== REACTIVE STATE =====
  public readonly activeTab = signal<string>('experience');
  public readonly searchTerm = signal<string>('');
  public readonly showFilters = signal<boolean>(false);
  public readonly expandedExperiences = signal<Set<string>>(new Set());
  public readonly expandedEducation = signal<Set<string>>(new Set());

  // ===== MODAL STATES =====
  public readonly showExperienceModal = signal<boolean>(false);
  public readonly selectedExperience = signal<WorkExperience | null>(null);
  public readonly experienceModalMode = signal<'create' | 'edit' | 'view'>('create');
  public readonly isExperienceLoading = signal<boolean>(false);

  public readonly showEducationModal = signal<boolean>(false);
  public readonly selectedEducation = signal<EducationEntry | null>(null);
  public readonly educationModalMode = signal<'create' | 'edit' | 'view'>('create');
  public readonly isEducationLoading = signal<boolean>(false);

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();
  private readonly searchTerm$ = new BehaviorSubject<string>('');
  private readonly refreshTrigger$ = new Subject<void>();

  // ===== CONSTRUCTOR =====
  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly validationService: CvValidationService,
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService,
    private readonly pdfExportService: CvPdfExportService,
    private readonly searchService: CvSearchService,
    private readonly dragDropService: CvDragDropService,
    private readonly backendService: CvBackendIntegrationService,
    private readonly http: HttpClient,
    // Servicios HTTP reales
    private readonly experienceService: ExperienceCvService,
    private readonly educationService: EducationCvService,
    private readonly cvStateService: CvStateService,
    // Servicios especializados de educación
    private readonly educationDisplayService: EducationDisplayService
  ) {
    this.setupSearchSubscription();
    this.setupRefreshSubscription();
    this.setupCvStateSubscription();
  }

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Limpiar estado del CV al destruir el componente
    this.cvStateService.clearState();
  }

  // ===== PUBLIC METHODS =====

  /**
   * Cambia la tab activa
   */
  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.cdr.markForCheck();
  }

  /**
   * Maneja la búsqueda
   */
  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchTerm$.next(term);
  }

  /**
   * Alterna la visibilidad de filtros
   */
  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }

  /**
   * Maneja el cambio de filtros
   */
  onFiltersChange(filters: any): void {
    // Implementar lógica de filtros según sea necesario
    console.log('[CvContainerComponent] Filters changed:', filters);
    this.cdr.markForCheck();
  }

  /**
   * Refresca los datos del CV
   */
  refreshData(): void {
    if (this.userProfile?.id) {
      this.cvStateService.refreshCvData();
    }
  }

  /**
   * Exporta el CV completo a PDF
   */
  async exportCv(): Promise<void> {
    this.updateState(state => ({ ...state, isExporting: true }));
    try {
      this.notificationService.showInfo('Iniciando exportación de CV...');

      const result = await this.pdfExportService.exportToPdf(
        this.userProfile!,
        this.cvState().experiences.data,
        this.cvState().education.data
      );

      if (result.success && result.blob) {
        this.notificationService.showSuccess('CV exportado exitosamente. Abriendo en una nueva pestaña...');
        const fileUrl = URL.createObjectURL(result.blob);
        window.open(fileUrl, '_blank');
        // Opcional: revocar la URL del objeto después de un tiempo para liberar memoria
        setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
      } else {
        throw new Error(result.error || 'No se pudo obtener el PDF generado.');
      }
    } catch (error: any) {
      this.notificationService.showError(`Error al exportar CV: ${error.message}`);
    } finally {
      this.updateState(state => ({ ...state, isExporting: false }));
    }
  }

  /**
   * Agrega nueva experiencia laboral
   */
  addExperience(): void {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede agregar experiencia sin datos de usuario');
      return;
    }

    this.selectedExperience.set(null);
    this.experienceModalMode.set('create');
    this.showExperienceModal.set(true);

    // Resetear el formulario cuando se abre en modo crear
    setTimeout(() => {
      if (this.experienceModalComponent) {
        this.experienceModalComponent.resetForm();
      }
    }, 100);
  }

  /**
   * Agrega nueva educación
   */
  addEducation(): void {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede agregar educación sin datos de usuario');
      return;
    }

    this.selectedEducation.set(null);
    this.educationModalMode.set('create');
    this.showEducationModal.set(true);

    // Resetear el formulario cuando se abre en modo crear
    setTimeout(() => {
      if (this.educationModalComponent) {
        this.educationModalComponent.resetForm();
      }
    }, 100);
  }

  /**
   * Edita una experiencia laboral
   */
  editExperience(experience: WorkExperience): void {
    this.updateExperienceState(state => ({
      ...state,
      selectedItem: experience
    }));

    this.selectedExperience.set(experience);
    this.experienceModalMode.set('edit');
    this.showExperienceModal.set(true);
  }

  /**
   * Elimina una experiencia laboral
   */
  async deleteExperience(experience: WorkExperience): Promise<void> {
    if (!experience.id) {
      this.notificationService.showError('No se puede eliminar una experiencia sin ID');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar la experiencia en ${experience.company}?`)) {
      return;
    }

    this.updateExperienceState(state => ({
      ...state,
      isLoading: true
    }));

    this.experienceService.delete(experience.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Experiencia eliminada exitosamente');
        this.refreshData(); // Recargar datos desde el servidor
        this.updateLastModified();
      },
      error: (error) => {
        this.updateExperienceState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al eliminar experiencia'
        }));
        this.notificationService.showError('Error al eliminar la experiencia');
        console.error('[CvContainerComponent] Error deleting experience:', error);
      }
    });
  }

  /**
   * Edita una educación
   */
  editEducation(education: EducationEntry): void {
    this.updateEducationState(state => ({
      ...state,
      selectedItem: education
    }));

    this.selectedEducation.set(education);
    this.educationModalMode.set('edit');
    this.showEducationModal.set(true);
  }

  /**
   * Elimina una educación
   */
  async deleteEducation(education: EducationEntry): Promise<void> {
    if (!education.id) {
      this.notificationService.showError('No se puede eliminar una educación sin ID');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar "${education.title}"?`)) {
      return;
    }

    this.updateEducationState(state => ({
      ...state,
      isLoading: true
    }));

    this.educationService.delete(education.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Educación eliminada exitosamente');
        this.refreshData(); // Recargar datos desde el servidor
        this.updateLastModified();
      },
      error: (error) => {
        this.updateEducationState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al eliminar educación'
        }));
        this.notificationService.showError('Error al eliminar la educación');
        console.error('[CvContainerComponent] Error deleting education:', error);
      }
    });
  }

  // ===== PRIVATE METHODS =====

  /**
   * Carga los datos iniciales
   */
  private loadInitialData(): void {
    if (!this.userProfile?.id) {
      console.warn('[CvContainerComponent] No user profile ID available for loading CV data');
      return;
    }

    console.log(`[CvContainerComponent] Loading CV data for user: ${this.userProfile.id}`);

    // Cargar datos usando el servicio de estado centralizado
    this.cvStateService.loadCvData(this.userProfile.id).subscribe({
      next: (cvState) => {
        console.log('[CvContainerComponent] CV data loaded successfully:', cvState);
      },
      error: (error) => {
        console.error('[CvContainerComponent] Error loading CV data:', error);
        this.notificationService.showError('Error al cargar los datos del CV');
      }
    });
  }

  // ===== MODAL EVENT HANDLERS =====

  /**
   * Maneja el cierre del modal de experiencia
   */
  onExperienceModalClose(): void {
    this.showExperienceModal.set(false);
    this.selectedExperience.set(null);
    this.experienceModalMode.set('create'); // Resetear modo al cerrar
    this.isExperienceLoading.set(false);
  }

  /**
   * Maneja el guardado de experiencia desde el modal
   */
  onExperienceSave(experienceData: WorkExperienceDto): void {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede guardar la experiencia sin datos de usuario');
      return;
    }

    this.isExperienceLoading.set(true);

    const isEditing = this.experienceModalMode() === 'edit';
    const serviceCall = isEditing
      ? this.experienceService.update(this.selectedExperience()!.id!, experienceData)
      : this.experienceService.create(this.userProfile.id, experienceData);

    serviceCall.subscribe({
      next: (savedExperience) => {
        const message = isEditing
          ? 'Experiencia laboral actualizada exitosamente'
          : 'Experiencia laboral agregada exitosamente';

        this.notificationService.showSuccess(message);

        // Resetear el formulario solo si es modo crear
        if (!isEditing && this.experienceModalComponent) {
          this.experienceModalComponent.resetForm();
        }

        this.onExperienceModalClose();
        this.refreshData(); // Recargar datos
      },
      error: (error) => {
        const message = isEditing
          ? 'Error al actualizar la experiencia laboral'
          : 'Error al agregar la experiencia laboral';

        this.notificationService.showError(message);
        console.error('[CvContainerComponent] Error saving experience:', error);
        this.isExperienceLoading.set(false);
      }
    });
  }

  /**
   * Maneja la eliminación de experiencia desde el modal
   */
  onExperienceDelete(experience: WorkExperience): void {
    if (!experience.id) {
      this.notificationService.showError('No se puede eliminar una experiencia sin ID');
      return;
    }

    this.isExperienceLoading.set(true);

    this.experienceService.delete(experience.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Experiencia laboral eliminada exitosamente');
        this.onExperienceModalClose();
        this.refreshData(); // Recargar datos
      },
      error: (error) => {
        this.notificationService.showError('Error al eliminar la experiencia laboral');
        console.error('[CvContainerComponent] Error deleting experience:', error);
        this.isExperienceLoading.set(false);
      }
    });
  }

  // ===== EDUCATION MODAL EVENT HANDLERS =====

  /**
   * Maneja el cierre del modal de educación
   */
  onEducationModalClose(): void {
    this.showEducationModal.set(false);
    this.selectedEducation.set(null);
    this.educationModalMode.set('create'); // Resetear modo al cerrar
    this.isEducationLoading.set(false);
  }

  /**
   * Maneja el guardado de educación desde el modal
   */
  onEducationSave(educationData: EducationDto): void {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede guardar la educación sin datos de usuario');
      return;
    }

    this.isEducationLoading.set(true);

    const isEditing = this.educationModalMode() === 'edit';
    const serviceCall = isEditing
      ? this.educationService.update(this.selectedEducation()!.id!, educationData)
      : this.educationService.create(this.userProfile.id, educationData);

    serviceCall.subscribe({
      next: (savedEducation) => {
        const message = isEditing
          ? 'Educación actualizada exitosamente'
          : 'Educación agregada exitosamente';

        this.notificationService.showSuccess(message);

        // Resetear el formulario solo si es modo crear
        if (!isEditing && this.educationModalComponent) {
          this.educationModalComponent.resetForm();
        }

        this.onEducationModalClose();
        this.refreshData(); // Recargar datos
      },
      error: (error) => {
        const message = isEditing
          ? 'Error al actualizar la educación'
          : 'Error al agregar la educación';

        this.notificationService.showError(message);
        console.error('[CvContainerComponent] Error saving education:', error);
        this.isEducationLoading.set(false);
      }
    });
  }

  /**
   * Maneja la eliminación de educación desde el modal
   */
  onEducationDelete(education: EducationEntry): void {
    if (!education.id) {
      this.notificationService.showError('No se puede eliminar una educación sin ID');
      return;
    }

    this.isEducationLoading.set(true);

    this.educationService.delete(education.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Educación eliminada exitosamente');
        this.onEducationModalClose();
        this.refreshData(); // Recargar datos
      },
      error: (error) => {
        this.notificationService.showError('Error al eliminar la educación');
        console.error('[CvContainerComponent] Error deleting education:', error);
        this.isEducationLoading.set(false);
      }
    });
  }

  // ===== PRIVATE METHODS =====

  /**
   * Configura la suscripción al estado del CV
   */
  private setupCvStateSubscription(): void {
    // Suscribirse al estado centralizado del CV
    this.cvStateService.cvState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cvState => {
      this.updateState(state => ({
        experiences: {
          data: cvState.experiences,
          selectedItem: state.experiences.selectedItem,
          isLoading: cvState.isLoading,
          error: cvState.error,
          filters: state.experiences.filters,
          pagination: state.experiences.pagination
        },
        education: {
          data: cvState.education,
          selectedItem: state.education.selectedItem,
          isLoading: cvState.isLoading,
          error: cvState.error,
          filters: state.education.filters,
          pagination: state.education.pagination
        },
        isExporting: state.isExporting,
        lastUpdated: cvState.lastUpdated
      }));
    });
  }

  /**
   * Filtra los datos según el término de búsqueda usando el servicio de estado
   */
  private filterData(term: string): void {
    if (!term.trim()) {
      // Si no hay término de búsqueda, recargar datos originales
      this.refreshData();
      return;
    }

    // Usar el método de búsqueda del servicio de estado
    this.cvStateService.searchCv(term).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.updateState(state => ({
        ...state,
        experiences: {
          ...state.experiences,
          data: results.experiences
        },
        education: {
          ...state.education,
          data: results.education
        }
      }));
    });
  }

  /**
   * Configura la suscripción de búsqueda
   */
  private setupSearchSubscription(): void {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.filterData(term);
    });
  }

  /**
   * Configura la suscripción de refresco
   */
  private setupRefreshSubscription(): void {
    this.refreshTrigger$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadInitialData();
    });
  }

  /**
   * Actualiza el estado general
   */
  private updateState(updater: (state: CvState) => CvState): void {
    this.cvState.update(updater);
    this.cdr.markForCheck();
  }

  /**
   * Actualiza el estado de experiencias
   */
  private updateExperienceState(updater: (state: ComponentState<WorkExperience>) => ComponentState<WorkExperience>): void {
    this.updateState(state => ({
      ...state,
      experiences: updater(state.experiences)
    }));
  }

  /**
   * Actualiza el estado de educación
   */
  private updateEducationState(updater: (state: ComponentState<EducationEntry>) => ComponentState<EducationEntry>): void {
    this.updateState(state => ({
      ...state,
      education: updater(state.education)
    }));
  }

  /**
   * Actualiza la fecha de última modificación
   */
  private updateLastModified(): void {
    this.updateState(state => ({
      ...state,
      lastUpdated: new Date()
    }));
  }

  // ===== MÉTODOS AUXILIARES PARA TEMPLATE =====

  /**
   * TrackBy function para experiencias
   */
  trackByExperienceId(index: number, experience: WorkExperience): string {
    return experience.id || `exp-${index}`;
  }

  /**
   * TrackBy function para educación
   */
  trackByEducationId(index: number, education: EducationEntry): string {
    return education.id || `edu-${index}`;
  }

  /**
   * Formatea las fechas de experiencia para mostrar
   */
  formatExperienceDates(experience: WorkExperience): string {
    try {
      // Validar fechas antes de formatear
      if (!experience.startDate || isNaN(experience.startDate.getTime())) {
        return 'Fecha de inicio no válida';
      }

      if (experience.endDate && isNaN(experience.endDate.getTime())) {
        // Si la fecha de fin es inválida pero hay fecha de inicio válida
        return this.formatSingleDate(experience.startDate) + ' - Fecha de fin no válida';
      }

      return this.transformService.formatDateRangeForDisplay(
        experience.startDate,
        experience.endDate,
        experience.isCurrentJob
      );
    } catch (error) {
      console.warn('Error formatting experience dates:', error, experience);
      return 'Fechas no disponibles';
    }
  }

  /**
   * Alterna el estado expandido de una experiencia
   */
  toggleExperienceExpanded(experienceId: string): void {
    const expanded = this.expandedExperiences();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(experienceId)) {
      newExpanded.delete(experienceId);
    } else {
      newExpanded.add(experienceId);
    }

    this.expandedExperiences.set(newExpanded);
  }

  /**
   * Verifica si una experiencia está expandida
   */
  isExperienceExpanded(experienceId: string): boolean {
    return this.expandedExperiences().has(experienceId);
  }

  /**
   * Alterna el estado expandido de una educación
   */
  toggleEducationExpanded(educationId: string): void {
    const expanded = this.expandedEducation();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(educationId)) {
      newExpanded.delete(educationId);
    } else {
      newExpanded.add(educationId);
    }

    this.expandedEducation.set(newExpanded);
  }

  /**
   * Verifica si una educación está expandida
   */
  isEducationExpanded(educationId: string): boolean {
    return this.expandedEducation().has(educationId);
  }

  /**
   * Convierte las tabs a TabItems para el componente de tabs
   */
  getTabItems(): TabItem[] {
    return this.tabs().map(tab => ({
      id: tab.id,
      label: `${tab.label} (${tab.count})`,
      icon: tab.icon
    }));
  }

  /**
   * Obtiene el índice de la tab activa
   */
  getActiveTabIndex(): number {
    const tabs = this.tabs();
    return tabs.findIndex(tab => tab.isActive);
  }

  /**
   * Maneja el cambio de tab por índice
   */
  onTabIndexChange(index: number): void {
    const tabs = this.tabs();
    if (index >= 0 && index < tabs.length) {
      this.onTabChange(tabs[index].id);
    }
  }

  // ===== DRAG & DROP METHODS =====

  /**
   * Maneja el drop de experiencias laborales
   */
  onExperienceDrop(event: CdkDragDrop<WorkExperience[]>): void {
    const currentExperiences = this.cvState().experiences.data;
    const updatedExperiences = this.dragDropService.handleExperienceDrop(event, currentExperiences);

    this.updateExperienceState(state => ({
      ...state,
      data: updatedExperiences
    }));
  }

  /**
   * Maneja el drop de educación
   */
  onEducationDrop(event: CdkDragDrop<EducationEntry[]>): void {
    const currentEducation = this.cvState().education.data;
    const updatedEducation = this.dragDropService.handleEducationDrop(event, currentEducation);

    this.updateEducationState(state => ({
      ...state,
      data: updatedEducation
    }));
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Limpia los filtros de búsqueda
   */
  clearFilters(): void {
    this.searchTerm$.next('');
    this.refreshData();
  }

  /**
   * Obtiene el total de elementos en el CV
   */
  getTotalItems(): number {
    const state = this.cvState();
    return state.experiences.data.length + state.education.data.length;
  }

  /**
   * Formatea las fechas de educación para mostrar según el tipo y estado
   */
  formatEducationDates(education: EducationEntry): string {
    const dateInfo = this.educationDisplayService.formatEducationDates(education);
    return dateInfo.primary;
  }

  /**
   * Obtiene información completa de fechas formateadas
   */
  getEducationDateInfo(education: EducationEntry): FormattedDateInfo {
    return this.educationDisplayService.formatEducationDates(education);
  }

  /**
   * Obtiene la duración de una experiencia
   */
  getExperienceDuration(experience: WorkExperience): string | null {
    return this.transformService.calculateDuration(
      experience.startDate,
      experience.endDate
    );
  }

  /**
   * Obtiene la duración de una educación según las reglas específicas del tipo
   */
  getEducationDuration(education: EducationEntry): string | null {
    return this.educationDisplayService.calculateDuration(education);
  }

  /**
   * Determina si debe mostrar la duración para un tipo de educación específico
   */
  shouldShowEducationDuration(education: EducationEntry): boolean {
    return this.educationDisplayService.shouldShowDuration(education);
  }

  /**
   * Obtiene información adicional específica de educación según el tipo y estado
   */
  getEducationAdditionalInfo(education: EducationEntry): Array<{icon: string, label: string, value: string}> {
    return this.educationDisplayService.getEducationAdditionalInfo(education);
  }

  /**
   * Obtiene la etiqueta del tipo de educación
   */
  getEducationTypeLabel(type: EducationType): string {
    return this.educationDisplayService.getEducationTypeLabel(type);
  }

  /**
   * Obtiene la etiqueta del estado de educación
   */
  getEducationStatusLabel(status: EducationStatus): string {
    return this.educationDisplayService.getEducationStatusLabel(status);
  }

  /**
   * Formatea una fecha individual
   */
  private formatSingleDate(date: Date): string {
    return this.transformService.formatSingleDate(date);
  }
}
