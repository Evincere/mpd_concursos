import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SupportTicketService } from '../../../../../core/services/support/support-ticket.service';
import { QuickResponseService } from '../../../../../core/services/support/quick-response.service';
import { CustomNotificationService } from '../../../../../shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '../../../../../shared/components/custom-dialog/custom-dialog.service';

import {
  SupportTicket,
  TicketComment,
  TicketHistory,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  CommentType,
  QuickResponseTemplate
} from '../../../../../core/models/support-ticket.model';

/**
 * Vista activa del detalle
 */
type DetailView = 'overview' | 'comments' | 'history' | 'attachments';

/**
 * Componente de detalle de ticket
 */
@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() ticketId?: string;

  // Estados del componente
  activeView: DetailView = 'overview';
  loading = false;
  saving = false;
  
  // Datos
  ticket: SupportTicket | null = null;
  comments: TicketComment[] = [];
  history: TicketHistory[] = [];
  quickTemplates: QuickResponseTemplate[] = [];
  
  // Formularios
  commentForm!: FormGroup;
  statusForm!: FormGroup;
  assignmentForm!: FormGroup;
  
  // Configuración de vistas
  viewOptions = [
    { value: 'overview', label: 'Resumen', icon: 'fas fa-info-circle' },
    { value: 'comments', label: 'Comentarios', icon: 'fas fa-comments' },
    { value: 'history', label: 'Historial', icon: 'fas fa-history' },
    { value: 'attachments', label: 'Archivos', icon: 'fas fa-paperclip' }
  ];

  // Enums para el template
  TicketStatus = TicketStatus;
  TicketPriority = TicketPriority;
  TicketCategory = TicketCategory;
  CommentType = CommentType;

  // Configuración de estados
  statusOptions = [
    { value: TicketStatus.OPEN, label: 'Abierto', color: 'blue', icon: 'fas fa-folder-open' },
    { value: TicketStatus.IN_PROGRESS, label: 'En Progreso', color: 'orange', icon: 'fas fa-spinner' },
    { value: TicketStatus.PENDING_USER, label: 'Pendiente Usuario', color: 'yellow', icon: 'fas fa-user-clock' },
    { value: TicketStatus.PENDING_INTERNAL, label: 'Pendiente Interno', color: 'purple', icon: 'fas fa-clock' },
    { value: TicketStatus.RESOLVED, label: 'Resuelto', color: 'green', icon: 'fas fa-check-circle' },
    { value: TicketStatus.CLOSED, label: 'Cerrado', color: 'gray', icon: 'fas fa-times-circle' },
    { value: TicketStatus.CANCELLED, label: 'Cancelado', color: 'red', icon: 'fas fa-ban' }
  ];

  priorityOptions = [
    { value: TicketPriority.LOW, label: 'Baja', color: 'green', icon: 'fas fa-arrow-down' },
    { value: TicketPriority.NORMAL, label: 'Normal', color: 'blue', icon: 'fas fa-minus' },
    { value: TicketPriority.HIGH, label: 'Alta', color: 'orange', icon: 'fas fa-arrow-up' },
    { value: TicketPriority.URGENT, label: 'Urgente', color: 'red', icon: 'fas fa-exclamation' },
    { value: TicketPriority.CRITICAL, label: 'Crítica', color: 'red', icon: 'fas fa-exclamation-triangle' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supportTicketService: SupportTicketService,
    private quickResponseService: QuickResponseService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadTicketId();
    this.loadQuickTemplates();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
      type: [CommentType.PUBLIC],
      templateId: [''],
      attachments: [[]]
    });

    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      comment: ['']
    });

    this.assignmentForm = this.fb.group({
      assignedToId: ['']
    });
  }

  /**
   * Configura las suscripciones a los formularios
   */
  private setupFormSubscriptions(): void {
    // Autocompletar comentario cuando se selecciona una plantilla
    this.commentForm.get('templateId')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(templateId => {
      if (templateId) {
        this.applyQuickTemplate(templateId);
      }
    });
  }

  /**
   * Carga el ID del ticket desde la ruta o input
   */
  private loadTicketId(): void {
    if (this.ticketId) {
      this.loadTicketData(this.ticketId);
    } else {
      this.route.params.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
        if (params['id']) {
          this.loadTicketData(params['id']);
        }
      });
    }
  }

  /**
   * Carga los datos del ticket
   */
  private loadTicketData(ticketId: string): void {
    this.loading = true;

    combineLatest([
      this.supportTicketService.getTicketById(ticketId),
      this.supportTicketService.getTicketComments(ticketId),
      this.supportTicketService.getTicketHistory(ticketId)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([ticket, comments, history]) => {
        this.ticket = ticket;
        this.comments = comments;
        this.history = history;
        this.initializeFormsWithData();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando datos del ticket:', error);
        this.notificationService.showError('Error al cargar los datos del ticket');
        this.loading = false;
      }
    });
  }

  /**
   * Carga las plantillas de respuesta rápida
   */
  private loadQuickTemplates(): void {
    this.quickResponseService.getTemplates().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (templates) => {
        this.quickTemplates = templates.filter(t => t.isActive);
      },
      error: (error) => {
        console.error('Error cargando plantillas:', error);
      }
    });
  }

  /**
   * Inicializa los formularios con los datos del ticket
   */
  private initializeFormsWithData(): void {
    if (this.ticket) {
      this.statusForm.patchValue({
        status: this.ticket.status
      });

      this.assignmentForm.patchValue({
        assignedToId: this.ticket.assignedToId || ''
      });
    }
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: DetailView | string): void {
    this.activeView = view as DetailView;
  }

  /**
   * Aplica una plantilla de respuesta rápida
   */
  private applyQuickTemplate(templateId: string): void {
    const template = this.quickTemplates.find(t => t.id === templateId);
    if (template && this.ticket) {
      // Procesar variables de la plantilla
      const variables = {
        ticketNumber: this.ticket.ticketNumber,
        reporterName: this.ticket.reporterName,
        category: this.getCategoryLabel(this.ticket.category),
        priority: this.getPriorityLabel(this.ticket.priority),
        status: this.getStatusLabel(this.ticket.status),
        createdAt: this.ticket.createdAt.toLocaleDateString(),
        responseTime: this.formatTime(this.ticket.sla.responseTime),
        resolutionTime: this.formatTime(this.ticket.sla.resolutionTime)
      };

      const processedTemplate = this.quickResponseService.processTemplate(template, variables);
      
      this.commentForm.patchValue({
        content: processedTemplate.content
      });

      // Incrementar contador de uso
      this.quickResponseService.incrementUsage(templateId).subscribe();
    }
  }

  /**
   * Agrega un comentario al ticket
   */
  addComment(): void {
    if (this.commentForm.valid && this.ticket) {
      this.saving = true;
      const formValue = this.commentForm.value;

      this.supportTicketService.addComment(
        this.ticket.id,
        formValue.content,
        formValue.type,
        formValue.attachments
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (comment) => {
          this.comments.push(comment);
          this.commentForm.reset({
            type: CommentType.PUBLIC,
            templateId: '',
            attachments: []
          });
          this.notificationService.showSuccess('Comentario agregado exitosamente');
          this.saving = false;
        },
        error: (error) => {
          console.error('Error agregando comentario:', error);
          this.notificationService.showError('Error al agregar el comentario');
          this.saving = false;
        }
      });
    }
  }

  /**
   * Cambia el estado del ticket
   */
  changeStatus(): void {
    if (this.statusForm.valid && this.ticket) {
      this.saving = true;
      const formValue = this.statusForm.value;

      this.supportTicketService.changeTicketStatus(
        this.ticket.id,
        formValue.status,
        formValue.comment
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedTicket) => {
          this.ticket = updatedTicket;
          this.statusForm.patchValue({ comment: '' });
          this.notificationService.showSuccess('Estado del ticket actualizado');
          this.saving = false;
          this.loadTicketData(this.ticket.id); // Recargar para obtener historial actualizado
        },
        error: (error) => {
          console.error('Error cambiando estado:', error);
          this.notificationService.showError('Error al cambiar el estado del ticket');
          this.saving = false;
        }
      });
    }
  }

  /**
   * Asigna el ticket a un agente
   */
  assignTicket(): void {
    if (this.assignmentForm.valid && this.ticket) {
      this.saving = true;
      const agentId = this.assignmentForm.value.assignedToId;

      this.supportTicketService.assignTicket(this.ticket.id, agentId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedTicket) => {
          this.ticket = updatedTicket;
          this.notificationService.showSuccess('Ticket asignado exitosamente');
          this.saving = false;
        },
        error: (error) => {
          console.error('Error asignando ticket:', error);
          this.notificationService.showError('Error al asignar el ticket');
          this.saving = false;
        }
      });
    }
  }

  /**
   * Maneja la carga de archivos
   */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const files = Array.from(target.files);
      this.commentForm.patchValue({
        attachments: files
      });
    }
  }

  /**
   * Obtiene el color para un estado
   */
  getStatusColor(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.color || 'gray';
  }

  /**
   * Obtiene el color para una prioridad
   */
  getPriorityColor(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'gray';
  }

  /**
   * Obtiene la etiqueta para un estado
   */
  getStatusLabel(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  /**
   * Obtiene la etiqueta para una prioridad
   */
  getPriorityLabel(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  }

  /**
   * Obtiene la etiqueta para una categoría
   */
  getCategoryLabel(category: TicketCategory): string {
    const categoryOptions = [
      { value: TicketCategory.TECHNICAL, label: 'Técnico' },
      { value: TicketCategory.ACCOUNT, label: 'Cuenta' },
      { value: TicketCategory.INSCRIPTION, label: 'Inscripción' },
      { value: TicketCategory.DOCUMENTS, label: 'Documentos' },
      { value: TicketCategory.PAYMENT, label: 'Pagos' },
      { value: TicketCategory.GENERAL, label: 'General' },
      { value: TicketCategory.BUG_REPORT, label: 'Reporte de Bug' },
      { value: TicketCategory.FEATURE_REQUEST, label: 'Solicitud de Función' }
    ];
    
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }

  /**
   * Formatea tiempo en minutos a texto legible
   */
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  }

  /**
   * Navega de vuelta al dashboard
   */
  goBack(): void {
    this.router.navigate(['/admin/soporte']);
  }

  /**
   * Actualiza los datos del ticket
   */
  refreshTicket(): void {
    if (this.ticket) {
      this.loadTicketData(this.ticket.id);
      this.notificationService.showSuccess('Datos del ticket actualizados');
    }
  }
}
