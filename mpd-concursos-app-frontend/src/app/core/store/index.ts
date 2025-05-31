import { ActionReducerMap } from '@ngrx/store';
import * as fromInscription from './inscription/inscription.reducer';

export interface AppState {
  inscription: fromInscription.InscriptionState;
}

export const reducers: ActionReducerMap<AppState> = {
  inscription: fromInscription.inscriptionReducer
};
