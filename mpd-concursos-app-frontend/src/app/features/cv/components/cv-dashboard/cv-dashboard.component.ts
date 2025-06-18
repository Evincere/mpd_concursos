/**
 * CV Dashboard Component - Main container for CV management
 * 
 * This component provides the main dashboard for CV management with:
 * - Optimized change detection
 * - Lazy loading of child components
 * - Performance monitoring
 * - State management integration
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';

import { CvStateService, CvMigrationService } from '../../../../core/services/cv';
import { FeatureToggleService } from '../../../../core/services/feature-toggle.service';
import { CvData } from '../../../../core/models/cv';

export interface CvDashboardState {
  isLoading: boolean;
  hasData: boolean;
  lastUpdated: Date | null;
  migrationPhase: 'legacy' | 'hybrid' | 'new';
  activeSection: string;
}

@Component({
  selector: 'app-cv-dashboard',
  standalone: false, // Part of CvModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cv-dashboard" 
         [class.loading]="dashboardState().isLoading"
         [class.has-data]="dashboardState().hasData">
      
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">
            <i class="fas fa-user-graduate" aria-hidden="true"></i>
            Mi Currículum Vitae
          </h1>
          
          <div class="header-meta">
            <div class="last-updated" *ngIf="dashboardState().lastUpdated">
              <i class="fas fa-clock" aria-hidden="true"></i>
              Actualizado {{ formatLastUpdated() }}
            </div>
            
            <div class="migration-status" [class]="'phase-' + dashboardState().migrationPhase">
              <i class="fas fa-cog" aria-hidden="true"></i>
              {{ getMigrationLabel() }}
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn preview-btn" 
                  (click)="navigateToPreview()"
                  [attr.aria-label]="'Ver vista previa del CV'">
            <i class="fas fa-eye" aria-hidden="true"></i>
            Vista Previa
          </button>
          
          <button class="action-btn export-btn" 
                  (click)="navigateToExport()"
                  [attr.aria-label]="'Exportar CV'">
            <i class="fas fa-download" aria-hidden="true"></i>
            Exportar
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="dashboard-nav" role="tablist">
        <button *ngFor="let tab of navigationTabs" 
                class="nav-tab"
                [class.active]="tab.route === dashboardState().activeSection"
                [attr.aria-selected]="tab.route === dashboardState().activeSection"
                [attr.aria-controls]="tab.route + '-panel'"
                role="tab"
                (click)="navigateToSection(tab.route)">
          <i [class]="tab.icon" aria-hidden="true"></i>
          <span>{{ tab.label }}</span>
          <span *ngIf="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </button>
      </nav>

      <!-- Content Area -->
      <main class="dashboard-content" 
            [attr.aria-labelledby]="'tab-' + dashboardState().activeSection">
        
        <!-- Loading State -->
        <div *ngIf="dashboardState().isLoading" class="loading-state">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
          </div>
          <p>Cargando información del CV...</p>
        </div>

        <!-- Content Router Outlet -->
        <div *ngIf="!dashboardState().isLoading" 
             class="content-container"
             [attr.id]="dashboardState().activeSection + '-panel'"
             role="tabpanel">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Performance Debug Info (Development Only) -->
      <div *ngIf="showDebugInfo()" class="debug-info">
        <details>
          <summary>🔧 Debug Info</summary>
          <div class="debug-content">
            <div>Change Detection Cycles: {{ changeDetectionCount() }}</div>
            <div>Last Render: {{ lastRenderTime() }}ms</div>
            <div>Memory Usage: {{ memoryUsage() }}</div>
            <div>Active Route: {{ dashboardState().activeSection }}</div>
            <div>Migration Phase: {{ dashboardState().migrationPhase }}</div>
          </div>
        </details>
      </div>
    </div>
  `,
  styles: [`
    .cv-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
      backdrop-filter: blur(20px);
      transition: all 0.3s ease;
    }

    .cv-dashboard.loading {
      opacity: 0.8;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
    }

    .header-content {
      flex: 1;
    }

    .dashboard-title {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 700;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-meta {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .last-updated, .migration-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #9ca3af;
    }

    .migration-status.phase-new { color: #10b981; }
    .migration-status.phase-hybrid { color: #3b82f6; }
    .migration-status.phase-legacy { color: #f59e0b; }

    .quick-actions {
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

    .preview-btn {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .preview-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .export-btn {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .export-btn:hover {
      background: rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    .dashboard-nav {
      display: flex;
      padding: 0 32px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      overflow-x: auto;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .nav-tab:hover {
      color: #d1d5db;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }

    .tab-count {
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .dashboard-content {
      flex: 1;
      padding: 32px;
      min-height: calc(100vh - 200px);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
      color: #9ca3af;
    }

    .loading-spinner {
      font-size: 24px;
      color: #3b82f6;
    }

    .content-container {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .debug-info {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 12px;
      font-size: 11px;
      color: #10b981;
      z-index: 1000;
    }

    .debug-content {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px 20px;
      }

      .header-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .quick-actions {
        width: 100%;
        justify-content: center;
      }

      .dashboard-nav {
        padding: 0 20px;
      }

      .nav-tab {
        padding: 12px 16px;
        font-size: 13px;
      }

      .dashboard-content {
        padding: 20px;
      }

      .dashboard-title {
        font-size: 24px;
      }
    }
  `]
})
export class CvDashboardComponent implements OnInit, OnDestroy {
  
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cvStateService = inject(CvStateService);
  private readonly migrationService = inject(CvMigrationService);
  private readonly featureToggle = inject(FeatureToggleService);

  // Signals for reactive state management
  private cvData = signal<CvData | null>(null);
  private isLoading = signal<boolean>(true);
  private activeRoute = signal<string>('overview');
  private performanceMetrics = signal<{
    changeDetectionCount: number;
    lastRenderTime: number;
    memoryUsage: string;
  }>({
    changeDetectionCount: 0,
    lastRenderTime: 0,
    memoryUsage: '0 MB'
  });

  // Computed properties
  dashboardState = computed((): CvDashboardState => {
    const data = this.cvData();
    const migrationStatus = this.migrationService.getMigrationStatus();
    
    return {
      isLoading: this.isLoading(),
      hasData: !!data && (data.experiences.length > 0 || data.education.length > 0),
      lastUpdated: data?.lastUpdated || null,
      migrationPhase: migrationStatus.phase,
      activeSection: this.activeRoute()
    };
  });

  // Navigation configuration
  navigationTabs = computed(() => {
    const data = this.cvData();
    return [
      {
        route: 'overview',
        label: 'Resumen',
        icon: 'fas fa-chart-pie',
        count: undefined
      },
      {
        route: 'experience',
        label: 'Experiencia',
        icon: 'fas fa-briefcase',
        count: data?.experiences.length || 0
      },
      {
        route: 'education',
        label: 'Educación',
        icon: 'fas fa-graduation-cap',
        count: data?.education.length || 0
      },
      {
        route: 'preview',
        label: 'Vista Previa',
        icon: 'fas fa-eye',
        count: undefined
      }
    ];
  });

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.initializePerformanceMonitoring();
    this.loadCvData();
    this.setupRouteTracking();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePerformanceMonitoring() {
    if (!environment.production) {
      // Monitor change detection cycles
      let cdCount = 0;
      const originalMarkForCheck = (this as any).markForCheck;
      if (originalMarkForCheck) {
        (this as any).markForCheck = () => {
          cdCount++;
          this.performanceMetrics.update(metrics => ({
            ...metrics,
            changeDetectionCount: cdCount
          }));
          return originalMarkForCheck.call(this);
        };
      }

      // Monitor render time
      const startTime = performance.now();
      setTimeout(() => {
        const renderTime = performance.now() - startTime;
        this.performanceMetrics.update(metrics => ({
          ...metrics,
          lastRenderTime: Math.round(renderTime)
        }));
      });

      // Monitor memory usage
      setInterval(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
          this.performanceMetrics.update(metrics => ({
            ...metrics,
            memoryUsage: `${usedMB} MB`
          }));
        }
      }, 5000);
    }
  }

  private loadCvData() {
    // Get current user ID (this would come from auth service)
    const userId = 'current-user'; // TODO: Get from auth service
    
    this.cvStateService.loadUserCv(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.cvData.set(data);
          this.isLoading.set(false);
          console.log('[CvDashboard] CV data loaded successfully');
        },
        error: (error) => {
          console.error('[CvDashboard] Error loading CV data:', error);
          this.isLoading.set(false);
        }
      });
  }

  private setupRouteTracking() {
    this.route.firstChild?.url
      .pipe(takeUntil(this.destroy$))
      .subscribe(segments => {
        const activeSegment = segments[0]?.path || 'overview';
        this.activeRoute.set(activeSegment);
      });
  }

  navigateToSection(route: string) {
    this.router.navigate([route], { relativeTo: this.route });
  }

  navigateToPreview() {
    this.navigateToSection('preview');
  }

  navigateToExport() {
    this.navigateToSection('export');
  }

  formatLastUpdated(): string {
    const lastUpdated = this.dashboardState().lastUpdated;
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  getMigrationLabel(): string {
    const phase = this.dashboardState().migrationPhase;
    switch (phase) {
      case 'new': return 'Sistema Nuevo';
      case 'hybrid': return 'Migración en Progreso';
      case 'legacy': return 'Sistema Legacy';
      default: return 'Desconocido';
    }
  }

  showDebugInfo(): boolean {
    return !environment.production && this.featureToggle.isEnabled('enableCvDebugMode');
  }

  changeDetectionCount(): number {
    return this.performanceMetrics().changeDetectionCount;
  }

  lastRenderTime(): number {
    return this.performanceMetrics().lastRenderTime;
  }

  memoryUsage(): string {
    return this.performanceMetrics().memoryUsage;
  }
}

// Import environment
import { environment } from '../../../../../environments/environment';
