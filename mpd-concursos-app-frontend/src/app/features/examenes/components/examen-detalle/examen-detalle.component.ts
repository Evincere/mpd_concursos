import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { Examen, ESTADO_EXAMEN, TipoExamen } from '@shared/interfaces/examen/examen.interface';

@Component({
  selector: 'app-examen-detalle',
  templateUrl: './examen-detalle.component.html',
  styleUrls: ['./examen-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatListModule
  ]
})
export class ExamenDetalleComponent {
  @Input() examen!: Examen;
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;

  constructor(private router: Router) {}

  iniciarExamen(): void {
    if (this.examen && this.examen.id) {
      this.router.navigate(['/dashboard/examenes', this.examen.id, 'rendir']);
    }
  }

  obtenerClaseTipo(): string {
    if (!this.examen) return '';
    return this.examen.tipo.toLowerCase();
  }

  getEstadoLabel(estado: ESTADO_EXAMEN): string {
    switch (estado) {
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'Disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'En Curso';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'Finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'Anulado';
      case ESTADO_EXAMEN.BORRADOR:
        return 'Borrador';
      default:
        return '';
    }
  }

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
      case ESTADO_EXAMEN.BORRADOR:
        return 'borrador';
      default:
        return '';
    }
  }

  getInfraccionIcono(infraccion: string): string {
    switch (infraccion) {
      case 'NAVEGACION_SALIDA':
        return 'exit_to_app';
      case 'PERDIDA_FOCO':
        return 'visibility_off';
      case 'INTENTO_COPIA':
        return 'content_copy';
      case 'INTENTO_PEGADO':
        return 'content_paste';
      default:
        return 'warning';
    }
  }

  getInfraccionLabel(infraccion: string): string {
    switch (infraccion) {
      case 'NAVEGACION_SALIDA':
        return 'Navegación fuera del examen';
      case 'PERDIDA_FOCO':
        return 'Pérdida de foco de la ventana';
      case 'INTENTO_COPIA':
        return 'Intento de copia de contenido';
      case 'INTENTO_PEGADO':
        return 'Intento de pegar contenido';
      default:
        return 'Infracción no especificada';
    }
  }

  presentarRecurso(): void {
    // TODO: Implementar lógica para presentar recurso
    console.log('Presentar recurso de apelación');
  }
}
