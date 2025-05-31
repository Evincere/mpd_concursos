import { Injectable } from '@angular/core';
import { HttpParams, HttpErrorResponse } from  '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  User,
  UserCreateDTO,
  UserUpdateDTO,
  UserFilterParams,
  UserListResponse
} from '../interfaces/user/user.interface';
import {
  ApiResponse,
  ApiPaginatedResponse
} from '../interfaces/api/api-response.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}



  /**
   * Obtiene un listado paginado de usuarios
   * @param filters Parámetros de filtrado
   * @returns Observable con la respuesta paginada
   */
  getUsers(filters: UserFilterParams = {}): Observable<UserListResponse> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters.rol) {
      params = params.set('rol', filters.rol);
    }

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters.sortDirection) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    // Fechas de registro
    if (filters.fechaDesde) {
      const fechaDesde = typeof filters.fechaDesde === 'string'
        ? filters.fechaDesde
        : filters.fechaDesde.toISOString().split('T')[0];
      params = params.set('fechaDesde', fechaDesde);
    }

    if (filters.fechaHasta) {
      const fechaHasta = typeof filters.fechaHasta === 'string'
        ? filters.fechaHasta
        : filters.fechaHasta.toISOString().split('T')[0];
      params = params.set('fechaHasta', fechaHasta);
    }

    // Fechas de último acceso
    if (filters.ultimoAccesoDesde) {
      const ultimoAccesoDesde = typeof filters.ultimoAccesoDesde === 'string'
        ? filters.ultimoAccesoDesde
        : filters.ultimoAccesoDesde.toISOString().split('T')[0];
      params = params.set('ultimoAccesoDesde', ultimoAccesoDesde);
    }

    if (filters.ultimoAccesoHasta) {
      const ultimoAccesoHasta = typeof filters.ultimoAccesoHasta === 'string'
        ? filters.ultimoAccesoHasta
        : filters.ultimoAccesoHasta.toISOString().split('T')[0];
      params = params.set('ultimoAccesoHasta', ultimoAccesoHasta);
    }

    return this.http.get<ApiPaginatedResponse<User>>(this.apiUrl, { params })
      .pipe(
        map(response => ({
          items: response.data,
          totalItems: response.pagination.totalItems,
          page: response.pagination.currentPage,
          pageSize: response.pagination.pageSize
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene un usuario por su ID
   * @param id ID del usuario
   * @returns Observable con el usuario
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   * @returns Observable con el usuario creado
   */
  createUser(user: UserCreateDTO): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza un usuario existente
   * @param user Datos del usuario a actualizar
   * @returns Observable con el usuario actualizado
   */
  updateUser(user: UserUpdateDTO): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${user.id}`, user)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   * @returns Observable con la respuesta
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Cambia el estado de un usuario
   * @param id ID del usuario
   * @param estado Nuevo estado
   * @returns Observable con el usuario actualizado
   */
  changeUserStatus(id: number, estado: 'activo' | 'inactivo' | 'bloqueado'): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}/status`, { estado })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}, Mensaje: ${error.error?.message || error.statusText}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
