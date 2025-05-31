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
    // Verificar si hay inscripciones pendientes al iniciar el dashboard
    setTimeout(() => {
      // Verificar si estamos en la página de concursos con parámetros de continuación
      const urlParams = new URLSearchParams(window.location.search);
      const continueInscription = urlParams.get('continueInscription') === 'true';
      const fromDocumentation = urlParams.get('directContinuation') === 'true';

      // Si estamos continuando una inscripción desde la pestaña de documentación,
      // no mostrar el diálogo de inscripciones pendientes
      if (continueInscription && fromDocumentation) {
        console.log('[DashboardComponent] Detectada continuación desde documentación, omitiendo verificación de inscripciones pendientes');
        return;
      }

      // En caso contrario, verificar normalmente
      this.inscriptionRecoveryService.checkForPendingInscriptions();
    }, 2000); // Retraso para asegurar que la UI esté lista
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
