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
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ConcursosModule { }
