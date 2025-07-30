import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewEncapsulation, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { ValidationErrorComponent } from '@shared/components/validation/validation-error/validation-error.component';
import { InscriptionStatusBadgeComponent } from '@shared/components/inscription-status-badge/inscription-status-badge.component';

// Pipes
import { TimeAgoPipe, FormatDatePipe } from '@shared/pipes/time-ago.pipe';

// Interfaces y modelos
import { AdminInscription, InscriptionFilter } from '@core/services/admin/admin-inscriptions.service';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';

// Servicios
import { NotificationService } from '@shared/services/notification.service';
import { InscriptionActionsService, InscriptionAction } from '../../../../services/inscription-actions.service';

@Component({
  selector: 'app-custom-inscriptions-table',
  standalone: true,
  templateUrl: './custom-inscriptions-table.component.html',
  styleUrls: ['./custom-inscriptions-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomTableComponent,
    CustomTableColumnComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    ValidationErrorComponent,
    InscriptionStatusBadgeComponent,
    TimeAgoPipe,
    FormatDatePipe
  ]
})
export class CustomInscriptionsTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() inscriptions: AdminInscription[] = [];
  @Input() isLoading = false;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() contests: { value: number, label: string }[] = [];

  @Output() viewInscription = new EventEmitter<AdminInscription>();
  @Output() approveInscription = new EventEmitter<AdminInscription>();
  @Output() rejectInscription = new EventEmitter<AdminInscription>();
  @Output() filterChange = new EventEmitter<InscriptionFilter>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number, pageSize: number }>();
  @Output() sortChange = new EventEmitter<{ property: string, direction: 'asc' | 'desc' }>();
  @Output() actionExecuted = new EventEmitter<{ actionId: string, inscription: AdminInscription }>();

  // Propiedades para manejo de acciones
  activeMenuId: string | null = null;
  maxVisibleActions = 3;
  private inscriptionActionsService = new InscriptionActionsService();

  // Referencia al componente de tabla
  @ViewChild('customTable') customTable!: CustomTableComponent;

  // Columnas de la tabla usando la nueva interface
  columns = [
    {
      property: 'id',
      header: 'ID',
      sortable: true,
      width: '100px'
    },
    {
      property: 'userFullName',
      header: 'Postulante',
      sortable: true,
      width: '250px'
    },
    {
      property: 'contestTitle',
      header: 'Concurso',
      sortable: true,
      width: '300px'
    },
    {
      property: 'documentsCount',
      header: 'Documentos',
      sortable: true,
      width: '140px'
    },
    {
      property: 'state',
      header: 'Estado',
      sortable: true,
      width: '140px'
    },
    {
      property: 'updatedAt',
      header: 'Actualización',
      sortable: true,
      width: '160px'
    }
  ];

  // Opciones para filtros
  statusOptions = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: InscripcionState.ACTIVE, label: 'Activa' },
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.COMPLETED_WITH_DOCS, label: 'Completada con Documentos' },
    { value: InscripcionState.COMPLETED_PENDING_DOCS, label: 'Completada - Documentos Pendientes' },
    { value: InscripcionState.FROZEN, label: 'Congelada' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' },
    { value: InscripcionState.CANCELLED, label: 'Cancelada' },
    { value: InscripcionState.ACTIVE, label: 'Activa' }  // REFACTORING: Estado estándar
  ];

  documentStatusOptions = [
    { value: 'ALL', label: 'Todos los documentos' },
    { value: 'PENDING', label: 'Documentos pendientes' },
    { value: 'APPROVED', label: 'Documentos aprobados' },
    { value: 'REJECTED', label: 'Documentos rechazados' }
  ];

  // Formulario de filtros
  filterForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['ALL'],
      contestId: [''],
      documentStatus: ['ALL'],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    // Suscribirse a cambios en el formulario
    this.filterForm.valueChanges.subscribe(() => {
      this.emitFilterChange();
    });

    // Exponer métodos globalmente para el HTML renderizado
    (window as any).handleInscriptionAction = this.handleInscriptionAction.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Actualizar datos cuando cambian las entradas
    if (changes['contests'] && !changes['contests'].firstChange) {
      // Actualizar opciones de concursos si es necesario
    }

    // Detectar cambios cuando los datos cambian
    if (changes['inscriptions'] || changes['isLoading']) {
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    // Detectar cambios después de la inicialización
    this.cdr.detectChanges();
  }

  // Emitir cambios en filtros
  emitFilterChange(): void {
    const formValues = this.filterForm.value;

    const filter: InscriptionFilter = {
      search: formValues.search,
      status: formValues.status !== 'ALL' ? formValues.status : undefined,
      contestId: formValues.contestId || undefined,
      documentStatus: formValues.documentStatus !== 'ALL' ? formValues.documentStatus : undefined,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      page: this.pageIndex + 1,
      size: this.pageSize
    };

    this.filterChange.emit(filter);
  }

  // Manejar cambio de página
  onPageChange(event: { pageIndex: number, pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.pageChange.emit(event);
    this.emitFilterChange();
  }

  // Manejar cambio de ordenamiento
  onSortChange(event: { property: string, direction: 'asc' | 'desc' | '' }): void {
    if (event.direction) {
      this.sortChange.emit({
        property: event.property,
        direction: event.direction as 'asc' | 'desc'
      });
    }
  }

  // Manejar clic en fila
  onRowClick(inscription: AdminInscription): void {
    this.viewInscription.emit(inscription);
  }

  // Manejar clic en botón de aprobar
  onApproveClick(inscription: AdminInscription, event: Event): void {
    event.stopPropagation(); // Evitar que se propague al clic de fila
    this.approveInscription.emit(inscription);
  }

  // Manejar clic en botón de rechazar
  onRejectClick(inscription: AdminInscription, event: Event): void {
    event.stopPropagation(); // Evitar que se propague al clic de fila
    this.rejectInscription.emit(inscription);
  }

  // Obtener acciones para una fila específica
  getRowActions(row: AdminInscription): any[] {
    const actions = this.getAvailableActions(row.state);
    return actions.slice(0, this.maxVisibleActions).map(action => ({
      icon: this.getActionIcon(action.icon).replace('fas fa-', ''),
      label: action.label,
      action: action.id,
      color: action.color,
      tooltip: action.tooltip
    }));
  }

  // Manejar acciones específicas
  onViewInscription(inscription: AdminInscription): void {
    this.viewInscription.emit(inscription);
  }

  onReplaceDocument(inscription: AdminInscription): void {
    this.actionExecuted.emit({ actionId: 'replace', inscription });
  }

  onDeleteDocument(inscription: AdminInscription): void {
    this.actionExecuted.emit({ actionId: 'delete', inscription });
  }

  /**
   * Maneja las acciones de inscripción desde HTML renderizado
   */
  handleInscriptionAction(actionId: string, inscriptionId: string): void {
    console.log('Acción ejecutada:', actionId, 'para inscripción:', inscriptionId);

    const inscription = this.inscriptions.find(i => i.id === inscriptionId);
    if (!inscription) {
      console.error('Inscripción no encontrada:', inscriptionId);
      return;
    }

    // Ejecutar la acción específica
    switch (actionId) {
      case 'view':
        this.viewInscription.emit(inscription);
        break;
      case 'approve':
        this.approveInscription.emit(inscription);
        break;
      case 'reject':
        this.rejectInscription.emit(inscription);
        break;
      case 'documents':
        this.actionExecuted.emit({ actionId: 'documents', inscription });
        break;
      case 'history':
        this.actionExecuted.emit({ actionId: 'history', inscription });
        break;
      default:
        this.actionExecuted.emit({ actionId, inscription });
        break;
    }
  }

  // Limpiar filtros
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'ALL',
      contestId: '',
      documentStatus: 'ALL',
      startDate: null,
      endDate: null
    });

    this.emitFilterChange();
  }

  // Obtener clase CSS según estado
  getStatusClass(status: InscripcionState): string {
    switch (status) {
      case InscripcionState.PENDING:
        return 'status-pending';
      case InscripcionState.APPROVED:
        return 'status-approved';
      case InscripcionState.REJECTED:
        return 'status-rejected';
      case InscripcionState.CANCELLED:
        return 'status-cancelled';
      case InscripcionState.ACTIVE:  // REFACTORING: Estado estándar
        return 'status-in-process';
      default:
        return '';
    }
  }

  // Obtener etiqueta según estado usando la nueva lógica unificada
  getStatusLabel(status: InscripcionState): string {
    return InscripcionStateUtils.getStateLabel(status);
  }

  // Formatear fecha
  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // ===== MÉTODOS PARA MANEJO DE ACCIONES =====

  /**
   * Obtiene las acciones disponibles para un estado específico
   */
  getAvailableActions(state: string): InscriptionAction[] {
    return this.inscriptionActionsService.getAvailableActions(state, 'admin');
  }

  /**
   * Convierte el icono de Font Awesome a formato apropiado
   */
  getActionIcon(icon: string): string {
    // Si ya tiene el prefijo 'fas fa-', lo devolvemos tal como está
    if (icon.startsWith('fas fa-')) {
      return icon;
    }
    // Si no, agregamos el prefijo
    return `fas fa-${icon}`;
  }

  /**
   * Maneja el click en una acción específica
   */
  onActionClick(actionId: string, inscription: AdminInscription, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();

    // Obtener la acción para verificar si requiere confirmación
    const action = this.inscriptionActionsService.getAction(actionId, inscription.state, 'admin');

    if (action?.requiresConfirmation) {
      const confirmed = confirm(action.confirmationMessage || '¿Está seguro de realizar esta acción?');
      if (!confirmed) {
        return;
      }
    }

    // Ejecutar la acción específica
    switch (actionId) {
      case 'view':
        this.viewInscription.emit(inscription);
        break;
      case 'approve':
        this.approveInscription.emit(inscription);
        break;
      case 'reject':
        this.rejectInscription.emit(inscription);
        break;
      default:
        // Para otras acciones, emitir el evento genérico
        this.actionExecuted.emit({ actionId, inscription });
        break;
    }
  }

  /**
   * Alterna la visibilidad del menú de acciones
   */
  toggleActionsMenu(inscriptionId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.activeMenuId = this.activeMenuId === inscriptionId ? null : inscriptionId;

    // Actualizar visibilidad del menú en el DOM
    const menu = document.getElementById(`menu-${inscriptionId}`);
    if (menu) {
      menu.style.display = this.activeMenuId === inscriptionId ? 'block' : 'none';
    }
  }

  /**
   * Maneja clicks de acciones desde HTML renderizado
   */
  handleActionClick(actionId: string, inscriptionId: string): void {
    const inscription = this.inscriptions.find(i => i.id === inscriptionId);
    if (!inscription) return;

    // Obtener la acción para verificar si requiere confirmación
    const action = this.inscriptionActionsService.getAction(actionId, inscription.state, 'admin');

    if (action?.requiresConfirmation) {
      const confirmed = confirm(action.confirmationMessage || '¿Está seguro de realizar esta acción?');
      if (!confirmed) {
        return;
      }
    }

    // Cerrar menú si está abierto
    this.closeActionsMenu();

    // Ejecutar la acción específica
    switch (actionId) {
      case 'view':
        this.viewInscription.emit(inscription);
        break;
      case 'approve':
        this.approveInscription.emit(inscription);
        break;
      case 'reject':
        this.rejectInscription.emit(inscription);
        break;
      default:
        // Para otras acciones, emitir el evento genérico
        this.actionExecuted.emit({ actionId, inscription });
        break;
    }
  }

  /**
   * Cierra el menú de acciones
   */
  closeActionsMenu(): void {
    this.activeMenuId = null;
  }



  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Obtiene la clase CSS para el estado
   */
  getStateClass(state: string): string {
    const stateMap: { [key: string]: string } = {
      'ACTIVE': 'active',
      'PENDING': 'pending',
      'COMPLETED_WITH_DOCS': 'completed-docs',
      'COMPLETED_PENDING_DOCS': 'completed-pending',
      'FROZEN': 'frozen',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'CANCELLED': 'cancelled'
    };
    return stateMap[state] || 'unknown';
  }

  /**
   * Obtiene el texto para el estado
   */
  getStateText(state: string): string {
    const stateMap: { [key: string]: string } = {
      'ACTIVE': 'En Proceso',
      'PENDING': 'Pendiente',
      'COMPLETED_WITH_DOCS': 'Completa con Docs',
      'COMPLETED_PENDING_DOCS': 'Docs Pendientes',
      'FROZEN': 'Congelada',
      'APPROVED': 'Aprobada',
      'REJECTED': 'Rechazada',
      'CANCELLED': 'Cancelada'
    };
    return stateMap[state] || state;
  }

  /**
   * Obtiene el ícono para el estado
   */
  getStateIcon(state: string): string {
    const stateMap: { [key: string]: string } = {
      'ACTIVE': 'fas fa-edit',
      'PENDING': 'fas fa-clock',
      'COMPLETED_WITH_DOCS': 'fas fa-check-circle',
      'COMPLETED_PENDING_DOCS': 'fas fa-exclamation-triangle',
      'FROZEN': 'fas fa-snowflake',
      'APPROVED': 'fas fa-thumbs-up',
      'REJECTED': 'fas fa-thumbs-down',
      'CANCELLED': 'fas fa-times-circle'
    };
    return stateMap[state] || 'fas fa-question-circle';
  }

  /**
   * Obtiene el tooltip para el estado
   */
  getStateTooltip(state: string): string {
    const stateMap: { [key: string]: string } = {
      'ACTIVE': 'Inscripción en proceso',
      'PENDING': 'Pendiente de revisión',
      'COMPLETED_WITH_DOCS': 'Completa con documentos',
      'COMPLETED_PENDING_DOCS': 'Documentos pendientes',
      'FROZEN': 'Inscripción congelada',
      'APPROVED': 'Inscripción aprobada',
      'REJECTED': 'Inscripción rechazada',
      'CANCELLED': 'Inscripción cancelada'
    };
    return stateMap[state] || `Estado: ${state}`;
  }

  /**
   * Calcula tiempo transcurrido de manera amigable
   */
  getTimeAgo(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays < 30) return `hace ${diffDays} días`;

    return `hace ${Math.floor(diffDays / 30)} meses`;
  }

  /**
   * Formatea fecha completa
   */
  getFullDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea fecha corta
   */
  getShortDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-AR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }





  // ===== MÉTODOS AUXILIARES =====

  /**
   * Obtiene información del estado para renderizado
   */
  private getStateInfo(state: string): { class: string, text: string, icon: string, tooltip: string } {
    const stateMap: { [key: string]: { class: string, text: string, icon: string, tooltip: string } } = {
      'ACTIVE': { class: 'active', text: 'En Proceso', icon: 'fas fa-edit', tooltip: 'Inscripción en proceso' },
      'PENDING': { class: 'pending', text: 'Pendiente', icon: 'fas fa-clock', tooltip: 'Pendiente de revisión' },
      'COMPLETED_WITH_DOCS': { class: 'completed-docs', text: 'Completa con Docs', icon: 'fas fa-check-circle', tooltip: 'Completa con documentos' },
      'COMPLETED_PENDING_DOCS': { class: 'completed-pending', text: 'Docs Pendientes', icon: 'fas fa-exclamation-triangle', tooltip: 'Documentos pendientes' },
      'FROZEN': { class: 'frozen', text: 'Congelada', icon: 'fas fa-snowflake', tooltip: 'Inscripción congelada' },
      'APPROVED': { class: 'approved', text: 'Aprobada', icon: 'fas fa-thumbs-up', tooltip: 'Inscripción aprobada' },
      'REJECTED': { class: 'rejected', text: 'Rechazada', icon: 'fas fa-thumbs-down', tooltip: 'Inscripción rechazada' },
      'CANCELLED': { class: 'cancelled', text: 'Cancelada', icon: 'fas fa-times-circle', tooltip: 'Inscripción cancelada' }
    };

    return stateMap[state] || { class: 'unknown', text: state, icon: 'fas fa-question-circle', tooltip: `Estado: ${state}` };
  }



  /**
   * Formatea fecha completa
   */
  private formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formatea fecha corta
   */
  private formatShortDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
