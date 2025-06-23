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
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, catchError, timeout, retry } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// Modelos y servicios del CV
import {
  WorkExperience,
  EducationEntry,
  ComponentState,
  CV_DEFAULTS,
  FormMode,
  EducationDto,
  WorkExperienceDto,
  EducationType,
  UniversityEducation,
  DiplomaEducation,
  PostgraduateEducation,
  ScientificActivity,
  ScientificActivityType,
  ScientificActivityRole
} from '@core/services/cv';

// Servicios
import { CvValidationService } from '@core/services/cv/cv-validation.service';
import { CvTransformService } from '@core/services/cv/cv-transform.service';
import { CvNotificationService } from '@core/services/cv/cv-notification.service';
import { CvPdfExportService } from '@core/services/cv/cv-pdf-export.service';
import { CvSearchService } from '@core/services/cv/cv-search.service';
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
    DragDropModule
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
  public readonly expandedExperiences = signal<Set<string>>(new Set());
  public readonly expandedEducation = signal<Set<string>>(new Set());

  // ===== MODAL STATES =====
  public readonly educationModalOpen = signal<boolean>(false);
  public readonly experienceModalOpen = signal<boolean>(false);
  public readonly modalMode = signal<FormMode>('create');
  public readonly selectedEducation = signal<EducationEntry | null>(null);
  public readonly selectedExperience = signal<WorkExperience | null>(null);

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
    private readonly http: HttpClient
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
   * Exporta el CV completo a PDF
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
      const result = await this.pdfExportService.exportToPdf(
        this.userProfile,
        this.cvState().experiences.data,
        this.cvState().education.data
      );

      if (result.success) {
        this.notificationService.showCvExported('PDF');
      } else {
        this.notificationService.showError(result.error || 'Error al exportar el CV');
      }
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

    this.selectedExperience.set(null);
    this.modalMode.set('create');
    this.experienceModalOpen.set(true);
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
    this.modalMode.set('create');
    this.educationModalOpen.set(true);
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
    this.modalMode.set('edit');
    this.experienceModalOpen.set(true);
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
    this.modalMode.set('edit');
    this.educationModalOpen.set(true);
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
      // TODO: Implementar eliminación real en backend - PENDIENTE DE CONEXIÓN
      // Temporalmente solo remover de la lista local

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
      // TODO: Implementar eliminación real en backend - PENDIENTE DE CONEXIÓN
      // Temporalmente solo remover de la lista local

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
    // TEMPORAL: Usar UUID hardcodeado hasta que se implemente endpoint de perfil
    const userId = this.userProfile?.id || '123e4567-e89b-12d3-a456-426614174000';

    if (!userId) {
      this.updateExperienceState(state => ({
        ...state,
        data: [],
        isLoading: false,
        error: 'ID de usuario no disponible'
      }));
      return;
    }

    this.updateExperienceState(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    // Llamada HTTP real al backend usando endpoints existentes
    const apiUrl = environment.apiUrl || 'http://localhost:8080/api';
    const url = `${apiUrl}/experiencias/usuario/${userId}`;

    this.http.get<any[]>(url).pipe(
      timeout(10000), // 10 segundos de timeout
      retry(2), // Reintentar 2 veces en caso de error
      map(experiences => {
        // Transformar datos del backend al formato del frontend
        return experiences.map(exp => this.transformBackendExperienceToFrontend(exp));
      }),
      catchError(error => {
        console.error('Error loading experiences:', error);

        // Manejo específico de errores HTTP
        let errorMessage = 'Error al cargar experiencias';
        if (error.name === 'TimeoutError') {
          errorMessage = 'Tiempo de espera agotado al cargar experiencias';
        } else if (error.status === 404) {
          errorMessage = 'No se encontraron experiencias para este usuario';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado para acceder a las experiencias';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor - Endpoint de experiencias en desarrollo';
          console.warn('NOTA: El endpoint de experiencias tiene problemas conocidos (Error 500)');
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor';
        }

        this.notificationService.showError(errorMessage);
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (experiences) => {
        const sortedExperiences = this.transformService.sortExperiencesByDate(experiences);
        this.updateExperienceState(state => ({
          ...state,
          data: sortedExperiences,
          isLoading: false
        }));
      },
      error: () => {
        this.updateExperienceState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al cargar experiencias'
        }));
      }
    });
  }

  /**
   * Carga la educación
   */
  private loadEducation(): void {
    // TEMPORAL: Usar UUID hardcodeado hasta que se implemente endpoint de perfil
    const userId = this.userProfile?.id || '123e4567-e89b-12d3-a456-426614174000';

    if (!userId) {
      this.updateEducationState(state => ({
        ...state,
        data: [],
        isLoading: false,
        error: 'ID de usuario no disponible'
      }));
      return;
    }

    this.updateEducationState(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    // Llamada HTTP real al backend usando endpoints existentes
    const apiUrl = environment.apiUrl || 'http://localhost:8080/api';
    const url = `${apiUrl}/educacion/usuario/${userId}`;

    this.http.get<any[]>(url).pipe(
      timeout(10000), // 10 segundos de timeout
      retry(2), // Reintentar 2 veces en caso de error
      map(education => {
        // Transformar datos del backend al formato del frontend
        return education.map(edu => this.transformBackendEducationToFrontend(edu));
      }),
      catchError(error => {
        console.error('Error loading education:', error);

        // Manejo específico de errores HTTP
        let errorMessage = 'Error al cargar educación';
        if (error.name === 'TimeoutError') {
          errorMessage = 'Tiempo de espera agotado al cargar educación';
        } else if (error.status === 404) {
          errorMessage = 'No se encontró educación para este usuario';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado para acceder a la educación';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor al cargar educación';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor';
        }

        this.notificationService.showError(errorMessage);
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (education) => {
        const sortedEducation = this.transformService.sortEducationByDate(education);
        this.updateEducationState(state => ({
          ...state,
          data: sortedEducation,
          isLoading: false
        }));
      },
      error: () => {
        this.updateEducationState(state => ({
          ...state,
          isLoading: false,
          error: 'Error al cargar educación'
        }));
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
   * Obtiene información específica de una educación según su tipo
   */
  getEducationSpecificInfo(education: EducationEntry): Array<{icon: string, label: string, value: string}> {
    const info: Array<{icon: string, label: string, value: string}> = [];

    // Información específica para educación universitaria
    if (education.type === EducationType.UNIVERSITY_DEGREE) {
      const universityEducation = education as UniversityEducation;

      if (universityEducation.durationYears) {
        info.push({
          icon: 'schedule',
          label: 'Duración',
          value: `${universityEducation.durationYears} años`
        });
      }

      if (universityEducation.average) {
        info.push({
          icon: 'grade',
          label: 'Promedio',
          value: universityEducation.average.toLocaleString('es-AR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })
        });
      }
    }

    // Información específica para posgrados
    if ([EducationType.POSTGRADUATE_SPECIALIZATION, EducationType.MASTER_DEGREE, EducationType.DOCTORATE].includes(education.type)) {
      const postgraduateEducation = education as PostgraduateEducation;

      if (postgraduateEducation.thesisTopic) {
        info.push({
          icon: 'description',
          label: 'Tesis',
          value: postgraduateEducation.thesisTopic.length > 50
            ? postgraduateEducation.thesisTopic.substring(0, 50) + '...'
            : postgraduateEducation.thesisTopic
        });
      }

      if (postgraduateEducation.advisor) {
        info.push({
          icon: 'person',
          label: 'Director',
          value: postgraduateEducation.advisor
        });
      }
    }

    // Información específica para diplomas y certificaciones
    if ([EducationType.DIPLOMA, EducationType.CERTIFICATION].includes(education.type)) {
      const diplomaEducation = education as DiplomaEducation;

      if (diplomaEducation.hourlyLoad) {
        info.push({
          icon: 'access_time',
          label: 'Carga Horaria',
          value: `${diplomaEducation.hourlyLoad} horas`
        });
      }
    }

    // Información específica para actividades científicas
    if (education.type === EducationType.SCIENTIFIC_ACTIVITY) {
      const scientificActivity = education as ScientificActivity;

      if (scientificActivity.activityType) {
        info.push({
          icon: 'science',
          label: 'Tipo',
          value: this.getScientificActivityTypeLabel(scientificActivity.activityType)
        });
      }

      if (scientificActivity.role) {
        info.push({
          icon: 'assignment_ind',
          label: 'Rol',
          value: this.getScientificActivityRoleLabel(scientificActivity.role)
        });
      }

      if (scientificActivity.venue) {
        info.push({
          icon: 'place',
          label: 'Lugar',
          value: scientificActivity.venue.length > 40
            ? scientificActivity.venue.substring(0, 40) + '...'
            : scientificActivity.venue
        });
      }
    }

    return info;
  }

  /**
   * Obtiene la etiqueta de un tipo de actividad científica
   */
  private getScientificActivityTypeLabel(type: ScientificActivityType): string {
    const labels: Record<string, string> = {
      'CONFERENCE': 'Conferencia',
      'WORKSHOP': 'Taller',
      'SEMINAR': 'Seminario',
      'CONGRESS': 'Congreso',
      'PUBLICATION': 'Publicación',
      'SYMPOSIUM': 'Simposio'
    };
    return labels[type] || type;
  }

  /**
   * Obtiene la etiqueta de un rol en actividad científica
   */
  private getScientificActivityRoleLabel(role: ScientificActivityRole): string {
    const labels: Record<string, string> = {
      'AUTHOR': 'Autor',
      'CO_AUTHOR': 'Coautor',
      'SPEAKER': 'Expositor',
      'ORGANIZER': 'Organizador',
      'ATTENDEE': 'Participante',
      'MODERATOR': 'Moderador'
    };
    return labels[role] || role;
  }

  /**
   * Formatea una fecha individual
   */
  private formatSingleDate(date: Date): string {
    try {
      if (!date || isNaN(date.getTime())) {
        return 'Fecha no válida';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return 'Fecha no válida';
    }
  }

  /**
   * Calcula y formatea la duración de una experiencia laboral
   */
  getExperienceDuration(experience: WorkExperience): string {
    try {
      if (!experience.startDate || isNaN(experience.startDate.getTime())) {
        return '';
      }

      const endDate = experience.isCurrentJob ? new Date() : experience.endDate;
      if (!endDate || isNaN(endDate.getTime())) {
        return '';
      }

      const months = this.transformService.calculateExperienceDurationInMonths(experience);

      if (months < 1) {
        return 'Menos de 1 mes';
      } else if (months < 12) {
        return `${months} ${months === 1 ? 'mes' : 'meses'}`;
      } else {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        let duration = `${years} ${years === 1 ? 'año' : 'años'}`;
        if (remainingMonths > 0) {
          duration += ` y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
        }
        return duration;
      }
    } catch (error) {
      console.warn('Error calculating experience duration:', error);
      return '';
    }
  }

  /**
   * Calcula y formatea la duración de educación
   */
  getEducationDuration(education: EducationEntry): string {
    try {
      if (!education.startDate || isNaN(education.startDate.getTime())) {
        return '';
      }

      const endDate = education.isOngoing ? new Date() : education.endDate;
      if (!endDate || isNaN(endDate.getTime())) {
        return '';
      }

      const years = this.transformService.calculateEducationDurationInYears(education);

      if (years < 1) {
        return 'Menos de 1 año';
      } else if (years === 1) {
        return '1 año';
      } else {
        return `${Math.round(years * 10) / 10} años`;
      }
    } catch (error) {
      console.warn('Error calculating education duration:', error);
      return '';
    }
  }

  /**
   * Formatea las fechas de educación para mostrar
   */
  formatEducationDates(education: EducationEntry): string {
    try {
      // Validar fechas antes de formatear
      if (!education.startDate || isNaN(education.startDate.getTime())) {
        return 'Fecha de inicio no válida';
      }

      if (education.endDate && isNaN(education.endDate.getTime())) {
        // Si la fecha de fin es inválida pero hay fecha de inicio válida
        return this.formatSingleDate(education.startDate) + ' - Fecha de fin no válida';
      }

      return this.transformService.formatDateRangeForDisplay(
        education.startDate,
        education.endDate,
        education.isOngoing
      );
    } catch (error) {
      console.warn('Error formatting education dates:', error, education);
      return 'Fechas no disponibles';
    }
  }

  /**
   * Obtiene la etiqueta del tipo de educación
   */
  getEducationTypeLabel(type: any): string {
    if (!type) {
      return 'Sin tipo';
    }

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
    if (!status) {
      return 'Sin estado';
    }

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

  /**
   * Maneja los cambios de filtros de búsqueda
   */
  onFiltersChange(event: FilterChangeEvent): void {
    // Actualizar los datos filtrados
    this.updateExperienceState(state => ({
      ...state,
      data: event.experienceResults.items
    }));

    this.updateEducationState(state => ({
      ...state,
      data: event.educationResults.items
    }));

    this.cdr.markForCheck();
  }

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



  // ===== MÉTODOS DE MODAL =====

  /**
   * Maneja el resultado del modal de educación
   */
  onEducationModalResult(result: EducationModalResult): void {
    if (result.action === 'save' && result.data) {
      this.saveEducation(result.data);
    }
    this.educationModalOpen.set(false);
  }

  /**
   * Maneja el cierre del modal de educación
   */
  onEducationModalClose(): void {
    this.educationModalOpen.set(false);
    this.selectedEducation.set(null);
  }

  /**
   * Maneja el resultado del modal de experiencia
   */
  onExperienceModalResult(result: ExperienceModalResult): void {
    if (result.action === 'save' && result.data) {
      this.saveExperience(result.data);
    }
    this.experienceModalOpen.set(false);
  }

  /**
   * Maneja el cierre del modal de experiencia
   */
  onExperienceModalClose(): void {
    this.experienceModalOpen.set(false);
    this.selectedExperience.set(null);
  }

  /**
   * Guarda una educación (nueva o editada)
   */
  private async saveEducation(educationData: EducationDto): Promise<void> {
    const isEditing = this.modalMode() === 'edit';

    try {
      // TODO: Implementar guardado real en el backend - PENDIENTE DE CONEXIÓN
      // Temporalmente solo actualizar estado local

      if (isEditing) {
        // Actualizar educación existente
        const selectedEducation = this.selectedEducation();
        if (selectedEducation) {
          const updatedEducation = this.transformService.educationDtoToEntity(educationData, this.userProfile?.id || '');
          updatedEducation.id = selectedEducation.id;

          this.updateEducationState(state => ({
            ...state,
            data: state.data.map(edu => edu.id === selectedEducation.id ? updatedEducation : edu)
          }));
        }
      } else {
        // Agregar nueva educación
        const newEducation = this.transformService.educationDtoToEntity(educationData, this.userProfile?.id || '');
        newEducation.id = `edu-${Date.now()}`;

        this.updateEducationState(state => ({
          ...state,
          data: [...state.data, newEducation]
        }));
      }

      this.updateLastModified();
    } catch (error) {
      this.notificationService.showError('Error al guardar la educación');
      console.error('Error saving education:', error);
    }
  }

  /**
   * Guarda una experiencia (nueva o editada)
   */
  private async saveExperience(experienceData: WorkExperienceDto): Promise<void> {
    const isEditing = this.modalMode() === 'edit';

    try {
      // TODO: Implementar guardado real en el backend - PENDIENTE DE CONEXIÓN
      // Temporalmente solo actualizar estado local

      if (isEditing) {
        // Actualizar experiencia existente
        const selectedExperience = this.selectedExperience();
        if (selectedExperience) {
          const updatedExperience = this.transformService.workExperienceDtoToEntity(experienceData, this.userProfile?.id || '');
          updatedExperience.id = selectedExperience.id;

          this.updateExperienceState(state => ({
            ...state,
            data: state.data.map(exp => exp.id === selectedExperience.id ? updatedExperience : exp)
          }));
        }
      } else {
        // Agregar nueva experiencia
        const newExperience = this.transformService.workExperienceDtoToEntity(experienceData, this.userProfile?.id || '');
        newExperience.id = `exp-${Date.now()}`;

        this.updateExperienceState(state => ({
          ...state,
          data: [...state.data, newExperience]
        }));
      }

      this.updateLastModified();
    } catch (error) {
      this.notificationService.showError('Error al guardar la experiencia');
      console.error('Error saving experience:', error);
    }
  }

  // ===== MÉTODOS DE TRANSFORMACIÓN DE DATOS =====

  /**
   * Transforma datos de experiencia del backend al formato del frontend
   */
  private transformBackendExperienceToFrontend(backendExp: any): WorkExperience {
    return {
      id: backendExp.id,
      userId: this.userProfile?.id || '',
      position: backendExp.position || backendExp.cargo || '',
      company: backendExp.company || backendExp.empresa || '',
      description: backendExp.description || backendExp.descripcion || '',
      startDate: new Date(backendExp.startDate || backendExp.fechaInicio),
      endDate: backendExp.endDate || backendExp.fechaFin ? new Date(backendExp.endDate || backendExp.fechaFin) : undefined,
      isCurrentJob: !backendExp.endDate && !backendExp.fechaFin,
      location: backendExp.location || '',
      achievements: [],
      technologies: [],
      comments: backendExp.comments || backendExp.comentario || '',
      documentUrl: backendExp.documentUrl,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Transforma datos de educación del backend al formato del frontend
   */
  private transformBackendEducationToFrontend(backendEdu: any): EducationEntry {
    return {
      id: backendEdu.id,
      userId: this.userProfile?.id || '',
      type: backendEdu.type || EducationType.UNIVERSITY_DEGREE,
      status: backendEdu.status || 'COMPLETED',
      title: backendEdu.title || backendEdu.titulo || '',
      institution: backendEdu.institution || backendEdu.institucion || '',
      startDate: backendEdu.startDate ? new Date(backendEdu.startDate) : new Date(),
      endDate: backendEdu.endDate ? new Date(backendEdu.endDate) : undefined,
      isOngoing: backendEdu.isOngoing || false,
      documentUrl: backendEdu.documentUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    } as EducationEntry;
  }
}
