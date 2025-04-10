import { Routes } from '@angular/router';
import { LoginComponent } from '@features/auth/components/login/login.component';
import { RegisterComponent } from '@features/auth/components/register/register.component';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { MainComponent } from '@features/dashboard/components/main/main.component';
import { PostulacionesComponent } from '@features/postulaciones/postulaciones.component';
import { PerfilComponent } from '@features/perfil/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ConcursosComponent } from '@features/concursos/concursos.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'login' } },
  { path: 'register', component: RegisterComponent, data: { animation: 'register' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: MainComponent },
      { path: 'concursos', component: ConcursosComponent },
      { path: 'postulaciones', component: PostulacionesComponent },
      { path: 'perfil', component: PerfilComponent },
      {
        path: 'examenes',
        loadChildren: () => import('./features/examenes/examenes.routes')
          .then(m => m.EXAMENES_ROUTES)
      },
      {
        path: 'configuracion',
        loadChildren: () => import('./features/admin/admin.routes')
          .then(m => m.ADMIN_ROUTES),
        canActivate: [RoleGuard],
        data: { role: 'ROLE_ADMIN' }
      }
    ]
  },
  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_ADMIN' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: '',
        loadChildren: () => import('./features/admin/admin.routes')
          .then(m => m.ADMIN_ROUTES)
      }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
