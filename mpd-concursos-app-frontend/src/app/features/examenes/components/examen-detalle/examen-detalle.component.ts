import { Component, Input } from '@angular/core';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';

@Component({
  selector: 'app-examen-detalle',
  templateUrl: './examen-detalle.component.html',
  styleUrls: ['./examen-detalle.component.scss']
})
export class ExamenDetalleComponent {
  @Input() examen!: Examen;

  getEstadoClass(): string {
    if (!this.examen) return '';
    
    switch (this.examen.estado) {
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'en-curso';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'anulado';
      case ESTADO_EXAMEN.PENDIENTE:
        return 'pendiente';
      default:
        return '';
    }
  }
}
