import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppSection, SectionNavigationService } from '@core/services/navigation/section-navigation.service';
import { Subscription } from 'rxjs';

/**
 * Componente que muestra un indicador visual de la sección actual de la aplicación
 */
@Component({
  selector: 'app-section-indicator',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section-indicator" [class.admin-section]="isAdminSection" [class.user-section]="!isAdminSection">
      <div class="indicator-content">
        <i class="fas" [class.fa-user-shield]="isAdminSection" [class.fa-user]="!isAdminSection"></i>
        <span class="section-name">{{ sectionName }}</span>

        <!-- Botón para cambiar de sección -->
        <a *ngIf="isAdminSection"
           class="section-link"
           routerLink="/dashboard">
          <i class="fas fa-arrow-left"></i>
          Volver al área de usuario
        </a>

        <a *ngIf="!isAdminSection && canAccessAdmin"
           class="section-link"
           routerLink="/admin/dashboard">
          <i class="fas fa-user-shield"></i>
          Ir al panel de administración
        </a>
      </div>
    </div>
  `,
  styles: [`
    .section-indicator {
      padding: 0.5rem 1rem;
      border-radius: 0;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
    }

    .admin-section {
      background-color: var(--color-secondary, #424242);
      color: white;
    }

    .user-section {
      background-color: var(--color-primary, #3f51b5);
      color: white;
    }

    .indicator-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      max-width: 1200px;
      width: 100%;
    }

    .section-name {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .section-link {
      margin-left: auto;
      color: white;
      text-decoration: none;
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.15);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section-link:hover {
      background-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .section-name {
        display: none;
      }

      .section-link {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }
  `]
})
export class SectionIndicatorComponent implements OnInit, OnDestroy {


  isAdminSection = false;
  sectionName = 'Área de Usuario';
  canAccessAdmin = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private sectionNavigationService: SectionNavigationService
  ) {}



  ngOnInit(): void {
    // Suscribirse a los cambios de sección
    this.subscription.add(
      this.sectionNavigationService.currentSection$.subscribe((section: string) => {
        this.isAdminSection = section === AppSection.ADMIN;
        this.sectionName = this.isAdminSection ? 'Panel de Administración' : 'Área de Usuario';
      })
    );

    // Verificar si el usuario puede acceder al panel de administración
    this.canAccessAdmin = this.sectionNavigationService.canAccessAdminSection();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
