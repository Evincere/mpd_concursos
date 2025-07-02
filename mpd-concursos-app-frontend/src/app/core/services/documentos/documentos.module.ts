/**
 * Módulo de Documentos Refactorizado
 * 
 * @description Módulo que configura la inyección de dependencias para el sistema de documentos
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaces
import { 
  DocumentRepository, 
  DOCUMENT_REPOSITORY_TOKEN,
  DOCUMENT_REPOSITORY_CONFIG_TOKEN,
  DocumentRepositoryConfig
} from '../../interfaces/document-repository.interface';

// Servicios especializados
import { DocumentRepositoryService } from './document-repository.service';
import { DocumentCacheService } from './document-cache.service';
import { DocumentUploadService } from './document-upload.service';
import { DocumentValidationService } from './document-validation.service';

// Servicio principal refactorizado
import { DocumentosRefactoredService } from './documentos-refactored.service';

// Servicio original (para compatibilidad)
import { DocumentosService } from './documentos.service';

// Configuración por defecto
const DEFAULT_CONFIG: DocumentRepositoryConfig = {
  apiUrl: '/api/documentos',
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['application/pdf'],
  enableDebugLogs: false
};

/**
 * Configuración del módulo de documentos
 */
export interface DocumentosModuleConfig {
  /**
   * Configuración del repositorio
   */
  repositoryConfig?: Partial<DocumentRepositoryConfig>;

  /**
   * Si debe usar el servicio refactorizado como principal
   */
  useRefactoredService?: boolean;

  /**
   * Si debe mantener compatibilidad con el servicio original
   */
  keepLegacyService?: boolean;

  /**
   * Configuración de cache
   */
  cacheConfig?: {
    defaultTimeout?: number;
    maxEntries?: number;
    enableStats?: boolean;
    enableDebugLogs?: boolean;
  };

  /**
   * Configuración de upload
   */
  uploadConfig?: {
    maxFileSize?: number;
    allowedTypes?: string[];
    maxConcurrentUploads?: number;
    retryAttempts?: number;
  };

  /**
   * Configuración de validación
   */
  validationConfig?: {
    enableAdvancedValidation?: boolean;
    customRules?: Map<string, any>;
  };
}

@NgModule({
  imports: [CommonModule],
  providers: [
    // Servicios especializados (siempre disponibles)
    DocumentCacheService,
    DocumentUploadService,
    DocumentValidationService,
    DocumentRepositoryService,
    
    // Configuración por defecto del repositorio
    {
      provide: DOCUMENT_REPOSITORY_CONFIG_TOKEN,
      useValue: DEFAULT_CONFIG
    },
    
    // Implementación por defecto del repositorio
    {
      provide: DOCUMENT_REPOSITORY_TOKEN,
      useClass: DocumentRepositoryService
    },
    
    // Alias para el repositorio
    {
      provide: DocumentRepository,
      useExisting: DOCUMENT_REPOSITORY_TOKEN
    }
  ]
})
export class DocumentosModule {
  
  /**
   * Configuración para el módulo raíz
   * @param config Configuración del módulo
   */
  static forRoot(config?: DocumentosModuleConfig): ModuleWithProviders<DocumentosModule> {
    return {
      ngModule: DocumentosModule,
      providers: [
        // Configuración personalizada del repositorio
        {
          provide: DOCUMENT_REPOSITORY_CONFIG_TOKEN,
          useValue: { ...DEFAULT_CONFIG, ...config?.repositoryConfig }
        },

        // Servicio principal según configuración
        ...(config?.useRefactoredService !== false ? [
          {
            provide: 'DOCUMENTOS_SERVICE_PRIMARY',
            useClass: DocumentosRefactoredService
          }
        ] : [
          {
            provide: 'DOCUMENTOS_SERVICE_PRIMARY',
            useClass: DocumentosService
          }
        ]),

        // Mantener servicio legacy si se solicita
        ...(config?.keepLegacyService !== false ? [
          {
            provide: 'DOCUMENTOS_SERVICE_LEGACY',
            useClass: DocumentosService
          }
        ] : []),

        // Alias para facilitar inyección
        {
          provide: DocumentosRefactoredService,
          useExisting: 'DOCUMENTOS_SERVICE_PRIMARY'
        }
      ]
    };
  }

