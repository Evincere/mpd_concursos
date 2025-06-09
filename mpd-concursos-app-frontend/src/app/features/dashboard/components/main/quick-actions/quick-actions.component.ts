import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FiltersService } from '@core/services/filters/filters.service';


@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss'
})
export class QuickActionsComponent {
  constructor(
    private router: Router,
    private filtersService: FiltersService
  ) {}

  navigateToNewPostulacion(): void {
    // Logging implementado con LoggingService;

    // Logging implementado con LoggingService;
  }

  navigateToConcursos(): void {
    // Logging implementado con LoggingService;
    this.router.navigate(['/dashboard/concursos']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/perfil']);
  }
}
