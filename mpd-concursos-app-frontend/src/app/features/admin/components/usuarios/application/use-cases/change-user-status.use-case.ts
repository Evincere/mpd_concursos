import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { User, UserStatusChangeRequest } from '../../domain/models/user.model';

/**
 * Caso de uso para cambiar el estado de un usuario
 */
@Injectable({
  providedIn: 'root'
})
export class ChangeUserStatusUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param statusChange Datos del cambio de estado
   */
  execute(statusChange: UserStatusChangeRequest): Observable<User> {
    return this.userRepository.changeUserStatus(statusChange);
  }
}
