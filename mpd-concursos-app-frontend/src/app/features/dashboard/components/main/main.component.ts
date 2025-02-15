import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { Subscription } from 'rxjs';

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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    // Suscripción a las cards
    this.subscription.add(
      this.dashboardService.getDashboardCards().subscribe({
        next: (cards) => {
          console.log('[MainComponent] Cards actualizadas:', cards);
          this.cards = cards;
        },
        error: (error) => {
          console.error('[MainComponent] Error al cargar las cards:', error);
        }
      })
    );

    // Suscripción a los concursos recientes
    this.subscription.add(
      this.dashboardService.getRecentConcursos().subscribe({
        next: (concursos) => {
          console.log('[MainComponent] Concursos recientes actualizados:', concursos);
          this.recentConcursos = concursos;
        },
        error: (error) => {
          console.error('[MainComponent] Error al cargar los concursos recientes:', error);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
