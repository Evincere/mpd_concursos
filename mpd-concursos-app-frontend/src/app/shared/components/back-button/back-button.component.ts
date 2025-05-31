import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { NavigationButtonComponent } from '../navigation-button/navigation-button.component';

/**
 * Componente para botones de "Volver" con funcionalidad de navegación.
 * Utiliza el servicio NavigationService para navegar hacia atrás en el historial.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavigationButtonComponent
  ],
  template: `
    <div class="back-button-container navigation-back">
      <app-navigation-button
        [label]="label"
        [icon]="icon"
        [color]="color"
        [variant]="variant"
        [disabled]="disabled"
        [tooltip]="tooltip || 'Volver a la página anterior'"
        [direction]="'back'"
        (buttonClick)="goBack()">
      </app-navigation-button>
    </div>
  `,
  styles: [`
    .back-button-container {
      margin-bottom: 1rem;
    }
  `]
})
export class BackButtonComponent implements OnInit {
  @Input() label = 'Volver';
  @Input() icon = 'arrow-left';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' | 'danger' = 'primary';
  @Input() variant: 'flat' | 'text' | 'stroked' | 'icon' = 'stroked';
  @Input() fallbackUrl = '';
  @Input() tooltip = '';
  
  disabled = false;
  
  constructor(
    private navigationService: NavigationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Deshabilitar el botón si no hay historial y no hay URL de respaldo
    this.disabled = !this.navigationService.canGoBack() && !this.fallbackUrl;
  }
  
  /**
   * Navega hacia atrás en el historial o a la URL de respaldo si no hay historial
   */
  goBack(): void {
    if (this.navigationService.canGoBack()) {
      this.navigationService.goBack();
    } else if (this.fallbackUrl) {
      this.router.navigateByUrl(this.fallbackUrl);
    }
  }
}
