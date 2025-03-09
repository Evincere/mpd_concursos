import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenTimeService } from './examen-time.service';
import { ExamenSecurityService } from './security/examen-security.service';
import { ExamenRecoveryService } from './examen-recovery.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenValidationService } from './examen-validation.service';
import { environment } from '@env/environment';
import { ExamenStateService } from './state/examen-state.service';
import { ExamenNotificationService } from './examen-notification.service';

@Injectable()
export class ExamenRendicionService {
  private apiUrl = `${environment.apiUrl}/examenes`;

  constructor(
    private http: HttpClient,
    private timeService: ExamenTimeService,
    private securityService: ExamenSecurityService,
    private validationService: ExamenValidationService,
    private recoveryService: ExamenRecoveryService,
    private stateService: ExamenStateService,
    private notificationService: ExamenNotificationService
  ) {}

  async iniciarExamen(examenId: string, preguntas: Pregunta[]): Promise<void> {
    // Reiniciar estado de seguridad al iniciar un nuevo examen
    this.securityService.reset();
    this.notificationService.reset();

    // Intentar recuperar examen en progreso
    const examenRecuperado = await this.recoveryService.recoverExamen(examenId);

    if (examenRecuperado) {
      // Inicializar el estado con el examen recuperado
      this.stateService.initializeState(examenRecuperado);
      this.stateService.setPreguntas(preguntas);
    } else {
      // Crear nuevo examen
      const examen: ExamenEnCurso = {
        examenId,
        usuarioId: this.getCurrentUserId(),
        fechaInicio: new Date().toISOString(),
        fechaLimite: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        respuestas: [],
        preguntaActual: 0,
        estado: 'EN_CURSO'
      };

      // Inicializar el estado con el nuevo examen
      this.stateService.initializeState(examen);
      this.stateService.setPreguntas(preguntas);
    }

    // Iniciar autoguardado y temporizador
    this.recoveryService.initializeAutoSave(examenId);
    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {
    // Obtener el examen actual del estado centralizado
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen) return;

      // Calcular duración en minutos desde fechaInicio hasta fechaLimite
      const fechaInicioExamen = new Date(examen.fechaInicio);
      const fechaLimiteExamen = new Date(examen.fechaLimite);
      const duracionMinutos = (fechaLimiteExamen.getTime() - fechaInicioExamen.getTime()) / (1000 * 60);

      // Delegar la gestión del tiempo al ExamenTimeService
      this.timeService.iniciar(duracionMinutos).subscribe({
        next: (tiempoRestante) => {
          // Actualizar el tiempo restante en el estado centralizado
          this.stateService.actualizarTiempoRestante(tiempoRestante);

          if (tiempoRestante === 0) {
            this.finalizarExamen();
          }
        },
        error: (error) => {
          console.error('Error en el temporizador:', error);
        }
      });
    });
  }

  guardarRespuesta(respuesta: RespuestaUsuario): void {
    // Obtener el examen actual del estado centralizado
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen) return;

      // Generar hash para la respuesta
      this.validationService.generarHash(respuesta).then(hash => {
        respuesta.hash = hash;

        // Validar la respuesta con el contexto
        const context = {
          examenId: examen.examenId,
          timestamp: Date.now(),
          tiempoRespuesta: respuesta.tiempoRespuesta
        };

        this.validationService.validarRespuesta(respuesta, context).then(result => {
          if (!result.isValid && result.violationType) {
            this.securityService.reportSecurityViolation(result.violationType, result.details);
          }

          // Guardar la respuesta en el estado centralizado
          this.stateService.guardarRespuesta(respuesta);

          // Guardar backup
          this.recoveryService.saveToLocalBackup(examen.examenId, examen);
        });
      });
    });
  }

  siguientePregunta(): void {
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen) return;

      this.stateService.getPreguntas().subscribe(preguntas => {
        if (examen.preguntaActual < preguntas.length - 1) {
          this.stateService.setPreguntaActual(examen.preguntaActual + 1);
        }
      });
    });
  }

  preguntaAnterior(): void {
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen || examen.preguntaActual === 0) return;

      this.stateService.setPreguntaActual(examen.preguntaActual - 1);
    });
  }

  finalizarExamen(examenAnulado?: ExamenEnCurso): Observable<void> {
    return new Observable(observer => {
      this.stateService.getExamenEnCurso().subscribe(examen => {
        if (!examen) {
          observer.next();
          observer.complete();
          return;
        }

        // Si el examen fue anulado, no validamos integridad
        if (!examenAnulado) {
          // Obtener backup y validar integridad
          const backup = this.recoveryService.getLatestBackup(examen.examenId);
          if (backup) {
            const validationResult = this.validationService.validarIntegridadPostIncidente(
              examen.respuestas,
              backup.examen.respuestas
            );

            if (!validationResult.isValid && validationResult.violationType) {
              this.securityService.reportSecurityViolation(
                validationResult.violationType,
                validationResult.details
              );
            }
          }
        }

        // Limpiar todos los recursos
        this.securityService.cleanup();
        this.recoveryService.cleanupBackups(examen.examenId);
        this.stateService.cambiarEstadoExamen('FINALIZADO');

        // Enviar al backend el estado final del examen
        this.enviarEstadoFinal(examenAnulado || examen).subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: (error) => {
            console.error('Error al finalizar examen:', error);
            observer.error(error);
          }
        });
      });
    });
  }

  anularExamen(examenId: string, motivo: { fecha: string; infracciones: SecurityViolationType[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${examenId}/anular`, motivo);
  }

  finalizarExamenApi(examenId: string, datos: { respuestas: { [key: string]: string | string[] }; tiempoUtilizado: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${examenId}/finalizar`, datos);
  }

  private enviarEstadoFinal(examen: ExamenEnCurso): Observable<void> {
    // TODO: Implementar llamada real al backend
    console.log('Enviando estado final del examen:', examen);
    return of(void 0);
  }

  // Métodos para acceder al estado (ahora delegados al ExamenStateService)
  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    return this.stateService.getExamenEnCurso();
  }

  getPreguntas(): Observable<Pregunta[]> {
    return this.stateService.getPreguntas();
  }

  getPreguntaActual(): Observable<Pregunta | null> {
    return this.stateService.getPreguntaActual();
  }

  getTiempoRestante(): Observable<number> {
    return this.stateService.getTiempoRestante();
  }

  private getCurrentUserId(): string {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id;
      } catch (e) {
        console.error('Error al obtener el ID del usuario:', e);
      }
    }
    return 'anonymous';
  }
}
