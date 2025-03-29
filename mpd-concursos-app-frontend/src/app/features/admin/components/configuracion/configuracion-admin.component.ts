import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-configuracion-admin',
  templateUrl: './configuracion-admin.component.html',
  styleUrls: ['./configuracion-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSnackBarModule
  ]
})
export class ConfiguracionAdminComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
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
  }

  saveGeneralConfig(): void {
    if (this.generalForm.valid) {
      // Simular guardado
      this.configData.general = this.generalForm.value;
      this.snackBar.open('Configuración general guardada correctamente', 'Cerrar', { duration: 3000 });
    } else {
      this.markFormGroupTouched(this.generalForm);
    }
  }

  saveSecurityConfig(): void {
    if (this.securityForm.valid) {
      // Simular guardado
      this.configData.security = this.securityForm.value;
      this.snackBar.open('Configuración de seguridad guardada correctamente', 'Cerrar', { duration: 3000 });
    } else {
      this.markFormGroupTouched(this.securityForm);
    }
  }

  saveNotificationsConfig(): void {
    if (this.notificationsForm.valid) {
      // Simular guardado
      this.configData.notifications = this.notificationsForm.value;
      this.snackBar.open('Configuración de notificaciones guardada correctamente', 'Cerrar', { duration: 3000 });
    } else {
      this.markFormGroupTouched(this.notificationsForm);
    }
  }

  saveBackupConfig(): void {
    if (this.backupForm.valid) {
      // Simular guardado
      this.configData.backup = this.backupForm.value;
      this.snackBar.open('Configuración de respaldo guardada correctamente', 'Cerrar', { duration: 3000 });
    } else {
      this.markFormGroupTouched(this.backupForm);
    }
  }

  resetToDefaults(formType: string): void {
    switch (formType) {
      case 'general':
        this.generalForm.reset({
          appName: 'Defensa Mendoza',
          appLogo: 'assets/images/logo.png',
          appTheme: 'light',
          defaultLanguage: 'es',
          itemsPerPage: 10
        });
        break;
      case 'security':
        this.securityForm.reset({
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          passwordRequireSpecialChar: true,
          passwordRequireNumber: true,
          passwordRequireUppercase: true,
          twoFactorAuth: false
        });
        break;
      case 'notifications':
        this.notificationsForm.reset({
          emailNotifications: true,
          newExamNotification: true,
          examResultNotification: true,
          systemUpdatesNotification: false,
          reminderBeforeExam: 24
        });
        break;
      case 'backup':
        this.backupForm.reset({
          autoBackup: true,
          backupFrequency: 'daily',
          backupTime: '02:00',
          keepBackupsFor: 30,
          backupLocation: '/var/backups/mpd-concursos'
        });
        break;
    }
    this.snackBar.open(`Configuración de ${formType} restablecida a valores predeterminados`, 'Cerrar', { duration: 3000 });
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
