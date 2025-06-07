import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { MessagingService, Message, Conversation } from '@core/services/messaging/messaging.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Estado del widget de chat
 */
interface ChatWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  hasUnreadMessages: boolean;
  isTyping: boolean;
  isConnected: boolean;
  lastActivity: Date | null;
}

/**
 * Configuración del widget
 */
interface ChatWidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  enableSound: boolean;
  enableTypingIndicator: boolean;
  autoOpen: boolean;
  maxHeight: number;
  showTimestamps: boolean;
}

/**
 * Widget de chat flotante
 */
@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {

  @Input() conversationId?: string;
  @Input() recipientId?: string;
  @Input() config: Partial<ChatWidgetConfig> = {};
  
  @Output() messageReceived = new EventEmitter<Message>();
  @Output() conversationCreated = new EventEmitter<Conversation>();
  @Output() widgetStateChanged = new EventEmitter<ChatWidgetState>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // Estados del componente
  widgetState: ChatWidgetState = {
    isOpen: false,
    isMinimized: false,
    hasUnreadMessages: false,
    isTyping: false,
    isConnected: true,
    lastActivity: null
  };

  widgetConfig: ChatWidgetConfig = {
    position: 'bottom-right',
    theme: 'auto',
    enableSound: true,
    enableTypingIndicator: true,
    autoOpen: false,
    maxHeight: 400,
    showTimestamps: true
  };

  // Datos del chat
  conversation: Conversation | null = null;
  messages: Message[] = [];
  unreadCount = 0;

  // Formulario
  messageForm: FormGroup;

  // Estados de UI
  loading = false;
  sending = false;
  shouldScrollToBottom = false;

  // Typing indicator
  private typingTimer?: any;
  private typingUsers: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messagingService: MessagingService,
    private notificationService: CustomNotificationService
  ) {
    this.initializeForm();
    this.mergeConfig();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.initializeChat();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTypingTimer();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Inicializa el formulario
   */
  private initializeForm(): void {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]],
      priority: ['normal']
    });

    // Detectar cuando el usuario está escribiendo
    this.messageForm.get('content')?.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.handleTyping();
    });
  }

  /**
   * Combina configuración por defecto con la proporcionada
   */
  private mergeConfig(): void {
    this.widgetConfig = { ...this.widgetConfig, ...this.config };
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a nuevos mensajes
    this.messagingService.conversations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conversations => {
      if (this.conversation) {
        const updated = conversations.find(c => c.id === this.conversation!.id);
        if (updated) {
          this.conversation = updated;
          this.updateUnreadCount();
        }
      }
    });

    // Polling para nuevos mensajes si hay conversación activa
    interval(3000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.conversation && this.widgetState.isOpen) {
        this.loadMessages();
      }
    });
  }

  /**
   * Inicializa el chat
   */
  private initializeChat(): void {
    if (this.conversationId) {
      this.loadConversation();
    } else if (this.recipientId) {
      this.createNewConversation();
    }

    if (this.widgetConfig.autoOpen) {
      this.openWidget();
    }
  }

  /**
   * Configura atajos de teclado
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Enter para enviar mensaje
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (this.widgetState.isOpen && this.messageForm.valid) {
          this.sendMessage();
        }
      }
      
      // Escape para cerrar widget
      if (event.key === 'Escape' && this.widgetState.isOpen) {
        this.closeWidget();
      }
    });
  }

  /**
   * Carga una conversación existente
   */
  private loadConversation(): void {
    if (!this.conversationId) return;

    this.loading = true;
    
    this.messagingService.getConversation(this.conversationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (conversation) => {
        this.conversation = conversation;
        this.loadMessages();
        this.updateUnreadCount();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Crea una nueva conversación
   */
  private createNewConversation(): void {
    if (!this.recipientId) return;

    const newConversation: Partial<Conversation> = {
      subject: 'Nueva conversación',
      participants: [
        {
          userId: this.recipientId,
          userName: '',
          userRole: '',
          joinedAt: new Date(),
          isActive: true
        }
      ],
      status: 'active',
      priority: 'normal',
      metadata: {
        category: 'chat'
      }
    };

    this.messagingService.createConversation(newConversation).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (conversation) => {
        this.conversation = conversation;
        this.conversationCreated.emit(conversation);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error creating conversation:', error);
        this.notificationService.showError('Error al crear la conversación');
      }
    });
  }

  /**
   * Carga mensajes de la conversación
   */
  private loadMessages(): void {
    if (!this.conversation) return;

    this.messagingService.getMessages(this.conversation.id, 0, 50).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (messages) => {
        const newMessages = messages.filter(msg => 
          !this.messages.find(existing => existing.id === msg.id)
        );
        
        if (newMessages.length > 0) {
          this.messages = [...this.messages, ...newMessages].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          
          this.shouldScrollToBottom = true;
          
          // Emitir eventos para nuevos mensajes
          newMessages.forEach(msg => {
            this.messageReceived.emit(msg);
            if (this.widgetConfig.enableSound) {
              this.playNotificationSound();
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  /**
   * Envía un mensaje
   */
  sendMessage(): void {
    if (this.messageForm.invalid || !this.conversation) {
      return;
    }

    const formValue = this.messageForm.value;
    const message: Partial<Message> = {
      conversationId: this.conversation.id,
      content: formValue.content.trim(),
      type: 'text',
      priority: formValue.priority
    };

    this.sending = true;
    
    this.messagingService.sendMessage(message).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sentMessage) => {
        this.messages.push(sentMessage);
        this.messageForm.reset({ priority: 'normal' });
        this.shouldScrollToBottom = true;
        this.sending = false;
        this.widgetState.lastActivity = new Date();
        this.emitStateChange();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.notificationService.showError('Error al enviar el mensaje');
        this.sending = false;
      }
    });
  }

  /**
   * Abre el widget
   */
  openWidget(): void {
    this.widgetState.isOpen = true;
    this.widgetState.isMinimized = false;
    this.shouldScrollToBottom = true;
    this.markMessagesAsRead();
    this.emitStateChange();
    
    // Focus en el input
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Cierra el widget
   */
  closeWidget(): void {
    this.widgetState.isOpen = false;
    this.emitStateChange();
  }

  /**
   * Minimiza/maximiza el widget
   */
  toggleMinimize(): void {
    this.widgetState.isMinimized = !this.widgetState.isMinimized;
    if (!this.widgetState.isMinimized) {
      this.shouldScrollToBottom = true;
    }
    this.emitStateChange();
  }

  /**
   * Maneja el indicador de escritura
   */
  private handleTyping(): void {
    if (!this.widgetConfig.enableTypingIndicator) return;

    this.widgetState.isTyping = true;
    this.emitStateChange();

    // Limpiar timer anterior
    this.clearTypingTimer();

    // Establecer nuevo timer
    this.typingTimer = setTimeout(() => {
      this.widgetState.isTyping = false;
      this.emitStateChange();
    }, 2000);
  }

  /**
   * Limpia el timer de escritura
   */
  private clearTypingTimer(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = undefined;
    }
  }

  /**
   * Marca mensajes como leídos
   */
  private markMessagesAsRead(): void {
    if (this.conversation) {
      this.messagingService.markConversationAsRead(this.conversation.id).subscribe();
      this.widgetState.hasUnreadMessages = false;
      this.unreadCount = 0;
      this.emitStateChange();
    }
  }

  /**
   * Actualiza el contador de mensajes no leídos
   */
  private updateUnreadCount(): void {
    if (this.conversation) {
      this.unreadCount = this.conversation.unreadCount;
      this.widgetState.hasUnreadMessages = this.unreadCount > 0;
      this.emitStateChange();
    }
  }

  /**
   * Hace scroll al final de los mensajes
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Reproduce sonido de notificación
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignorar errores de reproducción
      });
    } catch (error) {
      // Ignorar errores de audio
    }
  }

  /**
   * Emite cambio de estado
   */
  private emitStateChange(): void {
    this.widgetStateChanged.emit({ ...this.widgetState });
  }

  /**
   * Obtiene la clase CSS del widget
   */
  getWidgetClass(): string {
    const classes = [
      'chat-widget',
      `position-${this.widgetConfig.position}`,
      `theme-${this.widgetConfig.theme}`,
      this.widgetState.isOpen ? 'open' : 'closed',
      this.widgetState.isMinimized ? 'minimized' : ''
    ];
    
    return classes.filter(Boolean).join(' ');
  }

  /**
   * Formatea fecha relativa
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    
    return date.toLocaleDateString();
  }

  /**
   * Verifica si debe mostrar timestamp
   */
  shouldShowTimestamp(message: Message, index: number): boolean {
    if (!this.widgetConfig.showTimestamps) return false;
    
    if (index === 0) return true;
    
    const prevMessage = this.messages[index - 1];
    const timeDiff = message.createdAt.getTime() - prevMessage.createdAt.getTime();
    
    // Mostrar timestamp si han pasado más de 5 minutos
    return timeDiff > 5 * 60 * 1000;
  }

  /**
   * Verifica si el mensaje es del usuario actual
   */
  isOwnMessage(message: Message): boolean {
    // En producción, comparar con el ID del usuario actual
    return message.senderRole === 'admin'; // Temporal
  }

  /**
   * Obtiene el avatar del usuario
   */
  getUserAvatar(message: Message): string {
    // En producción, obtener avatar real del usuario
    return message.senderRole === 'admin' 
      ? '/assets/images/admin-avatar.png' 
      : '/assets/images/user-avatar.png';
  }

  /**
   * Verifica si hay usuarios escribiendo
   */
  hasTypingUsers(): boolean {
    return this.typingUsers.length > 0;
  }

  /**
   * Obtiene texto de usuarios escribiendo
   */
  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} está escribiendo...`;
    } else if (this.typingUsers.length > 1) {
      return `${this.typingUsers.length} personas están escribiendo...`;
    }
    return '';
  }
}
