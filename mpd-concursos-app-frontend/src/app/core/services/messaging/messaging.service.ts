import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, catchError, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Tipos de mensaje
 */
export type MessageType = 'text' | 'system' | 'notification' | 'document' | 'template';

/**
 * Estados de mensaje
 */
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Prioridades de mensaje
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Modelo de mensaje
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  type: MessageType;
  priority: MessagePriority;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  isSystemMessage: boolean;
  parentMessageId?: string;
  templateId?: string;
}

/**
 * Adjunto de mensaje
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Metadatos de mensaje
 */
export interface MessageMetadata {
  inscriptionId?: string;
  contestId?: string;
  documentId?: string;
  actionRequired?: boolean;
  expiresAt?: Date;
  tags?: string[];
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

/**
 * Conversación
 */
export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  subject: string;
  lastMessage?: Message;
  unreadCount: number;
  status: 'active' | 'archived' | 'closed';
  priority: MessagePriority;
  tags: string[];
  metadata?: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Participante de conversación
 */
export interface ConversationParticipant {
  userId: string;
  userName: string;
  userRole: string;
  joinedAt: Date;
  lastReadAt?: Date;
  isActive: boolean;
}

/**
 * Metadatos de conversación
 */
export interface ConversationMetadata {
  inscriptionId?: string;
  contestId?: string;
  category: string;
  subcategory?: string;
  relatedTicketId?: string;
}

/**
 * Filtros de mensajes
 */
export interface MessageFilters {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  type?: MessageType;
  priority?: MessagePriority;
  status?: MessageStatus;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  isUnread?: boolean;
  search?: string;
}

/**
 * Configuración de mensajería
 */
export interface MessagingConfig {
  enableRealTimeUpdates: boolean;
  pollInterval: number; // ms
  maxMessageLength: number;
  maxAttachmentSize: number; // bytes
  allowedAttachmentTypes: string[];
  enableReadReceipts: boolean;
  enableTypingIndicators: boolean;
  autoMarkAsRead: boolean;
  notificationSound: boolean;
}

/**
 * Estadísticas de mensajería
 */
export interface MessagingStats {
  totalMessages: number;
  unreadMessages: number;
  activeConversations: number;
  messagesByType: Record<MessageType, number>;
  messagesByPriority: Record<MessagePriority, number>;
  averageResponseTime: number; // minutes
  lastActivity: Date | null;
}

/**
 * Servicio de mensajería
 */
@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  private readonly apiUrl = `${environment.apiUrl}/messaging`;

  // Estados reactivos
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private configSubject = new BehaviorSubject<MessagingConfig>({
    enableRealTimeUpdates: true,
    pollInterval: 5000,
    maxMessageLength: 5000,
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    allowedAttachmentTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    enableReadReceipts: true,
    enableTypingIndicators: true,
    autoMarkAsRead: true,
    notificationSound: true
  });

