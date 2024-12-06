import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { MatDialogModule } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';

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
    '[@slidePanel]': 'true'
  }
})
export class ConcursoDetalleComponent {
  @Input() concurso!: Concurso;
  @Output() cerrarDetalle = new EventEmitter<void>();
  closing = false;

  onCerrar() {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 400); // Mismo tiempo que la duración de la animación
  }

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

  onInscriptionComplete() {
    // Aquí podrías actualizar el estado del concurso si es necesario
    // o mostrar algún mensaje de éxito adicional
  }
}
