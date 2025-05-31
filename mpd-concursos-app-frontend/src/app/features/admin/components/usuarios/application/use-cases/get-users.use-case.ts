import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { UserFilter, PaginatedUsersResponse } from '../../domain/models/user.model';

/**
 * Caso de uso para obtener usuarios con filtros y paginación
 */
@Injectable({
  providedIn: 'root'
})
export class GetUsersUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param filters Filtros a aplicar
   */
  execute(filters?: UserFilter): Observable<PaginatedUsersResponse> {
    return this.userRepository.getUsers(filters);
  }
}
