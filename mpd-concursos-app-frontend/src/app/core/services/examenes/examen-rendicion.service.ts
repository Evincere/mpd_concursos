import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, interval } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenTimeService } from './examen-time.service';
import { ExamenSecurityService } from './examen-security.service';
import { ExamenRecoveryService } from './examen-recovery.service';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenValidationService } from './examen-validation.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenRendicionService {
  private examenEnCurso = new BehaviorSubject<ExamenEnCurso | null>(null);
  private preguntas = new BehaviorSubject<Pregunta[]>([]);
  private tiempoRestante = new BehaviorSubject<number>(0);
  private preguntaActual$ = new BehaviorSubject<Pregunta | null>(null);

  constructor(
    private timeService: ExamenTimeService,
    private securityService: ExamenSecurityService,
    private validationService: ExamenValidationService,
    private recoveryService: ExamenRecoveryService
  ) {}

  async iniciarExamen(examenId: string, preguntas: Pregunta[]): Promise<void> {
    // Intentar recuperar examen en progreso
    const examenRecuperado = await this.recoveryService.recoverExamen(examenId);

    if (examenRecuperado) {
      this.examenEnCurso.next(examenRecuperado);
      this.preguntas.next(preguntas);
    } else {
      // Crear nuevo examen
      const examen: ExamenEnCurso = {
        examenId,
        usuarioId: 'USER_ID',
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
        return Math.max(0, Math.floor((fechaLimite.getTime() - ahora.getTime()) / 1000));
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
    respuesta.hash = this.validationService.generarHash(respuesta);

    // Validar la respuesta
    if (!this.validationService.validarRespuesta(respuesta, examen.examenId)) {
      // Si la respuesta no es válida, se registra pero se marca como sospechosa
      this.securityService.reportSecurityViolation(
        SecurityViolationType.SUSPICIOUS_ANSWER,
        { respuesta }
      );
    }

    // Continuar con el guardado normal...
    const respuestas = [...examen.respuestas];
    const index = respuestas.findIndex(r => r.preguntaId === respuesta.preguntaId);

    if (index >= 0) {
      respuestas[index] = {
        ...respuesta,
        intentos: (respuestas[index].intentos || 0) + 1
      };
    } else {
      respuestas.push({
        ...respuesta,
        intentos: 1
      });
    }

    this.examenEnCurso.next({
      ...examen,
      respuestas
    });

    // Guardar backup
    this.recoveryService.saveToLocalBackup(examen.examenId, {
      ...examen,
      respuestas
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

  finalizarExamen(): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

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

    // Limpiar backups
    this.recoveryService.cleanupBackups(examen.examenId);

    // Limpiar historial de validación
    this.validationService.limpiarHistorial(examen.examenId);

    this.examenEnCurso.next({
      ...examen,
      estado: 'FINALIZADO'
    });
    // Aquí se enviarían las respuestas al backend
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
    return interval(1000).pipe(
      map(() => {
        const tiempoFin = this.examenEnCurso.value?.fechaLimite;
        if (!tiempoFin) return 0;

        const tiempoRestante = this.timeService.getTimeRemaining(new Date(tiempoFin).getTime());
        // Asegurarnos que no devolvemos valores negativos
        return Math.max(0, Math.floor(tiempoRestante / 1000));
      })
    );
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
}
