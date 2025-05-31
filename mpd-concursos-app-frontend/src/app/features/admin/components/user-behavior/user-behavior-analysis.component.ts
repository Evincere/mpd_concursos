import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { InscriptionAnalyticsService, AnalyticsFilter, FunnelData, DropOffPoint, StepTimeMetrics, FeatureUsageData, UserSegment } from '@core/services/admin/inscription-analytics.service';
import { InscriptionFunnelComponent } from './components/inscription-funnel/inscription-funnel.component';
import { DropOffAnalysisComponent } from './components/drop-off-analysis/drop-off-analysis.component';
import { StepTimeAnalysisComponent } from './components/step-time-analysis/step-time-analysis.component';
import { FeatureUsageComponent } from './components/feature-usage/feature-usage.component';
import { UserSegmentationComponent } from './components/user-segmentation/user-segmentation.component';

@Component({
  selector: 'app-user-behavior-analysis',
  templateUrl: './user-behavior-analysis.component.html',
  styleUrls: ['./user-behavior-analysis.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InscriptionFunnelComponent,
    DropOffAnalysisComponent,
    StepTimeAnalysisComponent,
    FeatureUsageComponent,
    UserSegmentationComponent
  ]
})
export class UserBehaviorAnalysisComponent implements OnInit, OnDestroy {
  // Datos de análisis
  funnelData: FunnelData | null = null;
  dropOffPoints: DropOffPoint[] = [];
  stepTimeMetrics: StepTimeMetrics[] = [];
  featureUsageData: FeatureUsageData[] = [];
  userSegments: UserSegment[] = [];

  // Estado de la UI
  isLoading = false;
  activeTab = 0;

  // Formulario de filtros
  filterForm: FormGroup;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private analyticsService: InscriptionAnalyticsService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      dateRange: this.fb.group({
        startDate: [null],
        endDate: [null]
      }),
      contestId: [''],
      userSegment: [''],
      userRole: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos de análisis
   */
  loadData(): void {
    this.isLoading = true;

    // Obtener filtros
    const filter: AnalyticsFilter = {
      startDate: this.filterForm.get('dateRange.startDate')?.value,
      endDate: this.filterForm.get('dateRange.endDate')?.value,
      contestId: this.filterForm.get('contestId')?.value,
      userSegment: this.filterForm.get('userSegment')?.value,
      userRole: this.filterForm.get('userRole')?.value
    };

    // Cargar datos del embudo de conversión
    this.analyticsService.getFunnelData(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.funnelData = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando datos del embudo:', error);
          this.snackBar.open('Error al cargar datos del embudo', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });

    // Cargar datos de puntos de abandono
    this.analyticsService.getDropOffPoints(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dropOffPoints = data;
        },
        error: (error) => {
          console.error('Error cargando puntos de abandono:', error);
        }
      });

    // Cargar métricas de tiempo por etapa
    this.analyticsService.getStepTimeMetrics(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stepTimeMetrics = data;
        },
        error: (error) => {
          console.error('Error cargando métricas de tiempo:', error);
        }
      });

    // Cargar datos de uso de funcionalidades
    this.analyticsService.getFeatureUsageData(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.featureUsageData = data;
        },
        error: (error) => {
          console.error('Error cargando datos de uso de funcionalidades:', error);
        }
      });

    // Cargar segmentos de usuarios
    this.analyticsService.getUserSegments(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.userSegments = data;
        },
        error: (error) => {
          console.error('Error cargando segmentos de usuarios:', error);
        }
      });
  }

  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    this.loadData();
  }

  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      dateRange: {
        startDate: null,
        endDate: null
      },
      contestId: '',
      userSegment: '',
      userRole: ''
    });

    this.loadData();
  }

  /**
   * Maneja el cambio de pestaña
   * @param index Índice de la pestaña seleccionada
   */
  onTabChange(index: number): void {
    this.activeTab = index;
  }
}
