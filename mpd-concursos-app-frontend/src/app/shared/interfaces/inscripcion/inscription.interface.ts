import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

export interface IInscription {
  id: string;
  contestId: number;
  userId: string;
  state: InscripcionState;
  createdAt: Date;
  updatedAt: Date;
  observations?: string;
}

export interface IInscriptionRequest {
  contestId: number;
}

export interface IInscriptionResponse {
  id: string;
  contestId: number;
  userId: string;
  state: InscripcionState;
  inscriptionDate: Date;
}

export interface IInscriptionStatusResponse {
  status: InscripcionState;
  message?: string;
}

export interface IInscriptionUpdateRequest {
  state: InscripcionState;
  observations?: string;
} 