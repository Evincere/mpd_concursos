import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MessagingService, Conversation, Message, MessageFilters, MessagingStats } from '@core/services/messaging/messaging.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del dashboard
 */
type DashboardView = 'conversations' | 'compose' | 'search' | 'stats';

/**
 * Componente principal del dashboard de mensajería
 */
@Component({
  selector: 'app-messaging-dashboard',
  templateUrl: './messaging-dashboard.component.html',
  styleUrls: ['./messaging-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MessagingDashboardComponent implements OnInit, OnDestroy {

  // Estados del componente
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  messagingStats: MessagingStats | null = null;
  
  // Estados de UI
  activeView: DashboardView = 'conversations';
  loading = false;
  sending = false;
  searchResults: Message[] = [];

  // Formularios
  messageForm: FormGroup;
  searchForm: FormGroup;
  composeForm: FormGroup;

  // Filtros y paginación
  currentFilters: MessageFilters = {};
  currentPage = 0;
  pageSize = 50;
  hasMoreMessages = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messagingService: MessagingService,
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
    this.messagingService.destroy();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      priority: ['normal'],
      attachments: [[]]
    });

    this.searchForm = this.fb.group({
      search: [''],
      type: [''],
      priority: [''],
      dateFrom: [''],
      dateTo: [''],
      hasAttachments: [false],
      isUnread: [false]
    });

    this.composeForm = this.fb.group({
      recipientId: ['', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      priority: ['normal'],
      category: ['general']
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a conversaciones
    this.messagingService.conversations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conversations => {
      this.conversations = conversations;
      
      // Actualizar conversación seleccionada si existe
      if (this.selectedConversation) {
        const updated = conversations.find(c => c.id === this.selectedConversation!.id);
        if (updated) {
          this.selectedConversation = updated;
        }
      }
    });

    // Configurar búsqueda en tiempo real
    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      if (searchTerm && searchTerm.length >= 3) {
        this.performSearch();
      } else if (!searchTerm) {
        this.searchResults = [];
      }
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.loading = true;
    
    // Cargar estadísticas
    this.messagingService.getMessagingStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.messagingStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messaging stats:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: DashboardView): void {
    this.activeView = view;
    
    if (view === 'conversations') {
      this.selectedConversation = null;
      this.messages = [];
    }
  }

  /**
   * Selecciona una conversación
   */
  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    this.markConversationAsRead(conversation.id);
    this.setActiveView('conversations');
  }

  /**
   * Carga mensajes de una conversación
   */
  private loadMessages(conversationId: string, page = 0): void {
    this.loading = true;
    
    this.messagingService.getMessages(conversationId, page, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (messages) => {
        if (page === 0) {
          this.messages = messages;
        } else {
          this.messages = [...this.messages, ...messages];
        }
        
        this.hasMoreMessages = messages.length === this.pageSize;
        this.currentPage = page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Carga más mensajes (paginación)
   */
  loadMoreMessages(): void {
    if (this.selectedConversation && this.hasMoreMessages && !this.loading) {
      this.loadMessages(this.selectedConversation.id, this.currentPage + 1);
    }
  }

  /**
   * Envía un mensaje
   */
  sendMessage(): void {
    if (this.messageForm.invalid || !this.selectedConversation) {
      this.markFormGroupTouched(this.messageForm);
      return;
    }

    const formValue = this.messageForm.value;
    const message: Partial<Message> = {
      conversationId: this.selectedConversation.id,
      content: formValue.content,
      type: 'text',
      priority: formValue.priority,
      attachments: formValue.attachments
    };

    this.sending = true;
    
    this.messagingService.sendMessage(message).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sentMessage) => {
        this.messages = [sentMessage, ...this.messages];
        this.messageForm.reset({ priority: 'normal', attachments: [] });
        this.sending = false;
        this.notificationService.showSuccess('Mensaje enviado exitosamente');
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.notificationService.showError('Error al enviar el mensaje');
        this.sending = false;
      }
    });
  }

  /**
   * Crea una nueva conversación
   */
  createConversation(): void {
    if (this.composeForm.invalid) {
      this.markFormGroupTouched(this.composeForm);
      return;
    }

    const formValue = this.composeForm.value;
    const conversation: Partial<Conversation> = {
      subject: formValue.subject,
      participants: [
        {
          userId: formValue.recipientId,
          userName: '', // Se completará en el backend
          userRole: '',
          joinedAt: new Date(),
          isActive: true
        }
      ],
      status: 'active',
      priority: formValue.priority,
      metadata: {
        category: formValue.category
      }
    };

    this.sending = true;
    
    this.messagingService.createConversation(conversation).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newConversation) => {
        // Enviar mensaje inicial
        const initialMessage: Partial<Message> = {
          conversationId: newConversation.id,
          content: formValue.content,
          type: 'text',
          priority: formValue.priority
        };

        this.messagingService.sendMessage(initialMessage).subscribe({
          next: () => {
            this.selectConversation(newConversation);
            this.composeForm.reset({ priority: 'normal', category: 'general' });
            this.sending = false;
            this.notificationService.showSuccess('Conversación creada exitosamente');
          }
        });
      },
      error: (error) => {
        console.error('Error creating conversation:', error);
        this.notificationService.showError('Error al crear la conversación');
        this.sending = false;
      }
    });
  }

  /**
   * Realiza búsqueda de mensajes
   */
  performSearch(): void {
    const formValue = this.searchForm.value;
    const filters: MessageFilters = {
      search: formValue.search,
      type: formValue.type || undefined,
      priority: formValue.priority || undefined,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? new Date(formValue.dateTo) : undefined,
      hasAttachments: formValue.hasAttachments || undefined,
      isUnread: formValue.isUnread || undefined
    };

    this.messagingService.searchMessages(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (error) => {
        console.error('Error searching messages:', error);
        this.notificationService.showError('Error en la búsqueda');
      }
    });
  }

  /**
   * Marca conversación como leída
   */
  private markConversationAsRead(conversationId: string): void {
    this.messagingService.markConversationAsRead(conversationId).subscribe();
  }

  /**
   * Archiva una conversación
   */
  async archiveConversation(conversation: Conversation): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Archivar Conversación',
      message: `¿Deseas archivar la conversación "${conversation.subject}"?`,
      confirmText: 'Archivar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).toPromise();

    if (confirmed) {
      this.messagingService.archiveConversation(conversation.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Conversación archivada');
          if (this.selectedConversation?.id === conversation.id) {
            this.selectedConversation = null;
            this.messages = [];
          }
        },
        error: (error) => {
          console.error('Error archiving conversation:', error);
          this.notificationService.showError('Error al archivar la conversación');
        }
      });
    }
  }

  /**
   * Obtiene el ícono de prioridad
   */
  getPriorityIcon(priority: string): string {
    const icons = {
      low: 'fas fa-arrow-down',
      normal: 'fas fa-minus',
      high: 'fas fa-arrow-up',
      urgent: 'fas fa-exclamation-triangle'
    };
    return icons[priority as keyof typeof icons] || 'fas fa-minus';
  }

  /**
   * Obtiene el color de prioridad
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
   * Formatea fecha relativa
   */
  formatRelativeDate(date: Date): string {
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
   * Verifica si un campo del formulario es inválido
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el número total de mensajes no leídos
   */
  getTotalUnreadCount(): number {
    return this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }

  /**
   * Filtra conversaciones por estado
   */
  getConversationsByStatus(status: string): Conversation[] {
    return this.conversations.filter(conv => conv.status === status);
  }

  /**
   * Obtiene conversaciones recientes
   */
  getRecentConversations(limit = 5): Conversation[] {
    return this.conversations
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
}
