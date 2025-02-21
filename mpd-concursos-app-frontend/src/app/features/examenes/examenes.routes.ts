import { Routes } from '@angular/router';
import { ExamenesComponent } from './examenes.component';
import { ExamenDetalleComponent } from './components/examen-detalle/examen-detalle.component';
import { ExamenRendicionComponent } from './components/examen-rendicion/examen-rendicion.component';
import { provideExamenFeature } from './providers/examenes.providers';

export const EXAMENES_ROUTES: Routes = [
  {
    path: '',
    component: ExamenesComponent,
    providers: [provideExamenFeature()]
  },
  {
    path: ':id',
    component: ExamenDetalleComponent
  },
  {
    path: ':id/rendir',
    component: ExamenRendicionComponent,
    providers: [
      provideExamenFeature()
    ]
  }
];
