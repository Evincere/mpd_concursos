import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, Inject, Optional } from '@angular/core';
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
import { OpcionRespuesta, Pregunta, RespuestaUsuario, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MatListModule, MatListOption } from '@angular/material/list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import {
  ExamenTimeService,
  ExamenActivityLoggerService,
  ExamenRecoveryService,
  ExamenSecurityService,
  ExamenNotificationService
} from '@core/services/examenes';
import { SECURITY_PROVIDERS } from '../../providers/security.providers';
import { ExamenValidationService } from '@core/services/examenes/examen-validation.service';
import { FormatTiempoPipe } from '@shared/pipes/format-tiempo.pipe';

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
    ExamenValidationService,
    {
      provide: 'SidebarService',
      useValue: {
        collapse: () => {
          // Implementación del colapso del sidebar
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            sidebar.classList.add('collapsed');
          }
        }
      }
    }
  ]
})
export class ExamenRendicionComponent implements OnInit, OnDestroy {
  preguntaActual: Pregunta | null = null;
  preguntas: Pregunta[] = [];
  tiempoRestante: number = 0;
  private destroy$ = new Subject<void>();
  opcionesOrdenadas: OpcionRespuesta[] = [];
  private preguntaStartTime: number = 0;
  private fullscreenWarningShown = false;

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
    @Optional() @Inject('SidebarService') private sidebarService?: any
  ) {}

  ngOnInit(): void {
    const examenId = this.route.snapshot.params['id'];
    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    // Activar pantalla completa al iniciar
    this.activarPantallaCompleta();

    // Primero configuramos los observables
    this.setupObservables();

    // Luego cargamos las preguntas e iniciamos el examen
    this.examenesService.getPreguntas(examenId).subscribe(preguntas => {
      this.preguntas = preguntas;
      this.examenService.iniciarExamen(examenId, preguntas);
    });

    this.securityService.initializeSecurityMeasures();

    // Registrar inicio del examen
    this.activityLogger.logActivity({
      type: ActivityLogType.SYSTEM_EVENT,
      timestamp: Date.now(),
      details: {
        event: 'EXAMEN_INICIADO',
        examenId: this.route.snapshot.params['id']
      }
    });

    this.setupConnectionMonitoring();
    this.setupBeforeUnloadWarning();
  }

  private setupObservables(): void {
    this.examenService.getPreguntaActual()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pregunta => {
        if (pregunta) {
          this.preguntaActual = pregunta;
          this.preguntaStartTime = Date.now();

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

    if (violation.severity === 'HIGH') {
      const examenId = this.route.snapshot.params['id'];

      // Nos suscribimos al Observable para obtener el valor actual
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

  drop(event: CdkDragDrop<OpcionRespuesta[]>): void {
    if (!this.preguntaActual) return;

    // Crear una copia del array
    const opcionesActualizadas = this.opcionesOrdenadas.slice();

    // Realizar el movimiento
    moveItemInArray(opcionesActualizadas, event.previousIndex, event.currentIndex);

    // Actualizar el estado
    this.opcionesOrdenadas = opcionesActualizadas;

    // Forzar actualización de la vista
    this.cdr.detectChanges();

    // Guardar la respuesta
    const respuesta = this.opcionesOrdenadas.map(opcion => opcion.id);
    this.guardarRespuesta(respuesta);
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
  async onFullscreenChange(event: Event): Promise<void> {
    if (!document.fullscreenElement) {
      event.preventDefault();

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
  }

  private async activarPantallaCompleta(): Promise<void> {
    try {
      if (this.sidebarService?.collapse) {
        this.sidebarService.collapse();
      }

      if (!document.fullscreenElement) {
        const element = document.documentElement;
        await element.requestFullscreen();

        // Mostrar mensaje solo la primera vez
        if (!this.fullscreenWarningShown) {
          this.notificationService.showSecurityWarning(
            SecurityViolationType.FULLSCREEN_REQUIRED,
            'El examen debe realizarse en modo pantalla completa. Salir de este modo se considerará una infracción de seguridad.'
          );
          this.fullscreenWarningShown = true;
        }
      }
    } catch (error) {
      console.error('Error al activar pantalla completa:', error);
      this.securityService.reportSecurityViolation(
        SecurityViolationType.FULLSCREEN_DENIED,
        { error: 'Usuario denegó el modo pantalla completa' }
      );
    }
  }
}
