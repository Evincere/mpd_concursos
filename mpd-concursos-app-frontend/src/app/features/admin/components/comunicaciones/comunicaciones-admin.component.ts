import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios
import {
  MassNotificationsService,
  MassNotificationRequest,
  NotificationTemplate
} from '../../../../core/services/admin/mass-notifications.service';
import { AdminUsersService, AdminUser } from '../../../../core/services/admin/admin-users.service';
import {
  NotificationType,
  AcknowledgementLevel,
  ACKNOWLEDGEMENT_LEVEL_LABELS
} from '../../../../core/models/notification.model';

// Componentes compartidos
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

// Interfaces para el historial
interface HistoryItem {
  id: string;
  batchId: string;
  subject: string;
  content: string;
  type: NotificationType;
  acknowledgementLevel: AcknowledgementLevel;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'SCHEDULED';
  sentAt: Date;
  sentBy: string;
  templateName?: string;
  scheduledTime?: Date;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  readCount?: number;
  acknowledgedCount?: number;
  recipientDetails: RecipientDetail[];
}

interface RecipientDetail {
  id: string;
  name: string;
  email: string;
  status: 'DELIVERED' | 'FAILED' | 'READ' | 'ACKNOWLEDGED';
  deliveredAt?: Date;
  readAt?: Date;
  acknowledgedAt?: Date;
  errorMessage?: string;
}

