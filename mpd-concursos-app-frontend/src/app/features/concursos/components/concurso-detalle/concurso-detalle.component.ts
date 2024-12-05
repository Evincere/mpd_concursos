import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-concurso-detalle',
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule,
    MatDialogModule
  ],
  host: {
    'class': 'concurso-detalle-panel'
  }
})
export class ConcursoDetalleComponent {
  @Input() concurso!: Concurso;
  @Output() cerrarDetalle = new EventEmitter<void>();

  onCerrar() {
    this.cerrarDetalle.emit();
  }

  getEstadoConcursoLabel(estado: string): string {
    switch (estado) {
      case 'PUBLISHED':
        return 'Publicado';
      case 'DRAFT':
        return 'Borrador';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return estado;
    }
  }
}
