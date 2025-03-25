export enum TipoEducacion {
  CARRERA_NIVEL_SUPERIOR = 'Carrera de Nivel Superior',
  CARRERA_GRADO = 'Carrera de grado',
  POSGRADO_ESPECIALIZACION = 'Posgrado: especialización',
  POSGRADO_MAESTRIA = 'Posgrado: maestría',
  POSGRADO_DOCTORADO = 'Posgrado: doctorado',
  CURSO_CAPACITACION = 'Curso de Capacitación',
  DIPLOMATURA = 'Diplomatura',
  ACTIVIDAD_CIENTIFICA = 'Actividad Científica (investigación y/o difusión)'
}

export enum EstadoEducacion {
  FINALIZADO = 'finalizado',
  EN_PROCESO = 'en proceso'
}

export enum TipoActividadCientifica {
  INVESTIGACION = 'investigación',
  PONENCIA = 'ponencia',
  PUBLICACION = 'publicación'
}

export enum CaracterActividadCientifica {
  AYUDANTE_PARTICIPANTE = 'ayudante-participante',
  AUTOR_DISERTANTE = 'autor-disertante-panelista-exponente'
}

// Interfaz base para todos los tipos de educación
export interface EducacionBase {
  id?: string;  // UUID como identificador único
  tipo: TipoEducacion;
  estado: EstadoEducacion;
  titulo: string;
  institucion: string;
  fechaEmision?: Date;
  documentoPdf?: any; // Para manejar el archivo subido

  // Propiedades opcionales que pueden venir del backend en inglés
  [key: string]: any; // Permite cualquier propiedad adicional
}

// Interfaces específicas para cada tipo
export interface CarreraNivelSuperior extends EducacionBase {
  duracionAnios: number;
  promedio: number;
}

export interface CarreraGrado extends EducacionBase {
  duracionAnios: number;
  promedio: number;
}

export interface Posgrado extends EducacionBase {
  temaTesis: string;
}

export interface Diplomatura extends EducacionBase {
  cargaHoraria: number;
  tuvoEvaluacionFinal: boolean;
}

export interface CursoCapacitacion extends EducacionBase {
  cargaHoraria: number;
  tuvoEvaluacionFinal: boolean;
}

export interface ActividadCientifica extends EducacionBase {
  tipoActividad: TipoActividadCientifica;
  tema: string;
  caracter: CaracterActividadCientifica;
  lugarFechaExposicion: string;
  comentarios?: string;
}

// Tipo unión para manejar cualquier tipo de educación
export type Educacion = CarreraNivelSuperior | CarreraGrado | Posgrado |
  Diplomatura | CursoCapacitacion | ActividadCientifica;

// Clase Builder para construir objetos de educación de forma progresiva
export class EducacionBuilder {
  // Inicializar todas las propiedades para evitar el error "no initializer"
  private _tipo: TipoEducacion = TipoEducacion.CARRERA_GRADO;
  private _estado: EstadoEducacion = EstadoEducacion.EN_PROCESO;
  private _titulo: string = '';
  private _institucion: string = '';
  private _fechaEmision?: Date;
  private _documentoPdf?: any;

  // Campos específicos
  private _duracionAnios?: number;
  private _promedio?: number;
  private _temaTesis?: string;
  private _cargaHoraria?: number;
  private _tuvoEvaluacionFinal?: boolean;
  private _tipoActividad?: TipoActividadCientifica;
  private _tema?: string;
  private _caracter?: CaracterActividadCientifica;
  private _lugarFechaExposicion?: string;
  private _comentarios?: string;

  constructor() {
    this.reset();
  }

  reset(): EducacionBuilder {
    // Usar valores por defecto en lugar de null
    this._tipo = TipoEducacion.CARRERA_GRADO;
    this._estado = EstadoEducacion.EN_PROCESO;
    this._titulo = '';
    this._institucion = '';
    this._fechaEmision = undefined;
    this._documentoPdf = undefined;

    // Propiedades específicas con undefined en lugar de null
    this._duracionAnios = undefined;
    this._promedio = undefined;
    this._temaTesis = undefined;
    this._cargaHoraria = undefined;
    this._tuvoEvaluacionFinal = undefined;
    this._tipoActividad = undefined;
    this._tema = undefined;
    this._caracter = undefined;
    this._lugarFechaExposicion = undefined;
    this._comentarios = undefined;

    return this;
  }

