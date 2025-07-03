/**
 * Document Notification Service
 * 
 * @description Servicio especializado para notificaciones de documentos
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { Subject, Observable, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { CustomNotificationService } from '../../../shared/services/notification/custom-notification.service';
import { DocumentoUsuario, TipoDocumento } from '../../models/documento.model';

/**
 * Tipos de eventos de documentos
 */
export type DocumentEventType = 
  | 'upload_started'
  | 'upload_progress'
  | 'upload_completed'
  | 'upload_failed'
  | 'delete_started'
  | 'delete_completed'
  | 'delete_failed'
  | 'validation_failed'
  | 'cache_updated'
  | 'state_changed';

/**
 * Evento de documento
 */
export interface DocumentEvent {
  type: DocumentEventType;
  documentId?: string;
  documentName?: string;
  documentType?: TipoDocumento;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  progress?: number;
  error?: string;
}

/**
 * Configuración de notificaciones
 */
export interface NotificationConfig {
  enableToastNotifications: boolean;
  enableEventLogging: boolean;
  debounceTime: number;
  maxEventsInMemory: number;
  autoHideDelay: number;
  showProgressNotifications: boolean;
  groupSimilarEvents: boolean;
}

/**
 * Estadísticas de notificaciones
 */
export interface NotificationStats {
  totalEvents: number;
  eventsByType: Map<DocumentEventType, number>;
  lastEvent: DocumentEvent | null;
  eventsInLastHour: number;
  errorRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentNotificationService {

  private readonly notificationService = inject(CustomNotificationService);

  // Configuración por defecto
  private readonly config: NotificationConfig = {
    enableToastNotifications: true,
    enableEventLogging: true,
    debounceTime: 1000,
    maxEventsInMemory: 100,
    autoHideDelay: 5000,
    showProgressNotifications: false,
    groupSimilarEvents: true
  };

  // Estado interno
  private eventsSubject = new Subject<DocumentEvent>();
  private eventHistory: DocumentEvent[] = [];
  private lastNotificationTime = new Map<string, number>();
  private groupedEvents = new Map<string, DocumentEvent[]>();

  // Observables públicos
  public readonly events$ = this.eventsSubject.asObservable();
  
  public readonly debouncedEvents$ = this.events$.pipe(
    debounceTime(this.config.debounceTime),
    distinctUntilChanged((a, b) => a.type === b.type && a.documentId === b.documentId)
  );

  public readonly uploadEvents$ = this.events$.pipe(
    filter(event => event.type.startsWith('upload_'))
  );

  public readonly deleteEvents$ = this.events$.pipe(
    filter(event => event.type.startsWith('delete_'))
  );

  public readonly errorEvents$ = this.events$.pipe(
    filter(event => event.type.includes('_failed') || !!event.error)
  );

  constructor() {
    console.log('[DocumentNotificationService] Servicio inicializado');
    this.initializeEventHandlers();
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Notifica inicio de upload
   */
  notifyUploadStarted(documentName: string, documentType: TipoDocumento): void {
    const event: DocumentEvent = {
      type: 'upload_started',
      documentName,
      documentType,
      message: `Iniciando carga de ${documentType.nombre}: ${documentName}`,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    if (this.config.enableToastNotifications) {
      this.notificationService.info(event.message, 'Carga iniciada');
    }
  }

  /**
   * Notifica progreso de upload
   */
  notifyUploadProgress(documentName: string, progress: number): void {
    const event: DocumentEvent = {
      type: 'upload_progress',
      documentName,
      message: `Cargando ${documentName}: ${progress}%`,
      progress,
      timestamp: new Date()
    };

    this.emitEvent(event);

    if (this.config.showProgressNotifications && progress % 25 === 0) {
      this.notificationService.info(event.message, 'Progreso');
    }
  }

  /**
   * Notifica upload completado
   */
  notifyUploadCompleted(documento: DocumentoUsuario): void {
    const event: DocumentEvent = {
      type: 'upload_completed',
      documentId: documento.id,
      documentName: documento.nombreArchivo,
      documentType: documento.tipoDocumento,
      message: `${documento.tipoDocumento.nombre} cargado exitosamente`,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    // Usar delay para evitar conflictos con detección de cambios
    setTimeout(() => {
      this.notificationService.success(event.message, 'Éxito');
    }, 500);
  }

  /**
   * Notifica error en upload
   */
  notifyUploadFailed(documentName: string, error: string, documentType?: TipoDocumento): void {
    const event: DocumentEvent = {
      type: 'upload_failed',
      documentName,
      documentType,
      message: `Error al cargar ${documentName}`,
      error,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    setTimeout(() => {
      this.notificationService.error(`${event.message}: ${error}`, 'Error');
    }, 500);
  }

  /**
   * Notifica inicio de eliminación
   */
  notifyDeleteStarted(documento: DocumentoUsuario): void {
    const event: DocumentEvent = {
      type: 'delete_started',
      documentId: documento.id,
      documentName: documento.nombreArchivo,
      documentType: documento.tipoDocumento,
      message: `Eliminando ${documento.tipoDocumento.nombre}`,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    if (this.config.enableToastNotifications) {
      this.notificationService.info(event.message, 'Eliminando');
    }
  }

  /**
   * Notifica eliminación completada
   */
  notifyDeleteCompleted(documento: DocumentoUsuario): void {
    const event: DocumentEvent = {
      type: 'delete_completed',
      documentId: documento.id,
      documentName: documento.nombreArchivo,
      documentType: documento.tipoDocumento,
      message: `${documento.tipoDocumento.nombre} eliminado exitosamente`,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    setTimeout(() => {
      this.notificationService.success(event.message, 'Eliminado');
    }, 500);
  }

  /**
   * Notifica error en eliminación
   */
  notifyDeleteFailed(documento: DocumentoUsuario, error: string): void {
    const event: DocumentEvent = {
      type: 'delete_failed',
      documentId: documento.id,
      documentName: documento.nombreArchivo,
      documentType: documento.tipoDocumento,
      message: `Error al eliminar ${documento.tipoDocumento.nombre}`,
      error,
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    setTimeout(() => {
      this.notificationService.error(`${event.message}: ${error}`, 'Error');
    }, 500);
  }

  /**
   * Notifica error de validación
   */
  notifyValidationFailed(documentName: string, errors: string[]): void {
    const event: DocumentEvent = {
      type: 'validation_failed',
      documentName,
      message: `Validación fallida para ${documentName}`,
      error: errors.join(', '),
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    setTimeout(() => {
      this.notificationService.warning(
        `${event.message}: ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`,
        'Validación'
      );
    }, 500);
  }

  /**
   * Notifica actualización de cache
   */
  notifyCacheUpdated(operation: string, count: number): void {
    const event: DocumentEvent = {
      type: 'cache_updated',
      message: `Cache actualizado: ${operation} (${count} elementos)`,
      details: { operation, count },
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    // No mostrar toast para actualizaciones de cache (demasiado frecuentes)
    if (this.config.enableEventLogging) {
      console.log(`[DocumentNotificationService] ${event.message}`);
    }
  }

  /**
   * Notifica cambio de estado
   */
  notifyStateChanged(documentId: string, oldState: string, newState: string): void {
    const event: DocumentEvent = {
      type: 'state_changed',
      documentId,
      message: `Estado cambiado de ${oldState} a ${newState}`,
      details: { oldState, newState },
      timestamp: new Date()
    };

    this.emitEvent(event);
  }

  /**
   * Notifica múltiples uploads completados
   */
  notifyMultipleUploadsCompleted(successCount: number, totalCount: number): void {
    const message = successCount === totalCount 
      ? `Todos los documentos cargados exitosamente (${successCount}/${totalCount})`
      : `Carga completada: ${successCount}/${totalCount} documentos exitosos`;

    const event: DocumentEvent = {
      type: 'upload_completed',
      message,
      details: { successCount, totalCount },
      timestamp: new Date()
    };

    this.emitEvent(event);
    
    setTimeout(() => {
      if (successCount === totalCount) {
        this.notificationService.success(message, 'Carga completada');
      } else {
        this.notificationService.warning(message, 'Carga parcial');
      }
    }, 500);
  }

  // ==================== MÉTODOS DE CONSULTA ====================

  /**
   * Obtiene historial de eventos
   */
  getEventHistory(): DocumentEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Obtiene eventos por tipo
   */
  getEventsByType(type: DocumentEventType): DocumentEvent[] {
    return this.eventHistory.filter(event => event.type === type);
  }

  /**
   * Obtiene eventos de un documento específico
   */
  getEventsForDocument(documentId: string): DocumentEvent[] {
    return this.eventHistory.filter(event => event.documentId === documentId);
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  getStats(): NotificationStats {
    const eventsByType = new Map<DocumentEventType, number>();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let eventsInLastHour = 0;
    let errorCount = 0;

    this.eventHistory.forEach(event => {
      // Por tipo
      const count = eventsByType.get(event.type) || 0;
      eventsByType.set(event.type, count + 1);

      // Última hora
      if (event.timestamp > oneHourAgo) {
        eventsInLastHour++;
      }

      // Errores
      if (event.type.includes('_failed') || event.error) {
        errorCount++;
      }
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      lastEvent: this.eventHistory[this.eventHistory.length - 1] || null,
      eventsInLastHour,
      errorRate: this.eventHistory.length > 0 ? (errorCount / this.eventHistory.length) * 100 : 0
    };
  }

  /**
   * Limpia el historial de eventos
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.groupedEvents.clear();
    this.lastNotificationTime.clear();
    console.log('[DocumentNotificationService] Historial limpiado');
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Emite un evento
   */
  private emitEvent(event: DocumentEvent): void {
    // Agregar al historial
    this.eventHistory.push(event);
    
    // Mantener límite de eventos en memoria
    if (this.eventHistory.length > this.config.maxEventsInMemory) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxEventsInMemory);
    }

    // Emitir evento
    this.eventsSubject.next(event);

    // Log si está habilitado
    if (this.config.enableEventLogging) {
      console.log(`[DocumentNotificationService] Evento: ${event.type} - ${event.message}`);
    }
  }

  /**
   * Inicializa manejadores de eventos
   */
  private initializeEventHandlers(): void {
    // Suscribirse a eventos debounced para logging
    this.debouncedEvents$.subscribe(event => {
      if (this.config.enableEventLogging) {
        console.log(`[DocumentNotificationService] Evento procesado: ${event.type}`);
      }
    });

    // Limpiar eventos antiguos cada hora
    timer(0, 60 * 60 * 1000).subscribe(() => {
      this.cleanupOldEvents();
    });
  }

  /**
   * Limpia eventos antiguos
   */
  private cleanupOldEvents(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialCount = this.eventHistory.length;
    
    this.eventHistory = this.eventHistory.filter(event => event.timestamp > oneDayAgo);
    
    const removedCount = initialCount - this.eventHistory.length;
    if (removedCount > 0) {
      console.log(`[DocumentNotificationService] Limpiados ${removedCount} eventos antiguos`);
    }
  }

  /**
   * Verifica si debe mostrar notificación (throttling)
   */
  private shouldShowNotification(key: string): boolean {
    const now = Date.now();
    const lastTime = this.lastNotificationTime.get(key) || 0;
    const minInterval = 2000; // 2 segundos mínimo entre notificaciones similares

    if (now - lastTime > minInterval) {
      this.lastNotificationTime.set(key, now);
      return true;
    }

    return false;
  }
}
