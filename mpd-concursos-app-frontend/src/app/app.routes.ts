import { Routes } from '@angular/router';
import { LoginComponent } from '@features/auth/components/login/login.component';
import { RegisterComponent } from '@features/auth/components/register/register.component';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { MainComponent } from '@features/dashboard/components/main/main.component';
import { PerfilComponent } from '@features/perfil/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { FeedbackExamplesComponent } from '@features/examples/feedback-examples/feedback-examples.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'login' } },
  { path: 'register', component: RegisterComponent, data: { animation: 'register' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: MainComponent },
      {
        path: 'concursos',
        loadChildren: () => import('./features/concursos/concursos.module')
          .then(m => m.ConcursosModule)
      },
      {
        path: 'postulaciones',
        loadChildren: () => import('./features/postulaciones/postulaciones.module')
          .then(m => m.PostulacionesModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('./features/perfil/perfil.module')
          .then(m => m.PerfilModule)
      },
      {
        path: 'examples',
        loadChildren: () => import('./features/examples/examples.module')
          .then(m => m.ExamplesModule)
      },
      {
        path: 'examenes',
        loadChildren: () => import('./features/examenes/examenes.routes')
          .then(m => m.EXAMENES_ROUTES)
      },
      {
        path: 'inscripcion',
        loadChildren: () => import('./features/concursos/components/inscripcion/routes')
          .then(m => m.INSCRIPCION_ROUTES)
      },
      {
        path: 'configuracion',
        loadChildren: () => import('./features/configuracion/configuracion.module')
          .then(m => m.ConfiguracionModule)
      },
      {
        path: 'ayuda',
        loadChildren: () => import('./features/ayuda/ayuda.module')
          .then(m => m.AyudaModule)
      },

    ]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module')
      .then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
