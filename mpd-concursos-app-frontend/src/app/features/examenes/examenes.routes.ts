import { Routes } from '@angular/router';
import { ExamenesComponent } from './examenes.component';
import { ExamenDetalleComponent } from './components/examen-detalle/examen-detalle.component';
import { ExamenRendicionComponent } from './components/examen-rendicion/examen-rendicion.component';
import { provideExamenFeature } from './providers/examenes.providers';
import { ExamNavigationGuard } from '@core/services/examenes/security/guards/exam-navigation.guard';
import { SECURITY_PROVIDERS } from './providers/security.providers';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';

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
    canDeactivate: [ExamNavigationGuard],
    providers: [
      provideExamenFeature(),
      SECURITY_PROVIDERS,
      ExamenSecurityService,
      ExamenTimeService,
      ExamenNotificationService,
      ExamNavigationGuard
    ]
  }
];