  setTipo(tipo: TipoEducacion): EducacionBuilder {
    this._tipo = tipo;
    return this;
  }

  setEstado(estado: EstadoEducacion): EducacionBuilder {
    this._estado = estado;
    return this;
  }

  setTitulo(titulo: string): EducacionBuilder {
    this._titulo = titulo;
    return this;
  }

  setInstitucion(institucion: string): EducacionBuilder {
    this._institucion = institucion;
    return this;
  }

  setFechaEmision(fecha: Date): EducacionBuilder {
    this._fechaEmision = fecha;
    return this;
  }

  setDocumentoPdf(documento: any): EducacionBuilder {
    this._documentoPdf = documento;
    return this;
  }

  setDuracionAnios(duracion: number): EducacionBuilder {
    this._duracionAnios = duracion;
    return this;
  }

  setPromedio(promedio: number): EducacionBuilder {
    this._promedio = promedio;
    return this;
  }

  setTemaTesis(tema: string): EducacionBuilder {
    this._temaTesis = tema;
    return this;
  }

  setCargaHoraria(cargaHoraria: number): EducacionBuilder {
    this._cargaHoraria = cargaHoraria;
    return this;
  }

  setTuvoEvaluacionFinal(tuvo: boolean): EducacionBuilder {
    this._tuvoEvaluacionFinal = tuvo;
    return this;
  }

  setTipoActividad(tipo: TipoActividadCientifica): EducacionBuilder {
    this._tipoActividad = tipo;
    return this;
  }

  setTema(tema: string): EducacionBuilder {
    this._tema = tema;
    return this;
  }

  setCaracter(caracter: CaracterActividadCientifica): EducacionBuilder {
    this._caracter = caracter;
    return this;
  }

  setLugarFechaExposicion(lugar: string): EducacionBuilder {
    this._lugarFechaExposicion = lugar;
    return this;
  }

  setComentarios(comentarios: string): EducacionBuilder {
    this._comentarios = comentarios;
    return this;
  }

  build(): Educacion {
    // Validar que los campos base estén completos
    if (!this._tipo || !this._estado || !this._titulo || !this._institucion) {
      throw new Error('Campos obligatorios incompletos');
    }

    const base: EducacionBase = {
      tipo: this._tipo,
      estado: this._estado,
      titulo: this._titulo,
      institucion: this._institucion,
      fechaEmision: this._fechaEmision,
      documentoPdf: this._documentoPdf
    };

    // Construir el objeto específico según el tipo
    switch (this._tipo) {
      case TipoEducacion.CARRERA_NIVEL_SUPERIOR:
        return {
          ...base,
          duracionAnios: this._duracionAnios ?? 0,
          promedio: this._promedio ?? 0
        } as CarreraNivelSuperior;

      case TipoEducacion.CARRERA_GRADO:
        return {
          ...base,
          duracionAnios: this._duracionAnios ?? 0,
          promedio: this._promedio ?? 0
        } as CarreraGrado;

      case TipoEducacion.POSGRADO_ESPECIALIZACION:
      case TipoEducacion.POSGRADO_MAESTRIA:
      case TipoEducacion.POSGRADO_DOCTORADO:
        return {
          ...base,
          temaTesis: this._temaTesis ?? ''
        } as Posgrado;

      case TipoEducacion.DIPLOMATURA:
        return {
          ...base,
          cargaHoraria: this._cargaHoraria ?? 0,
          tuvoEvaluacionFinal: this._tuvoEvaluacionFinal ?? false
        } as Diplomatura;

      case TipoEducacion.CURSO_CAPACITACION:
        return {
          ...base,
          cargaHoraria: this._cargaHoraria ?? 0,
          tuvoEvaluacionFinal: this._tuvoEvaluacionFinal ?? false
        } as CursoCapacitacion;

      case TipoEducacion.ACTIVIDAD_CIENTIFICA:
        if (!this._tipoActividad || !this._tema || !this._caracter || !this._lugarFechaExposicion) {
          throw new Error('Faltan campos obligatorios para actividad científica');
        }
        return {
          ...base,
          tipoActividad: this._tipoActividad,
          tema: this._tema,
          caracter: this._caracter,
          lugarFechaExposicion: this._lugarFechaExposicion,
          comentarios: this._comentarios
        } as ActividadCientifica;

      default:
        throw new Error('Tipo de educación no válido');
    }
  }
}
