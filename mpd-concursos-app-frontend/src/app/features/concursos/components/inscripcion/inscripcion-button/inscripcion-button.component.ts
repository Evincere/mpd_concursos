import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { InscripcionDialogComponent } from '../inscripcion-dialog/inscripcion-dialog.component';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService, IInscriptionFormState } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { finalize, takeUntil } from 'rxjs/operators';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { ContinueInscriptionDialogComponent } from '../continue-inscription-dialog/continue-inscription-dialog.component';

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
        color="primary"
        class="inscripcion-button"
        [class.loading]="loading"
        [class.inscripto]="estado === InscripcionState.CONFIRMADA"
        [class.pending]="estado === InscripcionState.PENDING"
        [disabled]="loading || estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDING"
        (click)="onInscribirse()">
        <ng-container *ngIf="!loading && estado !== InscripcionState.CONFIRMADA && estado !== InscripcionState.PENDING">
          <mat-icon>how_to_reg</mat-icon>
          <span>Inscribirse</span>
        </ng-container>

        <ng-container *ngIf="loading">
          <mat-spinner diameter="20"></mat-spinner>
          <span>Procesando...</span>
        </ng-container>

        <ng-container *ngIf="estado === InscripcionState.PENDING">
          <mat-icon>pending</mat-icon>
          <span>En proceso</span>
        </ng-container>

        <ng-container *ngIf="estado === InscripcionState.CONFIRMADA">
          <mat-icon>check_circle</mat-icon>
          <span>Inscripto</span>
        </ng-container>
      </button>
    </ng-container>
  `,
  styles: [`
    .inscripcion-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      height: 36px;

      &.loading {
        opacity: 0.8;
        cursor: not-allowed;
      }

      &.inscripto {
        background: rgba(76, 175, 80, 0.12);
        color: #4CAF50;
        pointer-events: none;

        mat-icon {
          color: #4CAF50;
        }
      }

      &.pending {
        background: rgba(255, 193, 7, 0.12);
        color: #FFC107;
        pointer-events: none;

        mat-icon {
          color: #FFC107;
        }
      }

      mat-spinner {
        margin-right: 8px;
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
    private inscriptionRecoveryService: InscriptionRecoveryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarEstadoInscripcion();

    // Verificar si hay una inscripción en progreso para este concurso
    // Primero verificamos con el nuevo método
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    const incompleteInscription = incompleteInscriptions.find(ins =>
      ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id)
    );

    if (incompleteInscription) {
      console.log('[InscripcionButton] Encontrada inscripción incompleta para este concurso:', incompleteInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === incompleteInscription.inscriptionId) {
        console.log('[InscripcionButton] Detectada redirección desde documentación, abriendo diálogo automáticamente');

        // Abrir el diálogo automáticamente
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

        // Abrir el diálogo automáticamente
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
   */
  private mostrarDialogoContinuarInscripcion(inscription: IInscriptionFormState): void {
    const dialogRef = this.dialog.open(ContinueInscriptionDialogComponent, {
      width: '400px',
      data: {
        contestId: inscription.contestId,
        contestTitle: inscription.contestTitle || this.contest.title || this.contest.position,
        inscriptionId: inscription.inscriptionId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si el usuario quiere continuar, abrir el diálogo de inscripción
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

  private verificarEstadoInscripcion(): void {
    if (!this.contest) return;

    this.loading = true;
    this.inscriptionService.getInscriptionStatus(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (estado) => {
          this.inscripcionState$.next(estado);
          if (estado === InscripcionState.CONFIRMADA) {
            this.snackBar.open('Ya estás inscrito en este concurso', 'Cerrar', {
              duration: 3000
            });
          }
        },
        error: (error) => {
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
        next: (response) => {
          console.log('Inscripción inicial creada:', response);
          this.abrirDialogoInscripcion();
        },
        error: (error) => {
          console.error('Error al crear inscripción:', error);

          // Verificar si es un error de inscripción cancelada
          if (error.message && error.message.includes('Ya existe una inscripción')) {
            this.snackBar.open(
              'Ya existe una inscripción para este concurso. Actualizando estado...',
              'Cerrar',
              { duration: 5000 }
            );

            // Forzar actualización del estado
            setTimeout(() => {
              this.verificarEstadoInscripcion();
            }, 2000);
          } else {
            this.snackBar.open(
              'Error al iniciar el proceso de inscripción: ' + (error.message || 'Error desconocido'),
              'Cerrar',
              { duration: 5000 }
            );
          }
        }
      });
  }

  private abrirDialogoInscripcion(inscriptionId?: string, continueInscription: boolean = false): void {
    console.log('[InscripcionButton] Abriendo diálogo de inscripción:', { inscriptionId, continueInscription });

    // Obtener la inscripción guardada si no se proporcionó un ID
    if (!inscriptionId) {
      // Intentar obtener desde el servicio de inscripción
      let inscripcionActual: any = null;

      // Obtener las inscripciones actuales
      this.inscriptionService.inscriptions.subscribe(inscripciones => {
        inscripcionActual = inscripciones.find((ins: any) =>
          ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id) &&
          ins.state === InscripcionState.PENDING
        );
      }).unsubscribe(); // Desuscribirse inmediatamente

      if (inscripcionActual) {
        console.log('[InscripcionButton] Encontrada inscripción pendiente en el servicio:', inscripcionActual);
        inscriptionId = inscripcionActual.id;
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

    const dialogRef = this.dialog.open(InscripcionDialogComponent, {
      width: '800px',
      height: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'glassmorphism-dialog',
      disableClose: true,
      data: {
        contest: this.contest,
        inscriptionId: inscriptionId,
        continueInscription: continueInscription
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inscriptionComplete.emit(this.contest);
        this.verificarEstadoInscripcion();
        this.snackBar.open(
          'Inscripción completada exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }
}
