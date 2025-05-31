import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Contest } from '@shared/interfaces/concurso/concurso.interface';



import { InscripcionProcessComponent } from '../containers/inscripcion-process/inscripcion-process.component';

@Component({
  selector: 'app-inscripcion-container',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="inscripcion-container">
      <div class="loading-message" *ngIf="!dialogOpened">
        <p>Cargando proceso de inscripción...</p>
      </div>
    </div>
  `,
  styles: [`
    .inscripcion-container {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
    }

    .loading-message {
      color: white;
      font-size: 16px;
    }
  `]
})
export class InscripcionContainerComponent implements OnInit {
  @Input() contest!: Contest;
  @Output() inscriptionCompleted = new EventEmitter<void>();

  dialogOpened = false;

  

  ngOnInit(): void {
    // Abrir el diálogo de inscripción después de un breve retraso
    setTimeout(() => {
      this.openInscripcionDialog();
    }, 300);
  }

  openInscripcionDialog(): void {
    this.dialogOpened = true;

    const dialogRef = this.dialog.open(InscripcionProcessComponent, {
      width: '90%',
      height: '90%',
      maxWidth: '1200px',
      maxHeight: '800px',
      panelClass: ['inscription-dialog'],
      disableClose: true,
      hasBackdrop: true,
      data: {
        contest: this.contest
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('[InscripcionContainer] Diálogo de inscripción cerrado con resultado:', result);

      if (result === true) {
        // La inscripción se completó exitosamente
        this.snackBar.open('Inscripción completada exitosamente', 'Cerrar', {
          duration: 3000
        });
        this.inscriptionCompleted.emit();
      }

      this.dialogOpened = false;
    });
  }
}