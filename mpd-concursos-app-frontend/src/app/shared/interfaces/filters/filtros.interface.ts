export interface FiltrosConcurso {
  estado: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  dependencia: string;
  cargo: string;
  periodo?: string;
}

export interface BusquedaConcurso {
  termino: string;
}
