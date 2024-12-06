import { InscripcionState } from '../../../core/models/inscripcion/inscripcion-state.enum';

export interface InscripcionResponse {
    id: string;
    concursoId: string;
    userId: string;
    estado: InscripcionState;
    fechaInscripcion: Date;
}

export interface ElegibilidadResponse {
    elegible: boolean;
    motivo?: string;
    requisitos?: RequisitoInscripcion[];
}

export interface RequisitoInscripcion {
    id: string;
    descripcion: string;
    cumplido: boolean;
}

export interface InscripcionRequest {
    concursoId: string;
    documentos?: DocumentoAdjunto[];
}

export interface DocumentoAdjunto {
    tipo: string;
    archivo: File;
    nombre: string;
}
