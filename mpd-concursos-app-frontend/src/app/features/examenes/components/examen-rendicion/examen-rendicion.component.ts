import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ExamenesService } from '@core/services/examenes/examenes.service';
import { ExamenStateService } from '@core/services/examenes/state/examen-state.service';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenValidationService } from '@core/services/examenes/examen-validation.service';
import { ExamenActivityLoggerService } from '@core/services/examenes/examen-activity-logger.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { ExamenRecoveryService } from '@core/services/examenes/examen-recovery.service';
import { ExamenRendicionService } from '@core/services/examenes/examen-rendicion.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { Pregunta, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { FormatTiempoPipe } from '@shared/pipes/format-tiempo.pipe';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import { FullscreenStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';
import { KeyboardSecurityStrategy } from '@core/services/examenes/security/strategies/keyboard.strategy';
import { TabSwitchSecurityStrategy } from '@core/services/examenes/security/strategies/tab-switch.strategy';
import { ExamenEnCurso } from '@shared/interfaces/examen/pregunta.interface';

@Component({
  selector: 'app-examen-rendicion',
  templateUrl: './examen-rendicion.component.html',
  styleUrls: ['./examen-rendicion.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatListModule,
    MatTooltipModule,
    MatProgressBarModule,
    FormatTiempoPipe
  ],
  providers: [
    FullscreenStrategy,
    KeyboardSecurityStrategy,
    TabSwitchSecurityStrategy,
    ExamenSecurityService,
    ExamenTimeService,
    ExamenValidationService,
    ExamenActivityLoggerService,
    ExamenNotificationService,
    ExamenRecoveryService,
    ExamenRendicionService,
    {
      provide: 'SecurityStrategies',
      useFactory: (
        fullscreen: FullscreenStrategy,
        keyboard: KeyboardSecurityStrategy,
        tabSwitch: TabSwitchSecurityStrategy
      ) => [fullscreen, keyboard, tabSwitch],
      deps: [FullscreenStrategy, KeyboardSecurityStrategy, TabSwitchSecurityStrategy]
    },
    {
      provide: 'ExamenEnCurso',
      useFactory: () => ({
        estado: 'INICIAL'
      })
    }
  ]
})
export class ExamenRendicionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  examen: Examen | null = null;
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePreguntaActual = 0;
  respuestas: { [key: string]: string | string[] } = {};
  tiempoRestante: number = 0;
  estadoExamen = ESTADO_EXAMEN.DISPONIBLE;
  readonly TIPO_PREGUNTA = TipoPregunta;

  // Properties for UI state
  preguntasRespondidas = new Set<string>();
  preguntasMarcadas = new Set<string>();
  opcionesOrdenadas: any[] = [];

  @ViewChild('seleccionList') seleccionList!: MatSelectionList;

  private modoPrueba = false;

  private anulacionEnProgreso = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examenesService: ExamenesService,
    private stateService: ExamenStateService,
    private securityService: ExamenSecurityService,
    private timeService: ExamenTimeService,
    private validationService: ExamenValidationService,
    private activityLogger: ExamenActivityLoggerService,
    private notificationService: ExamenNotificationService,
    private recoveryService: ExamenRecoveryService,
    private rendicionService: ExamenRendicionService
  ) {}

  ngOnInit(): void {
    // Verificar si estamos en modo prueba
    this.route.queryParams.subscribe(params => {
      this.modoPrueba = params['modo'] === 'prueba';
      if (this.modoPrueba) {
        console.log('MODO PRUEBA ACTIVADO: Se omitirán validaciones de fecha');
      }
    });

    // Obtener el ID del examen de la URL
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Inicializar medidas de seguridad
        this.securityService.initializeSecurityMeasures()
          .then(() => {
            // Cargar el examen
            this.cargarExamen(id);
          })
          .catch(error => {
            console.error('Error al inicializar medidas de seguridad:', error);
            this.notificationService.mostrarError('Error al inicializar medidas de seguridad');
            this.router.navigate(['/dashboard/examenes']);
          });
      } else {
        this.router.navigate(['/dashboard/examenes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeService.detener();
    this.securityService.deactivateSecureMode();
    this.securityService.cleanup();
    this.notificationService.cleanup();
  }

  // Navigation methods
  anterior(): void {
    this.navegarPregunta('anterior');
  }

  siguiente(): void {
    this.navegarPregunta('siguiente');
  }

  irAPregunta(indice: number): void {
    if (indice > 0 && indice <= this.preguntas.length) {
      this.indicePreguntaActual = indice - 1;
      this.preguntaActual = this.preguntas[this.indicePreguntaActual];

      // Asegurarse de que las respuestas estén inicializadas para la pregunta actual
      if (this.preguntaActual.tipo === TipoPregunta.SELECCION_MULTIPLE && !this.respuestas[this.preguntaActual.id]) {
        this.respuestas[this.preguntaActual.id] = [];
      }

      // Inicializar opciones ordenadas si es una pregunta de ordenamiento
      if (this.preguntaActual.tipo === TipoPregunta.ORDENAMIENTO) {
        this.opcionesOrdenadas = [...(this.preguntaActual.opciones || [])];
        if (this.respuestas[this.preguntaActual.id]) {
          // Si ya hay una respuesta, ordenar según la respuesta guardada
          const ordenGuardado = this.respuestas[this.preguntaActual.id] as string[];
          this.opcionesOrdenadas.sort((a, b) => {
            return ordenGuardado.indexOf(a.id) - ordenGuardado.indexOf(b.id);
          });
        }
      }
    }
  }

  // Answer handling methods
  guardarRespuesta(respuesta: string | string[]): void {
    if (this.preguntaActual) {
      this.respuestas[this.preguntaActual.id] = respuesta;
      this.preguntasRespondidas.add(this.preguntaActual.id);
      if (this.examen) {
        this.recoveryService.guardarRespuestas(this.examen.id, this.respuestas);
      }
    }
  }

  guardarRespuestaMultiple(opciones: any[]): void {
    if (this.preguntaActual) {
      const respuestas = opciones.map(opcion => opcion.value);
      this.respuestas[this.preguntaActual.id] = respuestas;
      this.preguntasRespondidas.add(this.preguntaActual.id);
      if (this.examen) {
        this.recoveryService.guardarRespuestas(this.examen.id, this.respuestas);
      }
    }
  }

  guardarRespuestaTexto(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (this.preguntaActual) {
      this.guardarRespuesta(input.value);
    }
  }

  // Question marking methods
  marcarParaRevisar(): void {
    if (this.preguntaActual) {
      if (this.preguntasMarcadas.has(this.preguntaActual.id)) {
        this.preguntasMarcadas.delete(this.preguntaActual.id);
      } else {
        this.preguntasMarcadas.add(this.preguntaActual.id);
      }
    }
  }

  finalizar(): void {
    this.finalizarExamen('FINALIZADO_USUARIO');
  }

  getEstadoPregunta(pregunta: Pregunta): string {
    let estado = '';
    if (this.preguntasRespondidas.has(pregunta.id)) {
      estado += ' - Respondida';
    }
    if (this.preguntasMarcadas.has(pregunta.id)) {
      estado += ' - Marcada para revisión';
    }
    return estado;
  }

  // Drag and drop handling
  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.opcionesOrdenadas, event.previousIndex, event.currentIndex);
    if (this.preguntaActual) {
      const orden = this.opcionesOrdenadas.map(opcion => opcion.id);
      this.guardarRespuesta(orden);
    }
  }

  trackByOpcion(index: number, opcion: any): string {
    return opcion.id;
  }

  // Security methods
  onCopy(event: Event): void {
    event.preventDefault();
    this.activityLogger.registrarActividad('INTENTO_COPIA');
  }

  onCut(event: Event): void {
    event.preventDefault();
    this.activityLogger.registrarActividad('INTENTO_CORTE');
  }

  onPaste(event: Event): void {
    event.preventDefault();
    this.activityLogger.registrarActividad('INTENTO_PEGADO');
  }

  private cargarExamen(id: string): void {
    console.log('Cargando examen:', id);
    this.examenesService.getExamen(id)
      .pipe(
        catchError(error => {
          console.error('Error al cargar el examen:', error);
          this.notificationService.mostrarError('No se pudo cargar el examen solicitado');
          this.router.navigate(['/dashboard/examenes']);
          return of(null);
        })
      )
      .subscribe({
        next: (examen) => {
          if (!examen) {
            this.notificationService.mostrarError('El examen solicitado no existe');
            this.router.navigate(['/dashboard/examenes']);
            return;
          }

          // Verificar si el examen está disponible
          if (examen.estado !== 'DISPONIBLE' && examen.estado !== 'EN_CURSO') {
            console.log(`El examen no está disponible. Estado actual: ${examen.estado}`);
            this.notificationService.mostrarError('Este examen no está disponible en este momento');
            this.router.navigate(['/dashboard/examenes']);
            return;
          }

          // Verificar si el examen está dentro del horario programado (solo si no estamos en modo prueba)
          if (!this.modoPrueba) {
            const ahora = new Date();
            const fechaInicio = examen.fechaInicio ? new Date(examen.fechaInicio) : null;

            if (fechaInicio && ahora < fechaInicio) {
              console.log('El examen aún no ha comenzado', { ahora, fechaInicio });
              this.notificationService.mostrarError('Este examen aún no ha comenzado');
              this.router.navigate(['/dashboard/examenes']);
              return;
            }
          } else {
            console.log('MODO PRUEBA: Omitiendo validación de fecha para el examen');
          }

          this.examen = examen;
          console.log('Examen cargado:', this.examen);

          // Crear el objeto ExamenEnCurso
          const examenEnCurso: ExamenEnCurso = {
            examenId: examen.id,
            usuarioId: this.getCurrentUserId(),
            estado: 'EN_CURSO',
            fechaInicio: new Date().toISOString(),
            fechaLimite: this.calcularFechaLimite(),
            preguntaActual: 0,
            respuestas: [],
            duracion: examen.duracion
          };

          // Inicializar el estado del examen
          this.stateService.inicializarExamen(examenEnCurso);

          // Cargar las preguntas
          this.cargarPreguntas(id);
        },
        error: (error) => {
          console.error('Error en la suscripción del examen:', error);
          this.notificationService.mostrarError('Error al procesar el examen');
          this.router.navigate(['/dashboard/examenes']);
        }
      });
  }

  private cargarPreguntas(examenId: string): void {
    console.log('Cargando preguntas para el examen:', examenId);
    console.log('URL de petición de preguntas:', `api/examenes/${examenId}/questions`);

    this.examenesService.getPreguntas(examenId)
      .pipe(
        catchError(error => {
          console.error('Error al cargar preguntas:', error);
          this.notificationService.mostrarError('Error al cargar las preguntas del examen');
          this.router.navigate(['/dashboard/examenes']);
          return of([]);
        })
      )
      .subscribe({
        next: (preguntas) => {
          console.log('Respuesta del servidor para preguntas:', preguntas);
          console.log('Tipos de preguntas recibidas:', preguntas.map(p => ({ id: p.id, tipo: p.tipo, opcionesCount: p.opciones?.length || 0 })));

          if (!preguntas || preguntas.length === 0) {
            console.log('El examen no tiene preguntas configuradas');

            if (this.modoPrueba) {
              console.log('MODO PRUEBA: Cargando preguntas de ejemplo');
              this.cargarPreguntasEjemplo();
              return;
            }

            this.notificationService.mostrarError('Este examen no tiene preguntas configuradas');
            this.timeService.detener();
            this.router.navigate(['/dashboard/examenes']);
            return;
          }

          this.preguntas = preguntas;
          this.indicePreguntaActual = 0;
          this.preguntaActual = this.preguntas[this.indicePreguntaActual];

          // Inicializar respuestas para cada tipo de pregunta
          this.preguntas.forEach(pregunta => {
            if (!this.respuestas[pregunta.id]) {
              switch (pregunta.tipo) {
                case TipoPregunta.SELECCION_MULTIPLE:
                  this.respuestas[pregunta.id] = [];
                  break;
                case TipoPregunta.VERDADERO_FALSO:
                  this.respuestas[pregunta.id] = '';
                  break;
                case TipoPregunta.DESARROLLO:
                  this.respuestas[pregunta.id] = '';
                  break;
                case TipoPregunta.ORDENAMIENTO:
                  this.respuestas[pregunta.id] = pregunta.opciones?.map(o => o.id) || [];
                  break;
                case TipoPregunta.OPCION_MULTIPLE:
                  this.respuestas[pregunta.id] = '';
                  break;
              }
            }
            console.log(`Pregunta ${pregunta.id} inicializada:`, {
              tipo: pregunta.tipo,
              opciones: pregunta.opciones,
              respuesta: this.respuestas[pregunta.id]
            });
          });

          console.log('Preguntas cargadas correctamente:', this.preguntas.length);
          console.log('Primera pregunta:', this.preguntaActual);
          console.log('Estado inicial de respuestas:', this.respuestas);

          // Recuperar respuestas guardadas
          this.recuperarRespuestas();

          // Iniciar el examen
          this.iniciarExamen();

          // Iniciar monitoreo
          this.iniciarMonitoreo();

          // Actualizar estado
          this.estadoExamen = ESTADO_EXAMEN.EN_CURSO;
        },
        error: (error) => {
          console.error('Error en la suscripción de preguntas:', error);
          this.notificationService.mostrarError('Error al procesar las preguntas del examen');
          this.router.navigate(['/dashboard/examenes']);
        }
      });
  }

  private cargarPreguntasEjemplo(): void {
    console.log('Cargando preguntas de ejemplo para el modo prueba');

    // Crear preguntas de ejemplo
    const preguntasEjemplo: Pregunta[] = [
      {
        id: '1',
        texto: '¿Cuál es el plazo para presentar un recurso de apelación en un proceso civil?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        opciones: [
          { id: 'a', texto: '5 días hábiles', orden: 1 },
          { id: 'b', texto: '10 días hábiles', orden: 2 },
          { id: 'c', texto: '15 días hábiles', orden: 3 },
          { id: 'd', texto: '30 días hábiles', orden: 4 }
        ],
        puntaje: 10,
        orden: 1
      },
      {
        id: '2',
        texto: 'Explique brevemente el principio de legalidad en el derecho penal',
        tipo: TipoPregunta.DESARROLLO,
        puntaje: 15,
        orden: 2
      },
      {
        id: '3',
        texto: 'Ordene cronológicamente las siguientes etapas del proceso penal',
        tipo: TipoPregunta.ORDENAMIENTO,
        opciones: [
          { id: 'a', texto: 'Investigación preliminar', orden: 1 },
          { id: 'b', texto: 'Juicio oral', orden: 3 },
          { id: 'c', texto: 'Formalización de la investigación', orden: 2 },
          { id: 'd', texto: 'Sentencia', orden: 4 }
        ],
        puntaje: 10,
        orden: 3
      },
      {
        id: '4',
        texto: 'Seleccione todas las garantías constitucionales que aplican al proceso penal',
        tipo: TipoPregunta.SELECCION_MULTIPLE,
        opciones: [
          { id: 'a', texto: 'Derecho a la defensa', orden: 1 },
          { id: 'b', texto: 'Presunción de inocencia', orden: 2 },
          { id: 'c', texto: 'Derecho a guardar silencio', orden: 3 },
          { id: 'd', texto: 'Derecho a un juicio público', orden: 4 }
        ],
        puntaje: 10,
        orden: 4
      }
    ];

    this.preguntas = preguntasEjemplo;
    this.indicePreguntaActual = 0;
    this.preguntaActual = this.preguntas[this.indicePreguntaActual];

    console.log('Preguntas de ejemplo cargadas correctamente:', this.preguntas.length);
    console.log('Primera pregunta de ejemplo:', this.preguntaActual);

    // Inicializar respuestas
    this.respuestas = {};

    // Iniciar el examen (temporizador)
    this.iniciarExamen();

    // Iniciar monitoreo después de cargar preguntas
    this.iniciarMonitoreo();

    // Actualizar estado del examen
    this.estadoExamen = ESTADO_EXAMEN.EN_CURSO;

    this.notificationService.mostrarError('MODO PRUEBA: Se han cargado preguntas de ejemplo');
  }

  private iniciarExamen(): void {
    if (!this.examen) {
      console.error('No se puede iniciar el examen: no hay examen cargado');
      this.notificationService.mostrarError('Error al iniciar el examen');
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    // Detener cualquier temporizador previo
    this.timeService.detener();

    // Iniciar el temporizador con manejo de errores mejorado
    console.log(`Iniciando temporizador para examen con duración: ${this.examen.duracion} minutos`);

    this.timeService.iniciar(this.examen.duracion)
      .pipe(
        catchError(error => {
          console.error('Error al iniciar el temporizador:', error);
          // Usar un valor predeterminado para el tiempo restante
          this.notificationService.mostrarError('Error al sincronizar el tiempo. Usando tiempo local.');
          return of(this.examen!.duracion * 60);
        })
      )
      .subscribe({
        next: (tiempoRestante) => {
          console.log('Tiempo restante inicializado:', tiempoRestante);
          this.tiempoRestante = tiempoRestante;

          // Actualizar el estado global del tiempo restante
          this.stateService.actualizarTiempoRestante(tiempoRestante);
        },
        error: (error) => {
          console.error('Error en la suscripción del temporizador:', error);
          this.notificationService.mostrarError('Error al iniciar el temporizador del examen');
          this.router.navigate(['/dashboard/examenes']);
        }
      });
  }

  private iniciarMonitoreo(): void {
    if (!this.examen) {
      console.error('No se puede iniciar el monitoreo: no hay examen cargado');
      return;
    }

    console.log('Iniciando monitoreo de seguridad para el examen');

    // Registrar las violaciones de seguridad
    this.securityService.iniciarMonitoreo()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Error en el monitoreo de seguridad:', error);
          // Devolver un observable vacío para no interrumpir el flujo
          return of(null);
        })
      )
      .subscribe({
        next: (violacion: SecurityViolationType | null) => {
          if (violacion) {
            console.warn(`Violación de seguridad detectada: ${violacion}`);
            this.anularExamen(violacion);
          }
        },
        error: (error: any) => {
          console.error('Error en la suscripción del monitoreo:', error);
          // No interrumpimos el examen por un error en el monitoreo
        },
        complete: () => {
          console.log('Monitoreo de seguridad finalizado');
        }
      });

    console.log('Monitoreo de seguridad iniciado correctamente');
  }

  private recuperarRespuestas(): void {
    if (!this.examen) return;

    const respuestasGuardadas = this.recoveryService.recuperarRespuestas(this.examen.id);
    if (respuestasGuardadas) {
      this.respuestas = respuestasGuardadas;
      Object.keys(respuestasGuardadas).forEach(preguntaId => {
        this.preguntasRespondidas.add(preguntaId);
      });
    }
  }

  private navegarPregunta(direccion: 'anterior' | 'siguiente'): void {
    if (!this.preguntaActual) return;

    const indiceActual = this.indicePreguntaActual;
    if (direccion === 'anterior' && indiceActual > 0) {
      this.indicePreguntaActual--;
    } else if (direccion === 'siguiente' && indiceActual < this.preguntas.length - 1) {
      this.indicePreguntaActual++;
    }

    this.preguntaActual = this.preguntas[this.indicePreguntaActual];

    // Asegurarse de que las respuestas estén inicializadas para la pregunta actual
    if (this.preguntaActual.tipo === TipoPregunta.SELECCION_MULTIPLE && !this.respuestas[this.preguntaActual.id]) {
      this.respuestas[this.preguntaActual.id] = [];
    }

    // Inicializar opciones ordenadas si es una pregunta de ordenamiento
    if (this.preguntaActual.tipo === TipoPregunta.ORDENAMIENTO) {
      this.opcionesOrdenadas = [...(this.preguntaActual.opciones || [])];
      if (this.respuestas[this.preguntaActual.id]) {
        // Si ya hay una respuesta, ordenar según la respuesta guardada
        const ordenGuardado = this.respuestas[this.preguntaActual.id] as string[];
        this.opcionesOrdenadas.sort((a, b) => {
          return ordenGuardado.indexOf(a.id) - ordenGuardado.indexOf(b.id);
        });
      }
    }
  }

  private anularExamen(violacion: SecurityViolationType): void {
    if (!this.examen || this.anulacionEnProgreso) return;

    this.anulacionEnProgreso = true;
    this.estadoExamen = ESTADO_EXAMEN.ANULADO;
    
    const finalizarAnulacion = () => {
      this.anulacionEnProgreso = false;
      this.router.navigate(['/dashboard/examenes']);
    };

    this.rendicionService.anularExamen(this.examen.id, {
      fecha: new Date().toISOString(),
      infracciones: [violacion]
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.rendicionService.finalizarExamenApi(this.examen!.id, {
          respuestas: this.respuestas,
          tiempoUtilizado: this.timeService.getTiempoUtilizado()
        }).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.mostrarError('El examen ha sido anulado por una violación de seguridad');
            finalizarAnulacion();
          },
          error: (error) => {
            console.error('Error al finalizar el examen anulado:', error);
            this.notificationService.mostrarError('Error al finalizar el examen anulado');
            finalizarAnulacion();
          }
        });
      },
      error: (error) => {
        console.error('Error al anular el examen:', error);
        this.notificationService.mostrarError('Error al anular el examen');
        finalizarAnulacion();
      }
    });
  }

  private finalizarExamen(motivo: string): void {
    if (!this.examen) return;

    this.rendicionService.finalizarExamenApi(this.examen.id, {
      respuestas: this.respuestas,
      tiempoUtilizado: this.timeService.getTiempoUtilizado()
    }).subscribe({
      next: () => {
        this.notificationService.mostrarExito('Examen finalizado correctamente');
        this.router.navigate(['/dashboard/examenes']);
      },
      error: (error) => {
        console.error('Error al finalizar el examen:', error);
        this.notificationService.mostrarError('Error al finalizar el examen');
      }
    });
  }

  // Método para calcular la fecha límite basada en la duración del examen
  private calcularFechaLimite(): string {
    if (!this.examen || !this.examen.duracion) {
      return new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora por defecto
    }

    // Calcular fecha límite basada en la duración en minutos
    const fechaLimite = new Date(Date.now() + this.examen.duracion * 60 * 1000);
    return fechaLimite.toISOString();
  }

  // Método para obtener el ID del usuario actual
  private getCurrentUserId(): string {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 'anonymous';
      }
    } catch (error) {
      console.error('Error al obtener el ID del usuario:', error);
    }
    return 'anonymous';
  }
}
