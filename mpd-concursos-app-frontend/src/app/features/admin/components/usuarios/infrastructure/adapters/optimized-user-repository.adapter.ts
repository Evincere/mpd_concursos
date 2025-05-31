import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiService } from '@core/services/api/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '@env/environment';
import { UserRepositoryPort } from '../../application/ports/user-repository.port';
import {
  User,
  UserFilter,
  PaginatedUsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatusChangeRequest,
  UserRoleChangeRequest,
  ResetPasswordRequest,
  UserAuditLog,
  UserStats,
  UserStatus
} from '../../domain/models/user.model';

/**
 * Adaptador optimizado para el repositorio de usuarios
 * Implementa el puerto UserRepositoryPort
 * Utiliza el servicio ApiService para comunicarse con el backend
 * Implementa caché y optimizaciones para mejorar el rendimiento
 */
@Injectable({
  providedIn: 'root'
})
export class OptimizedUserRepositoryAdapter implements UserRepositoryPort {
  // Ruta base de la API
  private readonly API_BASE_PATH = 'users';
  // Ruta para roles
  private readonly ROLES_PATH = 'users/roles';

  // Observable para indicar si hay una operación en curso
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Caché de usuarios
  private usersCache: PaginatedUsersResponse | null = null;

  constructor(
    @Inject(ApiService) private apiService: ApiService
  ) {}

  // La implementación de invalidateCache se encuentra al final de la clase

