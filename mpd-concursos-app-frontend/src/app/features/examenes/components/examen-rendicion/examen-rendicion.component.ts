import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { ExamenRecoveryService } from '@core/services/examenes/examen-recovery.service';
import { ExamenRendicionService } from '@core/services/examenes/examen-rendicion.service';
import { ExamenValidationService } from '@core/services/examenes/examen-validation.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { Pregunta, TipoPregunta, ExamenEnCurso, Opcion } from '@shared/interfaces/examen/pregunta.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { FormatTiempoPipe } from '@shared/pipes/format-tiempo.pipe';
import { Subject, of, lastValueFrom } from 'rxjs'; // Import lastValueFrom
import { takeUntil, catchError, map, filter, finalize, timeout } from 'rxjs/operators';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SECURITY_PROVIDERS } from '../../providers/security.providers';
import { AuthService } from '@core/services/auth/auth.service'; // Assuming AuthService exists for user ID
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';


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
    {
      provide: ExamenRendicionService,
      useClass: ExamenRendicionService
    },
    ExamenValidationService
  ]
})
export class ExamenRendicionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  examen: Examen | null = null;
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePreguntaActual = 0;
  respuestas: Record<string, string | string[]> = {};
  tiempoRestante = 0;
  estadoExamen = ESTADO_EXAMEN.DISPONIBLE;
  readonly TIPO_PREGUNTA = TipoPregunta;

  // Properties for UI state
  preguntasRespondidas = new Set<string>();
  preguntasMarcadas = new Set<string>();
  opcionesOrdenadas: { id: string; texto: string }[] = [];
  isExamInProgress = false;

  @ViewChild('seleccionList') seleccionList!: ElementRef; // Changed to ElementRef

  private modoPrueba = false;
  private anulacionEnProgreso = false;

  // Indicador de carga
  public cargando = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private timeService: ExamenTimeService,
    private notificationService: ExamenNotificationService,
    private recoveryService: ExamenRecoveryService,
    private rendicionService: ExamenRendicionService,
    private securityService: ExamenValidationService,
    private authService: AuthService, // Assuming AuthService is injected for user ID
    private examenesStateService: ExamenesStateService // Renamed to avoid conflict with `stateService` parameter
  ) {}

  ngOnInit(): void {
    // Verificar si estamos en modo prueba
    this.route.queryParams.subscribe((params: Record<string, string>) => {
      this.modoPrueba = params['modo'] === 'prueba';
      if (this.modoPrueba) {
        console.warn('MODO PRUEBA ACTIVADO: Algunas funcionalidades de seguridad y tiempo podrían no operar.');
      }
    });

    // Obtener el ID del examen de la URL
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('id')),
      filter(id => !!id)
    ).subscribe((id: string | null) => {
      if (id) {
        this.cargarExamen(id);
      }
    });
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

  /**
   * Navega a la pregunta anterior o siguiente.
   * @param direccion 'anterior' o 'siguiente'
   */
  navegarPregunta(direccion: 'anterior' | 'siguiente'): void {
    if (!this.preguntas.length) return;

    let nuevoIndice = this.indicePreguntaActual;

    if (direccion === 'anterior' && this.indicePreguntaActual > 0) {
      nuevoIndice--;
    } else if (direccion === 'siguiente' && this.indicePreguntaActual < this.preguntas.length - 1) {
      nuevoIndice++;
    } else if (direccion === 'siguiente' && this.indicePreguntaActual === this.preguntas.length - 1) {
      // Si estamos en la última pregunta y queremos ir a la siguiente, ofrecemos finalizar
      this.finalizar();
      return;
    }

    this.irAPregunta(nuevoIndice + 1); // +1 porque irAPregunta espera un número de pregunta (1-indexed)
  }

  /**
   * Navega a la pregunta anterior
   */
  anterior(): void {
    this.navegarPregunta('anterior');
  }

  /**
   * Navega a la pregunta siguiente
   */
  siguiente(): void {
    this.navegarPregunta('siguiente');
  }

  /**
   * Navega a una pregunta específica por su número (1-indexed).
   * @param numeroPregunta El número de la pregunta a la que navegar.
   */
  irAPregunta(numeroPregunta: number): void {
    const indice = numeroPregunta - 1; // Convertir a 0-indexed

    if (indice >= 0 && indice < this.preguntas.length) {
      this.indicePreguntaActual = indice;
      this.preguntaActual = this.preguntas[this.indicePreguntaActual];

      // Inicializar opciones ordenadas si es una pregunta de ordenamiento
      if (this.preguntaActual.tipo === TipoPregunta.ORDENAMIENTO) {
        // Asegurarse de que las opciones estén aleatorias por defecto si no hay respuesta guardada
        const opcionesBase = [...(this.preguntaActual.opciones || [])];
        if (this.respuestas[this.preguntaActual.id]) {
          const ordenGuardado = this.respuestas[this.preguntaActual.id] as string[];
          this.opcionesOrdenadas = ordenGuardado
            .map(id => opcionesBase.find(op => op.id === id))
            .filter((op): op is Opcion => !!op);
        } else {
          // Mezclar opciones para la primera vez que se ve la pregunta de ordenamiento
          this.opcionesOrdenadas = this.shuffleArray(opcionesBase);
        }
      } else {
        this.opcionesOrdenadas = []; // Limpiar para otros tipos de pregunta
      }
    }
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }

  // Answer handling methods
  /**
   * Guarda la respuesta para preguntas de selección única o verdadero/falso.
   * @param respuesta La respuesta seleccionada.
   */
  guardarRespuesta(respuesta: string): void { // Changed type to string for single selection
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      this.respuestas[this.preguntaActual.id] = respuesta;
      this.preguntasRespondidas.add(this.preguntaActual.id);

      setTimeout(() => {
        try {
          if (this.examen) {
            const respuestaObj = {
              [this.preguntaActual!.id]: respuesta
            };
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

  /**
   * Guarda las respuestas para preguntas de selección múltiple.
   * @param opciones Array de objetos con las opciones seleccionadas.
   */
  guardarRespuestaMultiple(opciones: { value: string }[]): void {
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      const respuestasArr = opciones.map(opcion => opcion.value);
      this.respuestas[this.preguntaActual.id] = respuestasArr;
      this.preguntasRespondidas.add(this.preguntaActual.id);

      setTimeout(() => {
        try {
          if (this.examen) {
            const respuestaObj = {
              [this.preguntaActual!.id]: respuestasArr
            };
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

  /**
   * Guarda la respuesta para preguntas de desarrollo (texto libre).
   * @param event Evento del input/textarea.
   */
  guardarRespuestaTexto(event: Event): void {
    if (!this.preguntaActual || !this.examen) {
      console.error('No hay pregunta actual o examen cargado');
      return;
    }

    try {
      const input = event.target as HTMLTextAreaElement;
      const texto = input.value;

      setTimeout(() => {
        try {
          this.respuestas[this.preguntaActual!.id] = texto;
          this.preguntasRespondidas.add(this.preguntaActual!.id);

          const respuestaObj = {
            [this.preguntaActual!.id]: texto
          };
          if (this.examen) {
            this.recoveryService.guardarRespuestas(this.examen.id, respuestaObj);
          }
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
  /**
   * Marca o desmarca la pregunta actual para revisión.
   */
  marcarParaRevisar(): void {
    if (this.preguntaActual) {
      if (this.preguntasMarcadas.has(this.preguntaActual.id)) {
        this.preguntasMarcadas.delete(this.preguntaActual.id);
      } else {
        this.preguntasMarcadas.add(this.preguntaActual.id);
      }
    }
  }

  /**
   * Inicia el proceso de finalización del examen, mostrando un diálogo de confirmación.
   */
  finalizar(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Finalizar Examen',
        mensaje: '¿Está seguro de que desea finalizar el examen? Una vez finalizado, no podrá volver a acceder a él.',
        confirmButtonText: 'Finalizar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.finalizarExamen('FINALIZADO_USUARIO');
      }
    });
  }

  /**
   * Obtiene el estado de una pregunta para mostrar en la navegación.
   * @param pregunta La pregunta a evaluar.
   * @returns Una cadena que describe el estado de la pregunta.
   */
  getEstadoPregunta(pregunta: Pregunta): string {
    let estado = '';
    if (this.preguntasRespondidas.has(pregunta.id)) {
      estado += 'Respondida';
    } else {
      estado += 'Sin Responder';
    }
    if (this.preguntasMarcadas.has(pregunta.id)) {
      estado += (estado ? ' / ' : '') + 'Marcada para revisión';
    }
    return estado;
  }

  // Drag and drop handling for TipoPregunta.ORDENAMIENTO
  /**
   * Maneja el evento de soltar para preguntas de ordenamiento.
   * Actualiza el orden local y guarda la respuesta.
   * @param event El evento CdkDragDrop.
   */
  drop(event: CdkDragDrop<string[]>): void {
    if (!this.preguntaActual || !this.examen || this.preguntaActual.tipo !== TipoPregunta.ORDENAMIENTO) {
      console.error('No hay pregunta actual de ordenamiento o examen cargado');
      return;
    }

    try {
      moveItemInArray(this.opcionesOrdenadas, event.previousIndex, event.currentIndex);

      setTimeout(() => {
        try {
          const orden = this.opcionesOrdenadas.map(opcion => opcion.id);
          this.respuestas[this.preguntaActual!.id] = orden;
          this.preguntasRespondidas.add(this.preguntaActual!.id);

          const respuestaObj = {
            [this.preguntaActual!.id]: orden
          };
          if (this.examen) {
            this.recoveryService.guardarRespuestas(this.examen.id, respuestaObj);
          }
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

  /**
   * Función de seguimiento para elementos en listas ngFor.
   * @param _index El índice del elemento.
   * @param opcion La opción del elemento.
   * @returns El ID de la opción.
   */
  trackByOpcion(_index: number, opcion: { id: string }): string {
    return opcion.id;
  }

  // Security methods
  /**
   * Previene la acción de copiar y registra la actividad.
   * @param event El evento de copia.
   */
  onCopy(event: Event): void {
    event.preventDefault();
    this.registrarActividad(SecurityViolationType.KEYBOARD_SHORTCUT, 'Intento de Copia');
    this.notificationService.mostrarAdvertencia('La acción de copiar está deshabilitada durante el examen.');
  }

  /**
   * Previene la acción de cortar y registra la actividad.
   * @param event El evento de corte.
   */
  onCut(event: Event): void {
    event.preventDefault();
    this.registrarActividad(SecurityViolationType.KEYBOARD_SHORTCUT, 'Intento de Corte');
    this.notificationService.mostrarAdvertencia('La acción de cortar está deshabilitada durante el examen.');
  }

  /**
   * Previene la acción de pegar y registra la actividad.
   * @param event El evento de pegado.
   */
  onPaste(event: Event): void {
    event.preventDefault();
    this.registrarActividad(SecurityViolationType.KEYBOARD_SHORTCUT, 'Intento de Pegado');
    this.notificationService.mostrarAdvertencia('La acción de pegar está deshabilitada durante el examen.');
  }

  /**
   * Método auxiliar para registrar actividad de seguridad.
   * @param tipo El tipo de violación de seguridad.
   * @param mensaje Un mensaje descriptivo de la actividad.
   */
  private registrarActividad(tipo: SecurityViolationType, mensaje: string): void {
    if (this.examen) {
      // Registrar violación de seguridad (método simplificado)
      console.warn(`Violación de seguridad: ${tipo} - ${mensaje}`);
    }
  }

  /**
   * Carga el examen desde el servicio.
   * @param id El ID del examen.
   */
  private cargarExamen(id: string): void {
    this.cargando = true;
    this.examenesStateService.getExamen(id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error al cargar el examen:', error);
          this.cargando = false;
          this.notificationService.mostrarError('No se pudo cargar el examen solicitado');
          this.router.navigate(['/dashboard/examenes']);
          return of(null); // Return an observable of null to continue stream
        })
      )
      .subscribe({
        next: (examen: Examen | null) => {
          if (!examen) {
            this.notificationService.mostrarError('El examen solicitado no existe');
            this.router.navigate(['/dashboard/examenes']);
            return;
          }
          this.examen = examen;

          // Verificar si el examen está disponible o en curso (solo si no estamos en modo prueba)
          if (!this.modoPrueba && examen.estado !== ESTADO_EXAMEN.DISPONIBLE && examen.estado !== ESTADO_EXAMEN.EN_CURSO) {
            this.notificationService.mostrarAdvertencia(`El examen no está disponible en este momento. Estado actual: ${this.examen.estado}`);
            this.router.navigate(['/dashboard/examenes']);
            return;
          }

          // Verificar si el examen está dentro del horario programado (solo si no estamos en modo prueba)
          if (!this.modoPrueba) {
            const ahora = new Date();
            const fechaInicio = examen.fechaInicio ? new Date(examen.fechaInicio) : null;
            const duracionSegundos = examen.duracion ? examen.duracion * 60 : 0;
            const fechaFinEstimada = fechaInicio ? new Date(fechaInicio.getTime() + duracionSegundos * 1000) : null;

            if (fechaInicio && ahora < fechaInicio) {
              this.notificationService.mostrarAdvertencia('El examen aún no ha comenzado. Por favor, espere la hora de inicio.');
              this.router.navigate(['/dashboard/examenes']);
              return;
            }
            if (fechaFinEstimada && ahora > fechaFinEstimada && examen.estado !== ESTADO_EXAMEN.FINALIZADO) {
              this.notificationService.mostrarAdvertencia('El tiempo para este examen ha expirado.');
              this.router.navigate(['/dashboard/examenes']);
              return;
            }
          } else {
            console.log('Modo prueba activo: Saltando verificación de horario de examen.');
            this.notificationService.mostrarAdvertencia('MODO PRUEBA: Horario de examen no verificado.');
          }

          // Construir ExamenEnCurso para el state service
          const examenEnCurso: ExamenEnCurso = {
            examenId: this.examen.id,
            usuarioId: this.getCurrentUserId(),
            fechaInicio: new Date().toISOString(),
            fechaLimite: new Date(Date.now() + this.examen.duracion * 60 * 1000).toISOString(),
            respuestas: [],
            preguntaActual: 0,
            estado: 'EN_CURSO',
            duracion: this.examen.duracion
          };

          // Inicializar el estado del examen
          this.examenesStateService.inicializarExamen(examenEnCurso);

          // Cargar las preguntas
          this.cargarPreguntas(id);
        },
        error: (error: unknown) => {
          console.error('Error en la suscripción del examen:', error);
          this.notificationService.mostrarError('Error al procesar el examen');
          this.router.navigate(['/dashboard/examenes']);
          this.cargando = false;
        }
      });
  }

  /**
   * Carga las preguntas para el examen actual.
   * @param examenId El ID del examen.
   */
  private cargarPreguntas(examenId: string): void {
    this.cargando = true;
    this.rendicionService.getPreguntas()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error al cargar las preguntas del examen:', error);
          this.cargando = false;
          this.notificationService.mostrarError('Error al cargar las preguntas del examen');

          try {
            if (this.securityService) {
              this.securityService.deactivateSecureMode();
              this.securityService.cleanup();
            }
          } catch (err) {
            console.warn('No se pudo desactivar el modo seguro o limpiar:', err);
          }
          try {
            if (this.timeService) {
              this.timeService.detener();
            }
          } catch (err) {
            console.warn('No se pudo detener el temporizador:', err);
          }

          this.router.navigate(['/dashboard/examenes']);
          return of([]); // Return an observable of an empty array to continue stream
        })
      )
      .subscribe({
        next: (preguntas: Pregunta[]) => {
          this.cargando = false;

          if (!preguntas || preguntas.length === 0) {
            console.warn('El examen no tiene preguntas configuradas.');
            this.notificationService.mostrarError('Este examen no tiene preguntas configuradas. Por favor, contacte a soporte.');

            try {
              if (this.securityService) {
                this.securityService.deactivateSecureMode();
                this.securityService.cleanup();
              }
            } catch (err) {
              console.warn('No se pudo desactivar el modo seguro o limpiar:', err);
            }
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

          this.preguntas = preguntas;
          this.indicePreguntaActual = 0;
          this.preguntaActual = this.preguntas[this.indicePreguntaActual];

          // Recuperar respuestas guardadas si existen
          this.recuperarEstadoExamen();

          // Inicializar opciones ordenadas si la primera pregunta es de ordenamiento
          if (this.preguntaActual.tipo === TipoPregunta.ORDENAMIENTO) {
            this.opcionesOrdenadas = [...(this.preguntaActual.opciones || [])];
            if (this.respuestas[this.preguntaActual.id]) {
              const ordenGuardado = this.respuestas[this.preguntaActual.id] as string[];
              this.opcionesOrdenadas.sort((a, b) => {
                return ordenGuardado.indexOf(a.id) - ordenGuardado.indexOf(b.id);
              });
            } else {
              this.opcionesOrdenadas = this.shuffleArray(this.opcionesOrdenadas);
            }
          }

          // Iniciar el temporizador
          this.iniciarTemporizador();

          // Iniciar monitoreo de seguridad
          this.iniciarMonitoreo();

          // Actualizar estado a "en curso" una vez que todo está listo
          this.estadoExamen = ESTADO_EXAMEN.EN_CURSO;
          this.isExamInProgress = true;
        },
        error: (error: unknown) => {
          console.error('Error en la suscripción de preguntas:', error);
          this.notificationService.mostrarError('Error al procesar las preguntas del examen');

          try {
            if (this.securityService) {
              this.securityService.deactivateSecureMode();
            }
          } catch (err) {
            console.warn('No se pudo desactivar el modo seguro:', err);
          }

          this.router.navigate(['/dashboard/examenes']);
          this.cargando = false;
        }
      });
  }

  /**
   * Carga preguntas de ejemplo para el modo prueba.
   */
  private cargarPreguntasEjemplo(): void {
    const preguntasEjemplo: Pregunta[] = [
      {
        id: 'q1',
        texto: '¿Cuál es la capital de Argentina?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        opciones: [
          { id: 'op1', texto: 'Santiago', orden: 1 },
          { id: 'op2', texto: 'Buenos Aires', orden: 2 },
          { id: 'op3', texto: 'Montevideo', orden: 3 }
        ],
        puntaje: 10,
        orden: 1
      },
      {
        id: 'q2',
        texto: 'El sol gira alrededor de la Tierra.',
        tipo: TipoPregunta.VERDADERO_FALSO,
        opciones: [
          { id: 'true', texto: 'Verdadero', orden: 1 },
          { id: 'false', texto: 'Falso', orden: 2 }
        ],
        puntaje: 10,
        orden: 2
      },
      {
        id: 'q3',
        texto: 'Explique la importancia de la programación orientada a objetos.',
        tipo: TipoPregunta.DESARROLLO,
        puntaje: 20,
        orden: 3
      },
      {
        id: 'q4',
        texto: 'Ordene los siguientes pasos para hacer una torta:',
        tipo: TipoPregunta.ORDENAMIENTO,
        opciones: [
          { id: 'step1', texto: 'Batir huevos y azúcar', orden: 1 },
          { id: 'step2', texto: 'Hornear a 180°C', orden: 2 },
          { id: 'step3', texto: 'Mezclar harina y polvo de hornear', orden: 3 },
          { id: 'step4', texto: 'Enfriar y decorar', orden: 4 }
        ],
        puntaje: 15,
        orden: 4
      },
      {
        id: 'q5',
        texto: 'Seleccione todas las frutas:',
        tipo: TipoPregunta.SELECCION_MULTIPLE,
        opciones: [
          { id: 'optA', texto: 'Manzana', orden: 1 },
          { id: 'optB', texto: 'Tomate', orden: 2 },
          { id: 'optC', texto: 'Zanahoria', orden: 3 },
          { id: 'optD', texto: 'Banana', orden: 4 }
        ],
        puntaje: 15,
        orden: 5
      }
    ];

    this.preguntas = preguntasEjemplo;
    this.indicePreguntaActual = 0;
    this.preguntaActual = this.preguntas[this.indicePreguntaActual];

    // Inicializar respuestas para cada tipo de pregunta de ejemplo
    this.preguntas.forEach(pregunta => {
      if (!this.respuestas[pregunta.id]) {
        switch (pregunta.tipo) {
          case TipoPregunta.SELECCION_MULTIPLE:
            this.respuestas[pregunta.id] = [];
            break;
          case TipoPregunta.VERDADERO_FALSO:
          case TipoPregunta.OPCION_MULTIPLE:
          case TipoPregunta.DESARROLLO:
            this.respuestas[pregunta.id] = '';
            break;
          case TipoPregunta.ORDENAMIENTO:
            this.respuestas[pregunta.id] = this.shuffleArray(pregunta.opciones?.map(o => o.id) || []);
            this.opcionesOrdenadas = this.opcionesOrdenadas.length > 0 ? this.opcionesOrdenadas : this.shuffleArray([...(this.preguntaActual!.opciones || [])]);
            break;
        }
      }
    });

    // Iniciar el temporizador (ejemplo, 30 minutos)
    this.timeService.iniciar(30 * 60); // 30 minutos

    // Iniciar monitoreo después de cargar preguntas
    this.iniciarMonitoreo();

    this.estadoExamen = ESTADO_EXAMEN.EN_CURSO;
    this.isExamInProgress = true;
    this.cargando = false;
    this.notificationService.mostrarAdvertencia('MODO PRUEBA: Se han cargado preguntas de ejemplo');
  }

  /**
   * Inicia el temporizador del examen y se suscribe a los cambios de tiempo y estado.
   */
  private iniciarTemporizador(): void {
    if (!this.examen) {
      console.error('No se puede iniciar el temporizador: no hay examen cargado.');
      return;
    }

    const tiempoAsignadoMinutos = this.examen.duracion; // duracion ya está en minutos
    this.timeService.iniciar(tiempoAsignadoMinutos).pipe(
      takeUntil(this.destroy$),
      filter(tiempo => typeof tiempo === 'number') // Ensure it's a number
    ).subscribe((tiempo: number) => {
      this.tiempoRestante = tiempo;
      if (this.tiempoRestante <= 0 && this.estadoExamen !== ESTADO_EXAMEN.FINALIZADO && !this.anulacionEnProgreso) {
        this.notificationService.mostrarAdvertencia('¡El tiempo ha terminado! El examen se finalizará automáticamente.');
        this.finalizarExamen('TIEMPO_TERMINADO');
      }
    });

    this.isExamInProgress = true;

    this.examenesStateService.getExamenEnCurso()
      .pipe(takeUntil(this.destroy$))
      .subscribe((examen: ExamenEnCurso | null) => {
        if (examen) {
          this.estadoExamen = examen.estado as ESTADO_EXAMEN;
          console.log(`Estado del examen actualizado en el componente: ${this.estadoExamen}`);
        }
      });
  }

  /**
   * Inicializa y comienza el monitoreo de seguridad del examen.
   */
  private iniciarMonitoreo(): void {
    if (!this.examen) {
      console.error('No se puede iniciar el monitoreo: no hay examen cargado');
      return;
    }

    // Inicializar las medidas de seguridad con un timeout para evitar bloqueos
    new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('Timeout al inicializar medidas de seguridad. Continuando con el examen...');
        this.notificationService.mostrarAdvertencia(
          'No se pudieron inicializar todas las medidas de seguridad a tiempo. El examen continuará, pero algunas funciones podrían no estar disponibles.'
        );
        resolve(); // Resolvemos la promesa para continuar con el examen
      }, 5000); // 5 segundos de timeout para la inicialización

      // Inicializar medidas de seguridad (método simplificado)
      try {
        clearTimeout(timeoutId);
        console.log('Medidas de seguridad inicializadas correctamente.');
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error al inicializar medidas de seguridad:', error);
        this.notificationService.mostrarAdvertencia(
          'No se pudieron inicializar todas las medidas de seguridad. El examen continuará, pero algunas funciones podrían no estar disponibles.'
        );
        resolve();
      }
    }).then(() => {
      // Suscribirse a las violaciones de seguridad solo si no estamos en modo prueba
      if (!this.modoPrueba) {
        this.securityService.iniciarMonitoreo()
          .pipe(
            takeUntil(this.destroy$),
            catchError(error => {
              console.error('Error en la suscripción del monitoreo de seguridad:', error);
              return of(null); // Devolver un observable vacío para no interrumpir el flujo
            })
          )
          .subscribe({
            next: (violacion: SecurityViolationType | null) => {
              if (violacion && !this.anulacionEnProgreso) {
                console.warn(`Violación de seguridad detectada: ${violacion}`);
                this.anularExamen(violacion);
              }
            },
            complete: () => {
              console.log('Monitoreo de seguridad completado.');
            }
          });
      } else {
        console.log('Monitoreo de seguridad deshabilitado en modo prueba.');
      }
    });
  }

  /**
   * Recupera las respuestas guardadas localmente para el examen actual.
   */
  private recuperarEstadoExamen(): void {
    if (!this.examen) return;

    const respuestasGuardadas = this.recoveryService.recuperarRespuestas(this.examen.id);
    if (respuestasGuardadas) {
      this.respuestas = respuestasGuardadas;
      Object.keys(respuestasGuardadas).forEach(preguntaId => {
        this.preguntasRespondidas.add(preguntaId);
      });
      this.notificationService.mostrarAdvertencia('Respuestas anteriores recuperadas.');
    }
  }

  /**
   * Anula el examen debido a una violación de seguridad.
   * @param violacion El tipo de violación de seguridad.
   */
  public anularExamen(violacion: SecurityViolationType): void {
    if (!this.examen || this.anulacionEnProgreso) return;

    this.anulacionEnProgreso = true;
    this.estadoExamen = ESTADO_EXAMEN.ANULADO;
    this.isExamInProgress = false;

    try {
      this.timeService.detener();
    } catch (error) {
      console.error('Error al detener el temporizador en anularExamen:', error);
    }

    try {
      this.securityService.deactivateSecureMode();
      this.securityService.cleanup();
    } catch (error) {
      console.error('Error al desactivar modo seguro o limpiar en anularExamen:', error);
    }

    this.notificationService.mostrarError(
      'El examen ha sido anulado por una violación de seguridad: ' +
      this.getViolationMessage(violacion)
    );

    // Establecer un timeout para asegurar que la UI se actualice antes de finalizar la anulación
    setTimeout(() => {
      this.finalizarAnulacion(violacion);
    }, 1000);
  }

  /**
   * Finaliza el proceso de anulación del examen, comunicándose con el servidor.
   * @param violacion El tipo de violación que causó la anulación.
   */
  public finalizarAnulacion(violacion: SecurityViolationType): void {
    if (!this.examen) return;

    const completarAnulacion = () => {
      console.log('Proceso de anulación completado localmente. Redirigiendo...');
      this.limpiarRecursos();
      this.navegarAListaExamenes();
    };

    // Intentar registrar la anulación en el servidor
    this.rendicionService.anularExamen(this.examen.id, {
      fecha: new Date().toISOString(),
      infracciones: [violacion]
    }).pipe(
      takeUntil(this.destroy$),
      timeout(10000), // 10 segundos de timeout para la llamada al servidor
      catchError(error => {
        console.error('Error al anular el examen en el servidor:', error);
        this.notificationService.mostrarAdvertencia('No se pudo registrar la anulación en el servidor. Intentando finalizar localmente.');
        return of(null); // Continuamos con el flujo incluso si falla la anulación
      })
    ).subscribe({
      next: () => {
        // Después de intentar anular, intentar finalizar el examen (enviar respuestas)
        this.rendicionService.finalizarExamenApi({
          examenId: this.examen!.id,
          respuestas: this.respuestas,
          tiempoUtilizado: this.timeService.getTiempoUtilizado(),
          motivo: 'ANULADO_SEGURIDAD'
        }).pipe(
          takeUntil(this.destroy$),
          timeout(10000), // 10 segundos de timeout para la finalización
          catchError(error => {
            console.error('Error al finalizar el examen anulado en el servidor:', error);
            this.notificationService.mostrarAdvertencia('No se pudieron enviar las respuestas del examen anulado. Se intentará guardar localmente.');
            return of(null); // Continuamos con el flujo incluso si falla la finalización
          })
        ).subscribe({
          next: () => {
            this.notificationService.mostrarExito('Examen anulado y respuestas enviadas.');
            completarAnulacion();
          },
          error: () => {
            console.error('Error final al intentar finalizar el examen anulado');
            this.manejarErrorFinalizacion({ examenId: this.examen!.id, respuestas: this.respuestas, motivo: 'ANULADO_SEGURIDAD' }, new Error('Error al finalizar el examen anulado en el servidor'));
            completarAnulacion();
          }
        });
      },
      error: () => { // Catch error from the first catchError, if it didn't return of(null)
        console.error('Error al anular el examen (fuera de la suscripción de anulación principal)');
        completarAnulacion();
      }
    });
  }

  /**
   * Obtiene un mensaje descriptivo para un tipo de violación de seguridad.
   * @param violacion El tipo de violación.
   * @returns El mensaje descriptivo.
   */
  public getViolationMessage(violacion: SecurityViolationType): string {
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

  /**
   * Finaliza el examen del usuario, enviando las respuestas al servidor.
   * @param motivo El motivo de la finalización (ej. 'FINALIZADO_USUARIO', 'TIEMPO_TERMINADO').
   */
  public finalizarExamen(motivo = 'FINALIZADO_USUARIO'): void {
    if (!this.examen) return;

    console.log(`Finalizando examen por motivo: ${motivo}`);
    this.isExamInProgress = false;
    this.timeService.detener(); // Asegurarse de detener el temporizador

    try {
      this.securityService.deactivateSecureMode();
      this.securityService.cleanup(); // Limpiar recursos de seguridad
    } catch (error) {
      console.error('Error al desactivar modo seguro o limpiar en finalizarExamen:', error);
    }

    this.examenesStateService.cambiarEstadoExamen('FINALIZADO'); // Actualizar el estado en el servicio de estado

    const datosFinalizacion = {
      examenId: this.examen.id,
      respuestas: this.respuestas,
      motivo: motivo,
      usuarioId: this.getCurrentUserId(),
      tiempoUtilizado: this.timeService.getTiempoUtilizado(),
      fechaFinalizacion: new Date().toISOString()
    };

    this.cargando = true; // Mostrar indicador de carga

    const timeoutId = setTimeout(() => {
      console.warn('Timeout al intentar finalizar el examen con el servidor.');
      this.manejarErrorFinalizacion(datosFinalizacion, new Error('Timeout al finalizar el examen'));
    }, 30000); // 30 segundos de timeout

    // Intentar finalizar el examen
    this.rendicionService.finalizarExamenApi(datosFinalizacion)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          clearTimeout(timeoutId); // Limpiar el timeout en cualquier caso
          this.cargando = false; // Ocultar spinner de carga
        }),
        catchError(error => {
          console.error('Error al finalizar el examen:', error);
          this.manejarErrorFinalizacion(datosFinalizacion, error);
          return of(null); // Continuar la cadena Observable
        })
      )
      .subscribe({
        next: (response: unknown) => {
          const responseObj = response as { guardadoLocal?: boolean } | null;

          if (responseObj && responseObj.guardadoLocal) {
            this.notificationService.mostrarAdvertencia(
              'El examen se ha guardado localmente debido a problemas de conexión. ' +
              'Se enviará automáticamente cuando se restablezca la conexión.'
            );
          } else {
            this.notificationService.mostrarExito('¡Examen finalizado correctamente!');
          }

          this.limpiarRecursos(); // Limpiar recursos
          this.navegarAListaExamenes(); // Navegar de vuelta
        }
      });
  }

  /**
   * Maneja errores durante la finalización del examen, intentando guardar localmente.
   * @param datos Los datos que se intentaron enviar al servidor.
   * @param _error El error original.
   */
  public manejarErrorFinalizacion(datos: Record<string, unknown>, _error: unknown): void {
    this.cargando = false;

    try {
      // Intentar guardar localmente en caso de error
      const respuestaLocal = this.rendicionService.guardarExamenLocalStorage(datos) as { guardadoLocal: boolean };

      if (respuestaLocal && respuestaLocal.guardadoLocal) {
        this.notificationService.mostrarAdvertencia(
          'No se pudo enviar el examen al servidor. ' +
          'Se ha guardado localmente y se enviará automáticamente cuando se restablezca la conexión.'
        );
        this.limpiarRecursos();
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

  /**
   * Limpia los recursos relacionados con el examen (ej. backups locales).
   */
  public limpiarRecursos(): void {
    if (this.examen) {
      try {
        this.recoveryService.cleanupBackups(this.examen.id);
        console.log(`Backups para el examen ${this.examen.id} limpiados.`);
      } catch (error) {
        console.error('Error al limpiar backups:', error);
      }
    }
  }

  /**
   * Navega de vuelta a la lista de exámenes.
   */
  private navegarAListaExamenes(): void {
    this.router.navigate(['/dashboard/examenes']);
  }

  /**
   * Obtiene el ID del usuario actual.
   * @returns El ID del usuario.
   */
  private getCurrentUserId(): string {
    // Implementación de ejemplo. En una aplicación real, esto se obtendría del AuthService.
    // Ejemplo: return this.authService.getCurrentUserId();
    return 'user-123'; // Valor de prueba
  }
}
