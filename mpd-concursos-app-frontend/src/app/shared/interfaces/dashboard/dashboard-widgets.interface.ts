/**
 * Interfaces para los widgets del dashboard principal
 * Diseñadas para profesionales del derecho
 */

export interface EstadoPerfil {
  completitud: number; // Porcentaje 0-100
  seccionesPendientes: SeccionPendiente[];
  documentosVencidos: number;
  ultimaActualizacion: Date;
  puntajeCompletitud: number; // Para gamificación
}

export interface SeccionPendiente {
  nombre: string;
  descripcion: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  ruta: string;
  icono: string;
  completada: boolean;
}

export interface ProximoVencimiento {
  id: string;
  tipo: 'INSCRIPCION' | 'DOCUMENTOS' | 'EXAMEN' | 'RESULTADO';
  titulo: string;
  descripcion: string;
  fechaLimite: Date;
  diasRestantes: number;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  concursoId?: string;
  accionRequerida?: string;
  ruta?: string;
}

export interface AccionRapida {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  badge?: number;
  urgente: boolean;
  tipo: 'INSCRIPCION' | 'DOCUMENTO' | 'PERFIL' | 'RESULTADO' | 'NOTIFICACION';
  visible: boolean;
}

export interface NotificacionDashboard {
  id: string;
  tipo: 'LEGAL' | 'ADMINISTRATIVA' | 'TECNICA' | 'INFORMATIVA';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  titulo: string;
  mensaje: string;
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  leida: boolean;
  accionRequerida?: string;
  ruta?: string;
  icono: string;
}

export interface MetricasDashboard {
  inscripcionesTotales: number;
  inscripcionesActivas: number;
  inscripcionesAprobadas: number;
  documentosSubidos: number;
  concursosDisponibles: number;
  proximosVencimientos: number;
  notificacionesPendientes: number;
}

export interface ConfiguracionWidget {
  id: string;
  nombre: string;
  visible: boolean;
  orden: number;
  configuracion: Record<string, unknown>;
}

export interface DashboardData {
  estadoPerfil: EstadoPerfil;
  proximosVencimientos: ProximoVencimiento[];
  accionesRapidas: AccionRapida[];
  notificaciones: NotificacionDashboard[];
  metricas: MetricasDashboard;
  configuracionWidgets: ConfiguracionWidget[];
}

// Interfaz simplificada para compatibilidad con widgets
export interface SimpleDashboardData {
  profileCompletion: number;
  activeApplications: number;
  pendingDocuments: number;
  availableExams: number;
  upcomingDeadlines: SimpleDeadline[];
  // ✅ MEJORA: Datos detallados para widget expandible
  profileDetails?: ProfileCompletionDetails;
}

// ✅ MEJORA: Interfaz para detalles de completitud del perfil
export interface ProfileCompletionDetails {
  personalDataPercentage: number;
  requiredDocumentsPercentage: number;
  optionalDocumentsPercentage: number;
  globalPercentage: number;
  requiredDocuments: DocumentStatus[];
  optionalDocuments: DocumentStatus[];
  upcomingExpirations: DocumentExpiration[];
}

export interface DocumentStatus {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'rejected' | 'missing';
  required: boolean;
  expirationDate?: string;
  // ✅ NOTA: daysUntilExpiration solo se usa para plazos de inscripción específicos,
  // no para vencimiento inherente de documentos
  daysUntilExpiration?: number;
}

export interface DocumentExpiration {
  documentName: string;
  expirationDate: string;
  daysUntilExpiration: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SimpleDeadline {
  title: string;
  date: string;
  daysRemaining: number;
}

// Enums para mejor tipado
export enum TipoVencimiento {
  INSCRIPCION = 'INSCRIPCION',
  DOCUMENTOS = 'DOCUMENTOS',
  EXAMEN = 'EXAMEN',
  RESULTADO = 'RESULTADO'
}

export enum PrioridadVencimiento {
  ALTA = 'ALTA',    // ≤ 1 día (alineado con backend)
  MEDIA = 'MEDIA',  // 2-7 días (alineado con backend)
  BAJA = 'BAJA'     // > 7 días
}

export enum TipoAccion {
  INSCRIPCION = 'INSCRIPCION',
  DOCUMENTO = 'DOCUMENTO',
  PERFIL = 'PERFIL',
  RESULTADO = 'RESULTADO',
  NOTIFICACION = 'NOTIFICACION'
}

export enum TipoNotificacion {
  LEGAL = 'LEGAL',
  ADMINISTRATIVA = 'ADMINISTRATIVA',
  TECNICA = 'TECNICA',
  INFORMATIVA = 'INFORMATIVA'
}

// Utilidades para cálculos
export class DashboardUtils {
  /**
   * ✅ CORREGIDO: Alineado con lógica del backend (UserDeadline.calculatePriority)
   * Backend: ≤1 día = HIGH, 2-7 días = MEDIUM, >7 días = LOW
   */
  static calcularPrioridadVencimiento(diasRestantes: number): PrioridadVencimiento {
    if (diasRestantes <= 1) return PrioridadVencimiento.ALTA;
    if (diasRestantes <= 7) return PrioridadVencimiento.MEDIA;
    return PrioridadVencimiento.BAJA;
  }

  static calcularCompletitudPerfil(secciones: SeccionPendiente[]): number {
    if (secciones.length === 0) return 100;
    const completadas = secciones.filter(s => s.completada).length;
    return Math.round((completadas / secciones.length) * 100);
  }

  static obtenerColorPrioridad(prioridad: PrioridadVencimiento): string {
    switch (prioridad) {
      case PrioridadVencimiento.ALTA: return '#ef4444';
      case PrioridadVencimiento.MEDIA: return '#f59e0b';
      case PrioridadVencimiento.BAJA: return '#10b981';
      default: return '#6b7280';
    }
  }

  static formatearDiasRestantes(dias: number): string {
    if (dias < 0) return 'Vencido';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  }
}
