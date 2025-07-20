export enum EstadoDocumento {
  PENDIENTE = 'PENDING',
  APROBADO = 'APPROVED',
  RECHAZADO = 'REJECTED'
}

export enum EstadoProcesamiento {
  SUBIENDO = 'UPLOADING',
  PROCESANDO = 'PROCESSING',
  COMPLETADO = 'UPLOAD_COMPLETE',
  ERROR = 'UPLOAD_FAILED'
}

export interface TipoDocumento {
  id: string;
  code: string;
  nombre: string;
  descripcion?: string;
  requerido: boolean;
  orden?: number;
  parentId?: string;
  activo?: boolean;
}

export interface DocumentoUsuario {
  id?: string;
  tipoDocumentoId: string;
  tipoDocumento?: TipoDocumento;
  nombreArchivo: string;
  fechaCarga: Date;
  estado?: EstadoDocumento; // Estado de negocio (puede ser null durante procesamiento)
  estadoProcesamiento?: EstadoProcesamiento; // Estado técnico
  comentarios?: string;
  archivoUrl?: string;
  url?: string; // Alias para archivoUrl para compatibilidad
  usuarioId?: string;
  validadoPor?: string;
  fechaValidacion?: Date;
  motivoRechazo?: string;
  mensajeError?: string; // Mensaje de error para estado UPLOAD_FAILED

  // Propiedades para manejo de duplicidad y versionado
  isArchived?: boolean; // Indica si el documento está archivado
  version?: number; // Versión del documento
  replacedDocumentId?: string; // ID del documento que reemplaza a este
  archivedAt?: Date; // Fecha de archivado
  archivedBy?: string; // Usuario que archivó el documento

  // Propiedades calculadas para UI
  hasDuplicates?: boolean; // Indica si tiene múltiples versiones
  isLatestVersion?: boolean; // Indica si es la versión más reciente
}

export interface DocumentoResponse {
  id: string;
  mensaje: string;
  documento: DocumentoUsuario;
}

export interface DocumentoVersion {
  id: string;
  nombreArchivo: string;
  estado: string;
  fechaCarga: Date;
  comentarios?: string;
  numeroVersion: number;
  esArchivado: boolean;
  fechaArchivado?: Date;
  archivedBy?: string;
}

export interface DocumentoSummary {
  // Información del documento más reciente (activo)
  id: string;
  tipoDocumentoId: string;
  tipoDocumento: TipoDocumento;
  nombreArchivo: string;
  contentType: string;
  estado: string;
  comentarios?: string;
  fechaCarga: Date;
  validadoPor?: string;
  fechaValidacion?: Date;
  motivoRechazo?: string;

  // Información del historial de versiones
  totalVersiones: number;
  versionActual: number;
  tieneVersionesAnteriores: boolean;
  versionesAnteriores: DocumentoVersion[];

  // Información adicional para UI
  esDocumentoActivo: boolean;
  estadoDetallado: string; // "Activo", "Reemplazado", "Archivado"
}

export interface EstadoColaDocumento {
  queueId: string;
  documentId?: string;
  documentTypeId?: string;
  fileName: string;
  userId?: string;
  processingStatus: EstadoProcesamiento; // Estado técnico
  status?: EstadoDocumento; // Estado de negocio
  progress: number;
  errorMessage?: string;
  lastUpdated?: number;
}

export interface DocumentoReplaceResponse {
  newDocument: DocumentoUsuario | null;
  previousDocument: DocumentoUsuario | null;
  warning?: string;
  message: string;
  impactedEntities: string[];
}
