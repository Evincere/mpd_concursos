/**
 * Servicio para gestión de documentos temporales en cache
 * 
 * @description Maneja el almacenamiento temporal de documentos en localStorage
 * para previsualización antes del envío al servidor
 * @author Augment Agent
 * @date 2025-06-26
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TempDocument {
  id: string; // UUID temporal con prefijo 'temp_'
  file: File; // Archivo original
  base64: string; // Para visualización y almacenamiento
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  entityType: 'experience' | 'education';
  entityId?: string; // Solo cuando se asocie a una entidad existente
  expiresAt: Date; // Para limpieza automática
}

export interface CacheStats {
  totalDocuments: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  oldestDocument?: Date;
  newestDocument?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TempDocumentCacheService {

  private readonly CACHE_KEY_PREFIX = 'temp_doc_';
  private readonly CACHE_INDEX_KEY = 'temp_doc_index';
  private readonly MAX_CACHE_SIZE_MB = 8; // Límite de 8MB para documentos temporales
  private readonly EXPIRY_HOURS = 24; // Los documentos expiran en 24 horas

  // Subject para notificar cambios en el cache
  private cacheChanges$ = new BehaviorSubject<TempDocument[]>([]);

  constructor() {
    this.cleanupExpiredDocuments();
  }

  /**
   * Observable para escuchar cambios en el cache
   */
  getCacheChanges(): Observable<TempDocument[]> {
    return this.cacheChanges$.asObservable();
  }

  /**
   * Guarda un archivo en el cache temporal
   */
  async saveDocument(file: File, entityType: 'experience' | 'education', entityId?: string): Promise<TempDocument> {
    try {
      // Validar tamaño antes de procesar
      await this.validateCacheSpace(file.size);

      // Generar ID único temporal
      const tempId = this.generateTempId();
      
      // Convertir archivo a base64
      const base64 = await this.fileToBase64(file);
      
      // Crear documento temporal
      const tempDoc: TempDocument = {
        id: tempId,
        file: file,
        base64: base64,
        fileName: `temp_${entityType}_${Date.now()}.${this.getFileExtension(file.name)}`,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadDate: new Date(),
        entityType: entityType,
        entityId: entityId,
        expiresAt: new Date(Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000))
      };

      // Guardar en localStorage
      await this.saveToLocalStorage(tempDoc);
      
      // Actualizar índice
      this.updateCacheIndex(tempId);
      
      // Notificar cambios
      this.notifyCacheChanges();
      
      console.log(`[TempDocumentCache] ✅ Documento guardado en cache: ${tempId}`);
      return tempDoc;

    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error guardando documento en cache:', error);
      throw new Error(`Error al guardar documento en cache: ${error}`);
    }
  }

  /**
   * Recupera un documento del cache
   */
  getDocument(tempId: string): TempDocument | null {
    try {
      const cacheKey = this.getCacheKey(tempId);
      const stored = localStorage.getItem(cacheKey);
      
      if (!stored) {
        console.warn(`[TempDocumentCache] ⚠️ Documento no encontrado en cache: ${tempId}`);
        return null;
      }

      const tempDoc: TempDocument = JSON.parse(stored);

      // ✅ Convertir strings de fecha de vuelta a objetos Date
      tempDoc.uploadDate = new Date(tempDoc.uploadDate);
      tempDoc.expiresAt = new Date(tempDoc.expiresAt);

      // Verificar si ha expirado
      if (new Date() > tempDoc.expiresAt) {
        console.warn(`[TempDocumentCache] ⚠️ Documento expirado, eliminando: ${tempId}`);
        this.removeDocument(tempId);
        return null;
      }

      // Recrear el objeto File si es necesario
      if (!tempDoc.file && tempDoc.base64) {
        tempDoc.file = this.base64ToFile(tempDoc.base64, tempDoc.originalFileName, tempDoc.mimeType);
      }

      return tempDoc;

    } catch (error) {
      console.error(`[TempDocumentCache] ❌ Error recuperando documento: ${tempId}`, error);
      return null;
    }
  }

  /**
   * Elimina un documento del cache
   */
  removeDocument(tempId: string): boolean {
    try {
      const cacheKey = this.getCacheKey(tempId);
      localStorage.removeItem(cacheKey);
      
      // Actualizar índice
      this.removeFromCacheIndex(tempId);
      
      // Notificar cambios
      this.notifyCacheChanges();
      
      console.log(`[TempDocumentCache] 🗑️ Documento eliminado del cache: ${tempId}`);
      return true;

    } catch (error) {
      console.error(`[TempDocumentCache] ❌ Error eliminando documento: ${tempId}`, error);
      return false;
    }
  }

  /**
   * Obtiene todos los documentos temporales
   */
  getAllDocuments(): TempDocument[] {
    try {
      const index = this.getCacheIndex();
      const documents: TempDocument[] = [];

      for (const tempId of index) {
        const doc = this.getDocument(tempId);
        if (doc) {
          documents.push(doc);
        }
      }

      return documents.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error obteniendo todos los documentos:', error);
      return [];
    }
  }

  /**
   * Obtiene documentos por tipo de entidad
   */
  getDocumentsByEntityType(entityType: 'experience' | 'education'): TempDocument[] {
    return this.getAllDocuments().filter(doc => doc.entityType === entityType);
  }

  /**
   * Obtiene documentos por ID de entidad
   */
  getDocumentsByEntityId(entityId: string): TempDocument[] {
    return this.getAllDocuments().filter(doc => doc.entityId === entityId);
  }

  /**
   * Limpia todos los documentos temporales
   */
  clearAllDocuments(): void {
    try {
      const index = this.getCacheIndex();
      
      for (const tempId of index) {
        const cacheKey = this.getCacheKey(tempId);
        localStorage.removeItem(cacheKey);
      }
      
      // Limpiar índice
      localStorage.removeItem(this.CACHE_INDEX_KEY);
      
      // Notificar cambios
      this.notifyCacheChanges();
      
      console.log('[TempDocumentCache] 🧹 Cache limpiado completamente');

    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error limpiando cache:', error);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): CacheStats {
    const documents = this.getAllDocuments();
    const totalSizeBytes = documents.reduce((total, doc) => total + doc.fileSize, 0);

    // ✅ Asegurar que las fechas sean objetos Date válidos
    const validDates = documents
      .map(d => d.uploadDate instanceof Date ? d.uploadDate : new Date(d.uploadDate))
      .filter(date => !isNaN(date.getTime()));

    return {
      totalDocuments: documents.length,
      totalSizeBytes: totalSizeBytes,
      totalSizeMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100,
      oldestDocument: validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : undefined,
      newestDocument: validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : undefined
    };
  }

  /**
   * Verifica si un ID corresponde a un documento temporal
   */
  isTempDocument(documentId: string): boolean {
    return documentId.startsWith('temp_');
  }

  /**
   * Limpia documentos expirados
   */
  cleanupExpiredDocuments(): void {
    try {
      const index = this.getCacheIndex();
      const now = new Date();
      let cleanedCount = 0;

      for (const tempId of index) {
        const doc = this.getDocument(tempId);
        if (doc && now > new Date(doc.expiresAt)) {
          this.removeDocument(tempId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`[TempDocumentCache] 🧹 Limpiados ${cleanedCount} documentos expirados`);
      }

    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error en limpieza de documentos expirados:', error);
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(tempId: string): string {
    return `${this.CACHE_KEY_PREFIX}${tempId}`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private base64ToFile(base64: string, fileName: string, mimeType: string): File {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: mimeType });
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  private async validateCacheSpace(newFileSize: number): Promise<void> {
    const stats = this.getCacheStats();
    const newTotalSizeMB = (stats.totalSizeBytes + newFileSize) / (1024 * 1024);
    
    if (newTotalSizeMB > this.MAX_CACHE_SIZE_MB) {
      // Intentar limpiar documentos expirados primero
      this.cleanupExpiredDocuments();
      
      const updatedStats = this.getCacheStats();
      const updatedTotalSizeMB = (updatedStats.totalSizeBytes + newFileSize) / (1024 * 1024);
      
      if (updatedTotalSizeMB > this.MAX_CACHE_SIZE_MB) {
        throw new Error(`Cache lleno. Tamaño actual: ${updatedStats.totalSizeMB}MB, límite: ${this.MAX_CACHE_SIZE_MB}MB`);
      }
    }
  }

  private async saveToLocalStorage(tempDoc: TempDocument): Promise<void> {
    try {
      // No guardar el objeto File en localStorage, solo la información necesaria
      const docToStore = {
        ...tempDoc,
        file: undefined // El File se recrea cuando se necesita
      };
      
      const cacheKey = this.getCacheKey(tempDoc.id);
      localStorage.setItem(cacheKey, JSON.stringify(docToStore));
      
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new Error('Espacio insuficiente en localStorage');
      }
      throw error;
    }
  }

  private getCacheIndex(): string[] {
    try {
      const stored = localStorage.getItem(this.CACHE_INDEX_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error obteniendo índice de cache:', error);
      return [];
    }
  }

  private updateCacheIndex(tempId: string): void {
    try {
      const index = this.getCacheIndex();
      if (!index.includes(tempId)) {
        index.push(tempId);
        localStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error actualizando índice de cache:', error);
    }
  }

  private removeFromCacheIndex(tempId: string): void {
    try {
      const index = this.getCacheIndex();
      const updatedIndex = index.filter(id => id !== tempId);
      localStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(updatedIndex));
    } catch (error) {
      console.error('[TempDocumentCache] ❌ Error removiendo del índice de cache:', error);
    }
  }

  private notifyCacheChanges(): void {
    const documents = this.getAllDocuments();
    this.cacheChanges$.next(documents);
  }
}
