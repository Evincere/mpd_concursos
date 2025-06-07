import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuditConfigurationService } from '@core/services/audit/audit-configuration.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

import { 
  ActivityRetentionConfig, 
  ActivityAlertConfig,
  ActivityAlertRule,
  NotificationChannel
} from '@shared/interfaces/audit/user-activity.interface';

import { HasPermissionDirective } from '@shared/directives/has-permission.directive';
import { TooltipDirective } from '@shared/directives/tooltip.directive';

/**
 * Componente para configuración de auditoría
 */
@Component({
  selector: 'app-audit-config',
  templateUrl: './audit-config.component.html',
  styleUrls: ['./audit-config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HasPermissionDirective,
    TooltipDirective
  ]
})
export class AuditConfigComponent implements OnInit, OnDestroy {

  // Estados del componente
  retentionConfig: ActivityRetentionConfig | null = null;
  alertConfig: ActivityAlertConfig | null = null;
  loading = false;
  
  // Estados de UI
  activeTab: 'retention' | 'alerts' | 'channels' = 'retention';
  showCreateRule = false;
  showCreateChannel = false;
  editingRule: ActivityAlertRule | null = null;
  editingChannel: NotificationChannel | null = null;

  // Formularios
  retentionForm: FormGroup;
  alertRuleForm: FormGroup;
  channelForm: FormGroup;

