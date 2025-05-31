import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  AcknowledgementLevel
} from '../../../../core/models/notification.model';

// Componentes personalizados
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

// Componentes específicos
import { PlantillaDialogComponent } from './plantilla-dialog/plantilla-dialog.component';
import { DestinatariosDialogComponent } from './destinatarios-dialog/destinatarios-dialog.component';
import { VariableSelectorComponent } from './components/variable-selector/variable-selector.component';
import { CommunicationPreviewComponent } from './components/communication-preview/communication-preview.component';
import { CommunicationHistoryComponent } from './components/communication-history/communication-history.component';

// Definición del servicio TemplateVariablesService
class TemplateVariablesService {
  processTemplate(template: string, data: Record<string, unknown>): string {
    // Implementación simple para reemplazar variables en la plantilla
    let result = template;

    // Reemplazar variables de usuario
    if (data['user']) {
      const user = data['user'] as Record<string, unknown>;
      result = result.replace(/\{\{user\.fullName\}\}/g, user['fullName'] as string || '');
      result = result.replace(/\{\{user\.firstName\}\}/g, user['firstName'] as string || '');
      result = result.replace(/\{\{user\.lastName\}\}/g, user['lastName'] as string || '');
      result = result.replace(/\{\{user\.email\}\}/g, user['email'] as string || '');
      result = result.replace(/\{\{user\.dni\}\}/g, user['dni'] as string || '');
    }

    // Reemplazar variables de concurso
    if (data['contest']) {
      const contest = data['contest'] as Record<string, unknown>;
      result = result.replace(/\{\{contest\.title\}\}/g, contest['title'] as string || '');
      result = result.replace(/\{\{contest\.position\}\}/g, contest['position'] as string || '');
      result = result.replace(/\{\{contest\.dependency\}\}/g, contest['dependency'] as string || '');
      result = result.replace(/\{\{contest\.startDate\}\}/g, contest['startDate'] as string || '');
      result = result.replace(/\{\{contest\.endDate\}\}/g, contest['endDate'] as string || '');
    }

    // Reemplazar variables de inscripción
    if (data['inscription']) {
      const inscription = data['inscription'] as Record<string, unknown>;
      result = result.replace(/\{\{inscription\.status\}\}/g, inscription['status'] as string || '');
      result = result.replace(/\{\{inscription\.date\}\}/g, inscription['date'] as string || '');
    }

    return result;
  }
}

@Component({
  selector: 'app-comunicaciones-admin',
  templateUrl: './comunicaciones-admin.component.refactored.html',
  styleUrls: ['./comunicaciones-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule,
    VariableSelectorComponent,
    CommunicationPreviewComponent,
    CommunicationHistoryComponent
  ],
  providers: [
    TemplateVariablesService
  ]
})
export class ComunicacionesAdminComponent implements OnInit, OnDestroy {
  // Forms
  comunicacionForm: FormGroup;

  // Data
  templates: NotificationTemplate[] = [];
  selectedTemplate?: NotificationTemplate;
  selectedUsers: AdminUser[] = [];
  selectedRoles: string[] = [];

  // UI state
  isLoading = false;
  activeTab = 0;
  sendToAllUsersValue = false;

