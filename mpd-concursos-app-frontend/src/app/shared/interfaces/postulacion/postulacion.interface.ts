import { Contest, ContestStatus } from '../concurso/concurso.interface';

export interface Postulacion {
    id?: string; // Cambiado de number a string para manejar UUIDs
    contestId: number;
    userId?: string;
    estado: PostulationStatus;
    fechaPostulacion: string;
    concurso?: Contest;  // REFACTORING: Usar interface unificada
    attachedDocuments?: AttachedDocument[];
}

// REFACTORING: Interfaces duplicadas eliminadas - usar Contest de concurso.interface.ts

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
    // Estados estándar de inscripción (únicos estados válidos)
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    COMPLETED_WITH_DOCS = 'COMPLETED_WITH_DOCS',
    COMPLETED_PENDING_DOCS = 'COMPLETED_PENDING_DOCS',
    FROZEN = 'FROZEN',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

export enum ContestType {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

// REFACTORING: ContestStatus duplicado eliminado - usar ContestStatus de concurso.interface.ts

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