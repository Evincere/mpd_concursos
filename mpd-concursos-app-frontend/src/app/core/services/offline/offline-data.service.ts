import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { OfflineManagerService } from '@core/services/pwa/offline-manager.service';
import { Concurso } from '@core/models/concurso.model';
import { Inscripcion } from '@core/models/inscripcion.model';
import { Usuario } from '@core/models/usuario.model';

/**
 * Datos offline por categoría
 */
interface OfflineDataCategory {
  key: string;
  name: string;
  lastUpdated: Date | null;
  itemCount: number;
  size: number; // bytes
  syncStatus: 'synced' | 'pending' | 'error';
}

/**
 * Configuración de sincronización
 */
interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // ms
  maxRetries: number;
  batchSize: number;
}

/**
 * Servicio para gestión de datos offline específicos de la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {

  private categoriesSubject = new BehaviorSubject<OfflineDataCategory[]>([]);
  private syncConfigSubject = new BehaviorSubject<SyncConfig>({
    autoSync: true,
    syncInterval: 30000, // 30 segundos
    maxRetries: 3,
    batchSize: 10
  });

  // Observables públicos
  public categories$ = this.categoriesSubject.asObservable();
  public syncConfig$ = this.syncConfigSubject.asObservable();

  // Categorías de datos
  private dataCategories: OfflineDataCategory[] = [
    {
      key: 'concursos',
      name: 'Concursos',
      lastUpdated: null,
      itemCount: 0,
      size: 0,
      syncStatus: 'synced'
    },
    {
      key: 'inscripciones',
      name: 'Inscripciones',
      lastUpdated: null,
      itemCount: 0,
      size: 0,
      syncStatus: 'synced'
    },
    {
      key: 'documentos',
      name: 'Documentos',
      lastUpdated: null,
      itemCount: 0,
      size: 0,
      syncStatus: 'synced'
    },
    {
      key: 'perfil',
      name: 'Perfil de Usuario',
      lastUpdated: null,
      itemCount: 0,
      size: 0,
      syncStatus: 'synced'
    },
    {
      key: 'configuracion',
      name: 'Configuración',
      lastUpdated: null,
      itemCount: 0,
      size: 0,
      syncStatus: 'synced'
    }
  ];

  constructor(
    private offlineManagerService: OfflineManagerService,
    private loggingService: LoggingService
  ) {
    this.initializeCategories();
    this.updateCategoriesInfo();
  }

  /**
   * Inicializa las categorías
   */
  private initializeCategories(): void {
    this.categoriesSubject.next([...this.dataCategories]);
  }

  /**
   * Actualiza información de las categorías
   */
  private updateCategoriesInfo(): void {
    this.dataCategories.forEach(category => {
      const data = this.offlineManagerService.getOfflineData(category.key);
      if (data) {
        category.itemCount = Array.isArray(data) ? data.length : 1;
        category.size = this.calculateDataSize(data);
        category.lastUpdated = new Date();
      }
    });
    
    this.categoriesSubject.next([...this.dataCategories]);
  }

  /**
   * Guarda concursos offline
   */
  public saveConcursosOffline(concursos: Concurso[]): void {
    this.offlineManagerService.setOfflineData('concursos', concursos);
    this.updateCategoryInfo('concursos', concursos);
  }

  /**
   * Obtiene concursos offline
   */
  public getConcursosOffline(): Observable<Concurso[]> {
    const data = this.offlineManagerService.getOfflineData<Concurso[]>('concursos');
    return of(data || []);
  }

  /**
   * Guarda inscripciones offline
   */
  public saveInscripcionesOffline(inscripciones: Inscripcion[]): void {
    this.offlineManagerService.setOfflineData('inscripciones', inscripciones);
    this.updateCategoryInfo('inscripciones', inscripciones);
  }

  /**
   * Obtiene inscripciones offline
   */
  public getInscripcionesOffline(): Observable<Inscripcion[]> {
    const data = this.offlineManagerService.getOfflineData<Inscripcion[]>('inscripciones');
    return of(data || []);
  }

  /**
   * Guarda perfil de usuario offline
   */
  public savePerfilOffline(perfil: Usuario): void {
    this.offlineManagerService.setOfflineData('perfil', perfil);
    this.updateCategoryInfo('perfil', perfil);
  }

  /**
   * Obtiene perfil offline
   */
  public getPerfilOffline(): Observable<Usuario | null> {
    const data = this.offlineManagerService.getOfflineData<Usuario>('perfil');
    return of(data);
  }

  /**
   * Guarda documento offline
   */
  public saveDocumentoOffline(documentoId: string, documento: any): void {
    const documentos = this.offlineManagerService.getOfflineData<any>('documentos') || {};
    documentos[documentoId] = {
      ...documento,
      savedAt: new Date(),
      offline: true
    };
    
    this.offlineManagerService.setOfflineData('documentos', documentos);
    this.updateCategoryInfo('documentos', documentos);
  }

  /**
   * Obtiene documento offline
   */
  public getDocumentoOffline(documentoId: string): Observable<any | null> {
    const documentos = this.offlineManagerService.getOfflineData<any>('documentos') || {};
    return of(documentos[documentoId] || null);
  }

  /**
   * Obtiene todos los documentos offline
   */
  public getDocumentosOffline(): Observable<any[]> {
    const documentos = this.offlineManagerService.getOfflineData<any>('documentos') || {};
    return of(Object.values(documentos));
  }

  /**
   * Guarda configuración offline
   */
  public saveConfiguracionOffline(config: any): void {
    this.offlineManagerService.setOfflineData('configuracion', config);
    this.updateCategoryInfo('configuracion', config);
  }

  /**
   * Obtiene configuración offline
   */
  public getConfiguracionOffline(): Observable<any | null> {
    const data = this.offlineManagerService.getOfflineData<any>('configuracion');
    return of(data);
  }

  /**
   * Guarda borrador de formulario
   */
  public saveBorradorFormulario(formId: string, data: any): void {
    const borradores = this.offlineManagerService.getOfflineData<any>('borradores') || {};
    borradores[formId] = {
      data,
      savedAt: new Date(),
      formId
    };
    
    this.offlineManagerService.setOfflineData('borradores', borradores);
  }

  /**
   * Obtiene borrador de formulario
   */
  public getBorradorFormulario(formId: string): Observable<any | null> {
    const borradores = this.offlineManagerService.getOfflineData<any>('borradores') || {};
    return of(borradores[formId] || null);
  }

  /**
   * Elimina borrador de formulario
   */
  public eliminarBorradorFormulario(formId: string): void {
    const borradores = this.offlineManagerService.getOfflineData<any>('borradores') || {};
    delete borradores[formId];
    this.offlineManagerService.setOfflineData('borradores', borradores);
  }

  /**
   * Obtiene todos los borradores
   */
  public getBorradoresFormularios(): Observable<any[]> {
    const borradores = this.offlineManagerService.getOfflineData<any>('borradores') || {};
    return of(Object.values(borradores));
  }

  /**
   * Marca datos como pendientes de sincronización
   */
  public markAsPendingSync(category: string): void {
    const categoryData = this.dataCategories.find(c => c.key === category);
    if (categoryData) {
      categoryData.syncStatus = 'pending';
      this.categoriesSubject.next([...this.dataCategories]);
    }
  }

  /**
   * Marca datos como sincronizados
   */
  public markAsSynced(category: string): void {
    const categoryData = this.dataCategories.find(c => c.key === category);
    if (categoryData) {
      categoryData.syncStatus = 'synced';
      categoryData.lastUpdated = new Date();
      this.categoriesSubject.next([...this.dataCategories]);
    }
  }

  /**
   * Marca datos con error de sincronización
   */
  public markAsSyncError(category: string): void {
    const categoryData = this.dataCategories.find(c => c.key === category);
    if (categoryData) {
      categoryData.syncStatus = 'error';
      this.categoriesSubject.next([...this.dataCategories]);
    }
  }

  /**
   * Limpia datos de una categoría
   */
  public clearCategoryData(category: string): void {
    this.offlineManagerService.removeOfflineData(category);
    this.updateCategoryInfo(category, null);
  }

  /**
   * Limpia todos los datos offline
   */
  public clearAllOfflineData(): void {
    this.dataCategories.forEach(category => {
      this.offlineManagerService.removeOfflineData(category.key);
      category.itemCount = 0;
      category.size = 0;
      category.lastUpdated = null;
      category.syncStatus = 'synced';
    });
    
    // Limpiar también borradores
    this.offlineManagerService.removeOfflineData('borradores');
    
    this.categoriesSubject.next([...this.dataCategories]);
  }

  /**
   * Obtiene estadísticas de datos offline
   */
  public getOfflineDataStats(): Observable<{
    totalCategories: number;
    totalItems: number;
    totalSize: number;
    pendingSync: number;
    lastUpdated: Date | null;
  }> {
    const categories = this.categoriesSubject.value;
    
    const stats = {
      totalCategories: categories.length,
      totalItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
      totalSize: categories.reduce((sum, cat) => sum + cat.size, 0),
      pendingSync: categories.filter(cat => cat.syncStatus === 'pending').length,
      lastUpdated: categories
        .map(cat => cat.lastUpdated)
        .filter(date => date !== null)
        .sort((a, b) => b!.getTime() - a!.getTime())[0] || null
    };
    
    return of(stats);
  }

  /**
   * Verifica si hay datos offline disponibles
   */
  public hasOfflineData(category?: string): Observable<boolean> {
    if (category) {
      const categoryData = this.dataCategories.find(c => c.key === category);
      return of(categoryData ? categoryData.itemCount > 0 : false);
    } else {
      const hasData = this.dataCategories.some(cat => cat.itemCount > 0);
      return of(hasData);
    }
  }

  /**
   * Obtiene datos para sincronización
   */
  public getDataForSync(category: string): Observable<any> {
    const data = this.offlineManagerService.getOfflineData(category);
    return of(data);
  }

  /**
   * Actualiza configuración de sincronización
   */
  public updateSyncConfig(config: Partial<SyncConfig>): void {
    const currentConfig = this.syncConfigSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.syncConfigSubject.next(newConfig);
  }

  /**
   * Obtiene configuración de sincronización
   */
  public getSyncConfig(): SyncConfig {
    return this.syncConfigSubject.value;
  }

  /**
   * Actualiza información de una categoría
   */
  private updateCategoryInfo(categoryKey: string, data: any): void {
    const category = this.dataCategories.find(c => c.key === categoryKey);
    if (category) {
      if (data) {
        category.itemCount = Array.isArray(data) ? data.length : 1;
        category.size = this.calculateDataSize(data);
        category.lastUpdated = new Date();
      } else {
        category.itemCount = 0;
        category.size = 0;
        category.lastUpdated = null;
      }
      
      this.categoriesSubject.next([...this.dataCategories]);
    }
  }

  /**
   * Calcula el tamaño de los datos en bytes
   */
  private calculateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Exporta datos offline para backup
   */
  public exportOfflineData(): Observable<any> {
    const exportData: any = {};
    
    this.dataCategories.forEach(category => {
      const data = this.offlineManagerService.getOfflineData(category.key);
      if (data) {
        exportData[category.key] = {
          data,
          metadata: {
            lastUpdated: category.lastUpdated,
            itemCount: category.itemCount,
            size: category.size
          }
        };
      }
    });
    
    // Incluir borradores
    const borradores = this.offlineManagerService.getOfflineData('borradores');
    if (borradores) {
      exportData.borradores = { data: borradores };
    }
    
    return of({
      exportedAt: new Date(),
      version: '1.0',
      data: exportData
    });
  }

  /**
   * Importa datos offline desde backup
   */
  public importOfflineData(importData: any): Observable<boolean> {
    try {
      if (!importData.data) {
        return of(false);
      }
      
      Object.keys(importData.data).forEach(key => {
        const categoryData = importData.data[key];
        if (categoryData.data) {
          this.offlineManagerService.setOfflineData(key, categoryData.data);
          
          // Actualizar metadata si existe
          if (categoryData.metadata) {
            const category = this.dataCategories.find(c => c.key === key);
            if (category) {
              category.lastUpdated = new Date(categoryData.metadata.lastUpdated);
              category.itemCount = categoryData.metadata.itemCount;
              category.size = categoryData.metadata.size;
            }
          }
        }
      });
      
      this.categoriesSubject.next([...this.dataCategories]);
      return of(true);
    } catch (error) {
      console.error('Error importing offline data:', error);
      return of(false);
    }
  }
}
