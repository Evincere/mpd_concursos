import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from  '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminInscriptionsService } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { AdminConcursosService } from '../../../../../../core/services/admin/admin-concursos.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { FilterPipe, FirstPipe, PropertyPipe } from '@shared/pipes/filter.pipe';
import { CustomButtonComponent } from 'src/app/shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from 'src/app/shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from 'src/app/shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomCheckboxComponent } from 'src/app/shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { CustomSpinnerComponent } from 'src/app/shared/components/custom-spinner/custom-spinner.component';
import { CustomTableComponent } from 'src/app/shared/components/custom-form/custom-table/custom-table.component';
import { CustomSelectComponent } from 'src/app/shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from 'src/app/shared/components/custom-form/custom-datepicker/custom-datepicker.component';

export interface ReportField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'boolean' | 'enum';
  group: 'user' | 'contest' | 'inscription' | 'document';
  options?: { value: string, label: string }[];
}

interface ReportFilters {
  inscriptionState?: string;
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  contestId?: string;
  searchText?: string;
  [key: string]: unknown;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  filters: ReportFilters;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

@Component({
  selector: 'app-inscripciones-reports',
  templateUrl: './inscripciones-reports.component.html',
  styleUrls: ['./inscripciones-reports.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    MatRadioModule,
    MatTableModule,
    FilterPipe,
    FirstPipe,
    PropertyPipe,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomCheckboxComponent,
    CustomSpinnerComponent,
    CustomTableComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
  ]
})
export class InscripcionesReportsComponent implements OnInit, OnDestroy {
  // Métodos auxiliares para acceder a propiedades de forma segura
  getFieldId(field: unknown): string {
    return (field as any)?.id || '';
  }

  getFieldLabel(field: unknown): string {
    return (field as any)?.label || '';
  }
  @ViewChild('reportTable') reportTable!: ElementRef;

  // Opciones para los selectores
  contestOptions = [
    { value: '', label: 'Todos los concursos' },
    { value: '1', label: 'Concurso para Defensor Penal' },
    { value: '2', label: 'Concurso para Fiscal Civil' },
    { value: '3', label: 'Concurso para Defensor Civil' },
    { value: '4', label: 'Concurso para Fiscal Penal' }
  ];

  // Formulario para el constructor de reportes
  reportForm: FormGroup;

  // Campos disponibles para reportes
  availableFields: ReportField[] = [
    // Campos de usuario
    { id: 'userFullName', label: 'Nombre completo', type: 'text', group: 'user' },
    { id: 'userDni', label: 'DNI', type: 'text', group: 'user' },
    { id: 'userEmail', label: 'Email', type: 'text', group: 'user' },
    { id: 'userPhone', label: 'Teléfono', type: 'text', group: 'user' },
    { id: 'userAddress', label: 'Dirección', type: 'text', group: 'user' },

    // Campos de concurso
    { id: 'contestTitle', label: 'Título del concurso', type: 'text', group: 'contest' },
    { id: 'contestCategory', label: 'Categoría', type: 'text', group: 'contest' },
    { id: 'contestDepartment', label: 'Departamento', type: 'text', group: 'contest' },
    { id: 'contestStartDate', label: 'Fecha de inicio', type: 'date', group: 'contest' },
    { id: 'contestEndDate', label: 'Fecha de cierre', type: 'date', group: 'contest' },

    // Campos de inscripción
    { id: 'inscriptionId', label: 'ID de inscripción', type: 'text', group: 'inscription' },
    { id: 'inscriptionState', label: 'Estado', type: 'enum', group: 'inscription',
      options: [
        { value: InscripcionState.PENDING, label: 'Pendiente' },
        { value: InscripcionState.APPROVED, label: 'Aprobada' },
        { value: InscripcionState.REJECTED, label: 'Rechazada' },
        { value: InscripcionState.CANCELLED, label: 'Cancelada' },
        { value: InscripcionState.IN_PROCESS, label: 'En Proceso' }
      ]
    },
    { id: 'inscriptionCreatedAt', label: 'Fecha de creación', type: 'date', group: 'inscription' },
    { id: 'inscriptionUpdatedAt', label: 'Fecha de actualización', type: 'date', group: 'inscription' },
    { id: 'inscriptionReviewedBy', label: 'Revisado por', type: 'text', group: 'inscription' },
    { id: 'inscriptionReviewDate', label: 'Fecha de revisión', type: 'date', group: 'inscription' },
    { id: 'inscriptionObservations', label: 'Observaciones', type: 'text', group: 'inscription' },

    // Campos de documentos
    { id: 'documentsCount', label: 'Total de documentos', type: 'number', group: 'document' },
    { id: 'pendingDocuments', label: 'Documentos pendientes', type: 'number', group: 'document' },
    { id: 'approvedDocuments', label: 'Documentos aprobados', type: 'number', group: 'document' },
    { id: 'rejectedDocuments', label: 'Documentos rechazados', type: 'number', group: 'document' }
  ];

