import { TDocumentDefinitions, Content, Style } from 'pdfmake/interfaces';
/**
 * Servicio de Exportación PDF del Sistema CV
 *
 * @description Servicio para generar CVs en formato PDF de alta calidad usando pdfmake.
 * @author Augment Agent
 * @date 2025-06-25
 * @version 3.2.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import type { TDocumentDefinitions, Content, Style } from 'pdfmake/interfaces'; // Temporalmente comentado - dependencia faltante
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  WorkExperience,
  EducationEntry,
  UniversityEducation,
  PostgraduateEducation,
  DiplomaEducation,
  ScientificActivity,
  EducationType
} from '@core/models/cv';
import { UserProfile } from '@core/models/perfil.model';
import { CvNotificationService } from './cv-notification.service';
// import { environment } from '@environments/environment';

export interface PdfExportResult {
  success: boolean;
  fileName: string;
  blob?: Blob;
  error?: string;
}

// Interfaces exportadas para mantener la compatibilidad con el resto de la aplicación
export interface PdfExportConfig {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  template: 'modern' | 'classic' | 'minimal' | 'professional';
  includePhoto: boolean;
  includeColors: boolean;
  fontSize: 'small' | 'medium' | 'large';
  margins: { top: number; right: number; bottom: number; left: number; };
  sections: { personalInfo: boolean; experience: boolean; education: boolean; skills: boolean; achievements: boolean; };
}
export interface CvTemplate {
  id: string; name: string; description: string; preview: string;
  colors: { primary: string; secondary: string; accent: string; text: string; background: string; };
  fonts: { heading: string; body: string; size: { h1: number; h2: number; h3: number; body: number; small: number; }; };
  layout: { columns: 1 | 2; headerHeight: number; sectionSpacing: number; lineHeight: number; };
}


@Injectable({
  providedIn: 'root'
})
export class CvPdfExportService {
  private pdfMake: any = null;
  private isInitialized = false;

  constructor(
    private readonly notificationService: CvNotificationService,
    private readonly http: HttpClient
  ) {}

  private async initializePdfMake(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Importación dinámica para evitar problemas de carga
      const pdfMakeModule = await import('pdfmake/build/pdfmake') as any;
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts') as any;

      this.pdfMake = pdfMakeModule.default || pdfMakeModule;

      // Configurar VFS de forma segura usando any para evitar problemas de tipado
      const fonts = pdfFontsModule as any;
      if (fonts.pdfMake?.vfs) {
        this.pdfMake.vfs = fonts.pdfMake.vfs;
      } else if (fonts.default?.pdfMake?.vfs) {
        this.pdfMake.vfs = fonts.default.pdfMake.vfs;
      } else {
        // Fallback: usar las fuentes directamente si están disponibles
        this.pdfMake.vfs = fonts.vfs || fonts.default?.vfs || {};
      }

      // Configurar fuentes por defecto
      this.pdfMake.fonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf'
        }
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Error al inicializar pdfMake:', error);
      throw new Error('No se pudo inicializar el generador de PDF');
    }
  }

  public async exportToPdf(
    userProfile: UserProfile,
    experiences: WorkExperience[],
    education: EducationEntry[]
  ): Promise<PdfExportResult> {
    try {
      this.notificationService.showInfo('Generando PDF del CV...');

      // Inicializar pdfMake si no está inicializado
      await this.initializePdfMake();

      if (!this.pdfMake) {
        throw new Error('No se pudo inicializar el generador de PDF');
      }

      const docDefinition = this.createDocumentDefinition(userProfile, experiences, education);
      const pdfDoc = this.pdfMake.createPdf(docDefinition);

      return new Promise<PdfExportResult>((resolve) => {
        pdfDoc.getBlob((blob: Blob) => {
          this.notificationService.showSuccess('El PDF del CV se ha generado correctamente.');
          resolve({
            success: true,
            fileName: this.generateFileName(userProfile),
            blob: blob
          });
        });
      });

    } catch (error: any) {
      console.error('Error al generar el PDF del CV con pdfmake:', error);
      this.notificationService.showError(`Error al generar el PDF: ${error.message}`);
      return {
        success: false,
        fileName: '',
        error: error.message
      };
    }
  }

  private createDocumentDefinition(
    userProfile: UserProfile,
    experiences: WorkExperience[],
    education: EducationEntry[]
  ): TDocumentDefinitions {
    const content: Content[] = [
      this.generateHeader(userProfile),
      this.generateExperienceSection(experiences),
      this.generateEducationSection(education),
    ];

    // Agregar sección de anexos si hay documentos adjuntos
    const attachmentsSection = this.generateDocumentAttachmentsSection(experiences, education);
    if (attachmentsSection.length > 0) {
      content.push(...attachmentsSection);
    }

    return {
      content: content,
      styles: this.getStyles(),
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#333333'
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage.toString()} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [0, 10, 0, 10]
      })
    };
  }

  private generateHeader(userProfile: UserProfile): Content {
    return [
      {
        text: `${userProfile.firstName} ${userProfile.lastName}`,
        style: 'header'
      },
      {
        text: userProfile.email || '',
        style: 'subheader'
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }],
        margin: [0, 5, 0, 15]
      }
    ];
  }

  private generateExperienceSection(experiences: WorkExperience[]): Content {
    if (experiences.length === 0) return [];

    const body = experiences.flatMap(exp => {
      const endDate = exp.isCurrentJob ? 'Presente' : this.formatDate(exp.endDate);
      const duration = this.calculateDuration(exp.startDate, exp.endDate, exp.isCurrentJob);

      const content: Content[] = [
        // Encabezado de la experiencia con diseño mejorado
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  text: [
                    { text: `${exp.position}\n`, style: 'jobTitle' },
                    { text: `${exp.company}`, style: 'companyName' }
                  ],
                  border: [false, false, false, false]
                },
                {
                  text: [
                    { text: `${this.formatDate(exp.startDate)} - ${endDate}\n`, style: 'dateRange' },
                    { text: duration, style: 'duration' }
                  ],
                  alignment: 'right',
                  border: [false, false, false, false]
                }
              ]
            ]
          },
          margin: [0, 8, 0, 5]
        }
      ];

      // Ubicación si está disponible
      if (exp.location) {
        content.push({
          text: `📍 ${exp.location}`,
          style: 'location',
          margin: [0, 0, 0, 5]
        });
      }

      // Descripción
      if (exp.description) {
        content.push({
          text: 'Descripción:',
          style: 'subsectionTitle',
          margin: [0, 5, 0, 2]
        });
        content.push({
          ul: this.parseDescription(exp.description),
          style: 'descriptionList'
        });
      }

      // Tecnologías
      if (exp.technologies && exp.technologies.length > 0) {
        content.push({
          text: 'Tecnologías:',
          style: 'subsectionTitle',
          margin: [0, 5, 0, 2]
        });
        content.push({
          text: exp.technologies.join(' • '),
          style: 'technologies',
          margin: [10, 0, 0, 5]
        });
      }

      // Logros principales
      if (exp.achievements && exp.achievements.length > 0) {
        content.push({
          text: 'Logros principales:',
          style: 'subsectionTitle',
          margin: [0, 5, 0, 2]
        });
        content.push({
          ul: exp.achievements,
          style: 'achievementsList'
        });
      }

      // Indicador de documento adjunto
      if (exp.documentUrl) {
        content.push({
          text: '📎 Documentación probatoria adjunta',
          style: 'documentIndicator',
          margin: [0, 5, 0, 0]
        });
      }

      // Separador entre experiencias
      content.push({
        canvas: [{
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 515,
          y2: 5,
          lineWidth: 0.5,
          lineColor: '#e0e0e0'
        }],
        margin: [0, 10, 0, 10]
      });

      return content;
    });

    return [
      { text: 'Experiencia Laboral', style: 'sectionHeader' },
      ...body
    ];
  }

  private generateEducationSection(educationEntries: EducationEntry[]): Content {
    if (educationEntries.length === 0) return [];

    const body = educationEntries.flatMap(edu => {
      const endDate = edu.isOngoing ? 'Presente' : this.formatDate(edu.endDate);

      const content: Content[] = [
        // Encabezado de la educación con diseño mejorado
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  text: [
                    { text: `${edu.title}\n`, style: 'jobTitle' },
                    { text: `${edu.institution}`, style: 'companyName' }
                  ],
                  border: [false, false, false, false]
                },
                {
                  text: [
                    { text: `${this.formatDate(edu.startDate)} - ${endDate}`, style: 'dateRange' }
                  ],
                  alignment: 'right',
                  border: [false, false, false, false]
                }
              ]
            ]
          },
          margin: [0, 8, 0, 5]
        }
      ];

      const details = this.getEducationDetails(edu);
      if (details.length > 0) {
        content.push({
          ul: details,
          style: 'descriptionList',
          margin: [15, 2, 0, 5]
        });
      }

      // Indicador de documento adjunto para educación
      if (edu.document) {
        content.push({
          text: '📎 Documentación probatoria adjunta',
          style: 'documentIndicator',
          margin: [0, 5, 0, 0]
        });
      }

      // Separador entre entradas de educación
      content.push({
        canvas: [{
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 515,
          y2: 5,
          lineWidth: 0.5,
          lineColor: '#e0e0e0'
        }],
        margin: [0, 10, 0, 10]
      });

      return content;
    });

    return [
      { text: 'Educación', style: 'sectionHeader' },
      ...body
    ];
  }

  private getEducationDetails(edu: EducationEntry): string[] {
    const details: string[] = [];
    switch (edu.type) {
      case EducationType.HIGHER_EDUCATION_CAREER:
      case EducationType.UNDERGRADUATE_CAREER:
        if ((edu as UniversityEducation).honors) details.push(`Honores: ${(edu as UniversityEducation).honors}`);
        if ((edu as UniversityEducation).average) details.push(`Promedio: ${(edu as UniversityEducation).average}`);
        break;
      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.POSTGRADUATE_MASTERS:
      case EducationType.POSTGRADUATE_DOCTORATE:
        if ((edu as PostgraduateEducation).thesisTopic) details.push(`Tesis: ${(edu as PostgraduateEducation).thesisTopic}`);
        break;
      case EducationType.DIPLOMA:
      case EducationType.TRAINING_COURSE:
        if ((edu as DiplomaEducation).hourlyLoad) details.push(`Carga horaria: ${(edu as DiplomaEducation).hourlyLoad}hs`);
        break;
      case EducationType.SCIENTIFIC_ACTIVITY:
        if ((edu as ScientificActivity).publicationDetails) details.push(`Publicación: ${(edu as ScientificActivity).publicationDetails}`);
        break;
    }
    return details;
  }

  private getStyles(): Record<string, Style> {
    return {
      header: {
        fontSize: 24,
        bold: true,
        color: '#2c3e50',
        margin: [0, 0, 0, 5]
      },
      subheader: {
        fontSize: 10,
        color: '#7f8c8d',
        margin: [0, 0, 0, 10]
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#2980b9',
        margin: [0, 15, 0, 10],
        decoration: 'underline',
        decorationColor: '#95a5a6'
      },
      jobTitle: {
        fontSize: 14,
        bold: true,
        color: '#2c3e50'
      },
      companyName: {
        fontSize: 12,
        color: '#34495e',
        italics: true
      },
      dateRange: {
        fontSize: 10,
        color: '#7f8c8d',
        bold: true
      },
      duration: {
        fontSize: 9,
        color: '#95a5a6'
      },
      location: {
        fontSize: 9,
        color: '#e67e22',
        italics: true
      },
      subsectionTitle: {
        fontSize: 10,
        bold: true,
        color: '#34495e'
      },
      descriptionList: {
        margin: [15, 2, 0, 5],
        color: '#2c3e50',
        fontSize: 9
      },
      technologies: {
        fontSize: 9,
        color: '#8e44ad',
        background: '#f8f9fa',
        margin: [10, 2, 0, 5]
      },
      achievementsList: {
        margin: [15, 2, 0, 5],
        color: '#27ae60',
        fontSize: 9
      },
      documentIndicator: {
        fontSize: 8,
        color: '#3498db',
        italics: true
      },
      attachmentDescription: {
        fontSize: 10,
        color: '#34495e',
        italics: true
      },
      attachmentNote: {
        fontSize: 8,
        color: '#7f8c8d',
        italics: true
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#2c3e50',
        fillColor: '#ecf0f1'
      },
      tableCell: {
        fontSize: 9,
        color: '#34495e'
      },
      list: {
        margin: [10, 5, 0, 5],
        color: '#34495e'
      }
    };
  }

  private parseDescription(description: string): string[] {
      return description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  private formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  }

  private calculateDuration(startDate: Date, endDate?: Date, isCurrentJob?: boolean): string {
    const start = new Date(startDate);
    const end = isCurrentJob ? new Date() : (endDate ? new Date(endDate) : new Date());

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Promedio de días por mes

    if (diffMonths < 12) {
      return `${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const remainingMonths = diffMonths % 12;

      let result = `${years} año${years !== 1 ? 's' : ''}`;
      if (remainingMonths > 0) {
        result += ` y ${remainingMonths} mes${remainingMonths !== 1 ? 'es' : ''}`;
      }
      return result;
    }
  }

  private generateFileName(userProfile: UserProfile): string {
    const name = userProfile.firstName.replace(/\s/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    return `CV_${name}_${date}.pdf`;
  }

  /**
   * Genera una página de anexos con información sobre los documentos adjuntos
   */
  private generateDocumentAttachmentsSection(experiences: WorkExperience[], educationEntries: EducationEntry[]): Content[] {
    const attachments: any[] = [];

    // Documentos de experiencias laborales
    experiences.forEach((exp, index) => {
      if (exp.documentUrl) {
        attachments.push({
          type: 'Experiencia Laboral',
          title: exp.position,
          company: exp.company,
          fileName: exp.documentUrl.split('/').pop() || 'documento.pdf',
          index: index + 1
        });
      }
    });

    // Documentos de educación
    educationEntries.forEach((edu, index) => {
      if (edu.document) {
        attachments.push({
          type: 'Educación',
          title: edu.title,
          institution: edu.institution,
          fileName: edu.document.fileName || 'documento.pdf',
          index: index + 1
        });
      }
    });

    if (attachments.length === 0) {
      return [];
    }

    const content: Content[] = [
      { text: 'Anexos - Documentación Probatoria', style: 'sectionHeader', pageBreak: 'before' },
      {
        text: 'Los siguientes documentos están disponibles como respaldo de la información presentada en este CV:',
        style: 'attachmentDescription',
        margin: [0, 0, 0, 15]
      }
    ];

    // Tabla de documentos
    const tableBody = [
      [
        { text: 'Tipo', style: 'tableHeader' },
        { text: 'Descripción', style: 'tableHeader' },
        { text: 'Archivo', style: 'tableHeader' }
      ]
    ];

    attachments.forEach(attachment => {
      tableBody.push([
        { text: attachment.type, style: 'tableCell' },
        {
          text: [
            { text: `${attachment.title}\n`, bold: true },
            { text: attachment.company || attachment.institution, italics: true }
          ],
          style: 'tableCell'
        },
        { text: attachment.fileName, style: 'tableCell' }
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex: number) {
          return rowIndex === 0 ? '#f8f9fa' : (rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa');
        }
      }
    });

    content.push({
      text: [
        { text: 'Nota: ', bold: true },
        'Los documentos originales están disponibles digitalmente y pueden ser solicitados para verificación.'
      ],
      style: 'attachmentNote',
      margin: [0, 15, 0, 0]
    });

    return content;
  }
}
