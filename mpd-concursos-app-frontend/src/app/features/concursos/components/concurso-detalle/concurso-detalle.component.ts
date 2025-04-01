import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { finalize } from 'rxjs/operators';
import { Concurso, Contest } from '@shared/interfaces/concurso/concurso.interface';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { BehaviorSubject } from 'rxjs';

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
    MatTabsModule,
    DatePipe,
    InscripcionButtonComponent
  ],
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss']
})
export class ConcursoDetalleComponent implements OnInit, OnDestroy {
  @Input() concurso!: Contest;
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();

  closing = false;
  inscripcionLoading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  InscripcionState = InscripcionState;
  private destroy$ = new Subject<void>();

  constructor(
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (this.concurso) {
      this.verificarInscripcion();
      // Inicializar URLs temporales para los documentos
      if (!this.concurso.basesUrl) {
        this.concurso.basesUrl = '#'; // URL temporal
      }
      if (!this.concurso.descriptionUrl) {
        this.concurso.descriptionUrl = '#'; // URL temporal
      }

      // Inicializar fechas si no existen
      if (!this.concurso.dates) {
        this.concurso.dates = this.getDefaultDates();
      }
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
    // Convertir el ID a número
    const concursoId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id, 10) : this.concurso.id;

    this.inscriptionService.getInscriptionStatus(concursoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.inscripcionLoading = false;
          console.log('Finalizada verificación de inscripción');
        })
      )
      .subscribe({
        next: (estado) => {
          console.log('Estado de inscripción actualizado:', estado);
          this.inscripcionState$.next(estado);
        },
        error: (error) => {
          console.error('Error al verificar inscripción:', error);
          this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
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
      'ACTIVE': 'Activo',
      'CLOSED': 'Cerrado',
      'IN_PROGRESS': 'En Proceso',
      'DRAFT': 'Borrador',
      'CANCELLED': 'Cancelado'
    };
    return estados[status] || status;
  }

  onCerrar(): void {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 300);
  }

  onInscriptionComplete(concurso: Concurso): void {
    this.verificarInscripcion();
    this.inscriptionComplete.emit(concurso);
  }

  private getDefaultDates(): ContestDate[] {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 15);

    return [
      {
        label: 'Fecha de Inscripción',
        startDate: today,
        endDate: endDate,
        type: 'inscription'
      }
    ];
  }
}