  // Plantillas predefinidas
  reportTemplates: ReportTemplate[] = [
    {
      id: 'inscriptions-by-status',
      name: 'Inscripciones por Estado',
      description: 'Reporte de inscripciones agrupadas por estado',
      fields: ['userFullName', 'userDni', 'contestTitle', 'inscriptionState', 'inscriptionCreatedAt'],
      filters: { },
      groupBy: 'inscriptionState',
      sortBy: 'inscriptionCreatedAt',
      sortDirection: 'desc'
    },
    {
      id: 'pending-inscriptions',
      name: 'Inscripciones Pendientes',
      description: 'Listado de inscripciones pendientes de revisión',
      fields: ['userFullName', 'userDni', 'userEmail', 'contestTitle', 'inscriptionCreatedAt', 'documentsCount'],
      filters: { inscriptionState: InscripcionState.PENDING },
      sortBy: 'inscriptionCreatedAt',
      sortDirection: 'asc'
    },
    {
      id: 'documents-status',
      name: 'Estado de Documentos',
      description: 'Reporte del estado de documentos por inscripción',
      fields: ['userFullName', 'contestTitle', 'documentsCount', 'pendingDocuments', 'approvedDocuments', 'rejectedDocuments'],
      filters: { },
      sortBy: 'pendingDocuments',
      sortDirection: 'desc'
    }
  ];

  // Datos del reporte
  reportData: Record<string, unknown>[] = [];
  displayedColumns: string[] = [];
  tableColumns: { property: string, header: string }[] = [];

  // Estado de la UI
  isLoading = false;
  activeStep = 0;
  reportGenerated = false;

  // Opciones de exportación
  exportFormats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: 'table_chart' },
    { value: 'csv', label: 'CSV (.csv)', icon: 'insert_drive_file' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: 'picture_as_pdf' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private concursosService: AdminConcursosService,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.fb.group({
      reportName: ['Reporte de Inscripciones', []],
      template: ['custom'],
      fields: this.fb.array([]),
      filters: this.fb.group({
        inscriptionState: [''],
        dateRange: this.fb.group({
          startDate: [null],
          endDate: [null]
        }),
        contestId: [''],
        searchText: ['']
      }),
      grouping: this.fb.group({
        groupBy: [''],
        sortBy: ['inscriptionCreatedAt'],
        sortDirection: ['desc']
      }),
      export: this.fb.group({
        format: ['excel'],
        includeHeaders: [true],
        fileName: ['reporte_inscripciones']
      })
    });
  }

