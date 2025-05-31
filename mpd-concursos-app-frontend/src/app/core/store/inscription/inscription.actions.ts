import { createAction, props } from '@ngrx/store';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

export const setInscriptionStep = createAction(
  '[Inscription] Set Current Step',
  props<{ step: number }>()
);

export const setTermsAccepted = createAction(
  '[Inscription] Set Terms Accepted',
  props<{ accepted: boolean }>()
);

export const setCentroDeVida = createAction(
  '[Inscription] Set Centro De Vida',
  props<{ centroDeVida: string }>()
);

export const setSelectedCircunscripciones = createAction(
  '[Inscription] Set Selected Circunscripciones',
  props<{ circunscripciones: string[] }>()
);

export const setDocumentosCompletos = createAction(
  '[Inscription] Set Documentos Completos',
  props<{ completos: boolean }>()
);

export const setConfirmedPersonalData = createAction(
  '[Inscription] Set Confirmed Personal Data',
  props<{ confirmed: boolean }>()
);

export const saveInscriptionState = createAction(
  '[Inscription] Save State',
  props<{
    inscriptionId: string,
    contestId: number,
    step: InscriptionStep,
    contestTitle?: string
  }>()
);

export const loadInscriptionState = createAction(
  '[Inscription] Load State',
  props<{ inscriptionId: string }>()
);

export const clearInscriptionState = createAction(
  '[Inscription] Clear State',
  props<{ inscriptionId?: string }>()
);

export const inscriptionStateLoaded = createAction(
  '[Inscription] State Loaded',
  props<{
    termsAccepted: boolean,
    centroDeVida: string,
    selectedCircunscripciones: string[],
    documentosCompletos: boolean,
    confirmedPersonalData: boolean,
    currentStep: number,
    contestId: number,
    contestTitle?: string
  }>()
);