@Component({
  selector: 'app-comunicaciones-admin',
  templateUrl: './comunicaciones-admin.component.html',
  styleUrls: ['./comunicaciones-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomFormModule
  ]
})
export class ComunicacionesAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formulario principal
  comunicacionForm!: FormGroup;
  templateForm!: FormGroup;

  // Estado del componente
  isLoading = false;
  activeTab = 0;
  isSending = false;
  isSavingTemplate = false;

  // Pestañas disponibles
  tabs = [
    { id: 'mensajes', label: 'Enviar Mensajes', icon: 'paper-plane' },
    { id: 'plantillas', label: 'Gestión de Plantillas', icon: 'file-alt' },
    { id: 'historial', label: 'Historial de Envíos', icon: 'history' },
    { id: 'notificaciones', label: 'Notificaciones del Sistema', icon: 'bell' },
    { id: 'estadisticas', label: 'Estadísticas y Reportes', icon: 'chart-bar' }
  ];

  // Plantillas y destinatarios
  templates: NotificationTemplate[] = [];
  selectedTemplate: NotificationTemplate | null = null;
  showTemplateDialog = false;
  editingTemplate: NotificationTemplate | null = null;
  selectedUsers: AdminUser[] = [];
  selectedRoles: string[] = [];
  availableUsers: AdminUser[] = [];

  // Vista previa de plantillas
  showPreviewDialog = false;
  previewTemplate_: NotificationTemplate | null = null;

  // History management properties
  historyItems: HistoryItem[] = [];
  filteredHistory: HistoryItem[] = [];
  paginatedHistory: HistoryItem[] = [];
  expandedHistoryItem: string | null = null;
  showAllRecipients: { [key: string]: boolean } = {};
  isLoadingHistory = false;
  currentHistoryPage = 1;
  historyPageSize = 10;
  historyFilters = {
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Opciones para selects
  availableRoles = [
    { value: 'ROLE_USER', label: 'Usuarios Regulares' },
    { value: 'ROLE_ADMIN', label: 'Administradores' }
  ];
  
  notificationTypes = Object.values(NotificationType);
  acknowledgementLevels = Object.values(AcknowledgementLevel);

  // Variables para plantillas
  userVariables = [
    { placeholder: '{{usuario.nombre}}', description: 'Nombre completo del usuario', example: 'Juan Pérez' },
    { placeholder: '{{usuario.email}}', description: 'Correo electrónico del usuario', example: 'juan.perez@email.com' },
    { placeholder: '{{usuario.cedula}}', description: 'Número de cédula del usuario', example: '12345678' },
    { placeholder: '{{usuario.telefono}}', description: 'Teléfono del usuario', example: '+595 21 123456' }
  ];

  contestVariables = [
    { placeholder: '{{concurso.nombre}}', description: 'Nombre del concurso', example: 'Concurso Público 2024' },
    { placeholder: '{{concurso.codigo}}', description: 'Código del concurso', example: 'CP-2024-001' },
    { placeholder: '{{concurso.fechaInicio}}', description: 'Fecha de inicio del concurso', example: '15/03/2024' },
    { placeholder: '{{concurso.fechaFin}}', description: 'Fecha de fin del concurso', example: '30/04/2024' },
    { placeholder: '{{concurso.institucion}}', description: 'Institución del concurso', example: 'Ministerio de Hacienda' }
  ];

  systemVariables = [
    { placeholder: '{{sistema.fecha}}', description: 'Fecha actual del sistema', example: '15/03/2024' },
    { placeholder: '{{sistema.hora}}', description: 'Hora actual del sistema', example: '14:30' },
    { placeholder: '{{sistema.url}}', description: 'URL del sistema', example: 'https://concursos.gov.py' },
    { placeholder: '{{sistema.soporte}}', description: 'Email de soporte', example: 'soporte@concursos.gov.py' }
  ];

  // Configuración de destinatarios
  recipientMode: 'all' | 'roles' | 'users' = 'all';

  // Statistics properties
  isLoadingStatistics = false;
  selectedPeriod = '30days';
  selectedMetric = 'sent';
  customDateRange = {
    from: '',
    to: ''
  };

  statisticsPeriods = [
    { value: '7days', label: 'Últimos 7 días' },
    { value: '30days', label: 'Últimos 30 días' },
    { value: '90days', label: 'Últimos 3 meses' },
    { value: '1year', label: 'Último año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  overallStats = {
    totalSent: 15847,
    deliveryRate: 94.2,
    readRate: 78.5,
    acknowledgmentRate: 65.3,
    sentChange: 12.5,
    deliveryChange: 2.1,
    readChange: -3.2,
    ackChange: 8.7
  };

  trendData: any[] = [];
  typeStats: any[] = [];
  performanceByType: any[] = [];
  periodComparison: any[] = [];
  recommendations: any[] = [];

  bestPerformer = {
    type: 'Notificaciones de Concurso',
    rate: 89.2
  };

  optimalTime = {
    range: '10:00 - 12:00',
    readRate: 85.7
  };

  bestDay = {
    name: 'Martes',
    engagement: 82.4
  };

  averageResponseTime = {
    value: '2.3',
    unit: 'horas'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private massNotificationsService: MassNotificationsService,
    private adminUsersService: AdminUsersService,
    private notificationService: CustomNotificationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkActiveTab();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initializeForm(): void {
    this.comunicacionForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      type: [NotificationType.SYSTEM, [Validators.required]],
      acknowledgementLevel: [AcknowledgementLevel.NONE, [Validators.required]],
      scheduledTime: [null],
      recipientMode: ['all', [Validators.required]],
      selectedRoles: [[]],
      selectedUsers: [[]]
    });

    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      type: [NotificationType.SYSTEM, [Validators.required]],
      acknowledgementLevel: [AcknowledgementLevel.NONE, [Validators.required]]
    });

    // Escuchar cambios en el modo de destinatarios
    this.comunicacionForm.get('recipientMode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.recipientMode = mode;
        this.clearRecipientSelections();
      });
  }

  /**
   * Verifica si hay una pestaña activa especificada en la ruta
   */
  private checkActiveTab(): void {
    // Verificar parámetros de query para determinar la pestaña activa
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['tab']) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === params['tab']);
        if (tabIndex !== -1) {
          this.activeTab = tabIndex;
        }
      }
    });

    // Verificar data de la ruta (método principal)
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['activeTab']) {
        const tabIndex = this.getTabIndexFromId(data['activeTab']);
        if (tabIndex !== -1) {
          this.activeTab = tabIndex;
          console.log(`Pestaña activa establecida: ${data['activeTab']} (índice: ${tabIndex})`);
        }
      }
    });
  }

  /**
   * Mapea el ID de la pestaña al índice correspondiente
   */
  private getTabIndexFromId(tabId: string): number {
    const tabMapping: { [key: string]: number } = {
      'mensajes': 0,
      'plantillas': 1,
      'historial': 2,
      'notificaciones': 3,
      'estadisticas': 4
    };

    return tabMapping[tabId] !== undefined ? tabMapping[tabId] : -1;
  }

  /**
   * Carga los datos iniciales necesarios
   */
  private loadInitialData(): void {
    this.loadTemplates();
    this.loadAvailableUsers();
  }

  /**
   * Carga las plantillas disponibles
   */
  loadTemplates(): void {
    this.isLoading = true;
    this.massNotificationsService.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.templates = templates;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading templates:', error);
          this.notificationService.error('Error al cargar plantillas');
          this.isLoading = false;
        }
      });
  }

  /**
   * Carga los usuarios disponibles
   */
  loadAvailableUsers(): void {
    this.adminUsersService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // El servicio devuelve { users: AdminUser[], total: number }
          this.availableUsers = Array.isArray(response) ? response : response.users || [];
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.notificationService.error('Error al cargar usuarios');
        }
      });
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(index: number): void {
    if (index >= 0 && index < this.tabs.length) {
      this.activeTab = index;

      // Actualizar la URL para reflejar la pestaña activa
      const tabId = this.tabs[index].id;
      this.router.navigate(['/admin/comunicaciones', tabId], { replaceUrl: true });

      // Cargar datos específicos según la pestaña
      if (index === 2) { // Historial de Envíos
        this.loadHistoryData();
      } else if (index === 3) { // Notificaciones del Sistema
        this.loadNotificationsData();
      } else if (index === 4) { // Estadísticas y Reportes
        this.loadStatisticsData();
      }
    }
  }

  /**
   * Navega a una pestaña específica por ID
   */
  navigateToTab(tabId: string): void {
    const tabIndex = this.getTabIndexFromId(tabId);
    if (tabIndex !== -1) {
      this.setActiveTab(tabIndex);
    }
  }

  /**
   * Selecciona una plantilla
   */
  selectTemplate(template: NotificationTemplate): void {
    this.selectedTemplate = template;
    this.comunicacionForm.patchValue({
      subject: template.subject,
      content: template.content,
      type: template.type,
      acknowledgementLevel: template.acknowledgementLevel
    });
    this.notificationService.success(`Plantilla "${template.name}" seleccionada`);
  }

  /**
   * Limpia las selecciones de destinatarios
   */
  private clearRecipientSelections(): void {
    this.selectedUsers = [];
    this.selectedRoles = [];
    this.comunicacionForm.patchValue({
      selectedUsers: [],
      selectedRoles: []
    });
  }

  /**
   * Maneja el cambio en la selección de roles
   */
  onRoleSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.selectedRoles = selectedOptions;
    this.comunicacionForm.patchValue({ selectedRoles: selectedOptions });
  }

  /**
   * Maneja el cambio en la selección de usuarios
   */
  onUserSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.selectedUsers = this.availableUsers.filter(user => selectedOptions.includes(user.id));
    this.comunicacionForm.patchValue({ selectedUsers: selectedOptions });
  }

  /**
   * Valida si se puede enviar la notificación
   */
  canSendNotification(): boolean {
    const formValid = this.comunicacionForm.valid;
    let hasRecipients = false;

    switch (this.recipientMode) {
      case 'all':
        hasRecipients = true;
        break;
      case 'roles':
        hasRecipients = this.selectedRoles.length > 0;
        break;
      case 'users':
        hasRecipients = this.selectedUsers.length > 0;
        break;
    }

    return formValid && hasRecipients && !this.isSending;
  }

  /**
   * Obtiene el número total de destinatarios estimado
   */
  getTotalRecipients(): number {
    switch (this.recipientMode) {
      case 'all':
        return this.availableUsers.length;
      case 'roles':
        return this.selectedRoles.reduce((total, role) => {
          // Estimación basada en roles - en un sistema real esto vendría del backend
          if (role === 'ROLE_USER') return total + Math.floor(this.availableUsers.length * 0.8); // 80% usuarios regulares
          if (role === 'ROLE_ADMIN') return total + Math.floor(this.availableUsers.length * 0.2); // 20% administradores
          return total;
        }, 0);
      case 'users':
        return this.selectedUsers.length;
      default:
        return 0;
    }
  }

  /**
   * Envía la notificación
   */
  sendNotification(): void {
    if (!this.canSendNotification()) {
      this.notificationService.error('Por favor complete todos los campos requeridos y seleccione destinatarios');
      return;
    }

    // Confirmación antes del envío
    const totalRecipients = this.getTotalRecipients();
    if (!confirm(`¿Está seguro de enviar esta notificación a ${totalRecipients} destinatario(s)?`)) {
      return;
    }

    this.isSending = true;
    const formValue = this.comunicacionForm.value;

    const request: MassNotificationRequest = {
      subject: formValue.subject,
      content: formValue.content,
      type: formValue.type,
      acknowledgementLevel: formValue.acknowledgementLevel,
      scheduledTime: formValue.scheduledTime ? new Date(formValue.scheduledTime).toISOString() : undefined
    };

    // Configurar destinatarios según el modo seleccionado
    switch (this.recipientMode) {
      case 'all':
        request.recipientRoles = ['ROLE_USER'];
        break;
      case 'roles':
        request.recipientRoles = this.selectedRoles;
        break;
      case 'users':
        request.recipientIds = this.selectedUsers.map(user => user.id);
        break;
    }

    this.massNotificationsService.sendMassNotification(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSending = false;
          this.notificationService.success(
            `Notificación enviada correctamente a ${response.totalRecipients} destinatarios`
          );
          this.resetForm();
        },
        error: (error) => {
          console.error('Error sending notification:', error);
          this.isSending = false;
          this.notificationService.error('Error al enviar notificación. Por favor intente nuevamente.');
        }
      });
  }

  /**
   * Resetea el formulario
   */
  resetForm(): void {
    this.comunicacionForm.reset({
      type: NotificationType.SYSTEM,
      acknowledgementLevel: AcknowledgementLevel.NONE,
      recipientMode: 'all',
      selectedRoles: [],
      selectedUsers: []
    });
    this.selectedTemplate = null;
    this.selectedUsers = [];
    this.selectedRoles = [];
    this.recipientMode = 'all';
  }

  /**
   * Obtiene la etiqueta en español para el tipo de notificación
   */
  getNotificationTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      [NotificationType.INSCRIPTION]: 'Inscripción',
      [NotificationType.SYSTEM]: 'Sistema',
      [NotificationType.CONTEST]: 'Concurso',
      [NotificationType.DOCUMENT]: 'Documento',
      [NotificationType.EXAM]: 'Examen'
    };
    return labels[type] || type;
  }

  /**
   * Obtiene la etiqueta en español para el nivel de confirmación
   */
  getAcknowledgementLevelLabel(level: AcknowledgementLevel): string {
    return ACKNOWLEDGEMENT_LEVEL_LABELS[level] || level;
  }

  /**
   * Obtiene el icono para el tipo de notificación
   */
  getNotificationTypeIcon(type: NotificationType | string): string {
    // Iconos para NotificationType (enum)
    const notificationTypeIcons: Record<NotificationType, string> = {
      [NotificationType.INSCRIPTION]: 'user-plus',
      [NotificationType.SYSTEM]: 'cog',
      [NotificationType.CONTEST]: 'trophy',
      [NotificationType.DOCUMENT]: 'file-text',
      [NotificationType.EXAM]: 'graduation-cap'
    };

    // Iconos para tipos de string (para notificaciones del sistema)
    const stringTypeIcons: Record<string, string> = {
      'info': 'info-circle',
      'warning': 'exclamation-triangle',
      'error': 'exclamation-circle',
      'success': 'check-circle'
    };

    // Si es un NotificationType, usar los iconos correspondientes
    if (Object.values(NotificationType).includes(type as NotificationType)) {
      return notificationTypeIcons[type as NotificationType] || 'bell';
    }

    // Si es un string, usar los iconos de string
    return stringTypeIcons[type as string] || 'bell';
  }

  // ===== MÉTODOS DE GESTIÓN DE PLANTILLAS =====

  /**
   * Abre el diálogo para crear una nueva plantilla
   */
  openTemplateDialog(): void {
    this.editingTemplate = null;
    this.templateForm.reset({
      type: NotificationType.SYSTEM,
      acknowledgementLevel: AcknowledgementLevel.NONE
    });
    this.showTemplateDialog = true;
  }

  /**
   * Cierra el diálogo de plantillas
   */
  closeTemplateDialog(): void {
    this.showTemplateDialog = false;
    this.editingTemplate = null;
    this.templateForm.reset();
  }

  /**
   * Edita una plantilla existente
   */
  editTemplate(template: NotificationTemplate): void {
    this.editingTemplate = template;
    this.templateForm.patchValue({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      acknowledgementLevel: template.acknowledgementLevel
    });
    this.showTemplateDialog = true;
  }

  /**
   * Guarda la plantilla (crear o actualizar)
   */
  saveTemplate(): void {
    if (!this.templateForm.valid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    this.isSavingTemplate = true;
    const formValue = this.templateForm.value;

    const templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      name: formValue.name!,
      subject: formValue.subject!,
      content: formValue.content!,
      type: formValue.type!,
      acknowledgementLevel: formValue.acknowledgementLevel!
    };

    const operation = this.editingTemplate
      ? this.massNotificationsService.updateTemplate(this.editingTemplate.id, templateData)
      : this.massNotificationsService.createTemplate(templateData);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (template) => {
        this.isSavingTemplate = false;
        const action = this.editingTemplate ? 'actualizada' : 'creada';
        this.notificationService.success(`Plantilla ${action} correctamente`);
        this.closeTemplateDialog();
        this.loadTemplates(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error saving template:', error);
        this.isSavingTemplate = false;
        this.notificationService.error('Error al guardar la plantilla');
      }
    });
  }

  /**
   * Elimina una plantilla
   */
  deleteTemplate(template: NotificationTemplate): void {
    if (!confirm(`¿Está seguro de eliminar la plantilla "${template.name}"?`)) {
      return;
    }

    this.massNotificationsService.deleteTemplate(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Plantilla eliminada correctamente');
          this.loadTemplates(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          this.notificationService.error('Error al eliminar la plantilla');
        }
      });
  }

  /**
   * Previsualiza una plantilla
   */
  previewTemplate(template: NotificationTemplate): void {
    this.previewTemplate_ = template;
    this.showPreviewDialog = true;
  }

  /**
   * Cierra el diálogo de vista previa
   */
  closePreviewDialog(): void {
    this.showPreviewDialog = false;
    this.previewTemplate_ = null;
  }

  /**
   * Renderiza el contenido de la plantilla con variables de ejemplo
   */
  renderTemplatePreview(content: string): string {
    if (!content) return '';

    // Variables de ejemplo para la vista previa
    const sampleVariables: Record<string, string> = {
      'usuario.nombre': 'Juan Pérez',
      'usuario.email': 'juan.perez@email.com',
      'usuario.documento': '12.345.678',
      'concurso.nombre': 'Defensor Público Oficial',
      'concurso.codigo': 'DPO-2024-001',
      'concurso.fechaInicio': '15 de marzo de 2024',
      'concurso.fechaFin': '30 de abril de 2024',
      'concurso.institucion': 'Ministerio Público de la Defensa',
      'sistema.url': 'https://concursos.mpd.gov.ar',
      'sistema.soporte': 'soporte@mpd.gov.ar',
      'sistema.fecha': '25 de febrero de 2024'
    };

    let renderedContent = content;

    // Reemplazar variables con valores de ejemplo
    Object.entries(sampleVariables).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      renderedContent = renderedContent.replace(regex, value);
    });

    return renderedContent;
  }

  /**
   * TrackBy function para optimizar el renderizado de la lista
   */
  trackByTemplateId(index: number, template: NotificationTemplate): string {
    return template.id;
  }

  /**
   * Extrae las variables de una plantilla
   */
  getTemplateVariables(content: string): string[] {
    if (!content) return [];
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const variable = `{{${match[1]}}}`;
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    return variables;
  }

  /**
   * Obtiene las variables rápidas para el editor
   */
  getQuickVariables() {
    return [
      ...this.userVariables.slice(0, 3), // Primeras 3 variables de usuario
      ...this.systemVariables.slice(0, 2) // Primeras 2 variables de sistema
    ];
  }

  /**
   * Inserta una variable en el textarea del contenido
   */
  insertVariable(variable: string): void {
    const contentControl = this.templateForm.get('content');
    if (contentControl) {
      const currentValue = contentControl.value || '';
      const newValue = currentValue + variable;
      contentControl.setValue(newValue);
    }
  }

  /**
   * Obtiene el contenido de preview con variables de ejemplo
   */
  getPreviewContent(): string {
    const content = this.templateForm.get('content')?.value || '';
    let preview = content;

    // Reemplazar variables con ejemplos
    [...this.userVariables, ...this.contestVariables, ...this.systemVariables].forEach(variable => {
      const regex = new RegExp(variable.placeholder.replace(/[{}]/g, '\\$&'), 'g');
      preview = preview.replace(regex, variable.example);
    });

    return preview;
  }

  // ===== MÉTODOS DE GESTIÓN DE HISTORIAL =====

  /**
   * Inicializa los datos del historial
   */
  private initializeHistoryData(): void {
    // Datos mock para demostración
    this.historyItems = [
      {
        id: '1',
        batchId: 'BATCH-2024-001',
        subject: 'Nuevo concurso disponible - Ministerio de Hacienda',
        content: 'Estimado {{usuario.nombre}}, se ha publicado un nuevo concurso público en el {{concurso.nombre}}. La fecha límite de inscripción es el {{concurso.fechaFin}}.',
        type: NotificationType.CONTEST,
        acknowledgementLevel: AcknowledgementLevel.SIMPLE,
        status: 'COMPLETED',
        sentAt: new Date('2024-03-15T10:30:00'),
        sentBy: 'Admin Principal',
        templateName: 'Anuncio de nuevo concurso',
        totalRecipients: 1250,
        successCount: 1245,
        failureCount: 5,
        readCount: 980,
        acknowledgedCount: 850,
        recipientDetails: [
          {
            id: '1',
            name: 'Juan Pérez',
            email: 'juan.perez@email.com',
            status: 'ACKNOWLEDGED',
            deliveredAt: new Date('2024-03-15T10:31:15'),
            readAt: new Date('2024-03-15T11:45:30'),
            acknowledgedAt: new Date('2024-03-15T11:46:00')
          },
          {
            id: '2',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            status: 'READ',
            deliveredAt: new Date('2024-03-15T10:31:20'),
            readAt: new Date('2024-03-15T14:20:10')
          },
          {
            id: '3',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            status: 'DELIVERED',
            deliveredAt: new Date('2024-03-15T10:31:25')
          },
          {
            id: '4',
            name: 'Ana López',
            email: 'ana.lopez@email.com',
            status: 'FAILED',
            errorMessage: 'Dirección de correo inválida'
          }
        ]
      },
      {
        id: '2',
        batchId: 'BATCH-2024-002',
        subject: 'Recordatorio: Fecha límite de inscripción próxima',
        content: 'Estimado {{usuario.nombre}}, le recordamos que la fecha límite para inscribirse en el {{concurso.nombre}} es el {{concurso.fechaFin}}.',
        type: NotificationType.INSCRIPTION,
        acknowledgementLevel: AcknowledgementLevel.NONE,
        status: 'COMPLETED',
        sentAt: new Date('2024-03-14T16:00:00'),
        sentBy: 'Sistema Automático',
        templateName: 'Recordatorio de fecha límite',
        totalRecipients: 890,
        successCount: 885,
        failureCount: 5,
        readCount: 720,
        recipientDetails: [
          {
            id: '5',
            name: 'Pedro Martínez',
            email: 'pedro.martinez@email.com',
            status: 'READ',
            deliveredAt: new Date('2024-03-14T16:01:10'),
            readAt: new Date('2024-03-14T18:30:45')
          },
          {
            id: '6',
            name: 'Laura Fernández',
            email: 'laura.fernandez@email.com',
            status: 'DELIVERED',
            deliveredAt: new Date('2024-03-14T16:01:15')
          }
        ]
      },
      {
        id: '3',
        batchId: 'BATCH-2024-003',
        subject: 'Actualización del sistema - Mantenimiento programado',
        content: 'Estimado usuario, informamos que el sistema estará en mantenimiento el {{sistema.fecha}} desde las 02:00 hasta las 06:00 horas.',
        type: NotificationType.SYSTEM,
        acknowledgementLevel: AcknowledgementLevel.SIGNATURE_BASIC,
        status: 'PROCESSING',
        sentAt: new Date('2024-03-16T09:15:00'),
        sentBy: 'Admin Técnico',
        totalRecipients: 2100,
        successCount: 1850,
        failureCount: 12,
        readCount: 1200,
        acknowledgedCount: 950,
        recipientDetails: [
          {
            id: '7',
            name: 'Roberto Silva',
            email: 'roberto.silva@email.com',
            status: 'ACKNOWLEDGED',
            deliveredAt: new Date('2024-03-16T09:16:30'),
            readAt: new Date('2024-03-16T10:00:15'),
            acknowledgedAt: new Date('2024-03-16T10:01:00')
          }
        ]
      }
    ];

    this.applyHistoryFilters();
  }

  /**
   * Aplica los filtros al historial
   */
  applyHistoryFilters(): void {
    let filtered = [...this.historyItems];

    // Filtro de búsqueda
    if (this.historyFilters.search) {
      const searchTerm = this.historyFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.subject.toLowerCase().includes(searchTerm) ||
        item.batchId.toLowerCase().includes(searchTerm) ||
        item.sentBy.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de estado
    if (this.historyFilters.status) {
      filtered = filtered.filter(item => item.status === this.historyFilters.status);
    }

    // Filtro de tipo
    if (this.historyFilters.type) {
      filtered = filtered.filter(item => item.type === this.historyFilters.type);
    }

    // Filtro de fecha desde
    if (this.historyFilters.dateFrom) {
      const fromDate = new Date(this.historyFilters.dateFrom);
      filtered = filtered.filter(item => item.sentAt >= fromDate);
    }

    // Filtro de fecha hasta
    if (this.historyFilters.dateTo) {
      const toDate = new Date(this.historyFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(item => item.sentAt <= toDate);
    }

    this.filteredHistory = filtered;
    this.currentHistoryPage = 1;
    this.updatePaginatedHistory();
  }

  /**
   * Actualiza la paginación del historial
   */
  private updatePaginatedHistory(): void {
    const startIndex = (this.currentHistoryPage - 1) * this.historyPageSize;
    const endIndex = startIndex + this.historyPageSize;
    this.paginatedHistory = this.filteredHistory.slice(startIndex, endIndex);
  }

  /**
   * Limpia todos los filtros del historial
   */
  clearHistoryFilters(): void {
    this.historyFilters = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyHistoryFilters();
  }

  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return !!(
      this.historyFilters.search ||
      this.historyFilters.status ||
      this.historyFilters.type ||
      this.historyFilters.dateFrom ||
      this.historyFilters.dateTo
    );
  }

  /**
   * Expande o colapsa un elemento del historial
   */
  toggleHistoryItem(itemId: string): void {
    this.expandedHistoryItem = this.expandedHistoryItem === itemId ? null : itemId;
  }

  /**
   * Alterna la visualización de todos los destinatarios
   */
  toggleShowAllRecipients(itemId: string): void {
    this.showAllRecipients[itemId] = !this.showAllRecipients[itemId];
  }

  /**
   * TrackBy function para el historial
   */
  trackByHistoryId(index: number, item: HistoryItem): string {
    return item.id;
  }

  /**
   * Navega a una página específica del historial
   */
  goToHistoryPage(page: number): void {
    if (page >= 1 && page <= this.getTotalHistoryPages()) {
      this.currentHistoryPage = page;
      this.updatePaginatedHistory();
    }
  }

  /**
   * Obtiene el número total de páginas del historial
   */
  getTotalHistoryPages(): number {
    return Math.ceil(this.filteredHistory.length / this.historyPageSize);
  }

  /**
   * Obtiene los números de página para mostrar en la paginación
   */
  getHistoryPageNumbers(): number[] {
    const totalPages = this.getTotalHistoryPages();
    const currentPage = this.currentHistoryPage;
    const pages: number[] = [];

    // Mostrar máximo 5 páginas
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Ajustar si estamos cerca del final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Obtiene el porcentaje de éxito de un envío
   */
  getSuccessPercentage(item: HistoryItem): number {
    if (item.totalRecipients === 0) return 0;
    return Math.round((item.successCount / item.totalRecipients) * 100);
  }

  /**
   * Obtiene la etiqueta del estado
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'COMPLETED': 'Completado',
      'PROCESSING': 'Procesando',
      'FAILED': 'Fallido',
      'SCHEDULED': 'Programado'
    };
    return labels[status] || status;
  }

  /**
   * Obtiene el icono del estado
   */
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'COMPLETED': 'fa-check-circle',
      'PROCESSING': 'fa-spinner fa-spin',
      'FAILED': 'fa-times-circle',
      'SCHEDULED': 'fa-clock'
    };
    return icons[status] || 'fa-question-circle';
  }

  /**
   * Obtiene la etiqueta del estado del destinatario
   */
  getRecipientStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DELIVERED': 'Entregado',
      'FAILED': 'Fallido',
      'READ': 'Leído',
      'ACKNOWLEDGED': 'Confirmado'
    };
    return labels[status] || status;
  }

  /**
   * Obtiene el icono del estado del destinatario
   */
  getRecipientStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'DELIVERED': 'fa-check',
      'FAILED': 'fa-times',
      'READ': 'fa-eye',
      'ACKNOWLEDGED': 'fa-check-double'
    };
    return icons[status] || 'fa-question';
  }

  /**
   * Refresca el historial
   */
  refreshHistory(): void {
    this.isLoadingHistory = true;
    // Simular carga
    setTimeout(() => {
      this.initializeHistoryData();
      this.isLoadingHistory = false;
      this.notificationService.success('Historial actualizado');
    }, 1000);
  }

  /**
   * Exporta el historial
   */
  exportHistory(): void {
    this.notificationService.info('Preparando exportación del historial...');
    // Aquí iría la lógica de exportación real
    setTimeout(() => {
      this.notificationService.success('Historial exportado correctamente');
    }, 2000);
  }

  /**
   * Ve los detalles completos de un envío
   */
  viewFullDetails(item: HistoryItem): void {
    this.notificationService.info(`Mostrando detalles completos del envío ${item.batchId}`);
    // Aquí se abriría un modal o navegaría a una página de detalles
  }

  /**
   * Descarga el reporte de un envío específico
   */
  downloadReport(item: HistoryItem): void {
    this.notificationService.info(`Descargando reporte del envío ${item.batchId}...`);
    // Aquí iría la lógica de descarga del reporte
  }

  /**
   * Reintenta el envío a destinatarios fallidos
   */
  retryFailedRecipients(item: HistoryItem): void {
    if (confirm(`¿Está seguro de reintentar el envío a ${item.failureCount} destinatarios fallidos?`)) {
      this.notificationService.info(`Reintentando envío a ${item.failureCount} destinatarios...`);
      // Aquí iría la lógica de reintento
    }
  }

  /**
   * Verifica si se puede duplicar un mensaje
   */
  canDuplicateMessage(item: HistoryItem): boolean {
    return item.status === 'COMPLETED' || item.status === 'FAILED';
  }

  /**
   * Duplica un mensaje para reenvío
   */
  duplicateMessage(item: HistoryItem): void {
    // Cambiar a la pestaña de envío de mensajes
    this.setActiveTab(0);

    // Llenar el formulario con los datos del mensaje
    this.comunicacionForm.patchValue({
      subject: item.subject,
      content: item.content,
      type: item.type,
      acknowledgementLevel: item.acknowledgementLevel
    });

    this.notificationService.success('Mensaje duplicado. Puede modificarlo y enviarlo nuevamente.');
  }

  /**
   * Inicializa los datos del historial cuando se carga la pestaña
   */
  private loadHistoryData(): void {
    if (this.historyItems.length === 0) {
      this.initializeHistoryData();
    }
  }

  // ===== MÉTODOS DE ESTADÍSTICAS Y REPORTES =====

  /**
   * Carga los datos de estadísticas
   */
  private loadStatisticsData(): void {
    if (this.trendData.length === 0) {
      this.initializeStatisticsData();
    }
  }

  /**
   * Inicializa los datos mock de estadísticas
   */
  private initializeStatisticsData(): void {
    this.generateTrendData();
    this.generateTypeStats();
    this.generatePerformanceByType();
    this.generatePeriodComparison();
    this.generateRecommendations();
  }

  /**
   * Genera datos de tendencias temporales
   */
  private generateTrendData(): void {
    const days = 30;
    const today = new Date();
    this.trendData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseValue = 450 + Math.random() * 200;
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;

      this.trendData.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(baseValue * weekendFactor),
        sent: Math.floor(baseValue * weekendFactor),
        delivered: Math.floor(baseValue * weekendFactor * 0.94),
        read: Math.floor(baseValue * weekendFactor * 0.78),
        acknowledged: Math.floor(baseValue * weekendFactor * 0.65)
      });
    }
  }

  /**
   * Genera estadísticas por tipo de notificación
   */
  private generateTypeStats(): void {
    const types = [
      { type: NotificationType.CONTEST, count: 5847, color: '#4CAF50' },
      { type: NotificationType.SYSTEM, count: 4235, color: '#2196F3' },
      { type: NotificationType.INSCRIPTION, count: 3421, color: '#FF9800' },
      { type: NotificationType.DOCUMENT, count: 1876, color: '#9C27B0' },
      { type: NotificationType.EXAM, count: 468, color: '#F44336' }
    ];

    const total = types.reduce((sum, type) => sum + type.count, 0);

    this.typeStats = types.map(type => ({
      ...type,
      percentage: Math.round((type.count / total) * 100)
    }));
  }

  /**
   * Genera datos de rendimiento por tipo
   */
  private generatePerformanceByType(): void {
    this.performanceByType = [
      {
        type: NotificationType.CONTEST,
        totalSent: 5847,
        deliveryRate: 96.8,
        readRate: 89.2,
        acknowledgmentRate: 78.5,
        avgResponseTime: '1.8 horas',
        trend: 'up',
        trendValue: 8.3
      },
      {
        type: NotificationType.SYSTEM,
        totalSent: 4235,
        deliveryRate: 94.1,
        readRate: 72.6,
        acknowledgmentRate: 45.2,
        avgResponseTime: '3.2 horas',
        trend: 'down',
        trendValue: -2.1
      },
      {
        type: NotificationType.INSCRIPTION,
        totalSent: 3421,
        deliveryRate: 97.2,
        readRate: 85.7,
        acknowledgmentRate: 82.1,
        avgResponseTime: '1.2 horas',
        trend: 'up',
        trendValue: 12.4
      },
      {
        type: NotificationType.DOCUMENT,
        totalSent: 1876,
        deliveryRate: 91.5,
        readRate: 68.9,
        acknowledgmentRate: 58.7,
        avgResponseTime: '4.1 horas',
        trend: 'stable',
        trendValue: 0.8
      },
      {
        type: NotificationType.EXAM,
        totalSent: 468,
        deliveryRate: 98.1,
        readRate: 92.3,
        acknowledgmentRate: 87.6,
        avgResponseTime: '0.9 horas',
        trend: 'up',
        trendValue: 15.7
      }
    ];
  }

  /**
   * Genera datos de comparación de períodos
   */
  private generatePeriodComparison(): void {
    this.periodComparison = [
      {
        label: 'Enviados',
        current: { value: '15,847', percentage: 85 },
        previous: { value: '14,123', percentage: 76 },
        change: 12.2
      },
      {
        label: 'Entregados',
        current: { value: '14,932', percentage: 80 },
        previous: { value: '13,298', percentage: 71 },
        change: 12.3
      },
      {
        label: 'Leídos',
        current: { value: '12,440', percentage: 67 },
        previous: { value: '11,876', percentage: 64 },
        change: 4.7
      },
      {
        label: 'Confirmados',
        current: { value: '10,348', percentage: 56 },
        previous: { value: '9,234', percentage: 49 },
        change: 12.1
      }
    ];
  }

  /**
   * Genera recomendaciones de mejora
   */
  private generateRecommendations(): void {
    this.recommendations = [
      {
        title: 'Optimizar horario de envío',
        description: 'Los envíos entre 10:00-12:00 tienen 15% más tasa de lectura. Considere programar envíos importantes en este horario.',
        impact: '+15% tasa de lectura',
        priority: 'high',
        icon: 'fa-clock'
      },
      {
        title: 'Mejorar asuntos de notificaciones de sistema',
        description: 'Las notificaciones de sistema tienen baja tasa de lectura (72.6%). Revise los asuntos para hacerlos más atractivos.',
        impact: '+10% engagement',
        priority: 'medium',
        icon: 'fa-edit'
      },
      {
        title: 'Implementar recordatorios automáticos',
        description: 'Para notificaciones que requieren confirmación, enviar recordatorios después de 24 horas puede mejorar la tasa de respuesta.',
        impact: '+20% confirmaciones',
        priority: 'high',
        icon: 'fa-bell'
      },
      {
        title: 'Segmentar audiencia por tipo de usuario',
        description: 'Personalizar el contenido según el perfil del usuario puede aumentar significativamente el engagement.',
        impact: '+25% efectividad',
        priority: 'medium',
        icon: 'fa-users'
      }
    ];
  }

  /**
   * Actualiza las estadísticas
   */
  refreshStatistics(): void {
    this.isLoadingStatistics = true;
    setTimeout(() => {
      this.initializeStatisticsData();
      this.isLoadingStatistics = false;
      this.notificationService.success('Estadísticas actualizadas');
    }, 1500);
  }

  /**
   * Establece el período de estadísticas
   */
  setStatisticsPeriod(period: string): void {
    this.selectedPeriod = period;
    this.updateStatistics();
  }

  /**
   * Actualiza las estadísticas según el período seleccionado
   */
  updateStatistics(): void {
    this.isLoadingStatistics = true;
    setTimeout(() => {
      this.generateTrendData();
      this.isLoadingStatistics = false;
    }, 800);
  }

  /**
   * Actualiza el gráfico de tendencias
   */
  updateTrendChart(): void {
    // Actualizar los datos según la métrica seleccionada
    this.trendData.forEach(point => {
      switch (this.selectedMetric) {
        case 'sent':
          point.value = point.sent;
          break;
        case 'delivered':
          point.value = point.delivered;
          break;
        case 'read':
          point.value = point.read;
          break;
        case 'acknowledged':
          point.value = point.acknowledged;
          break;
      }
    });
  }

  /**
   * Exporta las estadísticas
   */
  exportStatistics(format: 'pdf' | 'excel'): void {
    this.notificationService.info(`Preparando exportación en formato ${format.toUpperCase()}...`);
    setTimeout(() => {
      this.notificationService.success(`Estadísticas exportadas en ${format.toUpperCase()}`);
    }, 2000);
  }

  /**
   * Aplica una recomendación
   */
  applyRecommendation(recommendation: any): void {
    this.notificationService.info(`Aplicando recomendación: ${recommendation.title}`);
    // Aquí iría la lógica específica para cada recomendación
  }

  // ===== MÉTODOS AUXILIARES PARA GRÁFICOS =====

  /**
   * Obtiene el valor máximo de los datos de tendencia
   */
  getMaxValue(data: any[]): number {
    return Math.max(...data.map(point => point.value));
  }

  /**
   * Genera los puntos para la línea de tendencia SVG
   */
  getTrendLinePoints(): string {
    if (!this.trendData.length) return '';

    const maxValue = this.getMaxValue(this.trendData);
    return this.trendData.map((point, index) => {
      const x = (index / (this.trendData.length - 1)) * 100;
      const y = 100 - ((point.value / maxValue) * 80);
      return `${x},${y}`;
    }).join(' ');
  }

  /**
   * Obtiene las marcas del eje Y
   */
  getYAxisTicks(): number[] {
    if (!this.trendData.length) return [];

    const maxValue = this.getMaxValue(this.trendData);
    const step = Math.ceil(maxValue / 5);
    return Array.from({ length: 6 }, (_, i) => i * step);
  }

  /**
   * Formatea la fecha para el eje X
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  /**
   * Obtiene el color para un tipo de notificación
   */
  getTypeColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      [NotificationType.CONTEST]: '#4CAF50',
      [NotificationType.SYSTEM]: '#2196F3',
      [NotificationType.INSCRIPTION]: '#FF9800',
      [NotificationType.DOCUMENT]: '#9C27B0',
      [NotificationType.EXAM]: '#F44336'
    };
    return colors[type] || '#757575';
  }

  /**
   * Obtiene el ángulo de inicio para una porción del gráfico circular
   */
  getSliceStartAngle(index: number): number {
    let angle = 0;
    for (let i = 0; i < index; i++) {
      angle += (this.typeStats[i].percentage / 100) * 360;
    }
    return angle;
  }

  /**
   * Obtiene el ángulo de fin para una porción del gráfico circular
   */
  getSliceEndAngle(index: number): number {
    return this.getSliceStartAngle(index) + (this.typeStats[index].percentage / 100) * 360;
  }

  /**
   * Obtiene el total de notificaciones
   */
  getTotalNotifications(): number {
    return this.typeStats.reduce((total, type) => total + type.count, 0);
  }

  /**
   * Obtiene la clase CSS para el cambio de métrica
   */
  getChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Obtiene el icono para el cambio de métrica
   */
  getChangeIcon(change: number): string {
    if (change > 0) return 'fa-arrow-up';
    if (change < 0) return 'fa-arrow-down';
    return 'fa-minus';
  }

  /**
   * Obtiene la clase CSS para la tendencia
   */
  getTrendClass(trend: string): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      case 'stable': return 'trend-stable';
      default: return 'trend-neutral';
    }
  }

  /**
   * Obtiene el icono para la tendencia
   */
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'fa-arrow-up';
      case 'down': return 'fa-arrow-down';
      case 'stable': return 'fa-minus';
      default: return 'fa-question';
    }
  }

  // ===================================================================
  // NOTIFICATIONS TAB FUNCTIONALITY
  // ===================================================================

  // Propiedades para la pestaña de notificaciones
  systemNotifications: any[] = [];
  isLoadingNotifications = false;
  notificationFilters = {
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  };
  filteredNotifications: any[] = [];
  paginatedNotifications: any[] = [];
  currentNotificationPage = 1;
  notificationPageSize = 10;

  /**
   * Carga los datos de notificaciones del sistema
   */
  loadNotificationsData(): void {
    this.isLoadingNotifications = true;

    // Simular datos de notificaciones del sistema
    setTimeout(() => {
      this.systemNotifications = [
        {
          id: '1',
          title: 'Nueva inscripción pendiente',
          message: 'Juan Pérez ha completado su inscripción y está pendiente de revisión.',
          type: 'info',
          status: 'unread',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          link: '/admin/inscripciones/pendientes',
          user: 'Juan Pérez',
          module: 'Inscripciones'
        },
        {
          id: '2',
          title: 'Documento rechazado',
          message: 'El documento de María García ha sido rechazado por no cumplir los requisitos.',
          type: 'warning',
          status: 'read',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          link: '/admin/documentos',
          user: 'María García',
          module: 'Documentos'
        },
        {
          id: '3',
          title: 'Error en el sistema',
          message: 'Se ha detectado un error en el módulo de reportes. Requiere atención inmediata.',
          type: 'error',
          status: 'unread',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
          link: '/admin/sistema/monitoreo',
          user: 'Sistema',
          module: 'Sistema'
        },
        {
          id: '4',
          title: 'Concurso publicado exitosamente',
          message: 'El concurso "Analista de Sistemas 2024" ha sido publicado correctamente.',
          type: 'success',
          status: 'read',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 horas atrás
          link: '/admin/concursos',
          user: 'Admin',
          module: 'Concursos'
        },
        {
          id: '5',
          title: 'Backup completado',
          message: 'La copia de seguridad programada se ha completado exitosamente.',
          type: 'success',
          status: 'read',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
          link: '/admin/sistema/backups',
          user: 'Sistema',
          module: 'Sistema'
        }
      ];

      this.filteredNotifications = [...this.systemNotifications];
      this.applyNotificationFilters();
      this.isLoadingNotifications = false;
    }, 1000);
  }

  /**
   * Aplica filtros a las notificaciones
   */
  applyNotificationFilters(): void {
    let filtered = [...this.systemNotifications];

    // Filtro de búsqueda
    if (this.notificationFilters.search) {
      const search = this.notificationFilters.search.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(search) ||
        notification.message.toLowerCase().includes(search) ||
        notification.user.toLowerCase().includes(search) ||
        notification.module.toLowerCase().includes(search)
      );
    }

    // Filtro por tipo
    if (this.notificationFilters.type) {
      filtered = filtered.filter(notification => notification.type === this.notificationFilters.type);
    }

    // Filtro por estado
    if (this.notificationFilters.status) {
      filtered = filtered.filter(notification => notification.status === this.notificationFilters.status);
    }

    // Filtros de fecha
    if (this.notificationFilters.dateFrom) {
      const fromDate = new Date(this.notificationFilters.dateFrom);
      filtered = filtered.filter(notification => notification.timestamp >= fromDate);
    }

    if (this.notificationFilters.dateTo) {
      const toDate = new Date(this.notificationFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(notification => notification.timestamp <= toDate);
    }

    this.filteredNotifications = filtered;
    this.updateNotificationPagination();
  }

  /**
   * Actualiza la paginación de notificaciones
   */
  updateNotificationPagination(): void {
    const startIndex = (this.currentNotificationPage - 1) * this.notificationPageSize;
    const endIndex = startIndex + this.notificationPageSize;
    this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  /**
   * Limpia los filtros de notificaciones
   */
  clearNotificationFilters(): void {
    this.notificationFilters = {
      search: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyNotificationFilters();
  }

  /**
   * Marca una notificación como leída
   */
  markNotificationAsRead(notification: any): void {
    notification.status = 'read';
    this.notificationService.success('Notificación marcada como leída');
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllNotificationsAsRead(): void {
    this.systemNotifications.forEach(notification => {
      notification.status = 'read';
    });
    this.notificationService.success('Todas las notificaciones marcadas como leídas');
  }

  /**
   * Elimina una notificación
   */
  deleteNotification(notification: any): void {
    if (confirm('¿Está seguro de eliminar esta notificación?')) {
      const index = this.systemNotifications.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        this.systemNotifications.splice(index, 1);
        this.applyNotificationFilters();
        this.notificationService.success('Notificación eliminada');
      }
    }
  }



  /**
   * Obtiene el número total de páginas de notificaciones
   */
  getTotalNotificationPages(): number {
    return Math.ceil(this.filteredNotifications.length / this.notificationPageSize);
  }

  /**
   * Cambia la página de notificaciones
   */
  changeNotificationPage(page: number): void {
    if (page >= 1 && page <= this.getTotalNotificationPages()) {
      this.currentNotificationPage = page;
      this.updateNotificationPagination();
    }
  }

  // Exponer Math para usar en el template
  Math = Math;
}
