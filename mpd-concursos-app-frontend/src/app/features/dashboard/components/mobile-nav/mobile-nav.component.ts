import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';


@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="mobile-nav">
      <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <i class="fas fa-home" aria-hidden="true"></i>
        <span>Inicio</span>
      </a>
      <a routerLink="/dashboard/concursos" routerLinkActive="active">
        <i class="fas fa-gavel" aria-hidden="true"></i>
        <span>Concursos</span>
      </a>
      <a routerLink="/dashboard/postulaciones" routerLinkActive="active">
        <i class="fas fa-file-alt" aria-hidden="true"></i>
        <span>Postulaciones</span>
      </a>
      <a routerLink="/dashboard/perfil" routerLinkActive="active">
        <i class="fas fa-user" aria-hidden="true"></i>
        <span>Perfil</span>
      </a>
      <a (click)="logout()" (keydown.enter)="logout()" (keydown.space)="logout()" tabindex="0" role="button">
        <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
        <span>Salir</span>
      </a>
    </div>
  `,
  styles: [`
    /* ===== MOBILE NAV GLASSMORPHISM - USUARIO COMÚN ===== */
    /* Mobile navigation con glassmorphism premium dark */

    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--user-mobile-nav-height, 70px);
      /* Glassmorphism optimizado para móvil */
      background: var(--user-glass-gradient-primary, rgba(55, 65, 81, 0.95));
      background-image: var(--user-glass-gradient-overlay);
      border-top: 1px solid var(--user-border-glass, rgba(255, 255, 255, 0.2));
      backdrop-filter: var(--user-backdrop-blur, blur(8px));
      -webkit-backdrop-filter: var(--user-backdrop-blur, blur(8px));
      box-shadow: var(--user-shadow-md, 0 -4px 16px rgba(0, 0, 0, 0.3));
      z-index: var(--user-z-mobile-nav, 1000);
      justify-content: space-around;
      align-items: center;
      padding: 0 var(--user-spacing-sm, 8px);
      /* Optimizaciones para rendimiento móvil */
      will-change: transform;
      contain: layout style paint;
      /* Soporte para safe area en dispositivos con notch */
      padding-bottom: env(safe-area-inset-bottom);

      @media (max-width: 768px) {
        display: flex;
      }

      /* Reducir blur en dispositivos de baja potencia */
      @media (max-width: 480px) {
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      a {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--user-text-secondary, rgba(255, 255, 255, 0.7));
        text-decoration: none;
        flex: 1;
        height: 100%;
        min-height: 44px; /* Ensure adequate touch target */
        transition: var(--user-transition-normal, all 0.3s ease);
        position: relative;
        padding: var(--user-spacing-sm, 8px) 0;
        cursor: pointer;
        border-radius: var(--user-border-radius-md, 8px);
        /* Optimizaciones para touch */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        /* Mejorar área de toque */
        margin: 0 2px;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 3px;
          background: var(--user-text-accent);
          transition: width var(--user-transition-normal);
          border-radius: 2px 2px 0 0;
        }

        &.active {
          color: var(--user-text-primary, #f9fafb);
          background: var(--user-glass-light, rgba(255, 255, 255, 0.1));
          transform: translateY(-1px);

          &::after {
            width: 40%;
          }

          i {
            transform: scale(1.1);
            color: var(--user-text-accent, #3b82f6);
          }
        }

        &:hover:not(.active) {
          color: var(--user-text-primary, #f9fafb);
          background: var(--user-glass-light, rgba(255, 255, 255, 0.05));
          transform: translateY(-1px);
        }

        /* Estados de focus para accesibilidad */
        &:focus {
          outline: 2px solid var(--user-text-accent, #3b82f6);
          outline-offset: 2px;
        }

        i {
          font-size: clamp(18px, 4vw, 22px); /* Responsive icon size */
          margin-bottom: 4px;
          transition: var(--user-transition-normal, all 0.3s ease);
        }

        span {
          font-size: clamp(9px, 2.5vw, 11px); /* Responsive text size */
          font-weight: 500;
          white-space: nowrap;
          line-height: 1.2;
        }
      }
    }
  `]
})
export class MobileNavComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.logoutWrapper();
    window.location.href = '/login';
  }

  private logoutWrapper(): void {
    // TODO: Usar this.authService.logout cuando TypeScript lo reconozca
    (this.authService as any).logout();
  }
}
