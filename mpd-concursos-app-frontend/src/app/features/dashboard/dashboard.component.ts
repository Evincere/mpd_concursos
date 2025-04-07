import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeaderComponent } from './components/header/header.component';
import { MainComponent } from './components/main/main.component';
import { RouterOutlet } from '@angular/router';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    NavbarComponent,
    HeaderComponent,
    MainComponent,
    RouterOutlet
  ]
})
export class DashboardComponent implements OnInit {
  isSidebarCollapsed = false;

  constructor(private inscriptionRecoveryService: InscriptionRecoveryService) {}

  ngOnInit(): void {
    // Verificar si hay inscripciones pendientes al iniciar el dashboard
    setTimeout(() => {
      this.inscriptionRecoveryService.checkForPendingInscriptions();
    }, 2000); // Retraso para asegurar que la UI esté lista
  }

  onSidebarCollapse(collapsed: boolean) {
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
