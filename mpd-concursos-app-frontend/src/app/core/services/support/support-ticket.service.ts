import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, interval } from 'rxjs';
import { catchError, map, tap, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  SupportTicket,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketFilters,
  TicketStatistics,
  TicketComment,
  TicketAttachment,
  TicketHistory,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  CommentType,
  SLAConfiguration,
  EscalationRule,
  QuickResponseTemplate
} from '../../models/support-ticket.model';

/**
 * Servicio para gestión de tickets de soporte
 */
@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private readonly apiUrl = `${environment.apiUrl}/support/tickets`;
  
  // Estados reactivos
  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private statisticsSubject = new BehaviorSubject<TicketStatistics | null>(null);
  private myTicketsSubject = new BehaviorSubject<SupportTicket[]>([]);

  // Observables públicos
  public tickets$ = this.ticketsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();
  public myTickets$ = this.myTicketsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.initializePolling();
  }

  /**
   * Inicializa el polling para actualizaciones en tiempo real
   */
  private initializePolling(): void {
    // Actualizar estadísticas cada 30 segundos
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.loadStatistics())
    ).subscribe();

    // Actualizar tickets cada 60 segundos
    interval(60000).pipe(
      startWith(0),
      switchMap(() => this.loadTickets())
    ).subscribe();
  }

  /**
   * Obtiene todos los tickets con filtros opcionales
   */
  getTickets(filters?: TicketFilters, page = 1, limit = 20): Observable<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status?.length) {
        params = params.set('status', filters.status.join(','));
      }
      if (filters.priority?.length) {
        params = params.set('priority', filters.priority.join(','));
      }
      if (filters.category?.length) {
        params = params.set('category', filters.category.join(','));
      }
      if (filters.assignedToId) {
        params = params.set('assignedToId', filters.assignedToId);
      }
      if (filters.reporterId) {
        params = params.set('reporterId', filters.reporterId);
      }
      if (filters.createdFrom) {
        params = params.set('createdFrom', filters.createdFrom.toISOString());
      }
      if (filters.createdTo) {
        params = params.set('createdTo', filters.createdTo.toISOString());
      }
      if (filters.tags?.length) {
        params = params.set('tags', filters.tags.join(','));
      }
      if (filters.searchText) {
        params = params.set('search', filters.searchText);
      }
    }

    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        tickets: response.data.map(this.mapTicketFromAPI),
        total: response.total,
        page: response.page,
        totalPages: response.totalPages
      })),
      tap(result => {
        this.ticketsSubject.next(result.tickets);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtiene un ticket por ID
   */
  getTicketById(id: string): Observable<SupportTicket> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapTicketFromAPI(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo ticket
   */
  createTicket(ticketData: CreateTicketDTO): Observable<SupportTicket> {
    const formData = new FormData();
    
    formData.append('title', ticketData.title);
    formData.append('description', ticketData.description);
    formData.append('category', ticketData.category);
    
    if (ticketData.priority) {
      formData.append('priority', ticketData.priority);
    }
    
    if (ticketData.tags?.length) {
      formData.append('tags', JSON.stringify(ticketData.tags));
    }
    
    if (ticketData.customFields) {
      formData.append('customFields', JSON.stringify(ticketData.customFields));
    }
    
    if (ticketData.attachments?.length) {
      ticketData.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    return this.http.post<any>(this.apiUrl, formData).pipe(
      map(response => this.mapTicketFromAPI(response.data)),
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un ticket existente
   */
  updateTicket(id: string, updates: UpdateTicketDTO): Observable<SupportTicket> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updates).pipe(
      map(response => this.mapTicketFromAPI(response.data)),
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un ticket
   */
  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Cambia el estado de un ticket
   */
  changeTicketStatus(id: string, status: TicketStatus, comment?: string): Observable<SupportTicket> {
    const payload = { status, comment };
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, payload).pipe(
      map(response => this.mapTicketFromAPI(response.data)),
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Asigna un ticket a un agente
   */
  assignTicket(id: string, agentId: string): Observable<SupportTicket> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/assign`, { assignedToId: agentId }).pipe(
      map(response => this.mapTicketFromAPI(response.data)),
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Agrega un comentario a un ticket
   */
  addComment(ticketId: string, content: string, type: CommentType = CommentType.PUBLIC, attachments?: File[]): Observable<TicketComment> {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);
    
    if (attachments?.length) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    return this.http.post<any>(`${this.apiUrl}/${ticketId}/comments`, formData).pipe(
      map(response => this.mapCommentFromAPI(response.data)),
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene comentarios de un ticket
   */
  getTicketComments(ticketId: string): Observable<TicketComment[]> {
    return this.http.get<any>(`${this.apiUrl}/${ticketId}/comments`).pipe(
      map(response => response.data.map(this.mapCommentFromAPI)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el historial de un ticket
   */
  getTicketHistory(ticketId: string): Observable<TicketHistory[]> {
    return this.http.get<any>(`${this.apiUrl}/${ticketId}/history`).pipe(
      map(response => response.data.map(this.mapHistoryFromAPI)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene estadísticas de tickets
   */
  getStatistics(filters?: TicketFilters): Observable<TicketStatistics> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.createdFrom) {
        params = params.set('from', filters.createdFrom.toISOString());
      }
      if (filters.createdTo) {
        params = params.set('to', filters.createdTo.toISOString());
      }
    }

    return this.http.get<any>(`${this.apiUrl}/statistics`, { params }).pipe(
      map(response => response.data),
      tap(stats => this.statisticsSubject.next(stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene mis tickets (como usuario)
   */
  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<any>(`${this.apiUrl}/my-tickets`).pipe(
      map(response => response.data.map(this.mapTicketFromAPI)),
      tap(tickets => this.myTicketsSubject.next(tickets)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene tickets asignados a mí (como agente)
   */
  getAssignedTickets(): Observable<SupportTicket[]> {
    return this.http.get<any>(`${this.apiUrl}/assigned-to-me`).pipe(
      map(response => response.data.map(this.mapTicketFromAPI)),
      catchError(this.handleError)
    );
  }

  /**
   * Califica la satisfacción de un ticket
   */
  rateTicket(ticketId: string, rating: number, comment?: string): Observable<void> {
    const payload = { rating, comment };
    return this.http.post<void>(`${this.apiUrl}/${ticketId}/satisfaction`, payload).pipe(
      tap(() => this.refreshTickets()),
      catchError(this.handleError)
    );
  }

  /**
   * Métodos privados de utilidad
   */
  private loadTickets(): Observable<any> {
    return this.getTickets();
  }

  private loadStatistics(): Observable<TicketStatistics> {
    return this.getStatistics();
  }

  private refreshTickets(): void {
    this.loadTickets().subscribe();
    this.loadStatistics().subscribe();
  }

  private mapTicketFromAPI(data: any): SupportTicket {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      assignedAt: data.assignedAt ? new Date(data.assignedAt) : undefined,
      firstResponseAt: data.firstResponseAt ? new Date(data.firstResponseAt) : undefined,
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined,
      closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
      satisfactionDate: data.satisfactionDate ? new Date(data.satisfactionDate) : undefined,
      sla: {
        ...data.sla,
        responseDeadline: new Date(data.sla.responseDeadline),
        resolutionDeadline: new Date(data.sla.resolutionDeadline)
      },
      comments: data.comments?.map(this.mapCommentFromAPI) || [],
      attachments: data.attachments?.map(this.mapAttachmentFromAPI) || [],
      history: data.history?.map(this.mapHistoryFromAPI) || []
    };
  }

  private mapCommentFromAPI(data: any): TicketComment {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      attachments: data.attachments?.map(this.mapAttachmentFromAPI) || []
    };
  }

  private mapAttachmentFromAPI(data: any): TicketAttachment {
    return {
      ...data,
      uploadedAt: new Date(data.uploadedAt)
    };
  }

  private mapHistoryFromAPI(data: any): TicketHistory {
    return {
      ...data,
      timestamp: new Date(data.timestamp)
    };
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en SupportTicketService:', error);
    return throwError(() => error);
  }
}
