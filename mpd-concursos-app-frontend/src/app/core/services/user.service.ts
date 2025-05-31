import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from  'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
  lastLogin?: string;
  telefono?: string;
  direccion?: string;
}

export interface UserResponse {
  content: User[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
  roles: string[];
}

export interface UserUpdateRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  roles?: string[];
  enabled?: boolean;
}

export interface UserFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
  estado?: string;
  rol?: string;
  fechaDesde?: Date | string;
  fechaHasta?: Date | string;
  ultimoAccesoDesde?: Date | string;
  ultimoAccesoHasta?: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  getUsers(filterParams: number | UserFilterParams): Observable<UserResponse> {
    let params = new HttpParams();

    if (typeof filterParams === 'object') {
      // Si es un objeto UserFilterParams
      if (filterParams.page !== undefined) {
        params = params.set('page', filterParams.page.toString());
      }

      if (filterParams.pageSize !== undefined) {
        params = params.set('size', filterParams.pageSize.toString());
      }

      if (filterParams.sortBy) {
        params = params.set('sort', filterParams.sortBy);
      }

      if (filterParams.sortDirection) {
        params = params.set('direction', filterParams.sortDirection.toUpperCase());
      }

      if (filterParams.search) {
        params = params.set('search', filterParams.search);
      }

      if (filterParams.estado) {
        params = params.set('status', filterParams.estado);
      }

      if (filterParams.rol) {
        params = params.set('role', filterParams.rol);
      }

      // Fechas de registro
      if (filterParams.fechaDesde) {
        const fechaDesde = typeof filterParams.fechaDesde === 'string'
          ? filterParams.fechaDesde
          : filterParams.fechaDesde.toISOString().split('T')[0];
        params = params.set('createdFrom', fechaDesde);
      }

      if (filterParams.fechaHasta) {
        const fechaHasta = typeof filterParams.fechaHasta === 'string'
          ? filterParams.fechaHasta
          : filterParams.fechaHasta.toISOString().split('T')[0];
        params = params.set('createdTo', fechaHasta);
      }

      // Fechas de último acceso
      if (filterParams.ultimoAccesoDesde) {
        const ultimoAccesoDesde = typeof filterParams.ultimoAccesoDesde === 'string'
          ? filterParams.ultimoAccesoDesde
          : filterParams.ultimoAccesoDesde.toISOString().split('T')[0];
        params = params.set('lastLoginFrom', ultimoAccesoDesde);
      }

      if (filterParams.ultimoAccesoHasta) {
        const ultimoAccesoHasta = typeof filterParams.ultimoAccesoHasta === 'string'
          ? filterParams.ultimoAccesoHasta
          : filterParams.ultimoAccesoHasta.toISOString().split('T')[0];
        params = params.set('lastLoginTo', ultimoAccesoHasta);
      }
    } else {
      // Si es un número (página)
      params = params.set('page', (filterParams || 0).toString())
        .set('size', '10')
        .set('sort', 'createdAt')
        .set('direction', 'DESC');
    }

    return this.http.get<UserResponse>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Error al obtener usuarios:', error);
          return throwError(() => new Error('Error al obtener usuarios. Por favor, intente nuevamente.'));
        })
      );
  }

  getUsersByRole(role: string, page = 0, size = 10): Observable<UserResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('role', role);

    return this.http.get<UserResponse>(`${this.apiUrl}/by-role`, { params })
      .pipe(
        catchError(error => {
          console.error(`Error al obtener usuarios con rol ${role}:`, error);
          return throwError(() => new Error(`Error al obtener usuarios con rol ${role}. Por favor, intente nuevamente.`));
        })
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error al obtener usuario con ID ${id}:`, error);
          return throwError(() => new Error('Error al obtener usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  createUser(user: {
    nombre?: string;
    password?: string;
    email?: string;
    apellido?: string;
    dni?: string;
    cuit?: string;
    roles?: string[];
  }): Observable<User> {
    // Adaptar UserCreateDTO al formato esperado por la API
    const userRequest: UserCreateRequest = {
      username: user.nombre || '',
      password: user.password || '',
      email: user.email || '',
      firstName: user.nombre || '',
      lastName: user.apellido || '',
      dni: user.dni || '',
      cuit: user.cuit,
      roles: user.roles || []
    };

    return this.http.post<User>(this.apiUrl, userRequest)
      .pipe(
        catchError(error => {
          console.error('Error al crear usuario:', error);
          return throwError(() => new Error(error.error?.message || 'Error al crear usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  updateUser(user: {
    id: string | number;
    email?: string;
    nombre?: string;
    apellido?: string;
    dni?: string;
    cuit?: string;
    roles?: string[];
    estado?: string;
  }): Observable<User> {
    // Adaptar UserUpdateDTO al formato esperado por la API
    const userId = typeof user.id === 'string' ? user.id : user.id.toString();

    const userRequest: UserUpdateRequest = {
      id: userId,
      email: user.email,
      firstName: user.nombre,
      lastName: user.apellido,
      dni: user.dni,
      cuit: user.cuit,
      roles: user.roles,
      enabled: user.estado === 'activo'
    };

    return this.http.put<User>(`${this.apiUrl}/${userId}`, userRequest)
      .pipe(
        catchError(error => {
          console.error(`Error al actualizar usuario con ID ${userId}:`, error);
          return throwError(() => new Error(error.error?.message || 'Error al actualizar usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  deleteUser(id: string | number): Observable<void> {
    // Convertir id a string si es necesario
    const userId = typeof id === 'string' ? id : id.toString();

    return this.http.delete<void>(`${this.apiUrl}/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`Error al eliminar usuario con ID ${userId}:`, error);
          return throwError(() => new Error('Error al eliminar usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  changeUserPassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, { password: newPassword })
      .pipe(
        catchError(error => {
          console.error(`Error al cambiar contraseña del usuario con ID ${id}:`, error);
          return throwError(() => new Error('Error al cambiar contraseña. Por favor, intente nuevamente.'));
        })
      );
  }

  enableUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/enable`, {})
      .pipe(
        catchError(error => {
          console.error(`Error al habilitar usuario con ID ${id}:`, error);
          return throwError(() => new Error('Error al habilitar usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  disableUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/disable`, {})
      .pipe(
        catchError(error => {
          console.error(`Error al deshabilitar usuario con ID ${id}:`, error);
          return throwError(() => new Error('Error al deshabilitar usuario. Por favor, intente nuevamente.'));
        })
      );
  }

  searchUsers(query: string, page = 0, size = 10): Observable<UserResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<UserResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => {
          console.error(`Error al buscar usuarios con query "${query}":`, error);
          return throwError(() => new Error('Error al buscar usuarios. Por favor, intente nuevamente.'));
        })
      );
  }
}
