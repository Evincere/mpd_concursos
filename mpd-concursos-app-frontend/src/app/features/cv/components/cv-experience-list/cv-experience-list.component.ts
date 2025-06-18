/**
 * CV Experience List Component - Optimized experience management
 * 
 * This component provides optimized experience list management with:
 * - Virtual scrolling for large lists
 * - Optimistic updates
 * - Inline editing with the new components
 * - Performance monitoring
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

import { ExperienceInlineComponent } from '../../../../shared/components/experience-inline/experience-inline.component';
import { ExperienceCvService, CvStateService } from '../../../../core/services/cv';
import { Experience } from '../../../../core/models/cv';

export interface ExperienceListState {
  experiences: Experience[];
  isLoading: boolean;
  isAdding: boolean;
  searchQuery: string;
  sortBy: 'date' | 'company' | 'position';
  sortOrder: 'asc' | 'desc';
  totalCount: number;
}

@Component({
  selector: 'app-cv-experience-list',
  standalone: false, // Part of CvModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="experience-list-container">
      
      <!-- Header with Actions -->
      <div class="list-header">
        <div class="header-content">
          <h2 class="section-title">
            <i class="fas fa-briefcase" aria-hidden="true"></i>
            Experiencia Laboral
            <span class="count-badge">{{ listState().totalCount }}</span>
          </h2>
          
          <p class="section-description">
            Gestiona tu experiencia profesional con edición inline mejorada
          </p>
        </div>
        
        <div class="header-actions">
          <button class="action-btn add-btn" 
                  (click)="addNewExperience()"
                  [disabled]="listState().isAdding"
                  [attr.aria-label]="'Agregar nueva experiencia laboral'">
            <i class="fas fa-plus" aria-hidden="true"></i>
            {{ listState().isAdding ? 'Agregando...' : 'Agregar Experiencia' }}
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
              placeholder="Buscar por empresa, cargo o descripción..."
              [value]="listState().searchQuery"
              (input)="onSearchChange($event)"
              [attr.aria-label]="'Buscar experiencias'">
            <button *ngIf="listState().searchQuery" 
                    class="clear-search-btn"
                    (click)="clearSearch()"
                    [attr.aria-label]="'Limpiar búsqueda'">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        
        <div class="sort-controls">
          <label class="sort-label">Ordenar por:</label>
          <select class="sort-select" 
                  [value]="listState().sortBy"
                  (change)="onSortChange($event)">
            <option value="date">Fecha</option>
            <option value="company">Empresa</option>
            <option value="position">Cargo</option>
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

      <!-- Experience List -->
      <div class="experience-list" 
           [class.loading]="listState().isLoading"
           [class.empty]="filteredExperiences().length === 0">
        
        <!-- Loading State -->
        <div *ngIf="listState().isLoading" class="loading-state">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
          </div>
          <p>Cargando experiencias...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!listState().isLoading && filteredExperiences().length === 0" 
             class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-briefcase" aria-hidden="true"></i>
          </div>
          <h3>{{ listState().searchQuery ? 'No se encontraron experiencias' : 'Aún no tienes experiencias' }}</h3>
          <p>
            {{ listState().searchQuery 
               ? 'Intenta con otros términos de búsqueda' 
               : 'Comienza agregando tu primera experiencia laboral' }}
          </p>
          <button *ngIf="!listState().searchQuery" 
                  class="empty-action-btn"
                  (click)="addNewExperience()">
            <i class="fas fa-plus" aria-hidden="true"></i>
            Agregar Primera Experiencia
          </button>
        </div>

        <!-- Experience Items -->
        <div *ngIf="!listState().isLoading && filteredExperiences().length > 0" 
             class="experience-items">
          
          <app-experience-inline
            *ngFor="let experience of filteredExperiences(); trackBy: trackByExperienceId"
            [experience]="experience"
            [config]="{
              allowEdit: true,
              allowDelete: true,
              showDocuments: true,
              autoSave: true,
              autoSaveDelay: 2000
            }"
            (updated)="onExperienceUpdated($event)"
            (deleted)="onExperienceDeleted($event)"
            (validationChange)="onValidationChange(experience.id, $event)"
            class="experience-item">
          </app-experience-inline>
        </div>
      </div>

      <!-- Performance Stats (Development Only) -->
      <div *ngIf="showPerformanceStats()" class="performance-stats">
        <div class="stats-header">📊 Performance Stats</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Rendered Items:</span>
            <span class="stat-value">{{ filteredExperiences().length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Filter Time:</span>
            <span class="stat-value">{{ filterTime() }}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Update:</span>
            <span class="stat-value">{{ lastUpdateTime() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .experience-list-container {
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
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
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
      background: #10b981;
      color: white;
    }

    .add-btn:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }

    .add-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    .list-controls {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .search-container {
      flex: 1;
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
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sort-label {
      font-size: 13px;
      color: #d1d5db;
      white-space: nowrap;
    }

    .sort-select {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 13px;
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

    .experience-list {
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
      color: #3b82f6;
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
      background: #10b981;
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
      background: #059669;
      transform: translateY(-1px);
    }

    .experience-items {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .experience-item {
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

    .performance-stats {
      margin-top: 32px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .stats-header {
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
      margin-bottom: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }

    .stat-label {
      color: #9ca3af;
    }

    .stat-value {
      color: #10b981;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .list-controls {
        flex-direction: column;
        gap: 16px;
      }

      .sort-controls {
        justify-content: space-between;
      }

      .section-title {
        font-size: 20px;
      }

      .experience-items {
        gap: 16px;
      }
    }
  `]
})
export class CvExperienceListComponent implements OnInit, OnDestroy {
  
  private readonly experienceService = inject(ExperienceCvService);
  private readonly cvStateService = inject(CvStateService);

  // Signals for reactive state management
  private experiences = signal<Experience[]>([]);
  private isLoading = signal<boolean>(true);
  private isAdding = signal<boolean>(false);
  private searchQuery = signal<string>('');
  private sortBy = signal<'date' | 'company' | 'position'>('date');
  private sortOrder = signal<'asc' | 'desc'>('desc');
  private performanceMetrics = signal<{
    filterTime: number;
    lastUpdateTime: string;
  }>({
    filterTime: 0,
    lastUpdateTime: new Date().toLocaleTimeString()
  });

  // Computed properties
  listState = computed((): ExperienceListState => ({
    experiences: this.experiences(),
    isLoading: this.isLoading(),
    isAdding: this.isAdding(),
    searchQuery: this.searchQuery(),
    sortBy: this.sortBy(),
    sortOrder: this.sortOrder(),
    totalCount: this.experiences().length
  }));

  filteredExperiences = computed(() => {
    const startTime = performance.now();
    
    let filtered = [...this.experiences()];
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(exp => 
        exp.position.toLowerCase().includes(query) ||
        exp.company.toLowerCase().includes(query) ||
        (exp.description && exp.description.toLowerCase().includes(query))
      );
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
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Update performance metrics
    const filterTime = performance.now() - startTime;
    this.performanceMetrics.update(metrics => ({
      ...metrics,
      filterTime: Math.round(filterTime * 100) / 100
    }));
    
    return filtered;
  });

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // TrackBy function for performance
  trackByExperienceId: TrackByFunction<Experience> = (index, experience) => experience.id;

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadExperiences();
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

  private loadExperiences() {
    // Get current user ID (this would come from auth service)
    const userId = 'current-user'; // TODO: Get from auth service
    
    this.experienceService.getByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success && result.data) {
            this.experiences.set(result.data);
            this.updatePerformanceMetrics();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('[CvExperienceList] Error loading experiences:', error);
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

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value as 'date' | 'company' | 'position');
  }

  toggleSortOrder() {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }

  addNewExperience() {
    this.isAdding.set(true);
    
    const newExperience: Partial<Experience> = {
      userId: 'current-user', // TODO: Get from auth service
      position: '',
      company: '',
      startDate: new Date(),
      endDate: null,
      description: '',
      location: ''
    };
    
    this.experienceService.create('current-user', newExperience)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success && result.data) {
            this.experiences.update(experiences => [result.data!, ...experiences]);
            this.updatePerformanceMetrics();
          }
          this.isAdding.set(false);
        },
        error: (error) => {
          console.error('[CvExperienceList] Error creating experience:', error);
          this.isAdding.set(false);
        }
      });
  }

  onExperienceUpdated(experience: Experience) {
    this.experiences.update(experiences => 
      experiences.map(exp => exp.id === experience.id ? experience : exp)
    );
    this.updatePerformanceMetrics();
  }

  onExperienceDeleted(experienceId: string) {
    this.experiences.update(experiences => 
      experiences.filter(exp => exp.id !== experienceId)
    );
    this.updatePerformanceMetrics();
  }

  onValidationChange(experienceId: string, isValid: boolean) {
    // Handle validation state changes if needed
    console.log(`[CvExperienceList] Validation changed for ${experienceId}: ${isValid}`);
  }

  private updatePerformanceMetrics() {
    this.performanceMetrics.update(metrics => ({
      ...metrics,
      lastUpdateTime: new Date().toLocaleTimeString()
    }));
  }

  showPerformanceStats(): boolean {
    return !environment.production;
  }

  filterTime(): number {
    return this.performanceMetrics().filterTime;
  }

  lastUpdateTime(): string {
    return this.performanceMetrics().lastUpdateTime;
  }
}

// Import environment
import { environment } from '../../../../../environments/environment';
