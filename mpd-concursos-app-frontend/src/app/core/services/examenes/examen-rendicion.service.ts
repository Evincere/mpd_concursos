import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, interval, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenTimeService } from './examen-time.service';
import { ExamenSecurityService } from './security/examen-security.service';
import { ExamenRecoveryService } from './examen-recovery.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenValidationService } from './examen-validation.service';
import { environment } from '@env/environment';

@Injectable()
export class ExamenRendicionService {
  private apiUrl = `${environment.apiUrl}/examenes`;
  private examenEnCurso = new BehaviorSubject<ExamenEnCurso | null>(null);
  private preguntas = new BehaviorSubject<Pregunta[]>([]);
  private tiempoRestante = new BehaviorSubject<number>(0);
  private preguntaActual$ = new BehaviorSubject<Pregunta | null>(null);

  constructor(
    private http: HttpClient,
    private timeService: ExamenTimeService,
    private securityService: ExamenSecurityService,
    private validationService: ExamenValidationService,
    private recoveryService: ExamenRecoveryService
  ) {}

  async iniciarExamen(examenId: string, preguntas: Pregunta[]): Promise<void> {
    // Reiniciar estado de seguridad al iniciar un nuevo examen
    this.securityService.resetSecurityState();

    // Intentar recuperar examen en progreso
    const examenRecuperado = await this.recoveryService.recoverExamen(examenId);

    if (examenRecuperado) {
      this.examenEnCurso.next(examenRecuperado);
      this.preguntas.next(preguntas);
    } else {
      // Crear nuevo examen
      const examen: ExamenEnCurso = {
        examenId,
        usuarioId: this.getCurrentUserId(), // Obtener el ID del usuario actual
        fechaInicio: new Date().toISOString(),
        fechaLimite: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        respuestas: [],
        preguntaActual: 0,
        estado: 'EN_CURSO'
      };

      this.preguntas.next(preguntas);
      this.examenEnCurso.next(examen);
    }

    // Asegurarnos de que la primera pregunta se emita
    this.emitPreguntaActual();

    // Iniciar autoguardado y temporizador
    this.recoveryService.initializeAutoSave(examenId);
    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {
    const fechaLimite = new Date(this.examenEnCurso.value?.fechaLimite || '');
    const intervalo = timer(0, 1000).pipe(
      map(() => {
        const ahora = new Date();
        const tiempoRestante = Math.max(0, Math.floor((fechaLimite.getTime() - ahora.getTime()) / 1000));
        return tiempoRestante;
      }),
      takeUntil(timer(fechaLimite.getTime() - Date.now()))
    );

    intervalo.subscribe({
      next: (tiempo) => {
        this.tiempoRestante.next(tiempo);
        if (tiempo === 0) {
          this.finalizarExamen();
        }
      }
    });
  }

  guardarRespuesta(respuesta: RespuestaUsuario): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

    // Generar hash para la respuesta
    this.validationService.generarHash(respuesta).then(hash => {
      respuesta.hash = hash;

      // Validar la respuesta
      if (!this.validationService.validarRespuesta(respuesta, examen.examenId)) {
        this.securityService.reportSecurityViolation(SecurityViolationType.SUSPICIOUS_ANSWER, { respuesta });
      }

      // Continuar con el guardado normal...
      const respuestas = [...examen.respuestas];
      const index = respuestas.findIndex(r => r.preguntaId === respuesta.preguntaId);

      if (index >= 0) {
        respuestas[index] = { ...respuesta, intentos: (respuestas[index].intentos || 0) + 1 };
      } else {
        respuestas.push({ ...respuesta, intentos: 1 });
      }

      this.examenEnCurso.next({ ...examen, respuestas });

      // Guardar backup
      this.recoveryService.saveToLocalBackup(examen.examenId, { ...examen, respuestas });
    });
  }

  siguientePregunta(): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

    if (examen.preguntaActual < this.preguntas.value.length - 1) {
      this.examenEnCurso.next({
        ...examen,
        preguntaActual: examen.preguntaActual + 1
      });
    }
  }

  preguntaAnterior(): void {
    const examen = this.examenEnCurso.value;
    if (!examen || examen.preguntaActual === 0) return;

    this.examenEnCurso.next({
      ...examen,
      preguntaActual: examen.preguntaActual - 1
    });
  }

  finalizarExamen(examenAnulado?: ExamenEnCurso): Observable<void> {
    const examen = examenAnulado || this.examenEnCurso.value;
    if (!examen) return of(void 0);

    // Si el examen fue anulado, no validamos integridad
    if (!examenAnulado) {
      // Validar integridad post-incidente
      const esValido = this.recoveryService.validatePostIncident(
        examen.examenId,
        examen.respuestas
      );

      if (!esValido) {
        this.securityService.reportSecurityViolation(
          SecurityViolationType.POST_INCIDENT_VALIDATION_FAILED,
          { examen }
        );
      }
    }

    // Limpiar backups
    this.recoveryService.cleanupBackups(examen.examenId);

    // Limpiar historial de validación
    this.validationService.limpiarHistorial(examen.examenId);

    // Si el examen fue anulado, mantenemos el estado ANULADO
    const examenFinalizado = examenAnulado || {
      ...examen,
      estado: 'FINALIZADO' as const
    };

    this.examenEnCurso.next(examenFinalizado);

    // Enviar al backend el estado final del examen
    return this.enviarEstadoFinal(examenFinalizado);
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

  // Observables públicos
  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    return this.examenEnCurso.asObservable();
  }

  getPreguntas(): Observable<Pregunta[]> {
    return this.preguntas.asObservable();
  }

  getPreguntaActual(): Observable<Pregunta | null> {
    return this.examenEnCurso.pipe(
      map(examen => {
        if (!examen) return null;
        return this.preguntas.value[examen.preguntaActual] || null;
      })
    );
  }

  getTiempoRestante(): Observable<number> {
    return this.tiempoRestante.asObservable();
  }

  private emitPreguntaActual(): void {
    const examen = this.examenEnCurso.value;
    const preguntas = this.preguntas.value;
    if (examen && preguntas.length > 0) {
      const preguntaActual = preguntas[examen.preguntaActual];
      if (preguntaActual) {
        this.preguntaActual$.next(preguntaActual);
      }
    }
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
