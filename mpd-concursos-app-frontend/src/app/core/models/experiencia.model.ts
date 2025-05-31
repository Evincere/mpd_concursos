export interface Experiencia {
  id?: string;
  puesto: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  actual: boolean;
  ubicacion?: string;
}

export type ExperienciaFormData = Omit<Experiencia, 'id'>;

export interface ExperienciaState {
  isEditing: boolean;
  experiencia: Experiencia | null;
  experiencias: Experiencia[];
  loading: boolean;
  error: string | null;
}
