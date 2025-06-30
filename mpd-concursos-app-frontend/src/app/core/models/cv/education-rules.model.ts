/**
 * Reglas de Negocio para Educación
 * 
 * @description Define las reglas específicas para cada tipo de educación
 * @author Augment Agent
 * @date 2025-06-29
 * @version 1.0.0
 */

import { EducationType, EducationStatus } from './cv.model';

/**
 * Configuración de campos requeridos por tipo y estado
 */
export interface EducationFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkbox' | 'chips';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  options?: { value: any; label: string }[];
}

/**
 * Configuración de validación de fechas
 */
export interface EducationDateValidation {
  requiresStartDate: boolean;
  requiresEndDate: boolean;
  requiresIssueDate: boolean;
  allowEndDateBeforeStart: boolean;
  customValidation?: (formValue: any) => { isValid: boolean; error?: string };
}

/**
 * Configuración de visualización en cards
 */
export interface EducationDisplayConfig {
  dateFormat: 'start-end' | 'issue-only' | 'start-ongoing' | 'custom';
  showDuration: boolean;
  showPromedio: boolean;
  additionalFields: string[];
  statusMapping: Record<EducationStatus, string>;
}

/**
 * Reglas completas para un tipo de educación
 */
export interface EducationTypeRules {
  type: EducationType;
  label: string;
  description: string;
  
  // Configuración por estado
  completedConfig: {
    fields: EducationFieldConfig[];
    dateValidation: EducationDateValidation;
    displayConfig: EducationDisplayConfig;
  };
  
  inProgressConfig: {
    fields: EducationFieldConfig[];
    dateValidation: EducationDateValidation;
    displayConfig: EducationDisplayConfig;
  };
}

/**
 * Mapeo de estados a español
 */
export const EDUCATION_STATUS_LABELS: Record<EducationStatus, string> = {
  [EducationStatus.COMPLETED]: 'FINALIZADO',
  [EducationStatus.IN_PROGRESS]: 'EN PROCESO'
};

/**
 * Mapeo de tipos a español
 */
export const EDUCATION_TYPE_LABELS: Record<EducationType, string> = {
  [EducationType.SECONDARY]: 'Educación Secundaria',
  [EducationType.HIGHER_EDUCATION_CAREER]: 'Carrera de Nivel Superior',
  [EducationType.UNDERGRADUATE_CAREER]: 'Carrera de grado',
  [EducationType.POSTGRADUATE_SPECIALIZATION]: 'Posgrado: especialización',
  [EducationType.POSTGRADUATE_MASTERS]: 'Posgrado: maestría',
  [EducationType.POSTGRADUATE_DOCTORATE]: 'Posgrado: doctorado',
  [EducationType.DIPLOMA]: 'Diplomatura',
  [EducationType.TRAINING_COURSE]: 'Curso de Capacitación',
  [EducationType.SCIENTIFIC_ACTIVITY]: 'Actividad Científica (investigación y/o difusión)'
};

/**
 * Campos base comunes a todos los tipos
 */
const BASE_FIELDS: EducationFieldConfig[] = [
  {
    name: 'title',
    label: 'Título/Nombre del estudio',
    type: 'text',
    required: true,
    placeholder: 'Ej: Licenciatura en Derecho'
  },
  {
    name: 'institution',
    label: 'Institución',
    type: 'text',
    required: true,
    placeholder: 'Ej: Universidad Nacional de Córdoba'
  }
];

/**
 * Configuración de campos específicos
 */
