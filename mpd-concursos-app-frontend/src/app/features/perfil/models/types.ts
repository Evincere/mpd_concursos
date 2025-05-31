export type TabKey = 'info' | 'cv' | 'docs' | 'linkedin';

export interface ProfileTab {
  key: TabKey;
  label: string;
  icon: string;
}

export const TAB_KEYS = {
  INFO: 'info' as TabKey,
  CV: 'cv' as TabKey,
  DOCS: 'docs' as TabKey,
  LINKEDIN: 'linkedin' as TabKey
} as const;

export interface PerfilState {
  isEditing: boolean;
  isLoading: boolean;
  mostrarModalEducacion: boolean;
  mostrarModalExperiencia: boolean;
  linkedInConectado: boolean;
  linkedInTab: boolean;
  selectedTab: TabKey;
  error?: string | null;
}

export interface IEducacion {
  id?: string;
  tipo: string;
  titulo: string;
  institucion: string;
  estado?: string;
  fechaEmision?: Date | string;
  documentoPdf?: string | { id: string };
  datos?: Record<string, unknown>;
  propiedadesEspecificas?: Record<string, unknown>;
  detalle?: Record<string, unknown>;
}

export interface IExperiencia {
  id?: string;
  empresa: string;
  cargo: string;
  puesto: string;
  descripcion: string;
  fechaInicio: string | Date;
  fechaFin?: string | Date;
  actual: boolean;
  ubicacion?: string;
  documentoId?: string;
  certificadoId?: string;
  comentario?: string;
  documentUrl?: string;
}

export interface ExperienciaFormData {
  id: string | null;
  cargo: string;
  empresa: string;
  fechaInicio: Date | null;
  fechaFin?: Date | null;
  descripcion: string;
  comentario?: string;
  certificadoId?: string;
  documentUrl?: string;
  actual?: boolean;
}

export interface HabilidadFormData {
  nombre: string;
  nivel: string;
}
