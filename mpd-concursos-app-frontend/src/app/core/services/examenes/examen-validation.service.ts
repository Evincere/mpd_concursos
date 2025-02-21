import { Injectable } from '@angular/core';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenSecurityService } from './security/examen-security.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ExamenValidationService {
  constructor(
    private securityService: ExamenSecurityService
  ) {}

  validarRespuesta(respuesta: RespuestaUsuario, examenId: string): boolean {
    const esValida = this.validarHash(respuesta);

    if (!esValida) {
      this.securityService.reportSecurityViolation(
        SecurityViolationType.SUSPICIOUS_ANSWER,
        { respuesta }
      );
    }

    return esValida;
  }

  private validarHash(respuesta: RespuestaUsuario): boolean {
    const hash = this.generarHash(respuesta);
    return hash === respuesta.hash;
  }

  generarHash(respuesta: RespuestaUsuario): string {
    const datos = `${respuesta.preguntaId}|${JSON.stringify(respuesta.respuesta)}|${respuesta.timestamp}`;
    return CryptoJS.SHA256(datos).toString();
  }

  limpiarHistorial(examenId: string): void {
    // Method kept for compatibility but simplified since we no longer track patterns
  }
}
