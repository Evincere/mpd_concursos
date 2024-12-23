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
    DatePipe
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

  openInscripcionDialog() {
    if (!this.concurso) {
      console.error('No hay datos del concurso disponibles');
      return;
    }

    if (this.estaInscripto) {
      this.snackBar.open('Ya te encuentras inscripto en este concurso', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.realizarInscripcion();
  }

  realizarInscripcion(): void {
    if (!this.concurso) {
      console.warn('[ConcursoDetalleComponent] No hay concurso para realizar inscripción');
      return;
    }

    if (!this.concurso.id) {
      console.warn('[ConcursoDetalleComponent] El concurso no tiene ID');
      this.snackBar.open('Error al realizar la inscripción', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (this.estaInscripto) {
      this.snackBar.open('Ya te encuentras inscripto en este concurso', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (this.concurso.status !== 'PUBLISHED') {
      this.snackBar.open('Este concurso no está disponible para inscripción', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log('[ConcursoDetalleComponent] Iniciando inscripción al concurso:', this.concurso.id);
    this.inscripcionLoading = true;
    this.inscripcionService.inscribirseAConcurso(this.concurso.id.toString())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.inscripcionLoading = false)
      )
      .subscribe({
        next: () => {
          this.estaInscripto = true;
          this.inscripcionRealizada.emit(this.concurso);
          this.snackBar.open(
            `Te has inscrito exitosamente al concurso "${this.concurso?.title}"`,
            'Cerrar',
            { duration: 3000 }
          );
          // Refrescar el estado después de inscribirse
          this.verificarInscripcion();
        },
        error: (error: Error) => {
          console.error('[ConcursoDetalleComponent] Error al realizar inscripción:', error);
          let mensaje = 'Error al realizar la inscripción. Por favor, intenta nuevamente.';
          
          if (error.message.includes('no autenticado')) {
            mensaje = 'Debes iniciar sesión para inscribirte al concurso.';
          }
          
          this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        }
      });
  }

  onCerrar() {
    this.closing = true;
    setTimeout(() => this.cerrarDetalle.emit(), 300);
  }
}
