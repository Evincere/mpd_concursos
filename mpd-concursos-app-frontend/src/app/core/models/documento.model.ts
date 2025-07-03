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
