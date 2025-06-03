import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminLayoutModule } from './layout/admin-layout.module';
import { ADMIN_ROUTES } from './admin.routes';
import { ReportesAdminComponent } from './components/reportes/reportes-admin.component';

@NgModule({
  declarations: [
    ReportesAdminComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(ADMIN_ROUTES),
    AdminLayoutModule
  ],
  exports: [
    RouterModule
  ]
})
export class AdminModule { }
