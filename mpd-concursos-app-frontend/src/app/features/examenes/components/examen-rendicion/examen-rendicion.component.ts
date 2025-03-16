import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, Injector } from '@angular/core';
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
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ExamenesService } from '@core/services/examenes/examenes.service';
import { ExamenStateService } from '@core/services/examenes/state/examen-state.service';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { ExamenRecoveryService } from '@core/services/examenes/examen-recovery.service';
import { ExamenRendicionService } from '@core/services/examenes/examen-rendicion.service';
import { ExamenValidationService } from '@core/services/examenes/examen-validation.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { Pregunta, TipoPregunta, ExamenEnCurso, Opcion } from '@shared/interfaces/examen/pregunta.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { FormatTiempoPipe } from '@shared/pipes/format-tiempo.pipe';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, finalize, map, filter, timeout } from 'rxjs/operators';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import { FullscreenStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';
import { TabSwitchSecurityStrategy } from '@core/services/examenes/security/strategies/tab-switch.strategy';
import { KeyboardSecurityStrategy } from '@core/services/examenes/security/strategies/keyboard.strategy';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SECURITY_PROVIDERS } from '../../providers/security.providers';
import { AuthService } from '@core/services/auth/auth.service';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';
import { interval } from 'rxjs';

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
    MatProgressSpinnerModule,
    MatDialogModule,
    FormatTiempoPipe
  ],
  providers: [
    ...SECURITY_PROVIDERS,
    ExamenTimeService,
    ExamenNotificationService,
    ExamenRecoveryService,
    ExamenRendicionService,
    ExamenValidationService
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
  isExamInProgress = false;

  @ViewChild('seleccionList') seleccionList!: any;

  private modoPrueba = false;

  private anulacionEnProgreso = false;

  // Indicador de carga
  public cargando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examenesService: ExamenesService,
    private stateService: ExamenStateService,
    private securityService: ExamenSecurityService,
    private timeService: ExamenTimeService,
    private notificationService: ExamenNotificationService,
    private recoveryService: ExamenRecoveryService,
    private rendicionService: ExamenRendicionService,
    private dialog: MatDialog,
    private injector: Injector
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
      takeUntil(this.destroy$),
      map(params => params.get('id')),
      filter(id => !!id)
    ).subscribe(id => {
      if (id) {
        // Cargar el examen primero
        this.cargarExamen(id);

        // Las medidas de seguridad se inicializarán solo después de verificar
        // que hay preguntas disponibles, en el método cargarPreguntas
      }
    });

    // No nos suscribimos a los cambios de estado aquí, lo haremos después de cargar las preguntas
  }

  ngOnDestroy(): void {
    // Detener el temporizador
    this.timeService.detener();

    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();

    // Desactivar modo seguro y limpiar servicios
    try {
      this.securityService.deactivateSecureMode();
      this.securityService.cleanup();
      this.notificationService.cleanup();
    } catch (error) {
      console.error('Error al limpiar recursos:', error);
    }
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
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      console.log(`Guardando respuesta para pregunta ${this.preguntaActual.id}:`, respuesta);

      // Guardar la respuesta localmente
      this.respuestas[this.preguntaActual.id] = respuesta;
      this.preguntasRespondidas.add(this.preguntaActual.id);

      // Usar setTimeout para evitar bloquear la UI
      setTimeout(() => {
        try {
          if (this.examen) {
            // Crear objeto de respuesta con timestamp
            const respuestaObj = {
              [this.preguntaActual!.id]: respuesta
            };

            console.log('Enviando respuesta al servicio de recuperación:', respuestaObj);
            this.recoveryService.guardarRespuestas(this.examen.id, respuestaObj);
          }
        } catch (error) {
          console.error('Error al guardar respuesta en el servicio de recuperación:', error);
          this.notificationService.mostrarError('Error al guardar respuesta. Sus cambios podrían no guardarse.');
        }
      }, 0);
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
      this.notificationService.mostrarError('Error al procesar su respuesta');
    }
  }

  guardarRespuestaMultiple(opciones: any[]): void {
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      const respuestas = opciones.map(opcion => opcion.value);
      console.log(`Guardando respuesta múltiple para pregunta ${this.preguntaActual.id}:`, respuestas);

      // Guardar la respuesta localmente
      this.respuestas[this.preguntaActual.id] = respuestas;
      this.preguntasRespondidas.add(this.preguntaActual.id);

      // Usar setTimeout para evitar bloquear la UI
      setTimeout(() => {
        try {
          if (this.examen) {
            // Crear objeto de respuesta con solo la respuesta actual
            const respuestaObj = {
              [this.preguntaActual!.id]: respuestas
            };

            console.log('Enviando respuesta múltiple al servicio de recuperación:', respuestaObj);
            this.recoveryService.guardarRespuestas(this.examen.id, respuestaObj);
          }
        } catch (error) {
          console.error('Error al guardar respuesta múltiple en el servicio de recuperación:', error);
          this.notificationService.mostrarError('Error al guardar respuesta. Sus cambios podrían no guardarse.');
        }
      }, 0);
    } catch (error) {
      console.error('Error al guardar respuesta múltiple:', error);
      this.notificationService.mostrarError('Error al procesar su respuesta');
    }
  }

  guardarRespuestaTexto(event: Event): void {
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      const input = event.target as HTMLTextAreaElement;
      const texto = input.value;
      console.log(`Guardando respuesta de texto para pregunta ${this.preguntaActual.id}`);

      // Usar setTimeout para evitar bloquear la UI
      setTimeout(() => {
        try {
          // Guardar la respuesta localmente
          this.respuestas[this.preguntaActual!.id] = texto;
          this.preguntasRespondidas.add(this.preguntaActual!.id);

          // Crear objeto de respuesta con solo la respuesta actual
          const respuestaObj = {
            [this.preguntaActual!.id]: texto
          };

          console.log('Enviando texto al servicio de recuperación:', respuestaObj);
          this.recoveryService.guardarRespuestas(this.examen!.id, respuestaObj);
        } catch (error) {
          console.error('Error al guardar respuesta de texto:', error);
          this.notificationService.mostrarError('Error al guardar su respuesta de texto');
        }
      }, 0);
    } catch (error) {
      console.error('Error al procesar respuesta de texto:', error);
      this.notificationService.mostrarError('Error al procesar su respuesta');
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
    // Mostrar diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Finalizar Examen',
        mensaje: '¿Está seguro de que desea finalizar el examen? Una vez finalizado, no podrá volver a acceder a él.',
        confirmButtonText: 'Finalizar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.finalizarExamen('FINALIZADO_USUARIO');
      }
    });
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
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      moveItemInArray(this.opcionesOrdenadas, event.previousIndex, event.currentIndex);
      console.log(`Guardando orden para pregunta ${this.preguntaActual.id}`);

      // Usar setTimeout para evitar bloquear la UI
      setTimeout(() => {
        try {
          const orden = this.opcionesOrdenadas.map(opcion => opcion.id);

          // Guardar la respuesta localmente
          this.respuestas[this.preguntaActual!.id] = orden;
          this.preguntasRespondidas.add(this.preguntaActual!.id);

          // Crear objeto de respuesta con solo la respuesta actual
          const respuestaObj = {
            [this.preguntaActual!.id]: orden
          };

          console.log('Enviando orden al servicio de recuperación:', respuestaObj);
          this.recoveryService.guardarRespuestas(this.examen!.id, respuestaObj);
        } catch (error) {
          console.error('Error al guardar orden:', error);
          this.notificationService.mostrarError('Error al guardar el orden de las opciones');
        }
      }, 0);
    } catch (error) {
      console.error('Error al procesar cambio de orden:', error);
      this.notificationService.mostrarError('Error al procesar el cambio de orden');
    }
  }

  trackByOpcion(index: number, opcion: any): string {
    return opcion.id;
  }

  // Security methods
  onCopy(event: Event): void {
    event.preventDefault();
    this.registrarActividad('INTENTO_COPIA');
  }

  onCut(event: Event): void {
    event.preventDefault();
    this.registrarActividad('INTENTO_CORTE');
  }

  onPaste(event: Event): void {
    event.preventDefault();
    this.registrarActividad('INTENTO_PEGADO');
  }

  // Método auxiliar para registrar actividad
  private registrarActividad(tipo: string): void {
    console.log(`Actividad registrada: ${tipo}`);
    // Este método reemplaza las llamadas al activityLogger
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

          // Desactivar medidas de seguridad antes de navegar
          try {
            if (this.securityService) {
              this.securityService.deactivateSecureMode();
            }
          } catch (err) {
            console.warn('No se pudo desactivar el modo seguro:', err);
          }

          // Detener el temporizador si está activo
          try {
            if (this.timeService) {
              this.timeService.detener();
            }
          } catch (err) {
            console.warn('No se pudo detener el temporizador:', err);
          }

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

            // Desactivar medidas de seguridad antes de navegar
            try {
              if (this.securityService) {
                this.securityService.deactivateSecureMode();
              }
            } catch (err) {
              console.warn('No se pudo desactivar el modo seguro:', err);
            }

            // Detener el temporizador si está activo
            try {
              if (this.timeService) {
                this.timeService.detener();
              }
            } catch (err) {
              console.warn('No se pudo detener el temporizador:', err);
            }

            this.router.navigate(['/dashboard/examenes']);
            return;
          }

          // Solo iniciar el examen si hay preguntas
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

          // Desactivar medidas de seguridad antes de navegar
          try {
            if (this.securityService) {
              this.securityService.deactivateSecureMode();
            }
          } catch (err) {
            console.warn('No se pudo desactivar el modo seguro:', err);
          }

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
    console.log('Iniciando examen...');

    // Inicializar medidas de seguridad con mejor manejo de errores
    try {
      // Primero iniciamos el temporizador para asegurar que el tiempo se muestre correctamente
      // incluso si hay problemas con las medidas de seguridad
      this.timeService.iniciar(this.examen?.duracion || 120);

      // Marcar el examen como en progreso
      this.isExamInProgress = true;

      // Suscribirse a cambios en el estado del examen
      this.stateService.getExamenEnCurso()
        .pipe(takeUntil(this.destroy$))
        .subscribe(examen => {
          if (examen) {
            this.estadoExamen = examen.estado as unknown as ESTADO_EXAMEN;
            console.log('Estado del examen actualizado:', this.estadoExamen);
          }
        });

      // Inicializar las medidas de seguridad con un timeout para evitar bloqueos
      const securityPromise = new Promise<void>((resolve, reject) => {
        // Establecer un timeout de 5 segundos para la inicialización de seguridad
        const timeoutId = setTimeout(() => {
          console.warn('Timeout al inicializar medidas de seguridad. Continuando con el examen...');
          resolve(); // Resolvemos la promesa para continuar con el examen
        }, 5000);

        this.securityService.initializeSecurityMeasures()
          .then(() => {
            clearTimeout(timeoutId); // Limpiamos el timeout si todo va bien
            console.log('Medidas de seguridad inicializadas correctamente');
            resolve();
          })
          .catch(error => {
            clearTimeout(timeoutId); // Limpiamos el timeout en caso de error
            console.error('Error al inicializar medidas de seguridad:', error);
            // Mostramos el error pero no rechazamos la promesa para permitir continuar
            this.notificationService.mostrarAdvertencia(
              'No se pudieron inicializar todas las medidas de seguridad. El examen continuará, pero algunas funciones podrían no estar disponibles.'
            );
            resolve(); // Resolvemos la promesa para continuar con el examen
          });
      });

      // No esperamos a que se complete la promesa para continuar con la UI
    } catch (error) {
      console.error('Error crítico al inicializar el examen:', error);
      this.notificationService.mostrarError('Error crítico al inicializar el examen. Intentando continuar...');
      // Intentamos continuar con el examen a pesar del error
    }
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

    console.log(`Anulando examen por violación de seguridad: ${violacion}`);

    // Detener el temporizador inmediatamente
    try {
      this.timeService.detener();
    } catch (error) {
      console.error('Error al detener el temporizador:', error);
    }

    // Marcar como anulado y en progreso
    this.anulacionEnProgreso = true;
    this.estadoExamen = ESTADO_EXAMEN.ANULADO;
    this.isExamInProgress = false;

    // Desactivar medidas de seguridad con manejo de errores
    try {
      this.securityService.deactivateSecureMode();
    } catch (error) {
      console.error('Error al desactivar modo seguro:', error);
    }

    try {
      this.securityService.cleanup();
    } catch (error) {
      console.error('Error al limpiar recursos de seguridad:', error);
    }

    // Mostrar mensaje al usuario antes de continuar
    this.notificationService.mostrarError(
      'El examen ha sido anulado por una violación de seguridad: ' +
      this.getViolationMessage(violacion)
    );

    // Establecer un timeout para asegurar que la UI se actualice
    setTimeout(() => {
      this.finalizarAnulacion(violacion);
    }, 1000);
  }

  private finalizarAnulacion(violacion: SecurityViolationType): void {
    if (!this.examen) return;

    console.log('Finalizando anulación del examen...');

    // Función para completar el proceso independientemente del resultado
    const completarAnulacion = () => {
      this.anulacionEnProgreso = false;
      // Usar setTimeout para permitir que Angular complete el ciclo actual
      setTimeout(() => {
        this.router.navigate(['/dashboard/examenes']);
      }, 500);
    };

    // Intentar registrar la anulación en el servidor
    this.rendicionService.anularExamen(this.examen.id, {
      fecha: new Date().toISOString(),
      infracciones: [violacion]
    }).pipe(
      takeUntil(this.destroy$),
      // Timeout para evitar bloqueos
      timeout(10000),
      catchError(error => {
        console.error('Error al anular el examen en el servidor:', error);
        return of(null); // Continuamos con el flujo
      })
    ).subscribe({
      next: () => {
        // Intentar finalizar el examen
        this.rendicionService.finalizarExamenApi({
          examenId: this.examen!.id,
          respuestas: this.respuestas,
          tiempoUtilizado: this.timeService.getTiempoUtilizado(),
          motivo: 'ANULADO_SEGURIDAD'
        }).pipe(
          takeUntil(this.destroy$),
          // Timeout para evitar bloqueos
          timeout(10000),
          catchError(error => {
            console.error('Error al finalizar el examen anulado:', error);
            return of(null); // Continuamos con el flujo
          })
        ).subscribe({
          next: () => {
            console.log('Examen anulado y finalizado correctamente');
            completarAnulacion();
          },
          error: () => {
            console.error('Error al finalizar el examen anulado');
            completarAnulacion();
          }
        });
      },
      error: () => {
        console.error('Error al anular el examen');
        completarAnulacion();
      }
    });
  }

  // Método auxiliar para obtener un mensaje descriptivo de la violación
  private getViolationMessage(violacion: SecurityViolationType): string {
    switch (violacion) {
      case SecurityViolationType.FULLSCREEN_REQUIRED:
        return 'Salida del modo pantalla completa';
      case SecurityViolationType.TAB_SWITCH:
        return 'Cambio de pestaña o aplicación';
      case SecurityViolationType.KEYBOARD_SHORTCUT:
        return 'Uso de atajos de teclado no permitidos';
      case SecurityViolationType.SUSPICIOUS_BEHAVIOR:
        return 'Comportamiento sospechoso';
      case SecurityViolationType.NETWORK_VIOLATION:
        return 'Violación de red';
      default:
        return 'Violación de seguridad desconocida';
    }
  }

  finalizarExamen(motivo: string = 'FINALIZADO_USUARIO') {
    if (!this.examen) return;

    console.log('Iniciando proceso de finalización del examen:', this.examen.id);

    // Detener el timer y desactivar seguridad inmediatamente
    this.timeService.detener();
    this.isExamInProgress = false;

    try {
      this.securityService.deactivateSecureMode();
    } catch (error) {
      console.error('Error al desactivar modo seguro:', error);
      // Continuar con el proceso a pesar del error
    }

    // Actualizar el estado del examen en el servicio de estado
    this.stateService.cambiarEstadoExamen('FINALIZADO');

    // Datos para finalizar el examen
    const datosFinalizacion = {
      examenId: this.examen.id,
      respuestas: this.respuestas,
      motivo: motivo,
      usuarioId: this.getCurrentUserId(), // Asegurar que se envíe el ID del usuario
      tiempoUtilizado: this.timeService.getTiempoUtilizado(),
      fechaFinalizacion: new Date().toISOString()
    };

    // Mostrar indicador de carga
    this.cargando = true;

    console.log('Enviando datos de finalización al servidor:', datosFinalizacion);

    // Establecer un timeout para evitar que el usuario espere indefinidamente
    const timeoutId = setTimeout(() => {
      if (this.cargando) {
        console.warn('Timeout alcanzado al finalizar el examen. Guardando localmente...');
        this.manejarErrorFinalizacion(datosFinalizacion, new Error('Timeout al finalizar el examen'));
      }
    }, 30000); // 30 segundos de timeout

    // Intentar finalizar el examen
    this.rendicionService.finalizarExamenApi(datosFinalizacion)
      .pipe(
        finalize(() => {
          clearTimeout(timeoutId); // Limpiar el timeout en cualquier caso
        })
      )
      .subscribe({
        next: (response) => {
          this.cargando = false;

          // Verificar si se guardó localmente debido a problemas de conexión
          if (response && response.guardadoLocal) {
            this.notificationService.mostrarAdvertencia(
              'El examen se ha guardado localmente debido a problemas de conexión. ' +
              'Se enviará automáticamente cuando se restablezca la conexión.'
            );
          } else {
            this.notificationService.mostrarExito('¡Examen finalizado correctamente!');
          }

          // Limpiar recursos
          this.limpiarRecursos();

          // Navegar de vuelta a la lista de exámenes
          this.navegarAListaExamenes();
        },
        error: (error) => {
          console.error('Error al finalizar el examen:', error);
          this.manejarErrorFinalizacion(datosFinalizacion, error);
        }
      });
  }

  private manejarErrorFinalizacion(datos: any, error: any): void {
    this.cargando = false;

    // Intentar guardar localmente en caso de error
    try {
      const respuestaLocal = this.rendicionService.guardarExamenLocalStorage(datos);

      if (respuestaLocal && respuestaLocal.guardadoLocal) {
        this.notificationService.mostrarAdvertencia(
          'No se pudo enviar el examen al servidor. ' +
          'Se ha guardado localmente y se enviará automáticamente cuando se restablezca la conexión.'
        );

        // Limpiar recursos
        this.limpiarRecursos();

        // Navegar de vuelta a la lista de exámenes
        this.navegarAListaExamenes();
      } else {
        this.notificationService.mostrarError(
          'Error al finalizar el examen. Por favor, intente nuevamente.'
        );
      }
    } catch (e) {
      console.error('Error crítico al guardar localmente:', e);
      this.notificationService.mostrarError(
        'Error crítico al finalizar el examen. Por favor, contacte al soporte técnico.'
      );
    }
  }

  private limpiarRecursos(): void {
    if (this.examen) {
      try {
        this.recoveryService.cleanupBackups(this.examen.id);
      } catch (error) {
        console.error('Error al limpiar backups:', error);
      }
    }

    // Forzar recarga de la lista de exámenes para reflejar el cambio de estado
    try {
      const examenesState = this.injector.get(ExamenesStateService);
      examenesState.loadExamenes();
    } catch (error) {
      console.error('Error al recargar lista de exámenes:', error);
    }
  }

  private navegarAListaExamenes(): void {
    // Esperar un momento para que Angular complete el ciclo actual
    setTimeout(() => {
      this.router.navigate(['/dashboard/examenes']);
    }, 500);
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
      // Intentar obtener el ID del usuario desde el servicio de autenticación
      const userId = this.injector.get(AuthService).getCurrentUserId();

      if (userId) {
        console.log('ID de usuario obtenido del servicio de autenticación:', userId);
        return userId;
      }

      // Si no se pudo obtener del servicio, intentar obtenerlo del localStorage
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData && userData.id) {
          console.log('ID de usuario obtenido de localStorage:', userData.id);
          return userData.id;
        }
      }

      // Si no se pudo obtener de ninguna fuente, usar un valor por defecto
      console.warn('No se pudo obtener el ID del usuario, usando valor por defecto');
      return 'anonymous-user';
    } catch (error) {
      console.error('Error al obtener el ID del usuario:', error);
      return 'error-user-id';
    }
  }
}
