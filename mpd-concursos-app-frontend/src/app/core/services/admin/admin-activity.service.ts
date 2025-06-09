import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';


export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userFullName?: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFilter {
  userId?: string;
  username?: string;
  action?: string;
  module?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ActivityStats {
  totalLogs: number;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  byDate: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminActivityService {
  private apiUrl = `${environment.apiUrl}/admin/activity`;
  private http: HttpClient;

  constructor(
    private loggingService: LoggingService
  ) {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string, _options?: unknown): Observable<T> => {
        return of({} as T);
      }
    } as HttpClient;
  }


  // Mock data for development
  private mockLogs: ActivityLog[] = [
    {
      id: '1',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'LOGIN',
      module: 'AUTH',
      details: 'Inicio de sesión exitoso',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      metadata: {
        method: 'password'
      }
    },
    {
      id: '2',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'CREATE',
      module: 'USERS',
      details: 'Creación de usuario: usuario1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      metadata: {
        targetUserId: '2',
        targetUsername: 'usuario1'
      }
    },
    {
      id: '3',
      userId: '2',
      username: 'usuario1',
      userFullName: 'Usuario Uno',
      action: 'LOGIN',
      module: 'AUTH',
      details: 'Inicio de sesión exitoso',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      metadata: {
        method: 'password'
      }
    },
    {
      id: '4',
      userId: '2',
      username: 'usuario1',
      userFullName: 'Usuario Uno',
      action: 'UPDATE',
      module: 'PROFILE',
      details: 'Actualización de perfil',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      metadata: {
        fields: ['firstName', 'lastName', 'email']
      }
    },
    {
      id: '5',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'CREATE',
      module: 'CONTESTS',
      details: 'Creación de concurso: Concurso para Defensor Penal',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      metadata: {
        contestId: '1',
        contestTitle: 'Concurso para Defensor Penal'
      }
    },
    {
      id: '6',
      userId: '2',
      username: 'usuario1',
      userFullName: 'Usuario Uno',
      action: 'CREATE',
      module: 'INSCRIPTIONS',
      details: 'Creación de inscripción para concurso: Concurso para Defensor Penal',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      metadata: {
        inscriptionId: '1',
        contestId: '1',
        contestTitle: 'Concurso para Defensor Penal'
      }
    },
    {
      id: '7',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'UPDATE',
      module: 'INSCRIPTIONS',
      details: 'Actualización de estado de inscripción: PENDING -> APPROVED',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      metadata: {
        inscriptionId: '1',
        oldState: 'PENDING',
        newState: 'APPROVED',
        reason: 'Documentación completa y correcta'
      }
    },
    {
      id: '8',
      userId: '3',
      username: 'usuario2',
      userFullName: 'Usuario Dos',
      action: 'LOGIN',
      module: 'AUTH',
      details: 'Inicio de sesión fallido: credenciales incorrectas',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      metadata: {
        method: 'password',
        error: 'INVALID_CREDENTIALS'
      }
    },
    {
      id: '9',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'DELETE',
      module: 'DOCUMENTS',
      details: 'Eliminación de documento: Certificado de antecedentes penales',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      metadata: {
        documentId: '1',
        documentType: 'CRIMINAL_RECORD',
        reason: 'Documento incorrecto'
      }
    },
    {
      id: '10',
      userId: '1',
      username: 'admin',
      userFullName: 'Administrador del Sistema',
      action: 'CREATE',
      module: 'ROLES',
      details: 'Creación de rol: Revisor de Documentos',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
      metadata: {
        roleId: '5',
        roleName: 'Revisor de Documentos',
        permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE']
      }
    }
  ];



  /**
   * Get activity logs with filters and pagination
   * @param filters Filters to apply
   */
  getActivityLogs(filters: ActivityFilter = {}): Observable<{ logs: ActivityLog[], total: number }> {
    // In a real app, this would call the API
    // return this.http.get<{ logs: ActivityLog[], total: number }>(
    //   this.apiUrl,
    //   { params: this.buildParams(filters), headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching activity logs:', error);
    //     return of({ logs: [], total: 0 });
    //   })
    // );

    // Mock implementation
    let filteredLogs = [...this.mockLogs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }

      if (filters.username) {
        filteredLogs = filteredLogs.filter(log => log.username === filters.username);
      }

      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }

      if (filters.module) {
        filteredLogs = filteredLogs.filter(log => log.module === filters.module);
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.username.toLowerCase().includes(search) ||
          (log.userFullName && log.userFullName.toLowerCase().includes(search)) ||
          log.details.toLowerCase().includes(search) ||
          log.module.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search)
        );
      }

      // Sort
      if (filters.sort) {
        filteredLogs.sort((a, b) => {
          // Convertir a unknown primero para evitar errores de tipo
          const aObj = (a as unknown) as Record<string, unknown>;
          const bObj = (b as unknown) as Record<string, unknown>;
          const aValue = aObj[filters.sort!] as string | number;
          const bValue = bObj[filters.sort!] as string | number;

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.direction === 'desc'
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return filters.direction === 'desc' ? bValue - aValue : aValue - bValue;
          }

          return 0;
        });
      } else {
        // Default sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }

    // Pagination
    const page = filters?.page || 0;
    const size = filters?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedLogs = filteredLogs.slice(start, end);

    return of({
      logs: paginatedLogs,
      total: filteredLogs.length
    });
  }

  /**
   * Get activity log by ID
   * @param logId Log ID
   */
  getActivityLogById(logId: string): Observable<ActivityLog> {
    // In a real app, this would call the API
    // return this.http.get<ActivityLog>(
    //   `${this.apiUrl}/${logId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching activity log with ID ${logId}:`, error);
    //     return throwError(() => new Error('Error al obtener el registro de actividad'));
    //   })
    // );

    // Mock implementation
    const log = this.mockLogs.find(l => l.id === logId);
    if (!log) {
      return throwError(() => new Error(`Registro de actividad con ID ${logId} no encontrado`));
    }
    return of(log);
  }

  /**
   * Get activity logs for a specific user
   * @param userId User ID
   * @param filters Additional filters
   */
  getUserActivityLogs(userId: string, filters: Omit<ActivityFilter, 'userId'> = {}): Observable<{ logs: ActivityLog[], total: number }> {
    return this.getActivityLogs({ ...filters, userId });
  }

  /**
   * Get activity statistics
   */
  getActivityStats(): Observable<ActivityStats> {
    // In a real app, this would call the API
    // return this.http.get<ActivityStats>(
    //   `${this.apiUrl}/stats`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching activity stats:', error);
    //     return of({
    //       totalLogs: 0,
    //       byModule: {},
    //       byAction: {},
    //       byUser: {},
    //       byDate: {}
    //     });
    //   })
    // );

    // Mock implementation
    const stats: ActivityStats = {
      totalLogs: this.mockLogs.length,
      byModule: {},
      byAction: {},
      byUser: {},
      byDate: {}
    };

    // Count by module
    this.mockLogs.forEach(log => {
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
    });

    // Count by action
    this.mockLogs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    // Count by user
    this.mockLogs.forEach(log => {
      stats.byUser[log.username] = (stats.byUser[log.username] || 0) + 1;
    });

    // Count by date (grouped by day)
    this.mockLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    return of(stats);
  }

  /**
   * Get available activity modules
   */
  getAvailableModules(): Observable<string[]> {
    // In a real app, this would call the API
    // return this.http.get<string[]>(
    //   `${this.apiUrl}/modules`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching available modules:', error);
    //     return of([]);
    //   })
    // );

    // Mock implementation
    const modules = Array.from(new Set(this.mockLogs.map(log => log.module)));
    return of(modules);
  }

  /**
   * Get available activity actions
   */
  getAvailableActions(): Observable<string[]> {
    // In a real app, this would call the API
    // return this.http.get<string[]>(
    //   `${this.apiUrl}/actions`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching available actions:', error);
    //     return of([]);
    //   })
    // );

    // Mock implementation
    const actions = Array.from(new Set(this.mockLogs.map(log => log.action)));
    return of(actions);
  }

  /**
   * Construye los parámetros para las peticiones HTTP
   * Este método se utilizará cuando se implemente la comunicación real con el backend
   * @param filters Filtros para los datos
   * @returns HttpParams con los filtros aplicados
   */
  // Método comentado porque no se utiliza en la implementación actual
  // private _buildParams(filters?: ActivityFilter): HttpParams {
  //   let params = new HttpParams();
  //
  //   if (!filters) return params;
  //
  //   if (filters.userId) params = params.set('userId', filters.userId);
  //   if (filters.username) params = params.set('username', filters.username);
  //   if (filters.action) params = params.set('action', filters.action);
  //   if (filters.module) params = params.set('module', filters.module);
  //   if (filters.search) params = params.set('search', filters.search);
  //   if (filters.startDate) params = params.set('startDate', new Date(filters.startDate).toISOString());
  //   if (filters.endDate) params = params.set('endDate', new Date(filters.endDate).toISOString());
  //   if (filters.page !== undefined) params = params.set('page', filters.page.toString());
  //   if (filters.size) params = params.set('size', filters.size.toString());
  //   if (filters.sort) params = params.set('sort', filters.sort);
  //   if (filters.direction) params = params.set('direction', filters.direction);
  //
  //   return params;
  // }

  /**
   * Obtiene los headers para las peticiones HTTP
   * Este método se utilizará cuando se implemente la comunicación real con el backend
   * @returns HttpHeaders con los headers necesarios
   */
  // Método comentado porque no se utiliza en la implementación actual
  // private _getHeaders(): HttpHeaders {
  //   // const token = this.tokenService.getToken();
  //   return new HttpHeaders({
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer mockToken`
  //   });
  // }
}
