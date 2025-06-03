import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminBreadcrumbsComponent } from './components/admin-breadcrumbs/admin-breadcrumbs.component';

import { GlobalLoaderComponent } from '../../../shared/components/global-loader/global-loader.component';
import { ContentTransitionComponent } from '../../../shared/components/content-transition/content-transition.component';
import { KeyboardShortcutsHelpComponent } from '../../../shared/components/keyboard-shortcuts-help/keyboard-shortcuts-help.component';

/**
 * Componente raíz para el layout administrativo.
 * Este componente reemplaza al DashboardComponent para la sección administrativa,
 * evitando la duplicación de elementos de navegación.
 */
@Component({
  selector: 'app-admin-root-layout',
  templateUrl: './admin-root-layout.component.html',
  styleUrls: ['./admin-root-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgIf,
    NgClass,
    CustomButtonComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    AdminBreadcrumbsComponent,
    GlobalLoaderComponent,
    ContentTransitionComponent,
    KeyboardShortcutsHelpComponent
  ]
})
export class AdminRootLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;

  constructor() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Inicializar el estado del sidebar basado en preferencias guardadas
    const savedState = localStorage.getItem('adminSidebarState');
    if (savedState) {
      this.isSidebarCollapsed = savedState === 'collapsed';
    } else {
      // Por defecto, colapsar en móvil
      this.isSidebarCollapsed = this.isMobile;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;

    // En móvil, siempre colapsar el sidebar
    if (this.isMobile && !this.isSidebarCollapsed) {
      this.isSidebarCollapsed = true;
    }
  }

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;

    // Guardar preferencia del usuario
    localStorage.setItem('adminSidebarState', collapsed ? 'collapsed' : 'expanded');
  }
}
