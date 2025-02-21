import { Injectable } from '@angular/core';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenSecurityService } from './security/examen-security.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenValidationService {
  constructor(
    private securityService: ExamenSecurityService
  ) {}

  async generarHash(respuesta: RespuestaUsuario): Promise<string> {
    const content = `${respuesta.preguntaId}|${respuesta.respuesta}|${respuesta.timestamp}|${respuesta.tiempoRespuesta || 0}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  async validarRespuesta(respuesta: RespuestaUsuario, examenId: string): Promise<boolean> {
    const hash = await this.generarHash(respuesta);
    const esValida = hash === respuesta.hash;

    if (!esValida) {
      this.securityService.reportSecurityViolation(
        SecurityViolationType.SUSPICIOUS_ANSWER,
        { respuesta }
      );
    }

    return esValida;
  }

  limpiarHistorial(examenId: string): void {
    // Method kept for compatibility but simplified since we no longer track patterns
  }
}
