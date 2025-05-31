import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TabKey } from '../models/types';

export interface PerfilState {
  selectedTab: TabKey;
  isEditing: boolean;
  isLoading: boolean;
  linkedInTab: boolean;
  error: string | null;
}

const initialState: PerfilState = {
  selectedTab: 'info',
  isEditing: false,
  isLoading: false,
  linkedInTab: true,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class PerfilStateService {
  private state$ = new BehaviorSubject<PerfilState>(initialState);

  // Getters
  get currentState(): PerfilState {
    return this.state$.getValue();
  }

  // State updates
  private updateState(patch: Partial<PerfilState>): void {
    this.state$.next({
      ...this.currentState,
      ...patch
    });
  }

  // State actions
  setTab(tab: TabKey): void {
    this.updateState({ selectedTab: tab });
  }

  setEditing(isEditing: boolean): void {
    this.updateState({ isEditing });
  }

  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  setLinkedInTab(enabled: boolean): void {
    this.updateState({ linkedInTab: enabled });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }
}
