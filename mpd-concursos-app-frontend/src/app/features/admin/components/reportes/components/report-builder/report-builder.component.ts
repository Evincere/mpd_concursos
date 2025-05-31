import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminReportsService, ReportField, ReportTemplate } from '@core/services/admin/admin-reports.service';
import { ExportService } from '@core/services/admin/export.service';
import { FilterByGroupPipe } from './filter-by-group.pipe';

@Component({
  selector: 'app-report-builder',
  templateUrl: './report-builder.component.html',
  styleUrls: ['./report-builder.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FilterByGroupPipe
  ]
})
export class ReportBuilderComponent implements OnInit, OnDestroy {
  // Formulario principal
  reportForm: FormGroup;

  // Datos para el formulario
  availableFields: ReportField[] = [];
  reportTemplates: ReportTemplate[] = [];

  // Datos del reporte
  reportData: Record<string, unknown>[] = [];
  displayedColumns: string[] = [];

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

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportsService: AdminReportsService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario
    this.reportForm = this.fb.group({
      reportName: ['Reporte Personalizado', []],
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
        fileName: ['reporte_personalizado']
      })
    });
  }

  ngOnInit(): void {
    this.loadAvailableFields();
    this.loadReportTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los campos disponibles para reportes
   */
  loadAvailableFields(): void {
    this.isLoading = true;

    this.reportsService.getAvailableFields()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fields) => {
          this.availableFields = fields;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando campos disponibles:', error);
          this.snackBar.open('Error al cargar campos disponibles', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  /**
   * Carga las plantillas de reportes disponibles
   */
  loadReportTemplates(): void {
    this.reportsService.getReportTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.reportTemplates = templates;
        },
        error: (error) => {
          console.error('Error cargando plantillas de reportes:', error);
          this.snackBar.open('Error al cargar plantillas', 'Cerrar', { duration: 3000 });
        }
      });
  }

  /**
   * Obtiene el FormArray de campos
   */
  get fieldsArray(): FormArray {
    return this.reportForm.get('fields') as FormArray;
  }

  /**
   * Agrega un campo al reporte
   * @param fieldId ID del campo a agregar
   */
  addField(fieldId: string): void {
    // Verificar si el campo ya está seleccionado
    const existingIndex = this.fieldsArray.value.findIndex((f: string) => f === fieldId);

    if (existingIndex === -1) {
      this.fieldsArray.push(this.fb.control(fieldId));
    }
  }

  /**
   * Elimina un campo del reporte
   * @param index Índice del campo a eliminar
   */
  removeField(index: number): void {
    this.fieldsArray.removeAt(index);
  }

  /**
   * Carga una plantilla de reporte
   * @param templateId ID de la plantilla a cargar
   */
  loadTemplate(templateId: string): void {
    if (templateId === 'custom') {
      // Limpiar campos seleccionados
      while (this.fieldsArray.length > 0) {
        this.fieldsArray.removeAt(0);
      }
      return;
    }

    this.reportsService.getReportTemplate(templateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template) => {
          if (template) {
            // Limpiar campos seleccionados
            while (this.fieldsArray.length > 0) {
              this.fieldsArray.removeAt(0);
            }

            // Agregar campos de la plantilla
            template.fields.forEach(fieldId => {
              this.fieldsArray.push(this.fb.control(fieldId));
            });

            // Actualizar filtros y agrupación
            this.reportForm.patchValue({
              filters: template.filters,
              grouping: {
                groupBy: template.groupBy || '',
                sortBy: template.sortBy,
                sortDirection: template.sortDirection
              }
            });
          }
        },
        error: (error) => {
          console.error('Error cargando plantilla:', error);
          this.snackBar.open('Error al cargar plantilla', 'Cerrar', { duration: 3000 });
        }
      });
  }

  /**
   * Genera el reporte con los parámetros seleccionados
   */
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

    // Obtener parámetros del reporte
    const params = {
      reportName: this.reportForm.get('reportName')?.value,
      fields: selectedFields,
      filters: this.reportForm.get('filters')?.value,
      grouping: this.reportForm.get('grouping')?.value
    };

    // Generar reporte
    this.reportsService.generateReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.reportGenerated = true;
          this.isLoading = false;
          this.activeStep = 2; // Avanzar al paso de resultados
        },
        error: (error) => {
          console.error('Error generando reporte:', error);
          this.snackBar.open('Error al generar reporte', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  /**
   * Exporta el reporte generado
   */
  exportReport(): void {
    const format = this.reportForm.get('export.format')?.value;
    const fileName = this.reportForm.get('export.fileName')?.value || 'reporte_personalizado';
    const includeHeaders = this.reportForm.get('export.includeHeaders')?.value;

    this.isLoading = true;

    // Exportar datos
    this.exportService.exportData(this.reportData, {
      format,
      fileName,
      includeHeaders
    });

    this.isLoading = false;
    this.snackBar.open(`Reporte exportado como ${fileName}.${format}`, 'Cerrar', { duration: 3000 });
  }

  /**
   * Reinicia el formulario
   */
  resetForm(): void {
    this.reportForm.reset({
      reportName: 'Reporte Personalizado',
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
        fileName: 'reporte_personalizado'
      }
    });

    // Limpiar campos seleccionados
    while (this.fieldsArray.length > 0) {
      this.fieldsArray.removeAt(0);
    }

    this.reportGenerated = false;
    this.activeStep = 0;
  }

  /**
   * Obtiene la etiqueta de un campo por su ID
   * @param fieldId ID del campo
   * @returns Etiqueta del campo
   */
  getFieldLabel(fieldId: string): string {
    const field = this.availableFields.find(f => f.id === fieldId);
    return field ? field.label : fieldId;
  }
}
