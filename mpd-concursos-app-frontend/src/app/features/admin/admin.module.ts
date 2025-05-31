import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminLayoutModule } from './layout/admin-layout.module';
import { ADMIN_ROUTES } from './admin.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    AdminLayoutModule
  ],
  exports: [
    RouterModule
  ]
})
export class AdminModule { }
