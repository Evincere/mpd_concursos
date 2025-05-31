import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Componentes
import { ConcursosAdminComponent } from './concursos-admin.component';
import { ConcursosDashboardComponent } from './components/concursos-dashboard/concursos-dashboard.component';
import { ConcursoFechasDashboardComponent } from './components/concurso-fechas-dashboard/concurso-fechas-dashboard.component';
import { ConcursoCalendarioComponent } from './components/concurso-calendario/concurso-calendario.component';

// Componentes compartidos
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomMenuComponent } from '@shared/components/custom-form/custom-menu/custom-menu.component';
import { CustomMenuItemComponent } from '@shared/components/custom-form/custom-menu/custom-menu-item.component';

// Servicios
import { NotificationService } from '@shared/services/notification.service';


const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: ConcursosDashboardComponent },
  { path: 'listado', component: ConcursosAdminComponent }, // Usar el componente principal con diseño refactorizado
  {
    path: 'nuevo',
    loadComponent: () => import('./components/concurso-form-page/concurso-form-page.component')
      .then(m => m.ConcursoFormPageComponent)
  },
  {
    path: 'detalle/:id',
    loadComponent: () => import('./components/concurso-detalle/concurso-detalle-admin.component')
      .then(m => m.ConcursoDetalleAdminComponent)
  },
  { path: 'fechas/:id', component: ConcursoFechasDashboardComponent },
  {
    path: 'fechas-importantes',
    loadComponent: () => import('./components/fechas-importantes-admin/fechas-importantes-admin.component')
      .then(m => m.FechasImportantesAdminComponent)
  },
  { path: 'calendario', component: ConcursoCalendarioComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    NotificationService
  ]
})
export class ConcursosModule { }