const FIELD_CONFIGS = {
  startDate: {
    name: 'startDate',
    label: 'Fecha de inicio',
    type: 'date' as const,
    required: true,
    helpText: 'Fecha en que comenzó el estudio'
  },
  
  endDate: {
    name: 'endDate',
    label: 'Fecha de finalización',
    type: 'date' as const,
    required: true,
    helpText: 'Fecha en que finalizó el estudio'
  },
  
  issueDate: {
    name: 'issueDate',
    label: 'Fecha de emisión del título',
    type: 'date' as const,
    required: true,
    helpText: 'Fecha en que se emitió el título o certificado'
  },
  
  durationYears: {
    name: 'durationYears',
    label: 'Duración (años)',
    type: 'number' as const,
    required: false,
    min: 0.5,
    max: 15,
    helpText: 'Duración total del programa de estudios'
  },
  
  average: {
    name: 'average',
    label: 'Promedio',
    type: 'number' as const,
    required: false,
    min: 1,
    max: 10,
    helpText: 'Promedio académico obtenido (1-10)'
  },
  
  thesisTopic: {
    name: 'thesisTopic',
    label: 'Tema de tesis',
    type: 'textarea' as const,
    required: false,
    placeholder: 'Describe brevemente el tema de tu tesis'
  },
  
  hourlyLoad: {
    name: 'hourlyLoad',
    label: 'Carga horaria',
    type: 'number' as const,
    required: false,
    min: 1,
    max: 2000,
    helpText: 'Cantidad total de horas del curso/diplomatura'
  },
  
  hadFinalEvaluation: {
    name: 'hadFinalEvaluation',
    label: 'Evaluación final',
    type: 'select' as const,
    required: false,
    options: [
      { value: true, label: 'Sí' },
      { value: false, label: 'No' }
    ],
    helpText: 'Indica si el curso tuvo evaluación final'
  },

  comments: {
    name: 'comments',
    label: 'Comentarios',
    type: 'textarea' as const,
    required: false,
    placeholder: 'Comentarios adicionales',
    helpText: 'Información adicional relevante'
  }
};

/**
 * Configuración base de visualización
 */
const BASE_DISPLAY_CONFIG: EducationDisplayConfig = {
  dateFormat: 'start-end',
  showDuration: true,
  showPromedio: false,
  additionalFields: [],
  statusMapping: EDUCATION_STATUS_LABELS
};

/**
 * REGLAS ESPECÍFICAS POR TIPO DE EDUCACIÓN
 */

/**
 * 1. CARRERA DE GRADO - Título universitario ya obtenido
 */
export const UNDERGRADUATE_CAREER_RULES: EducationTypeRules = {
  type: EducationType.UNDERGRADUATE_CAREER,
  label: 'Carrera de grado',
  description: 'Título universitario de grado (licenciatura, ingeniería, etc.)',

  completedConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: false }, // Agregado según reglas de negocio
      { ...FIELD_CONFIGS.issueDate, required: true },
      { ...FIELD_CONFIGS.durationYears, required: true }, // Cambiado a required según especificaciones
      { ...FIELD_CONFIGS.average, required: true } // Cambiado a required según especificaciones
    ],
    dateValidation: {
      requiresStartDate: false, // Opcional para completados
      requiresEndDate: false,
      requiresIssueDate: true,
      allowEndDateBeforeStart: false,
      customValidation: (formValue) => {
        // Si se proporciona startDate, issueDate debe ser posterior
        if (formValue.startDate && formValue.issueDate) {
          const startDate = new Date(formValue.startDate);
          const issueDate = new Date(formValue.issueDate);
          if (issueDate <= startDate) {
            return { isValid: false, error: 'La fecha de emisión debe ser posterior a la fecha de inicio' };
          }
        }
        return { isValid: true };
      }
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-end', // Cambiado para mostrar rango completo
      showPromedio: true,
      additionalFields: ['durationYears', 'average']
    }
  },

  inProgressConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.durationYears, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-ongoing',
      showPromedio: false,
      additionalFields: ['durationYears']
    }
  }
};

/**
 * 2. CARRERA DE NIVEL SUPERIOR
 */
export const HIGHER_EDUCATION_CAREER_RULES: EducationTypeRules = {
  type: EducationType.HIGHER_EDUCATION_CAREER,
  label: 'Carrera de Nivel Superior',
  description: 'Carrera terciaria o técnica superior',

  completedConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.issueDate, required: true },
      { ...FIELD_CONFIGS.durationYears, required: false },
      { ...FIELD_CONFIGS.average, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: true,
      allowEndDateBeforeStart: false,
      customValidation: (formValue) => {
        const startDate = new Date(formValue.startDate);
        const issueDate = new Date(formValue.issueDate);
        if (issueDate <= startDate) {
          return { isValid: false, error: 'La fecha de emisión debe ser posterior a la fecha de inicio' };
        }
        return { isValid: true };
      }
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-end',
      showPromedio: true,
      additionalFields: ['durationYears']
    }
  },

  inProgressConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.durationYears, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-ongoing',
      showPromedio: false,
      additionalFields: ['durationYears']
    }
  }
};

