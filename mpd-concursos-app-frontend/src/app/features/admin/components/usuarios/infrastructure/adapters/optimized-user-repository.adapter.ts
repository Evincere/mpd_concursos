import { Injectable, Inject } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs'; // Import throwError
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
 * Interface for Spring Page response structure
 */
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

/**
 * Optimized adapter for the user repository.
 * Implements the UserRepositoryPort.
 * Uses the ApiService to communicate with the backend.
 * Implements caching and optimizations to improve performance.
 */
@Injectable({
  providedIn: 'root'
})
export class OptimizedUserRepositoryAdapter implements UserRepositoryPort {
  // Base API path
  private readonly API_BASE_PATH = 'users';
  // Path for roles
  private readonly ROLES_PATH = 'users/roles';

  // Observable to indicate if an operation is in progress
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // User cache
  private usersCache: PaginatedUsersResponse | null = null;

  constructor(
    @Inject(ApiService) private apiService: ApiService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[OptimizedUserRepositoryAdapter] Initializing OptimizedUserRepositoryAdapter.', undefined, 'UserRepository');
  }

  /**
   * Invalidates the user cache.
   * Clears in-memory cache and attempts to clear browser cache for relevant endpoints.
   */
  invalidateCache(): void {
    this.loggingService.info('[OptimizedUserRepositoryAdapter] Invalidating user cache.', undefined, 'UserRepository');
    // Clear in-memory user cache
    this.usersCache = null;

    // Attempt to clear browser cache for relevant user endpoints
    if (window.caches) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.open(cacheName).then(cache => {
            cache.keys().then(requests => {
              requests.forEach(request => {
                const url = request.url;
                // List of user-related URL patterns to invalidate
                const userEndpoints = [
                  `${environment.apiUrl}/${this.API_BASE_PATH}`,
                  `${environment.apiUrl}/${this.API_BASE_PATH}/`,
                  `${environment.apiUrl}/${this.API_BASE_PATH}/user/`, // For /users/user/{userId}
                  `${environment.apiUrl}/${this.API_BASE_PATH}/roles`,
                  `${environment.apiUrl}/${this.API_BASE_PATH}/stats`,
                  `${environment.apiUrl}/${this.API_BASE_PATH}/check-` // For check-username, check-email, check-dni
                ];

                if (userEndpoints.some(ep => url.startsWith(ep))) {
                  cache.delete(request).then(deleted => {
                    if (deleted) {
                      this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Cache entry deleted for: ${url}`, undefined, 'UserRepository');
                    }
                  }).catch(err => {
                    this.loggingService.warn(`[OptimizedUserRepositoryAdapter] Error deleting cache entry for ${url}:`, err, 'UserRepository');
                  });
                }
              });
            });
          });
        });
      }).catch(err => {
        this.loggingService.error('[OptimizedUserRepositoryAdapter] Error accessing browser caches:', err, 'UserRepository');
      });
    }

    // Note: ApiService internally invalidates related cache when POST, PUT, PATCH, or DELETE requests are made.
  }

  /**
   * Retrieves users with filters and pagination.
   * @param filters Filters to apply.
   */
  getUsers(filters?: UserFilter): Observable<PaginatedUsersResponse> {
    this.loggingService.info('[OptimizedUserRepositoryAdapter] Fetching users with filters.', filters, 'UserRepository');
    this.loadingSubject.next(true);

    // Invalidar la caché antes de obtener usuarios para asegurar datos frescos
    this.invalidateCache();

    // Convert UserFilter to Record<string, string | number | boolean> for API parameters
    const params: Record<string, string | number | boolean> = {};
    params['_t'] = new Date().getTime();
    if (filters) {
      if (filters.search) params['query'] = filters.search.toString().trim();
      if (filters.role && filters.role !== '') params['role'] = filters.role;
      if ('status' in filters && filters.status && filters.status !== '') params['status'] = filters.status;
      if (filters.startDate) params['startDate'] = filters.startDate instanceof Date ? filters.startDate.toISOString().split('T')[0] : filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate instanceof Date ? filters.endDate.toISOString().split('T')[0] : filters.endDate;
      if (filters.page !== undefined) params['page'] = filters.page;
      if (filters.size !== undefined) params['size'] = filters.size;
      if (filters.sort) params['sort'] = filters.sort;
      if (filters.direction) params['direction'] = filters.direction;
    }
    this.loggingService.debug('[OptimizedUserRepositoryAdapter] Sending GET request for users with params:', params, 'UserRepository');
    return this.apiService.get<SpringPageResponse<User>>(this.API_BASE_PATH, {
      params,
      cache: { ttl: 0 },
    }).pipe(
      map((springPage: SpringPageResponse<User>) => ({
        users: springPage.content,
        total: springPage.totalElements,
        page: springPage.number,
        size: springPage.size,
        last: springPage.last,
        totalPages: springPage.totalPages
      })),
      tap(response => {
        this.usersCache = response;
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loggingService.error('[OptimizedUserRepositoryAdapter] Error fetching users:', error, 'UserRepository');
        this.loadingSubject.next(false);
        return of({ users: [], total: 0 });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Retrieves a user by their ID.
   * @param userId User ID.
   */
  getUserById(userId: string): Observable<User> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Fetching user by ID: ${userId}`, undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.get<User>(`${this.API_BASE_PATH}/${userId}`, {
      cache: {
        ttl: 0, // No cache
        forceRefresh: true // Force reload
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        '_t': new Date().getTime() // Add timestamp to prevent caching
      }
    }).pipe(
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error fetching user with ID ${userId}:`, error, 'UserRepository');
        return throwError(() => new Error(`Error fetching user with ID ${userId}: ${error.message}`));
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Creates a new user.
   * @param user User data to create.
   */
  createUser(user: CreateUserRequest): Observable<User> {
    this.loggingService.info('[OptimizedUserRepositoryAdapter] Creating new user.', user, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.post<User>(this.API_BASE_PATH, user).pipe(
      tap(() => {
        this.loggingService.debug('[OptimizedUserRepositoryAdapter] User created successfully. Invalidating cache.', undefined, 'UserRepository');
        this.invalidateCache(); // Invalidate cache manually after creation
      }),
      catchError(error => {
        this.loggingService.error('[OptimizedUserRepositoryAdapter] Error creating user:', error, 'UserRepository');
        return throwError(() => error); // Re-throw the HttpErrorResponse for specific handling in components
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Updates an existing user.
   * @param user User data to update.
   */
  updateUser(user: UpdateUserRequest): Observable<User> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Updating user with ID: ${user.id}`, user, 'UserRepository');
    this.loadingSubject.next(true);

    // Create a mutable copy and clean undefined/null properties
    const userToUpdate: Partial<UpdateUserRequest> = { ...user };
    Object.keys(userToUpdate).forEach(key => {
      const typedKey = key as keyof UpdateUserRequest;
      if (userToUpdate[typedKey] === undefined || userToUpdate[typedKey] === null) {
        delete userToUpdate[typedKey];
      }
    });

    // Ensure roles is an array
    if (userToUpdate.roles && !Array.isArray(userToUpdate.roles)) {
      userToUpdate.roles = [userToUpdate.roles as unknown as string];
      this.loggingService.debug('[OptimizedUserRepositoryAdapter] Converted roles to array.', userToUpdate.roles, 'UserRepository');
    }

    const requestOptions = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };

    this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Sending PUT request to: ${this.API_BASE_PATH}/${user.id}`, userToUpdate, 'UserRepository');
    return this.apiService.put<User>(`${this.API_BASE_PATH}/${user.id}`, userToUpdate, requestOptions).pipe(
      tap(response => {
        this.loggingService.info(`[OptimizedUserRepositoryAdapter] User with ID ${user.id} updated successfully.`, response, 'UserRepository');
        this.invalidateCache(); // Invalidate cache after update
      }),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error updating user with ID ${user.id}:`, error, 'UserRepository');

        // Provide more error details
        if (error.status) {
          console.error(`[OptimizedUserRepositoryAdapter] Status: ${error.status}, Message: ${error.message}`);
        }

        if (error.error) {
          console.error('[OptimizedUserRepositoryAdapter] Detailed error:', error.error);
        }

        // Check for validation errors (e.g., 400 Bad Request)
        if (error.status === 400) {
          this.loggingService.warn('[OptimizedUserRepositoryAdapter] Validation error detected. Checking problematic fields...', undefined, 'UserRepository');
          // Try to identify problematic fields
          if (error.error && error.error.detail) {
            console.warn(`[OptimizedUserRepositoryAdapter] Error detail: ${error.error.detail}`);
          }
        }

        // Check for server errors (e.g., 500 Internal Server Error)
        if (error.status === 500) {
          this.loggingService.error('[OptimizedUserRepositoryAdapter] Internal server error. Possible data format issue or database conflict.', undefined, 'UserRepository');

          // Try to identify the cause of the error
          if (error.error && error.error.detail) {
            console.error(`[OptimizedUserRepositoryAdapter] Error detail: ${error.error.detail}`);
          }

          // Check if the error is related to CUIT (specific backend validation)
          const errorString = JSON.stringify(error).toLowerCase();
          if (errorString.includes('cuit')) {
            this.loggingService.error('[OptimizedUserRepositoryAdapter] CUIT-related error detected. Possible invalid format.', undefined, 'UserRepository');
            // Create a custom error with a more descriptive message
            error = new HttpErrorResponse({
              error: {
                message: 'Error al validar el CUIT. Asegúrese de que el CUIT tenga 11 dígitos numéricos y un formato válido, o déjelo en blanco.',
                detail: 'El CUIT debe tener 11 dígitos numéricos y un formato válido, o dejarse en blanco.'
              },
              status: 400, // Change to 400 so it's handled as a validation error
              statusText: 'Bad Request',
              url: error.url
            });
          }
        }

        return throwError(() => error); // Re-throw the original or modified error
      }),
      finalize(() => {
        this.loggingService.debug('[OptimizedUserRepositoryAdapter] User update request finalized.', undefined, 'UserRepository');
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Changes the status of a user.
   * @param statusChange Status change data.
   */
  changeUserStatus(statusChange: UserStatusChangeRequest): Observable<User> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Changing status for user ${statusChange.userId} to ${statusChange.status}.`, statusChange, 'UserRepository');
    this.loadingSubject.next(true);

    // Use the correct URL for the status change endpoint
    const endpoints = [
      `${this.API_BASE_PATH}/${statusChange.userId}/status`,
      `/api/auth/users/${statusChange.userId}/status` // Example of an alternative or old endpoint
    ];

    // Request body for the PATCH call
    const requestBody = { status: statusChange.status };

    // Invalidate the cache before making the request
    this.invalidateCache();

    // Attempt with the first endpoint
    this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Attempting PATCH to ${endpoints[0]}`, requestBody, 'UserRepository');
    return this.apiService.patch<any>(endpoints[0], requestBody, {
      cache: {
        ttl: 0,
        forceRefresh: true
      }
    }).pipe(
      map(response => {
        this.loggingService.info(`[OptimizedUserRepositoryAdapter] Status change successful via ${endpoints[0]}.`, response, 'UserRepository');
        // Map the response to a User object
        const updatedUser = this.mapStatusResponseToUser(response, statusChange.userId);

        // Force update of the user in the cache
        if (this.usersCache && this.usersCache.users) {
          const index = this.usersCache.users.findIndex(u => u.id === statusChange.userId);
          if (index !== -1) {
            // Update the user in the cache
            this.usersCache.users[index] = {
              ...this.usersCache.users[index],
              status: statusChange.status
            };
            this.loggingService.debug(`[OptimizedUserRepositoryAdapter] User ${statusChange.userId} status updated in cache to ${statusChange.status}.`, undefined, 'UserRepository');
          }
        }
        // Small delay to ensure any cache updates propagate before returning
        setTimeout(() => this.invalidateCache(), 500); // Re-invalidate to ensure all related lists are fresh

        return updatedUser;
      }),
      catchError(error => {
        this.loggingService.warn(`[OptimizedUserRepositoryAdapter] Error changing status for user ${statusChange.userId} with first endpoint (${endpoints[0]}): ${error.status}. Trying fallback.`, error, 'UserRepository');

        // If the error is 404, try with the second endpoint
        if (error.status === 404) {
          this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Attempting PATCH to fallback endpoint ${endpoints[1]}`, requestBody, 'UserRepository');
          return this.apiService.patch<any>(endpoints[1], requestBody, {
            cache: {
              ttl: 0,
              forceRefresh: true
            }
          }).pipe(
            map(response => {
              this.loggingService.info(`[OptimizedUserRepositoryAdapter] Status change successful via fallback ${endpoints[1]}.`, response, 'UserRepository');
              // Map the response to a User object
              const updatedUser = this.mapStatusResponseToUser(response, statusChange.userId);

              // Force update of the user in the cache
              if (this.usersCache && this.usersCache.users) {
                const index = this.usersCache.users.findIndex(u => u.id === statusChange.userId);
                if (index !== -1) {
                  this.usersCache.users[index] = {
                    ...this.usersCache.users[index],
                    status: statusChange.status
                  };
                  this.loggingService.debug(`[OptimizedUserRepositoryAdapter] User ${statusChange.userId} status updated in cache via fallback to ${statusChange.status}.`, undefined, 'UserRepository');
                }
              }
              setTimeout(() => this.invalidateCache(), 500); // Re-invalidate

              return updatedUser;
            }),
            catchError(altError => {
              this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error with alternative endpoint for user ID ${statusChange.userId}:`, altError, 'UserRepository');
              return throwError(() => altError); // Re-throw the error
            })
          );
        }

        return throwError(() => error); // Re-throw the original error if not 404
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Maps the status change response to a User object.
   * This handles cases where the backend response might be a full User object or just a status update.
   * @param response Backend response.
   * @param userId User ID.
   * @returns A User object with updated status.
   */
  private mapStatusResponseToUser(response: any, userId: string): User {
    this.loggingService.debug('[OptimizedUserRepositoryAdapter] Mapping status response to User object.', response, 'UserRepository');
    // If the response is already a complete User object, return it
    if (response && response.id && response.username && response.email && response.status) {
      return response as User;
    }

    // If the response is a partial object with id and status (assuming it represents a UserStatusResponse)
    if (response && response.id === userId && response.status) {
      // Try to get the user from cache to return a more complete object
      const cachedUser = this.getUserFromCache(userId);
      if (cachedUser) {
        cachedUser.status = response.status as UserStatus; // Update user status in cache
        this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Updated cached user ${userId} status to ${response.status}.`, cachedUser, 'UserRepository');
        return cachedUser;
      }

      // If no user in cache, create a partial User object with available info
      this.loggingService.warn(`[OptimizedUserRepositoryAdapter] No cached user found for ${userId}. Creating partial user from status response.`, response, 'UserRepository');
      return {
        id: response.id,
        username: response.username || `user_${userId}`, // Default username
        email: response.email || `user_${userId}@example.com`, // Default email
        firstName: '', // Placeholder
        lastName: '', // Placeholder
        dni: '', // Placeholder
        roles: [], // Placeholder
        status: response.status as UserStatus,
        createdAt: new Date(), // Current date as placeholder
        enabled: true // Assuming enabled by default for status changes
      };
    }

    // If the response does not have the expected structure, throw an error
    this.loggingService.error('[OptimizedUserRepositoryAdapter] Unexpected server response structure during status mapping.', response, 'UserRepository');
    throw new Error('Respuesta inesperada del servidor al cambiar el estado del usuario.');
  }

  /**
   * Retrieves a user from the cache.
   * @param userId User ID.
   */
  private getUserFromCache(userId: string): User | null {
    if (!this.usersCache || !this.usersCache.users) {
      this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Users cache is empty or null when searching for ${userId}.`, undefined, 'UserRepository');
      return null;
    }

    const cachedUser = this.usersCache.users.find((user: User) => user.id === userId);
    if (cachedUser) {
      this.loggingService.debug(`[OptimizedUserRepositoryAdapter] User ${userId} found in cache.`, cachedUser, 'UserRepository');
    } else {
      this.loggingService.debug(`[OptimizedUserRepositoryAdapter] User ${userId} not found in cache.`, undefined, 'UserRepository');
    }
    return cachedUser || null;
  }

  /**
   * Changes the roles of a user.
   * @param roleChange Role change data.
   */
  changeUserRoles(roleChange: UserRoleChangeRequest): Observable<User> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Changing roles for user ${roleChange.userId}.`, roleChange, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.patch<User>(`${this.API_BASE_PATH}/${roleChange.userId}/roles`, roleChange).pipe(
      tap(() => {
        this.loggingService.debug('[OptimizedUserRepositoryAdapter] User roles changed successfully. Invalidating cache.', undefined, 'UserRepository');
        this.invalidateCache(); // Invalidate cache manually
      }),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error changing roles for user with ID ${roleChange.userId}:`, error, 'UserRepository');
        return throwError(() => error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Resets a user's password.
   * @param resetRequest Password reset request data.
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Resetting password for user ${resetRequest.userId}.`, undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.post<{ success: boolean, message: string }>(
      `${this.API_BASE_PATH}/${resetRequest.userId}/reset-password`,
      resetRequest
    ).pipe(
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error resetting password for user with ID ${resetRequest.userId}:`, error, 'UserRepository');
        return of({ success: false, message: 'Error al restablecer la contraseña' });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Deletes a user.
   * @param userId ID of the user to delete.
   */
  deleteUser(userId: string): Observable<{ success: boolean, message: string }> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Deleting user with ID: ${userId}`, undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.delete<void>(`${this.API_BASE_PATH}/${userId}`).pipe(
      map(() => {
        this.loggingService.debug(`[OptimizedUserRepositoryAdapter] User ${userId} deleted successfully.`, undefined, 'UserRepository');
        return { success: true, message: 'Usuario eliminado correctamente' };
      }),
      tap(() => {
        this.invalidateCache(); // Invalidate cache manually after deletion
      }),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error deleting user with ID ${userId}:`, error, 'UserRepository');
        return of({ success: false, message: 'Error al eliminar el usuario' });
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Retrieves a user's audit logs.
   * @param userId User ID.
   */
  getUserAuditLogs(userId: string): Observable<UserAuditLog[]> {
    this.loggingService.info(`[OptimizedUserRepositoryAdapter] Fetching audit logs for user ID: ${userId}`, undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.get<UserAuditLog[]>(`${this.API_BASE_PATH}/${userId}/audit-logs`, {
      cache: {
        ttl: 60000 // 1 minute cache
      }
    }).pipe(
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error fetching audit logs for user with ID ${userId}:`, error, 'UserRepository');
        return of([]);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Retrieves available roles.
   */
  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]> {
    this.loggingService.info('[OptimizedUserRepositoryAdapter] Fetching available roles.', undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.get<{ id: string, name: string, description: string }[]>(this.ROLES_PATH, {
      cache: {
        ttl: 3600000 // 1 hour cache
      }
    }).pipe(
      catchError(error => {
        this.loggingService.error('[OptimizedUserRepositoryAdapter] Error fetching available roles:', error, 'UserRepository');
        return of([]);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Retrieves user statistics.
   */
  getUserStats(): Observable<UserStats> {
    this.loggingService.info('[OptimizedUserRepositoryAdapter] Fetching user statistics.', undefined, 'UserRepository');
    this.loadingSubject.next(true);

    return this.apiService.get<UserStats>(`${this.API_BASE_PATH}/stats`, {
      cache: {
        ttl: 300000 // 5 minutes cache
      }
    }).pipe(
      catchError(error => {
        this.loggingService.error('[OptimizedUserRepositoryAdapter] Error fetching user stats:', error, 'UserRepository');
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
   * Checks if a username already exists.
   * @param username Username to check.
   */
  checkUsernameExists(username: string): Observable<boolean> {
    this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Checking if username exists: ${username}`, undefined, 'UserRepository');
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-username`, {
      params: { username }
    }).pipe(
      map(response => (response as { exists: boolean }).exists),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error checking if username ${username} exists:`, error, 'UserRepository');
        return of(false);
      })
    );
  }

  /**
   * Checks if an email already exists.
   * @param email Email to check.
   */
  checkEmailExists(email: string): Observable<boolean> {
    this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Checking if email exists: ${email}`, undefined, 'UserRepository');
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-email`, {
      params: { email }
    }).pipe(
      map(response => (response as { exists: boolean }).exists),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error checking if email ${email} exists:`, error, 'UserRepository');
        return of(false);
      })
    );
  }

  /**
   * Checks if a DNI already exists.
   * @param dni DNI to check.
   */
  checkDniExists(dni: string): Observable<boolean> {
    this.loggingService.debug(`[OptimizedUserRepositoryAdapter] Checking if DNI exists: ${dni}`, undefined, 'UserRepository');
    return this.apiService.get<{ exists: boolean }>(`${this.API_BASE_PATH}/check-dni`, {
      params: { dni }
    }).pipe(
      map(response => (response as { exists: boolean }).exists),
      catchError(error => {
        this.loggingService.error(`[OptimizedUserRepositoryAdapter] Error checking if DNI ${dni} exists:`, error, 'UserRepository');
        return of(false);
      })
    );
  }
}
