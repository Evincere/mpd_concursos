export interface Postulacion {
    id?: string; // Cambiado de number a string para manejar UUIDs
    contestId: number;
    userId?: string;
    estado: PostulationStatus;
    fechaPostulacion: string;
    concurso?: Concurso;
    attachedDocuments?: AttachedDocument[];
}

export interface Concurso {
    id: number;
    titulo: string;
    cargo: string;
    dependencia: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    results?: ContestResults;
    resolution?: Resolution;
    requirements?: Requirements;
    category: string;
    class: string;
    status: ContestStatus;
}

export interface Contest {
    id: number;
    title: string;
    position: string;
    department: string;
    category: string;
    class: string;
    type: ContestType;
    status: ContestStatus;
    startDate: string;
    endDate: string;
    resolution: Resolution;
    requirements?: Requirements;
    results?: ContestResults;
}

export interface Resolution {
    number: string;
    file: string;
}

export interface Requirements {
    summary: string;
    file?: string;
}

export interface ContestResults {
    stages: ContestStage[];
    finalPosition?: number;
    totalParticipants?: number;
    selected?: boolean;
}

export interface ContestStage {
    name: string;
    score?: number;
    maxScore: number;
    status: StageStatus;
}

export interface AttachedDocument {
    id: number;
    name: string;
    type: string;
    url: string;
}

export enum PostulationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    ACTIVE = 'ACTIVE',
    IN_PROCESS = 'IN_PROCESS',
    NO_INSCRIPTO = 'NO_INSCRIPTO'
}

export enum ContestType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

export enum ContestStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    IN_PROCESS = 'IN_PROCESS',
    FAILED = 'FAILED',
    FINISHED = 'FINISHED'
}

export enum StageStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    NOT_REQUIRED = 'NOT_REQUIRED'
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

export interface PostulacionError {
    status: number;
    message: string;
    error?: string;
    timestamp?: string;
}

export interface CancelInscriptionResponse {
    success: boolean;
    message: string;
    data?: any;
}