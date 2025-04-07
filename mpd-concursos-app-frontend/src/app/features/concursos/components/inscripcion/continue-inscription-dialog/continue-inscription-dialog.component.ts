import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-continue-inscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Continuar inscripción</h2>
    <mat-dialog-content>
      <div class="dialog-content">
        <mat-icon class="info-icon">info</mat-icon>
        <div class="message">
          <p>Tienes una inscripción en proceso para el concurso "{{ data.contestTitle }}".</p>
          <p>¿Deseas continuar donde lo dejaste?</p>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>No, empezar de nuevo</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Sí, continuar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      align-items: flex-start;
      margin: 16px 0;
    }
    .info-icon {
      color: #3f51b5;
      margin-right: 16px;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    .message {
      flex: 1;
    }
    p {
      margin: 8px 0;
    }
  `]
})
export class ContinueInscriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ContinueInscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      contestId: number; 
      contestTitle: string;
      inscriptionId: string;
    }
  ) {}
}
