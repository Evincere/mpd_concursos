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
import { OpcionRespuesta, Pregunta, RespuestaUsuario, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatListModule } from '@angular/material/list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatListOption } from '@angular/material/list';
import { ExamenSecurityService } from '@core/services/examenes/examen-security.service';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenActivityLoggerService, ActivityLogType } from '@core/services/examenes/examen-activity-logger.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { fromEvent, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ExamenRecoveryService } from '@core/services/examenes/examen-recovery.service';

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
    DragDropModule
  ],
  templateUrl: './examen-rendicion.component.html',
  styleUrls: ['./examen-rendicion.component.scss']
})
export class ExamenRendicionComponent implements OnInit, OnDestroy {
  preguntaActual: Pregunta | null = null;
  preguntas: Pregunta[] = [];
  tiempoRestante: number = 0;
  private destroy$ = new Subject<void>();
  opcionesOrdenadas: OpcionRespuesta[] = [];
  private preguntaStartTime: number = 0;

  constructor(
    private examenService: ExamenRendicionService,
    private examenesService: ExamenesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private securityService: ExamenSecurityService,
    private activityLogger: ExamenActivityLoggerService,
    private notificationService: ExamenNotificationService,
    private recoveryService: ExamenRecoveryService
  ) {}

  ngOnInit(): void {
    const examenId = this.route.snapshot.params['id'];
    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

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

    const tiempoRespuesta = Date.now() - this.preguntaStartTime;
    
    if (!this.validarTiempoRespuesta(tiempoRespuesta, this.preguntaActual)) {
      this.notificationService.showSecurityWarning(SecurityViolationType.ANSWER_TOO_FAST);
      return;
    }

    const respuestaUsuario: RespuestaUsuario = {
      preguntaId: this.preguntaActual.id,
      respuesta,
      timestamp: new Date().toISOString(),
      tiempoRespuesta
    };

    this.examenService.guardarRespuesta(respuestaUsuario);

    this.activityLogger.logActivity({
      type: ActivityLogType.USER_INTERACTION,
      timestamp: Date.now(),
      details: {
        event: 'RESPUESTA_GUARDADA',
        preguntaId: respuestaUsuario.preguntaId,
        tiempoRespuesta
      }
    });
  }

  private validarTiempoRespuesta(tiempoMs: number, pregunta: Pregunta): boolean {
    // Ajustamos los tiempos base para ser más realistas
    const MIN_TIEMPO_BASE = 1000;  // Reducido a 1 segundo
    const TIEMPO_POR_PALABRA = 100; // Reducido a 100ms por palabra
    const TIEMPO_POR_OPCION = 500;  // Reducido a 500ms por opción

    let tiempoMinimoEsperado = MIN_TIEMPO_BASE;

    // Calculamos el tiempo basado en el contenido
    const palabras = pregunta.texto.trim().split(/\s+/).length;
    tiempoMinimoEsperado += palabras * TIEMPO_POR_PALABRA;

    // Ajustamos según el tipo de pregunta
    switch (pregunta.tipo) {
      case TipoPregunta.OPCION_MULTIPLE:
      case TipoPregunta.SELECCION_MULTIPLE:
        tiempoMinimoEsperado += (pregunta.opciones?.length || 0) * TIEMPO_POR_OPCION;
        break;
      case TipoPregunta.ORDENAMIENTO:
        // Para ordenamiento, el tiempo mínimo es menor ya que el usuario puede reconocer el orden rápidamente
        tiempoMinimoEsperado += (pregunta.opciones?.length || 0) * (TIEMPO_POR_OPCION * 0.75);
        break;
      case TipoPregunta.DESARROLLO:
        // Para desarrollo, mantenemos un tiempo base más alto
        tiempoMinimoEsperado += MIN_TIEMPO_BASE;
        break;
      case TipoPregunta.VERDADERO_FALSO:
        // Para verdadero/falso, el tiempo mínimo es menor
        tiempoMinimoEsperado += MIN_TIEMPO_BASE * 0.5;
        break;
    }

    // Agregamos un margen de tolerancia del 20%
    tiempoMinimoEsperado *= 0.8;

    // Para debug
    console.debug('Validación de tiempo:', {
      tiempoRespuesta: tiempoMs,
      tiempoMinimo: tiempoMinimoEsperado,
      tipoPregunta: pregunta.tipo,
      palabras,
      opcionesLength: pregunta.opciones?.length
    });

    return tiempoMs >= tiempoMinimoEsperado;
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
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);

    if (horas < 0 || minutos < 0 || segs < 0) {
      return '00:00:00';
    }

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
    
    // Mantener una única suscripción al estado del examen
    this.examenService.getExamenEnCurso()
      .pipe(takeUntil(this.destroy$))
      .subscribe(examen => {
        currentExamen = !!examen;
      });

    window.addEventListener('beforeunload', (e) => {
      if (currentExamen) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape' && document.fullscreenElement) {
      event.preventDefault();
      this.notificationService.showSecurityWarning(
        SecurityViolationType.FULLSCREEN_EXIT
      );
    }
  }
}
