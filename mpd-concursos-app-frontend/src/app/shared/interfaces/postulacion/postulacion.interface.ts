export interface Postulacion {
    id?: number;
    concursoId: number;
    userId?: number;
    estado: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    fechaPostulacion: string;
    concurso?: {
        titulo: string;
        cargo: string;
        dependencia: string;
    };
}

export interface PostulacionRequest {
    contestId: number;
}

export interface PostulacionResponse {
    content: Postulacion[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
} 