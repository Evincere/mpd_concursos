export interface Concurso {
    id: number;
    titulo: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    estado: 'ABIERTO' | 'CERRADO' | 'EN_PROCESO';
    requisitos: string[];
    area: string;
    cargo: string;
  }