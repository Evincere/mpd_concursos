import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { User, UserRoleChangeRequest } from '../../domain/models/user.model';

/**
 * Caso de uso para cambiar los roles de un usuario
 */
@Injectable({
  providedIn: 'root'
})
export class ChangeUserRolesUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param roleChange Datos del cambio de roles
   */
  execute(roleChange: UserRoleChangeRequest): Observable<User> {
    return this.userRepository.changeUserRoles(roleChange);
  }
}