  /**
   * Configuración para módulos feature
   */
  static forFeature(): ModuleWithProviders<DocumentosModule> {
    return {
      ngModule: DocumentosModule,
      providers: [
        // Solo servicios especializados para features
        DocumentCacheService,
        DocumentUploadService,
        DocumentValidationService,
        DocumentRepositoryService
      ]
    };
  }

  /**
   * Configuración para testing
   */
  static forTesting(mockConfig?: Partial<DocumentosModuleConfig>): ModuleWithProviders<DocumentosModule> {
    return {
      ngModule: DocumentosModule,
      providers: [
        // Configuración de testing
        {
          provide: DOCUMENT_REPOSITORY_CONFIG_TOKEN,
          useValue: {
            ...DEFAULT_CONFIG,
            enableDebugLogs: true,
            apiUrl: '/api/test/documentos',
            ...mockConfig?.repositoryConfig
          }
        },

        // Mocks para testing
        {
          provide: DocumentRepositoryService,
          useValue: {
            getDocumentsByUser: () => of([]),
            getDocumentTypes: () => of([]),
            uploadDocument: () => of({ success: true, message: 'Test upload' }),
            deleteDocument: () => of(true),
            clearCache: () => {},
            hasCache: () => false,
            getCacheStats: () => ({ documentsCount: 0, typesCount: 0, lastUpdate: null })
          }
        }
      ]
    };
  }
}

/**
 * Factory para crear configuración personalizada
 */
export function createDocumentosConfig(
  customConfig: Partial<DocumentRepositoryConfig>
): DocumentRepositoryConfig {
  return { ...DEFAULT_CONFIG, ...customConfig };
}

/**
 * Provider helper para inyección manual
 */
export const DOCUMENTOS_PROVIDERS = [
  DocumentCacheService,
  DocumentUploadService,
  DocumentValidationService,
  DocumentRepositoryService,
  DocumentosRefactoredService,
  {
    provide: DOCUMENT_REPOSITORY_CONFIG_TOKEN,
    useValue: DEFAULT_CONFIG
  },
  {
    provide: DOCUMENT_REPOSITORY_TOKEN,
    useClass: DocumentRepositoryService
  }
];

/**
 * Tokens de inyección para facilitar testing
 */
export const DOCUMENTOS_TOKENS = {
  CACHE_SERVICE: 'DOCUMENTOS_CACHE_SERVICE',
  UPLOAD_SERVICE: 'DOCUMENTOS_UPLOAD_SERVICE',
  VALIDATION_SERVICE: 'DOCUMENTOS_VALIDATION_SERVICE',
  REPOSITORY_SERVICE: 'DOCUMENTOS_REPOSITORY_SERVICE',
  PRIMARY_SERVICE: 'DOCUMENTOS_SERVICE_PRIMARY',
  LEGACY_SERVICE: 'DOCUMENTOS_SERVICE_LEGACY'
} as const;

/**
 * Configuraciones predefinidas
 */
export const DOCUMENTOS_CONFIGS = {
  DEVELOPMENT: createDocumentosConfig({
    enableDebugLogs: true,
    cacheTimeout: 2 * 60 * 1000 // 2 minutos en desarrollo
  }),

  PRODUCTION: createDocumentosConfig({
    enableDebugLogs: false,
    cacheTimeout: 10 * 60 * 1000 // 10 minutos en producción
  }),

  TESTING: createDocumentosConfig({
    enableDebugLogs: true,
    apiUrl: '/api/test/documentos',
    cacheTimeout: 30 * 1000 // 30 segundos en testing
  })
} as const;
