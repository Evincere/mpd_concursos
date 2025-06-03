import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '@core/services/auth/auth.service';
import { isArray, safeArrayMethod, safeGet } from '@shared/utils/safe-access.utils';
import { SectionNavigationService } from '@core/services/navigation/section-navigation.service';
import { AdminNotificationsComponent } from '../admin-notifications/admin-notifications.component';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  keyframes
} from '@angular/animations';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomMenuComponent } from '@shared/components/custom-form/custom-menu/custom-menu.component';
import { CustomMenuItemComponent } from '@shared/components/custom-form/custom-menu/custom-menu-item.component';
import { CustomMenuTriggerDirective } from '@shared/components/custom-form/custom-menu/custom-menu-trigger.directive';
import { CustomDividerComponent } from '@shared/components/custom-form/custom-divider/custom-divider.component';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminNotificationsComponent,
    CustomButtonComponent,
    CustomMenuComponent,
    CustomMenuItemComponent,
    CustomMenuTriggerDirective,
    CustomDividerComponent
  ],
  animations: [
    trigger('pulseAnimation', [
      state('active', style({
        transform: 'scale(1)'
      })),
      transition('* => active', [
        animate('2s ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.1 }),
          style({ transform: 'scale(1)', offset: 0.2 }),
          style({ transform: 'scale(1)', offset: 0.5 }),
          style({ transform: 'scale(1.05)', offset: 0.6 }),
          style({ transform: 'scale(1)', offset: 0.7 }),
          style({ transform: 'scale(1)', offset: 1.0 })
        ]))
      ])
    ])
  ]
})
export class AdminHeaderComponent implements OnInit {
  @Input() isSidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();

  userName = '';
  userRole = '';
  userInitials = '';
  unreadNotifications = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sectionNavigationService: SectionNavigationService
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario actual desde el token
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode(token) as Record<string, unknown>;

        // Obtener nombre de usuario
        const username = safeGet(decodedToken, 'sub', '') as string;
        this.userName = username;

        // Verificar si el usuario tiene rol de administrador
        const authorities = safeGet(decodedToken, 'authorities', []) as any[];
        const hasAdminRole = isArray(authorities)
          ? safeArrayMethod(authorities, 'some', [(auth: any) =>
              typeof auth === 'object' && auth !== null && safeGet(auth, 'authority') === 'ROLE_ADMIN'
            ], false) as boolean
          : false;
        this.userRole = hasAdminRole ? 'Administrador' : 'Usuario';

        // Generar iniciales
        this.userInitials = this.getInitials(this.userName);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }

    // Simular notificaciones no leídas (en una implementación real, esto vendría de un servicio)
    this.unreadNotifications = 5;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.isSidebarCollapsed);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
