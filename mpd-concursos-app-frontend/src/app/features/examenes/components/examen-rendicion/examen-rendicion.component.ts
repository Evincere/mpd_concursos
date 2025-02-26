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
import { OpcionRespuesta, Pregunta as PreguntaInterface, RespuestaUsuario, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, take } from 'rxjs/operators';
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
import { ComponentWithExam } from '@core/services/examenes/security/guards/exam-navigation.guard';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { FullscreenStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';

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
  private preguntaStartTime: number = 0;
  private fullscreenWarningShown = false;
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
    const examenId = this.route.snapshot.paramMap.get('id');
    console.log('ExamenRendicionComponent inicializado con ID:', examenId);

    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    // Configuramos los observables y otras preparaciones
    this.setupObservables();
    
    // Verificamos si el navegador soporta pantalla completa
    this.verificarSoportePantallaCompleta().then(soportado => {
      if (!soportado) {
        this.notificationService.showSecurityWarning(
          SecurityViolationType.FULLSCREEN_DENIED,
          'Su navegador no soporta el modo pantalla completa. No podrá realizar el examen.'
        );
        this.router.navigate(['/dashboard/examenes']);
        return;
      }
      
      // Primero solicitamos permiso para pantalla completa
      this.notificationService.showConfirmDialog(
        'Iniciar Examen',
        'Para comenzar el examen, necesitamos activar el modo pantalla completa. ¿Desea continuar?'
      ).then(async (confirmed) => {
        if (confirmed) {
          try {
            console.log('Usuario confirmó iniciar examen en pantalla completa');
            
            // Inicializamos el objeto fullscreenStrategy antes de usarlo
            const fullscreenStrategy = this.securityService.getStrategy(SecurityViolationType.FULLSCREEN_REQUIRED) as FullscreenStrategy;
            if (!fullscreenStrategy) {
              throw new Error('No se pudo obtener la estrategia de pantalla completa');
            }
            
            // Verificamos que estamos en estado INITIAL antes de solicitar pantalla completa
            console.log('Estado de la estrategia antes de activar:', fullscreenStrategy.getCurrentState());
            
            // Activar pantalla completa antes de cargar el examen
            await this.activarPantallaCompleta();
            console.log('Pantalla completa activada correctamente, cargando examen...');
            
            // Y luego cargamos el examen
            this.cargarExamen(examenId);
          } catch (error) {
            console.error('Error al activar pantalla completa:', error);
            this.notificationService.showSecurityWarning(
              SecurityViolationType.FULLSCREEN_DENIED,
              'No se pudo activar el modo pantalla completa. Por favor, verifique los permisos del navegador.'
            );
            this.router.navigate(['/dashboard/examenes']);
          }
        } else {
          console.log('Usuario canceló iniciar examen');
          this.router.navigate(['/dashboard/examenes']);
        }
      });
    });
  }
  
  // Método para verificar si el navegador soporta pantalla completa
  private async verificarSoportePantallaCompleta(): Promise<boolean> {
    const fullscreenStrategy = this.securityService.getStrategy(SecurityViolationType.FULLSCREEN_REQUIRED) as FullscreenStrategy;
    
    if (!fullscreenStrategy) {
      console.error('No se pudo obtener la estrategia de pantalla completa');
      return false;
    }
    
    return fullscreenStrategy.checkFullscreenSupport();
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
              await this.examenService.finalizarExamen(examenAnulado).toPromise();

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
  async onFullscreenChange(event: Event): Promise<void> {
    console.log('Evento fullscreenchange detectado, isExamInProgress:', this.isExamInProgress);
    
    const isInFullscreen = Boolean(document.fullscreenElement);
    console.log('¿Está en pantalla completa?:', isInFullscreen);
    
    // Verificación crucial: si el examen no está en progreso y estamos entrando en pantalla completa,
    // ignoramos completamente este evento para evitar que se detecte como violación
    if (!this.isExamInProgress && isInFullscreen) {
      console.log('Ignorando evento de entrada a pantalla completa porque el examen aún no está en progreso');
      return;
    }
    
    // Si el examen no está en progreso, ignoramos el evento
    if (!this.isExamInProgress) {
      console.log('Examen no en progreso, ignorando evento fullscreenchange');
      return;
    }

    const fullscreenStrategy = this.securityService.getStrategy(SecurityViolationType.FULLSCREEN_REQUIRED) as FullscreenStrategy;
    
    if (!fullscreenStrategy) {
      console.error('No se pudo obtener la estrategia de pantalla completa en el evento fullscreenchange');
      return;
    }
    
    console.log('Estado actual antes de manejar el cambio:', fullscreenStrategy.getCurrentState());

    // Dejamos que la estrategia maneje el cambio de estado
    const shouldContinue = await fullscreenStrategy.handleFullscreenChange(isInFullscreen);
    console.log('Resultado del manejo del cambio de estado:', shouldContinue);

    // Si no debemos continuar y no estamos en estado VIOLATED, mostramos advertencia
    if (!shouldContinue && !fullscreenStrategy.isInViolatedState()) {
      console.log('Mostrando advertencia de pantalla completa...');
      const shouldExit = await this.notificationService.showFullscreenWarning();
      
      if (!shouldExit) {
        console.log('Usuario decidió cancelar la salida de pantalla completa');
        try {
          // El usuario decidió cancelar la salida, volvemos a activar pantalla completa
          await this.activarPantallaCompleta();
          console.log('Se restableció la pantalla completa correctamente');
        } catch (error) {
          console.error('Error al restablecer pantalla completa:', error);
        }
      } else {
        console.log('Usuario confirmó salir de pantalla completa, reportando infracción');
        // El usuario confirmó que quiere salir, reportamos la infracción
        this.securityService.reportSecurityViolation(
          SecurityViolationType.FULLSCREEN_EXIT,
          { timestamp: new Date().toISOString() }
        );
      }
    }
  }
  private async activarPantallaCompleta(): Promise<void> {
    try {
      console.log('Solicitando activación de pantalla completa...');
      // Obtenemos la estrategia específica para pantalla completa
      const fullscreenStrategy = this.securityService.getStrategy(SecurityViolationType.FULLSCREEN_REQUIRED) as FullscreenStrategy;
      
      if (!fullscreenStrategy) {
        console.error('No se pudo obtener la estrategia de pantalla completa');
        throw new Error('No se pudo obtener la estrategia de pantalla completa');
      }
      
      console.log('Estado de fullscreenStrategy antes de activar:', fullscreenStrategy.getCurrentState());
      
      // Comprobamos si el navegador no soporta API de pantalla completa
      if (!fullscreenStrategy.checkFullscreenSupport()) {
        console.error('Este navegador no soporta la API de pantalla completa');
        throw new Error('Navegador no compatible con pantalla completa');
      }
      
      // Si ya estamos en pantalla completa, no necesitamos volver a activarla
      if (document.fullscreenElement) {
        console.log('Ya estamos en pantalla completa, no se necesita activar de nuevo');
        return;
      }
      
      // Solicitamos pantalla completa utilizando la API estándar
      try {
        await document.documentElement.requestFullscreen();
        console.log('Pantalla completa activada exitosamente');
      } catch (fsError) {
        console.error('Error al solicitar pantalla completa:', fsError);
        throw fsError;
      }
    } catch (error) {
      console.error('Error en método activarPantallaCompleta:', error);
      // Notificar al usuario del error
      this.notificationService.showSecurityWarning(
        SecurityViolationType.FULLSCREEN_DENIED,
        'No se pudo activar el modo pantalla completa. Verifique los permisos del navegador.'
      );
      throw error;
    }
  }
  private cargarExamen(examenId: string): void {
    // Cargamos las preguntas e iniciamos el examen
    this.examenesService.getPreguntas(examenId).subscribe(preguntas => {
      this.preguntas = preguntas;
      this.examenService.iniciarExamen(examenId, preguntas);
      
      // Primero marcamos que el examen está en progreso ANTES de inicializar las medidas de seguridad
      this.isExamInProgress = true;
      
      // A continuación inicializamos las medidas de seguridad
      // Excluyendo la pantalla completa que ya se activó previamente
      console.log('Inicializando medidas de seguridad, excluyendo pantalla completa...');
      this.securityService.initializeSecurityMeasures();

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
