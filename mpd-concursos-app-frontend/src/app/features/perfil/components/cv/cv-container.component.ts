/**
 * Componente Contenedor del Sistema CV
 * 
 * @description Componente principal que orquesta la funcionalidad completa del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, combineLatest, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Modelos y servicios del CV
import {
  WorkExperience,
  WorkExperienceDto,
  EducationEntry,
  EducationDto,
  EducationType,
  CurriculumVitae,
  CvSearchFilters,
  LoadingState,
  ComponentState,
  CV_DEFAULTS,
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

// Modelos de usuario
import { UserProfile } from '@core/models/perfil.model';

// Componentes compartidos
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '@shared/components/custom-spinner/custom-spinner.component';
import { CustomTabsComponent, TabItem } from '@shared/components/custom-tabs/custom-tabs.component';

// Componentes de modales
import { ExperienceModalComponent } from './experience-modal/experience-modal.component';
import { EducationModalComponent } from './education-modal/education-modal.component';

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
    ExperienceModalComponent,
    EducationModalComponent
  ],
  templateUrl: './cv-container.component.html',
  styleUrls: ['./cv-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvContainerComponent implements OnInit, OnDestroy {

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
        icon: 'work',
        count: state.experiences.data.length,
        isActive: this.activeTab() === 'experience'
      },
      {
        id: 'education',
        label: 'Educación',
        icon: 'school',
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

  // ===== MODAL STATE =====
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
    // Servicios HTTP reales
    private readonly experienceService: ExperienceCvService,
    private readonly educationService: EducationCvService,
    private readonly cvStateService: CvStateService
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
   * Refresca los datos del CV
   */
  refreshData(): void {
    if (this.userProfile?.id) {
      this.cvStateService.refreshCvData();
    }
  }

  /**
   * Exporta el CV completo
   */
  async exportCv(): Promise<void> {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede exportar el CV sin datos de usuario');
      return;
    }

    this.updateState(state => ({
      ...state,
      isExporting: true
    }));

    try {
      // Usar el servicio de estado para exportar
      this.cvStateService.exportCv(this.userProfile.id, {
        format: 'PDF',
        template: 'modern',
        includePhoto: true,
        includePersonalInfo: true,
        includeWorkExperience: true,
        includeEducation: true
      }).subscribe({
        next: (result) => {
          if (result.success && result.downloadUrl) {
            // Descargar el archivo
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = result.fileName || 'cv.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.notificationService.showSuccess('CV exportado exitosamente');
          } else {
            throw new Error(result.error || 'Error desconocido en la exportación');
          }
        },
        error: (error) => {
          this.notificationService.showError('Error al exportar el CV');
          console.error('[CvContainerComponent] Error exporting CV:', error);
        },
        complete: () => {
          this.updateState(state => ({
            ...state,
            isExporting: false
          }));
        }
      });
    } catch (error) {
      this.notificationService.showError('Error al exportar el CV');
      console.error('[CvContainerComponent] Error exporting CV:', error);
      this.updateState(state => ({
        ...state,
        isExporting: false
      }));
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

    if (!confirm(`¿Está seguro de eliminar ${education.title}?`)) {
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

  // ===== MODAL EVENT HANDLERS =====

  /**
   * Maneja el cierre del modal de experiencia
   */
  onExperienceModalClose(): void {
    this.showExperienceModal.set(false);
    this.selectedExperience.set(null);
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
   * Carga los datos iniciales usando servicios HTTP reales
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
    return this.transformService.formatDateRangeForDisplay(
      experience.startDate,
      experience.endDate,
      experience.isCurrentJob
    );
  }

  /**
   * Formatea las fechas de educación para mostrar
   */
  formatEducationDates(education: EducationEntry): string {
    return this.transformService.formatDateRangeForDisplay(
      education.startDate,
      education.endDate,
      education.isOngoing
    );
  }

  /**
   * Obtiene la etiqueta del tipo de educación
   */
  getEducationTypeLabel(type: any): string {
    const labels: Record<string, string> = {
      'SECONDARY': 'Educación Secundaria',
      'TECHNICAL': 'Educación Técnica',
      'UNIVERSITY_DEGREE': 'Carrera Universitaria',
      'POSTGRADUATE_SPECIALIZATION': 'Especialización',
      'MASTER_DEGREE': 'Maestría',
      'DOCTORATE': 'Doctorado',
      'DIPLOMA': 'Diplomatura',
      'CERTIFICATION': 'Certificación',
      'SCIENTIFIC_ACTIVITY': 'Actividad Científica'
    };
    return labels[type] || type;
  }

  /**
   * Obtiene la etiqueta del estado de educación
   */
  getEducationStatusLabel(status: any): string {
    const labels: Record<string, string> = {
      'IN_PROGRESS': 'En Curso',
      'COMPLETED': 'Completado',
      'SUSPENDED': 'Suspendido',
      'ABANDONED': 'Abandonado'
    };
    return labels[status] || status;
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



}
