import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Servicio para manejar eventos de recarga de documentos
 * 
 * Escucha eventos del sistema y coordina la recarga de datos
 * cuando ocurren conflictos de concurrencia u otras situaciones
 * que requieren actualización de la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentReloadService implements OnDestroy {

  private documentReloadSubject = new BehaviorSubject<DocumentReloadEvent | null>(null);
  private inscriptionReloadSubject = new BehaviorSubject<InscriptionReloadEvent | null>(null);

  constructor(private loggingService: LoggingService) {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    // Los event listeners se limpian automáticamente
  }

  /**
   * Observable para eventos de recarga de documentos
   */
  get documentReload$(): Observable<DocumentReloadEvent> {
    return this.documentReloadSubject.asObservable().pipe(
      filter((event): event is DocumentReloadEvent => event !== null)
    );
  }

  /**
   * Observable para eventos de recarga de inscripciones
   */
  get inscriptionReload$(): Observable<InscriptionReloadEvent> {
    return this.inscriptionReloadSubject.asObservable().pipe(
      filter((event): event is InscriptionReloadEvent => event !== null)
    );
  }

  /**
   * Emite manualmente un evento de recarga de documentos
   */
  triggerDocumentReload(reason: string, metadata?: any): void {
    const event: DocumentReloadEvent = {
      timestamp: Date.now(),
      reason,
      metadata
    };

    this.loggingService.info('📄 [DocumentReload] Evento de recarga de documentos emitido', event);
    this.documentReloadSubject.next(event);
  }

  /**
   * Emite manualmente un evento de recarga de inscripciones
   */
  triggerInscriptionReload(reason: string, metadata?: any): void {
    const event: InscriptionReloadEvent = {
      timestamp: Date.now(),
      reason,
      metadata
    };

    this.loggingService.info('📋 [DocumentReload] Evento de recarga de inscripciones emitido', event);
    this.inscriptionReloadSubject.next(event);
  }

  /**
   * Configura los event listeners para eventos del navegador
   */
  private setupEventListeners(): void {
    // Escuchar eventos de recarga de documentos
    fromEvent<CustomEvent>(window, 'document-reload-required')
      .pipe(
        map(event => event.detail as DocumentReloadEvent)
      )
      .subscribe(event => {
        this.loggingService.info('📄 [DocumentReload] Evento de recarga de documentos recibido', event);
        this.documentReloadSubject.next(event);
      });

    // Escuchar eventos de recarga de inscripciones
    fromEvent<CustomEvent>(window, 'inscription-reload-required')
      .pipe(
        map(event => event.detail as InscriptionReloadEvent)
      )
      .subscribe(event => {
        this.loggingService.info('📋 [DocumentReload] Evento de recarga de inscripciones recibido', event);
        this.inscriptionReloadSubject.next(event);
      });

    // Escuchar eventos genéricos de recarga
    fromEvent<CustomEvent>(window, 'data-reload-required')
      .pipe(
        map(event => event.detail)
      )
      .subscribe(event => {
        this.loggingService.info('🔄 [DocumentReload] Evento genérico de recarga recibido', event);
        
        // Determinar qué tipo de recarga es necesaria
        if (event.type === 'documents' || event.type === 'all') {
          this.triggerDocumentReload('generic-reload', event);
        }
        
        if (event.type === 'inscriptions' || event.type === 'all') {
          this.triggerInscriptionReload('generic-reload', event);
        }
      });
  }

  /**
   * Obtiene estadísticas de eventos procesados
   */
  getStats(): ReloadServiceStats {
    return {
      lastDocumentReload: this.documentReloadSubject.value,
      lastInscriptionReload: this.inscriptionReloadSubject.value,
      isListening: true
    };
  }
}

/**
 * Interfaz para eventos de recarga de documentos
 */
export interface DocumentReloadEvent {
  timestamp: number;
  reason: string;
  metadata?: any;
}

/**
 * Interfaz para eventos de recarga de inscripciones
 */
export interface InscriptionReloadEvent {
  timestamp: number;
  reason: string;
  metadata?: any;
}

/**
 * Interfaz para estadísticas del servicio
 */
export interface ReloadServiceStats {
  lastDocumentReload: DocumentReloadEvent | null;
  lastInscriptionReload: InscriptionReloadEvent | null;
  isListening: boolean;
}
