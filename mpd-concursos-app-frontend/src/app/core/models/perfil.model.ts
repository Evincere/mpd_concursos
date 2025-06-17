// Interface for profile photo upload response
export interface ProfilePhotoResponse {
  url: string;
}

// Interface for the user profile
export interface UserProfile {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  domicilio?: string;
  provincia?: string;
  pais?: string;
  fotoPerfil?: string;
  profileImageUrl?: string;
  experiencias?: ExperienciaData[];
  educacion?: EducacionData[];
  habilidades?: HabilidadData[];
  linkedInConectado?: boolean;
}

export interface HabilidadData {
  id?: string;
  nombre: string;
  nivel: string;
}

// Interface for education data
export interface EducacionData {
  id?: string;
  tipo: string;
  estado: string;
  titulo: string;
  institucion: string;
  fechaInicio?: string;
  fechaFin?: string;
  promedio?: number;
  documentoId?: string;
}

// Interface for work experience data
export interface ExperienciaData {
  id?: string;
  empresa: string;
  cargo: string;
  puesto: string;
  descripcion: string;
  fechaInicio: string | Date;
  fechaFin?: string | Date;
  actual: boolean;
  ubicacion?: string;
  documentoId?: string;
  certificadoId?: string;
  comentario?: string;
  documentUrl?: string;
}
