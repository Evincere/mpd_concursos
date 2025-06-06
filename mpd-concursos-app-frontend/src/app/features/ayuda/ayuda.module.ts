import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AyudaEnDesarrolloComponent } from './components/ayuda-en-desarrollo/ayuda-en-desarrollo.component';

const routes: Routes = [
  {
    path: '',
    component: AyudaEnDesarrolloComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AyudaEnDesarrolloComponent
  ]
})
export class AyudaModule { }
