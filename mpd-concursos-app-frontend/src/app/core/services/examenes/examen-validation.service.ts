import { Injectable } from '@angular/core';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenSecurityService } from './security/examen-security.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ValidationResult, ValidationContext } from '../../../core/interfaces/examenes/validation/validation-result.interface';
import { ExamenTimeService } from './examen-time.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenValidationService {
  private readonly MIN_TIEMPO_RESPUESTA = 2000; // 2 segundos
  private readonly MAX_TIEMPO_RESPUESTA = 300000; // 5 minutos

  constructor(
    private securityService: ExamenSecurityService,
    private timeService: ExamenTimeService
  ) {}

  async validarRespuesta(respuesta: RespuestaUsuario, context: ValidationContext): Promise<ValidationResult> {
    // 1. Validar hash
    const hashValidation = await this.validarHash(respuesta);
    if (!hashValidation.isValid) {
      return hashValidation;
    }

    // 2. Validar tiempo de respuesta
    const tiempoValidation = this.validarTiempoRespuesta(respuesta.tiempoRespuesta);
    if (!tiempoValidation.isValid) {
      return tiempoValidation;
    }

    // 3. Validar timestamp
    const timestamp = typeof respuesta.timestamp === 'string'
      ? new Date(respuesta.timestamp).getTime()
      : respuesta.timestamp;

    const timestampValidation = this.validarTimestamp(timestamp);
    if (!timestampValidation.isValid) {
      return timestampValidation;
    }

    return { isValid: true };
  }

  private async validarHash(respuesta: RespuestaUsuario): Promise<ValidationResult> {
    const hash = await this.generarHash(respuesta);
    const esValido = hash === respuesta.hash;

    if (!esValido) {
      return {
        isValid: false,
        violationType: SecurityViolationType.SUSPICIOUS_ANSWER,
        details: { respuesta },
        message: 'Hash de respuesta inválido'
      };
    }

    return { isValid: true };
  }

  private validarTiempoRespuesta(tiempoRespuesta?: number): ValidationResult {
    if (!tiempoRespuesta) return { isValid: true };

    if (tiempoRespuesta < this.MIN_TIEMPO_RESPUESTA) {
      return {
        isValid: false,
        violationType: SecurityViolationType.ANSWER_TOO_FAST,
        details: { tiempoRespuesta },
        message: 'Respuesta demasiado rápida'
      };
    }

    if (tiempoRespuesta > this.MAX_TIEMPO_RESPUESTA) {
      return {
        isValid: false,
        violationType: SecurityViolationType.ANSWER_TOO_SLOW,
        details: { tiempoRespuesta },
        message: 'Tiempo de respuesta excedido'
      };
    }

    return { isValid: true };
  }

  private validarTimestamp(timestamp: number): ValidationResult {
    if (!this.timeService.validateTimestamp(timestamp)) {
      return {
        isValid: false,
        violationType: SecurityViolationType.TIME_DRIFT,
        details: { timestamp },
        message: 'Timestamp de respuesta inválido'
      };
    }

    return { isValid: true };
  }

  async generarHash(respuesta: RespuestaUsuario): Promise<string> {
    const content = `${respuesta.preguntaId}|${respuesta.respuesta}|${respuesta.timestamp}|${respuesta.tiempoRespuesta || 0}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  validarIntegridadPostIncidente(respuestas: RespuestaUsuario[], backupRespuestas: RespuestaUsuario[]): ValidationResult {
    // Verificar que todas las respuestas del backup estén presentes
    const todasPresentes = backupRespuestas.every(backupResp =>
      respuestas.some(resp =>
        resp.preguntaId === backupResp.preguntaId &&
        resp.respuesta === backupResp.respuesta &&
        resp.hash === backupResp.hash
      )
    );

    if (!todasPresentes) {
      return {
        isValid: false,
        violationType: SecurityViolationType.POST_INCIDENT_VALIDATION_FAILED,
        details: { respuestas, backupRespuestas },
        message: 'Inconsistencia detectada en las respuestas'
      };
    }

    return { isValid: true };
  }

  limpiarHistorial(examenId: string): void {
    // Method kept for compatibility but simplified since we no longer track patterns
  }
}