/**
 * 3. POSGRADOS (Especialización, Maestría, Doctorado)
 */
const createPostgraduateRules = (type: EducationType, label: string): EducationTypeRules => ({
  type,
  label,
  description: 'Estudios de posgrado universitario',

  completedConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.issueDate, required: true },
      { ...FIELD_CONFIGS.thesisTopic, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: true,
      allowEndDateBeforeStart: false,
      customValidation: (formValue) => {
        const startDate = new Date(formValue.startDate);
        const issueDate = new Date(formValue.issueDate);
        if (issueDate <= startDate) {
          return { isValid: false, error: 'La fecha de emisión debe ser posterior a la fecha de inicio' };
        }
        return { isValid: true };
      }
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-end',
      showPromedio: false,
      additionalFields: ['thesisTopic']
    }
  },

  inProgressConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.thesisTopic, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-ongoing',
      showPromedio: false,
      additionalFields: ['thesisTopic']
    }
  }
});

export const POSTGRADUATE_SPECIALIZATION_RULES = createPostgraduateRules(
  EducationType.POSTGRADUATE_SPECIALIZATION,
  'Posgrado: especialización'
);

export const POSTGRADUATE_MASTERS_RULES = createPostgraduateRules(
  EducationType.POSTGRADUATE_MASTERS,
  'Posgrado: maestría'
);

export const POSTGRADUATE_DOCTORATE_RULES = createPostgraduateRules(
  EducationType.POSTGRADUATE_DOCTORATE,
  'Posgrado: doctorado'
);

/**
 * 4. DIPLOMATURA Y CURSO DE CAPACITACIÓN
 */
const createDiplomaRules = (type: EducationType, label: string): EducationTypeRules => ({
  type,
  label,
  description: 'Curso de capacitación o diplomatura',

  completedConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.issueDate, required: true },
      { ...FIELD_CONFIGS.hourlyLoad, required: false },
      { ...FIELD_CONFIGS.hadFinalEvaluation, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: true,
      allowEndDateBeforeStart: false,
      customValidation: (formValue) => {
        const startDate = new Date(formValue.startDate);
        const issueDate = new Date(formValue.issueDate);
        if (issueDate <= startDate) {
          return { isValid: false, error: 'La fecha de emisión debe ser posterior a la fecha de inicio' };
        }
        return { isValid: true };
      }
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-end',
      showPromedio: false,
      additionalFields: ['hourlyLoad', 'hadFinalEvaluation']
    }
  },

  inProgressConfig: {
    fields: [
      ...BASE_FIELDS,
      { ...FIELD_CONFIGS.startDate, required: true },
      { ...FIELD_CONFIGS.hourlyLoad, required: false }
    ],
    dateValidation: {
      requiresStartDate: true,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'start-ongoing',
      showPromedio: false,
      additionalFields: ['hourlyLoad']
    }
  }
});

export const DIPLOMA_RULES = createDiplomaRules(EducationType.DIPLOMA, 'Diplomatura');
export const TRAINING_COURSE_RULES = createDiplomaRules(EducationType.TRAINING_COURSE, 'Curso de Capacitación');

/**
 * 5. ACTIVIDAD CIENTÍFICA
 */
