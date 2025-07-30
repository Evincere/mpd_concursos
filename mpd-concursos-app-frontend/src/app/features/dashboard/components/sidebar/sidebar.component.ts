import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { ConfirmationService } from '@shared/services/confirmation.service';
import { LoggingService } from '@core/services/logging/logging.service';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
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
   * 🔧 CORRECCIÓN: Solo mostrar confirmación cuando realmente hay inscripción activa
   */
  async onNavigationClick(event: Event, route: string): Promise<void> {
    event.preventDefault();

    this.loggingService.debug('[Sidebar] Intento de navegación', {
      targetRoute: route,
      currentUrl: this.router.url
    }, 'SidebarComponent');

    // ✅ CORRECCIÓN: Solo verificar si estamos actualmente en una página de inscripción
    const isCurrentlyInInscriptionProcess = this.router.url.includes('/dashboard/inscripcion');

    if (!isCurrentlyInInscriptionProcess) {
      this.loggingService.debug('[Sidebar] No hay proceso de inscripción activo - navegación directa', {
        targetRoute: route,
        currentUrl: this.router.url
      }, 'SidebarComponent');

      // Proceder directamente con la navegación
      this.router.navigate([route]);
      return;
    }

    // ✅ Solo si estamos en proceso de inscripción, verificar inscripciones incompletas
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    // ✅ CORRECCIÓN: Filtrar solo inscripciones realmente activas (con pasos > 1)
    const activeInscriptions = incompleteInscriptions.filter(inscription =>
      inscription.currentStep &&
      inscription.currentStep !== InscriptionStep.INITIAL &&
      inscription.inscriptionId &&
      inscription.inscriptionId.trim() !== ''
    );

    if (activeInscriptions.length > 0) {
      this.loggingService.info('[Sidebar] Inscripción activa detectada - solicitando confirmación', {
        activeCount: activeInscriptions.length,
        targetRoute: route,
        inscriptions: activeInscriptions.map(i => ({
          id: i.inscriptionId,
          step: i.currentStep,
          contestId: i.contestId
        }))
      }, 'SidebarComponent');

      const message = `Tiene ${activeInscriptions.length} inscripción(es) en progreso. Si navega ahora, su progreso se guardará automáticamente.`;

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
    } else {
      this.loggingService.debug('[Sidebar] No hay inscripciones activas reales - navegación directa', {
        targetRoute: route,
        incompleteCount: incompleteInscriptions.length,
        activeCount: activeInscriptions.length
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
