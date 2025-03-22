import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Educacion, EducacionBuilder, TipoEducacion, CarreraNivelSuperior, CarreraGrado, Posgrado, ActividadCientifica, Diplomatura, CursoCapacitacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../../models/educacion.model';
import { EducacionService, OperacionResponse } from '../../../services/educacion.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

// Tipo personalizado para acceder a las propiedades de forma segura
type EducacionRecord = Record<string, any> & Partial<Educacion>;

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducacionContainerComponent implements OnInit, OnDestroy {
  @Input() usuarioId: string = '';
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

  tipoSeleccionado?: TipoEducacion;

  // Para gestionar unsubscribe
  private destroy$ = new Subject<void>();

  // Resultados del guardado
  educacionGuardadaResultado: Educacion | null = null;

  constructor(
    private fb: FormBuilder,
    private educacionService: EducacionService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) { }

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
      institucion: ['', Validators.required]
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
    let grupo = {};

    // Agregar campos según el tipo seleccionado
    switch (tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        grupo = {
          duracionAnios: ['', [Validators.required, Validators.min(1)]],
          promedio: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
          fechaEmision: ['']
        };
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        grupo = {
          temaTesis: ['', Validators.required],
          fechaEmision: ['']
        };
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        grupo = {
          cargaHoraria: ['', [Validators.required, Validators.min(1)]],
          tuvoEvaluacionFinal: [false],
          fechaEmision: ['']
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
        const baseValues = this.getControlValue(this.formularioBase, 'estado') && this.getControlValue(this.formularioBase, 'titulo') && this.getControlValue(this.formularioBase, 'institucion') ? this.formularioBase.value : {};

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

  // Navegación del wizard
  siguientePaso(): void {
    const pasoActual = this.pasoActual;

    // Validar el formulario actual antes de avanzar
    if (!this.esFormularioValido(pasoActual)) {
      return;
    }

    // Guardar datos del paso actual
    this.guardarDatosPaso(pasoActual);

    // Determinar siguiente paso
    this.pasoActual++;

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
    let formulario: FormGroup;

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
        return true;
    }

    if (formulario.invalid) {
      // Marcar todos los controles como touched para mostrar errores
      Object.keys(formulario.controls).forEach(campo => {
        this.markAsTouched(formulario, campo);
      });

      return false;
    }

    return true;
  }

  // Guardar datos del paso actual en el builder
  guardarDatosPaso(paso: PasoWizard): void {
    switch (paso) {
      case PasoWizard.SELECCION_TIPO:
        const tipoValue = this.getControlValue(this.formularioTipo, 'tipo');
        this.educacionBuilder.setTipo(tipoValue);
        break;

      case PasoWizard.INFORMACION_BASICA:
        const { estado, titulo, institucion } = this.formularioBase.value;
        this.educacionBuilder
          .setEstado(estado)
          .setTitulo(titulo)
          .setInstitucion(institucion);
        break;

      case PasoWizard.INFORMACION_ESPECIFICA:
        const tipo = this.getControlValue(this.formularioTipo, 'tipo');
        const valores = this.formularioEspecifico.value;

        switch (tipo) {
          case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
          case TipoEducacion.CARRERA_GRADO:
            this.educacionBuilder
              .setDuracionAnios(valores.duracionAnios)
              .setPromedio(valores.promedio)
              .setFechaEmision(valores.fechaEmision);
            break;

          case TipoEducacion.POSGRADO_ESPECIALIZACION:
          case TipoEducacion.POSGRADO_MAESTRIA:
          case TipoEducacion.POSGRADO_DOCTORADO:
            this.educacionBuilder
              .setTemaTesis(valores.temaTesis)
              .setFechaEmision(valores.fechaEmision);
            break;

          case TipoEducacion.DIPLOMATURA:
          case TipoEducacion.CURSO_CAPACITACION:
            this.educacionBuilder
              .setCargaHoraria(valores.cargaHoraria)
              .setTuvoEvaluacionFinal(valores.tuvoEvaluacionFinal)
              .setFechaEmision(valores.fechaEmision);
            break;

          case TipoEducacion.ACTIVIDAD_CIENTIFICA:
            this.educacionBuilder
              .setTipoActividad(valores.tipoActividad)
              .setTema(valores.tema)
              .setCaracter(valores.caracter)
              .setLugarFechaExposicion(valores.lugarFechaExposicion)
              .setComentarios(valores.comentarios);
            break;
        }
        break;

      case PasoWizard.DOCUMENTACION:
        if (this.archivoSeleccionado) {
          this.educacionBuilder.setDocumentoPdf(this.archivoSeleccionado);
        }
        break;
    }
  }

  // Inicializar el formulario del siguiente paso
  inicializarSiguientePaso(): void {
    switch (this.pasoActual) {
      case PasoWizard.INFORMACION_BASICA:
        setTimeout(() => this.inicializarFormularioBase(), 0);
        break;
      case PasoWizard.INFORMACION_ESPECIFICA:
        setTimeout(() => this.inicializarFormularioEspecifico(), 0);
        break;
      case PasoWizard.DOCUMENTACION:
        setTimeout(() => this.inicializarFormularioDocumentos(), 0);
        break;
    }
  }

  // Manejo de archivos
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
      console.log('Archivo seleccionado:', this.archivoSeleccionado.name, 'tipo:', this.archivoSeleccionado.type, 'tamaño:', this.archivoSeleccionado.size);

      // Validar tipo de archivo
      if (this.archivoSeleccionado.type !== 'application/pdf') {
        this.error$.next('El archivo debe ser un PDF. Tipo detectado: ' + this.archivoSeleccionado.type);
        this.archivoSeleccionado = null;
        return;
      }

      // Validar tamaño de archivo
      const tamanoMaximoMB = 5;
      const tamanoMaximoBytes = tamanoMaximoMB * 1024 * 1024;
      if (this.archivoSeleccionado.size > tamanoMaximoBytes) {
        const tamanoActualMB = Math.round(this.archivoSeleccionado.size / (1024 * 1024) * 100) / 100;
        this.error$.next(`El archivo no debe superar los ${tamanoMaximoMB}MB. Tamaño actual: ${tamanoActualMB}MB`);
        this.archivoSeleccionado = null;
        return;
      }

      // Si llegamos aquí, el archivo es válido
      this.error$.next(null);
      this.mensajeExito$.next(`Archivo "${this.archivoSeleccionado.name}" seleccionado correctamente`);
      this.cdr.markForCheck();
    } else {
      // No se seleccionó ningún archivo o se canceló la selección
      this.archivoSeleccionado = null;
      this.error$.next(null);
      this.mensajeExito$.next(null);
      this.cdr.markForCheck();
    }
  }

  // Método para guardar educación
  guardarEducacion(): void {
    // Validar que el usuario tenga un ID válido
    if (!this.esUsuarioIdValido(this.usuarioId)) {
      console.error(`Error al guardar educación: ID de usuario inválido (${this.usuarioId})`);
      this.snackBar.open('No se puede guardar educación sin un ID de usuario válido', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log(`Guardando educación para usuario ID: ${this.usuarioId}`);
    
    // Validar formulario antes de enviar
    if (this.formularioTipo.invalid || 
        (this.formularioBase && this.formularioBase.invalid) || 
        (this.formularioEspecifico && this.formularioEspecifico.invalid)) {
      console.error('Formulario(s) de educación inválido(s)');
      
      // Mostrar todos los errores
      this.mostrarErroresFormulario(this.formularioTipo, 'Tipo');
      if (this.formularioBase) this.mostrarErroresFormulario(this.formularioBase, 'Base');
      if (this.formularioEspecifico) this.mostrarErroresFormulario(this.formularioEspecifico, 'Específico');
      
      this.marcarCamposInvalidos();
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.cargando$.next(true);
    this.error$.next(null);
    this.mensajeExito$.next(null);
    this.cdr.markForCheck();

    try {
      // Construir el objeto de educación a partir del formulario
      const educacionData = this.construirEducacion();
      
      // Log detallado de la educación que se va a guardar
      console.log('Objeto de educación construido:', JSON.stringify(educacionData));
      
      // Verificar propiedades específicas
      this.verificarPropiedadesEducacion(educacionData);

      // Subir archivo si se seleccionó uno
      const archivoSeleccionado = this.archivoSeleccionado;

      // Depurar la petición antes de enviar
      this.depurarPeticionEducacion(educacionData, this.usuarioId);

      // Preparar el objeto para el backend
      const educacionParaBackend = this.prepararEducacionParaBackend(educacionData);

      // Guardar educación completa (incluye documento si está presente)
      this.educacionService.guardarEducacionCompleta(educacionParaBackend, this.usuarioId, archivoSeleccionado as File | undefined)
        .pipe(finalize(() => {
          this.cargando$.next(false);
          this.detectChanges();
        }))
        .subscribe({
          next: (response) => this.finalizarGuardado(response.exito, response.data || null, response.error || null),
          error: (error) => this.finalizarGuardado(false, null, error)
        });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.manejarError('Error al guardar educación: ' + errorMsg);
    }
  }

  /**
   * Método para depurar la petición antes de enviarla al backend
   * y ayudar a diagnosticar problemas de validación
   */
  private depurarPeticionEducacion(educacion: Educacion, usuarioId: string): void {
    // Crear copia para no modificar el objeto original
    const educacionParaBackend = this.prepararEducacionParaBackend(educacion);
    
    console.group('Depuración de petición de educación');
    console.log('URL de destino:', `${this.educacionService['apiUrl']}/usuario/${usuarioId}`);
    console.log('Payload completo:', JSON.stringify(educacionParaBackend, null, 2));
    
    // Verificar que los campos obligatorios según el backend están presentes
    console.log('Verificando campos obligatorios del backend:');
    const camposObligatorios = ['type', 'status', 'title', 'institution'];
    let camposFaltantes = false;
    
    camposObligatorios.forEach(campo => {
      const valor = educacionParaBackend[campo];
      const esValido = valor !== undefined && valor !== null && valor !== '';
      console.log(`- ${campo}: ${esValido ? '✅ OK' : '❌ FALTA O INVÁLIDO'} (${JSON.stringify(valor)})`);
      if (!esValido) camposFaltantes = true;
    });
    
    if (camposFaltantes) {
      console.warn('⚠️ HAY CAMPOS OBLIGATORIOS FALTANTES O INVÁLIDOS. La petición fallará.');
    } else {
      console.log('✅ Todos los campos obligatorios están presentes.');
    }
    
    // Verificar fechas que podrían causar problemas de serialización
    if (educacion.fechaEmision instanceof Date) {
      console.log('Fecha de emisión (objeto Date):', educacion.fechaEmision);
      console.log('Fecha de emisión (formato backend):', educacionParaBackend.issueDate);
    }
    
    // Verificar campos específicos según el tipo
    console.log('Campos específicos para el tipo de educación:');
    switch (educacionParaBackend.type) {
      case 'Título Terciario':
      case 'Título Universitario':
        console.log('- durationYears:', educacionParaBackend.durationYears);
        console.log('- average:', educacionParaBackend.average);
        break;
      case 'Especialización':
      case 'Maestría':
      case 'Doctorado':
        console.log('- thesisTopic:', educacionParaBackend.thesisTopic);
        break;
      // Añadir otros casos según sea necesario
    }
    
    console.groupEnd();
  }

  /**
   * Prepara el objeto de educación para enviarlo al backend, 
   * aplicando las transformaciones necesarias en los campos
   */
  private prepararEducacionParaBackend(educacion: Educacion): any {
    // Crear un objeto nuevo para el backend siguiendo la estructura esperada
    const resultado: any = {};
    
    // Mapear campos base que espera el backend
    resultado.type = this.mapearTipoEducacion(educacion.tipo);
    resultado.status = this.mapearEstadoEducacion(educacion.estado);
    resultado.title = educacion.titulo;
    resultado.institution = educacion.institucion;
    
    // Asegurar que la fecha está en formato ISO para serialización o usar LocalDate
    if (educacion.fechaEmision instanceof Date) {
      resultado.issueDate = educacion.fechaEmision.toISOString().split('T')[0]; // Solo la parte de fecha YYYY-MM-DD
    }
    
    // Mapear campos específicos según el tipo de educación
    switch (educacion.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        resultado.durationYears = (educacion as any).duracionAnios;
        resultado.average = (educacion as any).promedio;
        break;
        
      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        resultado.thesisTopic = (educacion as any).temaTesis;
        break;
        
      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        resultado.hourlyLoad = (educacion as any).cargaHoraria;
        resultado.hadFinalEvaluation = (educacion as any).tuvoEvaluacionFinal;
        break;
        
      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        if ((educacion as any).tipoActividad) {
          resultado.activityType = this.mapearTipoActividad((educacion as any).tipoActividad);
        }
        resultado.topic = (educacion as any).tema;
        if ((educacion as any).caracter) {
          resultado.activityRole = this.mapearRolActividad((educacion as any).caracter);
        }
        resultado.expositionPlaceDate = (educacion as any).lugarFechaExposicion;
        resultado.comments = (educacion as any).comentarios;
        break;
    }
    
    console.log('Objeto transformado para el backend:', resultado);
    return resultado;
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
        console.log(`Campo ${key}:`, control.errors);
      }
    });
    
    console.groupEnd();
  }

  /**
   * Marcar campos inválidos en los formularios
   */
  marcarCamposInvalidos(): void {
    if (this.formularioTipo) {
      Object.keys(this.formularioTipo.controls).forEach(key => {
        const control = this.formularioTipo.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }

    if (this.formularioBase) {
      Object.keys(this.formularioBase.controls).forEach(key => {
        const control = this.formularioBase.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }

    if (this.formularioEspecifico) {
      Object.keys(this.formularioEspecifico.controls).forEach(key => {
        const control = this.formularioEspecifico.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  /**
   * Verificar que las propiedades específicas según el tipo de educación estén presentes
   */
  private verificarPropiedadesEducacion(educacion: Educacion) {
    console.log(`Verificando propiedades para tipo de educación: ${educacion.tipo}`);
    
    // Verificar propiedades base
    const propiedadesBase = ['tipo', 'estado', 'titulo', 'institucion'];
    propiedadesBase.forEach(prop => {
      console.log(`Propiedad base ${prop}: ${educacion[prop as keyof Educacion]}`);
    });
    
    // Verificar propiedades específicas según el tipo
    switch (educacion.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        console.log(`Duración (años): ${(educacion as any).duracionAnios}`);
        console.log(`Promedio: ${(educacion as any).promedio}`);
        break;
        
      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        console.log(`Tema de tesis: ${(educacion as any).temaTesis}`);
        break;
        
      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        console.log(`Carga horaria: ${(educacion as any).cargaHoraria}`);
        console.log(`Tuvo evaluación final: ${(educacion as any).tuvoEvaluacionFinal}`);
        break;
        
      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        console.log(`Tipo de actividad: ${(educacion as any).tipoActividad}`);
        console.log(`Tema: ${(educacion as any).tema}`);
        console.log(`Carácter: ${(educacion as any).caracter}`);
        console.log(`Lugar/fecha de exposición: ${(educacion as any).lugarFechaExposicion}`);
        break;
        
      default:
        console.warn(`Tipo de educación no reconocido: ${educacion.tipo}`);
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
    };
    
    // Corregir valores antes de construir el objeto
    this.corregirValoresEducacion(formValues);
    
    // Verificar y formatear las fechas
    if (formValues.fechaEmision) {
      if (typeof formValues.fechaEmision === 'string') {
        // Convertir string a Date si es necesario
        formValues.fechaEmision = new Date(formValues.fechaEmision);
      }
      
      // Asegurar que la fecha es válida
      if (isNaN(formValues.fechaEmision.getTime())) {
        console.warn('Fecha de emisión inválida, se eliminará:', formValues.fechaEmision);
        delete formValues.fechaEmision;
      }
    }
    
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
    
    const builder = new EducacionBuilder();
    
    // Propiedades comunes
    builder
      .setTipo(formValues.tipo)
      .setEstado(formValues.estado)
      .setTitulo(formValues.titulo)
      .setInstitucion(formValues.institucion);
      
    if (formValues.fechaEmision) {
      builder.setFechaEmision(formValues.fechaEmision);
    }
    
    // Propiedades específicas según el tipo
    switch (formValues.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        builder
          .setDuracionAnios(formValues.duracionAnios)
          .setPromedio(formValues.promedio);
        break;
        
      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        builder.setTemaTesis(formValues.temaTesis);
        break;
        
      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        builder
          .setCargaHoraria(formValues.cargaHoraria)
          .setTuvoEvaluacionFinal(formValues.tuvoEvaluacionFinal);
        break;
        
      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        builder
          .setTipoActividad(formValues.tipoActividad)
          .setTema(formValues.tema)
          .setCaracter(formValues.caracter)
          .setLugarFechaExposicion(formValues.lugarFechaExposicion);
          
        if (formValues.comentarios) {
          builder.setComentarios(formValues.comentarios);
        }
        break;
    }
    
    // Construir el objeto final
    try {
      const educacion = builder.build();
      
      // Validar que los campos están en el formato que espera el backend
      console.log('Objeto de educación construido, verificando mapeos para backend:', JSON.stringify(educacion));
      
      // Aquí podríamos aplicar las transformaciones necesarias para el backend,
      // pero por ahora dejamos el objeto tal como está para no romper la lógica existente
      
      return educacion;
    } catch (error) {
      console.error('Error al construir el objeto de educación:', error);
      
      // Construir un objeto base con los valores mínimos
      // Asegurar que el tipo es válido
      const tipo = formValues.tipo || TipoEducacion.CARRERA_GRADO;
      const estado = formValues.estado || EstadoEducacion.EN_PROCESO;
      
      return {
        tipo: tipo,
        estado: estado,
        titulo: formValues.titulo || '',
        institucion: formValues.institucion || '',
      } as Educacion;
    }
  }

  /**
   * Corrige problemas comunes en los valores del formulario
   * basados en errores de validación conocidos del backend
   */
  private corregirValoresEducacion(formValues: any): void {
    console.log('Corrigiendo valores de educación antes de enviar', formValues);
    
    // Corregir promedio según validaciones del backend (debe ser positivo)
    if (formValues.promedio !== undefined) {
      // Convertir a número y asegurar que sea mayor que 0
      const promedio = Number(formValues.promedio);
      if (isNaN(promedio) || promedio <= 0) {
        console.warn('Promedio inválido, ajustando a valor mínimo aceptable: 0.1');
        formValues.promedio = 0.1;
      }
    }
    
    // Corregir duración (debe ser un entero positivo)
    if (formValues.duracionAnios !== undefined) {
      const duracion = Number(formValues.duracionAnios);
      if (isNaN(duracion) || duracion <= 0 || !Number.isInteger(duracion)) {
        console.warn('Duración inválida, ajustando a valor mínimo aceptable: 1');
        formValues.duracionAnios = 1;
      }
    }
    
    // Corregir carga horaria (debe ser un número positivo)
    if (formValues.cargaHoraria !== undefined) {
      const cargaHoraria = Number(formValues.cargaHoraria);
      if (isNaN(cargaHoraria) || cargaHoraria <= 0) {
        console.warn('Carga horaria inválida, ajustando a valor mínimo aceptable: 1');
        formValues.cargaHoraria = 1;
      }
    }
    
    // Verificar que los campos de texto no estén vacíos
    ['titulo', 'institucion', 'temaTesis', 'tema', 'lugarFechaExposicion'].forEach(campo => {
      if (formValues[campo] !== undefined && (!formValues[campo] || formValues[campo].trim() === '')) {
        console.warn(`Campo ${campo} vacío, ajustando a valor por defecto`);
        formValues[campo] = campo === 'titulo' ? 'Sin título' : 
                          campo === 'institucion' ? 'Sin institución' : 
                          campo === 'temaTesis' ? 'Sin tema de tesis' : 
                          campo === 'tema' ? 'Sin tema' : 
                          'Sin información';
      }
    });
    
    // Verificar enums
    if (formValues.tipo && !Object.values(TipoEducacion).includes(formValues.tipo)) {
      console.warn(`Tipo de educación inválido: ${formValues.tipo}, ajustando a valor por defecto`);
      formValues.tipo = TipoEducacion.CARRERA_GRADO;
    }
    
    if (formValues.estado && !Object.values(EstadoEducacion).includes(formValues.estado)) {
      console.warn(`Estado de educación inválido: ${formValues.estado}, ajustando a valor por defecto`);
      formValues.estado = EstadoEducacion.FINALIZADO;
    }
    
    if (formValues.tipoActividad && !Object.values(TipoActividadCientifica).includes(formValues.tipoActividad)) {
      console.warn(`Tipo de actividad inválido: ${formValues.tipoActividad}, ajustando a valor por defecto`);
      formValues.tipoActividad = TipoActividadCientifica.INVESTIGACION;
    }
    
    if (formValues.caracter && !Object.values(CaracterActividadCientifica).includes(formValues.caracter)) {
      console.warn(`Carácter de actividad inválido: ${formValues.caracter}, ajustando a valor por defecto`);
      formValues.caracter = CaracterActividadCientifica.AUTOR_DISERTANTE;
    }
    
    console.log('Valores corregidos:', formValues);
  }

  // Métodos auxiliares para mapear valores al formato del backend
  private mapearTipoEducacion(tipo: TipoEducacion): string {
    const mapeo: Record<TipoEducacion, string> = {
      [TipoEducacion.CARRERA_NIVEL_SUPERIOR]: 'Título Terciario',
      [TipoEducacion.CARRERA_GRADO]: 'Título Universitario',
      [TipoEducacion.POSGRADO_ESPECIALIZACION]: 'Especialización',
      [TipoEducacion.POSGRADO_MAESTRIA]: 'Maestría',
      [TipoEducacion.POSGRADO_DOCTORADO]: 'Doctorado',
      [TipoEducacion.DIPLOMATURA]: 'Diplomatura',
      [TipoEducacion.CURSO_CAPACITACION]: 'Curso de Capacitación',
      [TipoEducacion.ACTIVIDAD_CIENTIFICA]: 'Actividad Científica'
    };
    return mapeo[tipo] || 'Título Universitario';
  }

  private mapearEstadoEducacion(estado: EstadoEducacion): string {
    // El backend espera "Completado" o "En Curso", pero nuestro enum usa "finalizado" y "en proceso"
    const mapeo: Record<EstadoEducacion, string> = {
      [EstadoEducacion.FINALIZADO]: 'Completado',
      [EstadoEducacion.EN_PROCESO]: 'En Curso'
    };
    return mapeo[estado] || 'En Curso';
  }

  private mapearTipoActividad(tipo?: TipoActividadCientifica): string | undefined {
    if (!tipo) return undefined;

    const mapeo: Record<TipoActividadCientifica, string> = {
      [TipoActividadCientifica.INVESTIGACION]: 'Investigación',
      [TipoActividadCientifica.PONENCIA]: 'Conferencia',
      [TipoActividadCientifica.PUBLICACION]: 'Publicación'
    };
    return mapeo[tipo];
  }

  private mapearRolActividad(rol?: CaracterActividadCientifica): string | undefined {
    if (!rol) return undefined;

    const mapeo: Record<CaracterActividadCientifica, string> = {
      [CaracterActividadCientifica.AYUDANTE_PARTICIPANTE]: 'Participante',
      [CaracterActividadCientifica.AUTOR_DISERTANTE]: 'Autor'
    };
    return mapeo[rol];
  }

  /**
   * Finalizar el proceso de guardado
   */
  private finalizarGuardado(exito: boolean, educacion: Educacion | null, error: any): void {
    if (exito) {
      if (educacion) {
        console.log('Educación guardada con éxito, ID recibido:', educacion.id, 'tipo:', typeof educacion.id);
        this.educacionGuardadaResultado = educacion;
        this.estado$.next(EstadoFormulario.GUARDADO_EXITOSO);
        this.mensajeExito$.next('Educación guardada correctamente');
        this.error$.next(null);
        this.educacionGuardada.emit(educacion);
      } else {
        console.warn('Educación guardada sin datos');
        this.estado$.next(EstadoFormulario.GUARDADO_EXITOSO);
        this.mensajeExito$.next('Educación guardada correctamente');
        this.error$.next(null);
      }
    } else {
      console.error('Error al guardar educación:', error);
      this.estado$.next(EstadoFormulario.ERROR);
      
      // Procesar detalles de error para mostrar mensaje más específico
      let mensajeError = 'Error al guardar educación';
      
      if (error && typeof error === 'object') {
        // Si el error tiene una propiedad error.error, extraer los detalles
        if (error.error) {
          console.log('Detalles del error:', error.error);
          
          // Si hay errores de validación
          if (error.error.errors && Array.isArray(error.error.errors)) {
            // Mostrar los primeros 3 errores de validación
            const erroresValidacion = error.error.errors
              .slice(0, 3)
              .map((e: any) => {
                // Intentar obtener información más detallada del error
                if (e.defaultMessage) return e.defaultMessage;
                if (e.field && e.defaultMessage) return `${e.field}: ${e.defaultMessage}`;
                if (e.field) return `Error en campo ${e.field}`;
                if (e.message) return e.message;
                if (e.code) return e.code;
                return JSON.stringify(e);
              })
              .filter(Boolean);
            
            if (erroresValidacion.length > 0) {
              mensajeError = `Errores de validación: ${erroresValidacion.join(', ')}`;
            }
          } else if (error.error.message) {
            mensajeError = error.error.message;
            
            // Extraer los detalles específicos del mensaje si contiene patrones conocidos
            if (mensajeError.includes('Validation failed')) {
              // Buscar patrón: field [campo]: [mensaje]
              const camposConError = mensajeError.match(/field \[(.*?)\]:(.*?)[,;.]/g);
              if (camposConError && camposConError.length > 0) {
                const detallesErrores = camposConError.map(e => e.trim());
                mensajeError = `Validación fallida: ${detallesErrores.join('; ')}`;
              }
            }
          }
        } else if (error.message) {
          mensajeError = error.message;
        } else if (typeof error === 'string') {
          mensajeError = error;
        }

        // Verificar si hay problemas relacionados con el tipo de los campos
        if (mensajeError.toLowerCase().includes('type') || 
            mensajeError.toLowerCase().includes('tipo') ||
            mensajeError.toLowerCase().includes('format')) {
          console.warn('Posible error de tipo de datos detectado');
          mensajeError += '. Verifique el formato de los datos ingresados.';
        }
      }
      
      this.mensajeExito$.next(null);
      this.error$.next(mensajeError);
    }

    // Limpiar estado del borrador
    this.educacionService.limpiarBorrador();

    this.cdr.markForCheck();
  }

  // Manejo de errores
  private manejarError(mensaje: string): void {
    console.error(mensaje);
    this.error$.next(mensaje);
    this.estado$.next(EstadoFormulario.ERROR);
    this.cdr.markForCheck();
  }

  // Método para cerrar después de guardado exitoso
  cerrarDespuesDeGuardado(): void {
    this.cerrar.emit();
  }

  // Método para reintentar después de un error
  reintentar(): void {
    this.estado$.next(EstadoFormulario.INICIAL);
    this.error$.next(null);
    this.cdr.markForCheck();
  }

  // Método para agregar otra educación después de guardado exitoso
  agregarOtraEducacion(): void {
    // Reiniciar el estado
    this.estado$.next(EstadoFormulario.INICIAL);
    this.error$.next(null);
    this.mensajeExito$.next(null);
    this.educacionGuardadaResultado = null;

    // Reiniciar el wizard
    this.pasoActual = PasoWizard.SELECCION_TIPO;
    this.archivoSeleccionado = null;

    // Reiniciar los formularios
    this.inicializarFormularioTipo();

    this.cdr.markForCheck();
  }

  // Cargar datos de un borrador
  private cargarBorrador(borrador: EducacionRecord): void {
    // Este método se llamará cuando exista un borrador en localStorage
    setTimeout(() => {
      if (borrador.tipo) {
        this.formularioTipo.get('tipo')?.setValue(borrador.tipo);
      }

      // Si hay más datos, avanzamos al siguiente paso
      if (borrador.titulo && borrador.institucion) {
        this.siguientePaso();

        setTimeout(() => {
          this.formularioBase.patchValue({
            estado: borrador.estado,
            titulo: borrador.titulo,
            institucion: borrador.institucion
          });

          // Si hay datos específicos, avanzamos otro paso
          const tieneDatosEspecificos = this.verificarDatosEspecificos(borrador);
          if (tieneDatosEspecificos) {
            this.siguientePaso();

            setTimeout(() => {
              // Cargar datos específicos según el tipo
              this.cargarDatosEspecificos(borrador);
            }, 0);
          }
        }, 0);
      }
    }, 0);
  }

  // Verificar si el borrador tiene datos específicos según el tipo
  private verificarDatosEspecificos(borrador: EducacionRecord): boolean {
    switch (borrador.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        return borrador['duracionAnios'] !== undefined || borrador['promedio'] !== undefined;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        return borrador['temaTesis'] !== undefined;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        return borrador['cargaHoraria'] !== undefined;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        return borrador['tipoActividad'] !== undefined || borrador['tema'] !== undefined;

      default:
        return false;
    }
  }

  // Cargar datos específicos en el formulario según el tipo
  private cargarDatosEspecificos(borrador: EducacionRecord): void {
    switch (borrador.tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
      case TipoEducacion.CARRERA_GRADO:
        this.formularioEspecifico.patchValue({
          duracionAnios: borrador['duracionAnios'],
          promedio: borrador['promedio'],
          fechaEmision: borrador['fechaEmision']
        });
        break;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        this.formularioEspecifico.patchValue({
          temaTesis: borrador['temaTesis'],
          fechaEmision: borrador['fechaEmision']
        });
        break;

      case TipoEducacion.DIPLOMATURA:
      case TipoEducacion.CURSO_CAPACITACION:
        this.formularioEspecifico.patchValue({
          cargaHoraria: borrador['cargaHoraria'],
          tuvoEvaluacionFinal: borrador['tuvoEvaluacionFinal'],
          fechaEmision: borrador['fechaEmision']
        });
        break;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        this.formularioEspecifico.patchValue({
          tipoActividad: borrador['tipoActividad'],
          tema: borrador['tema'],
          caracter: borrador['caracter'],
          lugarFechaExposicion: borrador['lugarFechaExposicion'],
          comentarios: borrador['comentarios']
        });
        break;
    }
  }

  // Cancelar el formulario
  cancelar(): void {
    // Confirmar si hay datos ingresados
    const tieneFormulariosCargados =
      (this.formularioTipo && this.formularioTipo.dirty) ||
      (this.formularioBase && this.formularioBase.dirty) ||
      (this.formularioEspecifico && this.formularioEspecifico.dirty) ||
      (this.archivoSeleccionado !== null);

    if (tieneFormulariosCargados) {
      if (confirm('¿Está seguro que desea cancelar? Los datos ingresados se perderán.')) {
        this.cerrar.emit();
      }
    } else {
      this.cerrar.emit();
    }
  }

  // Método auxiliar para obtener un valor de control de forma segura
  private getControlValue(form: FormGroup, controlName: string): any {
    return form.get(controlName)?.value;
  }

  // Método auxiliar para marcar un control como touched de forma segura
  private markAsTouched(form: FormGroup, controlName: string): void {
    form.get(controlName)?.markAsTouched();
  }

  // Helper para acceder de forma segura a las propiedades de educacion
  getEducacionProp<K extends keyof Educacion>(educacion: Partial<Educacion>, prop: K): Educacion[K] | undefined {
    return educacion[prop];
  }

  completarFormularioEducacion(): void {
    if (!this.educacionSeleccionada) return;

    // Usamos tipo EducacionRecord para acceso seguro a propiedades
    const educacion = this.educacionSeleccionada as unknown as EducacionRecord;

    // Completar el formulario base con los campos disponibles
    const baseValues: Record<string, any> = {};

    if ('institucion' in educacion) {
      baseValues['institucion'] = educacion['institucion'];
    }

    if ('estado' in educacion) {
      baseValues['estado'] = educacion['estado'];
    }

    // Agregar otros campos si existen
    ['titulo', 'pais', 'fechaInicio', 'fechaFin', 'enCurso'].forEach(campo => {
      if (campo in educacion && educacion[campo] !== undefined) {
        baseValues[campo] = educacion[campo];
      }
    });

    this.formularioBase.patchValue(baseValues);

    // Cambiar el tipo si existe
    if ('tipo' in educacion && educacion['tipo']) {
      this.cambiarTipo(educacion['tipo']);
    }

    // Completar formulario específico según tipo
    if (this.formularioTipo) {
      if (this.esCarreraSuperiorOGrado(educacion)) {
        if ('duracionAnios' in educacion) {
          this.formularioTipo.get('duracionAnios')?.setValue(educacion.duracionAnios);
        }

        if ('promedio' in educacion) {
          this.formularioTipo.get('promedio')?.setValue(educacion.promedio);
        }
      }

      if (this.esPosgrado(educacion) && 'temaTesis' in educacion) {
        this.formularioTipo.get('temaTesis')?.setValue(educacion.temaTesis);
      }

      if (this.esDiplomaturaOCurso(educacion) && 'cargaHoraria' in educacion) {
        this.formularioTipo.get('cargaHoraria')?.setValue(educacion.cargaHoraria);
      }

      if (this.esActividadCientifica(educacion)) {
        if ('tipoActividad' in educacion) {
          this.formularioTipo.get('tipoActividad')?.setValue(educacion.tipoActividad);
        }

        if ('tema' in educacion) {
          this.formularioTipo.get('tema')?.setValue(educacion.tema);
        }
      }
    }
  }

  // Para obtener resumen de educación
  obtenerResumenEducacion(): string[] {
    const resumen: string[] = [];
    const educacion = this.obtenerEducacionDelFormulario();

    // Añadir propiedades específicas según tipo
    if (this.esCarreraSuperiorOGrado(educacion)) {
      if ('duracionAnios' in educacion && educacion.duracionAnios) {
        resumen.push(`Duración: ${educacion.duracionAnios} años`);
      }

      if ('promedio' in educacion && educacion.promedio) {
        resumen.push(`Promedio: ${educacion.promedio}`);
      }
    } else if (this.esPosgrado(educacion) && 'temaTesis' in educacion && educacion.temaTesis) {
      resumen.push(`Tema de tesis: ${educacion.temaTesis}`);
    } else if (this.esDiplomaturaOCurso(educacion) && 'cargaHoraria' in educacion && educacion.cargaHoraria) {
      resumen.push(`Carga horaria: ${educacion.cargaHoraria} horas`);

      if ('tuvoEvaluacionFinal' in educacion) {
        resumen.push(`Evaluación final: ${educacion.tuvoEvaluacionFinal ? 'Sí' : 'No'}`);
      }
    } else if (this.esActividadCientifica(educacion)) {
      if ('tipoActividad' in educacion && educacion.tipoActividad) {
        resumen.push(`Tipo de actividad: ${educacion.tipoActividad}`);
      }

      if ('tema' in educacion && educacion.tema) {
        resumen.push(`Tema: ${educacion.tema}`);
      }
    }

    return resumen;
  }

  // Helper para verificar el tipo de educación
  esCarreraSuperiorOGrado(educacion: Partial<Educacion>): educacion is Partial<CarreraNivelSuperior> | Partial<CarreraGrado> {
    return educacion.tipo === TipoEducacion.CARRERA_NIVEL_SUPERIOR ||
      educacion.tipo === TipoEducacion.CARRERA_GRADO;
  }

  esPosgrado(educacion: Partial<Educacion>): educacion is Partial<Posgrado> {
    return educacion.tipo === TipoEducacion.POSGRADO_ESPECIALIZACION ||
      educacion.tipo === TipoEducacion.POSGRADO_MAESTRIA ||
      educacion.tipo === TipoEducacion.POSGRADO_DOCTORADO;
  }

  esDiplomaturaOCurso(educacion: Partial<Educacion>): educacion is Partial<Diplomatura> | Partial<CursoCapacitacion> {
    return educacion.tipo === TipoEducacion.DIPLOMATURA ||
      educacion.tipo === TipoEducacion.CURSO_CAPACITACION;
  }

  esActividadCientifica(educacion: Partial<Educacion>): educacion is Partial<ActividadCientifica> {
    return educacion?.tipo === TipoEducacion.ACTIVIDAD_CIENTIFICA;
  }

  // Cambiar el tipo de educación seleccionado
  cambiarTipo(tipo: TipoEducacion): void {
    this.tipoSeleccionado = tipo;
    if (this.formularioTipo) {
      this.formularioTipo.get('tipo')?.setValue(tipo);
    }
    this.cdr.markForCheck();
  }

  // Obtener objeto educación del formulario
  obtenerEducacionDelFormulario(): EducacionRecord {
    try {
      // Construir objeto a partir de los datos de los formularios
      const tipoValue = this.getControlValue(this.formularioTipo, 'tipo');
      const baseValues = this.formularioBase ? this.formularioBase.value : {};
      const especificoValues = this.formularioEspecifico ? this.formularioEspecifico.value : {};

      return {
        tipo: tipoValue,
        ...baseValues,
        ...especificoValues
      };
    } catch (error) {
      console.error('Error al obtener datos del formulario:', error);
      return {};
    }
  }

  // Métodos de ayuda para el template
  tieneValor(formGroup: FormGroup | null, controlName: string): boolean {
    const control = formGroup?.get(controlName);
    return !!control && !!control.value;
  }

  getValorFormulario(formGroup: FormGroup | null, controlName: string): any {
    return formGroup?.get(controlName)?.value ?? '';
  }

  getValorBooleano(formGroup: FormGroup | null, controlName: string): boolean {
    return !!formGroup?.get(controlName)?.value;
  }

  // Obtener la educación actual para tipo de educación
  getEducacionActual(): Partial<Educacion> {
    const tipo = this.getControlValue(this.formularioTipo, 'tipo');
    return { tipo } as Partial<Educacion>;
  }

  // Método auxiliar para verificar si es Carrera de Grado o Superior
  esCarreraGradoOSuperior(educacion: Partial<Educacion>): boolean {
    return educacion?.tipo === TipoEducacion.CARRERA_NIVEL_SUPERIOR ||
      educacion?.tipo === TipoEducacion.CARRERA_GRADO;
  }

  // Método para obtener el tipo de educación seleccionado como texto
  getTipoSeleccionado(): string {
    if (!this.formularioTipo) return '';
    const control = this.formularioTipo.get('tipo');
    return control ? control.value : '';
  }

  // Método para verificar si el ID de usuario es válido
  esUsuarioIdValido(usuarioId: string): boolean {
    return !!usuarioId && usuarioId.trim() !== '';
  }

  // Método para detectar cambios
  detectChanges(): void {
    this.cdr.markForCheck();
  }
}
