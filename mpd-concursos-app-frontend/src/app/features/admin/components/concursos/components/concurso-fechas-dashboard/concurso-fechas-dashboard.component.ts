import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { AdminConcursosService } from '../../../../../../core/services/admin/admin-concursos.service';
import { NotificationService } from '@shared/services/notification.service';
import { ConcursoTimelineComponent } from '../concurso-timeline/concurso-timeline.component';
import { FechasImportantesComponent } from '../fechas-importantes/fechas-importantes.component';
import { ConcursoFechasComponent } from '../concurso-fechas/concurso-fechas.component';
import { DateAdapter } from '@shared/adapters/date-adapter';

// Componentes glassmorphism customizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';

@Component({
  selector: 'app-concurso-fechas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSpinnerComponent,
    ConcursoTimelineComponent,
    FechasImportantesComponent,
    ConcursoFechasComponent
  ],
  template: `
    <!-- ===== ENHANCED GLASSMORPHISM FECHAS DASHBOARD ===== -->
    <div class="fechas-dashboard-container" #dashboardContainer>
      <!-- Premium Glassmorphism Header -->
      <div class="header" #headerSection tabindex="-1" role="banner" aria-label="Gestión de fechas del concurso">
        <div class="title-section">
          <h2 class="title">Gestión de Fechas</h2>
          <p class="subtitle" *ngIf="concurso">{{ concurso.title }}</p>
        </div>

        <div class="actions">
          <app-custom-button
            color="primary"
            variant="stroked"
            (buttonClick)="goBack()"
            [disabled]="isLoading">
            <span class="button-icon">🔙</span>
            <span class="button-text">Volver</span>
          </app-custom-button>
        </div>
      </div>

      <!-- Enhanced Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <app-custom-spinner size="large" color="primary"></app-custom-spinner>
        <p>Cargando información del concurso...</p>
      </div>

      <!-- Enhanced Error State -->
      <div class="error-container" *ngIf="error">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <app-custom-button
          color="primary"
          variant="flat"
          (buttonClick)="loadConcurso()"
          [disabled]="isLoading">
          <span class="button-icon">🔄</span>
          <span class="button-text">Reintentar</span>
        </app-custom-button>
      </div>

      <!-- Enhanced Content with Glassmorphism -->
      <div class="content" *ngIf="concurso && !isLoading">
        <!-- Timeline Card with Glassmorphism -->
        <app-custom-card class="timeline-card" [elevated]="true">
          <app-concurso-timeline [concurso]="concurso"></app-concurso-timeline>
        </app-custom-card>

        <!-- Custom Divider -->
        <div class="custom-divider"></div>

        <!-- Custom Glassmorphism Tabs -->
        <div class="fechas-tabs">
          <div class="tabs-header">
            <button
              class="tab-button"
              [class.active]="activeTab === 0"
              (click)="setActiveTab(0)"
              type="button">
              <span class="tab-icon">📅</span>
              <span class="tab-text">Fechas Importantes</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab === 1"
              (click)="setActiveTab(1)"
              type="button">
              <span class="tab-icon">⚙️</span>
              <span class="tab-text">Gestión de Fechas</span>
            </button>
          </div>

          <div class="tabs-content">
            <div class="tab-panel" [class.active]="activeTab === 0">
              <app-fechas-importantes
                [dates]="concurso && concurso.dates ? DateAdapter.toConursoDates(concurso.dates) : []">
              </app-fechas-importantes>
            </div>

            <div class="tab-panel" [class.active]="activeTab === 1">
              <app-concurso-fechas
                [contestId]="concursoId"
                (fechasUpdated)="loadConcurso()">
              </app-concurso-fechas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== ENHANCED GLASSMORPHISM DESIGN SYSTEM - FECHAS DASHBOARD ===== */
    /* Optimized for individual contest date management with scroll fix */

    .fechas-dashboard-container {
      padding: 1.5rem;
      background: transparent; /* Inherit dashboard background */
      min-height: 100vh;
      color: #f9fafb;
      position: relative;
      /* Fix scroll positioning issue */
      scroll-behavior: smooth;
      overflow-x: hidden;

      /* Ensure proper viewport positioning */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: transparent;
        z-index: -1;
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      /* Premium glassmorphism header with enhanced positioning */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.85) 0%,
        rgba(75, 85, 99, 0.95) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(76, 175, 80, 0.1) 30%, rgba(255, 255, 255, 0.12) 70%, rgba(76, 175, 80, 0.08) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      /* Ensure header is always visible */
      position: sticky;
      top: 0;
      z-index: 100;

      &:hover {
        background-image:
          linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(76, 175, 80, 0.15) 30%, rgba(255, 255, 255, 0.15) 70%, rgba(76, 175, 80, 0.1) 100%);
        transform: translateY(-1px);
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        border-color: rgba(76, 175, 80, 0.3);
      }

      .title-section {
        flex: 1;

        .title {
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #f9fafb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          line-height: 1.2;
        }

        .title::before {
          content: "📅";
          font-size: 1.75rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }

        .subtitle {
          font-size: 1.125rem;
          color: #d1d5db;
          margin: 0;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          opacity: 0.9;
        }
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;

        app-custom-button {
          /* Enhanced glassmorphism for custom buttons */
          .button-icon {
            font-size: 1rem;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          }

          .button-text {
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      /* Premium glassmorphism for loading/error states */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      margin: 2rem 0;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      p {
        margin: 1rem 0;
        color: #d1d5db;
        font-size: 1rem;
        font-weight: 500;
        text-align: center;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      app-custom-spinner {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
    }

    .error-container {
      background-image:
        linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-color: rgba(239, 68, 68, 0.2);

      .error-icon {
        font-size: 3rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        margin-bottom: 1rem;
      }

      app-custom-button {
        margin-top: 1rem;
      }
    }

    .content {
      .timeline-card {
        margin-bottom: 2rem;
        /* Timeline card inherits glassmorphism from custom-card */

        &:hover {
          transform: translateY(-1px);
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        }
      }

      .custom-divider {
        margin: 2rem 0;
        height: 1px;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.15) 20%,
          rgba(76, 175, 80, 0.3) 50%,
          rgba(255, 255, 255, 0.15) 80%,
          transparent 100%);
        border-radius: 1px;
        opacity: 0.8;
      }

      // Enhanced glassmorphism for custom tabs
      .fechas-tabs {
        /* Premium glassmorphism for custom tab group */
        background: linear-gradient(135deg,
          rgba(55, 65, 81, 0.8) 0%,
          rgba(75, 85, 99, 0.9) 100%);
        background-image:
          linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(76, 175, 80, 0.06) 50%, rgba(255, 255, 255, 0.05) 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 8px;
        overflow: hidden;
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(76, 175, 80, 0.08) 50%, rgba(255, 255, 255, 0.06) 100%);
          transform: translateY(-1px);
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .tabs-header {
          display: flex;
          background: linear-gradient(135deg,
            rgba(75, 85, 99, 0.9) 0%,
            rgba(55, 65, 81, 0.95) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          .tab-button {
            flex: 1;
            padding: 1rem 1.5rem;
            border: none;
            background: transparent;
            color: #d1d5db;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            position: relative;

            .tab-icon {
              font-size: 1rem;
              filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
            }

            .tab-text {
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            &:hover:not(.active) {
              color: #f9fafb;
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%);
            }

            &.active {
              color: #4CAF50;
              background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
              border-bottom: 3px solid #4CAF50;
              box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);

              .tab-icon,
              .tab-text {
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
              }
            }

            &:focus {
              outline: none;
              box-shadow: inset 0 0 0 2px rgba(76, 175, 80, 0.6);
            }
          }
        }

        .tabs-content {
          padding: 1.5rem;

          .tab-panel {
            display: none;

            &.active {
              display: block;
              animation: fadeIn 0.3s ease-in-out;
            }
          }
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    /* ===== RESPONSIVE DESIGN GLASSMORPHISM ===== */
    /* Enhanced responsive design for individual contest date management */

    @media (max-width: 992px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;

        .title-section {
          .title {
            font-size: 1.75rem;
          }

          .subtitle {
            font-size: 1rem;
          }
        }

        .actions {
          justify-content: flex-end;
        }
      }

      .content {
        .timeline-card {
          margin-bottom: 1.5rem;
        }

        .fechas-tabs {
          padding: 1rem;
        }
      }
    }

    @media (max-width: 768px) {
      .fechas-dashboard-container {
        padding: 1rem;
      }

      .header {
        padding: 1rem;
        margin-bottom: 1.5rem;
        /* Optimize glassmorphism for mobile */
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);

        .title-section {
          .title {
            font-size: 1.5rem;
            gap: 0.5rem;

            &::before {
              font-size: 1.5rem;
            }
          }

          .subtitle {
            font-size: 0.9375rem;
          }
        }

        .actions {
          button {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
          }
        }
      }

      .content {
        .fechas-tabs {
          padding: 0.75rem;
        }
      }
    }

    @media (max-width: 480px) {
      .fechas-dashboard-container {
        padding: 0.75rem;
      }

      .header {
        padding: 0.875rem;
        /* Minimal glassmorphism for very small screens */
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        .title-section {
          .title {
            font-size: 1.375rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;

            &::before {
              font-size: 1.25rem;
            }
          }

          .subtitle {
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
        }

        .actions {
          width: 100%;
          justify-content: stretch;

          button {
            flex: 1;
            padding: 0.75rem !important;
          }
        }
      }

      .content {
        .timeline-card {
          margin-bottom: 1rem;
        }

        .fechas-tabs {
          padding: 0.5rem;
        }
      }
    }

    /* ===== ACCESSIBILITY ENHANCEMENTS ===== */
    /* WCAG AA compliance for glassmorphism elements */

    @media (prefers-reduced-motion: reduce) {
      .fechas-dashboard-container,
      .header,
      .timeline-card,
      .fechas-tabs,
      app-custom-button {
        transition: none !important;
        animation: none !important;
      }
    }

    @media (prefers-contrast: high) {
      .header {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .timeline-card {
        border-width: 2px !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      .actions button {
        border-width: 2px !important;
        border-color: rgba(76, 175, 80, 0.6) !important;
      }
    }

    /* Focus states for keyboard navigation */
    .header:focus-within,
    .timeline-card:focus-within,
    .fechas-tabs:focus-within {
      outline: 2px solid rgba(76, 175, 80, 0.6);
      outline-offset: 2px;
    }
  `]
})
export class ConcursoFechasDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Exponer DateAdapter para usarlo en la plantilla
  DateAdapter = DateAdapter;

  @ViewChild('dashboardContainer', { static: false }) dashboardContainer!: ElementRef;
  @ViewChild('headerSection', { static: false }) headerSection!: ElementRef;

  concursoId = '';
  concurso: Concurso | null = null;
  isLoading = false;
  error: string | null = null;
  activeTab = 0; // Para manejar las pestañas

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Record<string, string>) => {
        this.concursoId = params['id'];
        if (this.concursoId) {
          this.loadConcurso();
        }
      });
  }

  ngAfterViewInit(): void {
    // Fix scroll positioning issue - ensure view starts at top
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la información del concurso
   */
  loadConcurso(): void {
    if (!this.concursoId) return;

    this.isLoading = true;
    this.error = null;

    this.concursosService.getConcursoById(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (concurso: Concurso) => {
          this.concurso = concurso;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando concurso:', error);
          this.error = 'Error al cargar la información del concurso. Por favor, inténtelo de nuevo.';
          this.notificationService.error('Error al cargar la información del concurso');
          this.isLoading = false;
        }
      });
  }

  /**
   * Navega de vuelta a la lista de concursos
   */
  goBack(): void {
    this.router.navigate(['/admin/concursos']);
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  /**
   * Scroll to top to fix positioning issue
   */
  private scrollToTop(): void {
    // Multiple approaches to ensure proper scroll positioning
    setTimeout(() => {
      // Method 1: Scroll window to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Method 2: Scroll dashboard container to top if available
      if (this.dashboardContainer?.nativeElement) {
        this.dashboardContainer.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

      // Method 3: Focus on header for accessibility
      if (this.headerSection?.nativeElement) {
        this.headerSection.nativeElement.focus();
      }
    }, 100);
  }
}
