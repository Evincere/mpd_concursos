import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { User, CreateUserRequest } from '../../domain/models/user.model';

/**
 * Caso de uso para crear un nuevo usuario
 */
@Injectable({
  providedIn: 'root'
})
export class CreateUserUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param user Datos del usuario a crear
   */
  execute(user: CreateUserRequest): Observable<User> {
    return this.userRepository.createUser(user);
  }
}
