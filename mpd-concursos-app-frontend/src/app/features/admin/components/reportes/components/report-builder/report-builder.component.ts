import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminReportsService, ReportField, ReportTemplate } from '@core/services/admin/admin-reports.service';
import { ExportService } from '@core/services/admin/export.service';
import { FilterByGroupPipe } from './filter-by-group.pipe';
import { ReportChartsComponent } from '../report-charts/report-charts.component';

// Servicio de notificaciones personalizado
interface NotificationService {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

// Implementación básica del servicio de notificaciones
class CustomNotificationService implements NotificationService {
  success(message: string): void {
    console.log('✅ Success:', message);
    // Aquí se podría implementar un toast personalizado
  }

  error(message: string): void {
    console.error('❌ Error:', message);
    // Aquí se podría implementar un toast personalizado
  }

  info(message: string): void {
    console.info('ℹ️ Info:', message);
    // Aquí se podría implementar un toast personalizado
  }
}

@Component({
  selector: 'app-report-builder',
  templateUrl: './report-builder.component.html',
  styleUrls: ['./report-builder.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FilterByGroupPipe,
    ReportChartsComponent
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
  reportGeneratedDate = '';

  // Opciones de exportación avanzadas
  exportFormats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: 'fas fa-file-excel', description: 'Hoja de cálculo con formato' },
    { value: 'csv', label: 'CSV (.csv)', icon: 'fas fa-file-csv', description: 'Valores separados por comas' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: 'fas fa-file-pdf', description: 'Documento portable con formato' },
    { value: 'json', label: 'JSON (.json)', icon: 'fas fa-file-code', description: 'Datos estructurados JSON' },
    { value: 'xml', label: 'XML (.xml)', icon: 'fas fa-code', description: 'Datos estructurados XML' }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Servicio de notificaciones personalizado
  private notificationService = new CustomNotificationService();

  constructor(
    private fb: FormBuilder,
    private reportsService: AdminReportsService,
    private exportService: ExportService
  ) {
    // Inicializar formulario con validaciones
    this.reportForm = this.fb.group({
      reportName: ['Reporte Personalizado', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      template: ['custom', Validators.required],
      fields: this.fb.array([], Validators.minLength(1)),
      filters: this.fb.group({
        inscriptionState: [''],
        dateRange: this.fb.group({
          startDate: [null],
          endDate: [null]
        }, { validators: this.dateRangeValidator }),
        contestId: [''],
        searchText: ['', Validators.maxLength(255)]
      }),
      grouping: this.fb.group({
        groupBy: [''],
        sortBy: ['inscriptionCreatedAt', Validators.required],
        sortDirection: ['desc', Validators.required]
      }),
      export: this.fb.group({
        format: ['excel', Validators.required],
        includeHeaders: [true],
        fileName: ['reporte_personalizado', [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9_-]+$/)
        ]]
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
          this.notificationService.error('Error al cargar campos disponibles');
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
          this.notificationService.error('Error al cargar plantillas');
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
          this.notificationService.error('Error al cargar plantilla');
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
      this.notificationService.error('Debe seleccionar al menos un campo para el reporte');
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
          this.reportGeneratedDate = new Date().toLocaleString();
          this.isLoading = false;
          this.activeStep = 2; // Avanzar al paso de resultados
          this.notificationService.success('Reporte generado exitosamente');
        },
        error: (error) => {
          console.error('Error generando reporte:', error);
          this.notificationService.error('Error al generar reporte');
          this.isLoading = false;
        }
      });
  }

  /**
   * Exporta el reporte en el formato seleccionado
   */
  exportReport(): void {
    const exportConfig = this.reportForm.get('export')?.value;
    const fileName = exportConfig.fileName || 'reporte';
    const format = exportConfig.format || 'excel';
    const includeHeaders = exportConfig.includeHeaders !== false;

    this.isLoading = true;

    try {
      switch (format) {
        case 'excel':
          this.exportToExcel(fileName, includeHeaders);
          break;
        case 'csv':
          this.exportToCSV(fileName, includeHeaders);
          break;
        case 'pdf':
          this.exportToPDF(fileName, includeHeaders);
          break;
        case 'json':
          this.exportToJSON(fileName);
          break;
        case 'xml':
          this.exportToXML(fileName);
          break;
        default:
          this.exportService.exportData(this.reportData, {
            format,
            fileName,
            includeHeaders
          });
      }

      this.isLoading = false;
      this.notificationService.success(`Reporte exportado como ${fileName}.${format}`);
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      this.isLoading = false;
      this.notificationService.error('Error al exportar el reporte');
    }
  }

  /**
   * Exporta a Excel con formato avanzado
   */
  private exportToExcel(fileName: string, includeHeaders: boolean): void {
    this.exportService.exportData(this.reportData, {
      format: 'excel',
      fileName,
      includeHeaders
    });
  }

  /**
   * Exporta a CSV con configuración personalizada
   */
  private exportToCSV(fileName: string, includeHeaders: boolean): void {
    const csvContent = this.generateCSVContent(includeHeaders);
    this.downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
  }

  /**
   * Exporta a PDF con formato profesional
   */
  private exportToPDF(fileName: string, includeHeaders: boolean): void {
    // Usar el servicio existente por ahora
    this.exportService.exportData(this.reportData, {
      format: 'pdf',
      fileName,
      includeHeaders
    });
  }

  /**
   * Exporta a JSON estructurado
   */
  private exportToJSON(fileName: string): void {
    const jsonData = {
      metadata: {
        reportName: this.reportForm.get('reportName')?.value,
        generatedDate: this.reportGeneratedDate,
        totalRecords: this.reportData.length,
        columns: this.displayedColumns
      },
      data: this.reportData
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    this.downloadFile(jsonContent, `${fileName}.json`, 'application/json');
  }

  /**
   * Exporta a XML estructurado
   */
  private exportToXML(fileName: string): void {
    const xmlContent = this.generateXMLContent();
    this.downloadFile(xmlContent, `${fileName}.xml`, 'application/xml');
  }

  /**
   * Genera contenido CSV personalizado
   */
  private generateCSVContent(includeHeaders: boolean): string {
    let csv = '';

    if (includeHeaders) {
      csv += this.displayedColumns.map(col => `"${this.getFieldLabel(col)}"`).join(',') + '\n';
    }

    this.reportData.forEach(row => {
      const values = this.displayedColumns.map(col => {
        const value = row[col] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Genera contenido XML estructurado
   */
  private generateXMLContent(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<report>\n';
    xml += `  <metadata>\n`;
    xml += `    <name>${this.escapeXML(this.reportForm.get('reportName')?.value || '')}</name>\n`;
    xml += `    <generatedDate>${this.escapeXML(this.reportGeneratedDate)}</generatedDate>\n`;
    xml += `    <totalRecords>${this.reportData.length}</totalRecords>\n`;
    xml += `  </metadata>\n`;
    xml += `  <data>\n`;

    this.reportData.forEach(row => {
      xml += `    <record>\n`;
      this.displayedColumns.forEach(col => {
        const value = row[col] || '';
        xml += `      <${col}>${this.escapeXML(String(value))}</${col}>\n`;
      });
      xml += `    </record>\n`;
    });

    xml += `  </data>\n`;
    xml += '</report>';

    return xml;
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Descarga un archivo con el contenido especificado
   */
  private downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
    this.reportGeneratedDate = '';
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

  /**
   * Validador personalizado para rango de fechas
   * @param group FormGroup del rango de fechas
   * @returns Error de validación o null
   */
  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return { dateRangeInvalid: true };
      }
    }

    return null;
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o null
   */
  getFieldError(fieldName: string): string | null {
    const field = this.reportForm.get(fieldName);

    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors?.['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors?.['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors?.['pattern']) {
        return 'Solo se permiten letras, números, guiones y guiones bajos';
      }
      if (field.errors?.['minLength']) {
        return 'Debe seleccionar al menos un campo';
      }
    }

    return null;
  }

  /**
   * Obtiene el mensaje de error para el rango de fechas
   * @returns Mensaje de error o null
   */
  getDateRangeError(): string | null {
    const dateRange = this.reportForm.get('filters.dateRange');

    if (dateRange && dateRange.invalid && (dateRange.dirty || dateRange.touched)) {
      if (dateRange.errors?.['dateRangeInvalid']) {
        return 'La fecha de inicio debe ser anterior a la fecha de fin';
      }
    }

    return null;
  }

  /**
   * Verifica si un campo tiene errores
   * @param fieldName Nombre del campo
   * @returns true si el campo tiene errores
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.reportForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Verifica si el formulario es válido para avanzar al siguiente paso
   * @param step Número del paso
   * @returns true si puede avanzar
   */
  canAdvanceToStep(step: number): boolean {
    switch (step) {
      case 1: // Paso de filtros
        const reportName = this.reportForm.get('reportName');
        const fields = this.reportForm.get('fields');
        return !!(reportName?.valid && fields?.valid && this.fieldsArray.length > 0);

      case 2: // Paso de resultados
        const filters = this.reportForm.get('filters');
        const grouping = this.reportForm.get('grouping');
        return !!(filters?.valid && grouping?.valid);

      default:
        return true;
    }
  }

  /**
   * Establece el paso activo del wizard
   */
  setActiveStep(stepIndex: number): void {
    this.activeStep = stepIndex;
  }
}
