import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

import { Conversation, Message } from './messaging.service';

/**
 * Filtros de historial
 */
export interface HistoryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  participants?: string[];
  status?: 'active' | 'archived' | 'closed' | 'all';
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'all';
  hasUnread?: boolean;
  messageType?: 'text' | 'system' | 'notification' | 'document' | 'all';
  category?: string;
  search?: string;
  tags?: string[];
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  field: 'lastActivity' | 'created' | 'messageCount' | 'participants';
  direction: 'asc' | 'desc';
}

/**
 * Estadísticas del historial
 */
export interface HistoryStats {
  totalConversations: number;
  activeConversations: number;
  archivedConversations: number;
  closedConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  averageResponseTime: number; // en minutos
  mostActiveParticipants: ParticipantStats[];
  conversationsByCategory: CategoryStats[];
  activityByDate: ActivityStats[];
}

/**
 * Estadísticas de participante
 */
export interface ParticipantStats {
  userId: string;
  userName: string;
  userRole: string;
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  lastActivity: Date;
}

/**
 * Estadísticas por categoría
 */
export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  averageMessages: number;
  averageResponseTime: number;
}

/**
 * Estadísticas de actividad
 */
export interface ActivityStats {
  date: Date;
  conversationsCreated: number;
  messagesExchanged: number;
  averageResponseTime: number;
}

/**
 * Conversación con estadísticas extendidas
 */
export interface ConversationWithStats extends Conversation {
  messageCount: number;
  averageResponseTime: number;
  firstMessageDate: Date;
  lastActivityDate: Date;
  participantStats: ParticipantStats[];
  messagesByType: Record<string, number>;
  messagesByPriority: Record<string, number>;
}

/**
 * Resultado de búsqueda en historial
 */
export interface HistorySearchResult {
  conversations: ConversationWithStats[];
  messages: Message[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}

/**
 * Configuración de exportación
 */
export interface ExportConfig {
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  includeMessages: boolean;
  includeAttachments: boolean;
  includeMetadata: boolean;
  dateRange?: { from: Date; to: Date };
  conversations?: string[];
  anonymize?: boolean;
}

/**
 * Servicio de historial de conversaciones
 */
@Injectable({
  providedIn: 'root'
})
export class ConversationHistoryService {

  private readonly apiUrl = `${environment.apiUrl}/messaging/history`;

  // Estados reactivos
  private conversationHistorySubject = new BehaviorSubject<ConversationWithStats[]>([]);
  private filtersSubject = new BehaviorSubject<HistoryFilters>({});
  private sortOptionsSubject = new BehaviorSubject<SortOptions>({
    field: 'lastActivity',
    direction: 'desc'
  });
  private statsSubject = new BehaviorSubject<HistoryStats | null>(null);

  // Observables públicos
  public conversationHistory$ = this.conversationHistorySubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();
  public sortOptions$ = this.sortOptionsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // Observable combinado para datos filtrados y ordenados
  public filteredHistory$ = combineLatest([
    this.conversationHistory$,
    this.filters$,
    this.sortOptions$
  ]).pipe(
    map(([conversations, filters, sortOptions]) => 
      this.applyFiltersAndSort(conversations, filters, sortOptions)
    )
  );

  constructor(private http: HttpClient) {}

  /**
   * Carga el historial de conversaciones
   */
  public loadConversationHistory(page = 0, size = 50): Observable<ConversationWithStats[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ConversationWithStats[]>(`${this.apiUrl}/conversations`, { params }).pipe(
      map(conversations => conversations.map(this.mapConversationWithStats)),
      tap(conversations => {
        if (page === 0) {
          this.conversationHistorySubject.next(conversations);
        } else {
          const current = this.conversationHistorySubject.value;
          this.conversationHistorySubject.next([...current, ...conversations]);
        }
      }),
      catchError(this.handleError<ConversationWithStats[]>('loadConversationHistory', []))
    );
  }

  /**
   * Obtiene una conversación específica con estadísticas
   */
  public getConversationWithStats(conversationId: string): Observable<ConversationWithStats> {
    return this.http.get<ConversationWithStats>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      map(this.mapConversationWithStats),
      catchError(this.handleError<ConversationWithStats>('getConversationWithStats'))
    );
  }

  /**
   * Busca en el historial
   */
  public searchHistory(query: string, filters?: HistoryFilters): Observable<HistorySearchResult> {
    let params = new HttpParams().set('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<HistorySearchResult>(`${this.apiUrl}/search`, { params }).pipe(
      map(result => ({
        ...result,
        conversations: result.conversations.map(this.mapConversationWithStats),
        messages: result.messages.map(this.mapMessage)
      })),
      catchError(this.handleError<HistorySearchResult>('searchHistory', {
        conversations: [],
        messages: [],
        totalResults: 0,
        searchTime: 0,
        suggestions: []
      }))
    );
  }

