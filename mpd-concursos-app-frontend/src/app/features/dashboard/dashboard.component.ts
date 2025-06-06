import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeaderComponent } from './components/header/header.component';
import { MainComponent } from './components/main/main.component';
import { MobileNavComponent } from './components/mobile-nav/mobile-nav.component';
import { RouterOutlet } from '@angular/router';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';
import { SectionIndicatorComponent } from '../../shared/components/section-indicator/section-indicator.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss', './components/dashboard-fix.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    NavbarComponent,
    HeaderComponent,
    MainComponent,
    MobileNavComponent,
    RouterOutlet,
    SectionIndicatorComponent
  ]
})
export class DashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;

  constructor(private inscriptionRecoveryService: InscriptionRecoveryService) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: Event): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    }
  }

  ngOnInit(): void {
    // CORRECCIÓN: No mostrar automáticamente el modal de continuación de inscripción
    // El usuario debe decidir cuándo retomar una inscripción desde "Mis Postulaciones"
    // Solo mostrar en casos específicos como desconexión o errores de red

    // Verificar si hay parámetros específicos que indiquen una recuperación por desconexión
    const urlParams = new URLSearchParams(window.location.search);
    const recoveryMode = urlParams.get('recoveryMode') === 'true';
    const fromDisconnection = urlParams.get('fromDisconnection') === 'true';

    if (recoveryMode && fromDisconnection) {
      console.log('[DashboardComponent] Modo de recuperación por desconexión detectado');
      setTimeout(() => {
        this.inscriptionRecoveryService.checkForPendingInscriptions();
      }, 2000);
    } else {
      console.log('[DashboardComponent] Omitiendo verificación automática de inscripciones pendientes');
    }
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
    const mainContent = document.querySelector('router-outlet + *');
    if (mainContent) {
      if (collapsed) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
  }
}
