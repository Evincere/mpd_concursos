export interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion?: string;
  requerido: boolean;
  orden?: number;
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
}

export interface DocumentoResponse {
  id: string;
  mensaje: string;
  documento: DocumentoUsuario;
} 