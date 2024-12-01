import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Postulacion, ContestStatus, PostulationStatus } from '@shared/interfaces/postulacion/postulacion.interface';

@Component({
  selector: 'app-postulacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './postulacion-detalle.component.html',
  styleUrls: ['./postulacion-detalle.component.scss']
})
export class PostulacionDetalleComponent {
  constructor(
    public dialogRef: MatDialogRef<PostulacionDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public postulacion: Postulacion
  ) {}

  getEstadoPostulacionLabel(status: PostulationStatus | undefined): string {
    if (!status) return 'Desconocido';
    
    const labels = {
      [PostulationStatus.PENDING]: 'Pendiente',
      [PostulationStatus.ACCEPTED]: 'Aceptada',
      [PostulationStatus.REJECTED]: 'Rechazada'
    };
    return labels[status] || 'Desconocido';
  }

  getEstadoConcursoLabel(status: ContestStatus | undefined): string {
    if (!status) return 'Desconocido';

    const labels = {
      [ContestStatus.OPEN]: 'Abierto',
      [ContestStatus.CLOSED]: 'Cerrado',
      [ContestStatus.IN_PROCESS]: 'En Proceso',
      [ContestStatus.FAILED]: 'Fracasado',
      [ContestStatus.FINISHED]: 'Finalizado'
    };
    return labels[status] || 'Desconocido';
  }

  getEstadoPostulacionClass(status: PostulationStatus | undefined): string {
    if (!status) return 'status-unknown';
    
    const classes = {
      [PostulationStatus.PENDING]: 'status-pending',
      [PostulationStatus.ACCEPTED]: 'status-accepted',
      [PostulationStatus.REJECTED]: 'status-rejected'
    };
    return classes[status] || 'status-unknown';
  }

  getEstadoConcursoClass(status: ContestStatus | undefined): string {
    if (!status) return 'status-unknown';
    
    const classes = {
      [ContestStatus.OPEN]: 'status-open',
      [ContestStatus.CLOSED]: 'status-closed',
      [ContestStatus.IN_PROCESS]: 'status-in-process',
      [ContestStatus.FAILED]: 'status-failed',
      [ContestStatus.FINISHED]: 'status-finished'
    };
    return classes[status] || 'status-unknown';
  }

  getResultadoSeleccion(postulacion: Postulacion): string {
    if (!postulacion.contest?.results?.selected) {
      return 'No Seleccionado';
    }
    return 'Seleccionado';
  }

  isResultadoVisible(postulacion: Postulacion): boolean {
    return postulacion.contest?.results?.selected !== undefined;
  }

  getFinalPosition(postulacion: Postulacion): string | null {
    const results = postulacion.contest?.results;
    if (results?.finalPosition && results?.totalParticipants) {
      return `${results.finalPosition} de ${results.totalParticipants}`;
    }
    return null;
  }

  getResolutionFile(): string | undefined {
    return this.postulacion?.contest?.resolution?.file;
  }

  getRequirementsFile(): string | undefined {
    return this.postulacion?.contest?.requirements?.file;
  }

  getResolutionNumber(): string | undefined {
    return this.postulacion?.contest?.resolution?.number;
  }

  hasResolutionFile(): boolean {
    return !!this.getResolutionFile();
  }

  hasRequirementsFile(): boolean {
    return !!this.getRequirementsFile();
  }

  descargarDocumento(url: string | undefined, filename: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
