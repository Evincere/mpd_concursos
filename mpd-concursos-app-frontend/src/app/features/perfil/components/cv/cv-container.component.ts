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
  EducationEntry,
  CurriculumVitae,
  CvSearchFilters,
  LoadingState,
  ComponentState,
  CV_DEFAULTS
} from '@core/services/cv';

// Servicios
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
    CustomTabsComponent
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

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();
  private readonly searchTerm$ = new BehaviorSubject<string>('');
  private readonly refreshTrigger$ = new Subject<void>();

  // ===== CONSTRUCTOR =====
  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly validationService: CvValidationService,
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService
  ) {
    this.setupSearchSubscription();
    this.setupRefreshSubscription();
  }

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.refreshTrigger$.next();
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
      // TODO: Implementar exportación real
      await this.simulateExport();
      this.notificationService.showCvExported('PDF');
    } catch (error) {
      this.notificationService.showError('Error al exportar el CV');
      console.error('Error exporting CV:', error);
    } finally {
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

    // TODO: Abrir modal de experiencia
    this.notificationService.showInfo('Modal de experiencia en desarrollo');
  }

  /**
   * Agrega nueva educación
   */
  addEducation(): void {
    if (!this.userProfile?.id) {
      this.notificationService.showError('No se puede agregar educación sin datos de usuario');
      return;
    }

    // TODO: Abrir modal de educación
    this.notificationService.showInfo('Modal de educación en desarrollo');
  }

  /**
   * Edita una experiencia laboral
   */
  editExperience(experience: WorkExperience): void {
    this.updateExperienceState(state => ({
      ...state,
      selectedItem: experience
    }));

    // TODO: Abrir modal de edición
    this.notificationService.showInfo(`Editando experiencia en ${experience.company}`);
  }

  /**
   * Edita una educación
   */
  editEducation(education: EducationEntry): void {
    this.updateEducationState(state => ({
      ...state,
      selectedItem: education
    }));

    // TODO: Abrir modal de edición
    this.notificationService.showInfo(`Editando ${education.title}`);
  }

  /**
   * Elimina una experiencia laboral
   */
  async deleteExperience(experience: WorkExperience): Promise<void> {
    if (!confirm(`¿Está seguro de eliminar la experiencia en ${experience.company}?`)) {
      return;
    }

    this.updateExperienceState(state => ({
      ...state,
      isLoading: true
    }));

    try {
      // TODO: Implementar eliminación real
      await this.simulateDelete();
      
      // Remover de la lista local
      this.updateExperienceState(state => ({
        ...state,
        data: state.data.filter(exp => exp.id !== experience.id),
        isLoading: false
      }));

      this.notificationService.showExperienceDeleted(experience.company);
      this.updateLastModified();
    } catch (error) {
      this.updateExperienceState(state => ({
        ...state,
        isLoading: false,
        error: 'Error al eliminar experiencia'
      }));
      this.notificationService.showError('Error al eliminar la experiencia');
    }
  }

  /**
   * Elimina una educación
   */
  async deleteEducation(education: EducationEntry): Promise<void> {
    if (!confirm(`¿Está seguro de eliminar ${education.title}?`)) {
      return;
    }

    this.updateEducationState(state => ({
      ...state,
      isLoading: true
    }));

    try {
      // TODO: Implementar eliminación real
      await this.simulateDelete();
      
      // Remover de la lista local
      this.updateEducationState(state => ({
        ...state,
        data: state.data.filter(edu => edu.id !== education.id),
        isLoading: false
      }));

      this.notificationService.showEducationDeleted(education.title);
      this.updateLastModified();
    } catch (error) {
      this.updateEducationState(state => ({
        ...state,
        isLoading: false,
        error: 'Error al eliminar educación'
      }));
      this.notificationService.showError('Error al eliminar la educación');
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Carga los datos iniciales
   */
  private loadInitialData(): void {
    if (!this.userProfile?.id) return;

    this.loadExperiences();
    this.loadEducation();
  }

  /**
   * Carga las experiencias laborales
   */
  private loadExperiences(): void {
    this.updateExperienceState(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    // TODO: Implementar carga real desde el backend
    this.simulateDataLoad('experiences').subscribe({
      next: (experiences) => {
        const sortedExperiences = this.transformService.sortExperiencesByDate(experiences);
        this.updateExperienceState(state => ({
          ...state,
          data: sortedExperiences,
          isLoading: false
        }));
      },
      error: (error) => {
        this.updateExperienceState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al cargar experiencias'
        }));
        this.notificationService.showNetworkError('cargar experiencias');
      }
    });
  }

  /**
   * Carga la educación
   */
  private loadEducation(): void {
    this.updateEducationState(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    // TODO: Implementar carga real desde el backend
    this.simulateDataLoad('education').subscribe({
      next: (education) => {
        const sortedEducation = this.transformService.sortEducationByDate(education);
        this.updateEducationState(state => ({
          ...state,
          data: sortedEducation,
          isLoading: false
        }));
      },
      error: (error) => {
        this.updateEducationState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al cargar educación'
        }));
        this.notificationService.showNetworkError('cargar educación');
      }
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
   * Filtra los datos según el término de búsqueda
   */
  private filterData(term: string): void {
    // TODO: Implementar filtrado real
    console.log('Filtering data with term:', term);
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

  // ===== MÉTODOS DE SIMULACIÓN (TEMPORAL) =====

  /**
   * Simula la carga de datos
   */
  private simulateDataLoad(type: 'experiences' | 'education'): Observable<any[]> {
    return of([]).pipe(
      // Simular delay de red
      switchMap(() => new Promise<any[]>(resolve => setTimeout(() => resolve([]), 1000))),
      catchError(error => {
        console.error(`Error loading ${type}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Simula la exportación
   */
  private simulateExport(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Simula la eliminación
   */
  private simulateDelete(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}
