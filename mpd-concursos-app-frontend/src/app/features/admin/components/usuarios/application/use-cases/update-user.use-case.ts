import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { User, UpdateUserRequest } from '../../domain/models/user.model';

/**
 * Caso de uso para actualizar un usuario existente
 */
@Injectable({
  providedIn: 'root'
})
export class UpdateUserUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param user Datos del usuario a actualizar
   */
  execute(user: UpdateUserRequest): Observable<User> {
    return this.userRepository.updateUser(user);
  }
}
