import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { ConfirmationService } from '@shared/services/confirmation.service';
import { LoggingService } from '@core/services/logging/logging.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();
  @Output() sidebarCollapsed = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    public router: Router, // ✅ PÚBLICO para acceso desde template
    private inscriptionStateService: InscriptionStateService,
    private confirmationService: ConfirmationService,
    private loggingService: LoggingService
  ) {
    // Verificar si el usuario es administrador
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
  }

  ngOnInit(): void {
    this.sidebarService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isCollapsed = state;
        this.sidebarCollapsed.emit(state);
      });
  }

  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.authService.logout();
    window.location.href = '/login';
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 23: Validación de navegación desde sidebar
   * Previene navegación accidental durante proceso de inscripción
   */
  async onNavigationClick(event: Event, route: string): Promise<void> {
    event.preventDefault();

    this.loggingService.debug('[Sidebar] Intento de navegación', {
      targetRoute: route,
      currentUrl: this.router.url
    }, 'SidebarComponent');

    // Verificar si hay inscripción en progreso
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    if (incompleteInscriptions.length > 0) {
      this.loggingService.info('[Sidebar] Inscripción en progreso detectada - solicitando confirmación', {
        incompleteCount: incompleteInscriptions.length,
        targetRoute: route
      }, 'SidebarComponent');

      const message = `Tiene ${incompleteInscriptions.length} inscripción(es) en progreso. Si navega ahora, su progreso se guardará automáticamente.`;

      const confirmed = await this.confirmationService.warning(
        '¿Salir del proceso de inscripción?',
        message,
        'Su progreso se guardará automáticamente',
        'Continuar navegación',
        'Permanecer aquí'
      ).toPromise();

      if (!confirmed) {
        this.loggingService.debug('[Sidebar] Usuario canceló navegación', {
          targetRoute: route
        }, 'SidebarComponent');
        return;
      }

      this.loggingService.info('[Sidebar] Usuario confirmó navegación - procediendo', {
        targetRoute: route
      }, 'SidebarComponent');
    }

    // Proceder con la navegación
    this.router.navigate([route]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
