import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold, hot } from 'jasmine-marbles';

import { InscriptionEffects } from './inscription.effects';
import * as InscriptionActions from './inscription.actions';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionSessionService } from '@core/services/inscripcion/inscription-session.service';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { selectFormData } from './inscription.selectors';

describe('InscriptionEffects', () => {
  let actions$: Observable<Action>;
  let effects: InscriptionEffects;
  let inscriptionStateService: jasmine.SpyObj<InscriptionStateService>;
  let inscriptionSessionService: jasmine.SpyObj<InscriptionSessionService>;
  let _store: MockStore;

  const initialState = {
    inscription: {
      currentStep: 1,
      termsAccepted: false,
      selectedCircunscripciones: [],
      documentosCompletos: false,
      confirmedPersonalData: false,
      contestId: null,
      contestTitle: null
    }
  };

  const mockFormData = {
    currentStep: 1,
    termsAccepted: true,
    selectedCircunscripciones: ['Primera'],
    documentosCompletos: false,
    confirmedPersonalData: false,
    contestId: 1,
    contestTitle: 'Concurso de prueba'
  };

  beforeEach(() => {
    const inscriptionStateServiceSpy = jasmine.createSpyObj('InscriptionStateService', [
      'saveInscriptionState',
      'getInscriptionState',
      'clearInscriptionState'
    ]);

    const inscriptionSessionServiceSpy = jasmine.createSpyObj('InscriptionSessionService', [
      'saveSession',
      'convertStepToEnum'
    ]);

    TestBed.configureTestingModule({
      providers: [
        InscriptionEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState,
          selectors: [
            { selector: selectFormData, value: mockFormData }
          ]
        }),
        { provide: InscriptionStateService, useValue: inscriptionStateServiceSpy },
        { provide: InscriptionSessionService, useValue: inscriptionSessionServiceSpy }
      ]
    });

    effects = TestBed.inject(InscriptionEffects);
    inscriptionStateService = TestBed.inject(InscriptionStateService) as jasmine.SpyObj<InscriptionStateService>;
    inscriptionSessionService = TestBed.inject(InscriptionSessionService) as jasmine.SpyObj<InscriptionSessionService>;
    _store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('saveState$', () => {
    it('should save state to localStorage and backend', () => {
      // Arrange
      const action = InscriptionActions.saveInscriptionState({
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        step: InscriptionStep.TERMS_ACCEPTANCE,
        contestTitle: 'Concurso de prueba'
      });

      inscriptionSessionService.convertStepToEnum.and.returnValue(InscriptionStep.TERMS_ACCEPTANCE);
      inscriptionSessionService.saveSession.and.returnValue(of({
        id: '987e6543-e21b-43d3-b654-426614174999',
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: mockFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      }));

      // Act
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', {
        b: InscriptionActions.saveInscriptionStateSuccess({
          sessionId: '987e6543-e21b-43d3-b654-426614174999'
        })
      });

      // Assert
      expect(effects.saveState$).toBeObservable(expected);
      expect(inscriptionStateService.saveInscriptionState).toHaveBeenCalled();
      expect(inscriptionSessionService.saveSession).toHaveBeenCalled();
    });

    it('should handle errors when saving state', () => {
      // Arrange
      const action = InscriptionActions.saveInscriptionState({
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        step: InscriptionStep.TERMS_ACCEPTANCE,
        contestTitle: 'Concurso de prueba'
      });

      inscriptionSessionService.convertStepToEnum.and.returnValue(InscriptionStep.TERMS_ACCEPTANCE);
      inscriptionSessionService.saveSession.and.returnValue(throwError(() => new Error('Error saving session')));

      // Act
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', {
        b: InscriptionActions.saveInscriptionStateFailure({
          error: 'Error al guardar el estado de la inscripción'
        })
      });

      // Assert
      expect(effects.saveState$).toBeObservable(expected);
      expect(inscriptionStateService.saveInscriptionState).toHaveBeenCalled();
      expect(inscriptionSessionService.saveSession).toHaveBeenCalled();
    });
  });

  describe('loadState$', () => {
    it('should load state from localStorage', () => {
      // Arrange
      const action = InscriptionActions.loadInscriptionState({
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000'
      });

      const mockState = {
        termsAccepted: true,
        selectedCircunscripciones: ['Primera'],
        documentosCompletos: false,
        confirmedPersonalData: false,
        currentStep: 1,
        contestId: 1,
        contestTitle: 'Concurso de prueba',
        timestamp: new Date().toISOString()
      };

      inscriptionStateService.getInscriptionState.and.returnValue(mockState);

      // Act
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', {
        b: InscriptionActions.loadInscriptionStateSuccess({
          state: mockState
        })
      });

      // Assert
      expect(effects.loadState$).toBeObservable(expected);
      expect(inscriptionStateService.getInscriptionState).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle case when no state is found', () => {
      // Arrange
      const action = InscriptionActions.loadInscriptionState({
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000'
      });

      inscriptionStateService.getInscriptionState.and.returnValue(null);

      // Act
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', {
        b: InscriptionActions.loadInscriptionStateFailure({
          error: 'No se encontró estado guardado para esta inscripción'
        })
      });

      // Assert
      expect(effects.loadState$).toBeObservable(expected);
      expect(inscriptionStateService.getInscriptionState).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('clearState$', () => {
    it('should clear state from localStorage', () => {
      // Arrange
      const action = InscriptionActions.clearInscriptionState({
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000'
      });

      // Act
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', {
        b: InscriptionActions.clearInscriptionStateSuccess()
      });

      // Assert
      expect(effects.clearState$).toBeObservable(expected);
      expect(inscriptionStateService.clearInscriptionState).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});
