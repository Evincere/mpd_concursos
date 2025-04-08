import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, style, transition, trigger } from '@angular/animations';
import { Postulacion, AttachedDocument } from '@shared/interfaces/postulacion/postulacion.interface';

@Component({
  selector: 'app-postulacion-detalle',
  templateUrl: './postulacion-detalle.component.html',
  styleUrls: ['./postulacion-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
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
    'class': 'postulacion-detalle-panel',
    '[@slidePanel]': ''
  }
})
export class PostulacionDetalleComponent {
  @Input() postulacion!: Postulacion;
  @Output() cerrarDetalle = new EventEmitter<void>();

  closing = false;

  onCerrar() {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 300);
  }

  descargarDocumento(doc: AttachedDocument) {
    // TODO: Implementar descarga de documento usando doc.url
    console.log('Descargando documento:', doc);
  }

  eliminarDocumento(doc: AttachedDocument) {
    // TODO: Implementar eliminación de documento
    console.log('Eliminando documento:', doc);
  }

  getEstadoPostulacionLabel(estado: string): string {
    switch (estado) {
      case 'PENDING':
        return 'En proceso'; // Inscripción interrumpida
      case 'CONFIRMADA':
        return 'Pendiente'; // Inscripción completada por el usuario, pendiente de validación
      case 'INSCRIPTO':
      case 'APPROVED':
      case 'ACCEPTED':
        return 'Inscripto'; // Inscripción validada por el administrador
      case 'REJECTED':
        return 'Rechazada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return estado;
    }
  }
}
