import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Custom Services
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { Educacion, EducacionBuilder, TipoEducacion, CarreraNivelSuperior, CarreraGrado, Posgrado, ActividadCientifica, Diplomatura, CursoCapacitacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../../../../core/models/educacion.model';
import { EducacionService } from '../../../../../core/services/educacion/educacion.service';

import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs/operators';

// Tipo personalizado para acceder a las propiedades de forma segura
type EducacionRecord = Record<string, unknown> & Partial<Educacion>;

// Estados del formulario de educación
export enum EstadoFormulario {
  INICIAL,
  CARGANDO,
  GUARDADO_EXITOSO,
  ERROR
}

enum PasoWizard {
  SELECCION_TIPO = 0,
  INFORMACION_BASICA = 1,
  INFORMACION_ESPECIFICA = 2,
  DOCUMENTACION = 3,
  RESUMEN = 4
}

@Component({
  selector: 'app-educacion-container',
  templateUrl: './educacion-container.component.html',
  styleUrls: ['./educacion-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class EducacionContainerComponent implements OnInit, OnDestroy {
  @Input() usuarioId = '';
  @Input() educacionSeleccionada?: Educacion;
  @Output() educacionGuardada = new EventEmitter<Educacion>();
  @Output() cerrar = new EventEmitter<void>();

  // Enums para el template
  pasoWizard = PasoWizard;
  tiposEducacion = Object.values(TipoEducacion);
  estadoFormulario = EstadoFormulario;

  // Estado del formulario
  pasoActual: PasoWizard = PasoWizard.SELECCION_TIPO;
  cargando$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  estado$ = new BehaviorSubject<EstadoFormulario>(EstadoFormulario.INICIAL);
  mensajeExito$ = new BehaviorSubject<string | null>(null);

  // FormGroups para cada paso (inicializados de forma diferida)
  formularioTipo!: FormGroup;
  formularioBase!: FormGroup;
  formularioEspecifico!: FormGroup;
  formularioDocumentos!: FormGroup;

  // Builder para construir el objeto educación
  private educacionBuilder = new EducacionBuilder();

  // Para guardar archivos
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';

  tipoSeleccionado?: TipoEducacion;

  // Para gestionar unsubscribe
  private destroy$ = new Subject<void>();

  /**
   * Obtiene el tipo de educación seleccionado como string
   */
  getTipoSeleccionado(): string {
    if (!this.tipoSeleccionado) {
      return 'No seleccionado';
    }

    // Mapear el enum a texto legible
    const tiposTexto: Record<TipoEducacion, string> = {
      [TipoEducacion.CARRERA_NIVEL_SUPERIOR]: 'Carrera de Nivel Superior',
      [TipoEducacion.CARRERA_GRADO]: 'Carrera de Grado',
      [TipoEducacion.POSGRADO_ESPECIALIZACION]: 'Posgrado - Especialización',
      [TipoEducacion.POSGRADO_MAESTRIA]: 'Posgrado - Maestría',
      [TipoEducacion.POSGRADO_DOCTORADO]: 'Posgrado - Doctorado',
      [TipoEducacion.DIPLOMATURA]: 'Diplomatura',
      [TipoEducacion.CURSO_CAPACITACION]: 'Curso de Capacitación',
      [TipoEducacion.ACTIVIDAD_CIENTIFICA]: 'Actividad Científica'
    };

    return tiposTexto[this.tipoSeleccionado] || 'Tipo desconocido';
  }

  // Resultados del guardado
  educacionGuardadaResultado: Educacion | null = null;
  resultadoGuardado: any = null;

  constructor(
    private fb: FormBuilder,
    private notification: CustomNotificationService,
    private cdr: ChangeDetectorRef,
    private educacionService: EducacionService
  ) {}

  ngOnInit(): void {
    // Validar que el ID de usuario sea válido
    if (!this.usuarioId || this.usuarioId.trim() === '') {
      console.error(`Error: ID de usuario inválido (${this.usuarioId}) en EducacionContainerComponent`);
      this.error$.next(`No se puede crear educación: ID de usuario inválido (${this.usuarioId})`);
      this.estado$.next(EstadoFormulario.ERROR);
      this.cdr.markForCheck();
      return;
    }

    // Inicializamos solo el primer formulario
    setTimeout(() => this.inicializarFormularioTipo(), 0);

    // Recuperar borrador si existe
    const borrador = this.educacionService.obtenerBorrador();
    if (borrador && borrador.tipo) {
      this.cargarBorrador(borrador);
    }

    // Suscribirse a cambios en el estado del servicio
    this.educacionService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cargando => {
        this.cargando$.next(cargando);
        this.cdr.markForCheck();
      });

    this.educacionService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.error$.next(error);
          this.estado$.next(EstadoFormulario.ERROR);
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.educacionService.limpiarBorrador(); // Limpiar el borrador al destruir el componente
  }

  // Inicialización diferida de formularios
  inicializarFormularioTipo(): void {
    this.formularioTipo = this.fb.group({
      tipo: ['', Validators.required]
    });

    // Auto-guardado de borrador
    this.formularioTipo.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(valores => {
        this.educacionService.guardarBorrador(valores);
      });

    this.cdr.markForCheck();
  }

  inicializarFormularioBase(): void {
    this.formularioBase = this.fb.group({
      estado: ['', Validators.required],
      titulo: ['', Validators.required],
      institucion: ['', Validators.required],
      fechaEmision: [null] // Agregado aquí para que sea un campo común en el formulario base
    });

    // Auto-guardado de borrador
    this.formularioBase.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(valores => {
        const tipo = this.getControlValue(this.formularioTipo, 'tipo');
        this.educacionService.guardarBorrador({
          tipo,
          ...valores
        });
      });

    this.cdr.markForCheck();
  }

  inicializarFormularioEspecifico(): void {
    const tipo: TipoEducacion = this.getControlValue(this.formularioTipo, 'tipo');

    // Formulario base vacío
    let grupo: { [key: string]: any } = {}; // Tipado explícito

    // Agregar campos según el tipo seleccionado
    switch (tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        grupo = {
          duracionAnios: ['', [Validators.required, Validators.min(1)]],
          promedio: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
          // fechaEmision ya está en formularioBase
        };
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        grupo = {
          temaTesis: ['', Validators.required],
          // fechaEmision ya está en formularioBase
        };
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        grupo = {
          cargaHoraria: ['', [Validators.required, Validators.min(1)]],
          tuvoEvaluacionFinal: [false],
          // fechaEmision ya está en formularioBase
        };
        break;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        grupo = {
          tipoActividad: ['', Validators.required],
          tema: ['', Validators.required],
          caracter: ['', Validators.required],
          lugarFechaExposicion: ['', Validators.required],
          comentarios: ['']
        };
        break;
    }

    this.formularioEspecifico = this.fb.group(grupo);

    // Auto-guardado de borrador
    this.formularioEspecifico.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(valores => {
        const tipoValue = this.getControlValue(this.formularioTipo, 'tipo');
        const baseValues = this.formularioBase ? this.formularioBase.value : {}; // Asegurar que formularioBase existe

        this.educacionService.guardarBorrador({
          tipo: tipoValue,
          ...baseValues,
          ...valores
        });
      });

    this.cdr.markForCheck();
  }

  inicializarFormularioDocumentos(): void {
    this.formularioDocumentos = this.fb.group({
      tieneDocumento: [false],
      // No añadimos el archivo al FormGroup, lo manejaremos aparte
    });

    this.cdr.markForCheck();
  }

  // Cargar borrador si existe al inicializar
  cargarBorrador(borrador: Partial<Educacion>): void {
    if (borrador.tipo) {
      this.pasoActual = PasoWizard.INFORMACION_BASICA; // Asumir que al menos el tipo fue seleccionado

      this.inicializarFormularioTipo();
      this.formularioTipo.patchValue({ tipo: borrador.tipo });
      this.tipoSeleccionado = borrador.tipo;

      // Continuar con los siguientes pasos si los datos están presentes
      if (borrador.estado || borrador.titulo || borrador.institucion) {
        this.inicializarFormularioBase();
        this.formularioBase.patchValue({
          estado: borrador.estado,
          titulo: borrador.titulo,
          institucion: borrador.institucion,
          fechaEmision: borrador.fechaEmision
        });
        this.pasoActual = PasoWizard.INFORMACION_ESPECIFICA;
      }

      if (borrador.tipo) { // Solo inicializar si el tipo ya está establecido
        this.inicializarFormularioEspecifico();
        this.formularioEspecifico.patchValue(borrador); // Patch con todas las propiedades específicas
        this.pasoActual = PasoWizard.DOCUMENTACION; // Mover al siguiente paso si hay algo que parchar aquí.
      }

      // Si hay un documento en borrador, cargar su nombre
      if (borrador.documentoPdf) {
        // Asumiendo que `documentoPdf` guarda el nombre o una referencia usable
        if (typeof borrador.documentoPdf === 'string') {
          this.nombreArchivo = borrador.documentoPdf;
        }
        // No podemos recrear el File object del borrador directamente
        this.inicializarFormularioDocumentos();
        this.formularioDocumentos.patchValue({ tieneDocumento: true });
        this.pasoActual = PasoWizard.RESUMEN; // Mover al resumen si ya hay un documento
      }
      this.cdr.markForCheck();
    }
  }


  // Navegación del wizard
  siguientePaso(): void {
    const pasoActual = this.pasoActual;

    // Validar el formulario actual antes de avanzar
    if (!this.esFormularioValido(pasoActual)) {
      this.notification.error('Por favor, complete los campos obligatorios antes de avanzar.');
      return;
    }

    // Guardar datos del paso actual
    this.guardarDatosPaso(pasoActual);

    // Determinar siguiente paso
    if (this.pasoActual < PasoWizard.RESUMEN) { // Asegurarse de no ir más allá del último paso
      this.pasoActual++;
    }

    // Si el tipo de educación cambia, reinicializar el formulario específico
    if (pasoActual === PasoWizard.SELECCION_TIPO) {
      const nuevoTipo = this.getControlValue(this.formularioTipo, 'tipo');
      if (this.tipoSeleccionado !== nuevoTipo) {
        this.tipoSeleccionado = nuevoTipo;
        this.formularioEspecifico?.reset(); // Reiniciar formulario específico si el tipo cambia
      }
    }

    // Inicializar formulario del siguiente paso si es necesario
    this.inicializarSiguientePaso();

    this.cdr.markForCheck();
  }

  anteriorPaso(): void {
    if (this.pasoActual > 0) {
      this.pasoActual--;
      this.cdr.markForCheck();
    }
  }

  // Validación del formulario actual
  esFormularioValido(paso: PasoWizard): boolean {
    let formulario: FormGroup | undefined;

    switch (paso) {
      case PasoWizard.SELECCION_TIPO:
        formulario = this.formularioTipo;
        break;
      case PasoWizard.INFORMACION_BASICA:
        formulario = this.formularioBase;
        break;
      case PasoWizard.INFORMACION_ESPECIFICA:
        formulario = this.formularioEspecifico;
        break;
      case PasoWizard.DOCUMENTACION:
        formulario = this.formularioDocumentos;
        break;
      default:
        return true; // Si no hay formulario específico para el paso, se considera válido
    }

    if (!formulario) {
      console.warn(`Formulario no inicializado para el paso ${PasoWizard[paso]}`);
      return true; // No hay formulario para validar
    }

    if (formulario.invalid) {
      // Marcar todos los controles como touched para mostrar errores
      this.marcarCamposInvalidosFormGroup(formulario);
      return false;
    }

    return true;
  }

  // Guardar datos del paso actual en el builder
  guardarDatosPaso(paso: PasoWizard): void {
    switch (paso) {
      case PasoWizard.SELECCION_TIPO: {
        const tipoValue = this.getControlValue(this.formularioTipo, 'tipo');
        this.educacionBuilder.setTipo(tipoValue);
        break;
      }

      case PasoWizard.INFORMACION_BASICA: {
        const { estado, titulo, institucion, fechaEmision } = this.formularioBase.value;
        this.educacionBuilder
          .setEstado(estado)
          .setTitulo(titulo)
          .setInstitucion(institucion);
        if (fechaEmision) { // Fecha de emisión ahora es parte del formulario base
          this.educacionBuilder.setFechaEmision(fechaEmision);
        }
        break;
      }

      case PasoWizard.INFORMACION_ESPECIFICA: {
        const tipo = this.getControlValue(this.formularioTipo, 'tipo');
        const valores = this.formularioEspecifico.value;

        switch (tipo) {
          case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
          case TipoEducacion.CARRERA_GRADO:
            this.educacionBuilder
              .setDuracionAnios(valores.duracionAnios)
              .setPromedio(valores.promedio);
            break;

          case TipoEducacion.POSGRADO_ESPECIALIZACION:
          case TipoEducacion.POSGRADO_MAESTRIA:
          case TipoEducacion.POSGRADO_DOCTORADO:
            this.educacionBuilder
              .setTemaTesis(valores.temaTesis);
            break;

          case TipoEducacion.DIPLOMATURA:
          case TipoEducacion.CURSO_CAPACITACION:
            this.educacionBuilder
              .setCargaHoraria(valores.cargaHoraria)
              .setTuvoEvaluacionFinal(valores.tuvoEvaluacionFinal);
            break;

          case TipoEducacion.ACTIVIDAD_CIENTIFICA: {
            this.educacionBuilder
              .setTipoActividad(valores.tipoActividad)
              .setTema(valores.tema)
              .setCaracter(valores.caracter)
              .setLugarFechaExposicion(valores.lugarFechaExposicion)
              .setComentarios(valores.comentarios);
            break;
          }
        }
        break;
      }

      case PasoWizard.DOCUMENTACION: {
        // El archivo se maneja directamente con archivoSeleccionado, no a través del formularioDocumentos.
        // La lógica para adjuntar el archivo al builder se hará en `guardarEducacion`.
        break;
      }
    }
  }

  // Inicializar el formulario del siguiente paso
  inicializarSiguientePaso(): void {
    switch (this.pasoActual) {
      case PasoWizard.INFORMACION_BASICA:
        if (!this.formularioBase) {
          setTimeout(() => this.inicializarFormularioBase(), 0);
        }
        break;
      case PasoWizard.INFORMACION_ESPECIFICA:
        if (!this.formularioEspecifico) {
          setTimeout(() => this.inicializarFormularioEspecifico(), 0);
        }
        break;
      case PasoWizard.DOCUMENTACION:
        if (!this.formularioDocumentos) {
          setTimeout(() => this.inicializarFormularioDocumentos(), 0);
        }
        break;
    }
  }

  // Manejo de archivos
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
      // Validar tipo de archivo
      if (this.archivoSeleccionado.type !== 'application/pdf') {
        this.error$.next(`El archivo debe ser un PDF. Tipo detectado: ${this.archivoSeleccionado.type}`);
        this.archivoSeleccionado = null; // Resetear archivo
        this.nombreArchivo = ''; // Resetear nombre
        this.cdr.markForCheck();
        return;
      }

      // Validar tamaño de archivo
      const tamanoMaximoMB = 5;
      const tamanoMaximoBytes = tamanoMaximoMB * 1024 * 1024;
      if (this.archivoSeleccionado.size > tamanoMaximoBytes) {
        const tamanoActualMB = Math.round(this.archivoSeleccionado.size / (1024 * 1024) * 100) / 100;
        this.error$.next(`El archivo no debe superar los ${tamanoMaximoMB}MB. Tamaño actual: ${tamanoActualMB}MB`);
        this.archivoSeleccionado = null; // Resetear archivo
        this.nombreArchivo = ''; // Resetear nombre
        this.cdr.markForCheck();
        return;
      }

      // Si llegamos aquí, el archivo es válido
      this.error$.next(null);
      this.nombreArchivo = this.archivoSeleccionado.name; // Almacenar el nombre del archivo
      this.mensajeExito$.next(`Archivo "${this.archivoSeleccionado.name}" seleccionado correctamente`);
      this.cdr.markForCheck();
    } else {
      // No se seleccionó ningún archivo o se canceló la selección
      this.archivoSeleccionado = null;
      this.nombreArchivo = ''; // Resetear nombre
      this.error$.next(null);
      this.mensajeExito$.next(null);
      this.cdr.markForCheck();
    }
  }

  /**
   * Helper para obtener el valor de un control de formulario.
   * @param form El FormGroup.
   * @param controlName El nombre del control.
   * @returns El valor del control.
   */
  getControlValue(form: FormGroup, controlName: string): any {
    return form.get(controlName)?.value;
  }

  /**
   * Helper para obtener el valor de un formulario (usado en template).
   * @param form El FormGroup.
   * @param controlName El nombre del control.
   * @returns El valor del control.
   */
  getValorFormulario(form: FormGroup, controlName: string): any {
    return form?.get(controlName)?.value;
  }

  /**
   * Helper para obtener un valor booleano de un formulario.
   * @param form El FormGroup.
   * @param controlName El nombre del control.
   * @returns El valor booleano del control.
   */
  getValorBooleano(form: FormGroup, controlName: string): boolean {
    return !!form?.get(controlName)?.value;
  }

  /**
   * Helper para verificar si un control tiene valor.
   * @param form El FormGroup.
   * @param controlName El nombre del control.
   * @returns True si el control tiene un valor válido.
   */
  tieneValor(form: FormGroup, controlName: string): boolean {
    const valor = form?.get(controlName)?.value;
    return valor !== null && valor !== undefined && valor !== '';
  }

  /**
   * Helper para marcar un control de formulario como tocado.
   * @param form El FormGroup.
   * @param controlName El nombre del control a marcar.
   */
  markAsTouched(form: FormGroup, controlName: string): void {
    const control = form.get(controlName);
    if (control) {
      control.markAsTouched();
      control.markAsDirty(); // También marcar como dirty para mostrar errores
      control.updateValueAndValidity();
    }
  }

  // Método para guardar educación
  guardarEducacion(): void {
    // Validar que el usuario tenga un ID válido
    if (!this.usuarioId) {
      console.error(`Error al guardar educación: ID de usuario inválido (${this.usuarioId})`);
      this.notification.error('No se puede guardar educación sin un ID de usuario válido');
      return;
    }

    // Validar todos los formularios antes de guardar
    if (!this.esFormularioValido(PasoWizard.SELECCION_TIPO) ||
        !this.esFormularioValido(PasoWizard.INFORMACION_BASICA) ||
        !this.esFormularioValido(PasoWizard.INFORMACION_ESPECIFICA)) { // Documentación es opcional, no se valida su formulario
      // Mostrar todos los errores
      this.marcarCamposInvalidosFormGroup(this.formularioTipo);
      if (this.formularioBase) this.marcarCamposInvalidosFormGroup(this.formularioBase);
      if (this.formularioEspecifico) this.marcarCamposInvalidosFormGroup(this.formularioEspecifico);

      this.notification.error('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    this.cargando$.next(true);
    this.error$.next(null);
    this.mensajeExito$.next(null);
    this.cdr.markForCheck();

    try {
      // Construir el objeto de educación a partir del builder
      const educacionData = this.construirEducacion();

      // Verificar propiedades específicas
      this.verificarPropiedadesEducacion(educacionData);

      // Preparar el objeto para el backend
      const educacionParaBackend = this.prepararEducacionParaBackend(educacionData);

      // Subir archivo si se seleccionó uno
      const archivoSeleccionado = this.archivoSeleccionado;

      this.educacionService.guardarEducacionCompleta(educacionParaBackend, this.usuarioId, archivoSeleccionado || undefined)
        .pipe(finalize(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (response) => {
            if (response.exito) {
              if (response.error) {
                // Éxito parcial - educación guardada pero hubo un problema con el documento
                console.warn('Éxito parcial al guardar educación:', response.error);
                this.notification.warning(`Educación guardada correctamente, pero hubo un problema al subir el documento: ${response.error}`);
              }
              this.finalizarGuardado(true, response.data || null, null);
            } else {
              this.finalizarGuardado(false, null, response.error || 'Error desconocido');
            }
          },
          error: (error: unknown) => {
            console.error('Error en la suscripción al guardar educación completa:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.finalizarGuardado(false, null, errorMsg);
          }
        });
    } catch (error: unknown) {
      console.error('Error inesperado al construir o guardar educación:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.manejarError('Error al guardar educación: ' + errorMsg);
    }
  }

  /**
   * Maneja errores estableciendo el estado del componente.
   * @param error El mensaje de error o el objeto de error.
   */
  private manejarError(error: string | unknown): void {
    const errorMsg = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Error desconocido');
    this.error$.next(errorMsg);
    this.estado$.next(EstadoFormulario.ERROR);
    this.cargando$.next(false);
    this.notification.error(errorMsg);
    this.cdr.markForCheck();
  }

  /**
   * Método para depurar la petición antes de enviarla al backend
   * y ayudar a diagnosticar problemas de validación
   */
  private depurarPeticionEducacion(educacion: Educacion, usuarioId: string): void {
    // Crear copia para no modificar el objeto original
    const educacionParaBackend = this.prepararEducacionParaBackend(educacion);

    console.group('Depuración de petición de educación');
    console.log('Objeto educacionData (frontend):', educacion);
    console.log('Objeto educacionParaBackend (para el backend):', educacionParaBackend);
    console.log('ID de usuario:', usuarioId);

    // Verificar que los campos obligatorios según el backend están presentes
    const camposObligatorios: (keyof EducacionRecord)[] = ['tipo', 'estado', 'titulo', 'institucion']; // Ajusta según tu backend
    let camposFaltantes = false;

    camposObligatorios.forEach(campo => {
      const valor = educacionParaBackend[campo];
      const esValido = valor !== undefined && valor !== null && valor !== '';
      console.log(`Campo obligatorio "${String(campo)}": Valor: "${valor}", ¿Válido?: ${esValido}`);
      if (!esValido) camposFaltantes = true;
    });

    if (camposFaltantes) {
      console.warn('⚠️ HAY CAMPOS OBLIGATORIOS FALTANTES O INVÁLIDOS. La petición podría fallar.');
    } else {
      console.log('✅ Todos los campos obligatorios principales parecen estar presentes.');
    }

    // Verificar campos específicos según el tipo
    console.log('Verificando campos específicos según el tipo de educación...');
    const type = educacionParaBackend['type'] as string; // Usar el tipo mapeado para el backend
    switch (type) {
      case 'CARRERA_NIVEL_SUPERIOR':
      case 'CARRERA_GRADO':
        console.log(`- Duración en años: ${educacionParaBackend['durationYears']}`);
        console.log(`- Promedio: ${educacionParaBackend['average']}`);
        break;
      case 'POSGRADO_ESPECIALIZACION':
      case 'POSGRADO_MAESTRIA':
      case 'POSGRADO_DOCTORADO':
        console.log(`- Tema de tesis: ${educacionParaBackend['thesisTopic']}`);
        break;
      case 'DIPLOMATURA':
      case 'CURSO_CAPACITACION':
        console.log(`- Carga horaria: ${educacionParaBackend['hourlyLoad']}`);
        console.log(`- Tuvo evaluación final: ${educacionParaBackend['hadFinalEvaluation']}`);
        break;
      case 'ACTIVIDAD_CIENTIFICA':
        console.log(`- Tipo de actividad: ${educacionParaBackend['activityType']}`);
        console.log(`- Tema: ${educacionParaBackend['topic']}`);
        console.log(`- Carácter: ${educacionParaBackend['activityRole']}`);
        console.log(`- Lugar/Fecha exposición: ${educacionParaBackend['expositionPlaceDate']}`);
        console.log(`- Comentarios: ${educacionParaBackend['comments']}`);
        break;
      default:
        console.warn(`Tipo de educación no reconocido para depuración detallada: ${type}`);
    }

    console.groupEnd();
  }

  /**
   * Prepara el objeto de educación para enviarlo al backend,
   * aplicando las transformaciones necesarias en los campos
   */
  private prepararEducacionParaBackend(educacion: Educacion): Record<string, unknown> {
    // Crear un objeto nuevo para el backend siguiendo la estructura esperada
    const resultado: Record<string, unknown> = {};

    // Mapear campos base que espera el backend
    resultado['type'] = this.mapearTipoEducacion(educacion.tipo);
    resultado['status'] = this.mapearEstadoEducacion(educacion.estado);
    resultado['title'] = educacion.titulo;
    resultado['institution'] = educacion.institucion;

    // Asegurar que la fecha está en formato ISO para serialización o usar LocalDate
    if (educacion.fechaEmision instanceof Date && !isNaN(educacion.fechaEmision.getTime())) {
      resultado['issueDate'] = educacion.fechaEmision.toISOString().split('T')[0]; // Solo la parte de fecha YYYY-MM-DD
    } else if (typeof educacion.fechaEmision === 'string') {
        const date = new Date(educacion.fechaEmision);
        if (!isNaN(date.getTime())) {
            resultado['issueDate'] = date.toISOString().split('T')[0];
        }
    }


    // Mapear campos específicos según el tipo de educación
    switch (educacion.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        resultado['durationYears'] = (educacion as CarreraGrado | CarreraNivelSuperior).duracionAnios;
        resultado['average'] = (educacion as CarreraGrado | CarreraNivelSuperior).promedio;
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        resultado['thesisTopic'] = (educacion as Posgrado).temaTesis;
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        resultado['hourlyLoad'] = (educacion as Diplomatura | CursoCapacitacion).cargaHoraria;
        resultado['hadFinalEvaluation'] = (educacion as Diplomatura | CursoCapacitacion).tuvoEvaluacionFinal;
        break;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA: {
        const actividadCientifica = educacion as ActividadCientifica;
        if (actividadCientifica.tipoActividad) {
          resultado['activityType'] = this.mapearTipoActividad(actividadCientifica.tipoActividad);
        }
        resultado['topic'] = actividadCientifica.tema;
        if (actividadCientifica.caracter) {
          resultado['activityRole'] = this.mapearRolActividad(actividadCientifica.caracter);
        }
        resultado['expositionPlaceDate'] = actividadCientifica.lugarFechaExposicion;
        resultado['comments'] = actividadCientifica.comentarios;
        break;
      }
    }
    return resultado; // Retornar el objeto preparado para el backend
  }

  /**
   * Método para mostrar los errores de un formulario específico
   */
  private mostrarErroresFormulario(form: FormGroup, nombre: string): void {
    if (!form) return;

    console.group(`Errores del formulario ${nombre}`);

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.errors) {
        console.error(`Campo "${key}":`, control.errors);
      }
    });
    console.groupEnd();
  }

  /**
   * Marcar campos inválidos en los formularios
   */
  marcarCamposInvalidosFormGroup(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity(); // Asegurar que la validación se actualice
      }
    });
  }

  /**
   * Verificar que las propiedades específicas según el tipo de educación estén presentes.
   * Esto es una verificación adicional y puede no ser estrictamente necesario si el `FormGroup`
   * y el `EducacionBuilder` ya manejan las validaciones.
   */
  private verificarPropiedadesEducacion(educacion: Educacion) {
    console.log('Verificando propiedades de educación:', educacion);

    const propiedadesBase: (keyof Educacion)[] = ['tipo', 'estado', 'titulo', 'institucion'];
    propiedadesBase.forEach(prop => {
      if (!educacion[prop]) {
        console.warn(`Propiedad base "${String(prop)}" está vacía o nula.`);
      }
    });

    // Verificar propiedades específicas según el tipo
    switch (educacion.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        if (!(educacion as CarreraGrado).duracionAnios) console.warn('Falta duracionAnios para Carrera de Nivel Superior/Grado');
        if (!(educacion as CarreraGrado).promedio) console.warn('Falta promedio para Carrera de Nivel Superior/Grado');
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        if (!(educacion as Posgrado).temaTesis) console.warn('Falta temaTesis para Posgrado');
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        if (!(educacion as Diplomatura).cargaHoraria) console.warn('Falta cargaHoraria para Diplomatura/Curso');
        // tuvoEvaluacionFinal es booleano, se valida por su presencia
        break;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA: {
        const actividadCientifica = educacion as ActividadCientifica;
        if (!actividadCientifica.tipoActividad) console.warn('Falta tipoActividad para Actividad Científica');
        if (!actividadCientifica.tema) console.warn('Falta tema para Actividad Científica');
        if (!actividadCientifica.caracter) console.warn('Falta caracter para Actividad Científica');
        if (!actividadCientifica.lugarFechaExposicion) console.warn('Falta lugarFechaExposicion para Actividad Científica');
        break;
      }

      default:
        console.warn(`Tipo de educación no reconocido en verificación de propiedades: ${educacion.tipo}`);
    }
  }

  /**
   * Construir el objeto de educación a partir del formulario
   */
  private construirEducacion(): Educacion {
    // Combinar valores de todos los formularios
    const formValues = {
      ...(this.formularioTipo ? this.formularioTipo.value : {}),
      ...(this.formularioBase ? this.formularioBase.value : {}),
      ...(this.formularioEspecifico ? this.formularioEspecifico.value : {})
    } as EducacionRecord; // Asegurar el tipo para el merge

    // Corregir valores antes de construir el objeto
    this.corregirValoresEducacion(formValues);

    // Asegurar que los campos numéricos son realmente números
    if (formValues.duracionAnios !== undefined) {
      formValues.duracionAnios = Number(formValues.duracionAnios);
    }
    if (formValues.promedio !== undefined) {
      formValues.promedio = Number(formValues.promedio);
    }
    if (formValues.cargaHoraria !== undefined) {
      formValues.cargaHoraria = Number(formValues.cargaHoraria);
    }

    // Asegurar que los campos booleanos son realmente booleanos
    if (formValues.tuvoEvaluacionFinal !== undefined) {
      formValues.tuvoEvaluacionFinal = Boolean(formValues.tuvoEvaluacionFinal);
    }

    // Instanciar un nuevo builder cada vez para evitar estados residuales
    const builder = new EducacionBuilder();

    // Propiedades comunes
    builder
      .setTipo(formValues.tipo as TipoEducacion) // Cast explícito a TipoEducacion
      .setEstado(formValues.estado as EstadoEducacion) // Cast explícito a EstadoEducacion
      .setTitulo(formValues.titulo as string)
      .setInstitucion(formValues.institucion as string);

    // Formatear y asignar fecha de emisión
    if (formValues.fechaEmision) {
      const date = new Date(formValues.fechaEmision);
      if (!isNaN(date.getTime())) {
        builder.setFechaEmision(date);
      } else {
        console.warn('Fecha de emisión inválida en construirEducacion, se ignorará.');
      }
    }

    // Propiedades específicas según el tipo
    switch (formValues.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        builder
          .setDuracionAnios(formValues.duracionAnios as number)
          .setPromedio(formValues.promedio as number);
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        builder.setTemaTesis(formValues.temaTesis as string);
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        builder
          .setCargaHoraria(formValues.cargaHoraria as number)
          .setTuvoEvaluacionFinal(formValues.tuvoEvaluacionFinal as boolean);
        break;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        builder
          .setTipoActividad(formValues.tipoActividad as TipoActividadCientifica)
          .setTema(formValues.tema as string)
          .setCaracter(formValues.caracter as CaracterActividadCientifica)
          .setLugarFechaExposicion(formValues.lugarFechaExposicion as string)
          .setComentarios(formValues.comentarios as string);
        break;
    }

    // Construir el objeto final
    try {
      const educacion = builder.build();
      return educacion;
    } catch (error) {
      console.error('Error al construir el objeto de educación con builder, se intenta crear un objeto base:', error);
      // Construir un objeto base con los valores mínimos
      const tipo = (formValues.tipo as TipoEducacion) || TipoEducacion.CARRERA_GRADO;
      const estado = (formValues.estado as EstadoEducacion) || EstadoEducacion.EN_PROCESO;

      return {
        tipo: tipo,
        estado: estado,
        titulo: (formValues.titulo as string) || '',
        institucion: (formValues.institucion as string) || '',
      } as Educacion; // Forzar el tipo
    }
  }

  /**
   * Corrige problemas comunes en los valores del formulario
   * basados en errores de validación conocidos del backend
   */
  private corregirValoresEducacion(formValues: EducacionRecord): void {
    // Corregir promedio (debe ser un número entre 0 y 10)
    if (formValues['promedio'] !== undefined) {
      const promedio = Number(formValues['promedio']);
      if (isNaN(promedio) || promedio < 0 || promedio > 10) {
        console.warn('Promedio inválido, ajustando a 0.1 o 10.0 si es > 10');
        formValues['promedio'] = Math.max(0.1, Math.min(10.0, promedio)); // Limitar entre 0.1 y 10
      }
    }

    // Corregir duración (debe ser un entero positivo)
    if (formValues['duracionAnios'] !== undefined) {
      const duracion = Number(formValues['duracionAnios']);
      if (isNaN(duracion) || duracion <= 0 || !Number.isInteger(duracion)) {
        console.warn('Duración inválida, ajustando a valor mínimo aceptable: 1');
        formValues['duracionAnios'] = 1;
      }
    }

    // Corregir carga horaria (debe ser un número positivo)
    if (formValues['cargaHoraria'] !== undefined) {
      const cargaHoraria = Number(formValues['cargaHoraria']);
      if (isNaN(cargaHoraria) || cargaHoraria <= 0) {
        console.warn('Carga horaria inválida, ajustando a valor mínimo aceptable: 1');
        formValues['cargaHoraria'] = 1;
      }
    }

    // Verificar que los campos de texto no estén vacíos
    ['titulo', 'institucion', 'temaTesis', 'tema', 'lugarFechaExposicion'].forEach(campo => {
      if (formValues[campo] !== undefined && (!formValues[campo] || (typeof formValues[campo] === 'string' && (formValues[campo] as string).trim() === ''))) {
        console.warn(`Campo ${campo} vacío, ajustando a valor por defecto`);
        formValues[campo] = campo === 'titulo' ? 'Sin título' :
          campo === 'institucion' ? 'Sin institución' :
          campo === 'temaTesis' ? 'Sin tema de tesis' :
          campo === 'tema' ? 'Sin tema' :
          'Sin información';
      }
    });

    // Verificar enums
    if (formValues['tipo'] && !Object.values(TipoEducacion).includes(formValues['tipo'] as TipoEducacion)) {
      console.warn(`Tipo de educación inválido: ${formValues['tipo']}, ajustando a valor por defecto`);
      formValues['tipo'] = TipoEducacion.CARRERA_GRADO;
    }

    if (formValues['estado'] && !Object.values(EstadoEducacion).includes(formValues['estado'] as EstadoEducacion)) {
      console.warn(`Estado de educación inválido: ${formValues['estado']}, ajustando a valor por defecto`);
      formValues['estado'] = EstadoEducacion.FINALIZADO;
    }

    if (formValues['tipoActividad'] && !Object.values(TipoActividadCientifica).includes(formValues['tipoActividad'] as TipoActividadCientifica)) {
      console.warn(`Tipo de actividad inválido: ${formValues['tipoActividad']}, ajustando a valor por defecto`);
      formValues['tipoActividad'] = TipoActividadCientifica.INVESTIGACION;
    }

    if (formValues['caracter'] && !Object.values(CaracterActividadCientifica).includes(formValues['caracter'] as CaracterActividadCientifica)) {
      console.warn(`Carácter de actividad inválido: ${formValues['caracter']}, ajustando a valor por defecto`);
      formValues['caracter'] = CaracterActividadCientifica.AUTOR_DISERTANTE;
    }
  }

  // Métodos de mapeo para el backend (completados)
  private mapearTipoEducacion(tipo: TipoEducacion): string {
    const mapeo: Record<TipoEducacion, string> = {
      [TipoEducacion.CARRERA_NIVEL_SUPERIOR]: 'CARRERA_NIVEL_SUPERIOR',
      [TipoEducacion.CARRERA_GRADO]: 'CARRERA_GRADO',
      [TipoEducacion.POSGRADO_ESPECIALIZACION]: 'POSGRADO_ESPECIALIZACION',
      [TipoEducacion.POSGRADO_MAESTRIA]: 'POSGRADO_MAESTRIA',
      [TipoEducacion.POSGRADO_DOCTORADO]: 'POSGRADO_DOCTORADO',
      [TipoEducacion.DIPLOMATURA]: 'DIPLOMATURA',
      [TipoEducacion.CURSO_CAPACITACION]: 'CURSO_CAPACITACION',
      [TipoEducacion.ACTIVIDAD_CIENTIFICA]: 'ACTIVIDAD_CIENTIFICA'
    };
    return mapeo[tipo] || 'CARRERA_GRADO'; // Valor por defecto si no se encuentra
  }

  private mapearEstadoEducacion(estado: EstadoEducacion): string {
    const mapeo: Record<EstadoEducacion, string> = {
      [EstadoEducacion.FINALIZADO]: 'Completado',
      [EstadoEducacion.EN_PROCESO]: 'En Curso'
    };
    return mapeo[estado] || 'En Curso';
  }

  private mapearTipoActividad(tipo?: TipoActividadCientifica): string | undefined {
    if (!tipo) return undefined;
    const mapeo: Record<TipoActividadCientifica, string> = {
      [TipoActividadCientifica.INVESTIGACION]: 'INVESTIGACION',
      [TipoActividadCientifica.PONENCIA]: 'PONENCIA',
      [TipoActividadCientifica.PUBLICACION]: 'PUBLICACION'
    };
    return mapeo[tipo] || undefined;
  }

  private mapearRolActividad(caracter?: CaracterActividadCientifica): string | undefined {
    if (!caracter) return undefined;
    const mapeo: Record<CaracterActividadCientifica, string> = {
      [CaracterActividadCientifica.AYUDANTE_PARTICIPANTE]: 'AYUDANTE_PARTICIPANTE',
      [CaracterActividadCientifica.AUTOR_DISERTANTE]: 'AUTOR_DISERTANTE'
    };
    return mapeo[caracter] || undefined;
  }

  /**
   * Finaliza el proceso de guardado, emite el evento y cierra el modal.
   * @param exito Indica si la operación fue exitosa.
   * @param educacion El objeto de educación guardado (si aplica).
   * @param error El mensaje de error (si aplica).
   */
  private finalizarGuardado(exito: boolean, educacion: Educacion | null, error: string | null): void {
    if (exito && educacion) {
      this.educacionGuardadaResultado = educacion;
      this.educacionGuardada.emit(educacion);
      this.mensajeExito$.next('Educación guardada exitosamente.');
      this.estado$.next(EstadoFormulario.GUARDADO_EXITOSO);
      this.educacionService.limpiarBorrador(); // Limpiar borrador al guardar con éxito
      this.cerrarModal(); // Cerrar el modal al finalizar exitosamente
    } else {
      this.error$.next(error || 'Error desconocido al guardar educación.');
      this.estado$.next(EstadoFormulario.ERROR);
    }
    this.cargando$.next(false);
    this.cdr.markForCheck();
  }

  // Cerrar el modal
  cerrarModal(): void {
    this.cerrar.emit();
    // Restablecer el estado del componente
    this.pasoActual = PasoWizard.SELECCION_TIPO;
    this.cargando$.next(false);
    this.error$.next(null);
    this.estado$.next(EstadoFormulario.INICIAL);
    this.mensajeExito$.next(null);
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.educacionGuardadaResultado = null;

    // Resetear formularios
    this.formularioTipo.reset();
    this.formularioBase?.reset(); // Usar optional chaining
    this.formularioEspecifico?.reset(); // Usar optional chaining
    this.formularioDocumentos?.reset(); // Usar optional chaining

    this.cdr.markForCheck();
  }

  // Información resumida para mostrar en la confirmación
  obtenerResumenEducacion(): string[] {
    const resumen: string[] = [];
    try {
      const educacion = this.construirEducacion();

      resumen.push(`Tipo: ${educacion.tipo}`);
      resumen.push(`Estado: ${educacion.estado}`);
      resumen.push(`Título: ${educacion.titulo}`);
      resumen.push(`Institución: ${educacion.institucion}`);

      if (educacion.fechaEmision) {
        resumen.push(`Fecha de Emisión: ${new Date(educacion.fechaEmision).toLocaleDateString()}`);
      }

      // Propiedades específicas según el tipo
      switch (educacion.tipo) {
        case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
        case TipoEducacion.CARRERA_GRADO:
          resumen.push(`Duración: ${educacion.duracionAnios} años`);
          resumen.push(`Promedio: ${educacion.promedio}`);
          break;

        case TipoEducacion.POSGRADO_ESPECIALIZACION:
        case TipoEducacion.POSGRADO_MAESTRIA:
        case TipoEducacion.POSGRADO_DOCTORADO:
          resumen.push(`Tema de Tesis: ${educacion.temaTesis}`);
          break;

        case TipoEducacion.DIPLOMATURA:
        case TipoEducacion.CURSO_CAPACITACION:
          resumen.push(`Carga Horaria: ${educacion.cargaHoraria} horas`);
          resumen.push(`Evaluación Final: ${educacion.tuvoEvaluacionFinal ? 'Sí' : 'No'}`);
          break;

        case TipoEducacion.ACTIVIDAD_CIENTIFICA:
          resumen.push(`Tipo de Actividad: ${educacion.tipoActividad}`);
          resumen.push(`Tema: ${educacion.tema}`);
          resumen.push(`Carácter: ${educacion.caracter}`);
          resumen.push(`Lugar y Fecha de Exposición: ${educacion.lugarFechaExposicion}`);
          if (educacion.comentarios) resumen.push(`Comentarios: ${educacion.comentarios}`);
          break;
      }

      if (this.archivoSeleccionado) {
        resumen.push(`Documento adjunto: ${this.archivoSeleccionado.name}`);
      } else if (educacion.documentoPdf) {
        // Asumiendo que documentoPdf podría ser una URL o similar si ya está guardado
        resumen.push(`Documento adjunto (existente): Sí`);
      }

    } catch (error) {
      console.error('Error al obtener resumen de educación:', error);
      resumen.push('Error al generar el resumen. Por favor, revise los datos.');
    }
    return resumen;
  }

  /**
   * Agrega otra educación después de guardar la actual
   */
  agregarOtraEducacion(): void {
    // Reiniciar el wizard para agregar otra educación
    this.reiniciarWizard();
    console.log('Preparando para agregar otra educación');
  }

  /**
   * Cierra el modal después de guardar
   */
  cerrarDespuesDeGuardado(): void {
    // Emitir evento para cerrar el modal o navegar
    console.log('Cerrando después de guardar');
    // TODO: Implementar lógica para cerrar modal o navegar
  }

  /**
   * Reintenta la operación de guardado
   */
  reintentar(): void {
    // Reintentar el último paso de guardado
    this.guardarEducacion();
    console.log('Reintentando operación');
  }

  /**
   * Cancela la operación actual
   */
  cancelar(): void {
    // Cancelar y cerrar el wizard
    this.reiniciarWizard();
    console.log('Operación cancelada');
    // TODO: Implementar lógica para cerrar modal o navegar
  }

  /**
   * Reinicia el wizard a su estado inicial
   */
  private reiniciarWizard(): void {
    this.pasoActual = PasoWizard.SELECCION_TIPO;
    this.tipoSeleccionado = undefined;
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.resultadoGuardado = null;

    // Reiniciar formularios
    this.formularioTipo?.reset();
    this.formularioBase?.reset();
    this.formularioEspecifico?.reset();
    this.formularioDocumentos?.reset();
  }
}
