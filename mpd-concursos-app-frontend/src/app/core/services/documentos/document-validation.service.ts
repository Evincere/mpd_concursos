/**
 * Servicio de Validación para Documentos
 * 
 * @description Servicio especializado para validación de documentos siguiendo SRP
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { TipoDocumento, DocumentoUsuario } from '../../models/documento.model';

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

/**
 * Error de validación
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Advertencia de validación
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Reglas de validación
 */
export interface ValidationRules {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  minFileSize: number;
  requiresSpecificDimensions?: {
    width: number;
    height: number;
    tolerance: number;
  };
  requiresSpecificPages?: {
    min: number;
    max: number;
  };
}

/**
 * Contexto de validación
 */
export interface ValidationContext {
  documentType: TipoDocumento;
  existingDocuments: DocumentoUsuario[];
  userRole: string;
  isUpdate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentValidationService {

  // Reglas por defecto
  private readonly defaultRules: ValidationRules = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 1024, // 1KB
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf']
  };

  // Reglas específicas por tipo de documento
  private readonly typeSpecificRules: Map<string, Partial<ValidationRules>> = new Map([
    ['DNI_FRENTE', {
      maxFileSize: 5 * 1024 * 1024, // 5MB para DNI
      requiresSpecificDimensions: { width: 1000, height: 600, tolerance: 10 }
    }],
    ['DNI_DORSO', {
      maxFileSize: 5 * 1024 * 1024,
      requiresSpecificDimensions: { width: 1000, height: 600, tolerance: 10 }
    }],
    ['CV', {
      maxFileSize: 15 * 1024 * 1024, // 15MB para CV
      requiresSpecificPages: { min: 1, max: 10 }
    }],
    ['TITULO', {
      maxFileSize: 8 * 1024 * 1024,
      requiresSpecificPages: { min: 1, max: 3 }
    }]
  ]);

  constructor() {
    console.log('[DocumentValidationService] Servicio inicializado');
  }

  /**
   * Valida un archivo antes del upload
   * @param file Archivo a validar
   * @param context Contexto de validación
   */
  validateFile(file: File, context: ValidationContext): Observable<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Obtener reglas aplicables
      const rules = this.getRulesForDocumentType(context.documentType);

      // Validaciones básicas
      this.validateBasicFileProperties(file, rules, errors);
      
      // Validaciones específicas del tipo
      this.validateDocumentTypeSpecific(file, context, rules, errors, warnings);
      
      // Validaciones de negocio
      this.validateBusinessRules(file, context, errors, warnings);

      // Calcular score
      const score = this.calculateValidationScore(errors, warnings);

      const result: ValidationResult = {
        isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
        errors,
        warnings,
        score
      };

      console.log(`[DocumentValidationService] Validación completada: ${result.isValid ? 'VÁLIDO' : 'INVÁLIDO'} (Score: ${score})`);
      
