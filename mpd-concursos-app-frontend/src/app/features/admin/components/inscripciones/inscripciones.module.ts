import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Componentes
import { InscripcionesAdminComponent } from './inscripciones-admin.component';
import { InscripcionesDashboardComponent } from './components/inscripciones-dashboard/inscripciones-dashboard.component';

import { InscripcionesTrackingComponent } from './components/inscripciones-tracking/inscripciones-tracking.component';

import { InscripcionesLifecycleComponent } from './components/inscripciones-lifecycle/inscripciones-lifecycle.component';

// Componentes compartidos
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';

// Servicios
import { NotificationService } from '@shared/services/notification.service';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: InscripcionesDashboardComponent },
  { path: 'listado', component: InscripcionesAdminComponent },
  { path: 'pendientes', component: InscripcionesAdminComponent, data: { filter: { status: 'PENDING' } } },
  { path: 'aprobadas', component: InscripcionesAdminComponent, data: { filter: { status: 'APPROVED' } } },
  { path: 'rechazadas', component: InscripcionesAdminComponent, data: { filter: { status: 'REJECTED' } } },
  {
    path: 'documentos',
    loadComponent: () => import('./components/documents-manager/documents-manager.component').then(m => m.DocumentsManagerComponent)
  },
  { path: 'seguimiento', component: InscripcionesTrackingComponent },
  { path: 'ciclo-vida', component: InscripcionesLifecycleComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    // Componentes standalone
    InscripcionesAdminComponent,
    InscripcionesDashboardComponent,
    InscripcionesTrackingComponent,
    InscripcionesLifecycleComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomTableComponent,
    CustomTableColumnComponent,
    ValidationErrorComponent
  ],
  providers: [
    NotificationService
  ]
})
export class InscripcionesModule { }
