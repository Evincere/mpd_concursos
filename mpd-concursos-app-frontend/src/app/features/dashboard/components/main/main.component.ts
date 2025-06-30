import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
// ✅ ELIMINADO: QuickActionsComponent (redundante con widgets)
import { EstadoPerfilWidgetComponent } from '../widgets/estado-perfil-widget/estado-perfil-widget.component';
import { ProximosVencimientosWidgetComponent } from '../widgets/proximos-vencimientos-widget/proximos-vencimientos-widget.component';
import { AccionesRapidasWidgetComponent } from '../widgets/acciones-rapidas-widget/acciones-rapidas-widget.component';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { DashboardData, SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';
import { Subscription, fromEvent, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
// ✅ REFACTORIZACIÓN: Servicios unificados
import { UnifiedDashboardService } from '@core/services/dashboard/unified-dashboard.service';
import { AppConfigService } from '@core/services/config/app-config.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';
import { LoggingService } from '@core/services/logging/logging.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    CardsComponent,
    RecentSectionComponent,
    // ✅ ELIMINADO: QuickActionsComponent (redundante)
    EstadoPerfilWidgetComponent,
    ProximosVencimientosWidgetComponent,
    AccionesRapidasWidgetComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  recentConcursos: RecentConcurso[] = [];
  dashboardData: DashboardData | null = null;
  simpleDashboardData: SimpleDashboardData | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    // ✅ REFACTORIZACIÓN: Servicios unificados
    private unifiedDashboardService: UnifiedDashboardService,
    private appConfigService: AppConfigService,
    private inscriptionRecoveryService: InscriptionRecoveryService,
    private loggingService: LoggingService
  ) {
    // ✅ REFACTORIZACIÓN: Configuración centralizada
    this.MIN_RELOAD_INTERVAL = this.appConfigService.getTimeInterval('minReloadInterval');
  }

  private lastDataLoadTimestamp = 0;
  private readonly MIN_RELOAD_INTERVAL: number;



  ngOnInit(): void {
    // ✅ LIMPIEZA: Limpiar inscripciones inválidas del localStorage al inicializar
    this.cleanupInvalidInscriptionsWrapper();

    this.cargarDatos();

    // ✅ LIMPIEZA: Listener para recargar datos cuando la página vuelve a ser visible
    this.subscription.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (!document.hidden) {
          this.cargarDatos();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private cargarDatos(): void {
    // ✅ REFACTORIZACIÓN: Verificar intervalo usando configuración centralizada
    const ahora = Date.now();
    if (ahora - this.lastDataLoadTimestamp < this.MIN_RELOAD_INTERVAL) {
      return; // Evitar recargas muy frecuentes
    }
    this.lastDataLoadTimestamp = ahora;

    // ✅ REFACTORIZACIÓN: Usar servicio unificado
    // Suscripción a las cards
    this.subscription.add(
      this.unifiedDashboardService.getDashboardCards().subscribe({
        next: (cards: Card[]) => {
          this.cards = cards;
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar las cards del dashboard', error, 'MainComponent');
        }
      })
    );

    // Suscripción a los concursos recientes
    this.subscription.add(
      this.unifiedDashboardService.getRecentConcursos().subscribe({
        next: (concursos: RecentConcurso[]) => {
          this.recentConcursos = concursos;
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar los concursos recientes', error, 'MainComponent');
        }
      })
    );

    // Suscripción a los datos de widgets premium
    this.subscription.add(
      this.unifiedDashboardService.getDashboardData().subscribe({
        next: (dashboardData: DashboardData) => {
          this.dashboardData = dashboardData;
          this.simpleDashboardData = this.convertToSimpleDashboardData(dashboardData);
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar datos de widgets premium', error, 'MainComponent');
          // Mantener funcionalidad básica aunque fallen los widgets premium
          this.dashboardData = null;
          this.simpleDashboardData = this.getDefaultSimpleDashboardData();
        }
      })
    );
  }

  private convertToSimpleDashboardData(dashboardData: DashboardData): SimpleDashboardData {
    // Calcular documentos pendientes reales basado en las secciones que requieren documentos
    const documentosPendientes = dashboardData.estadoPerfil?.seccionesPendientes?.filter(
      seccion => seccion.nombre === 'Documentación' || seccion.icono === 'fa-file-alt'
    ).length || 0;

    return {
      profileCompletion: dashboardData.estadoPerfil?.completitud || 0,
      activeApplications: dashboardData.metricas?.inscripcionesActivas || 0,
      pendingDocuments: documentosPendientes,
      availableExams: 0, // ✅ LIMPIEZA: Exámenes no implementados aún
      upcomingDeadlines: dashboardData.proximosVencimientos?.map(vencimiento => ({
        title: vencimiento.titulo,
        date: vencimiento.fechaLimite.toISOString(),
        daysRemaining: vencimiento.diasRestantes
      })) || []
    };
  }

  private getDefaultSimpleDashboardData(): SimpleDashboardData {
    return {
      profileCompletion: 0,
      activeApplications: 0,
      pendingDocuments: 0,
      availableExams: 0,
      upcomingDeadlines: []
    };
  }

  // ✅ REFACTORIZACIÓN: Método eliminado - funcionalidad movida a UnifiedDashboardService

  private cleanupInvalidInscriptionsWrapper(): void {
    // ✅ SEGURIDAD: Eliminado casting 'any' - método existe en el servicio
    this.inscriptionRecoveryService.cleanupInvalidInscriptions();
  }
}
