import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

import {
  Notification,
  NotificationStatus,
  AcknowledgementLevel,
  requiresAcknowledgment,
  requiresSignature,
  NOTIFICATION_STATUS_LABELS,
  ACKNOWLEDGEMENT_LEVEL_LABELS,
  getNotificationStatusColor,
  getAcknowledgementLevelColor
} from '@core/models/notification.model';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';
import { Router } from '@angular/router';
import { NotificationsService } from '@core/services/notifications/notifications.service';
// Removed external component imports - implementing badge system directly

@Component({
  selector: 'app-inscription-notification-item',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="inscription-notification-item"
         *ngIf="notification"
         (click)="onNotificationClick()"
         [class.unread]="isUnread()">
      <div class="notification-icon" [ngClass]="'status-' + getStatusClass()">
        <mat-icon>{{ getInscriptionStatusIcon() }}</mat-icon>
      </div>
      <div class="notification-content">
        <div class="notification-header">
          <h4>{{ notification.subject || 'Notificación' }}</h4>
          <span class="notification-date" *ngIf="notification.sentAt">{{ notification.sentAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <p class="notification-text">{{ notification.content || 'Sin contenido' }}</p>

        <!-- Notification Badges -->
        <div class="notification-badges">
          <!-- Status Badge -->
          <div class="notification-badge status-badge"
               [ngClass]="'badge-' + getStatusColor()"
               [matTooltip]="getStatusTooltip()"
               matTooltipPosition="above">
            <mat-icon class="badge-icon">{{ getStatusIcon() }}</mat-icon>
            <span class="badge-text">{{ getStatusLabel() }}</span>
          </div>

          <!-- Acknowledgment Badge (only if requires acknowledgment) -->
          <div *ngIf="showAcknowledgmentBadge()"
               class="notification-badge acknowledgment-badge"
               [ngClass]="'badge-' + getAcknowledgmentColor()"
               [matTooltip]="getAcknowledgmentTooltip()"
               matTooltipPosition="above">
            <mat-icon class="badge-icon">{{ getAcknowledgmentIcon() }}</mat-icon>
            <span class="badge-text">{{ getAcknowledgmentLabel() }}</span>
          </div>

          <!-- Signature Required Badge (only if requires signature) -->
          <div *ngIf="showSignatureBadge()"
               class="notification-badge signature-badge badge-red"
               [matTooltip]="getSignatureTooltip()"
               matTooltipPosition="above">
            <mat-icon class="badge-icon">security</mat-icon>
            <span class="badge-text">Firma requerida</span>
          </div>
        </div>

        <div class="notification-actions" *ngIf="hasMetadata()">
          <button
            mat-button
            color="primary"
            (click)="viewInscription(); $event.stopPropagation()"
            matTooltip="Ver detalles de la inscripción">
            <mat-icon>visibility</mat-icon>
            VER DETALLES
          </button>

          <button
            mat-button
            color="accent"
            *ngIf="canContinueInscription()"
            (click)="continueInscription(); $event.stopPropagation()"
            matTooltip="Continuar con el proceso de inscripción">
            <mat-icon>edit</mat-icon>
            CONTINUAR
          </button>

          <button
            mat-button
            (click)="viewContest(); $event.stopPropagation()"
            matTooltip="Ver detalles del concurso">
            <mat-icon>gavel</mat-icon>
            VER CONCURSO
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./inscription-notification-item.component.scss']
})
export class InscriptionNotificationItemComponent implements OnInit {
  @Input() notification?: Notification;
  @Output() read = new EventEmitter<Notification>();
  @Output() acknowledge = new EventEmitter<Notification>();

  showAcknowledgmentSection = false;
  isAcknowledging = false;

  constructor(
    private router: Router,
    private notificationsService: NotificationsService,
    private unifiedNotificationService: UnifiedNotificationService
  ) {}

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
    console.log('InscriptionNotificationItemComponent inicializado');
  }

  isUnread(): boolean {
    return this.notification?.status === NotificationStatus.SENT ||
           this.notification?.status === NotificationStatus.PENDING;
  }

  onNotificationClick(): void {
    if (this.notification && this.isUnread()) {
      this.markAsRead();
    }

    // Check if acknowledgment is required
    if (this.notification && requiresAcknowledgment(this.notification)) {
      this.showAcknowledgmentSection = true;
    }
  }

  private markAsRead(): void {
    if (!this.notification) return;

    this.notificationsService.markAsRead(this.notification.id).subscribe({
      next: (updatedNotification) => {
        this.notification = updatedNotification;
        this.read.emit(updatedNotification);
        this.showSuccessMessage('Notificación marcada como leída');
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.showErrorMessage('Error al marcar la notificación como leída');
      }
    });
  }

  // Acknowledgment functionality would be implemented here when needed

  private showSuccessMessage(message: string): void {
    this.unifiedNotificationService.success(message, 'Éxito', {
      duration: 3000,
      position: 'bottom-center'
    });
  }

  private showErrorMessage(message: string): void {
    this.unifiedNotificationService.error(message, 'Error', {
      duration: 5000,
      position: 'bottom-center'
    });
  }

  // Badge system methods
  getStatusLabel(): string {
    return NOTIFICATION_STATUS_LABELS[this.notification?.status || NotificationStatus.PENDING] || 'Desconocido';
  }

  getStatusColor(): string {
    return getNotificationStatusColor(this.notification?.status || NotificationStatus.PENDING);
  }

  getStatusIcon(): string {
    switch (this.notification?.status) {
      case NotificationStatus.PENDING:
        return 'schedule';
      case NotificationStatus.SENT:
        return 'send';
      case NotificationStatus.READ:
        return 'visibility';
      case NotificationStatus.ACKNOWLEDGED:
        return 'verified';
      default:
        return 'info';
    }
  }

  getStatusTooltip(): string {
    switch (this.notification?.status) {
      case NotificationStatus.PENDING:
        return 'Esta notificación está pendiente de envío';
      case NotificationStatus.SENT:
        return 'Esta notificación ha sido enviada';
      case NotificationStatus.READ:
        return 'Esta notificación ha sido leída';
      case NotificationStatus.ACKNOWLEDGED:
        return 'Esta notificación ha sido acusada de recibo';
      default:
        return 'Estado de notificación desconocido';
    }
  }

  showAcknowledgmentBadge(): boolean {
    return this.notification?.acknowledgementLevel !== AcknowledgementLevel.NONE;
  }

  getAcknowledgmentLabel(): string {
    return ACKNOWLEDGEMENT_LEVEL_LABELS[this.notification?.acknowledgementLevel || AcknowledgementLevel.NONE] || 'Desconocido';
  }

  getAcknowledgmentColor(): string {
    return getAcknowledgementLevelColor(this.notification?.acknowledgementLevel || AcknowledgementLevel.NONE);
  }

  getAcknowledgmentIcon(): string {
    switch (this.notification?.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'check_circle_outline';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'edit';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'verified_user';
      default:
        return 'info';
    }
  }

  getAcknowledgmentTooltip(): string {
    switch (this.notification?.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'Esta notificación requiere acuse de recibo simple';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'Esta notificación requiere firma básica';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'Esta notificación requiere firma avanzada';
      default:
        return 'Nivel de acuse desconocido';
    }
  }

  showSignatureBadge(): boolean {
    return this.notification ? requiresSignature(this.notification) &&
           this.notification.status !== NotificationStatus.ACKNOWLEDGED : false;
  }

  getSignatureTooltip(): string {
    if (this.notification?.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED) {
      return 'Esta notificación requiere firma digital avanzada para ser acusada de recibo';
    }
    return 'Esta notificación requiere firma para ser acusada de recibo';
  }

  hasMetadata(): boolean {
    return !!this.notification?.metadata?.contestId;
  }

  getStatusClass(): string {
    if (!this.notification?.metadata?.inscriptionStatus) {
      return 'info';
    }

    const status = this.notification.metadata.inscriptionStatus;

    switch (status) {
      case InscripcionState.PENDING:
      case InscripcionState.PENDIENTE:
        return 'pending';
      case InscripcionState.APPROVED:
      case InscripcionState.INSCRIPTO:
        return 'approved';
      case InscripcionState.REJECTED:
        return 'rejected';
      case InscripcionState.CANCELLED:
        return 'cancelled';
      case InscripcionState.ACTIVE:
      case InscripcionState.IN_PROCESS:
        return 'in-process';
      default:
        return 'info';
    }
  }

  getInscriptionStatusIcon(): string {
    if (!this.notification?.metadata?.inscriptionStatus) {
      return 'info';
    }

    const status = this.notification.metadata.inscriptionStatus;

    switch (status) {
      case InscripcionState.PENDING:
      case InscripcionState.PENDIENTE:
        return 'hourglass_top';
      case InscripcionState.APPROVED:
      case InscripcionState.INSCRIPTO:
        return 'check_circle';
      case InscripcionState.REJECTED:
        return 'cancel';
      case InscripcionState.CANCELLED:
        return 'block';
      case InscripcionState.ACTIVE:
      case InscripcionState.IN_PROCESS:
        return 'edit';
      default:
        return 'info';
    }
  }

  canContinueInscription(): boolean {
    if (!this.notification?.metadata?.inscriptionStatus) {
      return false;
    }

    const status = this.notification.metadata.inscriptionStatus;
    // Verificar si el status es un valor válido del enum antes de usarlo
    if (Object.values(InscripcionState).includes(status as InscripcionState)) {
      return InscripcionStateUtils.canResume(status as InscripcionState);
    }

    // Fallback para compatibilidad con estados legacy
    return status === 'ACTIVE' || status === 'IN_PROCESS';
  }

  viewInscription(): void {
    this.router.navigate(['/postulaciones']);
  }

  continueInscription(): void {
    if (!this.notification?.metadata?.contestId || !this.notification?.metadata?.inscriptionId) {
      return;
    }

    this.router.navigate(['/inscripcion', this.notification.metadata.contestId], {
      queryParams: { inscriptionId: this.notification.metadata.inscriptionId }
    });
  }

  viewContest(): void {
    if (!this.notification?.metadata?.contestId) {
      return;
    }

    this.router.navigate(['/concursos', this.notification.metadata.contestId]);
  }
}
