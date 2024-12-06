import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import { InscripcionService } from '@core/services/inscripcion/inscripcion.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscripcionDialogComponent } from '../inscripcion-dialog/inscripcion-dialog.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionResponse } from '@shared/interfaces/inscripcion/inscripcion.interface';

@Component({
    selector: 'app-inscripcion-button',
    templateUrl: './inscripcion-button.component.html',
    styleUrls: ['./inscripcion-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ]
})
export class InscripcionButtonComponent implements OnInit {
    @Input() concurso!: Concurso;
    @Output() inscripcionComplete = new EventEmitter<string>();

    inscripcionState$!: Observable<InscripcionState>;
    loading = false;
    InscripcionState = InscripcionState; // Expose enum to template

    constructor(
        private inscripcionService: InscripcionService,
        private dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        this.inscripcionState$ = this.inscripcionService
            .obtenerEstadoInscripcion(this.concurso.id)
            .pipe(shareReplay(1));
    }

    async onInscribirse(): Promise<InscripcionResponse> {
        if (!this.concurso.id) {
            this.showError('ID de concurso no válido');
            return Promise.reject('ID de concurso no válido');
        }

        const elegibilidad = await firstValueFrom(this.inscripcionService.verificarElegibilidad(this.concurso.id));
        if (!elegibilidad.elegible) {
            this.mostrarDialogoNoElegible(elegibilidad.motivo || 'No cumple con los requisitos necesarios');
            return Promise.reject('No elegible');
        }

        const dialogRef = this.dialog.open(InscripcionDialogComponent, {
            data: { concurso: this.concurso },
            width: '500px',
            disableClose: true
        });

        const result = await dialogRef.afterClosed().toPromise();
        if (result) {
            this.loading = true;
            this.cdr.detectChanges();

            const response = await firstValueFrom(
                this.inscripcionService.inscribirse(this.concurso.id, result.documentos)
                    .pipe(finalize(() => {
                        this.loading = false;
                        this.cdr.detectChanges();
                    }))
            );

            this.showSuccess('Inscripción realizada con éxito');
            this.inscripcionComplete.emit(this.concurso.id);
            return response;
        }
        const response: InscripcionResponse = await firstValueFrom(this.inscripcionService.inscribirse(this.concurso.id));
        return response;
    }

    private mostrarDialogoNoElegible(motivo: string): void {
        this.showError(`No elegible: ${motivo}`);
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }
}
