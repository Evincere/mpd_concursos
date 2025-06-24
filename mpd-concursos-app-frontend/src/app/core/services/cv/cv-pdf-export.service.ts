/**
 * Servicio de Exportación PDF del Sistema CV
 * 
 * @description Servicio para generar CVs en formato PDF de alta calidad usando pdfmake.
 * @author Augment Agent
 * @date 2025-06-25
 * @version 3.2.0
 */

import { Injectable } from '@angular/core';
import type { TDocumentDefinitions, Content, Style } from 'pdfmake/interfaces';

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
    private readonly notificationService: CvNotificationService
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
    return {
      content: [
        this.generateHeader(userProfile),
        this.generateExperienceSection(experiences),
        this.generateEducationSection(education),
      ],
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
      const content: Content[] = [
        {
          text: [
            { text: `${exp.position}\n`, bold: true },
            { text: `${exp.company} | ${this.formatDate(exp.startDate)} - ${endDate}` }
          ],
          margin: [0, 5, 0, 5]
        }
      ];

      if (exp.description) {
        content.push({
          ul: this.parseDescription(exp.description),
          style: 'list'
        });
      }
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
        {
          text: [
            { text: `${edu.title}\n`, bold: true },
            { text: `${edu.institution} | ${this.formatDate(edu.startDate)} - ${endDate}` }
          ],
          margin: [0, 5, 0, 5]
        }
      ];

      const details = this.getEducationDetails(edu);
      if (details.length > 0) {
        content.push({ ul: details, style: 'list' });
      }
      
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
      case EducationType.UNIVERSITY_DEGREE:
        if ((edu as UniversityEducation).honors) details.push(`Honores: ${(edu as UniversityEducation).honors}`);
        if ((edu as UniversityEducation).average) details.push(`Promedio: ${(edu as UniversityEducation).average}`);
        break;
      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        if ((edu as PostgraduateEducation).thesisTopic) details.push(`Tesis: ${(edu as PostgraduateEducation).thesisTopic}`);
        break;
      case EducationType.DIPLOMA:
      case EducationType.CERTIFICATION:
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
        margin: [0, 15, 0, 5],
        decoration: 'underline',
        decorationColor: '#95a5a6'
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
  
  private generateFileName(userProfile: UserProfile): string {
    const name = userProfile.firstName.replace(/\s/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    return `CV_${name}_${date}.pdf`;
  }
}
