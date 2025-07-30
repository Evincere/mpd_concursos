/**
 * Interfaces para el sistema de documentos de concursos
 * 
 * Define los tipos y estructuras de datos para manejar
 * la disponibilidad y descarga de documentos de concursos
 * (bases y descripciones del puesto).
 * 
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-07
 */

/**
 * Tipos de documentos de concurso disponibles
 */
export enum ContestDocumentType {
  BASES = 'BASES',
  DESCRIPTION = 'DESCRIPTION'
}

/**
 * Información de disponibilidad de documentos para un concurso
 */
export interface ContestDocumentAvailability {
  /** ID del concurso */
  contestId: number;
  
  /** Indica si las bases del concurso están disponibles */
  basesAvailable: boolean;
  
  /** Indica si la descripción del puesto está disponible */
  descriptionAvailable: boolean;
  
  /** URL para descargar las bases (si están disponibles) */
  basesUrl?: string;
  
  /** URL para descargar la descripción (si está disponible) */
  descriptionUrl?: string;
  
  /** Mensaje informativo sobre el estado de los documentos */
  message?: string;
}

/**
 * Información detallada de un documento específico
 */
export interface ContestDocumentInfo {
  /** Tipo de documento */
  type: ContestDocumentType;
  
  /** Nombre del documento */
  name: string;
  
  /** Descripción del documento */
  description: string;
  
  /** Indica si el documento está disponible */
  available: boolean;
  
  /** URL de descarga (si está disponible) */
  downloadUrl?: string;
  
  /** Tamaño del archivo en bytes (si está disponible) */
  fileSize?: number;
  
  /** Fecha de última actualización */
  lastUpdated?: Date;
}

/**
 * Configuración para descarga de documentos
 */
export interface ContestDocumentDownloadConfig {
  /** Tipo de documento a descargar */
  documentType: ContestDocumentType;
  
  /** ID del concurso */
  contestId: number;
  
  /** Si debe abrirse en nueva ventana (default: true) */
  openInNewWindow?: boolean;
  
  /** Si debe forzar descarga en lugar de visualización (default: false) */
  forceDownload?: boolean;
}

/**
 * Respuesta del servicio de disponibilidad de documentos
 */
export interface ContestDocumentAvailabilityResponse {
  /** ID del concurso */
  contestId: number;
  
  /** Indica si las bases están disponibles */
  basesAvailable: boolean;
  
  /** Indica si la descripción está disponible */
  descriptionAvailable: boolean;
  
  /** URL de las bases */
  basesUrl?: string;
  
  /** URL de la descripción */
  descriptionUrl?: string;
  
  /** Mensaje del servidor */
  message?: string;
}

/**
 * Utilidades para trabajar con documentos de concurso
 */
export class ContestDocumentUtils {
  
  /**
   * Obtiene el nombre legible de un tipo de documento
   */
  static getDocumentTypeName(type: ContestDocumentType): string {
    switch (type) {
      case ContestDocumentType.BASES:
        return 'Bases y Condiciones';
      case ContestDocumentType.DESCRIPTION:
        return 'Descripción del Puesto';
      default:
        return 'Documento';
    }
  }
  
  /**
   * Obtiene la descripción de un tipo de documento
   */
  static getDocumentTypeDescription(type: ContestDocumentType): string {
    switch (type) {
      case ContestDocumentType.BASES:
        return 'Bases oficiales del concurso de antecedentes y oposición';
      case ContestDocumentType.DESCRIPTION:
        return 'Descripción detallada del puesto y funciones a desempeñar';
      default:
        return 'Documento del concurso';
    }
  }
  
  /**
   * Genera la URL de descarga para un documento
   */
  static generateDownloadUrl(contestId: number, type: ContestDocumentType): string {
    const filename = type === ContestDocumentType.BASES 
      ? `bases_concurso_${contestId}.pdf`
      : `descripcion_concurso_${contestId}.pdf`;
    
    return `/api/files/contest-bases/${filename}`;
  }
  
  /**
   * Verifica si hay al menos un documento disponible
   */
  static hasAnyDocumentAvailable(availability: ContestDocumentAvailability): boolean {
    return availability.basesAvailable || availability.descriptionAvailable;
  }
  
  /**
   * Verifica si todos los documentos están disponibles
   */
  static hasAllDocumentsAvailable(availability: ContestDocumentAvailability): boolean {
    return availability.basesAvailable && availability.descriptionAvailable;
  }
  
  /**
   * Obtiene un mensaje descriptivo del estado de disponibilidad
   */
  static getAvailabilityMessage(availability: ContestDocumentAvailability): string {
    if (availability.message) {
      return availability.message;
    }
    
    if (this.hasAllDocumentsAvailable(availability)) {
      return 'Todos los documentos están disponibles para descarga';
    } else if (this.hasAnyDocumentAvailable(availability)) {
      return 'Algunos documentos están disponibles para descarga';
    } else {
      return 'Los documentos del concurso aún no se han publicado';
    }
  }
}
