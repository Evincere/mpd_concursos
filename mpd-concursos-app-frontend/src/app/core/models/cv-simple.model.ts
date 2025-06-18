/**
 * Modelos simples para CV - Reimplementación desde cero
 */

// ===== EXPERIENCIA LABORAL =====

export interface ExperienceSimple {
  id?: string;
  usuarioId: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  comments?: string;
}

export interface ExperienceRequest {
  company: string;
  position: string;
  startDate: string; // ISO string para API
  endDate?: string;
  description?: string;
  comments?: string;
}

export interface ExperienceResponse {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  comments?: string;
  documentUrl?: string;
}

// ===== EDUCACIÓN =====

export interface EducationSimple {
  id?: string;
  usuarioId: string;
  title: string;
  institution: string;
  type: string;
  issueDate?: Date;
  status: string;
  comments?: string;
}

export interface EducationRequest {
  title: string;
  institution: string;
  type: string;
  issueDate?: string;
  status: string;
  comments?: string;
}

export interface EducationResponse {
  id: string;
  title: string;
  institution: string;
  type: string;
  issueDate?: string;
  status: string;
  comments?: string;
  documentUrl?: string;
}

// ===== CONSTANTES PARA EDUCACIÓN =====

export const EDUCATION_TYPES = [
  { value: 'Título Universitario', label: 'Título Universitario' },
  { value: 'Título Terciario', label: 'Título Terciario' },
  { value: 'Especialización', label: 'Especialización' },
  { value: 'Maestría', label: 'Maestría' },
  { value: 'Doctorado', label: 'Doctorado' },
  { value: 'Diplomatura', label: 'Diplomatura' },
  { value: 'Curso de Capacitación', label: 'Curso de Capacitación' },
  { value: 'Actividad Científica', label: 'Actividad Científica' }
];

export const EDUCATION_STATUSES = [
  { value: 'En Curso', label: 'En Curso' },
  { value: 'Completado', label: 'Completado' },
  { value: 'Abandonado', label: 'Abandonado' }
];

// ===== RESPUESTAS DE API =====

export interface ApiResponse<T> {
  exito: boolean;
  data?: T;
  mensaje?: string;
  error?: string;
}

// ===== ESTADO DE CARGA =====

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastLoaded?: Date;
}