  /**
   * Obtiene usuarios con filtros y paginación
   * @param filters Filtros a aplicar
   */
  getUsers(filters?: UserFilter): Observable<PaginatedUsersResponse> {
    this.loadingSubject.next(true);

    // Invalidar la caché antes de obtener usuarios
    this.invalidateCache();

    // Convertir UserFilter a Record<string, string | number | boolean>
    const params: Record<string, string | number | boolean> = {};

    // Añadir un parámetro timestamp para evitar caché
    params['_t'] = new Date().getTime();

    if (filters) {
      // Procesar el término de búsqueda
      if (filters.search) {
        // Asegurarse de que el término de búsqueda sea una cadena
        params['query'] = filters.search.toString().trim();
      }

      // Procesar el filtro de rol
      if (filters.role && filters.role !== '') {
        params['role'] = filters.role;
      }

      // Procesar el filtro de estado
      if ('status' in filters && filters.status && filters.status !== '') {
        // Solo incluir el parámetro status si tiene un valor no vacío
        params['status'] = filters.status;
        console.log(`[OptimizedUserRepositoryAdapter] Aplicando filtro de estado: ${filters.status}`);
      } else {
        // Si el filtro de estado no está presente o está vacío, no incluir el parámetro
        // para que el backend muestre todos los estados
        console.log('[OptimizedUserRepositoryAdapter] No se aplica filtro de estado, mostrando todos los estados');
      }

      // Procesar fechas
      if (filters.startDate) {
        // Convertir a formato ISO para asegurar compatibilidad
        if (filters.startDate instanceof Date) {
          params['startDate'] = filters.startDate.toISOString().split('T')[0];
        } else if (typeof filters.startDate === 'string') {
          params['startDate'] = filters.startDate;
        } else {
          console.warn('startDate tiene un tipo no esperado:', typeof filters.startDate);
        }
      }

      if (filters.endDate) {
        // Convertir a formato ISO para asegurar compatibilidad
        if (filters.endDate instanceof Date) {
          params['endDate'] = filters.endDate.toISOString().split('T')[0];
        } else if (typeof filters.endDate === 'string') {
          params['endDate'] = filters.endDate;
        } else {
          console.warn('endDate tiene un tipo no esperado:', typeof filters.endDate);
        }
      }

      // Procesar paginación
      if (filters.page !== undefined) {
        params['page'] = filters.page;
      }

      if (filters.size !== undefined) {
        params['size'] = filters.size;
      }

      // Procesar ordenamiento
      if (filters.sort) {
        params['sort'] = filters.sort;
      }

      if (filters.direction) {
        params['direction'] = filters.direction;
      }
    }

    console.log('Enviando solicitud con parámetros:', params);

    // Tipo para la respuesta del backend (Spring Page)
    interface SpringPageResponse<T> {
      content: T[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
      last: boolean;
      first: boolean;
      empty: boolean;
    }

    return this.apiService.get<SpringPageResponse<User>>(this.API_BASE_PATH, {
      params,
      cache: {
        ttl: 0, // Sin caché
        forceRefresh: true // Forzar recarga
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      maxRetries: 2,
      retryDelay: 1000
    }).pipe(
      // Mapear la respuesta del backend a la estructura esperada por el frontend
      map(response => {
        console.log('Respuesta original del backend:', response);

        // Si la respuesta ya tiene la estructura esperada
        if ('users' in response && 'total' in response) {
          return response as PaginatedUsersResponse;
        }

        // Si la respuesta tiene la estructura de Spring Page
        if ('content' in response && 'totalElements' in response) {
          const paginatedResponse = {
            users: response.content,
            total: response.totalElements,
            page: response.number,
            size: response.size,
            last: response.last,
            totalPages: response.totalPages
          } as PaginatedUsersResponse;

          // Guardar en caché
          this.usersCache = paginatedResponse;

          return paginatedResponse;
        }

        // Si la respuesta es un array (caso poco probable pero posible)
        if (Array.isArray(response)) {
          const responseArray = response as unknown[];
          return {
            users: responseArray as User[],
            total: responseArray.length
          } as PaginatedUsersResponse;
        }

        // Si no podemos determinar la estructura, devolver un objeto vacío
        console.error('Estructura de respuesta no reconocida:', response);
        return { users: [], total: 0 };
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return of({ users: [], total: 0 });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Obtiene un usuario por su ID
   * @param userId ID del usuario
   */
  getUserById(userId: string): Observable<User> {
    this.loadingSubject.next(true);

    return this.apiService.get<User>(`${this.API_BASE_PATH}/${userId}`, {
      cache: {
        ttl: 0, // Sin caché
        forceRefresh: true // Forzar recarga
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        '_t': new Date().getTime() // Añadir timestamp para evitar caché
      }
    }).pipe(
      catchError(error => {
        console.error(`Error fetching user with ID ${userId}:`, error);
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   */
  createUser(user: CreateUserRequest): Observable<User> {
    this.loadingSubject.next(true);

    return this.apiService.post<User>(this.API_BASE_PATH, user).pipe(
      tap(() => {
        // Invalidar caché manualmente
        this.invalidateCache();
      }),
      catchError(error => {
        console.error('Error creating user:', error);
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Actualiza un usuario existente
   * @param user Datos del usuario a actualizar
   */
  updateUser(user: UpdateUserRequest): Observable<User> {
    this.loadingSubject.next(true);

    console.log(`[OptimizedUserRepositoryAdapter] Actualizando usuario con ID ${user.id}:`, user);
    console.log(`[OptimizedUserRepositoryAdapter] URL de la petición: ${this.API_BASE_PATH}/${user.id}`);

    // Crear una copia del objeto para evitar modificar el original
    const userToUpdate = { ...user };

    // Eliminar propiedades undefined o null
    Object.keys(userToUpdate).forEach(key => {
      const typedKey = key as keyof UpdateUserRequest;
      if (userToUpdate[typedKey] === undefined || userToUpdate[typedKey] === null) {
        delete userToUpdate[typedKey];
      }
    });

    // Asegurarse de que los roles sean un array
    if (userToUpdate.roles && !Array.isArray(userToUpdate.roles)) {
      userToUpdate.roles = [userToUpdate.roles as unknown as string];
    }

    console.log(`[OptimizedUserRepositoryAdapter] Objeto de usuario limpio para enviar:`, userToUpdate);

    // Opciones para la solicitud HTTP con reintentos
    const requestOptions = {
      maxRetries: 2,
      retryDelay: 1000,
      shouldRetry: (error: any) => {
        // Reintentar solo para errores de red o errores 500
        return error.status === 0 || error.status === 500;
      }
    };

    return this.apiService.put<User>(`${this.API_BASE_PATH}/${user.id}`, userToUpdate, requestOptions).pipe(
      tap(response => {
        console.log(`[OptimizedUserRepositoryAdapter] Usuario actualizado correctamente:`, response);
        // Invalidar caché manualmente
        this.invalidateCache();
      }),
      catchError(error => {
        console.error(`[OptimizedUserRepositoryAdapter] Error updating user with ID ${user.id}:`, error);

        // Mostrar más detalles del error
        if (error.status) {
          console.error(`[OptimizedUserRepositoryAdapter] Status: ${error.status}, Mensaje: ${error.message}`);
        }

        if (error.error) {
          console.error('[OptimizedUserRepositoryAdapter] Error detallado:', error.error);
        }

        // Verificar si es un error de validación
        if (error.status === 400) {
          console.warn('[OptimizedUserRepositoryAdapter] Error de validación. Verificando campos problemáticos...');

          // Intentar identificar campos problemáticos
          if (error.error && error.error.detail) {
            console.warn(`[OptimizedUserRepositoryAdapter] Detalle del error: ${error.error.detail}`);
          }
        }

        // Verificar si es un error de servidor
        if (error.status === 500) {
          console.error('[OptimizedUserRepositoryAdapter] Error interno del servidor. Posible problema con el formato de datos o conflicto en la base de datos.');

          // Intentar identificar la causa del error
          if (error.error && error.error.detail) {
            console.error(`[OptimizedUserRepositoryAdapter] Detalle del error: ${error.error.detail}`);
          }

          // Verificar si el error está relacionado con el CUIT
          const errorString = JSON.stringify(error).toLowerCase();
          if (errorString.includes('cuit')) {
            console.error('[OptimizedUserRepositoryAdapter] Error relacionado con el CUIT detectado. Posible formato inválido.');

            // Crear un error personalizado con un mensaje más descriptivo
            error = new HttpErrorResponse({
              error: {
                message: 'Error al validar el CUIT. Asegúrese de que el CUIT tenga 11 dígitos numéricos y un formato válido, o déjelo en blanco.',
                detail: 'El CUIT debe tener 11 dígitos numéricos y un formato válido, o dejarse en blanco.'
              },
              status: 400, // Cambiar a 400 para que se maneje como un error de validación
              statusText: 'Bad Request',
              url: error.url
            });
          }
        }

        throw error;
      }),
      finalize(() => {
        console.log(`[OptimizedUserRepositoryAdapter] Finalizada petición de actualización para usuario ${user.id}`);
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Cambia el estado de un usuario
   * @param statusChange Datos del cambio de estado
   */
  changeUserStatus(statusChange: UserStatusChangeRequest): Observable<User> {
    this.loadingSubject.next(true);

    console.log('Cambiando estado de usuario:', statusChange);

    // Construir el cuerpo de la solicitud según lo que espera el backend
    const requestBody = {
      status: statusChange.status,
      reason: statusChange.reason || 'Cambio de estado por administrador'
    };

    // Usar la URL correcta para el endpoint de cambio de estado
    const endpoints = [
      `${this.API_BASE_PATH}/${statusChange.userId}/status`,
      `/api/auth/users/${statusChange.userId}/status`
    ];

    // Invalidar la caché antes de hacer la solicitud
    this.invalidateCache();

    // Forzar una limpieza de la caché del navegador para esta URL específica
    if (window.caches) {
      endpoints.forEach(endpoint => {
        // Construir la URL completa manualmente
        const baseUrl = environment.apiUrl.endsWith('/')
          ? environment.apiUrl.slice(0, -1)
          : environment.apiUrl;
        const normalizedEndpoint = endpoint.startsWith('/')
          ? endpoint.slice(1)
          : endpoint;
        const fullUrl = `${baseUrl}/${normalizedEndpoint}`;

        console.log(`Intentando eliminar caché para URL específica: ${fullUrl}`);
        window.caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            window.caches.open(cacheName).then(cache => {
              cache.delete(fullUrl).then(deleted => {
                if (deleted) console.log(`Caché eliminada para URL: ${fullUrl}`);
              });
            });
          });
        });
      });
    }

    // Intentar con el primer endpoint
    return this.apiService.patch<any>(endpoints[0], requestBody, {
      // Deshabilitar la caché para esta solicitud
      cache: {
        ttl: 0,
        forceRefresh: true
      }
    }).pipe(
      map(response => {
        console.log('Respuesta del cambio de estado:', response);

        // Invalidar caché nuevamente después de recibir la respuesta
        this.invalidateCache();

        // Mapear la respuesta a un objeto User
        const updatedUser = this.mapStatusResponseToUser(response, statusChange.userId);

        // Forzar una actualización del usuario en la caché
        if (this.usersCache && this.usersCache.users) {
          const index = this.usersCache.users.findIndex(u => u.id === statusChange.userId);
          if (index !== -1) {
            // Actualizar el usuario en la caché
            this.usersCache.users[index] = {
              ...this.usersCache.users[index],
              status: statusChange.status
            };
            console.log(`Usuario con ID ${statusChange.userId} actualizado en caché a estado ${statusChange.status}`);
          }
        }

        // Forzar una recarga completa de los usuarios después de un breve retraso
        // para asegurar que el backend haya procesado completamente el cambio
        setTimeout(() => {
          console.log('Forzando recarga completa de usuarios después del cambio de estado');
          this.getUsers();
        }, 500);

        return updatedUser;
      }),
      catchError(error => {
        console.error(`Error changing status for user with ID ${statusChange.userId} with first endpoint:`, error);

        // Si el error es 404, intentar con el segundo endpoint
        if (error.status === 404) {
          console.log('Intentando con endpoint alternativo...');
          return this.apiService.patch<any>(endpoints[1], requestBody, {
            // Deshabilitar la caché para esta solicitud
            cache: {
              ttl: 0,
              forceRefresh: true
            }
          }).pipe(
            map(response => {
              console.log('Respuesta del endpoint alternativo:', response);

              // Invalidar caché nuevamente después de recibir la respuesta
              this.invalidateCache();

              // Mapear la respuesta a un objeto User
              const updatedUser = this.mapStatusResponseToUser(response, statusChange.userId);

              // Forzar una actualización del usuario en la caché
              if (this.usersCache && this.usersCache.users) {
                const index = this.usersCache.users.findIndex(u => u.id === statusChange.userId);
                if (index !== -1) {
                  // Actualizar el usuario en la caché
                  this.usersCache.users[index] = {
                    ...this.usersCache.users[index],
                    status: statusChange.status
                  };
                  console.log(`Usuario con ID ${statusChange.userId} actualizado en caché a estado ${statusChange.status}`);
                }
              }

              // Forzar una recarga completa de los usuarios después de un breve retraso
              // para asegurar que el backend haya procesado completamente el cambio
              setTimeout(() => {
                console.log('Forzando recarga completa de usuarios después del cambio de estado (endpoint alternativo)');
                this.getUsers();
              }, 500);

              return updatedUser;
            }),
            catchError(altError => {
              console.error(`Error with alternative endpoint for user ID ${statusChange.userId}:`, altError);
              throw altError;
            })
          );
        }

        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Mapea la respuesta del cambio de estado a un objeto User
   * @param response Respuesta del backend
   * @param userId ID del usuario
   */
  private mapStatusResponseToUser(response: any, userId: string): User {
    // Si la respuesta ya es un objeto User completo, devolverlo
    if (response && response.id && response.username && response.email) {
      return response as User;
    }

    // Si la respuesta es un objeto UserStatusResponse, crear un objeto User parcial
    if (response && response.id && response.status) {
      // Obtener el usuario de la caché si existe
      const cachedUser = this.getUserFromCache(userId);
      if (cachedUser) {
        // Actualizar el estado del usuario en caché
        cachedUser.status = response.status as UserStatus;
        return cachedUser;
      }

      // Si no hay usuario en caché, crear uno parcial con la información disponible
      return {
        id: response.id,
        username: response.username || 'unknown',
        email: 'unknown@example.com',
        firstName: '',
        lastName: '',
        dni: '',
        roles: [],
        status: response.status as UserStatus,
        createdAt: new Date(),
        enabled: true
      };
    }

    // Si la respuesta no tiene la estructura esperada, lanzar un error
    throw new Error('Respuesta inesperada del servidor');
  }

  /**
   * Obtiene un usuario de la caché
   * @param userId ID del usuario
   */
  private getUserFromCache(userId: string): User | null {
    if (!this.usersCache) {
      return null;
    }

    const cachedUsers = this.usersCache.users;
    return cachedUsers.find((user: User) => user.id === userId) || null;
  }

  /**
   * Cambia los roles de un usuario
   * @param roleChange Datos del cambio de roles
   */
  changeUserRoles(roleChange: UserRoleChangeRequest): Observable<User> {
    this.loadingSubject.next(true);

    return this.apiService.patch<User>(`${this.API_BASE_PATH}/${roleChange.userId}/roles`, roleChange).pipe(
      tap(() => {
        // Invalidar caché manualmente
        this.invalidateCache();
      }),
      catchError(error => {
        console.error(`Error changing roles for user with ID ${roleChange.userId}:`, error);
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Restablece la contraseña de un usuario
   * @param resetRequest Datos de la solicitud de restablecimiento
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    this.loadingSubject.next(true);

    return this.apiService.post<{ success: boolean, message: string }>(
      `${this.API_BASE_PATH}/${resetRequest.userId}/reset-password`,
      resetRequest
    ).pipe(
      catchError(error => {
        console.error(`Error resetting password for user with ID ${resetRequest.userId}:`, error);
        return of({ success: false, message: 'Error al restablecer la contraseña' });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario a eliminar
   */
  deleteUser(userId: string): Observable<{ success: boolean, message: string }> {
    this.loadingSubject.next(true);

    return this.apiService.delete<void>(`${this.API_BASE_PATH}/${userId}`).pipe(
      map(() => ({ success: true, message: 'Usuario eliminado correctamente' })),
      tap(() => {
        // Invalidar caché manualmente
        this.invalidateCache();
      }),
      catchError(error => {
        console.error(`Error deleting user with ID ${userId}:`, error);
        return of({ success: false, message: 'Error al eliminar el usuario' });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Obtiene el historial de auditoría de un usuario
   * @param userId ID del usuario
   */
  getUserAuditLogs(userId: string): Observable<UserAuditLog[]> {
    this.loadingSubject.next(true);

    return this.apiService.get<UserAuditLog[]>(`${this.API_BASE_PATH}/${userId}/audit-logs`, {
      cache: {
        ttl: 60000 // 1 minuto
      }
    }).pipe(
      catchError(error => {
        console.error(`Error fetching audit logs for user with ID ${userId}:`, error);
        return of([]);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Obtiene los roles disponibles
   */
  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]> {
    this.loadingSubject.next(true);

    return this.apiService.get<{ id: string, name: string, description: string }[]>(this.ROLES_PATH, {
      cache: {
        ttl: 3600000 // 1 hora
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching available roles:', error);
        return of([]);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  getUserStats(): Observable<UserStats> {
    this.loadingSubject.next(true);

    return this.apiService.get<UserStats>(`${this.API_BASE_PATH}/stats`, {
      cache: {
        ttl: 300000 // 5 minutos
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching user stats:', error);
        return of({
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          blockedUsers: 0,
          adminUsers: 0,
          regularUsers: 0,
          newUsersLastMonth: 0,
          activeUsersLastMonth: 0
        });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Verifica si un nombre de usuario ya existe
   * @param username Nombre de usuario a verificar
   */
  checkUsernameExists(username: string): Observable<boolean> {
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-username`, {
      params: { username }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        console.error(`Error checking if username ${username} exists:`, error);
        return of(false);
      })
    );
  }

  /**
   * Verifica si un correo electrónico ya existe
   * @param email Correo electrónico a verificar
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-email`, {
      params: { email }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        console.error(`Error checking if email ${email} exists:`, error);
        return of(false);
      })
    );
  }

  /**
   * Verifica si un DNI ya existe
   * @param dni DNI a verificar
   */
  checkDniExists(dni: string): Observable<boolean> {
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-dni`, {
      params: { dni }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        console.error(`Error checking if DNI ${dni} exists:`, error);
        return of(false);
      })
    );
  }

  /**
   * Invalida la caché del repositorio
   */
  invalidateCache(): void {
    // Limpiar la caché de usuarios
    this.usersCache = null;
    console.log('Caché invalidada manualmente');

    // Forzar una limpieza más agresiva de la caché
    if (window.caches) {
      // Intentar limpiar la caché del navegador para las solicitudes de API
      window.caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('api') || cacheName.includes('users')) {
            console.log(`Intentando eliminar caché del navegador: ${cacheName}`);
            window.caches.delete(cacheName);
          }
        });
      }).catch(err => {
        console.warn('Error al intentar limpiar la caché del navegador:', err);
      });
    }

    // Nota: El ApiService no tiene un método invalidateCache directo,
    // pero internamente invalida la caché relacionada cuando se hacen
    // solicitudes POST, PUT, PATCH o DELETE
  }
}
