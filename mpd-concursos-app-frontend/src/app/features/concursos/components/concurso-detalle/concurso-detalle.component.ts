import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
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
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (this.concurso) {
      this.verificarInscripcion();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarInscripcion(): void {
    if (!this.concurso) {
      console.warn('[ConcursoDetalleComponent] No hay concurso para verificar inscripción');
      return;
    }

    this.inscripcionLoading = true;
    this.inscriptionService.getInscriptionStatus(parseInt(this.concurso.id, 10))
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
        },
        error: (error) => {
          console.error('Error al verificar inscripción:', error);
          this.estaInscripto = false;
          this.snackBar.open(
            'No se pudo verificar el estado de la inscripción',
            'Cerrar',
            { duration: 3000 }
          );
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

  onCerrar(): void {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 300);
  }

  onInscripcionCompleta(concurso: Concurso): void {
    this.verificarInscripcion();
    this.inscripcionRealizada.emit(concurso);
  }
}
