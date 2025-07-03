/**
 * Document State Manager Service
 * 
 * @description Servicio centralizado para gestión de estado de documentos
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { DocumentoUsuario, TipoDocumento } from '../../models/documento.model';

/**
 * Estado de un documento individual
 */
export interface DocumentState {
  id: string;
  status: 'loading' | 'loaded' | 'uploading' | 'error' | 'deleting';
  progress?: number;
  error?: string;
  lastUpdate: Date;
}

/**
 * Estado global de documentos
 */
export interface GlobalDocumentState {
  documents: DocumentoUsuario[];
  documentTypes: TipoDocumento[];
  documentStates: Map<string, DocumentState>;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  lastUpdate: Date | null;
  totalDocuments: number;
  totalTypes: number;
}

/**
 * Filtros de documentos
 */
export interface DocumentFilters {
  typeId?: string;
  status?: string;
  searchText?: string;
  requiredOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Vista de documento para UI
 */
export interface DocumentViewModel {
  tipo: TipoDocumento;
  documento: DocumentoUsuario | null;
  subido: boolean;
  estado: 'aprobado' | 'pendiente' | 'rechazado' | 'faltante';
  estadoTexto: string;
  estadoIcon: string;
  estadoColor: string;
  canUpload: boolean;
  canDelete: boolean;
  canView: boolean;
  isLoading: boolean;
  progress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentStateManagerService {

  // Estado interno
  private documentsSubject = new BehaviorSubject<DocumentoUsuario[]>([]);
  private documentTypesSubject = new BehaviorSubject<TipoDocumento[]>([]);
  private documentStatesSubject = new BehaviorSubject<Map<string, DocumentState>>(new Map());
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<{ hasError: boolean; message?: string }>({ hasError: false });
  private filtersSubject = new BehaviorSubject<DocumentFilters>({});

  // Observables públicos
  public readonly documents$ = this.documentsSubject.asObservable();
  public readonly documentTypes$ = this.documentTypesSubject.asObservable();
  public readonly documentStates$ = this.documentStatesSubject.asObservable();
  public readonly isLoading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly filters$ = this.filtersSubject.asObservable();

  // Estado global combinado
  public readonly globalState$: Observable<GlobalDocumentState> = combineLatest([
    this.documents$,
    this.documentTypes$,
    this.documentStates$,
    this.isLoading$,
    this.error$
  ]).pipe(
    map(([documents, types, states, loading, error]) => ({
      documents,
      documentTypes: types,
      documentStates: states,
      isLoading: loading,
      hasError: error.hasError,
      errorMessage: error.message,
      lastUpdate: documents.length > 0 ? new Date() : null,
      totalDocuments: documents.length,
      totalTypes: types.length
    })),
    shareReplay(1)
  );

  // Documentos filtrados
  public readonly filteredDocuments$: Observable<DocumentoUsuario[]> = combineLatest([
    this.documents$,
    this.filters$
  ]).pipe(
    map(([documents, filters]) => this.applyFilters(documents, filters)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  // ViewModels para UI
  public readonly documentViewModels$: Observable<DocumentViewModel[]> = combineLatest([
    this.documentTypes$,
    this.documents$,
    this.documentStates$
  ]).pipe(
    map(([types, documents, states]) => this.buildViewModels(types, documents, states)),
    shareReplay(1)
  );

  constructor() {
    console.log('[DocumentStateManager] Servicio inicializado');
  }

  // ==================== OPERACIONES DE ESTADO ====================

  /**
   * Actualiza la lista de documentos
   */
  updateDocuments(documents: DocumentoUsuario[]): void {
    console.log(`[DocumentStateManager] Actualizando documentos: ${documents.length}`);
    this.documentsSubject.next([...documents]);
  }

  /**
   * Actualiza la lista de tipos de documento
   */
  updateDocumentTypes(types: TipoDocumento[]): void {
    console.log(`[DocumentStateManager] Actualizando tipos: ${types.length}`);
    this.documentTypesSubject.next([...types]);
  }

  /**
   * Actualiza el estado de un documento específico
   */
  updateDocumentState(documentId: string, state: Partial<DocumentState>): void {
    const currentStates = new Map(this.documentStatesSubject.value);
    const existingState = currentStates.get(documentId) || {
      id: documentId,
      status: 'loaded',
      lastUpdate: new Date()
    };

    const newState: DocumentState = {
      ...existingState,
      ...state,
      lastUpdate: new Date()
    };

    currentStates.set(documentId, newState);
    this.documentStatesSubject.next(currentStates);
    
    console.log(`[DocumentStateManager] Estado actualizado para documento ${documentId}:`, newState);
  }

  /**
   * Establece estado de carga global
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Establece error global
   */
  setError(error: string | null): void {
    this.errorSubject.next({
      hasError: !!error,
      message: error || undefined
    });
  }

  /**
   * Actualiza filtros
   */
  updateFilters(filters: Partial<DocumentFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters };
    this.filtersSubject.next(newFilters);
    console.log('[DocumentStateManager] Filtros actualizados:', newFilters);
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersSubject.next({});
    console.log('[DocumentStateManager] Filtros limpiados');
  }

  // ==================== OPERACIONES DE CONSULTA ====================

  /**
   * Obtiene el estado actual de documentos
   */
  getCurrentDocuments(): DocumentoUsuario[] {
    return this.documentsSubject.value;
  }

  /**
   * Obtiene el estado actual de tipos
   */
  getCurrentDocumentTypes(): TipoDocumento[] {
    return this.documentTypesSubject.value;
  }

  /**
   * Obtiene el estado de un documento específico
   */
  getDocumentState(documentId: string): DocumentState | null {
    return this.documentStatesSubject.value.get(documentId) || null;
  }

  /**
   * Verifica si un documento está cargando
   */
  isDocumentLoading(documentId: string): boolean {
    const state = this.getDocumentState(documentId);
    return state?.status === 'loading' || state?.status === 'uploading';
  }

  /**
   * Obtiene documentos por tipo
   */
  getDocumentsByType(typeId: string): Observable<DocumentoUsuario[]> {
    return this.documents$.pipe(
      map(documents => documents.filter(doc => doc.tipoDocumento.id === typeId))
    );
  }

  /**
   * Obtiene estadísticas de documentos
   */
  getDocumentStats(): Observable<{
    total: number;
    byType: Map<string, number>;
    byStatus: Map<string, number>;
    loading: number;
    errors: number;
  }> {
    return combineLatest([
      this.documents$,
      this.documentStates$
    ]).pipe(
      map(([documents, states]) => {
        const byType = new Map<string, number>();
        const byStatus = new Map<string, number>();
        let loading = 0;
        let errors = 0;

        documents.forEach(doc => {
          // Por tipo
          const typeCount = byType.get(doc.tipoDocumento.nombre) || 0;
          byType.set(doc.tipoDocumento.nombre, typeCount + 1);

          // Por estado
          const statusCount = byStatus.get(doc.estado) || 0;
          byStatus.set(doc.estado, statusCount + 1);
        });

        // Estados de carga y errores
        states.forEach(state => {
          if (state.status === 'loading' || state.status === 'uploading') {
            loading++;
          }
          if (state.status === 'error') {
            errors++;
          }
        });

        return {
          total: documents.length,
          byType,
          byStatus,
          loading,
          errors
        };
      })
    );
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Aplica filtros a la lista de documentos
   */
  private applyFilters(documents: DocumentoUsuario[], filters: DocumentFilters): DocumentoUsuario[] {
    let filtered = [...documents];

    if (filters.typeId) {
      filtered = filtered.filter(doc => doc.tipoDocumento.id === filters.typeId);
    }

    if (filters.status) {
      filtered = filtered.filter(doc => doc.estado === filters.status);
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.nombreArchivo.toLowerCase().includes(searchLower) ||
        doc.tipoDocumento.nombre.toLowerCase().includes(searchLower)
      );
    }

    if (filters.requiredOnly) {
      filtered = filtered.filter(doc => doc.tipoDocumento.requerido);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(doc => new Date(doc.fechaCarga) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(doc => new Date(doc.fechaCarga) <= filters.dateTo!);
    }

    return filtered;
  }

  /**
   * Construye ViewModels para la UI
   */
  private buildViewModels(
    types: TipoDocumento[], 
    documents: DocumentoUsuario[], 
    states: Map<string, DocumentState>
  ): DocumentViewModel[] {
    
    return types.map(tipo => {
      const documento = documents.find(doc => doc.tipoDocumento.id === tipo.id);
      const state = documento ? states.get(documento.id) : null;
      
      const subido = !!documento;
      const estado = this.determineEstado(documento);
      const estadoInfo = this.getEstadoInfo(estado);
      
      return {
        tipo,
        documento,
        subido,
        estado,
        estadoTexto: estadoInfo.texto,
        estadoIcon: estadoInfo.icon,
        estadoColor: estadoInfo.color,
        canUpload: !subido || estado === 'rechazado',
        canDelete: subido && estado !== 'aprobado',
        canView: subido,
        isLoading: state?.status === 'loading' || state?.status === 'uploading' || false,
        progress: state?.progress
      };
    });
  }

  /**
   * Determina el estado de un documento
   */
  private determineEstado(documento: DocumentoUsuario | null): 'aprobado' | 'pendiente' | 'rechazado' | 'faltante' {
    if (!documento) return 'faltante';
    
    switch (documento.estado) {
      case 'APROBADO':
        return 'aprobado';
      case 'RECHAZADO':
        return 'rechazado';
      case 'PENDIENTE':
      default:
        return 'pendiente';
    }
  }

  /**
   * Obtiene información de visualización para un estado
   */
  private getEstadoInfo(estado: string): { texto: string; icon: string; color: string } {
    switch (estado) {
      case 'aprobado':
        return { texto: 'Aprobado', icon: 'fas fa-check-circle', color: 'text-green-600' };
      case 'rechazado':
        return { texto: 'Rechazado', icon: 'fas fa-times-circle', color: 'text-red-600' };
      case 'pendiente':
        return { texto: 'Pendiente', icon: 'fas fa-clock', color: 'text-yellow-600' };
      case 'faltante':
      default:
        return { texto: 'No cargado', icon: 'fas fa-upload', color: 'text-gray-500' };
    }
  }

  /**
   * Limpia todo el estado
   */
  reset(): void {
    this.documentsSubject.next([]);
    this.documentTypesSubject.next([]);
    this.documentStatesSubject.next(new Map());
    this.loadingSubject.next(false);
    this.errorSubject.next({ hasError: false });
    this.filtersSubject.next({});
    console.log('[DocumentStateManager] Estado reiniciado');
  }
}
