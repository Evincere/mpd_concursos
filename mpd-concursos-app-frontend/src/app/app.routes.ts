import { Routes } from '@angular/router';
import { LoginComponent } from '@features/auth/components/login/login.component';
import { RegisterComponent } from '@features/auth/components/register/register.component';
import { DashboardComponent } from '@features/dashboard/components/dashboard.component';
import { MainComponent } from '@features/dashboard/components/main/main.component';
import { PostulacionesComponent } from '@features/postulaciones/postulaciones.component';
import { PerfilComponent } from '@features/perfil/components/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ConcursosComponent } from '@features/concursos/concursos.component';
import { PostulacionDetallePaginaComponent } from '@features/postulaciones/postulacion-detalle-pagina/postulacion-detalle-pagina.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'login' } },
  { path: 'register', component: RegisterComponent, data: { animation: 'register' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_USER' },
    children: [
      { path: '', component: MainComponent },
      { path: 'concursos', component: ConcursosComponent },
      { path: 'postulaciones', component: PostulacionesComponent },
      { path: 'perfil', component: PerfilComponent }
    ]
  },
  // Ruta global para postulaciones
  { path: 'postulaciones/:id', component: PostulacionDetallePaginaComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
