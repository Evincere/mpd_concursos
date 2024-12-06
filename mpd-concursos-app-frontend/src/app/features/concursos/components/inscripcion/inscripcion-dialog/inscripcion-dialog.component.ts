import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';

@Component({
    selector: 'app-inscripcion-dialog',
    templateUrl: './inscripcion-dialog.component.html',
    styleUrls: ['./inscripcion-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule
    ]
})
export class InscripcionDialogComponent {
    concurso: Concurso;

    constructor(
        private dialogRef: MatDialogRef<InscripcionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { concurso: Concurso }
    ) {
        this.concurso = data.concurso;
    }

    confirmar(): void {
        this.dialogRef.close(true);
    }

    cancelar(): void {
        this.dialogRef.close(false);
    }
}
