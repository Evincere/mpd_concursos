import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { 
  RealTimeNotificationsService, 
  RealTimeNotification, 
  NotificationPriority,
  RealTimeNotificationType,
  ConnectionState,
  NotificationStats
} from '@core/services/notifications/real-time-notifications.service';

/**
 * Vista del centro de notificaciones
 */
type NotificationView = 'all' | 'unread' | 'messages' | 'updates' | 'alerts';

/**
 * Filtros de notificaciones
 */
interface NotificationFilters {
  view: NotificationView;
  type?: RealTimeNotificationType;
  priority?: NotificationPriority;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  search?: string;
}

/**
 * Componente del centro de notificaciones
 */
@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {

  @Input() isOpen = false;
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  @Input() maxHeight = 600;
  @Input() showStats = true;

  @Output() openChanged = new EventEmitter<boolean>();
  @Output() notificationClicked = new EventEmitter<RealTimeNotification>();
  @Output() actionExecuted = new EventEmitter<{ notification: RealTimeNotification; action: any }>();

  // Estados del componente
  notifications: RealTimeNotification[] = [];
  filteredNotifications: RealTimeNotification[] = [];
  unreadCount = 0;
  connectionState: ConnectionState | null = null;
  stats: NotificationStats | null = null;

  // Filtros y vista
  currentFilters: NotificationFilters = {
    view: 'all',
    dateRange: 'all'
  };

  // Estados de UI
  loading = false;
  searchTerm = '';

  // Opciones de vista
  viewOptions = [
    { value: 'all', label: 'Todas', icon: 'fas fa-list' },
    { value: 'unread', label: 'No leídas', icon: 'fas fa-envelope' },
    { value: 'messages', label: 'Mensajes', icon: 'fas fa-comments' },
    { value: 'updates', label: 'Actualizaciones', icon: 'fas fa-sync-alt' },
    { value: 'alerts', label: 'Alertas', icon: 'fas fa-exclamation-triangle' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private realTimeNotificationsService: RealTimeNotificationsService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a notificaciones
    this.realTimeNotificationsService.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = notifications;
      this.applyFilters();
    });

    // Suscribirse al contador de no leídas
    this.realTimeNotificationsService.unreadCount$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.unreadCount = count;
    });

    // Suscribirse al estado de conexión
    this.realTimeNotificationsService.connectionState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.connectionState = state;
    });
  }

  /**
   * Carga estadísticas
   */
  private loadStats(): void {
    this.stats = this.realTimeNotificationsService.getStats();
  }

  /**
   * Aplica filtros a las notificaciones
   */
  private applyFilters(): void {
    let filtered = [...this.notifications];

    // Filtrar por vista
    switch (this.currentFilters.view) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'messages':
        filtered = filtered.filter(n => n.type === 'message');
        break;
      case 'updates':
        filtered = filtered.filter(n => 
          n.type === 'inscription_update' || 
          n.type === 'contest_update' || 
          n.type === 'document_status'
        );
        break;
      case 'alerts':
        filtered = filtered.filter(n => 
          n.type === 'system_alert' || 
          n.priority === 'high' || 
          n.priority === 'critical'
        );
        break;
    }

    // Filtrar por tipo específico
    if (this.currentFilters.type) {
      filtered = filtered.filter(n => n.type === this.currentFilters.type);
    }

    // Filtrar por prioridad
    if (this.currentFilters.priority) {
      filtered = filtered.filter(n => n.priority === this.currentFilters.priority);
    }

    // Filtrar por rango de fecha
    if (this.currentFilters.dateRange && this.currentFilters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (this.currentFilters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(n => n.timestamp >= cutoffDate);
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search)
      );
    }

    this.filteredNotifications = filtered;
  }

  /**
   * Cambia la vista activa
   */
  setView(view: NotificationView): void {
    this.currentFilters.view = view;
    this.applyFilters();
  }

  /**
   * Actualiza término de búsqueda
   */
  updateSearch(term: string): void {
    this.searchTerm = term;
    this.currentFilters.search = term;
    this.applyFilters();
  }

  /**
   * Maneja clic en notificación
   */
  onNotificationClick(notification: RealTimeNotification): void {
    // Marcar como leída si no lo está
    if (!notification.isRead) {
      this.realTimeNotificationsService.markAsRead(notification.id);
    }

    // Emitir evento
    this.notificationClicked.emit(notification);
  }

  /**
   * Ejecuta acción de notificación
   */
  executeAction(notification: RealTimeNotification, action: any, event: Event): void {
    event.stopPropagation();
    
    // Marcar como leída
    if (!notification.isRead) {
      this.realTimeNotificationsService.markAsRead(notification.id);
    }

    // Emitir evento
    this.actionExecuted.emit({ notification, action });
  }

  /**
   * Marca todas como leídas
   */
  markAllAsRead(): void {
    this.realTimeNotificationsService.markAllAsRead();
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAll(): void {
    this.realTimeNotificationsService.clearAllNotifications();
  }

  /**
   * Elimina notificación específica
   */
  removeNotification(notification: RealTimeNotification, event: Event): void {
    event.stopPropagation();
    this.realTimeNotificationsService.removeNotification(notification.id);
  }

  /**
   * Abre/cierra el centro
   */
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.openChanged.emit(this.isOpen);
  }

  /**
   * Cierra el centro
   */
  close(): void {
    this.isOpen = false;
    this.openChanged.emit(this.isOpen);
  }

  /**
   * Obtiene ícono de tipo de notificación
   */
  getTypeIcon(type: RealTimeNotificationType): string {
    const icons = {
      message: 'fas fa-comment',
      inscription_update: 'fas fa-user-plus',
      contest_update: 'fas fa-trophy',
      document_status: 'fas fa-file-alt',
      exam_schedule: 'fas fa-calendar-alt',
      system_alert: 'fas fa-exclamation-triangle',
      user_action: 'fas fa-user'
    };
    return icons[type] || 'fas fa-bell';
  }

  /**
   * Obtiene color de prioridad
   */
  getPriorityColor(priority: NotificationPriority): string {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority];
  }

  /**
   * Obtiene clase CSS de prioridad
   */
  getPriorityClass(priority: NotificationPriority): string {
    return `priority-${priority}`;
  }

  /**
   * Formatea tiempo relativo
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  /**
   * Verifica si la notificación ha expirado
   */
  isExpired(notification: RealTimeNotification): boolean {
    if (!notification.expiresAt) return false;
    return new Date() > notification.expiresAt;
  }

  /**
   * Obtiene texto del estado de conexión
   */
  getConnectionStatusText(): string {
    if (!this.connectionState) return 'Desconocido';
    
    if (this.connectionState.isConnected) {
      switch (this.connectionState.connectionQuality) {
        case 'excellent': return 'Excelente';
        case 'good': return 'Buena';
        case 'poor': return 'Pobre';
        default: return 'Conectado';
      }
    } else {
      return `Desconectado (${this.connectionState.reconnectAttempts} intentos)`;
    }
  }

  /**
   * Obtiene color del estado de conexión
   */
  getConnectionStatusColor(): string {
    if (!this.connectionState) return '#6b7280';
    
    if (this.connectionState.isConnected) {
      switch (this.connectionState.connectionQuality) {
        case 'excellent': return '#4CAF50';
        case 'good': return '#8bc34a';
        case 'poor': return '#ff9800';
        default: return '#2196f3';
      }
    } else {
      return '#f44336';
    }
  }

  /**
   * Obtiene notificaciones agrupadas por fecha
   */
  getGroupedNotifications(): { date: string; notifications: RealTimeNotification[] }[] {
    const groups: { [key: string]: RealTimeNotification[] } = {};
    
    this.filteredNotifications.forEach(notification => {
      const dateKey = this.getDateKey(notification.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications: notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    })).sort((a, b) => {
      // Ordenar grupos por fecha (más reciente primero)
      if (a.date === 'Hoy') return -1;
      if (b.date === 'Hoy') return 1;
      if (a.date === 'Ayer') return -1;
      if (b.date === 'Ayer') return 1;
      return a.date.localeCompare(b.date);
    });
  }

  /**
   * Obtiene clave de fecha para agrupación
   */
  private getDateKey(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notificationDate.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Obtiene clase CSS del componente
   */
  getComponentClass(): string {
    const classes = [
      'notification-center',
      `position-${this.position}`,
      this.isOpen ? 'open' : 'closed'
    ];
    
    return classes.join(' ');
  }

  /**
   * Verifica si hay notificaciones filtradas
   */
  hasFilteredNotifications(): boolean {
    return this.filteredNotifications.length > 0;
  }

  /**
   * Obtiene contador para vista específica
   */
  getViewCount(view: NotificationView): number {
    switch (view) {
      case 'all':
        return this.notifications.length;
      case 'unread':
        return this.unreadCount;
      case 'messages':
        return this.notifications.filter(n => n.type === 'message').length;
      case 'updates':
        return this.notifications.filter(n => 
          n.type === 'inscription_update' || 
          n.type === 'contest_update' || 
          n.type === 'document_status'
        ).length;
      case 'alerts':
        return this.notifications.filter(n => 
          n.type === 'system_alert' || 
          n.priority === 'high' || 
          n.priority === 'critical'
        ).length;
      default:
        return 0;
    }
  }
}
