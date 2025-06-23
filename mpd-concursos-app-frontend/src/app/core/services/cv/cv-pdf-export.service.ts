/**
 * Servicio de Exportación PDF del Sistema CV
 * 
 * @description Servicio para generar CVs en formato PDF con plantillas personalizables
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  WorkExperience,
  EducationEntry,
  CurriculumVitae,
  ICvExportService
} from '@core/models/cv';
import { CvTransformService } from './cv-transform.service';
import { CvNotificationService } from './cv-notification.service';
import { UserProfile } from '@core/models/perfil.model';

/**
 * Configuración de exportación PDF
 */
export interface PdfExportConfig {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  template: 'modern' | 'classic' | 'minimal' | 'professional';
  includePhoto: boolean;
  includeColors: boolean;
  fontSize: 'small' | 'medium' | 'large';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sections: {
    personalInfo: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    achievements: boolean;
  };
}

/**
 * Plantilla de CV para PDF
 */
export interface CvTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
    size: {
      h1: number;
      h2: number;
      h3: number;
      body: number;
      small: number;
    };
  };
  layout: {
    columns: 1 | 2;
    headerHeight: number;
    sectionSpacing: number;
    lineHeight: number;
  };
}

/**
 * Resultado de exportación PDF
 */
export interface PdfExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  error?: string;
  metadata: {
    pages: number;
    template: string;
    generatedAt: Date;
    processingTime: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CvPdfExportService {

  private readonly defaultConfig: PdfExportConfig = {
    format: 'A4',
    orientation: 'portrait',
    template: 'modern',
    includePhoto: false,
    includeColors: true,
    fontSize: 'medium',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    sections: {
      personalInfo: true,
      experience: true,
      education: true,
      skills: true,
      achievements: true
    }
  };

  private readonly templates: CvTemplate[] = [
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Diseño contemporáneo con colores vibrantes',
      preview: '/assets/templates/modern-preview.png',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#06b6d4',
        text: '#1e293b',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        size: { h1: 24, h2: 18, h3: 14, body: 11, small: 9 }
      },
      layout: {
        columns: 2,
        headerHeight: 80,
        sectionSpacing: 15,
        lineHeight: 1.4
      }
    },
    {
      id: 'classic',
      name: 'Clásico',
      description: 'Diseño tradicional y profesional',
      preview: '/assets/templates/classic-preview.png',
      colors: {
        primary: '#1f2937',
        secondary: '#6b7280',
        accent: '#374151',
        text: '#111827',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Times',
        body: 'Times',
        size: { h1: 22, h2: 16, h3: 13, body: 11, small: 9 }
      },
      layout: {
        columns: 1,
        headerHeight: 60,
        sectionSpacing: 12,
        lineHeight: 1.3
      }
    },
    {
      id: 'minimal',
      name: 'Minimalista',
      description: 'Diseño limpio y simple',
      preview: '/assets/templates/minimal-preview.png',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#999999',
        text: '#333333',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Helvetica',
        body: 'Helvetica',
        size: { h1: 20, h2: 16, h3: 12, body: 10, small: 8 }
      },
      layout: {
        columns: 1,
        headerHeight: 50,
        sectionSpacing: 10,
        lineHeight: 1.2
      }
    },
    {
      id: 'professional',
      name: 'Profesional',
      description: 'Diseño corporativo elegante',
      preview: '/assets/templates/professional-preview.png',
      colors: {
        primary: '#0f172a',
        secondary: '#475569',
        accent: '#0ea5e9',
        text: '#1e293b',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Arial',
        body: 'Arial',
        size: { h1: 22, h2: 17, h3: 13, body: 11, small: 9 }
      },
      layout: {
        columns: 2,
        headerHeight: 70,
        sectionSpacing: 14,
        lineHeight: 1.35
      }
    }
  ];

  constructor(
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService
  ) {}

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Exporta el CV completo a PDF
   */
  async exportToPdf(
    userProfile: UserProfile,
    experiences: WorkExperience[],
    education: EducationEntry[],
    config?: Partial<PdfExportConfig>
  ): Promise<PdfExportResult> {
    const startTime = Date.now();
    const exportConfig = { ...this.defaultConfig, ...config };
    const template = this.getTemplate(exportConfig.template);

    try {
      this.notificationService.showInfo('Generando PDF del CV...');

      // Crear el documento PDF
      const pdf = new jsPDF({
        orientation: exportConfig.orientation,
        unit: 'mm',
        format: exportConfig.format
      });

      // Generar contenido según la plantilla
      await this.generatePdfContent(pdf, userProfile, experiences, education, exportConfig, template);

      // Generar nombre de archivo
      const fileName = this.generateFileName(userProfile, exportConfig.template);

      // Guardar el PDF
      pdf.save(fileName);

      const processingTime = Date.now() - startTime;
      const result: PdfExportResult = {
        success: true,
        fileName,
        fileSize: 0, // Simplificado
        metadata: {
          pages: 1, // Simplificado
          template: exportConfig.template,
          generatedAt: new Date(),
          processingTime
        }
      };

      this.notificationService.showCvExported('PDF');
      return result;

    } catch (error) {
      console.error('Error exporting CV to PDF:', error);
      const result: PdfExportResult = {
        success: false,
        fileName: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
        metadata: {
          pages: 0,
          template: exportConfig.template,
          generatedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      };

      this.notificationService.showError('Error al generar el PDF del CV');
      return result;
    }
  }

  /**
   * Exporta desde elemento HTML
   */
  async exportFromHtml(
    htmlElement: HTMLElement,
    fileName: string,
    config?: Partial<PdfExportConfig>
  ): Promise<PdfExportResult> {
    const startTime = Date.now();
    const exportConfig = { ...this.defaultConfig, ...config };

    try {
      this.notificationService.showInfo('Capturando contenido del CV...');

      // Capturar el elemento HTML como imagen
      const canvas = await html2canvas(htmlElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Crear PDF con la imagen
      const pdf = new jsPDF({
        orientation: exportConfig.orientation,
        unit: 'mm',
        format: exportConfig.format
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth() - (exportConfig.margins.left + exportConfig.margins.right);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', exportConfig.margins.left, exportConfig.margins.top, imgWidth, imgHeight);

      // Guardar el PDF
      pdf.save(fileName);

      const processingTime = Date.now() - startTime;
      const result: PdfExportResult = {
        success: true,
        fileName,
        fileSize: 0, // Simplificado
        metadata: {
          pages: 1, // Simplificado
          template: 'html-capture',
          generatedAt: new Date(),
          processingTime
        }
      };

      this.notificationService.showCvExported('PDF');
      return result;

    } catch (error) {
      console.error('Error exporting HTML to PDF:', error);
      const result: PdfExportResult = {
        success: false,
        fileName,
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
        metadata: {
          pages: 0,
          template: 'html-capture',
          generatedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      };

      this.notificationService.showError('Error al capturar el CV como PDF');
      return result;
    }
  }

  /**
   * Obtiene las plantillas disponibles
   */
  getAvailableTemplates(): CvTemplate[] {
    return [...this.templates];
  }

  /**
   * Obtiene una plantilla específica
   */
  getTemplate(templateId: string): CvTemplate {
    const template = this.templates.find(t => t.id === templateId);
    return template || this.templates[0]; // Fallback a la primera plantilla
  }

  /**
   * Previsualiza una plantilla
   */
  async previewTemplate(
    templateId: string,
    userProfile: UserProfile,
    experiences: WorkExperience[],
    education: EducationEntry[]
  ): Promise<string> {
    // TODO: Implementar previsualización de plantilla
    // Retornar URL de imagen de previsualización
    return `/assets/templates/${templateId}-preview.png`;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Genera el contenido del PDF según la plantilla
   */
  private async generatePdfContent(
    pdf: jsPDF,
    userProfile: UserProfile,
    experiences: WorkExperience[],
    education: EducationEntry[],
    config: PdfExportConfig,
    template: CvTemplate
  ): Promise<void> {
    let yPosition = config.margins.top;

    // Configurar fuentes y colores
    this.setupPdfStyles(pdf, template);

    // Generar header con información personal
    if (config.sections.personalInfo) {
      yPosition = this.generatePersonalInfoSection(pdf, userProfile, template, yPosition);
    }

    // Generar sección de experiencia
    if (config.sections.experience && experiences.length > 0) {
      yPosition = this.generateExperienceSection(pdf, experiences, template, yPosition);
    }

    // Generar sección de educación
    if (config.sections.education && education.length > 0) {
      yPosition = this.generateEducationSection(pdf, education, template, yPosition);
    }

    // Agregar footer
    this.generateFooter(pdf, template);
  }

  /**
   * Configura estilos del PDF
   */
  private setupPdfStyles(pdf: jsPDF, template: CvTemplate): void {
    // Configurar fuente por defecto
    pdf.setFont(template.fonts.body);
    pdf.setFontSize(template.fonts.size.body);
    pdf.setTextColor(template.colors.text);
  }

  /**
   * Genera la sección de información personal
   */
  private generatePersonalInfoSection(
    pdf: jsPDF,
    userProfile: UserProfile,
    template: CvTemplate,
    yPosition: number
  ): number {
    // Título principal
    pdf.setFont(template.fonts.heading, 'bold');
    pdf.setFontSize(template.fonts.size.h1);
    pdf.setTextColor(template.colors.primary);
    pdf.text(`${userProfile.firstName} ${userProfile.lastName}`, 20, yPosition);
    yPosition += 15;

    // Información de contacto
    pdf.setFont(template.fonts.body);
    pdf.setFontSize(template.fonts.size.body);
    pdf.setTextColor(template.colors.text);

    if (userProfile.email) {
      pdf.text(`Email: ${userProfile.email}`, 20, yPosition);
      yPosition += 8;
    }

    // Teléfono comentado - propiedad no existe en UserProfile
    // if (userProfile.phone) {
    //   pdf.text(`Teléfono: ${userProfile.phone}`, 20, yPosition);
    //   yPosition += 8;
    // }

    return yPosition + template.layout.sectionSpacing;
  }

  /**
   * Genera la sección de experiencia laboral
   */
  private generateExperienceSection(
    pdf: jsPDF,
    experiences: WorkExperience[],
    template: CvTemplate,
    yPosition: number
  ): number {
    // Título de sección
    pdf.setFont(template.fonts.heading, 'bold');
    pdf.setFontSize(template.fonts.size.h2);
    pdf.setTextColor(template.colors.primary);
    pdf.text('Experiencia Laboral', 20, yPosition);
    yPosition += 12;

    // Línea separadora
    pdf.setDrawColor(template.colors.accent);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 8;

    // Listar experiencias
    const sortedExperiences = this.transformService.sortExperiencesByDate(experiences);
    
    for (const experience of sortedExperiences) {
      yPosition = this.generateExperienceItem(pdf, experience, template, yPosition);
      
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    }

    return yPosition + template.layout.sectionSpacing;
  }

  /**
   * Genera un item de experiencia
   */
  private generateExperienceItem(
    pdf: jsPDF,
    experience: WorkExperience,
    template: CvTemplate,
    yPosition: number
  ): number {
    // Puesto y empresa
    pdf.setFont(template.fonts.heading, 'bold');
    pdf.setFontSize(template.fonts.size.h3);
    pdf.setTextColor(template.colors.text);
    pdf.text(experience.position, 20, yPosition);
    yPosition += 6;

    pdf.setFont(template.fonts.body);
    pdf.setFontSize(template.fonts.size.body);
    pdf.setTextColor(template.colors.secondary);
    pdf.text(experience.company, 20, yPosition);
    yPosition += 6;

    // Fechas
    const dateRange = this.transformService.formatDateRangeForDisplay(
      experience.startDate,
      experience.endDate,
      experience.isCurrentJob
    );
    pdf.text(dateRange, 20, yPosition);
    yPosition += 8;

    // Descripción
    if (experience.description) {
      pdf.setTextColor(template.colors.text);
      const lines = pdf.splitTextToSize(experience.description, 150);
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 5;
    }

    return yPosition + 8;
  }

  /**
   * Genera la sección de educación
   */
  private generateEducationSection(
    pdf: jsPDF,
    education: EducationEntry[],
    template: CvTemplate,
    yPosition: number
  ): number {
    // Título de sección
    pdf.setFont(template.fonts.heading, 'bold');
    pdf.setFontSize(template.fonts.size.h2);
    pdf.setTextColor(template.colors.primary);
    pdf.text('Educación', 20, yPosition);
    yPosition += 12;

    // Línea separadora
    pdf.setDrawColor(template.colors.accent);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 8;

    // Listar educación
    const sortedEducation = this.transformService.sortEducationByDate(education);
    
    for (const edu of sortedEducation) {
      yPosition = this.generateEducationItem(pdf, edu, template, yPosition);
      
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    }

    return yPosition + template.layout.sectionSpacing;
  }

  /**
   * Genera un item de educación
   */
  private generateEducationItem(
    pdf: jsPDF,
    education: EducationEntry,
    template: CvTemplate,
    yPosition: number
  ): number {
    // Título y institución
    pdf.setFont(template.fonts.heading, 'bold');
    pdf.setFontSize(template.fonts.size.h3);
    pdf.setTextColor(template.colors.text);
    pdf.text(education.title, 20, yPosition);
    yPosition += 6;

    pdf.setFont(template.fonts.body);
    pdf.setFontSize(template.fonts.size.body);
    pdf.setTextColor(template.colors.secondary);
    pdf.text(education.institution, 20, yPosition);
    yPosition += 6;

    // Fechas
    const dateRange = this.transformService.formatDateRangeForDisplay(
      education.startDate,
      education.endDate,
      education.isOngoing
    );
    pdf.text(dateRange, 20, yPosition);
    yPosition += 8;

    return yPosition + 6;
  }

  /**
   * Genera el footer del PDF
   */
  private generateFooter(pdf: jsPDF, template: CvTemplate): void {
    const pageCount = 1; // Simplificado
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont(template.fonts.body);
      pdf.setFontSize(template.fonts.size.small);
      pdf.setTextColor(template.colors.secondary);
      
      const footerText = `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')}`;
      const textWidth = pdf.getTextWidth(footerText);
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.text(footerText, (pageWidth - textWidth) / 2, 285);
    }
  }

  /**
   * Genera el nombre del archivo PDF
   */
  private generateFileName(userProfile: UserProfile, template: string): string {
    const name = `${userProfile.firstName}_${userProfile.lastName}`.replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `CV_${name}_${template}_${date}.pdf`;
  }
}
