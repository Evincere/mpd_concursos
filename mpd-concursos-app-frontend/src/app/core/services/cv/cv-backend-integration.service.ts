/**
 * Servicio de Integración con Backend para Sistema CV
 * 
 * @description Maneja la comunicación con APIs REST del backend hexagonal
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, retry, catchError, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { WorkExperience, EducationEntry } from '@core/models/cv';
import { CvNotificationService } from './cv-notification.service';

/**
 * Configuración de API
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTimeout: number;
}

/**
 * Respuesta de API paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

/**
 * Respuesta de API estándar
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

/**
 * Error de API
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Parámetros de búsqueda
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    size: number;
  };
}

/**
 * Estado de sincronización
 */
export interface SyncState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: SyncConflict[];
}

/**
 * Conflicto de sincronización
 */
export interface SyncConflict {
  id: string;
  type: 'experience' | 'education' | 'preferences';
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}

/**
 * Operación offline
 */
export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'experience' | 'education' | 'preferences';
  data: any;
  timestamp: Date;
  retryCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CvBackendIntegrationService {
  // ===== SERVICIOS INYECTADOS =====
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(CvNotificationService);

  // ===== CONFIGURACIÓN =====
  private readonly config: ApiConfig = {
    baseUrl: environment.apiUrl || 'http://localhost:8080/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableCaching: true,
    cacheTimeout: 300000 // 5 minutos
  };

  // ===== ESTADO REACTIVO =====
  private readonly syncStateSignal = signal<SyncState>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: []
  });

  // ===== CACHE Y OFFLINE =====
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly offlineQueue: OfflineOperation[] = [];

  // ===== OBSERVABLES =====
  private readonly onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);

  // ===== GETTERS PÚBLICOS =====
  public readonly syncState = this.syncStateSignal.asReadonly();
  public readonly isOnline$ = this.onlineStatus$.asObservable();

  constructor() {
    this.setupOnlineStatusListener();
    this.setupPeriodicSync();
  }

  // ===== MÉTODOS DE EXPERIENCIAS LABORALES =====

  /**
   * Obtiene todas las experiencias laborales
   */
  getExperiences(params?: SearchParams): Observable<PaginatedResponse<WorkExperience>> {
    const url = `${this.config.baseUrl}/cv/experiences`;
    const httpParams = this.buildHttpParams(params);

    return this.makeRequest<PaginatedResponse<WorkExperience>>('GET', url, null, httpParams)
      .pipe(
        tap(response => this.cacheResponse(`experiences_${JSON.stringify(params)}`, response))
      );
  }

  /**
   * Obtiene una experiencia laboral por ID
   */
  getExperience(id: string): Observable<ApiResponse<WorkExperience>> {
    const url = `${this.config.baseUrl}/cv/experiences/${id}`;
    return this.makeRequest<ApiResponse<WorkExperience>>('GET', url);
  }

  /**
   * Crea una nueva experiencia laboral
   */
  createExperience(experience: Omit<WorkExperience, 'id'>): Observable<ApiResponse<WorkExperience>> {
    const url = `${this.config.baseUrl}/cv/experiences`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('create', 'experience', experience);
    }

    return this.makeRequest<ApiResponse<WorkExperience>>('POST', url, experience)
      .pipe(
        tap(() => this.invalidateCache('experiences'))
      );
  }

  /**
   * Actualiza una experiencia laboral
   */
  updateExperience(id: string, experience: Partial<WorkExperience>): Observable<ApiResponse<WorkExperience>> {
    const url = `${this.config.baseUrl}/cv/experiences/${id}`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('update', 'experience', { id, ...experience });
    }

    return this.makeRequest<ApiResponse<WorkExperience>>('PUT', url, experience)
      .pipe(
        tap(() => this.invalidateCache('experiences'))
      );
  }

  /**
   * Elimina una experiencia laboral
   */
  deleteExperience(id: string): Observable<ApiResponse<void>> {
    const url = `${this.config.baseUrl}/cv/experiences/${id}`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('delete', 'experience', { id });
    }

    return this.makeRequest<ApiResponse<void>>('DELETE', url)
      .pipe(
        tap(() => this.invalidateCache('experiences'))
      );
  }

  // ===== MÉTODOS DE EDUCACIÓN =====

  /**
   * Obtiene todas las entradas de educación
   */
  getEducation(params?: SearchParams): Observable<PaginatedResponse<EducationEntry>> {
    const url = `${this.config.baseUrl}/cv/education`;
    const httpParams = this.buildHttpParams(params);

    return this.makeRequest<PaginatedResponse<EducationEntry>>('GET', url, null, httpParams)
      .pipe(
        tap(response => this.cacheResponse(`education_${JSON.stringify(params)}`, response))
      );
  }

  /**
   * Obtiene una entrada de educación por ID
   */
  getEducationEntry(id: string): Observable<ApiResponse<EducationEntry>> {
    const url = `${this.config.baseUrl}/cv/education/${id}`;
    return this.makeRequest<ApiResponse<EducationEntry>>('GET', url);
  }

  /**
   * Crea una nueva entrada de educación
   */
  createEducationEntry(education: Omit<EducationEntry, 'id'>): Observable<ApiResponse<EducationEntry>> {
    const url = `${this.config.baseUrl}/cv/education`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('create', 'education', education);
    }

    return this.makeRequest<ApiResponse<EducationEntry>>('POST', url, education)
      .pipe(
        tap(() => this.invalidateCache('education'))
      );
  }

  /**
   * Actualiza una entrada de educación
   */
  updateEducationEntry(id: string, education: Partial<EducationEntry>): Observable<ApiResponse<EducationEntry>> {
    const url = `${this.config.baseUrl}/cv/education/${id}`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('update', 'education', { id, ...education });
    }

    return this.makeRequest<ApiResponse<EducationEntry>>('PUT', url, education)
      .pipe(
        tap(() => this.invalidateCache('education'))
      );
  }

  /**
   * Elimina una entrada de educación
   */
  deleteEducationEntry(id: string): Observable<ApiResponse<void>> {
    const url = `${this.config.baseUrl}/cv/education/${id}`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('delete', 'education', { id });
    }

    return this.makeRequest<ApiResponse<void>>('DELETE', url)
      .pipe(
        tap(() => this.invalidateCache('education'))
      );
  }

  // ===== MÉTODOS DE BÚSQUEDA =====

  /**
   * Realiza búsqueda avanzada en el CV
   */
  searchCV(params: SearchParams): Observable<ApiResponse<{
    experiences: WorkExperience[];
    education: EducationEntry[];
    totalResults: number;
  }>> {
    const url = `${this.config.baseUrl}/cv/search`;
    const httpParams = this.buildHttpParams(params);

    return this.makeRequest<ApiResponse<any>>('GET', url, null, httpParams);
  }

  /**
   * Obtiene sugerencias de autocompletado
   */
  getSuggestions(query: string, type: 'companies' | 'technologies' | 'institutions'): Observable<ApiResponse<string[]>> {
    const url = `${this.config.baseUrl}/cv/suggestions/${type}`;
    const httpParams = new HttpParams().set('q', query);

    return this.makeRequest<ApiResponse<string[]>>('GET', url, null, httpParams);
  }

  // ===== MÉTODOS DE SINCRONIZACIÓN =====

  /**
   * Sincroniza datos con el servidor
   */
  syncData(): Observable<ApiResponse<SyncState>> {
    if (!this.syncState().isOnline) {
      return throwError(() => new Error('No hay conexión a internet'));
    }

    this.updateSyncState({ syncInProgress: true });

    return this.processOfflineQueue().pipe(
      map(() => ({
        success: true,
        data: this.syncState()
      })),
      tap(() => {
        this.updateSyncState({
          syncInProgress: false,
          lastSync: new Date(),
          pendingChanges: 0
        });
      }),
      catchError(error => {
        this.updateSyncState({ syncInProgress: false });
        return throwError(() => error);
      })
    );
  }

  /**
   * Resuelve conflictos de sincronización
   */
  resolveConflict(conflictId: string, resolution: 'local' | 'server'): Observable<ApiResponse<void>> {
    const url = `${this.config.baseUrl}/cv/sync/conflicts/${conflictId}/resolve`;
    const body = { resolution };

    return this.makeRequest<ApiResponse<void>>('POST', url, body)
      .pipe(
        tap(() => {
          const currentState = this.syncState();
          const updatedConflicts = currentState.conflicts.filter(c => c.id !== conflictId);
          this.updateSyncState({ conflicts: updatedConflicts });
        })
      );
  }

  // ===== MÉTODOS DE PREFERENCIAS =====

  /**
   * Obtiene preferencias del usuario
   */
  getUserPreferences(): Observable<ApiResponse<any>> {
    const url = `${this.config.baseUrl}/cv/preferences`;
    return this.makeRequest<ApiResponse<any>>('GET', url);
  }

  /**
   * Actualiza preferencias del usuario
   */
  updateUserPreferences(preferences: any): Observable<ApiResponse<any>> {
    const url = `${this.config.baseUrl}/cv/preferences`;
    
    if (!this.syncState().isOnline) {
      return this.queueOfflineOperation('update', 'preferences', preferences);
    }

    return this.makeRequest<ApiResponse<any>>('PUT', url, preferences);
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Realiza una petición HTTP con manejo de errores
   */
  private makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any,
    params?: HttpParams
  ): Observable<T> {
    let request$: Observable<T>;

    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(url, { params });
        break;
      case 'POST':
        request$ = this.http.post<T>(url, body, { params });
        break;
      case 'PUT':
        request$ = this.http.put<T>(url, body, { params });
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(url, { params });
        break;
    }

    return request$.pipe(
      retry({
        count: this.config.retryAttempts,
        delay: this.config.retryDelay
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Construye parámetros HTTP
   */
  private buildHttpParams(params?: SearchParams): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      if (params.query) {
        httpParams = httpParams.set('q', params.query);
      }

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => {
              httpParams = httpParams.append(key, v.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        });
      }

      if (params.sort) {
        httpParams = httpParams.set('sort', `${params.sort.field},${params.sort.direction}`);
      }

      if (params.pagination) {
        httpParams = httpParams.set('page', params.pagination.page.toString());
        httpParams = httpParams.set('size', params.pagination.size.toString());
      }
    }

    return httpParams;
  }

  /**
   * Maneja errores de API
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud inválida';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Acceso denegado';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Configura listener de estado online/offline
   */
  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.onlineStatus$.next(true);
      this.updateSyncState({ isOnline: true });
      this.syncData().subscribe();
    });

    window.addEventListener('offline', () => {
      this.onlineStatus$.next(false);
      this.updateSyncState({ isOnline: false });
    });
  }

  /**
   * Configura sincronización periódica
   */
  private setupPeriodicSync(): void {
    setInterval(() => {
      if (this.syncState().isOnline && this.offlineQueue.length > 0) {
        this.syncData().subscribe();
      }
    }, 60000); // Cada minuto
  }

  /**
   * Actualiza el estado de sincronización
   */
  private updateSyncState(updates: Partial<SyncState>): void {
    const currentState = this.syncStateSignal();
    this.syncStateSignal.set({ ...currentState, ...updates });
  }

  /**
   * Encola operación offline
   */
  private queueOfflineOperation(
    type: OfflineOperation['type'],
    entity: OfflineOperation['entity'],
    data: any
  ): Observable<any> {
    const operation: OfflineOperation = {
      id: this.generateId(),
      type,
      entity,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    this.offlineQueue.push(operation);
    this.updateSyncState({ pendingChanges: this.offlineQueue.length });

    // Retornar observable simulado para mantener consistencia
    return new BehaviorSubject({
      success: true,
      data: data,
      message: 'Operación guardada para sincronización posterior'
    }).asObservable();
  }

  /**
   * Procesa cola de operaciones offline
   */
  private processOfflineQueue(): Observable<void> {
    const operations = [...this.offlineQueue];
    this.offlineQueue.length = 0;

    const requests = operations.map(operation => {
      switch (operation.type) {
        case 'create':
          return this.executeCreateOperation(operation);
        case 'update':
          return this.executeUpdateOperation(operation);
        case 'delete':
          return this.executeDeleteOperation(operation);
      }
    });

    return new Observable(observer => {
      Promise.all(requests)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Ejecuta operación de creación
   */
  private executeCreateOperation(operation: OfflineOperation): Promise<any> {
    const url = `${this.config.baseUrl}/cv/${operation.entity}`;
    return this.http.post(url, operation.data).toPromise();
  }

  /**
   * Ejecuta operación de actualización
   */
  private executeUpdateOperation(operation: OfflineOperation): Promise<any> {
    const { id, ...data } = operation.data;
    const url = `${this.config.baseUrl}/cv/${operation.entity}/${id}`;
    return this.http.put(url, data).toPromise();
  }

  /**
   * Ejecuta operación de eliminación
   */
  private executeDeleteOperation(operation: OfflineOperation): Promise<any> {
    const url = `${this.config.baseUrl}/cv/${operation.entity}/${operation.data.id}`;
    return this.http.delete(url).toPromise();
  }

  /**
   * Cachea respuesta
   */
  private cacheResponse(key: string, data: any): void {
    if (this.config.enableCaching) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Invalida cache
   */
  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Genera ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
