import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { Postulacion } from '@shared/interfaces/postulacion/postulacion.interface';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inscription-button-container">
      <app-custom-button
        *ngIf="shouldShowButton"
        [label]="buttonText"
        [variant]="buttonVariant"
        [disabled]="isDisabled"
        [icon]="buttonIcon"
        [tooltip]="buttonTooltip"
        [class]="getButtonClasses()"
        (buttonClick)="handleClick()">
      </app-custom-button>

      <!-- Indicador de urgencia para documentos pendientes -->
      <div *ngIf="shouldShowUrgencyIndicator" class="urgency-indicator">
        <i class="fas fa-exclamation-triangle text-orange-500"></i>
        <span class="text-xs text-orange-600 font-medium">{{ getUrgencyMessage() }}</span>
      </div>

      <!-- Mensaje cuando no se puede inscribir -->
      <div *ngIf="!shouldShowButton && userPostulation" class="inscription-blocked-message">
        <i class="fas fa-ban text-gray-400"></i>
        <span class="text-sm text-gray-500 ml-2">{{ getBlockedMessage() }}</span>
      </div>

      <!-- Mensaje cuando el período de inscripción está cerrado -->
      <div *ngIf="!shouldShowButton && !userPostulation && !isContestOpenForInscription()" class="inscription-period-closed-message">
        <i class="fas fa-clock text-amber-500"></i>
        <span class="text-sm text-amber-600 ml-2">{{ getInscriptionPeriodMessage() }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./inscripcion-button.component.scss']
})
export class InscripcionButtonComponent implements OnChanges {
  @Input() contest!: Concurso;
  @Input() userPostulation: Postulacion | null = null;
  @Output() inscripcionClick = new EventEmitter<Concurso>();
  @Output() continuarClick = new EventEmitter<Concurso>();

  // Cache para optimizar cálculos repetitivos
  private _cachedContestState: {
    isOpen: boolean;
    buttonText: string;
    buttonTooltip: string;
    buttonVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    buttonIcon: string;
    lastCalculated: number;
    contestId?: string | number;
    contestStatus?: string;
    userPostulationState?: string;
    // Debug info
    debugInfo?: {
      backendStatus: string;
      calculationMethod: string;
      inscriptionDates?: any;
      generalDates?: any;
      currentTime: string;
    };
  } | null = null;

