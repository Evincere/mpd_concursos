import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Componente de contenido para la sección administrativa.
 * Este componente ahora solo contiene el router-outlet para el contenido,
 * ya que el layout completo se ha movido a AdminRootLayoutComponent.
 */
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class AdminLayoutComponent {
  // Este componente ahora es simple y solo contiene el router-outlet
}
