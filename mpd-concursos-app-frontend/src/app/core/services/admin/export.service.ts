import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

/**
 * Opciones para la exportación de datos
 */
export interface ExportOptions {
  fileName: string;
  includeHeaders: boolean;
  format: 'excel' | 'csv' | 'pdf';
}

/**
 * Servicio para exportar datos en diferentes formatos
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {



  /**
   * Exporta datos en el formato especificado
   * @param data Datos a exportar
   * @param options Opciones de exportación
   */
  exportData(data: unknown[], options: ExportOptions): void {
    if (!data || data.length === 0) {
      console.error('No hay datos para exportar');
      return;
    }

    switch (options.format) {
      case 'excel':
        this.exportToExcel(data, options);
        break;
      case 'csv':
        this.exportToCsv(data, options);
        break;
      case 'pdf':
        this.exportToPdf(data, options);
        break;
      default:
        console.error('Formato de exportación no soportado');
    }
  }

  /**
   * Exporta datos a formato Excel
   * @param data Datos a exportar
   * @param options Opciones de exportación
   */
  private exportToExcel(data: unknown[], options: ExportOptions): void {
    try {
      // En una implementación real, aquí se utilizaría una biblioteca como exceljs o xlsx
      // para generar un archivo Excel real. Por ahora, simulamos la exportación.

      console.log('Exportando a Excel:', data);

      // Simulamos la creación de un archivo Excel
      const blob = new Blob(['Contenido simulado de Excel'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${options.fileName}.xlsx`);

      // Mensaje de éxito
      console.log('Exportación a Excel completada');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    }
  }

  /**
   * Exporta datos a formato CSV
   * @param data Datos a exportar
   * @param options Opciones de exportación
   */
  private exportToCsv(data: unknown[], options: ExportOptions): void {
    try {
      if (data.length === 0) {
        console.warn('No hay datos para exportar a CSV');
        return;
      }

      // Obtener las cabeceras (nombres de las propiedades)
      const firstItem = data[0] as Record<string, unknown>;
      const headers = Object.keys(firstItem);

      // Crear el contenido CSV
      let csvContent = options.includeHeaders ? headers.join(',') + '\n' : '';

      // Agregar las filas de datos
      data.forEach(item => {
        const itemObj = item as Record<string, unknown>;
        const row = headers.map(header => {
          // Manejar valores que contienen comas o comillas
          const cellValue = itemObj[header];
          const value = cellValue === null || cellValue === undefined ? '' : String(cellValue);
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });

      // Crear el blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${options.fileName}.csv`);

      // Mensaje de éxito
      console.log('Exportación a CSV completada');
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
    }
  }

  /**
   * Exporta datos a formato PDF
   * @param data Datos a exportar
   * @param options Opciones de exportación
   */
  private exportToPdf(data: unknown[], options: ExportOptions): void {
    try {
      // En una implementación real, aquí se utilizaría una biblioteca como pdfmake o jspdf
      // para generar un archivo PDF real. Por ahora, simulamos la exportación.

      console.log('Exportando a PDF:', data);

      // Simulamos la creación de un archivo PDF
      const blob = new Blob(['Contenido simulado de PDF'], { type: 'application/pdf' });
      saveAs(blob, `${options.fileName}.pdf`);

      // Mensaje de éxito
      console.log('Exportación a PDF completada');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
    }
  }
}