  // Observables públicos
  public conversations$ = this.conversationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  // Control de polling
  private pollingSubscription?: any;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.initializeMessaging();
  }

  /**
   * Inicializa el servicio de mensajería
   */
  private initializeMessaging(): void {
    this.loadConversations();
    this.startRealTimeUpdates();
  }

  /**
   * Obtiene todas las conversaciones del usuario
   */
  public getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      map(conversations => conversations.map(this.mapConversation)),
      catchError(this.handleError<Conversation[]>('getConversations', []))
    );
  }

  /**
   * Obtiene una conversación específica
   */
  public getConversation(conversationId: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      map(this.mapConversation),
      catchError(this.handleError<Conversation>('getConversation'))
    );
  }

  /**
   * Obtiene mensajes de una conversación
   */
  public getMessages(conversationId: string, page = 0, size = 50): Observable<Message[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params }).pipe(
      map(messages => messages.map(this.mapMessage)),
      catchError(this.handleError<Message[]>('getMessages', []))
    );
  }

  /**
   * Envía un nuevo mensaje
   */
  public sendMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, message).pipe(
      map(this.mapMessage),
      catchError(this.handleError<Message>('sendMessage'))
    );
  }

  /**
   * Crea una nueva conversación
   */
  public createConversation(conversation: Partial<Conversation>): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, conversation).pipe(
      map(this.mapConversation),
      catchError(this.handleError<Conversation>('createConversation'))
    );
  }

  /**
   * Marca un mensaje como leído
   */
  public markAsRead(messageId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/messages/${messageId}/read`, {}).pipe(
      catchError(this.handleError<void>('markAsRead'))
    );
  }

  /**
   * Marca toda una conversación como leída
   */
  public markConversationAsRead(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/conversations/${conversationId}/read`, {}).pipe(
      catchError(this.handleError<void>('markConversationAsRead'))
    );
  }

  /**
   * Busca mensajes
   */
  public searchMessages(filters: MessageFilters): Observable<Message[]> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<Message[]>(`${this.apiUrl}/messages/search`, { params }).pipe(
      map(messages => messages.map(this.mapMessage)),
      catchError(this.handleError<Message[]>('searchMessages', []))
    );
  }

  /**
   * Sube un archivo adjunto
   */
  public uploadAttachment(file: File): Observable<MessageAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<MessageAttachment>(`${this.apiUrl}/attachments`, formData).pipe(
      catchError(this.handleError<MessageAttachment>('uploadAttachment'))
    );
  }

  /**
   * Obtiene estadísticas de mensajería
   */
  public getMessagingStats(): Observable<MessagingStats> {
    return this.http.get<MessagingStats>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError<MessagingStats>('getMessagingStats'))
    );
  }

  /**
   * Archiva una conversación
   */
  public archiveConversation(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/conversations/${conversationId}/archive`, {}).pipe(
      catchError(this.handleError<void>('archiveConversation'))
    );
  }

  /**
   * Cierra una conversación
   */
  public closeConversation(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/conversations/${conversationId}/close`, {}).pipe(
      catchError(this.handleError<void>('closeConversation'))
    );
  }

  /**
   * Inicia actualizaciones en tiempo real
   */
  private startRealTimeUpdates(): void {
    const config = this.configSubject.value;
    
    if (config.enableRealTimeUpdates) {
      this.pollingSubscription = interval(config.pollInterval).pipe(
        switchMap(() => this.getConversations())
      ).subscribe(conversations => {
        this.conversationsSubject.next(conversations);
        this.updateUnreadCount(conversations);
      });
    }
  }

  /**
   * Detiene actualizaciones en tiempo real
   */
  public stopRealTimeUpdates(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Carga conversaciones iniciales
   */
  private loadConversations(): void {
    this.getConversations().subscribe(conversations => {
      this.conversationsSubject.next(conversations);
      this.updateUnreadCount(conversations);
    });
  }

  /**
   * Actualiza el contador de mensajes no leídos
   */
  private updateUnreadCount(conversations: Conversation[]): void {
    const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(config: Partial<MessagingConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);

    // Reiniciar polling si cambió el intervalo
    if (config.pollInterval || config.enableRealTimeUpdates !== undefined) {
      this.stopRealTimeUpdates();
      this.startRealTimeUpdates();
    }
  }

  /**
   * Mapea conversación desde API
   */
  private mapConversation = (conv: any): Conversation => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
    participants: conv.participants?.map((p: any) => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
      lastReadAt: p.lastReadAt ? new Date(p.lastReadAt) : undefined
    })) || [],
    lastMessage: conv.lastMessage ? this.mapMessage(conv.lastMessage) : undefined
  });

  /**
   * Mapea mensaje desde API
   */
  private mapMessage = (msg: any): Message => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
    updatedAt: new Date(msg.updatedAt),
    readAt: msg.readAt ? new Date(msg.readAt) : undefined,
    metadata: {
      ...msg.metadata,
      expiresAt: msg.metadata?.expiresAt ? new Date(msg.metadata.expiresAt) : undefined
    }
  });

  /**
   * Maneja errores de HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return new Observable(observer => {
        if (result !== undefined) {
          observer.next(result as T);
        }
        observer.complete();
      });
    };
  }

  /**
   * Destructor del servicio
   */
  public destroy(): void {
    this.stopRealTimeUpdates();
  }
}