  // Flag para habilitar logging temporal de debug
  private readonly DEBUG_STATE_CHANGES = true;

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Invalidar cache cuando cambien los inputs críticos
    if (changes['contest'] || changes['userPostulation']) {
      if (this.DEBUG_STATE_CHANGES) {
        console.log('[InscripcionButton] DEBUG: Input changes detected, invalidating cache', {
          contestChanged: !!changes['contest'],
          userPostulationChanged: !!changes['userPostulation'],
          previousCache: this._cachedContestState,
          newContest: this.contest,
          newUserPostulation: this.userPostulation
        });
      }
      this._cachedContestState = null;
    }
  }

  // Getter para acceder al concurso
  get currentContest(): Concurso {
    return this.contest;
  }

  /**
   * Calcula y cachea el estado del concurso para evitar cálculos repetitivos
   */
  private _getOrCalculateContestState() {
    const now = Date.now();
    const contestId = this.currentContest?.id;
    const contestStatus = this.currentContest?.status;
    const userPostulationState = this.userPostulation?.estado;

    // Verificar si el cache es válido (mismo concurso, mismo estado, calculado hace menos de 30 segundos)
    if (this._cachedContestState &&
        this._cachedContestState.contestId === contestId &&
        this._cachedContestState.contestStatus === contestStatus &&
        this._cachedContestState.userPostulationState === userPostulationState &&
        (now - this._cachedContestState.lastCalculated) < 30000) {

      if (this.DEBUG_STATE_CHANGES) {
        console.log('[InscripcionButton] DEBUG: Using cached state', this._cachedContestState);
      }
      return this._cachedContestState;
    }

    if (this.DEBUG_STATE_CHANGES) {
      console.log('[InscripcionButton] DEBUG: Cache miss, recalculating state', {
        contestId,
        contestStatus,
        userPostulationState,
        cacheAge: this._cachedContestState ? now - this._cachedContestState.lastCalculated : 'no cache'
      });
    }

    // Calcular nuevo estado
    const { isOpen, debugInfo } = this._calculateIsContestOpenForInscriptionWithDebug();
    const buttonText = this._calculateButtonText();
    const buttonTooltip = this._calculateButtonTooltip();
    const buttonVariant = this._calculateButtonVariant();
    const buttonIcon = this._calculateButtonIcon();

    // Guardar en cache
    this._cachedContestState = {
      isOpen,
      buttonText,
      buttonTooltip,
      buttonVariant,
      buttonIcon,
      lastCalculated: now,
      contestId,
      contestStatus,
      userPostulationState,
      debugInfo
    };

    if (this.DEBUG_STATE_CHANGES) {
      console.log('[InscripcionButton] DEBUG: New state calculated and cached', this._cachedContestState);
    }

    return this._cachedContestState;
  }

  get shouldShowButton(): boolean {
    // No mostrar botón si hay una inscripción en estado final (cancelada, rechazada, aprobada)
    if (this.userPostulation) {
      const finalStates = ['CANCELLED', 'REJECTED', 'APPROVED'];
      if (finalStates.includes(this.userPostulation.estado)) {
        return false;
      }
    }
    return true;
  }

  get buttonText(): string {
    // Si hay postulación del usuario, mostrar estado de la postulación
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'Retomar Inscripción';     // ✅ Documentación pendiente - permite completar
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'Ver Postulación';         // ✅ Inscripción completa - pendiente validación admin
        case 'APPROVED':
          return 'Ver Resultado';           // ✅ Proceso finalizado - mostrar resultado
        case 'REJECTED':
          return 'Ver Resultado';           // ✅ Proceso finalizado - mostrar motivos
        case 'ACTIVE':
          return 'Retomar Inscripción';     // ✅ Inscripción en proceso - permite continuar
        case 'FROZEN':
          return 'Ver Estado';              // ✅ Inscripción congelada - solo visualización
        default:
          return 'Ver Postulación';
      }
    }

    // Si no hay postulación, usar cache para evitar cálculos repetitivos
    return this._getOrCalculateContestState().buttonText;
  }

  /**
   * Calcula el texto del botón según el estado del concurso
   * REFACTORING: Solo usar estados que existen en el backend
   */
  private _calculateButtonText(): string {
    const status = this.currentContest?.status?.toUpperCase();

    switch (status) {
      case 'ACTIVE':
        return 'Inscribirse';
      case 'SCHEDULED':
        return 'Próximamente';
      case 'CLOSED':
        return 'Inscripciones Cerradas';
      case 'PAUSED':
        return 'Pausado';
      case 'CANCELLED':
        return 'Cancelado';
      case 'FINISHED':
        return 'Finalizado';
      case 'ARCHIVED':
        return 'Archivado';
      case 'IN_EVALUATION':
        return 'En Evaluación';
      case 'RESULTS_PUBLISHED':
        return 'Resultados Publicados';
      case 'DRAFT':
        return 'En Preparación';
      default:
        return 'Ver Detalles';
    }
  }



  get buttonTooltip(): string {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'Debe completar la documentación requerida. Tiempo límite: 3 días hábiles después del cierre de inscripciones';
        case 'PENDING':
          return 'Su inscripción está completa y siendo revisada por el equipo administrativo';
        case 'COMPLETED_WITH_DOCS':
          return 'Su inscripción está completa con toda la documentación y pendiente de validación administrativa';
        case 'APPROVED':
          return 'Su inscripción ha sido aprobada. Puede ver los detalles y próximos pasos';
        case 'REJECTED':
          return 'Su inscripción fue rechazada. Puede ver los motivos y detalles';
        case 'ACTIVE':
          return 'Su inscripción está en proceso. Puede continuar completando los datos requeridos';
        case 'FROZEN':
          return 'Su inscripción fue congelada por vencimiento del plazo de documentación';
        default:
          return 'Ver el estado actual de su postulación';
      }
    }

    // Si no hay postulación, usar cache para evitar cálculos repetitivos
    return this._getOrCalculateContestState().buttonTooltip;
  }

  /**
   * Calcula el tooltip del botón según el estado del concurso
   */
  private _calculateButtonTooltip(): string {
    const status = this.currentContest?.status?.toUpperCase();

    switch (status) {
      case 'INSCRIPTION_OPEN':
        return 'Iniciar proceso de inscripción al concurso';
      case 'PUBLISHED':
        // Usar la misma lógica que el texto del botón
        return this._calculatePublishedContestTooltip();
      case 'INSCRIPTION_PENDING':
        return 'Las inscripciones aún no han comenzado';
      case 'CLOSED':
      case 'INSCRIPTION_CLOSED':
        return 'Las inscripciones para este concurso han finalizado';
      case 'CANCELLED':
        return 'Este concurso ha sido cancelado';
      case 'FINISHED':
        return 'Este concurso ha finalizado';
      default:
        return 'Ver detalles del concurso';
    }
  }

  /**
   * Calcula el tooltip para concursos con estado PUBLISHED basándose en fechas
   */
  private _calculatePublishedContestTooltip(): string {
    if (!this.currentContest) return 'Ver detalles del concurso';

    const now = new Date();

    // Verificar fechas específicas de inscripción primero
    const inscriptionDate = this.currentContest.dates?.find(date => date.type === 'inscription');
    if (inscriptionDate && inscriptionDate.startDate && inscriptionDate.endDate) {
      const startDate = new Date(inscriptionDate.startDate);
      const endDate = new Date(inscriptionDate.endDate);

      if (now < startDate) {
        return `Las inscripciones abren el ${startDate.toLocaleDateString('es-AR')}`;
      } else if (now > endDate) {
        return `Las inscripciones cerraron el ${endDate.toLocaleDateString('es-AR')}`;
      } else {
        return 'Iniciar proceso de inscripción al concurso';
      }
    }

    // Fallback: usar fechas generales del concurso
    if (this.currentContest.startDate && this.currentContest.endDate) {
      const startDate = new Date(this.currentContest.startDate);
      const endDate = new Date(this.currentContest.endDate);

      if (now < startDate) {
        return `El concurso inicia el ${startDate.toLocaleDateString('es-AR')}`;
      } else if (now > endDate) {
        return `El concurso finalizó el ${endDate.toLocaleDateString('es-AR')}`;
      } else {
        return 'Iniciar proceso de inscripción al concurso';
      }
    }

    // Si no hay fechas, usar lógica de inscripción
    return this._calculateIsContestOpenForInscription()
      ? 'Iniciar proceso de inscripción al concurso'
      : 'Ver detalles del concurso';
  }

  get buttonVariant(): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'warning';    // 🟡 Amarillo - Acción urgente requerida
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'secondary';  // 🔵 Azul - En revisión administrativa
        case 'APPROVED':
          return 'success';    // 🟢 Verde - Exitoso
        case 'REJECTED':
          return 'danger';     // 🔴 Rojo - Rechazado
        case 'ACTIVE':
          return 'primary';    // 🔵 Azul primario - Continuar
        case 'FROZEN':
          return 'danger';     // 🔴 Rojo - Estado crítico
        default:
          return 'secondary';
      }
    }

    // Si no hay postulación, usar cache para evitar cálculos repetitivos
    return this._getOrCalculateContestState().buttonVariant;
  }

  /**
   * Calcula el color del botón según el estado del concurso
   */
  private _calculateButtonVariant(): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    const status = this.currentContest?.status?.toUpperCase();

    switch (status) {
      case 'ACTIVE':
        return 'success';    // 🟢 Verde - Inscripciones abiertas
      case 'SCHEDULED':
        return 'secondary';  // 🔵 Azul - Próximamente
      case 'CLOSED':
        return 'secondary';  // 🔵 Azul gris - Cerrado
      case 'PAUSED':
        return 'warning';    // 🟡 Amarillo - Pausado
      case 'CANCELLED':
        return 'danger';     // 🔴 Rojo - Cancelado
      case 'FINISHED':
        return 'secondary';  // 🔵 Azul gris - Finalizado
      case 'ARCHIVED':
        return 'secondary';  // 🔵 Azul gris - Archivado
      case 'IN_EVALUATION':
        return 'warning';    // 🟡 Amarillo - En proceso
      case 'RESULTS_PUBLISHED':
        return 'primary';    // 🔵 Azul primario - Resultados
      case 'DRAFT':
        return 'secondary';  // 🔵 Azul - En preparación
      default:
        return 'secondary';  // 🔵 Azul - Por defecto
    }
  }

  /**
   * Calcula la variante del botón para concursos con estado PUBLISHED basándose en fechas
   */
  private _calculatePublishedContestVariant(): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    if (!this.currentContest) return 'secondary';

    const now = new Date();

    // Verificar fechas específicas de inscripción primero
    const inscriptionDate = this.currentContest.dates?.find(date => date.type === 'inscription');
    if (inscriptionDate && inscriptionDate.startDate && inscriptionDate.endDate) {
      const startDate = new Date(inscriptionDate.startDate);
      const endDate = new Date(inscriptionDate.endDate);

      if (now < startDate) {
        return 'secondary';  // 🔵 Azul - Próximamente
      } else if (now > endDate) {
        return 'secondary';  // 🔵 Azul gris - Cerrado
      } else {
        return 'success';    // 🟢 Verde - Abierto
      }
    }

    // Fallback: usar fechas generales del concurso
    if (this.currentContest.startDate && this.currentContest.endDate) {
      const startDate = new Date(this.currentContest.startDate);
      const endDate = new Date(this.currentContest.endDate);

      if (now < startDate) {
        return 'secondary';  // 🔵 Azul - Próximamente
      } else if (now > endDate) {
        return 'secondary';  // 🔵 Azul gris - Cerrado
      } else {
        return 'success';    // 🟢 Verde - Abierto
      }
    }

    // Si no hay fechas, usar lógica de inscripción (sin logs)
    return this._calculateIsContestOpenForInscription() ? 'success' : 'secondary';
  }

  get buttonIcon(): string {
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
          return 'fas fa-file-upload';    // 📄 Subir documentos
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          return 'fas fa-eye';            // 👁️ Ver postulación
        case 'APPROVED':
          return 'fas fa-check-circle';   // ✅ Aprobado
        case 'REJECTED':
          return 'fas fa-times-circle';   // ❌ Rechazado
        case 'ACTIVE':
          return 'fas fa-play';           // ▶️ Continuar
        case 'FROZEN':
          return 'fas fa-snowflake';      // ❄️ Congelado
        default:
          return 'fas fa-eye';            // 👁️ Ver
      }
    }

    // Si no hay postulación, usar cache para evitar cálculos repetitivos
    return this._getOrCalculateContestState().buttonIcon;
  }

  /**
   * Calcula el icono del botón según el estado del concurso
   */
  private _calculateButtonIcon(): string {
    const status = this.currentContest?.status?.toUpperCase();

    switch (status) {
      case 'ACTIVE':
        return 'fas fa-user-plus';       // ➕ Inscribirse
      case 'SCHEDULED':
        return 'fas fa-clock';           // 🕐 Próximamente
      case 'CLOSED':
        return 'fas fa-times-circle';    // ❌ Cerrado
      case 'PAUSED':
        return 'fas fa-pause';           // ⏸️ Pausado
      case 'CANCELLED':
        return 'fas fa-ban';             // 🚫 Cancelado
      case 'FINISHED':
        return 'fas fa-flag-checkered';  // 🏁 Finalizado
      case 'ARCHIVED':
        return 'fas fa-archive';         // 📦 Archivado
      case 'IN_EVALUATION':
        return 'fas fa-clipboard-check'; // 📋 En evaluación
      case 'RESULTS_PUBLISHED':
        return 'fas fa-trophy';          // 🏆 Resultados
      case 'DRAFT':
        return 'fas fa-edit';            // ✏️ En preparación
      default:
        return 'fas fa-eye';             // 👁️ Ver detalles
    }
  }

  /**
   * Determina el icono del botón para concursos con estado PUBLISHED basándose en fechas
   */
  private getPublishedContestIcon(): string {
    if (!this.currentContest) return 'fas fa-eye';

    const now = new Date();

    // Verificar fechas específicas de inscripción primero
    const inscriptionDate = this.currentContest.dates?.find(date => date.type === 'inscription');
    if (inscriptionDate && inscriptionDate.startDate && inscriptionDate.endDate) {
      const startDate = new Date(inscriptionDate.startDate);
      const endDate = new Date(inscriptionDate.endDate);

      if (now < startDate) {
        return 'fas fa-clock';           // 🕐 Próximamente
      } else if (now > endDate) {
        return 'fas fa-times-circle';    // ❌ Cerrado
      } else {
        return 'fas fa-user-plus';       // ➕ Inscribirse
      }
    }

    // Fallback: usar fechas generales del concurso
    if (this.currentContest.startDate && this.currentContest.endDate) {
      const startDate = new Date(this.currentContest.startDate);
      const endDate = new Date(this.currentContest.endDate);

      if (now < startDate) {
        return 'fas fa-clock';           // 🕐 Próximamente
      } else if (now > endDate) {
        return 'fas fa-times-circle';    // ❌ Cerrado
      } else {
        return 'fas fa-user-plus';       // ➕ Inscribirse
      }
    }

    // Si no hay fechas, usar lógica de inscripción (sin logs)
    return this._calculateIsContestOpenForInscription() ? 'fas fa-user-plus' : 'fas fa-eye';
  }

  get isDisabled(): boolean {
    // Si hay postulación del usuario, verificar si puede interactuar
    if (this.userPostulation) {
      const finalStates = ['CANCELLED', 'REJECTED', 'APPROVED'];
      return finalStates.includes(this.userPostulation.estado);
    }

    // Si no hay postulación, usar cache para evitar cálculos repetitivos
    return !this._getOrCalculateContestState().isOpen;
  }

  /**
   * Calcula si el concurso está abierto para inscripciones (sin logs para evitar spam)
   * SECURITY: Validación del lado del cliente para mejorar UX, pero el backend siempre tiene la autoridad final
   */
  private _calculateIsContestOpenForInscription(): boolean {
    if (!this.currentContest) return false;

    const status = this.currentContest?.status?.toUpperCase();

    // REFACTORING: Solo ACTIVE permite inscripciones (según backend ContestStatus.allowsInscriptions())
    return status === 'ACTIVE';
  }

  /**
   * Calcula si el concurso está abierto para inscripciones con información de debug
   */
  private _calculateIsContestOpenForInscriptionWithDebug(): { isOpen: boolean; debugInfo: any } {
    if (!this.currentContest) {
      return {
        isOpen: false,
        debugInfo: {
          backendStatus: 'NO_CONTEST',
          calculationMethod: 'no_contest',
          currentTime: new Date().toISOString()
        }
      };
    }

    const status = this.currentContest.status?.toUpperCase();
    const now = new Date();

    const debugInfo = {
      backendStatus: status || 'UNKNOWN',
      calculationMethod: '',
      currentTime: now.toISOString(),
      inscriptionDates: null as any,
      generalDates: null as any
    };

    // REFACTORING: Solo ACTIVE permite inscripciones (según backend)
    if (status === 'ACTIVE') {
      debugInfo.calculationMethod = 'backend_active';
      return { isOpen: true, debugInfo };
    }

    // Todos los demás estados NO permiten inscripciones
    debugInfo.calculationMethod = 'backend_not_active';
    return { isOpen: false, debugInfo };
  }

  /**
   * Método público para usar en el template - usa cache para evitar cálculos repetitivos
   */
  isContestOpenForInscription(): boolean {
    return this._getOrCalculateContestState().isOpen;
  }

  get shouldShowUrgencyIndicator(): boolean {
    if (!this.userPostulation) return false;

    // Mostrar indicador de urgencia para documentos pendientes
    if (this.userPostulation.estado === 'COMPLETED_PENDING_DOCS') {
      return this.isDocumentationDeadlineNear();
    }

    return false;
  }

  getButtonClasses(): string {
    const classes = ['inscription-button'];

    if (this.shouldShowUrgencyIndicator) {
      classes.push('urgent-action');
    }

    return classes.join(' ');
  }

  getUrgencyMessage(): string {
    if (this.userPostulation?.estado === 'COMPLETED_PENDING_DOCS') {
      const daysLeft = this.getDaysUntilDocumentationDeadline();
      if (daysLeft <= 1) {
        return `¡Último día para completar documentación!`;
      } else if (daysLeft <= 2) {
        return `Quedan ${daysLeft} días para completar documentación`;
      }
    }
    return '';
  }

  private isDocumentationDeadlineNear(): boolean {
    const daysLeft = this.getDaysUntilDocumentationDeadline();
    return daysLeft <= 2; // Mostrar urgencia cuando quedan 2 días o menos
  }

  private getDaysUntilDocumentationDeadline(): number {
    if (!this.currentContest.endDate) return 999;

    // Calcular deadline: 3 días hábiles después del cierre de inscripciones
    const contestEndDate = new Date(this.currentContest.endDate);
    const documentationDeadline = this.addBusinessDays(contestEndDate, 3);
    const today = new Date();

    const diffTime = documentationDeadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  private addBusinessDays(date: Date, businessDays: number): Date {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      // Si no es fin de semana (sábado = 6, domingo = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
  }

  getBlockedMessage(): string {
    if (!this.userPostulation) return '';

    switch (this.userPostulation.estado) {
      case 'CANCELLED':
        return 'No puede volver a inscribirse a un concurso donde canceló su inscripción';
      case 'REJECTED':
        return 'No puede volver a inscribirse a un concurso donde su inscripción fue rechazada';
      case 'APPROVED':
        return 'Ya tiene una inscripción aprobada para este concurso';
      default:
        return 'No puede inscribirse a este concurso';
    }
  }

  /**
   * Obtiene el mensaje apropiado cuando el período de inscripción está cerrado
   */
  getInscriptionPeriodMessage(): string {
    if (!this.currentContest) return 'Período de inscripción no disponible';

    const now = new Date();
    const status = this.currentContest?.status?.toUpperCase();

    // Verificar fechas específicas de inscripción
    const inscriptionDate = this.currentContest.dates?.find(date => date.type === 'inscription');
    if (inscriptionDate && inscriptionDate.startDate && inscriptionDate.endDate) {
      const startDate = new Date(inscriptionDate.startDate);
      const endDate = new Date(inscriptionDate.endDate);

      if (now < startDate) {
        return `Las inscripciones abren el ${startDate.toLocaleDateString('es-AR')}`;
      } else if (now > endDate) {
        return `Las inscripciones cerraron el ${endDate.toLocaleDateString('es-AR')}`;
      }
    }

    // Verificar fechas generales del concurso
    if (this.currentContest.startDate && this.currentContest.endDate) {
      const startDate = new Date(this.currentContest.startDate);
      const endDate = new Date(this.currentContest.endDate);

      if (now < startDate) {
        return `El concurso inicia el ${startDate.toLocaleDateString('es-AR')}`;
      } else if (now > endDate) {
        return `El concurso finalizó el ${endDate.toLocaleDateString('es-AR')}`;
      }
    }

    // Mensajes basados en estado
    switch (status) {
      case 'INSCRIPTION_CLOSED':
        return 'Período de inscripción cerrado';
      case 'CLOSED':
        return 'Concurso cerrado';
      case 'CANCELLED':
        return 'Concurso cancelado';
      case 'FINISHED':
        return 'Concurso finalizado';
      default:
        return 'Inscripciones no disponibles en este momento';
    }
  }

  handleClick(): void {
    // CRITICAL FIX: Manejar correctamente los estados que requieren continuar vs iniciar nueva inscripción
    if (this.userPostulation) {
      switch (this.userPostulation.estado) {
        case 'COMPLETED_PENDING_DOCS':
        case 'ACTIVE':
          // Estados que permiten continuar/retomar el proceso de inscripción
          this.continuarClick.emit(this.currentContest);
          break;
        case 'PENDING':
        case 'COMPLETED_WITH_DOCS':
          // Estados completos - navegar al detalle de postulación
          this.navegarADetallePostulacion();
          break;
        case 'APPROVED':
        case 'REJECTED':
        case 'FROZEN':
        case 'CANCELLED':
          // Estados finales - solo mostrar resultado/estado
          console.log('Estado final - solo visualización permitida');
          break;
        default:
          this.inscripcionClick.emit(this.currentContest);
      }
    } else {
      // No hay postulación - iniciar nueva inscripción
      this.inscripcionClick.emit(this.currentContest);
    }
  }

  /**
   * Navega al detalle de la postulación en la vista de "Mis Postulaciones"
   */
  private navegarADetallePostulacion(): void {
    if (this.userPostulation?.id) {
      // Navegar a la página de postulaciones con el ID de la postulación para abrir el detalle
      this.router.navigate(['/dashboard/postulaciones'], {
        queryParams: {
          postulacionId: this.userPostulation.id,
          openDetail: 'true'
        }
      });
    }
  }
}
