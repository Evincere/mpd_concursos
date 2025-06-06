import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from  '@angular/common';

import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
// ✅ ELIMINADO: QuickActionsComponent (redundante con widgets)
import { EstadoPerfilWidgetComponent } from '../widgets/estado-perfil-widget/estado-perfil-widget.component';
import { ProximosVencimientosWidgetComponent } from '../widgets/proximos-vencimientos-widget/proximos-vencimientos-widget.component';
import { AccionesRapidasWidgetComponent } from '../widgets/acciones-rapidas-widget/acciones-rapidas-widget.component';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { DashboardData, SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';
import { Subscription, fromEvent } from 'rxjs';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import { DashboardWidgetsService } from '@core/services/dashboard/dashboard-widgets.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';


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
    private dashboardService: DashboardService,
    private dashboardWidgetsService: DashboardWidgetsService,
    private inscriptionService: InscriptionService,
    private inscriptionRecoveryService: InscriptionRecoveryService
  ) {}


  private lastDataLoadTimestamp = 0;
  private readonly MIN_RELOAD_INTERVAL = 10000; // 10 segundos mínimo entre recargas



  ngOnInit(): void {
    // CORRECCIÓN CRÍTICA: Limpiar inscripciones inválidas del localStorage al inicializar
    this.inscriptionRecoveryService.cleanupInvalidInscriptions();

    this.cargarDatos();

    // Suscribirse a cambios en las inscripciones con throttling
    this.subscription.add(
      this.inscriptionService.inscriptions.subscribe(() => {
        const now = Date.now();
        const timeSinceLastLoad = now - this.lastDataLoadTimestamp;

        if (timeSinceLastLoad < this.MIN_RELOAD_INTERVAL) {
          console.log(`[MainComponent] Throttling aplicado, última carga hace ${timeSinceLastLoad}ms`);
          return;
        }

        console.log('[MainComponent] Cambios detectados en inscripciones, recargando datos...');
        this.cargarDatos();
      })
    );

    // Agregar listener para el evento de visibilidad
    this.subscription.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (!document.hidden) {
          console.log('[MainComponent] Pestaña activa, recargando datos...');
          this.cargarDatos();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private cargarDatos(): void {
    console.log('[MainComponent] Iniciando carga de datos del dashboard...');
    this.lastDataLoadTimestamp = Date.now();

    // Suscripción a las cards
    this.subscription.add(
      this.dashboardService.getDashboardCards().subscribe({
        next: (cards: Card[]) => {
          console.log('[MainComponent] Cards actualizadas:', cards);
          this.cards = cards;
        },
        error: (error: unknown) => {
          console.error('[MainComponent] Error al cargar las cards:', error);
        }
      })
    );

    // Suscripción a los concursos recientes
    this.subscription.add(
      this.dashboardService.getRecentConcursos().subscribe({
        next: (concursos: RecentConcurso[]) => {
          console.log('[MainComponent] Concursos recientes actualizados:', concursos);
          this.recentConcursos = concursos;
        },
        error: (error: unknown) => {
          console.error('[MainComponent] Error al cargar los concursos recientes:', error);
        }
      })
    );

    // ✅ NUEVA FUNCIONALIDAD: Suscripción a los datos de widgets premium
    this.subscription.add(
      this.dashboardWidgetsService.getDashboardData().subscribe({
        next: (dashboardData: DashboardData) => {
          console.log('[MainComponent] Datos de widgets premium actualizados:', dashboardData);
          this.dashboardData = dashboardData;
          this.simpleDashboardData = this.convertToSimpleDashboardData(dashboardData);
        },
        error: (error: unknown) => {
          console.error('[MainComponent] Error al cargar datos de widgets premium:', error);
          // Mantener funcionalidad básica aunque fallen los widgets premium
          this.dashboardData = null;
          this.simpleDashboardData = this.getDefaultSimpleDashboardData();
        }
      })
    );
  }

  private convertToSimpleDashboardData(dashboardData: DashboardData): SimpleDashboardData {
    return {
      profileCompletion: dashboardData.estadoPerfil?.completitud || 0,
      activeApplications: dashboardData.metricas?.inscripcionesActivas || 0,
      pendingDocuments: dashboardData.estadoPerfil?.seccionesPendientes?.length || 0,
      availableExams: 0, // Por ahora no hay exámenes disponibles
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
}
