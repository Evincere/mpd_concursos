import { Routes } from '@angular/router';
import { InscripcionProcessPageComponent } from './pages/inscripcion-process-page/inscripcion-process-page.component';
import { AuthGuard } from '../../../../guards/auth.guard';
import { InscriptionDeactivateGuard } from './guards/inscription-deactivate.guard';

export const INSCRIPCION_ROUTES: Routes = [
  {
    path: '',
    component: InscripcionProcessPageComponent,
    canActivate: [AuthGuard],
    canDeactivate: [InscriptionDeactivateGuard] // ✅ SOLUCIÓN PROBLEMA 17: Guard de navegación
  }
];
