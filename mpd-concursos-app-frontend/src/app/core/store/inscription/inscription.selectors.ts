import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InscriptionState } from './inscription.reducer';

export const selectInscriptionState = createFeatureSelector<InscriptionState>('inscription');

export const selectCurrentStep = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.currentStep
);

export const selectTermsAccepted = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.termsAccepted
);

export const selectSelectedCircunscripciones = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.selectedCircunscripciones
);

export const selectDocumentosCompletos = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.documentosCompletos
);

export const selectConfirmedPersonalData = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.confirmedPersonalData
);

export const selectInscriptionId = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.inscriptionId
);

export const selectContestId = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.contestId
);

export const selectContestTitle = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.contestTitle
);

export const selectLoading = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.loading
);

export const selectError = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => state.error
);

export const selectCanProceedToNextStep = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => {
    switch (state.currentStep) {
      case 1:
        return state.termsAccepted;
      case 2:
        return state.selectedCircunscripciones.length > 0;
      case 3:
        return state.documentosCompletos;
      case 4:
        return state.confirmedPersonalData;
      default:
        return false;
    }
  }
);

export const selectFormData = createSelector(
  selectInscriptionState,
  (state: InscriptionState) => ({
    termsAccepted: state.termsAccepted,
    selectedCircunscripciones: state.selectedCircunscripciones,
    documentosCompletos: state.documentosCompletos,
    confirmedPersonalData: state.confirmedPersonalData,
    currentStep: state.currentStep,
    contestId: state.contestId,
    contestTitle: state.contestTitle,
    inscriptionId: state.inscriptionId
  })
);
