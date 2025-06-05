import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ConcursosComponent } from './concursos.component';

const routes: Routes = [
  {
    path: '',
    component: ConcursosComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ConcursosComponent // Importar el componente standalone
  ]
})
export class ConcursosModule { }
