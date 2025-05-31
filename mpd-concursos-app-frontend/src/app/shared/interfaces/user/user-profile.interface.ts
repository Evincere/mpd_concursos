export interface Experiencia {
  id?: string;
  empresa: string;
  cargo: string;
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion?: string;
  certificadoId?: string;
  comentario?: string;
  documentUrl?: string;
}

export interface Educacion {
  tipo: string;
  estado: string;
  titulo: string;
  institucion: string;
  fechaEmision?: Date;
  documentoId?: string;
  duracionAnios?: number;
  promedio?: number;
  temaTesis?: string;
  cargaHoraria?: number;
  evaluacionFinal?: boolean;
  tipoActividad?: string;
  caracter?: string;
  lugarFechaExposicion?: string;
  comentarios?: string;
  descripcion?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface Habilidad {
  nombre: string;
  nivel: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  dni: string;
  cuit: string;
  firstName: string;
  lastName: string;
  telefono?: string;
  direccion?: string;
  experiencias?: Experiencia[];
  educacion?: Educacion[];
  habilidades?: Habilidad[];
  centroDeVida?: {
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}
