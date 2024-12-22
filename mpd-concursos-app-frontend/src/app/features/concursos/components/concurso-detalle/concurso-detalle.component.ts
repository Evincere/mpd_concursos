import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionDialogComponent } from '../inscripcion/inscripcion-dialog/inscripcion-dialog.component';

@Component({
  selector: 'app-concurso-detalle',
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    InscripcionButtonComponent
  ],
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ],
  host: {
    'class': 'concurso-detalle-panel',
    '[@slidePanel]': ''
  }
})
export class ConcursoDetalleComponent {
  @Input() concurso!: Concurso;
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscripcionRealizada = new EventEmitter<Concurso>();
  
  private dialogRef!: MatDialogRef<InscripcionDialogComponent> | null;

  closing = false;

  constructor(private dialog: MatDialog) { }

  getEstadoConcursoLabel(estado: string): string {
    switch (estado) {
      case 'PUBLISHED':
        return 'Publicado';
      case 'DRAFT':
        return 'Borrador';
      case 'CLOSED':
        return 'Cerrado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  openInscripcionDialog() {
    this.dialogRef = this.dialog.open(InscripcionDialogComponent, {
      width: '500px',
      data: { concursoId: this.concurso.id, position: this.concurso.position, dependencia: this.concurso.dependencia },
      position: {
        top: '11%',
        left: '15%'
      }
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null; // Limpiar la referencia al cerrar
    });
  }

  private closeAllDialogs() {
    // Cerrar el diálogo de inscripción si está abierto
    if (this.dialogRef) {
      this.dialogRef.close(false);
      this.dialogRef = null;
    }
    
    // Cerrar cualquier otro diálogo abierto
    this.dialog.closeAll();
  }

  onCerrar() {
    this.closing = true;
    
    // Cerrar todos los diálogos abiertos
    this.closeAllDialogs();

    // Cerrar la ventana de detalle con la animación
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 400);
  }

  onInscriptionComplete(concurso: Concurso) {
    this.inscripcionRealizada.emit(concurso);
  }
}
