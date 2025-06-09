import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interfaz para el estado de carga
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * Servicio para gestionar los estados de carga en la aplicación.
 * Permite mostrar y ocultar indicadores de carga con mensajes personalizados.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  
  /**
   * Observable que emite el estado de carga actual
   */
  isLoading$: Observable<LoadingState> = this.loadingSubject.asObservable();
  
  /**
   * Muestra el indicador de carga
   * @param message Mensaje opcional a mostrar
   * @param transparent Si es true, el fondo será transparente
   */
  show(message?: string, transparent = false): void {
    this.loadingSubject.next({ 
      isLoading: true, 
      message, 
      transparent 
    });
  }
  
  /**
   * Oculta el indicador de carga
   */
  hide(): void {
    this.loadingSubject.next({ isLoading: false });
  }
  
  /**
   * Actualiza el mensaje del indicador de carga sin cambiar su estado
   * @param message Nuevo mensaje a mostrar
   */
  updateMessage(message: string): void {
    const currentState = this.loadingSubject.value;
    if (currentState.isLoading) {
      this.loadingSubject.next({
        ...currentState,
        message
      });
    }
  }
  
  /**
   * Obtiene el estado actual de carga
   * @returns Estado actual de carga
   */
  getCurrentState(): LoadingState {
    return this.loadingSubject.value;
  }
}
