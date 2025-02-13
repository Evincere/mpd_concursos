import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { InscripcionDialogComponent } from '../inscripcion-dialog/inscripcion-dialog.component';
import { InscripcionService } from '@core/services/inscripcion/inscripcion.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { animate, style, transition, trigger } from '@angular/animations';

export enum InscripcionState {
  NO_INSCRIPTO = 'NO_INSCRIPTO',
  CONFIRMADA = 'CONFIRMADA'
}

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InscripcionDialogComponent
  ],
  templateUrl: './inscripcion-button.component.html',
  styleUrls: ['./inscripcion-button.component.scss'],
  animations: [
    trigger('buttonState', [
      transition('idle => loading', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(0.95)' }))
      ]),
      transition('loading => idle', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class InscripcionButtonComponent implements OnInit {
  @Input() concurso!: Concurso;
  @Output() inscripcionComplete = new EventEmitter<Concurso>();

  loading = false;
  InscripcionState = InscripcionState;
  private inscripcionStateSubject = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  inscripcionState$: Observable<InscripcionState> = this.inscripcionStateSubject.asObservable();

  constructor(
    private dialog: MatDialog,
    private inscripcionService: InscripcionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.verificarEstadoInscripcion();
  }

  private verificarEstadoInscripcion() {
    this.inscripcionService.verificarInscripcion(this.concurso.id)
      .subscribe({
        next: (inscripto) => {
          this.inscripcionStateSubject.next(
            inscripto ? InscripcionState.CONFIRMADA : InscripcionState.NO_INSCRIPTO
          );
        },
        error: (error) => {
          console.error('Error al verificar inscripción:', error);
          this.inscripcionStateSubject.next(InscripcionState.NO_INSCRIPTO);
        }
      });
  }

  onInscribirse() {
    const dialogRef = this.dialog.open(InscripcionDialogComponent, {
      width: '500px',
      data: {
        concursoId: this.concurso.id,
        position: this.concurso.position,
        dependencia: this.concurso.dependencia
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.inscripcionService.inscribirseAConcurso(this.concurso.id)
          .subscribe({
            next: () => {
              this.inscripcionStateSubject.next(InscripcionState.CONFIRMADA);
              this.inscripcionComplete.emit(this.concurso);
            },
            error: (error) => {
              console.error('Error al realizar inscripción:', error);
              this.inscripcionStateSubject.next(InscripcionState.NO_INSCRIPTO);
            },
            complete: () => {
              this.loading = false;
            }
          });
      }
    });
  }
}
