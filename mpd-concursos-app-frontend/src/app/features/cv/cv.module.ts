/**
 * CV Module - Lazy-loaded module for CV functionality
 * 
 * This module provides optimized CV management with:
 * - Lazy loading for better performance
 * - Standalone components architecture
 * - Optimized change detection
 * - Preloading strategies
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Shared components (imported as needed)
import { InlineFieldComponent } from '../../shared/components/inline-field/inline-field.component';
import { InlineTextareaComponent } from '../../shared/components/inline-textarea/inline-textarea.component';
import { InlineDateRangeComponent } from '../../shared/components/inline-date-range/inline-date-range.component';
import { ExperienceInlineComponent } from '../../shared/components/experience-inline/experience-inline.component';
import { EducationInlineComponent } from '../../shared/components/education-inline/education-inline.component';
import { ValidationFeedbackComponent } from '../../shared/components/validation-feedback/validation-feedback.component';

// CV-specific components (lazy-loaded)
import { CvDashboardComponent } from './components/cv-dashboard/cv-dashboard.component';
import { CvExperienceListComponent } from './components/cv-experience-list/cv-experience-list.component';
import { CvEducationListComponent } from './components/cv-education-list/cv-education-list.component';
import { CvPreviewComponent } from './components/cv-preview/cv-preview.component';

// Services
import { RealTimeValidationService } from '../../shared/services/real-time-validation.service';
import { 
  ExperienceCvService, 
  EducationCvService, 
  CvStateService,
  CvMigrationService 
} from '../../core/services/cv';

const routes: Routes = [
  {
    path: '',
    component: CvDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/cv-overview/cv-overview.component')
          .then(m => m.CvOverviewComponent),
        data: { 
          title: 'Resumen CV',
          preload: true 
        }
      },
      {
        path: 'experience',
        component: CvExperienceListComponent,
        data: { 
          title: 'Experiencia Laboral',
          preload: true 
        }
      },
      {
        path: 'education',
        component: CvEducationListComponent,
        data: { 
          title: 'Educación',
          preload: true 
        }
      },
      {
        path: 'preview',
        component: CvPreviewComponent,
        data: { 
          title: 'Vista Previa CV',
          preload: false 
        }
      },
      {
        path: 'export',
        loadComponent: () => import('./components/cv-export/cv-export.component')
          .then(m => m.CvExportComponent),
        data: { 
          title: 'Exportar CV',
          preload: false 
        }
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/cv-settings/cv-settings.component')
          .then(m => m.CvSettingsComponent),
        data: { 
          title: 'Configuración CV',
          preload: false 
        }
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    
    // Shared components
    InlineFieldComponent,
    InlineTextareaComponent,
    InlineDateRangeComponent,
    ExperienceInlineComponent,
    EducationInlineComponent,
    ValidationFeedbackComponent
  ],
  declarations: [
    CvDashboardComponent,
    CvExperienceListComponent,
    CvEducationListComponent,
    CvPreviewComponent
  ],
  providers: [
    // CV-specific services
    ExperienceCvService,
    EducationCvService,
    CvStateService,
    CvMigrationService,
    RealTimeValidationService,
    
    // Performance optimizations
    {
      provide: 'CV_CONFIG',
      useValue: {
        enableLazyLoading: true,
        enablePreloading: true,
        enableCaching: true,
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        maxCacheSize: 50,
        enableOptimisticUpdates: true,
        enableRealTimeValidation: true,
        debounceTime: 300,
        enableChangeDetectionOptimization: true
      }
    }
  ]
})
export class CvModule {
  
  constructor() {
    console.log('[CvModule] Lazy-loaded CV module initialized');
    
    // Performance monitoring
    if (!environment.production) {
      this.logPerformanceMetrics();
    }
  }

  private logPerformanceMetrics() {
    // Log module loading time
    const loadTime = performance.now();
    console.log(`[CvModule] Module loaded in ${loadTime.toFixed(2)}ms`);
    
    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('[CvModule] Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
}

// Import environment for production check
import { environment } from '../../../environments/environment';
