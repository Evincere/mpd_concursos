import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { UserStats } from '../../domain/models/user.model';

/**
 * Caso de uso para obtener estadísticas de usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class GetUserStatsUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   */
  execute(): Observable<UserStats> {
    return this.userRepository.getUserStats();
  }
}
