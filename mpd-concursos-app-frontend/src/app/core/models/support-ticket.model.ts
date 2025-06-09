/**
 * Modelos para el sistema de tickets de soporte
 */

/**
 * Estados posibles de un ticket
 */
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_USER = 'PENDING_USER',
  PENDING_INTERNAL = 'PENDING_INTERNAL',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

/**
 * Prioridades de tickets
 */
export enum TicketPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

/**
 * Categorías de tickets
 */
export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  ACCOUNT = 'ACCOUNT',
  INSCRIPTION = 'INSCRIPTION',
  DOCUMENTS = 'DOCUMENTS',
  PAYMENT = 'PAYMENT',
  GENERAL = 'GENERAL',
  BUG_REPORT = 'BUG_REPORT',
  FEATURE_REQUEST = 'FEATURE_REQUEST'
}

/**
 * Tipos de comentarios
 */
export enum CommentType {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  SYSTEM = 'SYSTEM'
}

/**
 * Interfaz para comentarios de tickets
 */
export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  type: CommentType;
  attachments?: TicketAttachment[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

/**
 * Interfaz para archivos adjuntos
 */
export interface TicketAttachment {
  id: string;
  ticketId: string;
  commentId?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloadUrl: string;
}

/**
 * Interfaz para historial de cambios
 */
export interface TicketHistory {
  id: string;
  ticketId: string;
  changedBy: string;
  changedByName: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: Date;
  description: string;
}

/**
 * Interfaz para métricas SLA
 */
export interface TicketSLA {
  responseTime: number; // en minutos
  resolutionTime: number; // en minutos
  escalationTime: number; // en minutos
  isResponseOverdue: boolean;
  isResolutionOverdue: boolean;
  responseDeadline: Date;
  resolutionDeadline: Date;
}

/**
 * Interfaz principal para tickets
 */
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  
  // Usuario que reporta
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  
  // Agente asignado
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: Date;
  
  // Fechas importantes
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Métricas y SLA
  sla: TicketSLA;
  
  // Relaciones
  comments: TicketComment[];
  attachments: TicketAttachment[];
  history: TicketHistory[];
  
  // Metadatos
  tags: string[];
  customFields: Record<string, any>;
  
  // Satisfacción del usuario
  satisfactionRating?: number;
  satisfactionComment?: string;
  satisfactionDate?: Date;
}

/**
 * DTO para crear un nuevo ticket
 */
export interface CreateTicketDTO {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  tags?: string[];
  attachments?: File[];
  customFields?: Record<string, any>;
}

/**
 * DTO para actualizar un ticket
 */
export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Filtros para búsqueda de tickets
 */
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToId?: string;
  reporterId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  tags?: string[];
  searchText?: string;
}

/**
 * Configuración de SLA por categoría y prioridad
 */
export interface SLAConfiguration {
  category: TicketCategory;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationTimeMinutes: number;
}

/**
 * Estadísticas de tickets
 */
export interface TicketStatistics {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  byCategory: Record<TicketCategory, number>;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionAverage: number;
  overdueTickets: number;
}

/**
 * Configuración de escalamiento automático
 */
export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: {
    priority?: TicketPriority[];
    category?: TicketCategory[];
    timeThresholdMinutes: number;
    noResponseTime?: number;
  };
  actions: {
    changePriority?: TicketPriority;
    assignToUserId?: string;
    addTags?: string[];
    sendNotification: boolean;
    notificationTemplate?: string;
  };
}

/**
 * Plantilla de respuesta rápida
 */
export interface QuickResponseTemplate {
  id: string;
  name: string;
  category: TicketCategory;
  subject: string;
  content: string;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