  // Opciones para selects
  channelTypes = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'WEBHOOK', label: 'Webhook' },
    { value: 'SLACK', label: 'Slack' },
    { value: 'TEAMS', label: 'Microsoft Teams' }
  ];

  severityOptions = [
    { value: 'LOW', label: 'Bajo' },
    { value: 'MEDIUM', label: 'Medio' },
    { value: 'HIGH', label: 'Alto' },
    { value: 'CRITICAL', label: 'Crítico' }
  ];

  operatorOptions = [
    { value: 'EQUALS', label: 'Igual a' },
    { value: 'NOT_EQUALS', label: 'Diferente de' },
    { value: 'GREATER_THAN', label: 'Mayor que' },
    { value: 'LESS_THAN', label: 'Menor que' },
    { value: 'CONTAINS', label: 'Contiene' },
    { value: 'IN', label: 'En lista' },
    { value: 'NOT_IN', label: 'No en lista' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auditConfigService: AuditConfigurationService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadConfigurations();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.retentionForm = this.fb.group({
      enabled: [true],
      retentionPeriodDays: [90, [Validators.required, Validators.min(1), Validators.max(3650)]],
      archiveBeforeDelete: [true],
      compressionEnabled: [true],
      encryptionEnabled: [false],
      autoCleanupEnabled: [true],
      cleanupSchedule: ['0 2 * * *', Validators.required]
    });

    this.alertRuleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      enabled: [true],
      severity: ['MEDIUM', Validators.required],
      cooldownMinutes: [30, [Validators.required, Validators.min(1)]],
      conditions: this.fb.array([]),
      actions: this.fb.array([])
    });

    this.channelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['EMAIL', Validators.required],
      enabled: [true],
      config: this.fb.group({})
    });
  }

  /**
   * Carga las configuraciones
   */
  private loadConfigurations(): void {
    this.loading = true;

    this.auditConfigService.getRetentionConfig().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (config) => {
        this.retentionConfig = config;
        this.populateRetentionForm(config);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading retention config:', error);
        this.notificationService.showError('Error al cargar la configuración de retención');
        this.loading = false;
      }
    });

    this.auditConfigService.getAlertConfig().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (config) => {
        this.alertConfig = config;
      },
      error: (error) => {
        console.error('Error loading alert config:', error);
        this.notificationService.showError('Error al cargar la configuración de alertas');
      }
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    this.auditConfigService.retentionConfig$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.retentionConfig = config;
    });

    this.auditConfigService.alertConfig$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.alertConfig = config;
    });
  }

  /**
   * Rellena el formulario de retención
   */
  private populateRetentionForm(config: ActivityRetentionConfig): void {
    this.retentionForm.patchValue({
      enabled: config.enabled,
      retentionPeriodDays: config.retentionPeriodDays,
      archiveBeforeDelete: config.archiveBeforeDelete,
      compressionEnabled: config.compressionEnabled,
      encryptionEnabled: config.encryptionEnabled,
      autoCleanupEnabled: config.autoCleanupEnabled,
      cleanupSchedule: config.cleanupSchedule
    });
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'retention' | 'alerts' | 'channels'): void {
    this.activeTab = tab;
  }

  // ==================== CONFIGURACIÓN DE RETENCIÓN ====================

  /**
   * Guarda la configuración de retención
   */
  saveRetentionConfig(): void {
    if (this.retentionForm.invalid) {
      this.markFormGroupTouched(this.retentionForm);
      return;
    }

    const formValue = this.retentionForm.value;
    
    // Validar configuración
    const validation = this.auditConfigService.validateRetentionConfig(formValue);
    if (!validation.valid) {
      this.notificationService.showError(`Configuración inválida: ${validation.errors.join(', ')}`);
      return;
    }

    this.loading = true;

    this.auditConfigService.updateRetentionConfig(formValue).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Configuración de retención guardada exitosamente');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving retention config:', error);
        this.notificationService.showError('Error al guardar la configuración de retención');
        this.loading = false;
      }
    });
  }

  /**
   * Restaura la configuración de retención por defecto
   */
  resetRetentionConfig(): void {
    this.dialogService.showConfirmDialog({
      title: 'Restaurar Configuración',
      message: '¿Estás seguro de que quieres restaurar la configuración de retención por defecto?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.auditConfigService.resetRetentionConfig().pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (config) => {
            this.populateRetentionForm(config);
            this.notificationService.showSuccess('Configuración restaurada exitosamente');
          },
          error: (error) => {
            console.error('Error resetting retention config:', error);
            this.notificationService.showError('Error al restaurar la configuración');
          }
        });
      }
    });
  }

  // ==================== REGLAS DE ALERTA ====================

  /**
   * Muestra el formulario para crear regla
   */
  showCreateRuleForm(): void {
    this.editingRule = null;
    this.alertRuleForm.reset({
      enabled: true,
      severity: 'MEDIUM',
      cooldownMinutes: 30
    });
    this.showCreateRule = true;
  }

  /**
   * Edita una regla existente
   */
  editRule(rule: ActivityAlertRule): void {
    this.editingRule = rule;
    this.alertRuleForm.patchValue({
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      severity: rule.severity,
      cooldownMinutes: rule.cooldownMinutes
    });
    this.showCreateRule = true;
  }

  /**
   * Cancela la edición/creación de regla
   */
  cancelRuleEdit(): void {
    this.showCreateRule = false;
    this.editingRule = null;
    this.alertRuleForm.reset();
  }

  /**
   * Guarda la regla de alerta
   */
  saveAlertRule(): void {
    if (this.alertRuleForm.invalid) {
      this.markFormGroupTouched(this.alertRuleForm);
      return;
    }

    const formValue = this.alertRuleForm.value;
    this.loading = true;

    if (this.editingRule) {
      // Actualizar regla existente
      this.auditConfigService.updateAlertRule(this.editingRule.id, formValue).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Regla de alerta actualizada exitosamente');
          this.cancelRuleEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating alert rule:', error);
          this.notificationService.showError('Error al actualizar la regla de alerta');
          this.loading = false;
        }
      });
    } else {
      // Crear nueva regla
      this.auditConfigService.addAlertRule(formValue).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Regla de alerta creada exitosamente');
          this.cancelRuleEdit();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating alert rule:', error);
          this.notificationService.showError('Error al crear la regla de alerta');
          this.loading = false;
        }
      });
    }
  }

  /**
   * Elimina una regla de alerta
   */
  deleteRule(rule: ActivityAlertRule): void {
    this.dialogService.showConfirmDialog({
      title: 'Eliminar Regla',
      message: `¿Estás seguro de que quieres eliminar la regla "${rule.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.auditConfigService.removeAlertRule(rule.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.showSuccess('Regla eliminada exitosamente');
          },
          error: (error) => {
            console.error('Error deleting alert rule:', error);
            this.notificationService.showError('Error al eliminar la regla');
          }
        });
      }
    });
  }

  /**
   * Activa/desactiva una regla
   */
  toggleRule(rule: ActivityAlertRule): void {
    this.auditConfigService.updateAlertRule(rule.id, { enabled: !rule.enabled }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Regla ${rule.enabled ? 'desactivada' : 'activada'} exitosamente`
        );
      },
      error: (error) => {
        console.error('Error toggling alert rule:', error);
        this.notificationService.showError('Error al cambiar el estado de la regla');
      }
    });
  }

  // ==================== CANALES DE NOTIFICACIÓN ====================

  /**
   * Muestra el formulario para crear canal
   */
  showCreateChannelForm(): void {
    this.editingChannel = null;
    this.channelForm.reset({
      type: 'EMAIL',
      enabled: true
    });
    this.showCreateChannel = true;
  }

  /**
   * Edita un canal existente
   */
  editChannel(channel: NotificationChannel): void {
    this.editingChannel = channel;
    this.channelForm.patchValue({
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled,
      config: channel.config
    });
    this.showCreateChannel = true;
  }

  /**
   * Cancela la edición/creación de canal
   */
  cancelChannelEdit(): void {
    this.showCreateChannel = false;
    this.editingChannel = null;
    this.channelForm.reset();
  }

  /**
   * Prueba un canal de notificación
   */
  testChannel(channel: NotificationChannel): void {
    this.loading = true;

    this.auditConfigService.testNotificationChannel(channel.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        if (result.success) {
          this.notificationService.showSuccess('Canal probado exitosamente');
        } else {
          this.notificationService.showError(`Error en la prueba: ${result.message}`);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error testing channel:', error);
        this.notificationService.showError('Error al probar el canal');
        this.loading = false;
      }
    });
  }

  // ==================== UTILIDADES ====================

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
   * Verifica si un campo del formulario es inválido
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `${fieldName} debe ser mayor a ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} debe ser menor a ${field.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Exporta la configuración
   */
  exportConfiguration(): void {
    const config = this.auditConfigService.exportConfiguration();
    const blob = new Blob([config], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess('Configuración exportada exitosamente');
  }

  /**
   * Importa configuración desde archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.auditConfigService.importConfiguration(content).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (result) => {
            if (result.success) {
              this.notificationService.showSuccess(result.message);
              this.loadConfigurations();
            } else {
              this.notificationService.showError(result.message);
            }
          },
          error: (error) => {
            console.error('Error importing configuration:', error);
            this.notificationService.showError('Error al importar la configuración');
          }
        });
      };
      reader.readAsText(file);
    }
  }
}
