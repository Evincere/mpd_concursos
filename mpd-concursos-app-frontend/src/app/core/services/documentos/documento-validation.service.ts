import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, of } from 'rxjs';

export interface DocumentoValidationResult {
  isValid: boolean;
  errors: DocumentoValidationError[];
}

export interface DocumentoValidationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DocumentoValidationConfig {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  minImageResolution?: { width: number, height: number };
  minPdfQuality?: number;
  requiredPages?: { min: number, max: number };
}

/**
 * Interfaz para documentos requeridos unificada
 */
export interface RequiredDocument {
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  tipoDocumentoId: string;
}

/**
 * Resultado de validación de completitud de documentación
 */
export interface DocumentationCompletenessResult {
  allDocumentsComplete: boolean;
  completedCount: number;
  totalCount: number;
  missingDocuments: RequiredDocument[];
  canProceedWithProvisional: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentoValidationService {
  // Configuración por defecto - Solo PDF para documentación oficial
  private defaultConfig: DocumentoValidationConfig = {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    minImageResolution: { width: 800, height: 600 },
    minPdfQuality: 150, // DPI
    requiredPages: { min: 1, max: 50 }
  };

  constructor(
    private loggingService: LoggingService
  ) {
    this.loggingService.debug('[DocumentoValidationService] Servicio inicializado', undefined, 'DocumentoValidationService');
  }

  /**
   * MÉTODO UNIFICADO: Valida la completitud de documentación para inscripción
   * CRITICAL FIX: Solo considera documentos marcados como 'required: true'
   * @param requiredDocuments Lista de documentos requeridos
   * @param provisionalAccepted Si el usuario aceptó inscripción provisional
   * @returns Resultado completo de validación
   */
  validateDocumentationCompleteness(
    requiredDocuments: RequiredDocument[],
    provisionalAccepted: boolean = false
  ): DocumentationCompletenessResult {

    // 🔍 DEBUGGING: Log detallado de todos los documentos recibidos
    this.loggingService.debug('[DocumentoValidationService] === ANÁLISIS DE DOCUMENTACIÓN ===', {
      totalDocuments: requiredDocuments?.length || 0,
      provisionalAccepted,
      allDocuments: requiredDocuments?.map(doc => ({
        title: doc.title,
        required: doc.required,
        completed: doc.completed,
        tipoDocumentoId: doc.tipoDocumentoId
      }))
    }, 'DocumentoValidationService');

    if (!requiredDocuments || requiredDocuments.length === 0) {
      this.loggingService.warn('[DocumentoValidationService] No hay documentos requeridos para validar', undefined, 'DocumentoValidationService');
      return {
        allDocumentsComplete: true,
        completedCount: 0,
        totalCount: 0,
        missingDocuments: [],
        canProceedWithProvisional: true
      };
    }

    // ✅ CRITICAL FIX: Filtrar SOLO documentos obligatorios (required: true)
    const obligatoryDocuments = requiredDocuments.filter(doc => doc.required === true);

    // 🔍 DEBUGGING: Log detallado de documentos obligatorios
    this.loggingService.debug('[DocumentoValidationService] === DOCUMENTOS OBLIGATORIOS ===', {
      totalObligatory: obligatoryDocuments.length,
      obligatoryDocuments: obligatoryDocuments.map(doc => ({
        title: doc.title,
        completed: doc.completed,
        tipoDocumentoId: doc.tipoDocumentoId
      }))
    }, 'DocumentoValidationService');

    if (obligatoryDocuments.length === 0) {
      this.loggingService.debug('[DocumentoValidationService] No hay documentos obligatorios definidos', undefined, 'DocumentoValidationService');
      return {
        allDocumentsComplete: true,
        completedCount: 0,
        totalCount: 0,
        missingDocuments: [],
        canProceedWithProvisional: true
      };
    }

    // ✅ Calcular completitud basado SOLO en documentos obligatorios
    const completedObligatoryDocuments = obligatoryDocuments.filter(doc => doc.completed);
    const missingObligatoryDocuments = obligatoryDocuments.filter(doc => !doc.completed);
    const allObligatoryDocumentsComplete = missingObligatoryDocuments.length === 0;

    // 🔍 DEBUGGING: Log del resultado de completitud
    this.loggingService.debug('[DocumentoValidationService] === RESULTADO DE COMPLETITUD ===', {
      completedCount: completedObligatoryDocuments.length,
      totalCount: obligatoryDocuments.length,
      allComplete: allObligatoryDocumentsComplete,
      missingCount: missingObligatoryDocuments.length,
      missingDocuments: missingObligatoryDocuments.map(doc => doc.title)
    }, 'DocumentoValidationService');

    const result: DocumentationCompletenessResult = {
      allDocumentsComplete: allObligatoryDocumentsComplete,
      completedCount: completedObligatoryDocuments.length,
      totalCount: obligatoryDocuments.length,
      missingDocuments: missingObligatoryDocuments,
      canProceedWithProvisional: allObligatoryDocumentsComplete || provisionalAccepted
    };

    this.loggingService.debug(
      `[DocumentoValidationService] Validación completitud: ${result.completedCount}/${result.totalCount} obligatorios completos, provisional: ${provisionalAccepted}`,
      { result, totalDocuments: requiredDocuments.length, obligatoryDocuments: obligatoryDocuments.length },
      'DocumentoValidationService'
    );

    return result;
  }

  /**
   * Valida si existen documentos base obligatorios en la lista
   * @param requiredDocuments Lista de documentos requeridos
   * @returns true si contiene documentos base obligatorios
   */
  validateMandatoryBaseDocuments(requiredDocuments: RequiredDocument[]): boolean {
    const mandatoryBaseDocs = ['dni', 'cuil', 'antecedentes'];

    const hasMandatoryDocs = mandatoryBaseDocs.some(baseName =>
      requiredDocuments.some(doc =>
        doc.tipoDocumentoId.toLowerCase().includes(baseName) ||
        doc.title.toLowerCase().includes(baseName)
      )
    );

    if (!hasMandatoryDocs) {
      this.loggingService.warn(
        '[DocumentoValidationService] No se encontraron documentos base obligatorios (DNI, CUIL, Antecedentes)',
        { requiredDocuments },
        'DocumentoValidationService'
      );
    }

    return hasMandatoryDocs;
  }

  /**
   * Calcula el progreso de documentación como porcentaje
   * CRITICAL FIX: Solo considera documentos marcados como 'required: true'
   * @param requiredDocuments Lista de documentos requeridos
   * @returns Porcentaje de progreso (0-100)
   */
  calculateDocumentationProgress(requiredDocuments: RequiredDocument[]): number {
    if (!requiredDocuments || requiredDocuments.length === 0) {
      return 100;
    }

    // ✅ CRITICAL FIX: Filtrar SOLO documentos obligatorios (required: true)
    const obligatoryDocuments = requiredDocuments.filter(doc => doc.required === true);

    if (obligatoryDocuments.length === 0) {
      return 100; // Si no hay documentos obligatorios, progreso es 100%
    }

    const completedCount = obligatoryDocuments.filter(doc => doc.completed).length;
    return Math.round((completedCount / obligatoryDocuments.length) * 100);
  }

  /**
   * Valida un archivo según la configuración proporcionada
   * @param file Archivo a validar
   * @param config Configuración de validación (opcional)
   */
  validateFile(file: File, config?: Partial<DocumentoValidationConfig>): DocumentoValidationResult {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const errors: DocumentoValidationError[] = [];

    // Validar tamaño
    if (file.size > mergedConfig.maxSizeBytes!) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `El archivo excede el tamaño máximo permitido de ${this.formatBytes(mergedConfig.maxSizeBytes!)}`,
        details: {
          actualSize: file.size,
          maxSize: mergedConfig.maxSizeBytes,
          formattedActualSize: this.formatBytes(file.size),
          formattedMaxSize: this.formatBytes(mergedConfig.maxSizeBytes!)
        }
      });
    }

    // Validar tipo
    if (!mergedConfig.allowedTypes!.includes(file.type)) {
      errors.push({
        code: 'INVALID_FILE_TYPE',
        message: `Tipo de archivo no permitido. Los tipos permitidos son: ${this.formatAllowedTypes(mergedConfig.allowedTypes!)}`,
        details: {
          actualType: file.type,
          allowedTypes: mergedConfig.allowedTypes
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida la resolución de una imagen
   * @param file Archivo de imagen a validar
   * @param minResolution Resolución mínima requerida
   */
  validateImageResolution(file: File, minResolution = this.defaultConfig.minImageResolution): Observable<DocumentoValidationResult> {
    if (!file.type.startsWith('image/')) {
      return of({
        isValid: false,
        errors: [{
          code: 'NOT_AN_IMAGE',
          message: 'El archivo no es una imagen'
        }]
      });
    }

    return new Observable<DocumentoValidationResult>(observer => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const errors: DocumentoValidationError[] = [];

        if (img.width < minResolution!.width || img.height < minResolution!.height) {
          errors.push({
            code: 'LOW_RESOLUTION',
            message: `La resolución de la imagen es demasiado baja. Mínimo requerido: ${minResolution!.width}x${minResolution!.height}px`,
            details: {
              actualWidth: img.width,
              actualHeight: img.height,
              minWidth: minResolution!.width,
              minHeight: minResolution!.height
            }
          });
        }

        observer.next({
          isValid: errors.length === 0,
          errors
        });
        observer.complete();
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        observer.next({
          isValid: false,
          errors: [{
            code: 'IMAGE_LOAD_ERROR',
            message: 'No se pudo cargar la imagen para validar su resolución'
          }]
        });
        observer.complete();
      };

      img.src = objectUrl;
    });
  }

  /**
   * Detecta si una imagen está borrosa o tiene baja calidad
   * @param file Archivo de imagen a analizar
   */
  detectBlurryImage(file: File): Observable<DocumentoValidationResult> {
    if (!file.type.startsWith('image/')) {
      return of({
        isValid: false,
        errors: [{
          code: 'NOT_AN_IMAGE',
          message: 'El archivo no es una imagen'
        }]
      });
    }

    return new Observable<DocumentoValidationResult>(observer => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Crear un canvas para analizar la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          observer.next({
            isValid: false,
            errors: [{
              code: 'CANVAS_ERROR',
              message: 'No se pudo analizar la calidad de la imagen'
            }]
          });
          observer.complete();
          return;
        }

        // Redimensionar para análisis (para mejorar rendimiento)
        const MAX_SIZE = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Algoritmo simple para detectar borrosidad
        // Calculamos la varianza de los valores de los píxeles
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convertir a escala de grises y calcular varianza
        let sum = 0;
        let sumSquared = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Convertir RGB a escala de grises
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += gray;
          sumSquared += gray * gray;
          count++;
        }

        const mean = sum / count;
        const variance = (sumSquared / count) - (mean * mean);

        // Umbral de varianza para considerar una imagen borrosa
        // Este valor puede necesitar ajustes según las pruebas
        const BLUR_THRESHOLD = 500;

        const isBlurry = variance < BLUR_THRESHOLD;

        observer.next({
          isValid: !isBlurry,
          errors: isBlurry ? [{
            code: 'BLURRY_IMAGE',
            message: 'La imagen parece estar borrosa o tener baja calidad',
            details: {
              variance,
              threshold: BLUR_THRESHOLD
            }
          }] : []
        });
        observer.complete();
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        observer.next({
          isValid: false,
          errors: [{
            code: 'IMAGE_LOAD_ERROR',
            message: 'No se pudo cargar la imagen para analizar su calidad'
          }]
        });
        observer.complete();
      };

      img.src = objectUrl;
    });
  }

  /**
   * Formatea un tamaño en bytes a una representación legible
   * @param bytes Tamaño en bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatea los tipos de archivo permitidos a una representación legible
   * @param types Array de tipos MIME
   */
  private formatAllowedTypes(types: string[]): string {
    return types.map(type => {
      switch (type) {
        case 'application/pdf':
          return 'PDF';
        case 'image/jpeg':
        case 'image/jpg':
          return 'JPG';
        case 'image/png':
          return 'PNG';
        default:
          return type;
      }
    }).join(', ');
  }
}
