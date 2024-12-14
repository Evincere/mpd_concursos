import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InscripcionDialogComponent } from '../inscripcion-dialog/inscripcion-dialog.component';
import { InscripcionService } from '@core/services/inscripcion/inscripcion.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule,
    MatSnackBarModule,
    InscripcionDialogComponent
  ],
  template: `
    <button mat-raised-button 
            class="inscripcion-button"
            [class.loading]="loading"
            [disabled]="loading"
            (click)="onInscribirse()"
            [@buttonState]="loading ? 'loading' : 'idle'">
      <mat-icon class="icon-animate">how_to_reg</mat-icon>
      <span class="button-text">{{ loading ? 'Procesando...' : 'Inscribirse' }}</span>
    </button>
  `,
  styles: [`
    .inscripcion-button {
      min-width: 160px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 24px;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      border: none;
      border-radius: 22px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &:not([disabled]):hover {
        background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

        .icon-animate {
          transform: scale(1.1) rotate(10deg);
        }
      }

      &:not([disabled]):active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
      }

      &.loading {
        background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
        pointer-events: none;

        .icon-animate {
          animation: spin 1.5s linear infinite;
        }
      }

      &[disabled] {
        background: #666666;
        cursor: not-allowed;
      }

      .icon-animate {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .button-text {
        font-size: 15px;
        white-space: nowrap;
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: left 0.5s;
      }

      &:not([disabled]):hover::before {
        left: 100%;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `],
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
export class InscripcionButtonComponent {
  @Input() concurso!: Concurso;
  @Output() inscripcionComplete = new EventEmitter<Concurso>();
  
  loading = false;

  constructor(
    private dialog: MatDialog,
    private inscripcionService: InscripcionService,
    private snackBar: MatSnackBar
  ) {}

  onInscribirse() {
    const dialogRef = this.dialog.open(InscripcionDialogComponent, {
      width: '500px',
      data: { concursoId: this.concurso.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.inscripcionService.inscribirseAConcurso(this.concurso.id)
          .subscribe({
            next: () => {
              this.snackBar.open('Inscripción realizada con éxito', 'Cerrar', {
                duration: 3000
              });
              this.inscripcionComplete.emit(this.concurso);
            },
            error: (error) => {
              this.snackBar.open(
                error.error?.message || 'Error al procesar la inscripción', 
                'Cerrar', 
                { duration: 5000 }
              );
            },
            complete: () => {
              this.loading = false;
            }
          });
      }
    });
  }
}
