import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  ConversationHistoryService, 
  ConversationWithStats, 
  HistoryFilters, 
  SortOptions, 
  HistoryStats,
  ParticipantStats,
  ExportConfig
} from '@core/services/messaging/conversation-history.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del historial
 */
type HistoryView = 'list' | 'stats' | 'search' | 'export';

/**
 * Componente de historial de conversaciones
 */
@Component({
  selector: 'app-conversation-history',
  templateUrl: './conversation-history.component.html',
  styleUrls: ['./conversation-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ConversationHistoryComponent implements OnInit, OnDestroy {

  // Estados del componente
  conversations: ConversationWithStats[] = [];
  filteredConversations: ConversationWithStats[] = [];
  historyStats: HistoryStats | null = null;
  participants: ParticipantStats[] = [];
  categories: string[] = [];
  tags: string[] = [];

  // Estados de UI
  activeView: HistoryView = 'list';
  loading = false;
  exporting = false;
  searchResults: any = null;

  // Formularios
  filtersForm!: FormGroup;
  searchForm!: FormGroup;
  exportForm!: FormGroup;

  // Configuración
  currentFilters: HistoryFilters = {};
  currentSort: SortOptions = { field: 'lastActivity', direction: 'desc' };

  // Paginación
  currentPage = 0;
  pageSize = 20;
  hasMoreData = true;

  // Opciones de vista
  viewOptions = [
    { value: 'list', label: 'Lista', icon: 'fas fa-list' },
    { value: 'stats', label: 'Estadísticas', icon: 'fas fa-chart-bar' },
    { value: 'search', label: 'Búsqueda', icon: 'fas fa-search' },
    { value: 'export', label: 'Exportar', icon: 'fas fa-download' }
  ];

  // Opciones de ordenamiento
  sortOptions = [
    { value: 'lastActivity', label: 'Última actividad' },
    { value: 'created', label: 'Fecha de creación' },
    { value: 'messageCount', label: 'Número de mensajes' },
    { value: 'participants', label: 'Participantes' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private conversationHistoryService: ConversationHistoryService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      status: ['all'],
      priority: ['all'],
      hasUnread: [''],
      category: [''],
      participants: [[]],
      tags: [[]],
      search: ['']
    });

    this.searchForm = this.fb.group({
      query: [''],
      includeMessages: [true],
      includeMetadata: [false]
    });

    this.exportForm = this.fb.group({
      format: ['json'],
      includeMessages: [true],
      includeAttachments: [false],
      includeMetadata: [true],
      dateFrom: [''],
      dateTo: [''],
      anonymize: [false]
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a conversaciones filtradas
    this.conversationHistoryService.filteredHistory$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conversations => {
      this.filteredConversations = conversations;
    });

    // Suscribirse a estadísticas
    this.conversationHistoryService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.historyStats = stats;
    });

    // Configurar búsqueda en tiempo real
    this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.applyFilters(filters);
    });

    // Configurar búsqueda de texto
    this.searchForm.get('query')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query && query.length >= 3) {
        this.performSearch(query);
      } else {
        this.searchResults = null;
      }
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.loading = true;

    // Cargar conversaciones
    this.conversationHistoryService.loadConversationHistory(0, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.hasMoreData = conversations.length === this.pageSize;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading conversation history:', error);
        this.loading = false;
      }
    });

    // Cargar estadísticas
    this.conversationHistoryService.getHistoryStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar datos auxiliares
    this.loadAuxiliaryData();
  }

  /**
   * Carga datos auxiliares
   */
  private loadAuxiliaryData(): void {
    // Cargar participantes
    this.conversationHistoryService.getUniqueParticipants().pipe(
      takeUntil(this.destroy$)
    ).subscribe(participants => {
      this.participants = participants;
    });

    // Cargar categorías
    this.conversationHistoryService.getAvailableCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe(categories => {
      this.categories = categories;
    });

    // Cargar tags
    this.conversationHistoryService.getAvailableTags().pipe(
      takeUntil(this.destroy$)
    ).subscribe(tags => {
      this.tags = tags;
    });
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: string): void {
    this.activeView = view as HistoryView;
  }

  /**
   * Aplica filtros
   */
  private applyFilters(formFilters: any): void {
    const filters: HistoryFilters = {
      dateFrom: formFilters.dateFrom ? new Date(formFilters.dateFrom) : undefined,
      dateTo: formFilters.dateTo ? new Date(formFilters.dateTo) : undefined,
      status: formFilters.status !== 'all' ? formFilters.status : undefined,
      priority: formFilters.priority !== 'all' ? formFilters.priority : undefined,
      hasUnread: formFilters.hasUnread !== '' ? formFilters.hasUnread : undefined,
      category: formFilters.category || undefined,
      participants: formFilters.participants?.length > 0 ? formFilters.participants : undefined,
      tags: formFilters.tags?.length > 0 ? formFilters.tags : undefined,
      search: formFilters.search || undefined
    };

    this.currentFilters = filters;
    this.conversationHistoryService.updateFilters(filters);
  }

  /**
   * Actualiza ordenamiento
   */
  updateSort(field: string): void {
    const currentSort = this.currentSort;
    
    if (currentSort.field === field) {
      // Cambiar dirección si es el mismo campo
      this.currentSort = {
        field: field as any,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
      };
    } else {
      // Nuevo campo, dirección descendente por defecto
      this.currentSort = {
        field: field as any,
        direction: 'desc'
      };
    }

    this.conversationHistoryService.updateSortOptions(this.currentSort);
  }

  /**
   * Realiza búsqueda
   */
  private performSearch(query: string): void {
    const searchFilters = this.currentFilters;
    
    this.conversationHistoryService.searchHistory(query, searchFilters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (error) => {
        console.error('Error searching history:', error);
        this.notificationService.showError('Error en la búsqueda');
      }
    });
  }

  /**
   * Carga más conversaciones
   */
  loadMore(): void {
    if (!this.hasMoreData || this.loading) return;

    this.loading = true;
    this.currentPage++;

    this.conversationHistoryService.loadConversationHistory(this.currentPage, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (conversations) => {
        this.hasMoreData = conversations.length === this.pageSize;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading more conversations:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Exporta historial
   */
  async exportHistory(): Promise<void> {
    const formValue = this.exportForm.value;
    
    const config: ExportConfig = {
      format: formValue.format,
      includeMessages: formValue.includeMessages,
      includeAttachments: formValue.includeAttachments,
      includeMetadata: formValue.includeMetadata,
      anonymize: formValue.anonymize,
      dateRange: formValue.dateFrom && formValue.dateTo ? {
        from: new Date(formValue.dateFrom),
        to: new Date(formValue.dateTo)
      } : undefined
    };

    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Exportar Historial',
      message: `¿Deseas exportar el historial en formato ${config.format.toUpperCase()}?`,
      confirmText: 'Exportar',
      cancelText: 'Cancelar',
      type: 'info'
    }).toPromise();

    if (!confirmed) return;

    this.exporting = true;

    this.conversationHistoryService.exportHistory(config).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `historial_conversaciones.${config.format}`);
        this.notificationService.showSuccess('Historial exportado exitosamente');
        this.exporting = false;
      },
      error: (error) => {
        console.error('Error exporting history:', error);
        this.notificationService.showError('Error al exportar el historial');
        this.exporting = false;
      }
    });
  }

  /**
   * Descarga archivo
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset({
      status: 'all',
      priority: 'all',
      hasUnread: '',
      participants: [],
      tags: []
    });
    this.conversationHistoryService.clearFilters();
  }

  /**
   * Obtiene ícono de estado
   */
  getStatusIcon(status: string): string {
    const icons = {
      active: 'fas fa-circle',
      archived: 'fas fa-archive',
      closed: 'fas fa-times-circle'
    };
    return icons[status as keyof typeof icons] || 'fas fa-question-circle';
  }

  /**
   * Obtiene color de estado
   */
  getStatusColor(status: string): string {
    const colors = {
      active: '#4CAF50',
      archived: '#f59e0b',
      closed: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  /**
   * Obtiene color de prioridad
   */
  getPriorityColor(priority: string): string {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    };
    return colors[priority as keyof typeof colors] || '#3b82f6';
  }

  /**
   * Formatea duración
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  }

  /**
   * Formatea fecha relativa
   */
  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    
    return `${Math.floor(diffDays / 365)} años`;
  }

  /**
   * Obtiene ícono de ordenamiento
   */
  getSortIcon(field: string): string {
    if (this.currentSort.field !== field) {
      return 'fas fa-sort';
    }
    
    return this.currentSort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return Object.values(this.currentFilters).some(value => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    );
  }

  /**
   * Obtiene resumen de filtros activos
   */
  getActiveFiltersCount(): number {
    return Object.values(this.currentFilters).filter(value => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    ).length;
  }

  /**
   * Navega a conversación específica
   */
  navigateToConversation(conversation: ConversationWithStats): void {
    // En producción, navegar a la conversación específica
    // Logging implementado con LoggingService;
  }

  /**
   * Obtiene estadísticas de participante más activo
   */
  getMostActiveParticipant(conversation: ConversationWithStats): ParticipantStats | null {
    if (!conversation.participantStats || conversation.participantStats.length === 0) {
      return null;
    }

    return conversation.participantStats.reduce((most, current) =>
      current.messageCount > most.messageCount ? current : most
    );
  }

  /**
   * Obtiene string de participantes para mostrar
   */
  getParticipantsString(conversation: ConversationWithStats): string {
    if (!conversation.participants || conversation.participants.length === 0) {
      return 'Sin participantes';
    }

    const participantNames = conversation.participants.map(p => p.userName || 'Usuario');

    if (participantNames.length <= 2) {
      return participantNames.join(', ');
    } else if (participantNames.length === 3) {
      return `${participantNames[0]}, ${participantNames[1]} y ${participantNames[2]}`;
    } else {
      return `${participantNames[0]}, ${participantNames[1]} y ${participantNames.length - 2} más`;
    }
  }

}
