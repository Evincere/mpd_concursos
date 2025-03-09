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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeService.detener();
    this.securityService.deactivateSecureMode();
    this.securityService.cleanup();
    this.notificationService.cleanup();
  }

  ngOnInit(): void {
    // Implementation of ngOnInit method
  }
} 