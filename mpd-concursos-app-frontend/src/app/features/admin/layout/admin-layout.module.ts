import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminRootLayoutComponent } from './admin-root-layout.component';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminBreadcrumbsComponent } from './components/admin-breadcrumbs/admin-breadcrumbs.component';
import { AdminNotificationsComponent } from './components/admin-notifications/admin-notifications.component';

/**
 * Módulo que exporta los componentes del layout administrativo.
 * Todos los componentes son standalone, por lo que este módulo
 * simplemente los exporta para facilitar su uso en otros módulos.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AdminRootLayoutComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    AdminBreadcrumbsComponent,
    AdminNotificationsComponent
  ],
  exports: [
    AdminRootLayoutComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    AdminBreadcrumbsComponent,
    AdminNotificationsComponent
  ]
})
export class AdminLayoutModule { }