  /**
   * Obtiene estadísticas del historial
   */
  public getHistoryStats(dateRange?: { from: Date; to: Date }): Observable<HistoryStats> {
    let params = new HttpParams();
    
    if (dateRange) {
      params = params.set('dateFrom', dateRange.from.toISOString());
      params = params.set('dateTo', dateRange.to.toISOString());
    }

    return this.http.get<HistoryStats>(`${this.apiUrl}/stats`, { params }).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(this.handleError<HistoryStats>('getHistoryStats'))
    );
  }

  /**
   * Exporta historial de conversaciones
   */
  public exportHistory(config: ExportConfig): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, config, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportHistory'))
    );
  }

  /**
   * Obtiene conversaciones por participante
   */
  public getConversationsByParticipant(userId: string): Observable<ConversationWithStats[]> {
    return this.http.get<ConversationWithStats[]>(`${this.apiUrl}/participants/${userId}`).pipe(
      map(conversations => conversations.map(this.mapConversationWithStats)),
      catchError(this.handleError<ConversationWithStats[]>('getConversationsByParticipant', []))
    );
  }

  /**
   * Obtiene conversaciones por categoría
   */
  public getConversationsByCategory(category: string): Observable<ConversationWithStats[]> {
    return this.http.get<ConversationWithStats[]>(`${this.apiUrl}/categories/${category}`).pipe(
      map(conversations => conversations.map(this.mapConversationWithStats)),
      catchError(this.handleError<ConversationWithStats[]>('getConversationsByCategory', []))
    );
  }

  /**
   * Obtiene actividad por rango de fechas
   */
  public getActivityByDateRange(from: Date, to: Date): Observable<ActivityStats[]> {
    const params = new HttpParams()
      .set('from', from.toISOString())
      .set('to', to.toISOString());

    return this.http.get<ActivityStats[]>(`${this.apiUrl}/activity`, { params }).pipe(
      map(activities => activities.map(activity => ({
        ...activity,
        date: new Date(activity.date)
      }))),
      catchError(this.handleError<ActivityStats[]>('getActivityByDateRange', []))
    );
  }

  /**
   * Actualiza filtros
   */
  public updateFilters(filters: Partial<HistoryFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  /**
   * Limpia filtros
   */
  public clearFilters(): void {
    this.filtersSubject.next({});
  }

  /**
   * Actualiza opciones de ordenamiento
   */
  public updateSortOptions(sortOptions: Partial<SortOptions>): void {
    const currentSort = this.sortOptionsSubject.value;
    this.sortOptionsSubject.next({ ...currentSort, ...sortOptions });
  }

  /**
   * Aplica filtros y ordenamiento
   */
  private applyFiltersAndSort(
    conversations: ConversationWithStats[],
    filters: HistoryFilters,
    sortOptions: SortOptions
  ): ConversationWithStats[] {
    let filtered = [...conversations];

    // Aplicar filtros
    if (filters.dateFrom) {
      filtered = filtered.filter(c => c.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(c => c.createdAt <= filters.dateTo!);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    if (filters.hasUnread !== undefined) {
      filtered = filtered.filter(c => filters.hasUnread ? c.unreadCount > 0 : c.unreadCount === 0);
    }

    if (filters.participants && filters.participants.length > 0) {
      filtered = filtered.filter(c => 
        c.participants.some(p => filters.participants!.includes(p.userId))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(c => c.metadata?.category === filters.category);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(search) ||
        c.participants.some(p => p.userName.toLowerCase().includes(search))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOptions.field) {
        case 'lastActivity':
          aValue = a.lastActivityDate.getTime();
          bValue = b.lastActivityDate.getTime();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'messageCount':
          aValue = a.messageCount;
          bValue = b.messageCount;
          break;
        case 'participants':
          aValue = a.participants.length;
          bValue = b.participants.length;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOptions.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }

  /**
   * Mapea conversación con estadísticas desde API
   */
  private mapConversationWithStats = (conv: any): ConversationWithStats => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
    firstMessageDate: new Date(conv.firstMessageDate),
    lastActivityDate: new Date(conv.lastActivityDate),
    participants: conv.participants?.map((p: any) => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
      lastReadAt: p.lastReadAt ? new Date(p.lastReadAt) : undefined
    })) || [],
    lastMessage: conv.lastMessage ? this.mapMessage(conv.lastMessage) : undefined,
    participantStats: conv.participantStats?.map((ps: any) => ({
      ...ps,
      lastActivity: new Date(ps.lastActivity)
    })) || []
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
   * Obtiene sugerencias de búsqueda
   */
  public getSearchSuggestions(query: string): Observable<string[]> {
    const params = new HttpParams().set('q', query);
    
    return this.http.get<string[]>(`${this.apiUrl}/search/suggestions`, { params }).pipe(
      catchError(this.handleError<string[]>('getSearchSuggestions', []))
    );
  }

  /**
   * Obtiene categorías disponibles
   */
  public getAvailableCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`).pipe(
      catchError(this.handleError<string[]>('getAvailableCategories', []))
    );
  }

  /**
   * Obtiene tags disponibles
   */
  public getAvailableTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`).pipe(
      catchError(this.handleError<string[]>('getAvailableTags', []))
    );
  }

  /**
   * Obtiene participantes únicos
   */
  public getUniqueParticipants(): Observable<ParticipantStats[]> {
    return this.http.get<ParticipantStats[]>(`${this.apiUrl}/participants`).pipe(
      map(participants => participants.map(p => ({
        ...p,
        lastActivity: new Date(p.lastActivity)
      }))),
      catchError(this.handleError<ParticipantStats[]>('getUniqueParticipants', []))
    );
  }
}
