export interface Postulacion {
    id?: number;
    contestId: number;
    userId?: string;
    status: PostulationStatus;
    inscriptionDate: string;
    contest?: Contest;
    attachedDocuments?: AttachedDocument[];
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
    REJECTED = 'REJECTED'
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