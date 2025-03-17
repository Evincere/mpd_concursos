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
    // Si no hay hash, no validamos (para compatibilidad)
    if (!respuesta.hash) {
      console.log('Respuesta sin hash, generando uno nuevo');
      respuesta.hash = await this.generarHash(respuesta);
      return { isValid: true };
    }

    try {
      const hash = await this.generarHash(respuesta);
      const esValido = hash === respuesta.hash;

      if (!esValido) {
        console.warn('Hash inválido para respuesta:', {
          calculado: hash,
          recibido: respuesta.hash,
          preguntaId: respuesta.preguntaId
        });

        // En modo desarrollo, permitimos continuar
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
          console.log('Modo desarrollo: ignorando error de hash');
          return { isValid: true };
        }

        return {
          isValid: false,
          violationType: SecurityViolationType.SUSPICIOUS_ANSWER,
          details: { respuesta },
          message: 'Hash de respuesta inválido'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error al validar hash:', error);
      // En caso de error, permitimos continuar
      return { isValid: true };
    }
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
    try {
      // Crear una representación en texto de la respuesta
      const respuestaStr = JSON.stringify({
        preguntaId: respuesta.preguntaId,
        respuesta: respuesta.respuesta,
        timestamp: respuesta.timestamp
      });

      // Usar crypto API para generar un hash simple
      const encoder = new TextEncoder();
      const data = encoder.encode(respuestaStr);

      // Intentar usar SubtleCrypto si está disponible
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (cryptoError) {
        // Fallback simple si SubtleCrypto no está disponible
        console.warn('SubtleCrypto no disponible, usando hash simple:', cryptoError);
        let hash = 0;
        for (let i = 0; i < respuestaStr.length; i++) {
          const char = respuestaStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convertir a entero de 32 bits
        }
        return hash.toString(16);
      }
    } catch (error) {
      console.error('Error al generar hash para respuesta:', error);
      // Devolver un hash aleatorio en caso de error
      return Math.random().toString(36).substring(2);
    }
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
