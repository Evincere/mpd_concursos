import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostulacionesComponent } from './postulaciones.component';

const routes: Routes = [
  {
    path: '',
    component: PostulacionesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostulacionesModule { }
