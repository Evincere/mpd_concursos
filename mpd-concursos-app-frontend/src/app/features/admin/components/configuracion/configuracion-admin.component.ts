import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SystemConfigService } from '@core/services/admin/system-config.service';
import { IntegrationsConfigComponent } from './components/integrations-config/integrations-config.component';
import { ConfigHistoryComponent } from './components/config-history/config-history.component';
import { NotificationService } from '@core/services/notification/notification.service';

@Component({
  selector: 'app-configuracion-admin',
  templateUrl: './configuracion-admin.component.html',
  styleUrls: ['./configuracion-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IntegrationsConfigComponent,
    ConfigHistoryComponent
  ]
})
export class ConfiguracionAdminComponent implements OnInit, OnDestroy {
  generalForm: FormGroup;
  securityForm: FormGroup;
  notificationsForm: FormGroup;
  backupForm: FormGroup;

  // Datos hardcodeados para la demostración
  configData = {
    general: {
      appName: 'Defensa Mendoza',
      appLogo: 'assets/images/logo.png',
      appTheme: 'light',
      defaultLanguage: 'es',
      itemsPerPage: 10
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      passwordRequireNumber: true,
      passwordRequireUppercase: true,
      twoFactorAuth: false
    },
    notifications: {
      emailNotifications: true,
      newExamNotification: true,
      examResultNotification: true,
      systemUpdatesNotification: false,
      reminderBeforeExam: 24
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      keepBackupsFor: 30,
      backupLocation: '/var/backups/mpd-concursos'
    }
  };

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Estado de las pestañas
  activeTab = 'general';

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private systemConfigService: SystemConfigService
  ) {
    this.generalForm = this.fb.group({
      appName: [this.configData.general.appName, Validators.required],
      appLogo: [this.configData.general.appLogo],
      appTheme: [this.configData.general.appTheme, Validators.required],
      defaultLanguage: [this.configData.general.defaultLanguage, Validators.required],
      itemsPerPage: [this.configData.general.itemsPerPage, [Validators.required, Validators.min(5), Validators.max(100)]]
    });

    this.securityForm = this.fb.group({
      sessionTimeout: [this.configData.security.sessionTimeout, [Validators.required, Validators.min(5), Validators.max(120)]],
      maxLoginAttempts: [this.configData.security.maxLoginAttempts, [Validators.required, Validators.min(1), Validators.max(10)]],
      passwordMinLength: [this.configData.security.passwordMinLength, [Validators.required, Validators.min(6), Validators.max(20)]],
      passwordRequireSpecialChar: [this.configData.security.passwordRequireSpecialChar],
      passwordRequireNumber: [this.configData.security.passwordRequireNumber],
      passwordRequireUppercase: [this.configData.security.passwordRequireUppercase],
      twoFactorAuth: [this.configData.security.twoFactorAuth]
    });

    this.notificationsForm = this.fb.group({
      emailNotifications: [this.configData.notifications.emailNotifications],
      newExamNotification: [this.configData.notifications.newExamNotification],
      examResultNotification: [this.configData.notifications.examResultNotification],
      systemUpdatesNotification: [this.configData.notifications.systemUpdatesNotification],
      reminderBeforeExam: [this.configData.notifications.reminderBeforeExam, [Validators.required, Validators.min(1), Validators.max(72)]]
    });

    this.backupForm = this.fb.group({
      autoBackup: [this.configData.backup.autoBackup],
      backupFrequency: [this.configData.backup.backupFrequency, Validators.required],
      backupTime: [this.configData.backup.backupTime, Validators.required],
      keepBackupsFor: [this.configData.backup.keepBackupsFor, [Validators.required, Validators.min(1), Validators.max(365)]],
      backupLocation: [this.configData.backup.backupLocation, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadConfigurations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Carga las configuraciones del sistema
   */
  loadConfigurations(): void {
    // Cargar configuración general
    this.systemConfigService.getGeneralConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.generalForm.patchValue(config);
        },
        error: (error) => {
          console.error('Error cargando configuración general:', error);
        }
      });

    // Cargar configuración de seguridad
    this.systemConfigService.getSecurityConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.securityForm.patchValue(config);
        },
        error: (error) => {
          console.error('Error cargando configuración de seguridad:', error);
        }
      });

    // Cargar configuración de notificaciones
    this.systemConfigService.getNotificationsConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.notificationsForm.patchValue(config);
        },
        error: (error) => {
          console.error('Error cargando configuración de notificaciones:', error);
        }
      });

    // Cargar configuración de respaldo
    this.systemConfigService.getBackupConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.backupForm.patchValue(config);
        },
        error: (error) => {
          console.error('Error cargando configuración de respaldo:', error);
        }
      });
  }

  saveGeneralConfig(): void {
    if (this.generalForm.valid) {
      this.systemConfigService.updateGeneralConfig(this.generalForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Configuración general guardada correctamente');
          },
          error: (error) => {
            console.error('Error guardando configuración general:', error);
            this.notificationService.showError('Error al guardar la configuración general');
          }
        });
    } else {
      this.markFormGroupTouched(this.generalForm);
    }
  }

  saveSecurityConfig(): void {
    if (this.securityForm.valid) {
      this.systemConfigService.updateSecurityConfig(this.securityForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Configuración de seguridad guardada correctamente');
          },
          error: (error) => {
            console.error('Error guardando configuración de seguridad:', error);
            this.notificationService.showError('Error al guardar la configuración de seguridad');
          }
        });
    } else {
      this.markFormGroupTouched(this.securityForm);
    }
  }

  saveNotificationsConfig(): void {
    if (this.notificationsForm.valid) {
      this.systemConfigService.updateNotificationsConfig(this.notificationsForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Configuración de notificaciones guardada correctamente');
          },
          error: (error) => {
            console.error('Error guardando configuración de notificaciones:', error);
            this.notificationService.showError('Error al guardar la configuración de notificaciones');
          }
        });
    } else {
      this.markFormGroupTouched(this.notificationsForm);
    }
  }

  saveBackupConfig(): void {
    if (this.backupForm.valid) {
      this.systemConfigService.updateBackupConfig(this.backupForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Configuración de respaldo guardada correctamente');
          },
          error: (error) => {
            console.error('Error guardando configuración de respaldo:', error);
            this.notificationService.showError('Error al guardar la configuración de respaldo');
          }
        });
    } else {
      this.markFormGroupTouched(this.backupForm);
    }
  }

  resetToDefaults(formType: string): void {
    this.systemConfigService.resetConfig(formType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(`Configuración de ${formType} restablecida a valores predeterminados`);
          this.loadConfigurations();
        },
        error: (error) => {
          console.error(`Error restableciendo configuración de ${formType}:`, error);
          this.notificationService.showError(`Error al restablecer la configuración de ${formType}`);
        }
      });
  }

  // Marcar todos los controles como tocados para mostrar errores
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
