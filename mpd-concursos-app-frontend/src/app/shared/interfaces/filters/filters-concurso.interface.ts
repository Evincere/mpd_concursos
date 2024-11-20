export interface FiltersConcurso {
  estado: 'todos' | 'activo' | 'proximo' | 'finalizado';
  periodo: 'todos' | 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio';
  dependencia: string;
  cargo: string;
} 