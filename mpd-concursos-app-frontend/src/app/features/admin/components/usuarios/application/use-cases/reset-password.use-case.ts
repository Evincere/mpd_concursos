import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { ResetPasswordRequest } from '../../domain/models/user.model';

/**
 * Caso de uso para restablecer la contraseña de un usuario
 */
@Injectable({
  providedIn: 'root'
})
export class ResetPasswordUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Ejecuta el caso de uso
   * @param resetRequest Datos de la solicitud de restablecimiento
   */
  execute(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    return this.userRepository.resetPassword(resetRequest);
  }
}
