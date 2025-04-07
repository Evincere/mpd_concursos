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
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  comentarios?: string;
  archivoUrl?: string;
  usuarioId?: string;
  validadoPor?: string;
  fechaValidacion?: Date;
  motivoRechazo?: string;
}

export interface DocumentoResponse {
  id: string;
  mensaje: string;
  documento: DocumentoUsuario;
}