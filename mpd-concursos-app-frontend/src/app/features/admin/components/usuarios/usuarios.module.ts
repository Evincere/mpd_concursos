import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Componentes personalizados
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';

// Componentes del módulo
import { UsuariosAdminComponent } from './usuarios-admin.component';
import { UsuarioFiltrosComponent } from './usuario-filtros/usuario-filtros.component';
import { UsuarioDetalleComponent } from './usuario-detalle/usuario-detalle.component';
import { CrearUsuarioDialogComponent } from './crear-usuario-dialog/crear-usuario-dialog.component';
// Nota: EditarUsuarioDialogComponent se importa dinámicamente en usuarios-admin.component.ts

// Servicios y proveedores
import { USER_REPOSITORY_TOKEN } from './infrastructure/providers/user-service.provider';
import { OptimizedUserRepositoryAdapter } from './infrastructure/adapters/optimized-user-repository.adapter';
import { UserService } from './application/services/user.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule,
    // Importar los componentes standalone
    UsuariosAdminComponent,
    UsuarioFiltrosComponent,
    UsuarioDetalleComponent,
    CrearUsuarioDialogComponent
  ],
  providers: [
    // Proporcionar el repositorio de usuarios
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: OptimizedUserRepositoryAdapter
    },
    UserService
  ],
  exports: [
    UsuariosAdminComponent
  ]
})
export class UsuariosModule {
  // Exponer los proveedores para que puedan ser utilizados en las rutas
  static get providers() {
    return [
      {
        provide: USER_REPOSITORY_TOKEN,
        useClass: OptimizedUserRepositoryAdapter
      },
      UserService
    ];
  }
}
