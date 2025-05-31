import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '@core/services/auth/auth.service';


@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatRippleModule
  ],
  template: `
    <div class="mobile-nav">
      <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" matRipple>
        <mat-icon>home</mat-icon>
        <span>Inicio</span>
      </a>
      <a routerLink="/dashboard/concursos" routerLinkActive="active" matRipple>
        <mat-icon>gavel</mat-icon>
        <span>Concursos</span>
      </a>
      <a routerLink="/dashboard/postulaciones" routerLinkActive="active" matRipple>
        <mat-icon>description</mat-icon>
        <span>Postulaciones</span>
      </a>
      <a routerLink="/dashboard/perfil" routerLinkActive="active" matRipple>
        <mat-icon>person</mat-icon>
        <span>Perfil</span>
      </a>
      <a (click)="logout()" (keydown.enter)="logout()" (keydown.space)="logout()" tabindex="0" role="button" matRipple>
        <mat-icon>exit_to_app</mat-icon>
        <span>Salir</span>
      </a>
    </div>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'responsive' as *;

    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: $color-background;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 0 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      @include md {
        display: flex;
      }

      a {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: $color-text-secondary;
        text-decoration: none;
        flex: 1;
        height: 100%;
        transition: all 0.3s ease;
        position: relative;
        padding: 8px 0;
        cursor: pointer;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 3px;
          background: $color-primary;
          transition: width 0.3s ease;
        }

        &.active {
          color: $color-primary;

          &::after {
            width: 40%;
          }
        }

        mat-icon {
          font-size: 24px;
          height: 24px;
          width: 24px;
          margin-bottom: 4px;
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