  ngOnInit(): void {
    this.setupTemplateListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fieldsArray(): FormArray {
    return this.reportForm.get('fields') as FormArray;
  }

  setupTemplateListener(): void {
    this.reportForm.get('template')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(templateId => {
        if (templateId !== 'custom') {
          this.applyTemplate(templateId);
        }
      });
  }

  applyTemplate(templateId: string): void {
    const template = this.reportTemplates.find(t => t.id === templateId);

    if (!template) return;

    // Limpiar campos seleccionados
    while (this.fieldsArray.length > 0) {
      this.fieldsArray.removeAt(0);
    }

    // Añadir campos del template
    template.fields.forEach(fieldId => {
      this.fieldsArray.push(new FormControl(fieldId));
    });

    // Aplicar filtros
    this.reportForm.get('filters')?.patchValue(template.filters);

    // Aplicar agrupación y ordenación
    this.reportForm.get('grouping')?.patchValue({
      groupBy: template.groupBy || '',
      sortBy: template.sortBy || 'inscriptionCreatedAt',
      sortDirection: template.sortDirection || 'desc'
    });

    // Actualizar nombre del reporte
    this.reportForm.get('reportName')?.setValue(template.name);

    // Actualizar nombre del archivo
    const fileName = template.name.toLowerCase().replace(/\s+/g, '_');
    this.reportForm.get('export.fileName')?.setValue(fileName);
  }

  toggleFieldSelection(fieldId: unknown): void {
    if (typeof fieldId !== 'string') return;

    const index = this.fieldsArray.controls.findIndex(control => control.value === fieldId);

    if (index === -1) {
      // Añadir campo
      this.fieldsArray.push(new FormControl(fieldId));
    } else {
      // Quitar campo
      this.fieldsArray.removeAt(index);
    }

    // Cambiar a modo personalizado
    this.reportForm.get('template')?.setValue('custom');
  }

  isFieldSelected(fieldId: unknown): boolean {
    if (typeof fieldId !== 'string') return false;
    return this.fieldsArray.controls.some(control => control.value === fieldId);
  }

  getFieldLabelById(fieldId: string): string {
    const field = this.availableFields.find(f => f.id === fieldId);
    return field ? field.label : fieldId;
  }

  generateReport(): void {
    this.isLoading = true;
    this.reportGenerated = false;

    // Obtener campos seleccionados
    const selectedFields = this.fieldsArray.value;

    if (selectedFields.length === 0) {
      this.snackBar.open('Debe seleccionar al menos un campo para el reporte', 'Cerrar', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    // Configurar columnas a mostrar
    this.displayedColumns = selectedFields;
    this.tableColumns = selectedFields.map((field: string) => ({ property: field, header: this.getFieldLabelById(field) }));

    // Preparar filtros
    const filters = this.reportForm.get('filters')?.value || {};
    const grouping = this.reportForm.get('grouping')?.value || {};

    this.inscripcionesService.getInscriptionReport({
      fields: selectedFields,
      filters,
      groupBy: grouping.groupBy,
      sortBy: grouping.sortBy,
      sortDirection: grouping.sortDirection
    }).subscribe({
      next: (data) => {
        this.reportData = data;
        this.reportGenerated = true;
        this.activeStep = 2;
      },
      error: (err) => {
        this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 3000 });
        this.reportData = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  exportReport(): void {
    const format = this.reportForm.get('export.format')?.value;
    const fileName = this.reportForm.get('export.fileName')?.value || 'reporte_inscripciones';

    this.isLoading = true;

    // Simulamos la exportación
    setTimeout(() => {
      this.snackBar.open(`Reporte exportado como ${fileName}.${format}`, 'Cerrar', { duration: 3000 });
      this.isLoading = false;
    }, 1500);
  }

  resetForm(): void {
    this.reportForm.reset({
      reportName: 'Reporte de Inscripciones',
      template: 'custom',
      filters: {
        inscriptionState: '',
        dateRange: {
          startDate: null,
          endDate: null
        },
        contestId: '',
        searchText: ''
      },
      grouping: {
        groupBy: '',
        sortBy: 'inscriptionCreatedAt',
        sortDirection: 'desc'
      },
      export: {
        format: 'excel',
        includeHeaders: true,
        fileName: 'reporte_inscripciones'
      }
    });

    // Limpiar campos seleccionados
    while (this.fieldsArray.length > 0) {
      this.fieldsArray.removeAt(0);
    }

    this.reportGenerated = false;
    this.activeStep = 0;
  }

  getStateLabel(state: InscripcionState): string {
    switch (state) {
      case InscripcionState.PENDING: return 'Pendiente';
      case InscripcionState.APPROVED: return 'Aprobada';
      case InscripcionState.REJECTED: return 'Rechazada';
      case InscripcionState.CANCELLED: return 'Cancelada';
      case InscripcionState.IN_PROCESS: return 'En Proceso';
      default: return state;
    }
  }

  getFieldOptions(fieldId: string): { value: string, label: string }[] | null {
    const field = this.availableFields.find(f => f.id === fieldId);
    return field && field.options ? field.options : null;
  }
}
