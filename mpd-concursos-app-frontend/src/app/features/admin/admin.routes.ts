import { Routes } from '@angular/router';
import { AdminRootLayoutComponent } from './layout/admin-root-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

// Componentes cargados directamente
import { ReportesAdminComponent } from './components/reportes/reportes-admin.component';
import { ConfiguracionAdminComponent } from './components/configuracion/configuracion-admin.component';
import { ExamenesAdminComponent } from './components/examenes/examenes-admin.component';
import { PreguntasAdminComponent } from './components/preguntas/preguntas-admin.component';
import { DocumentosAdminComponent } from './components/documentos/documentos-admin.component';
import { ComunicacionesAdminComponent } from './components/comunicaciones/comunicaciones-admin.component';

import { RolesAdminComponent } from './components/roles/roles-admin.component';
import { ActivityDashboardComponent } from './components/activity/activity-dashboard.component';
import { ProfilesAdminComponent } from './components/profiles/profiles-admin.component';
import { ReportBuilderComponent } from './components/reportes/components/report-builder/report-builder.component';
import { UserBehaviorAnalysisComponent } from './components/user-behavior/user-behavior-analysis.component';
import { SystemMonitoringComponent } from './components/system-monitoring/system-monitoring.component';
import { AdminHelpCenterComponent } from './components/help-center/admin-help-center.component';
import { AdminGuard } from '../../guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminRootLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'users',
        loadChildren: () => import('./components/usuarios/usuarios.routes')
          .then(m => {
            // Evitar referencia circular accediendo a las rutas después de la carga
            return m.USUARIOS_ROUTES;
          })
      },
      {
        path: 'usuarios',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      { path: 'documentos', component: DocumentosAdminComponent },
      // Rutas para reportes
      {
        path: 'reportes',
        children: [
          { path: '', component: ReportesAdminComponent },
          { path: 'dashboard', component: ReportesAdminComponent },
          { path: 'constructor', component: ReportBuilderComponent }
        ]
      },
      { path: 'configuracion', component: ConfiguracionAdminComponent },
      { path: 'examenes', component: ExamenesAdminComponent },
      { path: 'preguntas', component: PreguntasAdminComponent },
      // Rutas para comunicaciones
      {
        path: 'comunicaciones',
        children: [
          { path: '', redirectTo: 'mensajes', pathMatch: 'full' },
          { path: 'mensajes', component: ComunicacionesAdminComponent, data: { activeTab: 'mensajes' } },
          { path: 'plantillas', component: ComunicacionesAdminComponent, data: { activeTab: 'plantillas' } },
          { path: 'historial', component: ComunicacionesAdminComponent, data: { activeTab: 'historial' } },
          { path: 'estadisticas', component: ComunicacionesAdminComponent, data: { activeTab: 'estadisticas' } },
          { path: 'notificaciones', component: ComunicacionesAdminComponent, data: { activeTab: 'notificaciones' } }
        ]
      },
      // Rutas para concursos
      {
        path: 'concursos',
        loadChildren: () => import('./components/concursos/concursos.module').then(m => m.ConcursosModule)
      },
      // Rutas para inscripciones
      {
        path: 'inscripciones',
        loadChildren: () => import('./components/inscripciones/inscripciones.module').then(m => m.InscripcionesModule)
      },

      // Rutas para roles
      {
        path: 'roles',
        children: [
          { path: '', component: RolesAdminComponent },
          { path: 'sistema', component: RolesAdminComponent, data: { filter: { isSystem: true } } },
          { path: 'personalizados', component: RolesAdminComponent, data: { filter: { isSystem: false } } }
        ]
      },

      // Rutas para actividad
      {
        path: 'actividad',
        children: [
          { path: '', component: ActivityDashboardComponent },
          { path: 'login', component: ActivityDashboardComponent, data: { filter: { action: 'LOGIN' } } },
          { path: 'usuarios', component: ActivityDashboardComponent, data: { filter: { module: 'USERS' } } },
          { path: 'concursos', component: ActivityDashboardComponent, data: { filter: { module: 'CONTESTS' } } },
          { path: 'inscripciones', component: ActivityDashboardComponent, data: { filter: { module: 'INSCRIPTIONS' } } }
        ]
      },

      // Rutas para análisis de comportamiento
      {
        path: 'comportamiento',
        children: [
          { path: '', component: UserBehaviorAnalysisComponent },
          { path: 'inscripciones', component: UserBehaviorAnalysisComponent, data: { activeTab: 0 } },
          { path: 'abandonos', component: UserBehaviorAnalysisComponent, data: { activeTab: 1 } },
          { path: 'tiempos', component: UserBehaviorAnalysisComponent, data: { activeTab: 2 } },
          { path: 'funcionalidades', component: UserBehaviorAnalysisComponent, data: { activeTab: 3 } },
          { path: 'segmentos', component: UserBehaviorAnalysisComponent, data: { activeTab: 4 } }
        ]
      },

      // Rutas para sistema (monitoreo, auditoría, backups)
      {
        path: 'sistema',
        children: [
          // Rutas para monitoreo del sistema
          {
            path: 'monitoreo',
            children: [
              { path: '', component: SystemMonitoringComponent },
              { path: 'rendimiento', component: SystemMonitoringComponent, data: { activeTab: 0 } },
              { path: 'base-datos', component: SystemMonitoringComponent, data: { activeTab: 1 } },
              { path: 'alertas', component: SystemMonitoringComponent, data: { activeTab: 2 } },
              { path: 'configuracion', component: SystemMonitoringComponent, data: { activeTab: 3 } }
            ]
          },
          // Rutas para auditoría del sistema
          {
            path: 'auditoria',
            children: [
              { path: '', component: SystemMonitoringComponent, data: { mode: 'audit' } },
              { path: 'usuarios', component: SystemMonitoringComponent, data: { mode: 'audit', filter: 'users' } },
              { path: 'sistema', component: SystemMonitoringComponent, data: { mode: 'audit', filter: 'system' } },
              { path: 'seguridad', component: SystemMonitoringComponent, data: { mode: 'audit', filter: 'security' } }
            ]
          },
          // Rutas para copias de seguridad
          {
            path: 'backups',
            children: [
              { path: '', component: SystemMonitoringComponent, data: { mode: 'backup' } },
              { path: 'automaticos', component: SystemMonitoringComponent, data: { mode: 'backup', filter: 'auto' } },
              { path: 'manuales', component: SystemMonitoringComponent, data: { mode: 'backup', filter: 'manual' } },
              { path: 'configuracion', component: SystemMonitoringComponent, data: { mode: 'backup', filter: 'config' } }
            ]
          }
        ]
      },

      // Ruta de compatibilidad para monitoreo directo
      {
        path: 'monitoreo',
        redirectTo: 'sistema/monitoreo',
        pathMatch: 'full'
      },

      // Rutas para perfiles
      {
        path: 'perfiles',
        children: [
          { path: '', component: ProfilesAdminComponent },
          { path: 'activos', component: ProfilesAdminComponent, data: { filter: { status: 'ACTIVE' } } },
          { path: 'inactivos', component: ProfilesAdminComponent, data: { filter: { status: 'INACTIVE' } } },
          { path: 'bloqueados', component: ProfilesAdminComponent, data: { filter: { status: 'BLOCKED' } } },
          { path: 'completos', component: ProfilesAdminComponent, data: { filter: { hasDocuments: true, hasProfessionalInfo: true } } },
          { path: 'incompletos', component: ProfilesAdminComponent, data: { filter: { hasDocuments: false } } }
        ]
      },

      // Rutas para el centro de ayuda
      {
        path: 'ayuda',
        children: [
          { path: '', component: AdminHelpCenterComponent },
          { path: 'categoria/:id', component: AdminHelpCenterComponent, data: { activeTab: 1 } },
          { path: 'articulo/:id', component: AdminHelpCenterComponent },
          { path: 'tutorial/:id', component: AdminHelpCenterComponent, data: { activeTab: 2 } },
          { path: 'buscar', component: AdminHelpCenterComponent, data: { showSearch: true } }
        ]
      }
    ]
  }
];
