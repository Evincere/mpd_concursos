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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import { FullscreenStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';
import { KeyboardSecurityStrategy } from '@core/services/examenes/security/strategies/keyboard.strategy';
import { TabSwitchSecurityStrategy } from '@core/services/examenes/security/strategies/tab-switch.strategy';

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
    const examenId = this.route.snapshot.paramMap.get('id');
    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    this.cargarExamen(examenId);
    this.iniciarMonitoreo();
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
      this.guardarRespuesta(respuestas);
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
    this.examenesService.getExamen(id).subscribe({
      next: (examen) => {
        if (examen.estado === ESTADO_EXAMEN.ANULADO) {
          this.notificationService.mostrarError('Este examen ha sido anulado y no puede ser rendido');
          this.router.navigate(['/dashboard/examenes']);
          return;
        }
        this.examen = examen;
        this.cargarPreguntas(id);
        this.iniciarExamen();
      },
      error: (error) => {
        console.error('Error al cargar el examen:', error);
        this.notificationService.mostrarError('No se pudo cargar el examen');
        this.router.navigate(['/dashboard/examenes']);
      }
    });
  }

  private cargarPreguntas(examenId: string): void {
    this.examenesService.getPreguntas(examenId).subscribe({
      next: (preguntas) => {
        this.preguntas = preguntas;
        this.preguntaActual = preguntas[0];
        this.recuperarRespuestas();
      },
      error: (error) => {
        console.error('Error al cargar las preguntas:', error);
        this.notificationService.mostrarError('No se pudieron cargar las preguntas');
      }
    });
  }

  private iniciarExamen(): void {
    if (!this.examen) return;

    // Inicializar el estado del examen
    this.stateService.initializeState({
      examenId: this.examen.id,
      estado: 'EN_CURSO',
      fechaInicio: new Date().toISOString(),
      fechaLimite: this.calcularFechaLimite(),
      preguntaActual: 0,
      respuestas: [],
      usuarioId: this.getCurrentUserId()
    });

    // Registrar inicio del examen
    this.activityLogger.registrarActividad('EXAMEN_INICIADO');

    // Iniciar el temporizador
    if (this.examen && this.examen.duracion) {
      console.log('Iniciando temporizador con duración:', this.examen.duracion, 'minutos');
      this.timeService.iniciar(this.examen.duracion).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (tiempo: number) => {
          this.tiempoRestante = tiempo;
        },
        error: (error) => {
          console.error('Error en el temporizador:', error);
        },
        complete: () => {
          console.log('Temporizador completado, finalizando examen automáticamente');
          this.finalizarExamen('FINALIZADO_TIEMPO');
        }
      });
    }
  }

  private iniciarMonitoreo(): void {
    this.securityService.iniciarMonitoreo().pipe(
      takeUntil(this.destroy$)
    ).subscribe((violacion: SecurityViolationType | null) => {
      if (violacion) {
        this.anularExamen(violacion);
      }
    });
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
    if (direccion === 'anterior' && this.indicePreguntaActual > 0) {
      this.indicePreguntaActual--;
    } else if (direccion === 'siguiente' && this.indicePreguntaActual < this.preguntas.length - 1) {
      this.indicePreguntaActual++;
    }
    this.preguntaActual = this.preguntas[this.indicePreguntaActual];
  }

  private anularExamen(violacion: SecurityViolationType): void {
    if (!this.examen) return;

    this.estadoExamen = ESTADO_EXAMEN.ANULADO;
    this.rendicionService.anularExamen(this.examen.id, {
      fecha: new Date().toISOString(),
      infracciones: [violacion]
    }).subscribe({
      next: () => {
        // Finalizar el examen con estado anulado
        this.rendicionService.finalizarExamenApi(this.examen!.id, {
          respuestas: this.respuestas,
          tiempoUtilizado: this.timeService.getTiempoUtilizado()
        }).subscribe({
          next: () => {
            this.notificationService.mostrarError('El examen ha sido anulado por una violación de seguridad');
            this.router.navigate(['/dashboard/examenes']);
          },
          error: (error) => {
            console.error('Error al finalizar el examen anulado:', error);
            this.notificationService.mostrarError('Error al finalizar el examen anulado');
          }
        });
      },
      error: (error) => {
        console.error('Error al anular el examen:', error);
        this.notificationService.mostrarError('Error al anular el examen');
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
