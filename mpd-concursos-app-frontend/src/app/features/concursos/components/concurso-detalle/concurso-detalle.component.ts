import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InscripcionService } from '../../../../core/services/inscripcion/inscripcion.service';
import { finalize } from 'rxjs/operators';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';

@Component({
  selector: 'app-concurso-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    DatePipe,
    InscripcionButtonComponent
  ],
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss']
})
export class ConcursoDetalleComponent implements OnInit, OnDestroy {
  @Input() concurso!: Concurso;
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscripcionRealizada = new EventEmitter<Concurso>();

  closing = false;
  inscripcionLoading = false;
  estaInscripto = false;
  private destroy$ = new Subject<void>();

  constructor(
    private inscripcionService: InscripcionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    console.log('Concurso recibido:', this.concurso);
    if (this.concurso) {
      this.verificarInscripcion();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarInscripcion(): void {
    if (!this.concurso) {
      console.warn('[ConcursoDetalleComponent] No hay concurso para verificar inscripción');
      return;
    }

    this.inscripcionLoading = true;
    this.inscripcionService.verificarInscripcion(this.concurso.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.inscripcionLoading = false;
          console.log('Finalizada verificación de inscripción');
        })
      )
      .subscribe({
        next: (inscripto) => {
          console.log('Estado de inscripción actualizado:', inscripto);
          this.estaInscripto = inscripto;
          // Refrescar la lista de inscripciones si está inscripto
          if (inscripto) {
            this.inscripcionService.refreshInscripciones();
          }
        },
        error: (error) => {
          console.error('Error al verificar inscripción:', error);
          this.estaInscripto = false;
        }
      });
  }

  getEstadoConcursoLabel(status: string): string {
    const estados: { [key: string]: string } = {
      'PUBLISHED': 'Publicado',
      'DRAFT': 'Borrador',
      'CLOSED': 'Cerrado'
    };
    return estados[status] || status;
  }

  onInscriptionComplete(concurso: Concurso): void {
    // Emitir el evento al componente padre
    this.inscripcionRealizada.emit(concurso);
    
    // Actualizar el estado local si es necesario
    this.estaInscripto = true;
    
    // Opcionalmente cerrar el detalle
    setTimeout(() => this.onCerrar(), 1500);
  }

  onCerrar() {
    this.closing = true;
    setTimeout(() => this.cerrarDetalle.emit(), 300);
  }
}
