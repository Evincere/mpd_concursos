import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { UserAuditLog } from '../../domain/models/user.model';

/**
 * Caso de uso para obtener el historial de auditoría de un usuario
 */
@Injectable({
  providedIn: 'root'
})
export class GetUserAuditLogsUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param userId ID del usuario
   */
  execute(userId: string): Observable<UserAuditLog[]> {
    return this.userRepository.getUserAuditLogs(userId);
  }
}