  // Notification types and acknowledgement levels for dropdown
  notificationTypes = Object.values(NotificationType);
  acknowledgementLevels = Object.values(AcknowledgementLevel);

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private massNotificationsService: MassNotificationsService,
    private adminUsersService: AdminUsersService,
    private templateVariablesService: TemplateVariablesService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.comunicacionForm = this.fb.group({
      subject: ['', [Validators.required]],
      content: ['', [Validators.required]],
      type: [NotificationType.SYSTEM, [Validators.required]],
      acknowledgementLevel: [AcknowledgementLevel.NONE, [Validators.required]],
      scheduledTime: [null],
      sendToAllUsers: [false],
      sendToRoles: [false]
    });
  }

  ngOnInit(): void {
    this.loadTemplates();

    // Inicializar el valor del checkbox
    this.sendToAllUsersValue = this.comunicacionForm.get('sendToAllUsers')?.value || false;

    // Suscribirse a cambios en el formulario
    this.comunicacionForm.get('sendToAllUsers')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.sendToAllUsersValue = value;
      });
  }

  /**
   * Maneja el cambio en el checkbox de enviar a todos los usuarios
   */
  onSendToAllUsersChange(value: boolean): void {
    this.comunicacionForm.get('sendToAllUsers')?.setValue(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  selectTemplate(template: NotificationTemplate): void {
    this.selectedTemplate = template;
    this.comunicacionForm.patchValue({
      subject: template.subject,
      content: template.content,
      type: template.type,
      acknowledgementLevel: template.acknowledgementLevel
    });
  }

  /**
   * Inserta una variable en el contenido del formulario
   * @param variable Variable a insertar
   */
  insertVariable(variable: string): void {
    const contentControl = this.comunicacionForm.get('content');
    if (contentControl) {
      const currentContent = contentControl.value || '';
      const newContent = currentContent + ' ' + variable;
      contentControl.setValue(newContent);
    }
  }

  openTemplateDialog(template?: NotificationTemplate): void {
    const dialogRef = this.dialogService.open(PlantillaDialogComponent, {
      title: template ? 'Editar Plantilla' : 'Nueva Plantilla',
      icon: template ? 'edit' : 'plus',
      size: 'large',
      data: { template }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTemplates();
      }
    });
  }

  openRecipientsDialog(): void {
    const dialogRef = this.dialogService.open(DestinatariosDialogComponent, {
      title: 'Seleccionar Destinatarios',
      icon: 'users',
      size: 'large',
      data: {
        selectedUsers: this.selectedUsers,
        selectedRoles: this.selectedRoles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const typedResult = result as { selectedUsers?: AdminUser[], selectedRoles?: string[] };
        this.selectedUsers = typedResult.selectedUsers || [];
        this.selectedRoles = typedResult.selectedRoles || [];
      }
    });
  }

  sendNotification(): void {
    if (this.comunicacionForm.invalid) {
      this.notificationService.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (!this.selectedUsers.length && !this.selectedRoles.length && !this.comunicacionForm.value.sendToAllUsers) {
      this.notificationService.error('Por favor seleccione al menos un destinatario');
      return;
    }

    this.isLoading = true;

    const formValue = this.comunicacionForm.value;

    const request: MassNotificationRequest = {
      subject: formValue.subject,
      content: formValue.content,
      type: formValue.type,
      acknowledgementLevel: formValue.acknowledgementLevel,
      scheduledTime: formValue.scheduledTime ? new Date(formValue.scheduledTime).toISOString() : undefined
    };

    // Add recipients
    if (formValue.sendToAllUsers) {
      request.recipientRoles = ['ROLE_USER'];
    } else {
      if (this.selectedUsers.length > 0) {
        request.recipientIds = this.selectedUsers.map(user => user.id);
      }

      if (this.selectedRoles.length > 0) {
        request.recipientRoles = this.selectedRoles;
      }
    }

    this.massNotificationsService.sendMassNotification(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notificationService.success(
            `Notificación enviada correctamente a ${response.totalRecipients} destinatarios`
          );
          this.resetForm();
        },
        error: (error) => {
          console.error('Error sending notification:', error);
          this.isLoading = false;
          this.notificationService.error('Error al enviar notificación');
        }
      });
  }

  resetForm(): void {
    this.comunicacionForm.reset({
      type: NotificationType.SYSTEM,
      acknowledgementLevel: AcknowledgementLevel.NONE,
      sendToAllUsers: false,
      sendToRoles: false
    });
    this.selectedTemplate = undefined;
    this.selectedUsers = [];
    this.selectedRoles = [];
  }
}
