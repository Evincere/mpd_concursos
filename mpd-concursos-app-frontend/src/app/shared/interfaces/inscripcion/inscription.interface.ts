import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

export interface IInscription {
  id: string;
  contestId: number;
  userId: string;
  state: InscripcionState;
  createdAt: Date;
  updatedAt: Date;
  observations?: string;
  currentStep?: InscriptionStep;
  preferences?: IInscriptionPreferences;
}

export interface IInscriptionPreferences {
  centroDeVida: string;
  selectedCircunscripciones: string[];
  acceptedTerms: boolean;
  confirmedPersonalData: boolean;
  termsAcceptanceDate?: Date;
  dataConfirmationDate?: Date;
}

export interface IInscriptionRequest {
  contestId: number;
}

export interface IInscriptionResponse {
  id: string;
  contestId: number;
  userId: string;
  status: string;
  inscriptionDate: string;
  createdAt: string;
  updatedAt: string;
  currentStep?: string;
  observations?: string;
}

export interface IInscriptionStatusResponse {
  status: InscripcionState;
  message?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface IInscriptionUpdateRequest {
  state: InscripcionState;
  observations?: string;
  currentStep?: InscriptionStep;
}

export interface IInscriptionStepRequest {
  step: InscriptionStep;
  centroDeVida?: string;
  selectedCircunscripciones?: string[];
  acceptedTerms?: boolean;
  confirmedPersonalData?: boolean;
}