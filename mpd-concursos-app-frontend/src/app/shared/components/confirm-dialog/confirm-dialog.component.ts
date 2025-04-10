import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  confirmButtonText: string;
  cancelButtonText: string;
  html?: boolean; // Permite mostrar HTML en el mensaje
  tipoDatos?: 'educacion' | 'experiencia'; // Para aplicar estilos específicos
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog" [ngClass]="{'data-view': data.tipoDatos}">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>warning</mat-icon>
        {{ data.titulo }}
      </h2>
      <mat-dialog-content class="dialog-content">
        <div *ngIf="data.html" [innerHTML]="data.mensaje"></div>
        <div *ngIf="!data.html">{{ data.mensaje }}</div>
      </mat-dialog-content>
      <mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          class="cancel-button" 
          (click)="onCancel()"
          *ngIf="data.cancelButtonText">
          {{ data.cancelButtonText }}
        </button>
        <button 
          mat-button 
          class="confirm-button"
          (click)="onConfirm()">
          {{ data.confirmButtonText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Asegurar que html es verdadero si se proporciona tipoDatos
    if (this.data.tipoDatos && !this.data.html) {
      this.data.html = true;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
