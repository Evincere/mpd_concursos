import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para gestionar el estado de carga global y por secciones
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  /**
   * Estado de carga global
   */
  private loading$ = new BehaviorSubject<boolean>(false);
  
  /**
   * Mensaje de carga global
   */
  private loadingMessage$ = new BehaviorSubject<string>('Cargando...');
  
  /**
   * Mapa de estados de carga por sección
   */
  private sectionLoadingMap = new Map<string, BehaviorSubject<boolean>>();
  
  /**
   * Mapa de mensajes de carga por sección
   */
  private sectionMessageMap = new Map<string, BehaviorSubject<string>>();
  
  /**
   * Contador de operaciones de carga activas
   */
  private loadingCount = 0;
  
  /**
   * Mapa de contadores de operaciones de carga por sección
   */
  private sectionLoadingCountMap = new Map<string, number>();
  
  /**
   * Obtiene el observable del estado de carga global
   */
  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }
  
  /**
   * Obtiene el observable del mensaje de carga global
   */
  getLoadingMessage(): Observable<string> {
    return this.loadingMessage$.asObservable();
  }
  
  /**
   * Obtiene el observable del estado de carga de una sección
   * @param section Nombre de la sección
   */
  getSectionLoading(section: string): Observable<boolean> {
    if (!this.sectionLoadingMap.has(section)) {
      this.sectionLoadingMap.set(section, new BehaviorSubject<boolean>(false));
      this.sectionLoadingCountMap.set(section, 0);
    }
    
    return this.sectionLoadingMap.get(section)!.asObservable();
  }
  
  /**
   * Obtiene el observable del mensaje de carga de una sección
   * @param section Nombre de la sección
   */
  getSectionMessage(section: string): Observable<string> {
    if (!this.sectionMessageMap.has(section)) {
      this.sectionMessageMap.set(section, new BehaviorSubject<string>('Cargando...'));
    }
    
    return this.sectionMessageMap.get(section)!.asObservable();
  }
  
  /**
   * Inicia una operación de carga global
   * @param message Mensaje opcional para mostrar durante la carga
   */
  startLoading(message?: string): void {
    this.loadingCount++;
    
    if (message) {
      this.loadingMessage$.next(message);
    }
    
    if (this.loadingCount === 1) {
      this.loading$.next(true);
    }
  }
  
  /**
   * Finaliza una operación de carga global
   */
  stopLoading(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      this.loading$.next(false);
      this.loadingMessage$.next('Cargando...');
    }
  }
  
  /**
   * Inicia una operación de carga en una sección específica
   * @param section Nombre de la sección
   * @param message Mensaje opcional para mostrar durante la carga
   */
  startSectionLoading(section: string, message?: string): void {
    if (!this.sectionLoadingMap.has(section)) {
      this.sectionLoadingMap.set(section, new BehaviorSubject<boolean>(false));
      this.sectionLoadingCountMap.set(section, 0);
    }
    
    if (!this.sectionMessageMap.has(section)) {
      this.sectionMessageMap.set(section, new BehaviorSubject<string>('Cargando...'));
    }
    
    const count = this.sectionLoadingCountMap.get(section)! + 1;
    this.sectionLoadingCountMap.set(section, count);
    
    if (message) {
      this.sectionMessageMap.get(section)!.next(message);
    }
    
    if (count === 1) {
      this.sectionLoadingMap.get(section)!.next(true);
    }
    
    // También iniciar carga global
    this.startLoading(message);
  }
  
  /**
   * Finaliza una operación de carga en una sección específica
   * @param section Nombre de la sección
   */
  stopSectionLoading(section: string): void {
    if (!this.sectionLoadingMap.has(section)) {
      return;
    }
    
    const count = Math.max(0, this.sectionLoadingCountMap.get(section)! - 1);
    this.sectionLoadingCountMap.set(section, count);
    
    if (count === 0) {
      this.sectionLoadingMap.get(section)!.next(false);
      this.sectionMessageMap.get(section)!.next('Cargando...');
    }
    
    // También finalizar carga global
    this.stopLoading();
  }
  
  /**
   * Reinicia todos los estados de carga
   */
  resetLoading(): void {
    this.loadingCount = 0;
    this.loading$.next(false);
    this.loadingMessage$.next('Cargando...');
    
    this.sectionLoadingMap.forEach((subject) => {
      subject.next(false);
    });
    
    this.sectionMessageMap.forEach((subject) => {
      subject.next('Cargando...');
    });
    
    this.sectionLoadingCountMap.forEach((_, key) => {
      this.sectionLoadingCountMap.set(key, 0);
    });
  }
}
