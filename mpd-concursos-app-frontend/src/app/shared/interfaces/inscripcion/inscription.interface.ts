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
  state: InscripcionState;
  inscriptionDate: Date;
  currentStep: InscriptionStep;
  preferences?: IInscriptionPreferences;
}

export interface IInscriptionStatusResponse {
  status: InscripcionState;
  message?: string;
}

export interface IInscriptionUpdateRequest {
  state: InscripcionState;
  observations?: string;
}

export interface IInscriptionStepRequest {
  step: InscriptionStep;
  selectedCircunscripciones?: string[];
  acceptedTerms?: boolean;
  confirmedPersonalData?: boolean;
} 