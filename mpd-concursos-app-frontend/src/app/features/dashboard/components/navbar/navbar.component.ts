import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from './user-info/user-info.component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications.component';
import { SectionNavigationService } from '../../../../core/services/navigation/section-navigation.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, UserInfoComponent, NotificationsComponent],
  animations: [
    trigger('logoRotate', [
      state('start', style({
        transform: 'rotate(0deg)'
      })),
      state('end', style({
        transform: 'rotate(360deg)'
      })),
      transition('start => end', [
        animate('2.5s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit {
  @Input() isSidebarCollapsed = false;
  logoState = 'start';
  isAdmin = false;
  private readonly fallbackLogoUrl = 'assets/images/mpd-logo.png';

  constructor(
    private authService: AuthService,
    private router: Router,
    private sectionNavigationService: SectionNavigationService
  ) {
    // Verificar si el usuario es administrador
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.logoState = 'end';
    }, 100);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navega al panel de administración
   */
  goToAdminPanel(): void {
    this.sectionNavigationService.navigateToAdminSection();
  }

  onLogoError(event: Event): void {
    console.log('Error al cargar el logo, intentando con fallback');
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.fallbackLogoUrl;
    // Si también falla el fallback, mostrar un texto
    imgElement.onerror = () => {
      console.log('Error al cargar el logo fallback');
      const container = imgElement.parentElement;
      if (container) {
        container.innerHTML = '<span class="logo-text">MPD</span>';
      }
    };
  }
}
