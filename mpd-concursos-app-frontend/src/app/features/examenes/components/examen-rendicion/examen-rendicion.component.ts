import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamenRendicionService } from '@core/services/examenes/examen-rendicion.service';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { OpcionRespuesta, Pregunta, RespuestaUsuario, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatListModule } from '@angular/material/list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatListOption } from '@angular/material/list';

@Component({
  selector: 'app-examen-rendicion',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatListModule,
    DragDropModule
  ],
  templateUrl: './examen-rendicion.component.html',
  styleUrls: ['./examen-rendicion.component.scss']
})
export class ExamenRendicionComponent implements OnInit, OnDestroy {
  preguntaActual: Pregunta | null = null;
  preguntas: Pregunta[] = [];
  tiempoRestante: number = 0;
  private destroy$ = new Subject<void>();
  opcionesOrdenadas: OpcionRespuesta[] = [];

  constructor(
    private examenService: ExamenRendicionService,
    private examenesService: ExamenesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const examenId = this.route.snapshot.params['id'];
    if (!examenId) {
      this.router.navigate(['/dashboard/examenes']);
      return;
    }

    this.examenesService.getPreguntas(examenId).subscribe(preguntas => {
      this.preguntas = preguntas;
      this.examenService.iniciarExamen(examenId, preguntas);
    });

    this.examenService.getPreguntaActual()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pregunta => {
        this.preguntaActual = pregunta;
        if (pregunta?.tipo === TipoPregunta.ORDENAMIENTO) {
          this.opcionesOrdenadas = Array.from(pregunta.opciones || []);
        }
      });

    this.examenService.getTiempoRestante()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tiempo => this.tiempoRestante = tiempo);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  guardarRespuestaTexto(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.guardarRespuesta(target.value);
    }
  }

  guardarRespuesta(respuesta: string | string[]): void {
    if (!this.preguntaActual) return;

    const respuestaUsuario: RespuestaUsuario = {
      preguntaId: this.preguntaActual.id,
      respuesta,
      timestamp: new Date().toISOString()
    };

    this.examenService.guardarRespuesta(respuestaUsuario);
  }

  siguiente(): void {
    this.examenService.siguientePregunta();
  }

  anterior(): void {
    this.examenService.preguntaAnterior();
  }

  finalizar(): void {
    // Agregar diálogo de confirmación
    this.examenService.finalizarExamen();
    this.router.navigate(['/dashboard/examenes']);
  }

  formatTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }

  guardarRespuestaMultiple(seleccionadas: MatListOption[]): void {
    if (!this.preguntaActual) return;

    const respuestas = seleccionadas.map(option => option.value);
    this.guardarRespuesta(respuestas);
  }

  trackByOpcion(index: number, opcion: OpcionRespuesta): string {
    return opcion.id;
  }

  drop(event: CdkDragDrop<OpcionRespuesta[]>): void {
    console.log('Drop event triggered');
    console.log('Previous Index:', event.previousIndex);
    console.log('Current Index:', event.currentIndex);

    if (!this.preguntaActual) return;

    // Crear una nueva copia del array
    const opcionesActualizadas = [...this.opcionesOrdenadas];

    // Realizar el movimiento en la copia
    moveItemInArray(opcionesActualizadas, event.previousIndex, event.currentIndex);

    // Actualizar el array original
    this.opcionesOrdenadas = opcionesActualizadas;

    console.log('Updated Options:', this.opcionesOrdenadas);

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Guardar respuesta
    const respuesta = this.opcionesOrdenadas.map(opcion => opcion.id);
    this.guardarRespuesta(respuesta);
  }
}
