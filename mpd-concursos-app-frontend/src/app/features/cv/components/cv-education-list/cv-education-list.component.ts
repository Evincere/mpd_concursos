/**
 * CV Education List Component - Optimized education management
 * 
 * This component provides optimized education list management with:
 * - Performance optimizations similar to experience list
 * - Inline editing with the new education components
 * - Education type filtering and sorting
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  TrackByFunction
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { EducationInlineComponent } from '../../../../shared/components/education-inline/education-inline.component';
import { EducationCvService, CvStateService } from '../../../../core/services/cv';
import { Education, EducationType, EducationStatus } from '../../../../core/models/cv';

export interface EducationListState {
  education: Education[];
  isLoading: boolean;
  isAdding: boolean;
  searchQuery: string;
  filterType: EducationType | 'all';
  filterStatus: EducationStatus | 'all';
  sortBy: 'date' | 'institution' | 'title' | 'type';
  sortOrder: 'asc' | 'desc';
  totalCount: number;
}

@Component({
  selector: 'app-cv-education-list',
  standalone: false, // Part of CvModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="education-list-container">
      
      <!-- Header with Actions -->
      <div class="list-header">
        <div class="header-content">
          <h2 class="section-title">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
            Educación y Formación
            <span class="count-badge">{{ listState().totalCount }}</span>
          </h2>
          
          <p class="section-description">
            Gestiona tu formación académica y certificaciones profesionales
          </p>
        </div>
        
        <div class="header-actions">
          <button class="action-btn add-btn" 
                  (click)="addNewEducation()"
                  [disabled]="listState().isAdding"
                  [attr.aria-label]="'Agregar nueva educación'">
            <i class="fas fa-plus" aria-hidden="true"></i>
            {{ listState().isAdding ? 'Agregando...' : 'Agregar Educación' }}
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="list-controls">
        <div class="search-container">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon" aria-hidden="true"></i>
            <input 
              type="text"
              class="search-input"
              placeholder="Buscar por institución, título o descripción..."
              [value]="listState().searchQuery"
              (input)="onSearchChange($event)"
              [attr.aria-label]="'Buscar educación'">
            <button *ngIf="listState().searchQuery" 
                    class="clear-search-btn"
                    (click)="clearSearch()"
                    [attr.aria-label]="'Limpiar búsqueda'">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        
        <div class="filter-controls">
          <div class="filter-group">
            <label class="filter-label">Tipo:</label>
            <select class="filter-select" 
                    [value]="listState().filterType"
                    (change)="onTypeFilterChange($event)">
              <option value="all">Todos</option>
              <option value="UNIVERSITY_DEGREE">Universitario</option>
              <option value="POSTGRADUATE">Posgrado</option>
              <option value="MASTER_DEGREE">Maestría</option>
              <option value="DOCTORATE">Doctorado</option>
              <option value="TECHNICAL_EDUCATION">Técnico</option>
              <option value="CERTIFICATION">Certificación</option>
              <option value="COURSE">Curso</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Estado:</label>
            <select class="filter-select" 
                    [value]="listState().filterStatus"
                    (change)="onStatusFilterChange($event)">
              <option value="all">Todos</option>
              <option value="COMPLETED">Completado</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="ABANDONED">Abandonado</option>
            </select>
          </div>
        </div>
        
        <div class="sort-controls">
          <label class="sort-label">Ordenar por:</label>
          <select class="sort-select" 
                  [value]="listState().sortBy"
                  (change)="onSortChange($event)">
            <option value="date">Fecha</option>
            <option value="institution">Institución</option>
            <option value="title">Título</option>
            <option value="type">Tipo</option>
          </select>
          
          <button class="sort-order-btn" 
                  (click)="toggleSortOrder()"
                  [attr.aria-label]="'Cambiar orden de clasificación'">
            <i class="fas" 
               [class.fa-sort-up]="listState().sortOrder === 'asc'"
               [class.fa-sort-down]="listState().sortOrder === 'desc'"
               aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Education List -->
      <div class="education-list" 
           [class.loading]="listState().isLoading"
           [class.empty]="filteredEducation().length === 0">
        
        <!-- Loading State -->
        <div *ngIf="listState().isLoading" class="loading-state">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
          </div>
          <p>Cargando educación...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!listState().isLoading && filteredEducation().length === 0" 
             class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <h3>{{ getEmptyStateTitle() }}</h3>
          <p>{{ getEmptyStateMessage() }}</p>
          <button *ngIf="!hasActiveFilters()" 
                  class="empty-action-btn"
                  (click)="addNewEducation()">
            <i class="fas fa-plus" aria-hidden="true"></i>
            Agregar Primera Educación
          </button>
          <button *ngIf="hasActiveFilters()" 
                  class="empty-action-btn secondary"
                  (click)="clearAllFilters()">
            <i class="fas fa-filter" aria-hidden="true"></i>
            Limpiar Filtros
          </button>
        </div>

        <!-- Education Items -->
        <div *ngIf="!listState().isLoading && filteredEducation().length > 0" 
             class="education-items">
          
          <app-education-inline
            *ngFor="let education of filteredEducation(); trackBy: trackByEducationId"
            [education]="education"
            [config]="{
              allowEdit: true,
              allowDelete: true,
              showDocuments: true,
              showScientificActivities: true,
              autoSave: true,
              autoSaveDelay: 2000
            }"
            (updated)="onEducationUpdated($event)"
            (deleted)="onEducationDeleted($event)"
            (validationChange)="onValidationChange(education.id, $event)"
            class="education-item">
          </app-education-inline>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div *ngIf="!listState().isLoading && listState().totalCount > 0" 
           class="education-stats">
        <div class="stats-header">📊 Resumen de Educación</div>
        <div class="stats-grid">
          <div class="stat-item" *ngFor="let stat of educationStats()">
            <span class="stat-label">{{ stat.label }}:</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .education-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      flex: 1;
    }

    .section-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .count-badge {
      padding: 4px 8px;
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .section-description {
      margin: 0;
      color: #9ca3af;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .add-btn {
      background: #8b5cf6;
      color: white;
    }

    .add-btn:hover:not(:disabled) {
      background: #7c3aed;
      transform: translateY(-1px);
    }

    .add-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    .list-controls {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 24px;
      margin-bottom: 24px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .search-container {
      min-width: 300px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
      font-size: 14px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #f9fafb;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #8b5cf6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #9ca3af;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      transition: all 0.3s ease;
    }

    .clear-search-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #f9fafb;
    }

    .filter-controls {
      display: flex;
      gap: 16px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label, .sort-label {
      font-size: 13px;
      color: #d1d5db;
      white-space: nowrap;
    }

    .filter-select, .sort-select {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 13px;
      min-width: 120px;
    }

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sort-order-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #9ca3af;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .sort-order-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #f9fafb;
    }

    .education-list {
      min-height: 400px;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
      color: #9ca3af;
      text-align: center;
    }

    .loading-spinner {
      font-size: 24px;
      color: #8b5cf6;
    }

    .empty-icon {
      font-size: 48px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #d1d5db;
    }

    .empty-state p {
      margin: 0 0 16px 0;
      max-width: 400px;
    }

    .empty-action-btn {
      padding: 12px 20px;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .empty-action-btn:hover {
      background: #7c3aed;
      transform: translateY(-1px);
    }

    .empty-action-btn.secondary {
      background: #6b7280;
    }

    .empty-action-btn.secondary:hover {
      background: #4b5563;
    }

    .education-items {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .education-item {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .education-stats {
      margin-top: 32px;
      padding: 20px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .stats-header {
      font-size: 14px;
      font-weight: 600;
      color: #8b5cf6;
      margin-bottom: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }

    .stat-label {
      color: #d1d5db;
    }

    .stat-value {
      color: #8b5cf6;
      font-weight: 600;
    }

    @media (max-width: 1024px) {
      .list-controls {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .filter-controls {
        justify-content: space-between;
      }

      .sort-controls {
        justify-content: space-between;
      }
    }

    @media (max-width: 768px) {
      .list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .filter-controls {
        flex-direction: column;
        gap: 12px;
      }

      .filter-group {
        justify-content: space-between;
      }

      .section-title {
        font-size: 20px;
      }

      .education-items {
        gap: 16px;
      }

      .search-container {
        min-width: auto;
      }
    }
  `]
})
export class CvEducationListComponent implements OnInit, OnDestroy {
  
  private readonly educationService = inject(EducationCvService);
  private readonly cvStateService = inject(CvStateService);

  // Signals for reactive state management
  private education = signal<Education[]>([]);
  private isLoading = signal<boolean>(true);
  private isAdding = signal<boolean>(false);
  private searchQuery = signal<string>('');
  private filterType = signal<EducationType | 'all'>('all');
  private filterStatus = signal<EducationStatus | 'all'>('all');
  private sortBy = signal<'date' | 'institution' | 'title' | 'type'>('date');
  private sortOrder = signal<'asc' | 'desc'>('desc');

  // Computed properties
  listState = computed((): EducationListState => ({
    education: this.education(),
    isLoading: this.isLoading(),
    isAdding: this.isAdding(),
    searchQuery: this.searchQuery(),
    filterType: this.filterType(),
    filterStatus: this.filterStatus(),
    sortBy: this.sortBy(),
    sortOrder: this.sortOrder(),
    totalCount: this.education().length
  }));

  filteredEducation = computed(() => {
    let filtered = [...this.education()];
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(edu => 
        edu.institution.toLowerCase().includes(query) ||
        edu.title.toLowerCase().includes(query) ||
        (edu.description && edu.description.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    const typeFilter = this.filterType();
    if (typeFilter !== 'all') {
      filtered = filtered.filter(edu => edu.type === typeFilter);
    }
    
    // Apply status filter
    const statusFilter = this.filterStatus();
    if (statusFilter !== 'all') {
      filtered = filtered.filter(edu => edu.status === statusFilter);
    }
    
    // Apply sorting
    const sortBy = this.sortBy();
    const sortOrder = this.sortOrder();
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'institution':
          comparison = a.institution.localeCompare(b.institution);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  });

  educationStats = computed(() => {
    const education = this.education();
    const typeCount = new Map<EducationType, number>();
    const statusCount = new Map<EducationStatus, number>();
    
    education.forEach(edu => {
      typeCount.set(edu.type, (typeCount.get(edu.type) || 0) + 1);
      statusCount.set(edu.status, (statusCount.get(edu.status) || 0) + 1);
    });
    
    const stats = [];
    
    // Most common type
    const mostCommonType = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    if (mostCommonType) {
      stats.push({
        label: 'Tipo más común',
        value: this.getTypeLabel(mostCommonType[0])
      });
    }
    
    // Completed count
    const completedCount = statusCount.get(EducationStatus.COMPLETED) || 0;
    stats.push({
      label: 'Completados',
      value: `${completedCount} de ${education.length}`
    });
    
    // In progress count
    const inProgressCount = statusCount.get(EducationStatus.IN_PROGRESS) || 0;
    if (inProgressCount > 0) {
      stats.push({
        label: 'En progreso',
        value: inProgressCount.toString()
      });
    }
    
    return stats;
  });

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // TrackBy function for performance
  trackByEducationId: TrackByFunction<Education> = (index, education) => education.id;

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadEducation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebouncing() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
      });
  }

  private loadEducation() {
    // Get current user ID (this would come from auth service)
    const userId = 'current-user'; // TODO: Get from auth service
    
    this.educationService.getByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success && result.data) {
            this.education.set(result.data);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('[CvEducationList] Error loading education:', error);
          this.isLoading.set(false);
        }
      });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  onTypeFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.filterType.set(target.value as EducationType | 'all');
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.filterStatus.set(target.value as EducationStatus | 'all');
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value as 'date' | 'institution' | 'title' | 'type');
  }

  toggleSortOrder() {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }

  addNewEducation() {
    this.isAdding.set(true);
    
    const newEducation: Partial<Education> = {
      userId: 'current-user', // TODO: Get from auth service
      type: EducationType.UNIVERSITY_DEGREE,
      institution: '',
      title: '',
      startDate: new Date(),
      endDate: null,
      status: EducationStatus.COMPLETED,
      description: '',
      scientificActivities: []
    };
    
    this.educationService.create('current-user', newEducation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success && result.data) {
            this.education.update(education => [result.data!, ...education]);
          }
          this.isAdding.set(false);
        },
        error: (error) => {
          console.error('[CvEducationList] Error creating education:', error);
          this.isAdding.set(false);
        }
      });
  }

  onEducationUpdated(education: Education) {
    this.education.update(educationList => 
      educationList.map(edu => edu.id === education.id ? education : edu)
    );
  }

  onEducationDeleted(educationId: string) {
    this.education.update(educationList => 
      educationList.filter(edu => edu.id !== educationId)
    );
  }

  onValidationChange(educationId: string, isValid: boolean) {
    // Handle validation state changes if needed
    console.log(`[CvEducationList] Validation changed for ${educationId}: ${isValid}`);
  }

  hasActiveFilters(): boolean {
    return this.searchQuery() !== '' || 
           this.filterType() !== 'all' || 
           this.filterStatus() !== 'all';
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.filterType.set('all');
    this.filterStatus.set('all');
  }

  getEmptyStateTitle(): string {
    if (this.hasActiveFilters()) {
      return 'No se encontraron registros';
    }
    return 'Aún no tienes educación registrada';
  }

  getEmptyStateMessage(): string {
    if (this.hasActiveFilters()) {
      return 'Intenta ajustar los filtros de búsqueda';
    }
    return 'Comienza agregando tu formación académica y certificaciones';
  }

  private getTypeLabel(type: EducationType): string {
    const labels = {
      [EducationType.PRIMARY_EDUCATION]: 'Primaria',
      [EducationType.SECONDARY_EDUCATION]: 'Secundaria',
      [EducationType.TECHNICAL_EDUCATION]: 'Técnica',
      [EducationType.UNIVERSITY_DEGREE]: 'Universitaria',
      [EducationType.POSTGRADUATE]: 'Posgrado',
      [EducationType.MASTER_DEGREE]: 'Maestría',
      [EducationType.DOCTORATE]: 'Doctorado',
      [EducationType.CERTIFICATION]: 'Certificación',
      [EducationType.COURSE]: 'Curso',
      [EducationType.WORKSHOP]: 'Taller'
    };
    return labels[type] || type;
  }
}

// Import environment
import { environment } from '../../../../../environments/environment';
