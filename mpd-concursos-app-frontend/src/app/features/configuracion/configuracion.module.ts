import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ConfiguracionEnDesarrolloComponent } from './components/configuracion-en-desarrollo/configuracion-en-desarrollo.component';

const routes: Routes = [
  {
    path: '',
    component: ConfiguracionEnDesarrolloComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ConfiguracionEnDesarrolloComponent
  ]
})
export class ConfiguracionModule { }
