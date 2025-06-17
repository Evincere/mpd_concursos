import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { AnimateDirective } from '@shared/directives/animate.directive';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

@Component({
  selector: 'app-concurso-card',
  standalone: true,
  imports: [
    CommonModule,
    AnimateDirective,
    InscripcionButtonComponent,
    ContestStatusBadgeComponent,
    CustomButtonComponent
  ],
  template: `
    <div class="concurso-card"
         [appAnimate]="'fadeIn'"
         [animationDuration]="300"
         [animationDelay]="index * 100"
         (click)="verDetalle.emit(concurso)"
         (keydown.enter)="verDetalle.emit(concurso)"
         (keydown.space)="verDetalle.emit(concurso); $event.preventDefault()"
         tabindex="0"
         role="button"
         [attr.aria-label]="'Ver detalles de concurso: ' + concurso.title">

      <div class="card-header">
        <app-contest-status-badge
          [status]="concurso.status"
          [showIcon]="true">
        </app-contest-status-badge>
        <div class="fecha">
          <i class="fas fa-calendar-alt" aria-hidden="true"></i>
          <span>{{ concurso.startDate | date:'dd/MM/yyyy' }} - {{ concurso.endDate | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>

      <div class="card-content">
        <h3>{{ concurso.title }}</h3>
        <p class="cargo">{{ concurso.position }}</p>
        <p class="dependencia">{{ concurso.department }}</p>
      </div>

      <div class="card-actions" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="0" role="group" aria-label="Acciones del concurso">
        <app-custom-button
          [variant]="'stroked'"
          [color]="'primary'"
          [icon]="'eye'"
          [label]="'Ver Detalles'"
          [tooltip]="'Ver detalles del concurso'"
          (buttonClick)="onVerDetalle($event)"
          class="details-button">
        </app-custom-button>

        <app-inscripcion-button
          *ngIf="shouldShowInscriptionButton()"
          [contest]="concurso"
          [userPostulation]="userPostulation"
          (inscripcionClick)="onInscripcionClick($event)"
          (continuarClick)="onContinuarClick($event)">
        </app-inscripcion-button>
      </div>
    </div>
  `,
  styleUrls: ['./concurso-card.component.scss']
})
export class ConcursoCardComponent implements OnInit, OnDestroy {
  @Input() concurso!: Concurso;
  @Input() index = 0;

  @Output() verDetalle = new EventEmitter<Concurso>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();

  userPostulation: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private inscriptionService: InscriptionService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en las inscripciones para reaccionar automáticamente
    this.inscriptionService.inscriptions
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.debug('[ConcursoCard] Inscripciones actualizadas, verificando estado para concurso:', this.concurso?.id, 'ConcursoCard');
        this.checkUserInscription();
      });

    // Forzar limpieza y actualización inicial del cache de inscripciones al cargar
    this.inscriptionService.clearCacheAndRefresh().subscribe({
      next: () => {
        this.loggingService.debug('[ConcursoCard] Cache limpiado y actualizado inicialmente', undefined, 'ConcursoCard');
      },
      error: (error) => {
        console.error('[ConcursoCard] Error al limpiar y actualizar cache inicial:', error);
        // Si falla la actualización, verificar de todas formas
        this.checkUserInscription();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determina si se debe mostrar el botón de inscripción
   * Considera todos los estados dinámicos del concurso y la inscripción del usuario
   */
  shouldShowInscriptionButton(): boolean {
    if (!this.concurso?.status) return false;

    // Estados que permiten mostrar botón de inscripción
    const allowedContestStates = [
      'PUBLISHED',           // Estado base que permite inscripciones
      'INSCRIPTION_OPEN',    // Inscripciones explícitamente abiertas
      'INSCRIPTION_PENDING'  // Próximamente - mostrar para informar
    ];

    // Si el concurso no está en un estado que permita inscripciones, no mostrar botón
    if (!allowedContestStates.includes(this.concurso.status)) {
      return false;
    }

    // Si hay una inscripción del usuario, siempre mostrar botón (para ver estado o continuar)
    if (this.userPostulation) {
      return true;
    }

    // Si no hay inscripción, solo mostrar para estados que permiten nueva inscripción
    const newInscriptionStates = ['PUBLISHED', 'INSCRIPTION_OPEN'];
    return newInscriptionStates.includes(this.concurso.status);
  }

  private checkUserInscription(): void {
    if (!this.concurso?.id) return;

    this.inscriptionService.getInscriptionStatus(this.concurso.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status: InscripcionState) => {
          this.loggingService.debug('[ConcursoCard] Estado recibido:', status, 'ConcursoCard');

          // CRITICAL FIX: Distinguir entre NO_INSCRIPTION (sin inscripción) y otros estados (con inscripción)
          if (status !== InscripcionState.NO_INSCRIPTION) {
            this.userPostulation = {
              estado: status.toString(),
              contestId: this.concurso.id
            };
            this.loggingService.debug('[ConcursoCard] UserPostulation asignada:', this.userPostulation, 'ConcursoCard');
          } else {
            this.userPostulation = null;
            this.loggingService.debug('[ConcursoCard] No hay inscripción para este concurso', undefined, 'ConcursoCard');
          }
        },
        error: () => {
          this.userPostulation = null;
        }
      });
  }

  onVerDetalle(event: Event): void {
    event.stopPropagation();
    this.verDetalle.emit(this.concurso);
  }

  onInscripcionClick(concurso: Concurso): void {
    this.loggingService.debug('[ConcursoCard] Iniciando inscripción para concurso:', concurso.id, 'ConcursoCard');
    this.inscriptionComplete.emit(concurso);
  }

  onContinuarClick(concurso: Concurso): void {
    this.loggingService.debug('[ConcursoCard] Continuando inscripción para concurso:', concurso.id, 'ConcursoCard');
    this.inscriptionComplete.emit(concurso);
  }
}
