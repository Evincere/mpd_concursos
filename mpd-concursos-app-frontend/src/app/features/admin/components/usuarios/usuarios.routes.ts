import { Routes } from '@angular/router';
import { UsuariosAdminComponent } from './usuarios-admin.component';
import { UserStatus } from './domain/models/user.model';
import { UserService } from './application/services/user.service';
import { USER_REPOSITORY_TOKEN } from './infrastructure/providers/user-service.provider';
import { OptimizedUserRepositoryAdapter } from './infrastructure/adapters/optimized-user-repository.adapter';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    component: UsuariosAdminComponent,
    providers: [
      // Proporcionar el servicio UserService y sus dependencias
      {
        provide: USER_REPOSITORY_TOKEN,
        useClass: OptimizedUserRepositoryAdapter
      },
      UserService
    ]
  },
  {
    path: 'active',
    component: UsuariosAdminComponent,
    providers: [
      // Proporcionar el servicio UserService y sus dependencias
      {
        provide: USER_REPOSITORY_TOKEN,
        useClass: OptimizedUserRepositoryAdapter
      },
      UserService
    ],
    data: { status: UserStatus.ACTIVE }
  },
  {
    path: 'inactive',
    component: UsuariosAdminComponent,
    providers: [
      // Proporcionar el servicio UserService y sus dependencias
      {
        provide: USER_REPOSITORY_TOKEN,
        useClass: OptimizedUserRepositoryAdapter
      },
      UserService
    ],
    data: { status: UserStatus.INACTIVE }
  },
  {
    path: 'blocked',
    component: UsuariosAdminComponent,
    providers: [
      // Proporcionar el servicio UserService y sus dependencias
      {
        provide: USER_REPOSITORY_TOKEN,
        useClass: OptimizedUserRepositoryAdapter
      },
      UserService
    ],
    data: { status: UserStatus.BLOCKED }
  }
];
