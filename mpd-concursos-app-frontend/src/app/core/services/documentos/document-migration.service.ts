import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Servicios
import { UnifiedDocumentService } from './unified-document.service';
import { DocumentosService } from './documentos.service';
import { LoggingService } from '../logging/logging.service';

// Modelos
import { DocumentoUsuario, DocumentoResponse } from '../../models/documento.model';

/**
 * Servicio de migración para deprecar gradualmente servicios legacy
 * Proporciona una capa de compatibilidad mientras se migra a UnifiedDocumentService
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentMigrationService {

  private readonly unifiedDocumentService = inject(UnifiedDocumentService);
  private readonly legacyDocumentosService = inject(DocumentosService);
  private readonly loggingService = inject(LoggingService);

  // Flag para controlar la migración gradual
  private readonly USE_UNIFIED_SERVICE = true;

  /**
   * Obtiene documentos del usuario con migración automática
   */
  getDocumentosUsuario(): Observable<DocumentoUsuario[]> {
    if (this.USE_UNIFIED_SERVICE) {
      this.loggingService.debug('[DocumentMigration] Usando UnifiedDocumentService para getDocumentosUsuario');
      return this.unifiedDocumentService.documentos$;
    } else {
      this.loggingService.debug('[DocumentMigration] Usando servicio legacy para getDocumentosUsuario');
      return this.legacyDocumentosService.getDocumentosUsuario();
    }
  }

  /**
   * Sube un documento con migración automática
   */
  uploadDocumento(file: File, tipoDocumentoId: string, comentarios?: string): Observable<DocumentoResponse> {
    if (this.USE_UNIFIED_SERVICE) {
      this.loggingService.debug('[DocumentMigration] Usando UnifiedDocumentService para upload');
      return this.unifiedDocumentService.uploadDocument(file, tipoDocumentoId, comentarios);
    } else {
      this.loggingService.debug('[DocumentMigration] Usando servicio legacy para upload');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipoDocumentoId', tipoDocumentoId);
      formData.append('comentarios', comentarios || '');
      return this.legacyDocumentosService.uploadDocumento(formData);
    }
  }

  /**
   * Elimina un documento con migración automática
   */
  deleteDocumento(documentId: string): Observable<void> {
    if (this.USE_UNIFIED_SERVICE) {
      this.loggingService.debug('[DocumentMigration] Usando UnifiedDocumentService para delete');
      return this.unifiedDocumentService.deleteDocument(documentId);
    } else {
      this.loggingService.debug('[DocumentMigration] Usando servicio legacy para delete');
      // TODO: Implementar cuando esté disponible en servicio legacy
      throw new Error('Delete not implemented in legacy service');
    }
  }

  /**
   * Refresca la lista de documentos
   */
  refreshDocuments(): void {
    if (this.USE_UNIFIED_SERVICE) {
      this.loggingService.debug('[DocumentMigration] Refrescando con UnifiedDocumentService');
      this.unifiedDocumentService.refreshDocuments();
    } else {
      this.loggingService.debug('[DocumentMigration] Refrescando con servicio legacy');
      // El servicio legacy no tiene método de refresh explícito
      // Se basa en observables que se actualizan automáticamente
    }
  }

  /**
   * Obtiene el estado de carga
   */
  get isLoading$(): Observable<boolean> {
    if (this.USE_UNIFIED_SERVICE) {
      return this.unifiedDocumentService.isLoading$;
    } else {
      // El servicio legacy no tiene estado de loading centralizado
      // Retornar un observable que siempre emite false
      return new Observable(subscriber => {
        subscriber.next(false);
        subscriber.complete();
      });
    }
  }

  /**
   * Inicializa el servicio apropiado
   */
  initialize(): void {
    if (this.USE_UNIFIED_SERVICE) {
      this.loggingService.info('[DocumentMigration] Inicializando UnifiedDocumentService');
      this.unifiedDocumentService.initialize();
    } else {
      this.loggingService.info('[DocumentMigration] Usando servicios legacy (no requiere inicialización)');
    }
  }

  /**
   * Obtiene información sobre qué servicio se está usando
   */
  getServiceInfo(): { service: string; version: string; features: string[] } {
    if (this.USE_UNIFIED_SERVICE) {
      return {
        service: 'UnifiedDocumentService',
        version: '2.0.0',
        features: [
          'Verificación automática de duplicidad',
          'Reemplazo transaccional',
          'Estado reactivo',
          'Auditoría completa',
          'Gestión de errores mejorada'
        ]
      };
    } else {
      return {
        service: 'LegacyDocumentosService',
        version: '1.0.0',
        features: [
          'Upload básico',
          'Listado de documentos',
          'Notificaciones básicas'
        ]
      };
    }
  }

  /**
   * Migra un componente específico al nuevo servicio
   */
  migrateComponent(componentName: string): void {
    this.loggingService.info(`[DocumentMigration] Migrando componente ${componentName} a UnifiedDocumentService`);
    
    // Aquí se podría implementar lógica específica de migración por componente
    // Por ejemplo, limpiar cache, resetear estado, etc.
    
    if (this.USE_UNIFIED_SERVICE) {
      this.unifiedDocumentService.refreshDocuments();
    }
  }

  /**
   * Verifica la compatibilidad entre servicios
   */
  checkCompatibility(): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verificar que el UnifiedDocumentService esté disponible
    if (!this.unifiedDocumentService) {
      issues.push('UnifiedDocumentService no está disponible');
    }

    // Verificar que el servicio legacy esté disponible como fallback
    if (!this.legacyDocumentosService) {
      issues.push('Servicio legacy no está disponible como fallback');
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }

  /**
   * Obtiene estadísticas de uso de servicios
   */
  getUsageStats(): { unifiedUsage: number; legacyUsage: number; migrationProgress: number } {
    // En una implementación real, esto podría rastrear el uso real
    // Por ahora, retornamos valores simulados basados en la configuración
    
    if (this.USE_UNIFIED_SERVICE) {
      return {
        unifiedUsage: 100,
        legacyUsage: 0,
        migrationProgress: 100
      };
    } else {
      return {
        unifiedUsage: 0,
        legacyUsage: 100,
        migrationProgress: 0
      };
    }
  }
}
