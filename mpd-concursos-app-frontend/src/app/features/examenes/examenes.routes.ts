import { Routes } from '@angular/router';
import { ExamenesComponent } from './examenes.component';
import { ExamenDetalleComponent } from './components/examen-detalle/examen-detalle.component';
import { ExamenRendicionComponent } from './components/examen-rendicion/examen-rendicion.component';

export const EXAMENES_ROUTES: Routes = [
  {
    path: '',
    component: ExamenesComponent
  },
  {
    path: ':id',
    component: ExamenDetalleComponent
  },
  {
    path: ':id/rendir',
    component: ExamenRendicionComponent
  }
];
