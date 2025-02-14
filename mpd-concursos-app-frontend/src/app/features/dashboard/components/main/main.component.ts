import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    CardsComponent,
    RecentSectionComponent,
    QuickActionsComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  private subscription: Subscription = new Subscription();

  recentConcursos = [
    {
      titulo: 'Defensor Público Oficial',
      fecha: '2024-03-15',
      estado: 'Activo',
    },
    {
      titulo: 'Asesor de NNA Y PCR',
      fecha: '2024-03-10',
      estado: 'Próximo',
    },
    {
      titulo: 'Asesor de NNA Y PCR',
      fecha: '2024-03-10',
      estado: 'Próximo',
    }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.dashboardService.getDashboardCards().subscribe({
        next: (cards) => {
          this.cards = cards;
        },
        error: (error) => {
          console.error('Error al cargar las cards del dashboard:', error);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      })
    );
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
