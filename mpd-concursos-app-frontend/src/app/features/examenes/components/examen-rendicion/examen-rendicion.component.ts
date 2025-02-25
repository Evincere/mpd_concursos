import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamenRendicionService } from '@core/services/examenes/examen-rendicion.service';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { OpcionRespuesta, RespuestaUsuario, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { Subject, firstValueFrom, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, take } from 'rxjs/operators';
import { MatListModule, MatListOption } from '@angular/material/list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import {
  ExamenActivityLoggerService,
  ExamenRecoveryService,
  ExamenSecurityService,
  ExamenNotificationService
} from '@core/services/examenes';
import { SECURITY_PROVIDERS } from '../../providers/security.providers';
import { ExamenValidationService } from '@core/services/examenes/examen-validation.service';
import { FormatTiempoPipe } from '@shared/pipes/format-tiempo.pipe';
import { ComponentWithExam } from '@core/services/examenes/security/guards/exam-navigation.guard';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';

@Component({
  selector: 'app-examen-rendicion',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatListModule,
    DragDropModule,
    FormatTiempoPipe
  ],
  templateUrl: './examen-rendicion.component.html',
  styleUrls: ['./examen-rendicion.component.scss'],
  providers: [
    SECURITY_PROVIDERS,
    ExamenRendicionService,
    ExamenSecurityService,
    ExamenActivityLoggerService,
    ExamenRecoveryService,
    ExamenNotificationService,
    ExamenValidationService
  ]
})
export class ExamenRendicionComponent implements OnInit, OnDestroy, ComponentWithExam {
  isExamInProgress: boolean = false;
  preguntaActual: PreguntaLocal | null = null;
  preguntas: PreguntaLocal[] = [];
  tiempoRestante: number = 0;
  private destroy$ = new Subject<void>();
  opcionesOrdenadas: OpcionRespuesta[] = [];
  private isInitialFullscreenActivation = true;
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;
  constructor(
    private examenService: ExamenRendicionService,
    private examenesService: ExamenesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private securityService: ExamenSecurityService,
    private activityLogger: ExamenActivityLoggerService,
    private notificationService: ExamenNotificationService,
    private recoveryService: ExamenRecoveryService,
    private sidebarService: SidebarService
  ) {}
  ngOnInit(): void {
    const examenId = this.route.snapshot.params['id'];
    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    // Configuramos los observables
    this.setupObservables();

    // Primero solicitamos permiso para pantalla completa
    this.notificationService.showConfirmDialog(
      'Iniciar Examen',
      'Para comenzar el examen, necesitamos activar el modo pantalla completa. ¿Desea continuar?'
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          // Solo después de la confirmación, activamos la pantalla completa
          await this.activarPantallaCompleta();
          // Y luego cargamos el examen
          this.cargarExamen(examenId);
        } catch (error) {
          console.error('Error al activar pantalla completa:', error);
          this.router.navigate(['/dashboard/examenes']);
        }
      } else {
        this.router.navigate(['/dashboard/examenes']);
      }
    });
  }
  private setupObservables(): void {
    this.examenService.getPreguntaActual()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pregunta => {
        if (pregunta) {
          this.preguntaActual = pregunta;

          if (pregunta.tipo === TipoPregunta.ORDENAMIENTO) {
            this.opcionesOrdenadas = pregunta.opciones ?
              pregunta.opciones.map(opcion => ({...opcion})) : [];
          }
          this.cdr.detectChanges();
        }
      });
  this.examenService.getTiempoRestante()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tiempo => this.tiempoRestante = tiempo);
  this.securityService.getSecurityViolations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(violations => {
        if (violations.length > 0) {
          const lastViolation = violations[violations.length - 1];
          this.handleSecurityViolation(lastViolation);
        }
      });
}
  private handleSecurityViolation(violation: SecurityViolation): void {
    this.notificationService.showSecurityWarning(violation.type);

    if (this.notificationService.isExamenAnulado()) {
      const examenId = this.route.snapshot.params['id'];

      this.examenService.getExamenEnCurso()
        .pipe(
          take(1),
          takeUntil(this.destroy$)
        )
        .subscribe(async examen => {
          if (examen) {
            // Guardamos el backup local
            await this.recoveryService.saveToLocalBackup(examenId, examen);

            const examenAnulado = {
              ...examen,
              estado: ESTADO_EXAMEN.ANULADO as 'ANULADO',
              motivoAnulacion: {
                fecha: new Date().toISOString(),
                infracciones: this.notificationService.getInfracciones()
              }
            };

            try {
              // Finalizamos el examen y esperamos a que se complete
              await firstValueFrom(this.examenService.finalizarExamen(examenAnulado));

              // Registramos la actividad
              this.activityLogger.logActivity({
                type: ActivityLogType.SYSTEM_EVENT,
                timestamp: Date.now(),
                details: {
                  event: 'EXAMEN_ANULADO',
                  examenId: examenId,
                  infracciones: this.notificationService.getInfracciones()
                }
              });

              // Mostramos el diálogo de anulación
              await this.notificationService.showConfirmDialog(
                'Examen Anulado',
                `El examen ha sido anulado debido a múltiples infracciones de seguridad.
                 \nInfracciones detectadas:\n${this.notificationService.getInfracciones()
                   .map(inf => `- ${this.notificationService.getSecurityMessage(inf)}`)
                   .join('\n')}`
              );

              // Redirigimos al listado de exámenes
              this.router.navigate(['/dashboard/examenes']);
            } catch (error) {
              console.error('Error al anular el examen:', error);
              // Mostramos un mensaje de error si algo falla
              this.notificationService.showSecurityWarning(
                SecurityViolationType.POST_INCIDENT_VALIDATION_FAILED,
                'Error al procesar la anulación del examen'
              );
            }
          }
        });
    } else if (violation.severity === 'HIGH') {
      const examenId = this.route.snapshot.params['id'];
      this.examenService.getExamenEnCurso()
        .pipe(takeUntil(this.destroy$))
        .subscribe(examen => {
          if (examen) {
            this.recoveryService.saveToLocalBackup(examenId, examen);
          }
        });
    }
  }
  ngOnDestroy(): void {
    this.securityService.cleanup();
    this.activityLogger.cleanup();
    this.destroy$.next();
    this.destroy$.complete();

    // Asegurarnos de salir del modo pantalla completa al destruir el componente
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }
  guardarRespuestaTexto(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.guardarRespuesta(target.value);
    }
  }
  guardarRespuesta(respuesta: string | string[]): void {
    if (!this.preguntaActual) return;
  const respuestaUsuario: RespuestaUsuario = {
      preguntaId: this.preguntaActual.id,
      respuesta,
      timestamp: new Date().toISOString()
    };
  this.examenService.guardarRespuesta(respuestaUsuario);
  this.activityLogger.logActivity({
      type: ActivityLogType.USER_INTERACTION,
      timestamp: Date.now(),
      details: {
        event: 'RESPUESTA_GUARDADA',
        preguntaId: respuestaUsuario.preguntaId
      }
    });
  }
  siguiente(): void {
    this.examenService.siguientePregunta();
  }
  anterior(): void {
    this.examenService.preguntaAnterior();
  }
  async finalizar(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('finalizar');
    if (confirmed) {
      this.isExamInProgress = false;
      this.examenService.finalizarExamen();
      this.router.navigate(['/dashboard/examenes']);
    }
  }
  formatTiempo(segundos: number): string {
    if (!segundos || isNaN(segundos)) {
      return '00:00:00';
    }
  const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
  const horasFormateadas = Math.min(horas, 99).toString().padStart(2, '0');
    const minutosFormateados = Math.min(minutos, 59).toString().padStart(2, '0');
    const segsFormateados = Math.min(segs, 59).toString().padStart(2, '0');
  return `${horasFormateadas}:${minutosFormateados}:${segsFormateados}`;
}
  guardarRespuestaMultiple(seleccionadas: MatListOption[]): void {
    if (!this.preguntaActual) return;
  const respuestas = seleccionadas.map(option => option.value);
    this.guardarRespuesta(respuestas);
  }
  trackByOpcion(index: number, opcion: OpcionRespuesta): string {
    return opcion.id;
  }
  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.opcionesOrdenadas, event.previousIndex, event.currentIndex);
    this.guardarRespuestaOrdenada();
  }
  guardarRespuestaOrdenada(): void {
    if (!this.preguntaActual) return;
    this.preguntaActual.respuesta = this.opcionesOrdenadas.map(opcion => opcion.id);
  }
  private setupConnectionMonitoring(): void {
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.notificationService.showConnectionWarning(navigator.onLine);
    });
  }
  private setupBeforeUnloadWarning(): void {
    let currentExamen: boolean = false;
  this.examenService.getExamenEnCurso()
      .pipe(takeUntil(this.destroy$))
      .subscribe(examen => {
        currentExamen = !!examen;
      });
  window.addEventListener('beforeunload', (e) => {
      if (currentExamen) {
        e.preventDefault();
        return '';
      }
      return undefined;  // Retornar undefined cuando no hay examen activo
    });
  }
  @HostListener('paste', ['$event'])
  async onPaste(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
  // Primero mostrar la advertencia
    this.notificationService.showClipboardWarning('paste');
  // Luego registrar la violación
    this.securityService.reportSecurityViolation(
      SecurityViolationType.CLIPBOARD_OPERATION,
      {
        operation: 'paste',
        timestamp: new Date().toISOString(),
        content: event.clipboardData?.getData('text') || 'N/A'
      }
    );
  }
  @HostListener('copy', ['$event'])
  async onCopy(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
  this.notificationService.showClipboardWarning('copy');
    this.securityService.reportSecurityViolation(
      SecurityViolationType.CLIPBOARD_OPERATION,
      {
        operation: 'copy',
        timestamp: new Date().toISOString(),
        selectedText: window.getSelection()?.toString() || 'N/A'
      }
    );
  }
  @HostListener('cut', ['$event'])
  async onCut(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
  this.notificationService.showClipboardWarning('cut');
    this.securityService.reportSecurityViolation(
      SecurityViolationType.CLIPBOARD_OPERATION,
      {
        operation: 'cut',
        timestamp: new Date().toISOString(),
        selectedText: window.getSelection()?.toString() || 'N/A'
      }
    );
  }
  @HostListener('document:fullscreenchange', ['$event'])
  async onFullscreenChange(): Promise<void> {
    // Solo manejamos el evento cuando el examen está en progreso
    // y cuando no es la activación inicial
    if (this.isExamInProgress && !this.isInitialFullscreenActivation && !document.fullscreenElement) {
      const shouldExit = await this.notificationService.showFullscreenWarning();
      if (!shouldExit) {
        await this.activarPantallaCompleta();
      } else {
        this.securityService.reportSecurityViolation(
          SecurityViolationType.FULLSCREEN_EXIT,
          { timestamp: new Date().toISOString() }
        );
      }
    }

    // Desactivamos el flag de activación inicial después del primer cambio
    if (this.isInitialFullscreenActivation) {
      this.isInitialFullscreenActivation = false;
    }
  }
  private async activarPantallaCompleta(): Promise<void> {
    try {
      // Primero colapsamos la barra lateral
      this.sidebarService.collapse();

      // Intentamos activar la pantalla completa
      const element = document.documentElement;
      await element.requestFullscreen();
    } catch (error) {
      console.error('Error al activar pantalla completa:', error);
      throw error;
    }
  }
  private cargarExamen(examenId: string): void {
    // Cargamos las preguntas e iniciamos el examen
    this.examenesService.getPreguntas(examenId).subscribe(preguntas => {
      this.preguntas = preguntas;
      this.examenService.iniciarExamen(examenId, preguntas);
      this.isExamInProgress = true;

      // this.securityService.initializeSecurityMeasures();

      // Registrar inicio del examen
      this.activityLogger.logActivity({
        type: ActivityLogType.SYSTEM_EVENT,
        timestamp: Date.now(),
        details: {
          event: 'EXAMEN_INICIADO',
          examenId: examenId
        }
      });

      this.setupConnectionMonitoring();
      this.setupBeforeUnloadWarning();
    });
  }
}

interface PreguntaLocal {
  id: string;
  orden: number;
  texto: string;
  puntaje: number;
  tipo: TipoPregunta;
  opciones?: OpcionRespuesta[];
  respuesta?: string[];
}
