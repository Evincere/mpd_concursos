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