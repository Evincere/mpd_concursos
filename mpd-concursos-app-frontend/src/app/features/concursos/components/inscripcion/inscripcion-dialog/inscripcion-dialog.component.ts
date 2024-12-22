import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './inscripcion-dialog.component.html',
  styleUrls: ['./inscripcion-dialog.component.scss']
})
export class InscripcionDialogComponent {
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<InscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      position: string;
      dependencia: string;
    }
  ) {
    this.dialogRef.disableClose = true;
  }

  confirmar(): void {
    this.loading = true;
    setTimeout(() => {
      this.dialogRef.close(true);
    });
  }

  cancelar(): void {
    if (!this.loading) {
      this.dialogRef.close(false);
    }
  }
}
