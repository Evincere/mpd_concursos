import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, of, throwError, retry, timeout, catchError, map, forkJoin } from 'rxjs';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

import { environment } from '@env/environment';


interface AuthService {
  getCurrentUserId: () => string;
}

// Crear un token de inyección para AuthService
const AUTH_SERVICE_TOKEN = 'AUTH_SERVICE_TOKEN';

@Injectable({
  providedIn: 'root'
})
export class ExamenRendicionService {
  private readonly API_URL = environment.apiUrl;
  private readonly TIMEOUT = 15000; // 15 segundos
  private readonly MAX_RETRIES = 3;

  constructor(
    private http: HttpClient,
    @Inject(AUTH_SERVICE_TOKEN) private authService: AuthService,
    @Inject('TIME_SERVICE') private timeService: {
      iniciar: (duracionMinutos: number) => Observable<number>,
      detener: () => void,
      getTiempoUtilizado: () => number,
      validateTimestamp: (timestamp: number) => boolean
    },
    @Inject('STATE_SERVICE') private stateService: {
      initializeState: (examen: ExamenEnCurso) => void,
      setPreguntas: (preguntas: Pregunta[]) => void,
      getExamenEnCurso: () => Observable<ExamenEnCurso | null>,
      getPreguntas: () => Observable<Pregunta[]>,
      getPreguntaActual: () => Observable<Pregunta | null>,
      getTiempoRestante: () => Observable<number>,
      actualizarTiempoRestante: (tiempoRestante: number) => void,
      guardarRespuesta: (respuesta: RespuestaUsuario) => void,
      setPreguntaActual: (index: number) => void,
      cambiarEstadoExamen: (estado: string) => void
    },
    @Inject('SECURITY_SERVICE') private securityService: {
      reset: () => void,
      reportSecurityViolation: (type: SecurityViolationType, details?: unknown) => void,
      cleanup: () => void
    },
    @Inject('RECOVERY_SERVICE') private recoveryService: {
      recoverExamen: (examenId: string) => Promise<ExamenEnCurso | null>,
      initializeAutoSave: (examenId: string) => void,
      saveToLocalBackup: (examenId: string, examen: ExamenEnCurso) => void,
      getLatestBackup: (examenId: string) => { examen: ExamenEnCurso } | null,
      cleanupBackups: (examenId: string) => void
    },
    @Inject('VALIDATION_SERVICE') private validationService: {
      generarHash: (respuesta: RespuestaUsuario) => Promise<string>,
      validarRespuesta: (respuesta: RespuestaUsuario, context: unknown) => Promise<{ isValid: boolean; violationType?: SecurityViolationType; details?: unknown }>,
      validarIntegridadPostIncidente: (respuestas: RespuestaUsuario[], backupRespuestas: RespuestaUsuario[]) => { isValid: boolean; violationType?: SecurityViolationType; details?: unknown }
    },
    @Inject('NOTIFICATION_SERVICE') private notificationService: {
      reset: () => void
    }
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

        // Detener el temporizador inmediatamente para evitar validaciones adicionales
        this.timeService.detener();

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

  anularExamen(examenId: string, motivo: { fecha: string; infracciones: SecurityViolationType[] }): Observable<{ success: boolean; local?: boolean; message?: string }> {
    return this.http.post<{ success: boolean; local?: boolean; message?: string }>(`${this.API_URL}/examenes/${examenId}/anular`, motivo).pipe(
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000
      }),
      catchError(error => {
        console.error('Error al anular examen:', error);

        // Guardar en localStorage como respaldo
        try {
          localStorage.setItem(`examen_anulado_${examenId}`, JSON.stringify({
            datos: motivo,
            timestamp: new Date().toISOString(),
            error: error.message
          }));

          return of({
            success: true,
            local: true,
            message: 'Anulación guardada localmente'
          });
        } catch (_e) {
          return throwError(() => new Error('No se pudo anular el examen. Se registrará localmente.'));
        }
      })
    );
  }

  finalizarExamenApi(datos: Record<string, unknown>): Observable<any> {
    console.log('Intentando finalizar examen:', datos);

    // Extraer el ID del examen del objeto de datos
    const examenId = datos['examenId'] as string;

    if (!examenId) {
      console.error('Error: No se proporcionó un ID de examen válido');
      return throwError(() => new Error('ID de examen no válido'));
    }

    // Asegurar que el ID del usuario esté incluido
    if (!datos['usuarioId']) {
      datos['usuarioId'] = this.getCurrentUserId();
      console.log('Añadiendo ID de usuario a la solicitud:', datos['usuarioId']);
    }

    // Crear una copia de los datos para evitar problemas de referencia
    const datosEnvio = JSON.parse(JSON.stringify(datos));

    // Formatear las respuestas para asegurar compatibilidad con el backend
    this.formatearRespuestas(datosEnvio);

    // Añadir información de tiempo si no está presente
    if (!datosEnvio.tiempoUtilizado) {
      datosEnvio.tiempoUtilizado = this.timeService.getTiempoUtilizado();
    }

    console.log('Datos formateados para envío:', datosEnvio);

    // Intentar finalizar el examen con el endpoint principal
    return this.http.post(`${this.API_URL}/examenes/${examenId}/finalizar`, datosEnvio).pipe(
      map((response: unknown) => response as { success: boolean; guardadoLocal?: boolean; message?: string }),
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000
      }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al finalizar examen (finalizar):', error);

          // Verificar si es un error de formato de datos
          if (error.status === 400 || error.status === 500) {
            console.log('Intentando con formato alternativo de datos...');
            // Intentar con un formato alternativo
            const datosAlternativos = this.prepararFormatoAlternativo(datosEnvio);

            return this.http.post(`${this.API_URL}/examenes/${examenId}/finalizar`, datosAlternativos)
              .pipe(
                timeout(this.TIMEOUT),
                catchError(errorAlt => {
                  console.error('Error con formato alternativo:', errorAlt);
                  // Si también falla, intentar con el endpoint alternativo
                  return this.intentarEndpointAlternativo(examenId as string, datosEnvio);
                })
              );
          }

          // Si es otro tipo de error, intentar con el endpoint alternativo
          return this.intentarEndpointAlternativo(examenId as string, datosEnvio);
        })
      );
  }

  private intentarEndpointAlternativo(examenId: string, datos: Record<string, unknown>): Observable<any> {
    console.log('Intentando con endpoint alternativo...');

    return this.http.post(`${this.API_URL}/examenes/${examenId}/submit`, datos).pipe(
      map((response: unknown) => response as { success: boolean; guardadoLocal?: boolean; message?: string }),
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000
      }),
        catchError(error => {
          console.error('Error al finalizar examen (submit):', error);

          // Intentar con un tercer endpoint como último recurso
          return this.http.post(`${this.API_URL}/examenes/finalizar/${examenId}`, datos)
            .pipe(
              timeout(this.TIMEOUT),
              catchError(finalError => {
                console.error('Error en todos los intentos de finalización:', finalError);
                return of(this.guardarExamenLocalStorage(datos));
              })
            );
        })
      );
  }

  private formatearRespuestas(datos: Record<string, unknown>): void {
    if (!datos['respuestas']) return;

    // Convertir el objeto de respuestas a un formato de array que el backend pueda procesar mejor
    const respuestasArray = Object.entries(datos['respuestas'] as Record<string, unknown>).map(([preguntaId, respuesta]) => {
      return {
        preguntaId,
        respuesta,
        timestamp: new Date().toISOString()
      };
    });

    // Reemplazar el objeto de respuestas con el array
    datos['respuestasArray'] = respuestasArray;

    // Mantener el objeto original para compatibilidad
    // datos.respuestas = datos.respuestas;
  }

  private prepararFormatoAlternativo(datos: Record<string, unknown>): Record<string, unknown> {
    // Crear un formato alternativo que podría ser compatible con el backend
    const alternativo = {
      examenId: datos['examenId'],
      usuarioId: datos['usuarioId'],
      motivo: datos['motivo'],
      tiempoUtilizado: datos['tiempoUtilizado'] || 0,
      respuestas: datos['respuestasArray'] || []
    };

    console.log('Formato alternativo preparado:', alternativo);
    return alternativo;
  }

  /**
   * Guarda los datos del examen en localStorage cuando hay problemas de conexión
   */
  guardarExamenLocalStorage(datos: Record<string, unknown>): { success: boolean; guardadoLocal: boolean; message: string } {
    try {
      const examenId = datos['examenId'] as string;
      const userId = this.getCurrentUserId();

      // Guardar en localStorage como respaldo, incluyendo el ID del usuario en la clave
      localStorage.setItem(`examen_${userId}_${examenId}`, JSON.stringify({
        datos: datos,
        timestamp: new Date().toISOString(),
        intentos: 3
      }));

      return {
        success: true,
        guardadoLocal: true,
        message: 'Guardado localmente debido a errores en la conexión'
      };
    } catch (e) {
      console.error('Error al guardar localmente:', e);
      throw new Error('No se pudo finalizar el examen ni guardar localmente. Por favor, contacte al soporte técnico.');
    }
  }

  private enviarEstadoFinal(examen: ExamenEnCurso): Observable<void> {
    const datosFinalizacion = {
      respuestas: examen.respuestas,
      tiempoUtilizado: this.timeService.getTiempoUtilizado(),
      estado: examen.estado
    };

    return this.http.post<void>(`${this.API_URL}/examenes/${examen.examenId}/finalizar`, datosFinalizacion).pipe(
      timeout(this.TIMEOUT),
      retry(3),
      catchError(error => {
        console.error('Error al enviar estado final:', error);
        // Guardar localmente en caso de error
        this.recoveryService.saveToLocalBackup(examen.examenId, examen);
        return throwError(() => error);
      })
    );
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
    try {
      // Usar el servicio de autenticación para obtener el ID del usuario
      const userId = this.authService.getCurrentUserId();

      if (!userId) {
        console.error('Error: No se pudo obtener el ID del usuario desde el servicio de autenticación');
        throw new Error('ID de usuario no disponible');
      }

      return userId;
    } catch (error) {
      console.error('Error crítico al obtener el ID del usuario:', error);
      return 'anonymous'; // Fallback para evitar errores críticos
    }
  }

  sincronizarExamenesFinalizados(): Observable<{ id: string; success: boolean; error?: string }[]> {
    const examenesFinalizados = this.obtenerExamenesFinalizadosLocalmente();

    if (examenesFinalizados.length === 0) {
      return of([{ id: '', success: true }]);
    }

    // Crear un observable para cada examen finalizado
    const observables = examenesFinalizados.map(examen => {
      return this.http.post(`${this.API_URL}/examenes/${examen.id}/finalizar`, examen.datos)
        .pipe(
          map(() => {
            // Si tiene éxito, eliminar del localStorage
            localStorage.removeItem(`examen_finalizado_${examen.id}`);
            return { id: examen.id, success: true };
          }),
          catchError(error => {
            console.error(`Error al sincronizar examen ${examen.id}:`, error);
            return of({ id: examen.id, success: false, error: error.message });
          })
        );
    });

    // Combinar todos los observables
    return forkJoin(observables);
  }

  private obtenerExamenesFinalizadosLocalmente(): {id: string, datos: Record<string, unknown>, timestamp: string}[] {
    const examenesFinalizados = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('examen_finalizado_')) {
        try {
          const examenId = key.replace('examen_finalizado_', '');
          const datos = JSON.parse(localStorage.getItem(key) || '{}');

          examenesFinalizados.push({
            id: examenId,
            datos: datos.datos,
            timestamp: datos.timestamp
          });
        } catch (e) {
          console.error('Error al parsear examen finalizado:', e);
        }
      }
    }

    return examenesFinalizados;
  }
}
