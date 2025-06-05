import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from  '@angular/common';

import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { Subscription, fromEvent } from 'rxjs';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    CardsComponent,
    RecentSectionComponent,
    QuickActionsComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  recentConcursos: RecentConcurso[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private dashboardService: DashboardService,
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
  }
}
