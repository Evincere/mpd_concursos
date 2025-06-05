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
      height: var(--user-mobile-nav-height);
      /* Glassmorphism premium dark */
      background: var(--user-glass-gradient-primary);
      background-image: var(--user-glass-gradient-overlay);
      border-top: 1px solid var(--user-border-glass);
      backdrop-filter: var(--user-backdrop-blur);
      -webkit-backdrop-filter: var(--user-backdrop-blur);
      box-shadow: var(--user-shadow-md);
      z-index: var(--user-z-mobile-nav);
      justify-content: space-around;
      align-items: center;
      padding: 0 var(--user-spacing-sm);

      @media (max-width: 768px) {
        display: flex;
      }

      a {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--user-text-secondary);
        text-decoration: none;
        flex: 1;
        height: 100%;
        transition: var(--user-transition-normal);
        position: relative;
        padding: var(--user-spacing-sm) 0;
        cursor: pointer;
        border-radius: var(--user-border-radius-md);

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
          color: var(--user-text-primary);
          background: var(--user-glass-light);

          &::after {
            width: 40%;
          }
        }

        &:hover {
          color: var(--user-text-primary);
          background: var(--user-glass-light);
        }

        i {
          font-size: 20px;
          margin-bottom: 4px;
          transition: var(--user-transition-normal);
        }

        span {
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
        }
      }
    }
  `]
})
export class MobileNavComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
