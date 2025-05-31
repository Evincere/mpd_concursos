import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PostulacionesComponent } from './postulaciones.component';

const routes: Routes = [
  {
    path: '',
    component: PostulacionesComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PostulacionesModule { }
