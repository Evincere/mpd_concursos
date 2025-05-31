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

// Servicio de variables de plantilla
import { TemplateVariablesService } from './services/template-variables.service';

@Component({
  selector: 'app-comunicaciones-admin',
  templateUrl: './comunicaciones-admin.component.fixed.html',
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.isLoading = false;
          this.notificationService.error('Error al cargar las plantillas');
        }
      });
  }

  /**
   * Selecciona una plantilla y actualiza el formulario
   */
  selectTemplate(template: NotificationTemplate): void {
    this.selectedTemplate = template;
    this.comunicacionForm.patchValue({
      subject: template.subject,
      content: template.content
    });
  }

  /**
   * Abre el diálogo para crear o editar una plantilla
   */
  openTemplateDialog(template?: NotificationTemplate): void {
    this.dialogService.open(PlantillaDialogComponent, {
      data: { template },
      width: '600px'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadTemplates();
      }
    });
  }

  /**
   * Abre el diálogo para seleccionar destinatarios
   */
  openRecipientsDialog(): void {
    this.dialogService.open(DestinatariosDialogComponent, {
      data: {
        selectedUsers: this.selectedUsers,
        selectedRoles: this.selectedRoles
      },
      width: '800px'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.selectedUsers = result.selectedUsers || [];
        this.selectedRoles = result.selectedRoles || [];
      }
    });
  }

  /**
   * Inserta una variable en el contenido del mensaje
   */
  insertVariable(variable: string): void {
    const contentControl = this.comunicacionForm.get('content');
    if (contentControl) {
      const currentContent = contentControl.value || '';
      const textArea = document.querySelector('.content-textarea') as HTMLTextAreaElement;
      
      if (textArea) {
        const startPos = textArea.selectionStart;
        const endPos = textArea.selectionEnd;
        
        const newContent = 
          currentContent.substring(0, startPos) + 
          variable + 
          currentContent.substring(endPos);
        
        contentControl.setValue(newContent);
        
        // Restaurar la posición del cursor después de la variable insertada
        setTimeout(() => {
          textArea.focus();
          textArea.setSelectionRange(startPos + variable.length, startPos + variable.length);
        }, 0);
      } else {
        // Si no podemos acceder al elemento, simplemente añadir al final
        contentControl.setValue(currentContent + variable);
      }
    }
  }

  /**
   * Resetea el formulario a su estado inicial
   */
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

  /**
   * Envía la notificación a los destinatarios seleccionados
   */
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
}
