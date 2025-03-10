import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PreguntasService } from '@core/services/examenes/preguntas.service';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { Pregunta, TipoPregunta, Opcion } from '@shared/interfaces/examen/pregunta.interface';
import { Examen } from '@shared/interfaces/examen/examen.interface';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-preguntas-admin',
  templateUrl: './preguntas-admin.component.html',
  styleUrls: ['./preguntas-admin.component.scss']
})
export class PreguntasAdminComponent implements OnInit, OnDestroy {
  preguntas: Pregunta[] = [];
  examenes: Examen[] = [];
  preguntaForm: FormGroup;
  asignacionForm: FormGroup;
  editando = false;
  preguntaActual: Pregunta | null = null;
  cargando = false;

  readonly TIPO_PREGUNTA = TipoPregunta;
  tiposPregunta = [
    { valor: TipoPregunta.OPCION_MULTIPLE, texto: 'Opción Múltiple' },
    { valor: TipoPregunta.SELECCION_MULTIPLE, texto: 'Selección Múltiple' },
    { valor: TipoPregunta.VERDADERO_FALSO, texto: 'Verdadero/Falso' },
    { valor: TipoPregunta.DESARROLLO, texto: 'Desarrollo' },
    { valor: TipoPregunta.ORDENAMIENTO, texto: 'Ordenamiento' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private preguntasService: PreguntasService,
    private examenesService: ExamenesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.preguntaForm = this.fb.group({
      texto: ['', [Validators.required, Validators.minLength(10)]],
      tipo: [TipoPregunta.OPCION_MULTIPLE, Validators.required],
      puntaje: [10, [Validators.required, Validators.min(1)]],
      opciones: this.fb.array([])
    });

    this.asignacionForm = this.fb.group({
      examenId: ['', Validators.required],
      preguntaIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarPreguntas();
    this.cargarExamenes();

    // Escuchar cambios en el tipo de pregunta para ajustar las opciones
    this.preguntaForm.get('tipo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        this.ajustarOpcionesPorTipo(tipo);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPreguntas(): void {
    this.cargando = true;
    this.preguntasService.getPreguntas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preguntas) => {
          this.preguntas = preguntas;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar preguntas:', error);
          this.snackBar.open('Error al cargar las preguntas', 'Cerrar', { duration: 3000 });
          this.cargando = false;
        }
      });
  }

  cargarExamenes(): void {
    this.examenesService.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (examenes) => {
          this.examenes = examenes;
        },
        error: (error) => {
          console.error('Error al cargar exámenes:', error);
          this.snackBar.open('Error al cargar los exámenes', 'Cerrar', { duration: 3000 });
        }
      });
  }

  get opciones(): FormArray {
    return this.preguntaForm.get('opciones') as FormArray;
  }

  crearOpcionFormGroup(opcion?: Opcion): FormGroup {
    return this.fb.group({
      id: [opcion?.id || this.generarId()],
      texto: [opcion?.texto || '', Validators.required],
      orden: [opcion?.orden || this.opciones.length + 1]
    });
  }

  agregarOpcion(): void {
    this.opciones.push(this.crearOpcionFormGroup());
  }

  eliminarOpcion(index: number): void {
    this.opciones.removeAt(index);
    // Reordenar las opciones restantes
    for (let i = 0; i < this.opciones.length; i++) {
      this.opciones.at(i).get('orden')?.setValue(i + 1);
    }
  }

  ajustarOpcionesPorTipo(tipo: TipoPregunta): void {
    // Limpiar opciones actuales
    while (this.opciones.length > 0) {
      this.opciones.removeAt(0);
    }

    // Agregar opciones según el tipo
    switch (tipo) {
      case TipoPregunta.OPCION_MULTIPLE:
        for (let i = 0; i < 4; i++) {
          this.agregarOpcion();
        }
        break;
      case TipoPregunta.SELECCION_MULTIPLE:
        for (let i = 0; i < 4; i++) {
          this.agregarOpcion();
        }
        break;
      case TipoPregunta.VERDADERO_FALSO:
        this.opciones.push(this.crearOpcionFormGroup({ id: 'true', texto: 'Verdadero', orden: 1 }));
        this.opciones.push(this.crearOpcionFormGroup({ id: 'false', texto: 'Falso', orden: 2 }));
        break;
      case TipoPregunta.ORDENAMIENTO:
        for (let i = 0; i < 4; i++) {
          this.agregarOpcion();
        }
        break;
      case TipoPregunta.DESARROLLO:
        // No se necesitan opciones para preguntas de desarrollo
        break;
    }
  }

  editarPregunta(pregunta: Pregunta): void {
    this.editando = true;
    this.preguntaActual = pregunta;

    // Resetear el formulario
    this.preguntaForm.reset({
      texto: pregunta.texto,
      tipo: pregunta.tipo,
      puntaje: pregunta.puntaje
    });

    // Limpiar opciones actuales
    while (this.opciones.length > 0) {
      this.opciones.removeAt(0);
    }

    // Agregar opciones existentes
    if (pregunta.opciones && pregunta.opciones.length > 0) {
      pregunta.opciones.forEach(opcion => {
        this.opciones.push(this.crearOpcionFormGroup(opcion));
      });
    }
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.preguntaActual = null;
    this.preguntaForm.reset({
      tipo: TipoPregunta.OPCION_MULTIPLE,
      puntaje: 10
    });
    this.ajustarOpcionesPorTipo(TipoPregunta.OPCION_MULTIPLE);
  }

  guardarPregunta(): void {
    if (this.preguntaForm.invalid) {
      this.preguntaForm.markAllAsTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    const preguntaData: Pregunta = {
      id: this.preguntaActual?.id || this.generarId(),
      texto: this.preguntaForm.value.texto,
      tipo: this.preguntaForm.value.tipo,
      puntaje: this.preguntaForm.value.puntaje,
      orden: this.preguntaActual?.orden || this.preguntas.length + 1,
      opciones: this.preguntaForm.value.opciones
    };

    this.cargando = true;

    if (this.editando) {
      this.preguntasService.actualizarPregunta(preguntaData.id, preguntaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (preguntaActualizada) => {
            const index = this.preguntas.findIndex(p => p.id === preguntaActualizada.id);
            if (index !== -1) {
              this.preguntas[index] = preguntaActualizada;
            }
            this.snackBar.open('Pregunta actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.cancelarEdicion();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al actualizar pregunta:', error);
            this.snackBar.open('Error al actualizar la pregunta', 'Cerrar', { duration: 3000 });
            this.cargando = false;
          }
        });
    } else {
      this.preguntasService.crearPregunta(preguntaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (nuevaPregunta) => {
            this.preguntas.push(nuevaPregunta);
            this.snackBar.open('Pregunta creada correctamente', 'Cerrar', { duration: 3000 });
            this.cancelarEdicion();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al crear pregunta:', error);
            this.snackBar.open('Error al crear la pregunta', 'Cerrar', { duration: 3000 });
            this.cargando = false;
          }
        });
    }
  }

  eliminarPregunta(pregunta: Pregunta): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Confirmar eliminación',
        mensaje: `¿Está seguro que desea eliminar la pregunta "${pregunta.texto}"?`,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargando = true;
        this.preguntasService.eliminarPregunta(pregunta.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.preguntas = this.preguntas.filter(p => p.id !== pregunta.id);
              this.snackBar.open('Pregunta eliminada correctamente', 'Cerrar', { duration: 3000 });
              this.cargando = false;
            },
            error: (error) => {
              console.error('Error al eliminar pregunta:', error);
              this.snackBar.open('Error al eliminar la pregunta', 'Cerrar', { duration: 3000 });
              this.cargando = false;
            }
          });
      }
    });
  }

  asignarPreguntasAExamen(): void {
    if (this.asignacionForm.invalid) {
      this.asignacionForm.markAllAsTouched();
      this.snackBar.open('Por favor, seleccione un examen y al menos una pregunta', 'Cerrar', { duration: 3000 });
      return;
    }

    const { examenId, preguntaIds } = this.asignacionForm.value;

    this.cargando = true;
    this.preguntasService.asignarPreguntasAExamen(examenId, preguntaIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Preguntas asignadas correctamente al examen', 'Cerrar', { duration: 3000 });
          this.asignacionForm.reset();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al asignar preguntas al examen:', error);
          this.snackBar.open('Error al asignar preguntas al examen', 'Cerrar', { duration: 3000 });
          this.cargando = false;
        }
      });
  }

  private generarId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Método para obtener el texto del tipo de pregunta
  getTipoPreguntaTexto(tipo: string): string {
    const tipoPregunta = this.tiposPregunta.find(t => t.valor === tipo);
    return tipoPregunta ? tipoPregunta.texto : tipo;
  }
}