export const SCIENTIFIC_ACTIVITY_RULES: EducationTypeRules = {
  type: EducationType.SCIENTIFIC_ACTIVITY,
  label: 'Actividad Científica (investigación y/o difusión)',
  description: 'Actividades de investigación, presentaciones o publicaciones científicas',

  completedConfig: {
    fields: [
      {
        name: 'activityType',
        label: 'Tipo de actividad',
        type: 'select',
        required: true,
        options: [
          { value: 'RESEARCH', label: 'Investigación' },
          { value: 'PRESENTATION', label: 'Presentación' },
          { value: 'PUBLICATION', label: 'Publicación' }
        ]
      },
      {
        name: 'topic',
        label: 'Tema',
        type: 'textarea',
        required: true,
        placeholder: 'Describe el tema de la actividad científica'
      },
      {
        name: 'role',
        label: 'Carácter',
        type: 'select',
        required: true,
        options: [
          { value: 'ASSISTANT_PARTICIPANT', label: 'Ayudante-participante' },
          { value: 'AUTHOR_SPEAKER_PANELIST_PRESENTER', label: 'Autor-disertante-panelista-exponente' }
        ],
        helpText: 'Selecciona tu rol en la actividad científica'
      },
      {
        name: 'expositionPlaceDate',
        label: 'Lugar y fecha de exposición o Publicación',
        type: 'text',
        required: true,
        placeholder: 'Ej: Universidad Nacional de Córdoba, Marzo 2024'
      },
      {
        name: 'comments',
        label: 'Comentarios',
        type: 'textarea',
        required: false,
        placeholder: 'Comentarios adicionales sobre la actividad científica',
        helpText: 'Información adicional relevante sobre la actividad'
      }
    ],
    dateValidation: {
      requiresStartDate: false,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'custom',
      showDuration: false,
      showPromedio: false,
      additionalFields: ['activityType', 'role', 'topic', 'comments']
    }
  },

  inProgressConfig: {
    fields: [
      {
        name: 'activityType',
        label: 'Tipo de actividad',
        type: 'select',
        required: true,
        options: [
          { value: 'RESEARCH', label: 'Investigación' },
          { value: 'PRESENTATION', label: 'Presentación' },
          { value: 'PUBLICATION', label: 'Publicación' }
        ]
      },
      {
        name: 'topic',
        label: 'Tema',
        type: 'textarea',
        required: true,
        placeholder: 'Describe el tema de la actividad científica'
      },
      {
        name: 'role',
        label: 'Carácter',
        type: 'select',
        required: true,
        options: [
          { value: 'ASSISTANT_PARTICIPANT', label: 'Ayudante-participante' },
          { value: 'AUTHOR_SPEAKER_PANELIST_PRESENTER', label: 'Autor-disertante-panelista-exponente' }
        ],
        helpText: 'Selecciona tu rol en la actividad científica'
      },
      {
        name: 'expositionPlaceDate',
        label: 'Lugar y fecha estimada',
        type: 'text',
        required: false,
        placeholder: 'Ej: Universidad Nacional de Córdoba, Marzo 2024'
      },
      {
        name: 'comments',
        label: 'Comentarios',
        type: 'textarea',
        required: false,
        placeholder: 'Comentarios adicionales sobre la actividad científica',
        helpText: 'Información adicional relevante sobre la actividad'
      }
    ],
    dateValidation: {
      requiresStartDate: false,
      requiresEndDate: false,
      requiresIssueDate: false,
      allowEndDateBeforeStart: false
    },
    displayConfig: {
      ...BASE_DISPLAY_CONFIG,
      dateFormat: 'custom',
      showDuration: false,
      showPromedio: false,
      additionalFields: ['activityType', 'role', 'topic', 'comments']
    }
  }
};

/**
 * REGISTRO PRINCIPAL DE TODAS LAS REGLAS
 */
export const EDUCATION_RULES_REGISTRY: Record<EducationType, EducationTypeRules> = {
  [EducationType.SECONDARY]: HIGHER_EDUCATION_CAREER_RULES, // Placeholder - no se usa actualmente
  [EducationType.HIGHER_EDUCATION_CAREER]: HIGHER_EDUCATION_CAREER_RULES,
  [EducationType.UNDERGRADUATE_CAREER]: UNDERGRADUATE_CAREER_RULES,
  [EducationType.POSTGRADUATE_SPECIALIZATION]: POSTGRADUATE_SPECIALIZATION_RULES,
  [EducationType.POSTGRADUATE_MASTERS]: POSTGRADUATE_MASTERS_RULES,
  [EducationType.POSTGRADUATE_DOCTORATE]: POSTGRADUATE_DOCTORATE_RULES,
  [EducationType.DIPLOMA]: DIPLOMA_RULES,
  [EducationType.TRAINING_COURSE]: TRAINING_COURSE_RULES,
  [EducationType.SCIENTIFIC_ACTIVITY]: SCIENTIFIC_ACTIVITY_RULES
};

/**
 * Función helper para obtener las reglas de un tipo específico
 */
export function getEducationRules(type: EducationType): EducationTypeRules {
  return EDUCATION_RULES_REGISTRY[type];
}

/**
 * Función helper para obtener la configuración según tipo y estado
 */
export function getEducationConfig(type: EducationType, status: EducationStatus) {
  const rules = getEducationRules(type);
  return status === EducationStatus.COMPLETED ? rules.completedConfig : rules.inProgressConfig;
}
