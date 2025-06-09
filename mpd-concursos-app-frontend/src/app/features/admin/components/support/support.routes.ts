import { Routes } from '@angular/router';

/**
 * Rutas del módulo de soporte
 */
export const SUPPORT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./support-dashboard/support-dashboard.component')
      .then(m => m.SupportDashboardComponent),
    data: {
      title: 'Dashboard de Soporte',
      breadcrumb: 'Dashboard'
    }
  },
  {
    path: 'tickets',
    children: [
      {
        path: '',
        loadComponent: () => import('./ticket-list/ticket-list.component')
          .then(m => m.TicketListComponent),
        data: {
          title: 'Lista de Tickets',
          breadcrumb: 'Tickets'
        }
      },
      {
        path: ':id',
        loadComponent: () => import('./ticket-detail/ticket-detail.component')
          .then(m => m.TicketDetailComponent),
        data: {
          title: 'Detalle de Ticket',
          breadcrumb: 'Detalle'
        }
      }
    ]
  },

];

/**
 * Configuración de rutas principales del módulo de soporte
 */
export const supportRoutes: Routes = [
  {
    path: '',
    children: SUPPORT_ROUTES
  }
];
