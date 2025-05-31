import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { User } from '../../domain/models/user.model';

/**
 * Caso de uso para obtener un usuario por su ID
 */
@Injectable({
  providedIn: 'root'
})
export class GetUserByIdUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param userId ID del usuario
   */
  execute(userId: string): Observable<User> {
    return this.userRepository.getUserById(userId);
  }
}
