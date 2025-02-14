export interface FiltersConcurso {
  estado: 'todos' | 'ACTIVE' | 'PENDING' | 'CLOSED' | 'FINISHED';
  periodo: 'todos' | 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio';
  dependencia: string;
  cargo: string;
}
