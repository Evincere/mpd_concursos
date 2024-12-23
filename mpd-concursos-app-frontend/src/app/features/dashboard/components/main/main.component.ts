import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';

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
export class MainComponent {
  cards = [
    {
      title: 'Concursos Activos',
      count: 5,
      icon: 'fa-gavel',
      color: '#4CAF50',
    },
    {
      title: 'Mis Postulaciones',
      count: 2,
      icon: 'fa-file-alt',
      color: '#2196F3',
    },
    {
      title: 'Próximos a Vencer',
      count: 3,
      icon: 'fa-clock',
      color: '#FF9800',
    },
  ];

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


  constructor() {

  }
}
