import { InscripcionState } from "@core/models/inscripcion/inscripcion-state.enum";

export interface Inscripcion {
  id: string;
  concursoId: string | number; 
  userId: string; 
  state: InscripcionState;
  createdAt: Date;
  updatedAt: Date;
  observations?: string;
}

export interface InscripcionResponse {
    id: string;
    concursoId: string | number;
    userId: string; 
    estado: InscripcionState;
    fechaInscripcion: Date;
}

export interface ElegibilidadResponse {
    elegible: boolean;
    requisitos: RequisitoInscripcion[];
}

export interface RequisitoInscripcion {
    id: string;
    descripcion: string;
    cumplido: boolean;
}

export interface InscripcionRequest {
  contestId: number;
  userId: string;
}

export interface DocumentoAdjunto {
    tipo: string;
    archivo: File;
    nombre: string;
}
