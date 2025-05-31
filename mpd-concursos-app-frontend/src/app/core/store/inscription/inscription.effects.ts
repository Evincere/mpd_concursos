import { Injectable } from '@angular/core';
import { createEffect } from   '@ngrx/effects';

import { of } from 'rxjs';

import * as _InscriptionActions from './inscription.actions';





@Injectable()
export class InscriptionEffects {


  // Versión simplificada de los efectos para evitar problemas con pipe()
  saveState$ = createEffect(() => {
    return of({ type: '[Inscription] Save State Success' });
  });

  loadState$ = createEffect(() => {
    return of({ type: '[Inscription] Load State No Data' });
  });

  clearState$ = createEffect(() => {
    return of({ type: '[Inscription] Clear State Success' });
  });
}
