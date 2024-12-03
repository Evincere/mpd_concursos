import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-postulacion-detalle',
  templateUrl: './postulacion-detalle.component.html',
  styleUrls: ['./postulacion-detalle.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class PostulacionDetalleComponent {
  @Input() postulacion: any; // TODO: Definir interface para postulación
  @Input() concurso: any;    // TODO: Definir interface para concurso
  @Output() cerrarDetalle = new EventEmitter<void>();

  onCerrar() {
    this.cerrarDetalle.emit();
  }

  descargarDocumento(doc: any) {
    // TODO: Implementar descarga de documento
    console.log('Descargando documento:', doc);
  }

  eliminarDocumento(doc: any) {
    // TODO: Implementar eliminación de documento
    console.log('Eliminando documento:', doc);
  }
}
