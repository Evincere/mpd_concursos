import { Routes } from '@angular/router';
import { UsuariosAdminComponent } from './usuarios-admin.component';
import { UserStatus } from './domain/models/user.model';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    component: UsuariosAdminComponent
  },
  {
    path: 'active',
    component: UsuariosAdminComponent,
    data: { status: UserStatus.ACTIVE }
  },
  {
    path: 'inactive',
    component: UsuariosAdminComponent,
    data: { status: UserStatus.INACTIVE }
  },
  {
    path: 'blocked',
    component: UsuariosAdminComponent,
    data: { status: UserStatus.BLOCKED }
  }
];
