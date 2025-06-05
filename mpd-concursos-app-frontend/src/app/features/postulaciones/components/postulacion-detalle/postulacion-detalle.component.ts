import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Postulacion, AttachedDocument } from '@shared/interfaces/postulacion/postulacion.interface';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';

@Component({
  selector: 'app-postulacion-detalle',
  templateUrl: './postulacion-detalle.component.html',
  styleUrls: ['./postulacion-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
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
    // Convertir string a enum si es posible
    const enumValue = Object.values(InscripcionState).find(value => value === estado);
    if (enumValue) {
      return InscripcionStateUtils.getStateLabel(enumValue as InscripcionState);
    }

    // Fallback para estados no reconocidos
    switch (estado) {
      case 'PENDING':
        return 'En proceso';
      case 'CONFIRMADA':
        return 'Pendiente';
      case 'INSCRIPTO':
      case 'APPROVED':
      case 'ACCEPTED':
        return 'Inscripto';
      case 'REJECTED':
        return 'Rechazada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return estado;
    }
  }
}
