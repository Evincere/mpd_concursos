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
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
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
  template: `
    <ng-container *ngIf="inscripcionState$ | async as estado">
      <button 
        mat-flat-button
        color="primary"
        class="inscripcion-button"
        [class.loading]="loading"
        [class.inscripto]="estado === InscripcionState.CONFIRMADA"
        [disabled]="loading || estado === InscripcionState.CONFIRMADA"
        (click)="onInscribirse()">
        <ng-container *ngIf="!loading && estado !== InscripcionState.CONFIRMADA">
          <mat-icon>how_to_reg</mat-icon>
          <span>Inscribirse</span>
        </ng-container>
        
        <ng-container *ngIf="loading">
          <mat-spinner diameter="20"></mat-spinner>
          <span>Procesando...</span>
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
export class InscripcionButtonComponent implements OnInit {
  @Input() contest!: Contest;
  @Output() inscriptionComplete = new EventEmitter<Contest>();

  loading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  InscripcionState = InscripcionState;

  constructor(
    private inscriptionService: InscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.verificarEstadoInscripcion();
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
          this.snackBar.open(
            'Error al iniciar el proceso de inscripción',
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
  }

  private abrirDialogoInscripcion(): void {
    const dialogRef = this.dialog.open(InscripcionDialogComponent, {
      width: '800px',
      height: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'glassmorphism-dialog',
      disableClose: true,
      data: this.contest
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