      return of(result);

    } catch (error) {
      console.error('[DocumentValidationService] Error durante validación:', error);
      return throwError(() => error);
    }
  }

  /**
   * Valida múltiples archivos
   * @param files Archivos a validar
   * @param context Contexto de validación
   */
  validateMultipleFiles(
    files: File[], 
    context: ValidationContext
  ): Observable<Map<string, ValidationResult>> {
    
    const results = new Map<string, ValidationResult>();
    
    files.forEach(file => {
      this.validateFile(file, context).subscribe(result => {
        results.set(file.name, result);
      });
    });

    return of(results);
  }

  /**
   * Valida duplicados
   * @param file Archivo a validar
   * @param existingDocuments Documentos existentes
   */
  validateDuplicates(file: File, existingDocuments: DocumentoUsuario[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Verificar nombre duplicado
    const duplicateName = existingDocuments.find(doc => 
      doc.nombreArchivo === file.name
    );

    if (duplicateName) {
      errors.push({
        code: 'DUPLICATE_NAME',
        message: `Ya existe un documento con el nombre "${file.name}"`,
        severity: 'high'
      });
    }

    // Verificar tamaño similar (posible duplicado)
    const similarSize = existingDocuments.find(doc => 
      Math.abs(doc.tamanoArchivo - file.size) < 1024 // Diferencia menor a 1KB
    );

    if (similarSize) {
      warnings.push({
        code: 'SIMILAR_SIZE',
        message: `Existe un documento con tamaño similar (${this.formatBytes(similarSize.tamanoArchivo)})`,
        suggestion: 'Verifique que no sea un duplicado'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0
    };
  }

  /**
   * Obtiene reglas para un tipo de documento
   */
  private getRulesForDocumentType(documentType: TipoDocumento): ValidationRules {
    const specificRules = this.typeSpecificRules.get(documentType.codigo) || {};
    return { ...this.defaultRules, ...specificRules };
  }

  /**
   * Valida propiedades básicas del archivo
   */
  private validateBasicFileProperties(
    file: File, 
    rules: ValidationRules, 
    errors: ValidationError[]
  ): void {
    
    // Validar nombre
    if (!file.name || file.name.trim().length === 0) {
      errors.push({
        code: 'INVALID_NAME',
        message: 'El archivo debe tener un nombre válido',
        field: 'name',
        severity: 'critical'
      });
    }

    // Validar tamaño máximo
    if (file.size > rules.maxFileSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `El archivo excede el tamaño máximo de ${this.formatBytes(rules.maxFileSize)}`,
        field: 'size',
        severity: 'critical'
      });
    }

    // Validar tamaño mínimo
    if (file.size < rules.minFileSize) {
      errors.push({
        code: 'FILE_TOO_SMALL',
        message: `El archivo es demasiado pequeño (mínimo: ${this.formatBytes(rules.minFileSize)})`,
        field: 'size',
        severity: 'high'
      });
    }

    // Validar tipo MIME
    if (!rules.allowedMimeTypes.includes(file.type)) {
      errors.push({
        code: 'INVALID_MIME_TYPE',
        message: `Tipo de archivo no permitido. Tipos permitidos: ${rules.allowedMimeTypes.join(', ')}`,
        field: 'type',
        severity: 'critical'
      });
    }

    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !rules.allowedExtensions.includes(extension)) {
      errors.push({
        code: 'INVALID_EXTENSION',
        message: `Extensión no permitida. Extensiones permitidas: ${rules.allowedExtensions.join(', ')}`,
        field: 'extension',
        severity: 'critical'
      });
    }
  }

  /**
   * Valida reglas específicas del tipo de documento
   */
  private validateDocumentTypeSpecific(
    file: File,
    context: ValidationContext,
    rules: ValidationRules,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {

    // Validar dimensiones específicas (para imágenes)
    if (rules.requiresSpecificDimensions && file.type.startsWith('image/')) {
      // TODO: Implementar validación de dimensiones usando FileReader
      warnings.push({
        code: 'DIMENSIONS_NOT_VALIDATED',
        message: 'No se pudieron validar las dimensiones de la imagen',
        suggestion: 'Asegúrese de que la imagen tenga las dimensiones correctas'
      });
    }

    // Validar número de páginas (para PDFs)
    if (rules.requiresSpecificPages && file.type === 'application/pdf') {
      // TODO: Implementar validación de páginas usando PDF.js
      warnings.push({
        code: 'PAGES_NOT_VALIDATED',
        message: 'No se pudo validar el número de páginas del PDF',
        suggestion: `Asegúrese de que el PDF tenga entre ${rules.requiresSpecificPages.min} y ${rules.requiresSpecificPages.max} páginas`
      });
    }

    // Validaciones específicas por tipo
    switch (context.documentType.codigo) {
      case 'DNI_FRENTE':
      case 'DNI_DORSO':
        this.validateDNI(file, context, errors, warnings);
        break;
      case 'CV':
        this.validateCV(file, context, errors, warnings);
        break;
      case 'TITULO':
        this.validateTitulo(file, context, errors, warnings);
        break;
    }
  }

  /**
   * Valida reglas de negocio
   */
  private validateBusinessRules(
    file: File,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {

    // Verificar si ya existe un documento del mismo tipo
    const existingOfSameType = context.existingDocuments.find(doc => 
      doc.tipoDocumento.id === context.documentType.id
    );

    if (existingOfSameType && !context.isUpdate) {
      if (context.documentType.requerido) {
        warnings.push({
          code: 'REPLACING_REQUIRED_DOCUMENT',
          message: 'Está reemplazando un documento requerido',
          suggestion: 'Asegúrese de que el nuevo documento sea correcto'
        });
      } else {
        warnings.push({
          code: 'REPLACING_OPTIONAL_DOCUMENT',
          message: 'Está reemplazando un documento opcional'
        });
      }
    }

    // Validar límites por usuario
    const userDocumentCount = context.existingDocuments.length;
    if (userDocumentCount >= 50) { // Límite arbitrario
      warnings.push({
        code: 'MANY_DOCUMENTS',
        message: 'Tiene muchos documentos cargados',
        suggestion: 'Considere eliminar documentos innecesarios'
      });
    }
  }

  /**
   * Validaciones específicas para DNI
   */
  private validateDNI(
    file: File,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    
    // Verificar que el nombre del archivo sea descriptivo
    const fileName = file.name.toLowerCase();
    const isFrente = context.documentType.codigo === 'DNI_FRENTE';
    
    if (isFrente && !fileName.includes('frente') && !fileName.includes('front')) {
      warnings.push({
        code: 'DNI_NAMING_SUGGESTION',
        message: 'El nombre del archivo no indica claramente que es el frente del DNI',
        suggestion: 'Considere renombrar el archivo incluyendo "frente" en el nombre'
      });
    }

    if (!isFrente && !fileName.includes('dorso') && !fileName.includes('back')) {
      warnings.push({
        code: 'DNI_NAMING_SUGGESTION',
        message: 'El nombre del archivo no indica claramente que es el dorso del DNI',
        suggestion: 'Considere renombrar el archivo incluyendo "dorso" en el nombre'
      });
    }
  }

  /**
   * Validaciones específicas para CV
   */
  private validateCV(
    file: File,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    
    // Verificar tamaño razonable para CV
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push({
        code: 'CV_LARGE_SIZE',
        message: 'El CV es bastante grande',
        suggestion: 'Considere optimizar el PDF para reducir el tamaño'
      });
    }

    // Verificar nombre descriptivo
    const fileName = file.name.toLowerCase();
    if (!fileName.includes('cv') && !fileName.includes('curriculum')) {
      warnings.push({
        code: 'CV_NAMING_SUGGESTION',
        message: 'El nombre del archivo no indica claramente que es un CV',
        suggestion: 'Considere renombrar el archivo incluyendo "CV" en el nombre'
      });
    }
  }

  /**
   * Validaciones específicas para Título
   */
  private validateTitulo(
    file: File,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    
    // Verificar nombre descriptivo
    const fileName = file.name.toLowerCase();
    if (!fileName.includes('titulo') && !fileName.includes('diploma') && !fileName.includes('certificado')) {
      warnings.push({
        code: 'TITULO_NAMING_SUGGESTION',
        message: 'El nombre del archivo no indica claramente que es un título',
        suggestion: 'Considere renombrar el archivo incluyendo "titulo" o "diploma" en el nombre'
      });
    }
  }

  /**
   * Calcula score de validación
   */
  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;

    // Penalizar errores
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 50;
          break;
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Penalizar advertencias
    warnings.forEach(() => {
      score -= 2;
    });

    return Math.max(0, score);
  }

  /**
   * Formatea bytes a string legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
