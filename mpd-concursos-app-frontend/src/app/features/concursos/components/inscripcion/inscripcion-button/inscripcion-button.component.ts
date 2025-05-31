import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { BehaviorSubject, Subject } from 'rxjs';

import { IInscriptionFormState, InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { finalize, takeUntil } from 'rxjs/operators';
import { ContinueInscriptionDialogComponent } from '../continue-inscription-dialog/continue-inscription-dialog.component';
// Importación eliminada porque no se usa: import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <ng-container *ngIf="inscripcionState$ | async as estado">
      <button
        mat-flat-button
        color="accent"
        class="inscripcion-button"
        [class.loading]="loading"
        [class.inscripto]="estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED"
        [class.confirmada]="estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE || estado === InscripcionState.PENDING"
        [class.retomar]="estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE"
        [class.cancelled]="isCancelledFinal(estado)"
        [class.rejected]="estado === InscripcionState.REJECTED"
        [disabled]="loading || estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED || estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE || estado === InscripcionState.PENDING || estado === InscripcionState.REJECTED || isCancelledFinal(estado)"
        (click)="onInscribirse()">
        <!-- Estado: No inscripto o cancelación de proceso -->
        <ng-container *ngIf="!loading && (estado === InscripcionState.NO_INSCRIPTO || isCancelledProcess(estado))">
          <mat-icon>how_to_reg</mat-icon>
          <span>Inscribirse</span>
        </ng-container>

        <!-- Estado: Cancelación final -->
        <ng-container *ngIf="!loading && isCancelledFinal(estado)">
          <mat-icon>cancel</mat-icon>
          <span>Cancelada</span>
        </ng-container>

        <!-- Estado: Rechazada -->
        <ng-container *ngIf="!loading && estado === InscripcionState.REJECTED">
          <mat-icon>block</mat-icon>
          <span>Rechazada</span>
        </ng-container>

        <!-- Estado: Cargando -->
        <ng-container *ngIf="loading">
          <mat-spinner diameter="20"></mat-spinner>
          <span>Procesando...</span>
        </ng-container>

        <!-- Estado: En proceso -->
        <ng-container *ngIf="!loading && (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE)">
          <mat-icon>restart_alt</mat-icon>
          <span>Retomar</span>
        </ng-container>

        <!-- Estado: Pendiente de validación -->
        <ng-container *ngIf="!loading && (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE || estado === InscripcionState.PENDING)">
          <mat-icon>hourglass_top</mat-icon>
          <span>Pendiente</span>
        </ng-container>

        <!-- Estado: Inscripto -->
        <ng-container *ngIf="!loading && (estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED)">
          <mat-icon>check_circle</mat-icon>
          <span>Inscripto</span>
        </ng-container>

        <!-- Fallback para asegurar que siempre haya contenido -->
        <ng-container *ngIf="!loading && !hasVisibleContent(estado)">
          <mat-icon>how_to_reg</mat-icon>
          <span>Inscribirse</span>
        </ng-container>
      </button>
    </ng-container>
  `,
  styles: [`
    .inscripcion-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 16px;
      height: 36px;
      min-width: 120px;
      /* Estilo base mejorado para todos los botones de inscripción - tonos verdes */
      background: linear-gradient(135deg, #4CAF50, #2E7D32) !important;
      color: white !important;
      font-weight: 500;
      letter-spacing: 0.5px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #5cb860, #3b9a40) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
      }

      &:active {
        background: linear-gradient(135deg, #3b9a40, #2E7D32) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transform: translateY(1px);
      }

      &.loading {
        opacity: 0.8;
        cursor: not-allowed;
        background: linear-gradient(135deg, #78c67a, #4CAF50) !important;
      }

      &.inscripto {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(46, 125, 50, 0.15)) !important;
        color: #4CAF50 !important;
        pointer-events: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        mat-icon {
          color: #4CAF50;
        }
      }

      &.confirmada {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(25, 118, 210, 0.15)) !important;
        color: #2196F3 !important;
        pointer-events: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        mat-icon {
          color: #2196F3;
        }
      }

      &.retomar {
        background: linear-gradient(135deg, #2196F3, #1976D2) !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        pointer-events: auto !important;
        opacity: 1 !important;

        &:hover {
          background: linear-gradient(135deg, #1976D2, #0D47A1) !important;
          box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
          transform: translateY(-1px);
        }

        &:active {
          background: linear-gradient(135deg, #0D47A1, #1565C0) !important;
          box-shadow: 0 1px 2px rgba(33, 150, 243, 0.2);
          transform: translateY(1px);
        }

        mat-icon {
          color: white;
        }
      }

      /* Estilo para el botón cancelado (solo para cancelaciones finales) */
      &.cancelled {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(211, 47, 47, 0.15)) !important;
        color: #F44336 !important;
        pointer-events: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        mat-icon {
          color: #F44336;
        }
      }

      mat-spinner {
        margin-right: 8px;
      }

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        margin-right: 4px;
      }

      span {
        font-size: 14px;
        line-height: 1;
        white-space: nowrap;
      }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class InscripcionButtonComponent implements OnInit, OnDestroy {
  @Input() contest!: Contest;
  @Output() inscriptionComplete = new EventEmitter<Contest>();

  loading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  InscripcionState = InscripcionState;
  private destroy$ = new Subject<void>();

  constructor(
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Obtiene el texto para el atributo aria-label según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Texto descriptivo para el atributo aria-label
   */
  getAriaLabel(estado: InscripcionState): string {
    if (this.loading) {
      return 'Procesando inscripción, por favor espere';
    }

    if (estado === InscripcionState.NO_INSCRIPTO || this.isCancelledProcess(estado)) {
      return 'Inscribirse en este concurso';
    }

    if (this.isCancelledFinal(estado)) {
      return 'Inscripción cancelada para este concurso';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'Inscripción rechazada para este concurso';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'Retomar proceso de inscripción para este concurso';
    }

    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE || estado === InscripcionState.PENDING) {
      return 'Inscripción pendiente de validación para este concurso';
    }

    if (estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'Ya estás inscripto en este concurso';
    }

    return 'Inscribirse en este concurso';
  }

  ngOnInit(): void {
    // Primero verificar el estado actual de la inscripción en el backend
    this.verificarEstadoInscripcion();

    // Suscribirse al estado de la inscripción para detectar cambios
    this.inscripcionState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(estado => {
      // Si el estado es final (PENDIENTE, INSCRIPTO o REJECTED), limpiar los estados locales
      // Nota: CANCELLED no se considera un estado final para permitir reiniciar el proceso
      if (estado === InscripcionState.PENDIENTE ||
          estado === InscripcionState.INSCRIPTO ||
          estado === InscripcionState.APPROVED ||
          estado === InscripcionState.REJECTED) {

        // Buscar inscripciones incompletas para este concurso y limpiarlas
        const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
        const incompleteInscription = incompleteInscriptions.find((ins: IInscriptionFormState) =>
          ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id)
        );

        if (incompleteInscription) {
          console.log('[InscripcionButton] Limpiando inscripción incompleta para concurso con estado final:', estado);
          this.inscriptionStateService.clearInscriptionState(incompleteInscription.inscriptionId);
        }

        // Limpiar también el método antiguo
        const savedInscription = this.inscriptionStateService.getInProgressInscription();
        if (savedInscription && savedInscription.contestId === this.contest.id) {
          console.log('[InscripcionButton] Limpiando inscripción en progreso (método antiguo) para concurso con estado final:', estado);
          this.inscriptionStateService.clearInProgressInscription();
        }

        return; // No continuar con la verificación de inscripciones incompletas
      }

      // Solo verificar inscripciones incompletas si el estado no es final
      if (estado === InscripcionState.NO_INSCRIPTO || estado === InscripcionState.IN_PROCESS) {
        this.verificarInscripcionesIncompletas();
      }
    });
  }

  /**
   * Verifica si hay inscripciones incompletas para este concurso
   * @returns void
   */
  private verificarInscripcionesIncompletas(): void {
    // Verificar si hay una inscripción en progreso para este concurso
    // Primero verificamos con el nuevo método
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    const incompleteInscription = incompleteInscriptions.find((ins: IInscriptionFormState) =>
      ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id)
    );

    if (incompleteInscription) {
      console.log('[InscripcionButton] Encontrada inscripción incompleta para este concurso:', incompleteInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === incompleteInscription.inscriptionId) {
        console.log('[InscripcionButton] Detectada redirección desde documentación, abriendo diálogo automáticamente');

        // Redirigir a la página de inscripción
        setTimeout(() => {
          this.abrirDialogoInscripcion(incompleteInscription.inscriptionId, true);
          // Limpiar la redirección para evitar que se abra nuevamente
          this.inscriptionStateService.clearRedirectFromInscription();
        }, 500); // Pequeño retraso para asegurar que la UI esté lista
      } else {
        // Si no venimos de documentación pero hay una inscripción incompleta, mostrar diálogo para continuar
        setTimeout(() => {
          this.mostrarDialogoContinuarInscripcion(incompleteInscription);
        }, 1000);
      }
      return;
    }

    // Método antiguo como fallback
    const savedInscription = this.inscriptionStateService.getInProgressInscription();
    if (savedInscription && savedInscription.contestId === this.contest.id) {
      console.log('[InscripcionButton] Encontrada inscripción en progreso para este concurso (método antiguo):', savedInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === savedInscription.id) {
        console.log('[InscripcionButton] Detectada redirección desde documentación, abriendo diálogo automáticamente');

        // Redirigir a la página de inscripción
        setTimeout(() => {
          this.abrirDialogoInscripcion(savedInscription.id);
          // Limpiar la redirección para evitar que se abra nuevamente
          this.inscriptionStateService.clearRedirectFromInscription();
        }, 500); // Pequeño retraso para asegurar que la UI esté lista
      }
    }
  }

  /**
   * Muestra un diálogo para continuar una inscripción incompleta
   * @param inscription Estado de la inscripción incompleta
   * @returns void
   */
  private mostrarDialogoContinuarInscripcion(inscription: IInscriptionFormState): void {
    // Verificar el estado actual de la inscripción en el backend antes de mostrar el diálogo
    this.inscriptionService.getInscriptionStatus(inscription.contestId).subscribe({
      next: (estado) => {
        // Si el estado es final, no permitir continuar con la inscripción
        // Nota: CANCELLED no se considera un estado final para permitir reiniciar el proceso
        if (estado === InscripcionState.PENDIENTE ||
            estado === InscripcionState.INSCRIPTO ||
            estado === InscripcionState.APPROVED ||
            estado === InscripcionState.REJECTED) {

          console.log('[InscripcionButton] No se puede continuar la inscripción porque ya tiene un estado final:', estado);

          // Actualizar el estado local
          this.inscripcionState$.next(estado);

          // Limpiar los estados locales
          this.inscriptionService.clearFormState(inscription.inscriptionId);
          this.inscriptionStateService.clearInscriptionState(inscription.inscriptionId);

          // Limpiar también el método antiguo
          this.inscriptionStateService.clearInProgressInscription();

          // Mostrar mensaje al usuario
          let mensaje = '';
          switch (estado) {
            case InscripcionState.PENDIENTE:
              mensaje = 'Ya tienes una inscripción pendiente de validación para este concurso';
              break;
            case InscripcionState.INSCRIPTO:
            case InscripcionState.APPROVED:
              mensaje = 'Ya estás inscripto en este concurso';
              break;
            case InscripcionState.REJECTED:
              mensaje = 'Tu inscripción para este concurso fue rechazada';
              break;
            default:
              mensaje = 'No puedes continuar con esta inscripción';
              break;
          }

          // Manejo especial para CANCELLED (no está en el switch porque causa error de tipos)
          if (estado.toString() === InscripcionState.CANCELLED.toString()) {
            mensaje = 'Tu inscripción para este concurso fue cancelada';
          }

          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          return;
        }

        // Continuar con la apertura del diálogo si el estado no es final
        this.mostrarDialogoContinuarInscripcionConfirmado(inscription);
      },
      error: (error) => {
        console.error('[InscripcionButton] Error al verificar estado de inscripción:', error);
        // En caso de error, continuar con la apertura del diálogo
        this.mostrarDialogoContinuarInscripcionConfirmado(inscription);
      }
    });
  }

  /**
   * Muestra el diálogo de confirmación para continuar una inscripción incompleta
   * @param inscription Estado de la inscripción incompleta
   * @returns void
   */
  private mostrarDialogoContinuarInscripcionConfirmado(inscription: IInscriptionFormState): void {
    const dialogRef = this.dialog.open(ContinueInscriptionDialogComponent, {
      width: '400px',
      data: {
        contestId: inscription.contestId,
        contestTitle: inscription.contestTitle || this.contest.title || this.contest.position,
        inscriptionId: inscription.inscriptionId
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Si el usuario quiere continuar, redirigir a la página de inscripción
        this.abrirDialogoInscripcion(inscription.inscriptionId, true);
      } else {
        // Si no quiere continuar, limpiar el estado guardado
        this.inscriptionStateService.clearInscriptionState(inscription.inscriptionId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determina si el estado es una cancelación de proceso (reciente)
   * @param estado Estado de la inscripción
   * @returns true si es una cancelación de proceso, false en caso contrario
   */
  isCancelledProcess(estado: InscripcionState): boolean {
    // Para evitar problemas con botones vacíos, siempre mostrar el botón de inscripción
    // para estados NO_INSCRIPTO o CANCELLED
    if (estado === InscripcionState.NO_INSCRIPTO) {
      return false; // No es una cancelación de proceso, es simplemente NO_INSCRIPTO
    }

    // Si el estado es CANCELLED, verificar si es una cancelación reciente (menos de 1 hora)
    if (estado === InscripcionState.CANCELLED) {
      // Obtener la inscripción actual
      let inscription: { contestId: number; state: InscripcionState; updatedAt?: string } | null = null;
      let isCancelled = false;

      try {
        // Usar un enfoque más seguro para obtener las inscripciones
        this.inscriptionService.inscriptions.subscribe(inscriptions => {
          const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;
          const foundInscription = inscriptions.find(ins =>
            ins.contestId === contestId &&
            ins.state === InscripcionState.CANCELLED
          );

          if (foundInscription) {
            inscription = {
              contestId: foundInscription.contestId,
              state: foundInscription.state,
              updatedAt: foundInscription.updatedAt instanceof Date ?
                foundInscription.updatedAt.toISOString() :
                foundInscription.updatedAt as string
            };
          }
        }).unsubscribe(); // Desuscribirse inmediatamente

        if (inscription) {
          // Si la inscripción fue actualizada hace menos de 1 hora, considerarla como una cancelación de proceso
          const now = new Date();
          const updatedAt = inscription && 'updatedAt' in inscription ? new Date((inscription as Record<string, string>)['updatedAt']) : now;
          const timeDiff = now.getTime() - updatedAt.getTime();
          const oneHourInMs = 60 * 60 * 1000;

          isCancelled = timeDiff < oneHourInMs;
        }
      } catch (error) {
        console.error('[InscripcionButton] Error al verificar si es cancelación de proceso:', error);
        // En caso de error, asumir que es una cancelación de proceso para mostrar el botón
        isCancelled = true;
      }

      return isCancelled;
    }

    return false;
  }

  /**
   * Determina si el estado es una cancelación final (antigua)
   * @param estado Estado de la inscripción
   * @returns true si es una cancelación final, false en caso contrario
   */
  isCancelledFinal(estado: InscripcionState): boolean {
    // Si el estado es CANCELLED, verificar si es una cancelación antigua (más de 1 hora)
    if (estado === InscripcionState.CANCELLED) {
      // Obtener la inscripción actual
      let inscription: { contestId: number; state: InscripcionState; updatedAt?: string } | null = null;
      let isFinalCancellation = false;

      try {
        // Usar un enfoque más seguro para obtener las inscripciones
        this.inscriptionService.inscriptions.subscribe(inscriptions => {
          const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;
          const foundInscription = inscriptions.find(ins =>
            ins.contestId === contestId &&
            ins.state === InscripcionState.CANCELLED
          );

          if (foundInscription) {
            inscription = {
              contestId: foundInscription.contestId,
              state: foundInscription.state,
              updatedAt: foundInscription.updatedAt instanceof Date ?
                foundInscription.updatedAt.toISOString() :
                foundInscription.updatedAt as string
            };
          }
        }).unsubscribe(); // Desuscribirse inmediatamente

        if (inscription) {
          // Si la inscripción fue actualizada hace más de 1 hora, considerarla como una cancelación final
          const now = new Date();
          const updatedAt = inscription && 'updatedAt' in inscription ? new Date((inscription as Record<string, string>)['updatedAt']) : now;
          const timeDiff = now.getTime() - updatedAt.getTime();
          const oneHourInMs = 60 * 60 * 1000;

          isFinalCancellation = timeDiff >= oneHourInMs;
        }
      } catch (error) {
        console.error('[InscripcionButton] Error al verificar si es cancelación final:', error);
        // En caso de error, asumir que no es una cancelación final
        isFinalCancellation = false;
      }

      return isFinalCancellation;
    }

    return false;
  }

  /**
   * Verifica si hay algún contenido visible en el botón según el estado
   * @param estado Estado de la inscripción
   * @returns true si hay contenido visible, false en caso contrario
   */
  hasVisibleContent(estado: InscripcionState): boolean {
    if (this.loading) {
      return true; // El spinner de carga es visible
    }

    // Verificar si alguna de las condiciones de visibilidad se cumple
    const isNoInscripto = estado === InscripcionState.NO_INSCRIPTO;
    const isCancelledProcessState = this.isCancelledProcess(estado);
    const isCancelledFinalState = this.isCancelledFinal(estado);
    const isPending = estado === InscripcionState.PENDING || estado === InscripcionState.IN_PROCESS;
    const isConfirmada = estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE;
    const isInscripto = estado === InscripcionState.INSCRIPTO;
    const isRejected = estado === InscripcionState.REJECTED;

    return isNoInscripto || isCancelledProcessState || isCancelledFinalState ||
           isPending || isConfirmada || isInscripto || isRejected;
  }

  private verificarEstadoInscripcion(): void {
    if (!this.contest) return;

    this.loading = true;
    this.inscriptionService.getInscriptionStatus(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (estado: InscripcionState) => {
          this.inscripcionState$.next(estado);
          if (estado === InscripcionState.CONFIRMADA) {
            this.snackBar.open('Ya estás inscrito en este concurso', 'Cerrar', {
              duration: 3000
            });
          }
        },
        error: (error: Error) => {
          console.error('Error al verificar estado de inscripción:', error);
          this.snackBar.open('Error al verificar el estado de inscripción', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  onInscribirse(): void {
    if (!this.contest) {
      console.warn('No hay concurso seleccionado para inscribirse');
      return;
    }

    this.loading = true;
    this.inscriptionService.createInscription(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { id: string }) => {
          console.log('Inscripción inicial creada:', response);
          // Pasar el ID de inscripción al método de redirección
          this.abrirDialogoInscripcion(response.id);
        },
        error: (error: { status?: number; message?: string }) => {
          console.error('Error al crear inscripción:', error);

          // Verificar si es un error de inscripción duplicada (409 Conflict)
          const httpError = error;
          if (httpError.status === 409 ||
              (httpError.message && httpError.message.includes('Ya existe una inscripción'))) {

            this.snackBar.open(
              'Ya existe una inscripción para este concurso. Actualizando estado...',
              'Cerrar',
              { duration: 5000 }
            );

            // Forzar actualización del estado
            setTimeout(() => {
              this.verificarEstadoInscripcion();

              // Intentar obtener la inscripción existente
              this.inscriptionService.refreshInscriptions().subscribe({
                next: (response) => {
                  console.log('[InscripcionButton] Inscripciones actualizadas:', response);

                  // Buscar la inscripción para este concurso
                  const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

                  this.inscriptionService.inscriptions.subscribe(inscripciones => {
                    const inscripcionExistente = inscripciones.find(ins => ins.contestId === contestId);

                    if (inscripcionExistente) {
                      console.log('[InscripcionButton] Encontrada inscripción existente:', inscripcionExistente);

                      // Si la inscripción está en proceso, permitir continuar
                      if (inscripcionExistente.state === InscripcionState.IN_PROCESS ||
                          inscripcionExistente.state === InscripcionState.ACTIVE) {
                        this.abrirDialogoInscripcion(inscripcionExistente.id, true);
                      }
                    }
                  }).unsubscribe();
                },
                error: (refreshError: Error) => {
                  console.error('[InscripcionButton] Error al refrescar inscripciones:', refreshError);
                },
                complete: () => {
                  console.log('[InscripcionButton] Actualización de inscripciones completada');
                }
              });
            }, 1000);
          } else if (httpError.status === 500) {
            // Para errores 500, mostrar un mensaje más genérico
            this.snackBar.open(
              'Error en el servidor. Por favor, inténtelo de nuevo más tarde.',
              'Cerrar',
              { duration: 5000 }
            );

            // Intentar actualizar el estado de todas formas
            setTimeout(() => {
              this.verificarEstadoInscripcion();
            }, 1000);
          } else {
            // Para otros errores, mostrar el mensaje específico
            this.snackBar.open(
              'Error al iniciar el proceso de inscripción: ' + (httpError.message || 'Error desconocido'),
              'Cerrar',
              { duration: 5000 }
            );
          }
        }
      });
  }

  private abrirDialogoInscripcion(inscriptionId?: string, continueInscription = false): void {
    console.log('[InscripcionButton] Redirigiendo a la página de inscripción:', { inscriptionId, continueInscription });

    // Verificar el estado actual de la inscripción en el backend antes de redirigir
    this.inscriptionService.getInscriptionStatus(this.contest.id).subscribe({
      next: (estado) => {
        // Si el estado es final, no permitir continuar con la inscripción
        // Nota: CANCELLED no se considera un estado final para permitir reiniciar el proceso
        if (estado === InscripcionState.PENDIENTE ||
            estado === InscripcionState.INSCRIPTO ||
            estado === InscripcionState.APPROVED ||
            estado === InscripcionState.REJECTED) {

          console.log('[InscripcionButton] No se puede continuar la inscripción porque ya tiene un estado final:', estado);

          // Actualizar el estado local
          this.inscripcionState$.next(estado);

          // Limpiar los estados locales
          if (inscriptionId) {
            this.inscriptionService.clearFormState(inscriptionId);
            this.inscriptionStateService.clearInscriptionState(inscriptionId);
          }

          // Limpiar también el método antiguo
          this.inscriptionStateService.clearInProgressInscription();

          // Mostrar mensaje al usuario
          let mensaje = '';
          switch (estado) {
            case InscripcionState.PENDIENTE:
              mensaje = 'Ya tienes una inscripción pendiente de validación para este concurso';
              break;
            case InscripcionState.INSCRIPTO:
            case InscripcionState.APPROVED:
              mensaje = 'Ya estás inscripto en este concurso';
              break;
            case InscripcionState.REJECTED:
              mensaje = 'Tu inscripción para este concurso fue rechazada';
              break;
            default:
              mensaje = 'No puedes continuar con esta inscripción';
              break;
          }

          // Manejo especial para CANCELLED (no está en el switch porque causa error de tipos)
          if (estado.toString() === InscripcionState.CANCELLED.toString()) {
            mensaje = 'Tu inscripción para este concurso fue cancelada';
          }

          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          return;
        }

        // Continuar con la redirección si el estado no es final
        this.redirigirAPaginaInscripcion(inscriptionId, continueInscription);
      },
      error: (error: Error) => {
        console.error('[InscripcionButton] Error al verificar estado de inscripción:', error);
        // En caso de error, continuar con la redirección
        this.redirigirAPaginaInscripcion(inscriptionId, continueInscription);
      }
    });
  }

  /**
   * Redirige a la página de inscripción
   */
  private redirigirAPaginaInscripcion(inscriptionId?: string, continueInscription = false): void {
    // Verificar si se debe realizar una continuación directa
    const directContinuation = this.inscriptionStateService.isDirectContinuation();
    if (directContinuation) {
      console.log('[InscripcionButton] Continuación directa detectada');
      // Limpiar el flag para evitar que se use en futuras aperturas
      this.inscriptionStateService.clearDirectContinuation();
      // Forzar continuación
      continueInscription = true;
    }

    // Obtener la inscripción guardada si no se proporcionó un ID
    if (!inscriptionId) {
      // Intentar obtener desde el servicio de inscripción
      let inscripcionId: string | null = null;

      // Obtener las inscripciones actuales
      this.inscriptionService.inscriptions.subscribe(inscripciones => {
        const foundInscription = inscripciones.find((ins: { contestId: number; state: InscripcionState; id: string }) =>
          ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id) &&
          ins.state === InscripcionState.PENDING
        );
        if (foundInscription && foundInscription.id) {
          inscripcionId = foundInscription.id;
        }
      }).unsubscribe(); // Desuscribirse inmediatamente

      if (inscripcionId) {
        console.log('[InscripcionButton] Encontrada inscripción pendiente en el servicio:', inscripcionId);
        inscriptionId = inscripcionId;
        continueInscription = true;
      } else {
        // Intentar obtener desde el localStorage (método antiguo)
        const savedInscription = this.inscriptionStateService.getInProgressInscription();
        if (savedInscription && savedInscription.contestId === this.contest.id) {
          console.log('[InscripcionButton] Encontrada inscripción pendiente en localStorage:', savedInscription);
          inscriptionId = savedInscription.id;
          continueInscription = true;
        }
      }
    }

    // Construir los parámetros de consulta para la ruta
    const queryParams = {
      contestId: this.contest.id,
      inscriptionId: inscriptionId,
      continueInscription: continueInscription
    };

    // Navegar a la página de inscripción
    this.router.navigate(['/dashboard/inscripcion'], { queryParams });
  }
}
