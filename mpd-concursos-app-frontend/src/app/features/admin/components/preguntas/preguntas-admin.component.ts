import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PreguntasService } from '@core/services/examenes/preguntas.service';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { Pregunta, TipoPregunta, Opcion } from '@shared/interfaces/examen/pregunta.interface';
import { Examen } from '@shared/interfaces/examen/examen.interface';

@Component({
  selector: 'app-preguntas-admin',
  templateUrl: './preguntas-admin.component.html',
  styleUrls: ['./preguntas-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class PreguntasAdminComponent implements OnInit, OnDestroy {
  preguntas: Pregunta[] = [];
  examenes: Examen[] = [];
  preguntaForm: FormGroup;
  asignacionForm: FormGroup;
  editando = false;
  preguntaActual: Pregunta | null = null;
  cargando = false;

  // UI State
  multiSelectOpen = false;
  expandedQuestions = new Set<string>();

  // Notification system
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';

  readonly TIPO_PREGUNTA = TipoPregunta;
  tiposPregunta = [
    { value: TipoPregunta.OPCION_MULTIPLE, label: 'Opción Múltiple' },
    { value: TipoPregunta.SELECCION_MULTIPLE, label: 'Selección Múltiple' },
    { value: TipoPregunta.VERDADERO_FALSO, label: 'Verdadero/Falso' },
    { value: TipoPregunta.DESARROLLO, label: 'Desarrollo' },
    { value: TipoPregunta.ORDENAMIENTO, label: 'Ordenamiento' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private preguntasService: PreguntasService,
    private examenesService: ExamenesService
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
    // Simular datos mock para demostración
    setTimeout(() => {
      this.preguntas = this.getMockPreguntas();
      this.cargando = false;
    }, 1000);
  }

  cargarExamenes(): void {
    // Simular datos mock para demostración
    this.examenes = this.getMockExamenes();
  }

  // Mock data methods
  private getMockPreguntas(): Pregunta[] {
    return [
      {
        id: '1',
        texto: '¿Cuál es el principio fundamental del derecho constitucional que garantiza la separación de poderes?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        puntaje: 10,
        orden: 1,
        opciones: [
          { id: 'a', texto: 'División de poderes', orden: 1 },
          { id: 'b', texto: 'Supremacía constitucional', orden: 2 },
          { id: 'c', texto: 'Estado de derecho', orden: 3 },
          { id: 'd', texto: 'Soberanía popular', orden: 4 }
        ]
      },
      {
        id: '2',
        texto: 'El proceso administrativo incluye las siguientes etapas:',
        tipo: TipoPregunta.SELECCION_MULTIPLE,
        puntaje: 15,
        orden: 2,
        opciones: [
          { id: 'a', texto: 'Planificación', orden: 1 },
          { id: 'b', texto: 'Organización', orden: 2 },
          { id: 'c', texto: 'Dirección', orden: 3 },
          { id: 'd', texto: 'Control', orden: 4 },
          { id: 'e', texto: 'Evaluación', orden: 5 }
        ]
      },
      {
        id: '3',
        texto: 'La Constitución es la norma suprema del ordenamiento jurídico.',
        tipo: TipoPregunta.VERDADERO_FALSO,
        puntaje: 5,
        orden: 3,
        opciones: [
          { id: 'true', texto: 'Verdadero', orden: 1 },
          { id: 'false', texto: 'Falso', orden: 2 }
        ]
      },
      {
        id: '4',
        texto: 'Explique los principios fundamentales de la administración pública y su importancia en la gestión estatal.',
        tipo: TipoPregunta.DESARROLLO,
        puntaje: 20,
        orden: 4,
        opciones: []
      }
    ];
  }

  private getMockExamenes(): Examen[] {
    return [
      {
        id: '1',
        titulo: 'Examen Técnico Jurídico - Nivel I',
        descripcion: 'Evaluación de conocimientos básicos en derecho',
        tipo: 'TECNICO_JURIDICO' as any,
        estado: 'ACTIVO' as any,
        fechaInicio: '2024-02-15',
        duracion: 120,
        puntajeMaximo: 100,
        intentosPermitidos: 2,
        requisitos: [],
        reglasExamen: [],
        materialesPermitidos: []
      },
      {
        id: '2',
        titulo: 'Examen Técnico Administrativo',
        descripcion: 'Evaluación de competencias administrativas',
        tipo: 'TECNICO_ADMINISTRATIVO' as any,
        estado: 'BORRADOR' as any,
        fechaInicio: '2024-03-01',
        duracion: 90,
        puntajeMaximo: 80,
        intentosPermitidos: 1,
        requisitos: [],
        reglasExamen: [],
        materialesPermitidos: []
      }
    ];
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
      this.showNotificationMessage('Por favor, complete todos los campos requeridos', 'error');
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

    // Simular operación asíncrona
    setTimeout(() => {
      if (this.editando) {
        const index = this.preguntas.findIndex(p => p.id === preguntaData.id);
        if (index !== -1) {
          this.preguntas[index] = preguntaData;
        }
        this.showNotificationMessage('Pregunta actualizada correctamente', 'success');
      } else {
        this.preguntas.push(preguntaData);
        this.showNotificationMessage('Pregunta creada correctamente', 'success');
      }

      this.cancelarEdicion();
      this.cargando = false;
    }, 1000);
  }

  eliminarPregunta(pregunta: Pregunta): void {
    if (confirm(`¿Está seguro que desea eliminar la pregunta "${pregunta.texto.slice(0, 50)}..."?`)) {
      this.cargando = true;

      // Simular operación asíncrona
      setTimeout(() => {
        this.preguntas = this.preguntas.filter(p => p.id !== pregunta.id);
        this.showNotificationMessage('Pregunta eliminada correctamente', 'success');
        this.cargando = false;
      }, 500);
    }
  }

  asignarPreguntasAExamen(): void {
    if (this.asignacionForm.invalid) {
      this.asignacionForm.markAllAsTouched();
      this.showNotificationMessage('Por favor, seleccione un examen y al menos una pregunta', 'error');
      return;
    }

    const { examenId, preguntaIds } = this.asignacionForm.value;

    this.cargando = true;

    // Simular operación asíncrona
    setTimeout(() => {
      this.showNotificationMessage('Preguntas asignadas correctamente al examen', 'success');
      this.asignacionForm.reset();
      this.multiSelectOpen = false;
      this.cargando = false;
    }, 1000);
  }

  // UI Helper Methods
  toggleMultiSelect(): void {
    this.multiSelectOpen = !this.multiSelectOpen;
  }

  onQuestionSelectionChange(event: any, questionId: string): void {
    const currentIds = this.asignacionForm.get('preguntaIds')?.value || [];

    if (event.target.checked) {
      if (!currentIds.includes(questionId)) {
        this.asignacionForm.patchValue({
          preguntaIds: [...currentIds, questionId]
        });
      }
    } else {
      this.asignacionForm.patchValue({
        preguntaIds: currentIds.filter((id: string) => id !== questionId)
      });
    }
  }

  isQuestionSelected(questionId: string): boolean {
    const selectedIds = this.asignacionForm.get('preguntaIds')?.value || [];
    return selectedIds.includes(questionId);
  }

  getSelectedQuestionsText(): string {
    const selectedIds = this.asignacionForm.get('preguntaIds')?.value || [];
    if (selectedIds.length === 0) {
      return 'Ninguna pregunta seleccionada';
    }
    if (selectedIds.length === 1) {
      return '1 pregunta seleccionada';
    }
    return `${selectedIds.length} preguntas seleccionadas`;
  }

  toggleQuestion(questionId: string): void {
    if (this.expandedQuestions.has(questionId)) {
      this.expandedQuestions.delete(questionId);
    } else {
      this.expandedQuestions.add(questionId);
    }
  }

  isQuestionExpanded(questionId: string): boolean {
    return this.expandedQuestions.has(questionId);
  }

  trackByQuestionId(index: number, question: Pregunta): string {
    return question.id;
  }

  getQuestionTypeClass(tipo: TipoPregunta): string {
    const typeClasses: { [key in TipoPregunta]: string } = {
      [TipoPregunta.OPCION_MULTIPLE]: 'type-multiple',
      [TipoPregunta.SELECCION_MULTIPLE]: 'type-selection',
      [TipoPregunta.VERDADERO_FALSO]: 'type-boolean',
      [TipoPregunta.DESARROLLO]: 'type-essay',
      [TipoPregunta.ORDENAMIENTO]: 'type-order'
    };
    return typeClasses[tipo] || 'type-default';
  }

  getQuestionTypeIcon(tipo: TipoPregunta): string {
    const typeIcons: { [key in TipoPregunta]: string } = {
      [TipoPregunta.OPCION_MULTIPLE]: 'fas fa-dot-circle',
      [TipoPregunta.SELECCION_MULTIPLE]: 'fas fa-check-square',
      [TipoPregunta.VERDADERO_FALSO]: 'fas fa-toggle-on',
      [TipoPregunta.DESARROLLO]: 'fas fa-edit',
      [TipoPregunta.ORDENAMIENTO]: 'fas fa-sort'
    };
    return typeIcons[tipo] || 'fas fa-question';
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  // Notification System
  showNotificationMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    setTimeout(() => {
      this.closeNotification();
    }, 5000);
  }

  closeNotification(): void {
    this.showNotification = false;
  }

  getNotificationIcon(): string {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[this.notificationType];
  }

  private generarId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Método para obtener el texto del tipo de pregunta
  getTipoPreguntaTexto(tipo: string): string {
    const tipoPregunta = this.tiposPregunta.find(t => t.value === tipo);
    return tipoPregunta ? tipoPregunta.label : tipo;
  }
}
