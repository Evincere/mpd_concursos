import { Injectable } from '@angular/core';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenSecurityService } from './security/examen-security.service';
import { ExamenTimeService } from './examen-time.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ExamenValidationService {
  private readonly MIN_TIEMPO_RESPUESTA = 5000; // 5 segundos mínimo por pregunta
  private readonly MAX_TIEMPO_RESPUESTA = 600000; // 10 minutos máximo por pregunta
  private respuestasAnteriores: Map<string, RespuestaUsuario[]> = new Map();
  private patronesDetectados: Map<string, number> = new Map();

  constructor(
    private securityService: ExamenSecurityService,
    private timeService: ExamenTimeService
  ) {}

  validarRespuesta(respuesta: RespuestaUsuario, examenId: string): boolean {
    const esValida = this.validarHash(respuesta) &&
                    this.validarPatrones(respuesta, examenId);

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

  private validarPatrones(respuesta: RespuestaUsuario, examenId: string): boolean {
    // Obtener historial de respuestas para este examen
    const respuestasExamen = this.respuestasAnteriores.get(examenId) || [];
    respuestasExamen.push(respuesta);
    this.respuestasAnteriores.set(examenId, respuestasExamen);

    // Detectar patrones sospechosos
    const patrones = this.detectarPatrones(respuestasExamen);
    if (patrones.length > 0) {
      this.incrementarPatronDetectado(examenId);
      if (this.patronesDetectados.get(examenId) || 0 > 3) {
        this.securityService.reportSecurityViolation(
          SecurityViolationType.SUSPICIOUS_PATTERN,
          { patrones }
        );
        return false;
      }
    }

    return true;
  }

  private detectarPatrones(respuestas: RespuestaUsuario[]): string[] {
    const patrones: string[] = [];

    // Patrón 1: Respuestas muy rápidas consecutivas
    const tiemposRespuesta = respuestas.map(r => new Date(r.timestamp).getTime());
    const diferenciasConsecutivas = tiemposRespuesta
      .slice(1)
      .map((tiempo, i) => tiempo - tiemposRespuesta[i]);

    if (diferenciasConsecutivas.some(diff => diff < this.MIN_TIEMPO_RESPUESTA)) {
      patrones.push('RESPUESTAS_RAPIDAS_CONSECUTIVAS');
    }

    // Patrón 2: Mismo patrón de respuestas repetido
    const respuestasString = respuestas.map(r => JSON.stringify(r.respuesta));
    const patronesRepetidos = this.encontrarPatronesRepetidos(respuestasString);
    if (patronesRepetidos.length > 0) {
      patrones.push('PATRON_RESPUESTAS_REPETIDO');
    }

    return patrones;
  }

  private encontrarPatronesRepetidos(secuencia: string[]): string[] {
    const patronesEncontrados: string[] = [];
    const minLongitudPatron = 3;

    for (let longitud = minLongitudPatron; longitud <= secuencia.length / 2; longitud++) {
      for (let i = 0; i <= secuencia.length - longitud * 2; i++) {
        const posiblePatron = secuencia.slice(i, i + longitud);
        const siguienteSecuencia = secuencia.slice(i + longitud, i + longitud * 2);

        if (JSON.stringify(posiblePatron) === JSON.stringify(siguienteSecuencia)) {
          patronesEncontrados.push(JSON.stringify(posiblePatron));
        }
      }
    }

    return patronesEncontrados;
  }

  private incrementarPatronDetectado(examenId: string): void {
    const count = this.patronesDetectados.get(examenId) || 0;
    this.patronesDetectados.set(examenId, count + 1);
  }

  limpiarHistorial(examenId: string): void {
    this.respuestasAnteriores.delete(examenId);
    this.patronesDetectados.delete(examenId);
  }
}
