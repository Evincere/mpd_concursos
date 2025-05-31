import { createReducer, on } from '@ngrx/store';
import * as InscriptionActions from './inscription.actions';

export interface InscriptionState {
  currentStep: number;
  termsAccepted: boolean;
  centroDeVida: string;
  selectedCircunscripciones: string[];
  documentosCompletos: boolean;
  confirmedPersonalData: boolean;
  inscriptionId: string | null;
  contestId: number | null;
  contestTitle: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: InscriptionState = {
  currentStep: 1,
  termsAccepted: false,
  centroDeVida: '',
  selectedCircunscripciones: [],
  documentosCompletos: false,
  confirmedPersonalData: false,
  inscriptionId: null,
  contestId: null,
  contestTitle: null,
  loading: false,
  error: null
};

export const inscriptionReducer = createReducer(
  initialState,

  on(InscriptionActions.setInscriptionStep, (state, { step }) => ({
    ...state,
    currentStep: step
  })),

  on(InscriptionActions.setTermsAccepted, (state, { accepted }) => ({
    ...state,
    termsAccepted: accepted
  })),

  on(InscriptionActions.setCentroDeVida, (state, { centroDeVida }) => ({
    ...state,
    centroDeVida
  })),

  on(InscriptionActions.setSelectedCircunscripciones, (state, { circunscripciones }) => ({
    ...state,
    selectedCircunscripciones: circunscripciones
  })),

  on(InscriptionActions.setDocumentosCompletos, (state, { completos }) => ({
    ...state,
    documentosCompletos: completos
  })),

  on(InscriptionActions.setConfirmedPersonalData, (state, { confirmed }) => ({
    ...state,
    confirmedPersonalData: confirmed
  })),

  on(InscriptionActions.saveInscriptionState, (state, { inscriptionId, contestId, contestTitle }) => ({
    ...state,
    inscriptionId,
    contestId,
    contestTitle: contestTitle || state.contestTitle,
    loading: true,
    error: null
  })),

  on(InscriptionActions.loadInscriptionState, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(InscriptionActions.inscriptionStateLoaded, (state, {
    termsAccepted,
    centroDeVida,
    selectedCircunscripciones,
    documentosCompletos,
    confirmedPersonalData,
    currentStep,
    contestId,
    contestTitle
  }) => ({
    ...state,
    termsAccepted,
    centroDeVida,
    selectedCircunscripciones,
    documentosCompletos,
    confirmedPersonalData,
    currentStep,
    contestId,
    contestTitle: contestTitle || state.contestTitle,
    loading: false
  })),

  on(InscriptionActions.clearInscriptionState, (state, { inscriptionId }) => {
    // Si el ID de inscripción coincide con el del estado o no se proporciona un ID, reiniciar el estado
    if (!inscriptionId || inscriptionId === state.inscriptionId) {
      return { ...initialState };
    }
    // Si el ID no coincide, mantener el estado actual
    return state;
  })
);
