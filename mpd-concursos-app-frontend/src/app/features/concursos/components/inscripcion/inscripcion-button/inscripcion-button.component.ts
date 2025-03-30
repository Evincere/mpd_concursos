import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { InscripcionDialogComponent } from '../inscripcion-dialog/inscripcion-dialog.component';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { finalize } from 'rxjs/operators';

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
  templateUrl: './inscripcion-button.component.html',
  styleUrls: ['./inscripcion-button.component.scss'],
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
export class InscripcionButtonComponent implements OnInit {
  @Input() concurso!: Concurso;
  @Output() inscripcionCompleta = new EventEmitter<Concurso>();

  loading = false;
  InscripcionState = InscripcionState;
  private inscripcionStateSubject = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  inscripcionState$ = this.inscripcionStateSubject.asObservable();

  constructor(
    private inscriptionService: InscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarEstadoInscripcion();
  }

  private verificarEstadoInscripcion() {
    if (!this.concurso) {
      console.warn('No hay concurso seleccionado para verificar inscripción');
      return;
    }

    this.loading = true;
    this.inscriptionService.getInscriptionStatus(this.concurso.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (inscripto) => {
          this.inscripcionStateSubject.next(
            inscripto ? InscripcionState.CONFIRMADA : InscripcionState.NO_INSCRIPTO
          );
        },
        error: (error) => {
          console.error('Error al verificar inscripción:', error);
          this.inscripcionStateSubject.next(InscripcionState.NO_INSCRIPTO);
          this.snackBar.open(
            'No se pudo verificar el estado de la inscripción',
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
  }

  onInscribirse() {
    if (!this.concurso) {
      console.warn('No hay concurso seleccionado para inscribirse');
      return;
    }

    this.loading = true;
    this.inscriptionService.createInscription(this.concurso.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Inscripción exitosa:', response);
          this.inscripcionStateSubject.next(InscripcionState.CONFIRMADA);
          this.inscripcionCompleta.emit(this.concurso);
          this.snackBar.open(
            'Te has inscrito exitosamente al concurso',
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('Error al inscribirse:', error);
          this.inscripcionStateSubject.next(InscripcionState.NO_INSCRIPTO);
          this.snackBar.open(
            'Error al realizar la inscripción',
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
  }
}
