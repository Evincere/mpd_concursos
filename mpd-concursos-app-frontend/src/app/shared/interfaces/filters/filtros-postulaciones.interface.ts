export interface FiltrosPostulacion {
  estado: string | null;
  periodo: string | null;
  dependencia: string | null;
  cargo: string | null;
  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
}

export interface BusquedaPostulacion {
  termino: string;
}
