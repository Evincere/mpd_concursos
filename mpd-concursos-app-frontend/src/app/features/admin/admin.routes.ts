import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UsuariosAdminComponent } from './components/usuarios/usuarios-admin.component';
import { ReportesAdminComponent } from './components/reportes/reportes-admin.component';
import { ConfiguracionAdminComponent } from './components/configuracion/configuracion-admin.component';
import { ExamenesAdminComponent } from './components/examenes/examenes-admin.component';
import { PreguntasAdminComponent } from './components/preguntas/preguntas-admin.component';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'usuarios', component: UsuariosAdminComponent },
  { path: 'reportes', component: ReportesAdminComponent },
  { path: 'configuracion', component: ConfiguracionAdminComponent },
  { path: 'examenes', component: ExamenesAdminComponent },
  { path: 'preguntas', component: PreguntasAdminComponent }
];
