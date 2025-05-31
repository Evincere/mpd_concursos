import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';

/**
 * Caso de uso para obtener los roles disponibles
 */
@Injectable({
  providedIn: 'root'
})
export class GetAvailableRolesUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   */
  execute(): Observable<{ id: string, name: string, description: string }[]> {
    return this.userRepository.getAvailableRoles();
  }
}
