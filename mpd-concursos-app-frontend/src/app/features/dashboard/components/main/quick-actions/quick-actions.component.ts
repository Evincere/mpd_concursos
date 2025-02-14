import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    console.log('[QuickActionsComponent] Navegando a nueva postulación...');

    // Establecer el filtro para mostrar solo concursos activos
    this.filtersService.actualizarFiltros({
      estado: 'ACTIVE',
      periodo: 'todos',
      dependencia: 'todos',
      cargo: 'todos'
    });

    console.log('[QuickActionsComponent] Filtros actualizados para mostrar concursos activos');

    // Navegar a la vista de concursos dentro del dashboard
    this.router.navigate(['/dashboard/concursos']);
  }

  navigateToConcursos(): void {
    console.log('[QuickActionsComponent] Navegando a todos los concursos...');

    // Limpiar filtros antes de navegar
    this.filtersService.limpiarFiltros();
    this.router.navigate(['/dashboard/concursos']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/perfil']);
  }
}
