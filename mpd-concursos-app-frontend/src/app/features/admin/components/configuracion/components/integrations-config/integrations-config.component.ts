import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  SystemConfigService,
  IntegrationsConfig
} from '@core/services/admin/system-config.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-integrations-config',
  templateUrl: './integrations-config.component.html',
  styleUrls: ['./integrations-config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ConfirmDialogComponent
  ]
})
export class IntegrationsConfigComponent implements OnInit, OnDestroy {
  integrationsForm: FormGroup;
  isLoading = false;
  isSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.integrationsForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea el formulario de configuración de integraciones
   * @returns Formulario de configuración de integraciones
   */
  createForm(): FormGroup {
    return this.fb.group({
      googleMapsApiKey: [''],
      googleMapsEnabled: [false],
      recaptchaEnabled: [false],
      recaptchaSiteKey: [''],
      recaptchaSecretKey: [''],
      googleAnalyticsEnabled: [false],
      googleAnalyticsId: [''],
      externalAuthProviders: this.fb.group({
        google: [false],
        microsoft: [false],
        facebook: [false]
      }),
      apiKeys: this.fb.array([])
    });
  }

  /**
   * Carga la configuración de integraciones
   */
  loadConfig(): void {
    this.isLoading = true;

    this.systemConfigService.getIntegrationsConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.updateForm(config);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando configuración de integraciones:', error);
          this.snackBar.open('Error al cargar la configuración de integraciones', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  /**
   * Actualiza el formulario con la configuración cargada
   * @param config Configuración de integraciones
   */
  updateForm(config: IntegrationsConfig): void {
    // Limpiar el array de API keys
    while (this.apiKeysArray.length) {
      this.apiKeysArray.removeAt(0);
    }

    // Agregar las API keys existentes
    if (config.apiKeys && config.apiKeys.length > 0) {
      config.apiKeys.forEach(apiKey => {
        this.addApiKey(apiKey);
      });
    }

    // Actualizar el resto del formulario
    this.integrationsForm.patchValue({
      googleMapsApiKey: config.googleMapsApiKey,
      googleMapsEnabled: config.googleMapsEnabled,
      recaptchaEnabled: config.recaptchaEnabled,
      recaptchaSiteKey: config.recaptchaSiteKey,
      recaptchaSecretKey: config.recaptchaSecretKey,
      googleAnalyticsEnabled: config.googleAnalyticsEnabled,
      googleAnalyticsId: config.googleAnalyticsId,
      externalAuthProviders: {
        google: config.externalAuthProviders.google,
        microsoft: config.externalAuthProviders.microsoft,
        facebook: config.externalAuthProviders.facebook
      }
    });
  }

  /**
   * Guarda la configuración de integraciones
   */
  saveConfig(): void {
    if (this.integrationsForm.invalid) {
      this.markFormGroupTouched(this.integrationsForm);
      this.snackBar.open('Por favor, corrija los errores en el formulario', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const config: IntegrationsConfig = this.integrationsForm.value;

    this.systemConfigService.updateIntegrationsConfig(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Configuración de integraciones guardada correctamente', 'Cerrar', { duration: 3000 });
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error guardando configuración de integraciones:', error);
          this.snackBar.open('Error al guardar la configuración de integraciones', 'Cerrar', { duration: 3000 });
          this.isSaving = false;
        }
      });
  }

  /**
   * Restablece la configuración de integraciones a los valores predeterminados
   */
  resetConfig(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Restablecer configuración',
        message: '¿Está seguro de que desea restablecer la configuración de integraciones a los valores predeterminados?',
        confirmText: 'Restablecer',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;

        this.systemConfigService.resetConfig('integrations')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Configuración de integraciones restablecida correctamente', 'Cerrar', { duration: 3000 });
              this.loadConfig();
            },
            error: (error) => {
              console.error('Error restableciendo configuración de integraciones:', error);
              this.snackBar.open('Error al restablecer la configuración de integraciones', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            }
          });
      }
    });
  }

  /**
   * Agrega una nueva API key al formulario
   * @param apiKey API key a agregar (opcional)
   */
  addApiKey(apiKey?: unknown): void {
    const apiKeyObj = apiKey as Record<string, unknown> | undefined;
    this.apiKeysArray.push(this.fb.group({
      name: [apiKeyObj?.['name'] || '', Validators.required],
      key: [apiKeyObj?.['key'] || '', Validators.required],
      enabled: [apiKeyObj?.['enabled'] !== undefined ? apiKeyObj['enabled'] : true],
      expirationDate: [apiKeyObj?.['expirationDate'] ? new Date(apiKeyObj['expirationDate'] as string) : null]
    }));
  }

  /**
   * Elimina una API key del formulario
   * @param index Índice de la API key a eliminar
   */
  removeApiKey(index: number): void {
    this.apiKeysArray.removeAt(index);
  }

  /**
   * Genera una nueva API key aleatoria
   * @param index Índice de la API key a generar
   */
  generateApiKey(index: number): void {
    const apiKeyGroup = this.apiKeysArray.at(index);
    const randomKey = this.generateRandomKey();
    apiKeyGroup.get('key')?.setValue(randomKey);
  }

  /**
   * Genera una clave aleatoria
   * @returns Clave aleatoria
   */
  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Marca todos los controles de un FormGroup como touched
   * @param formGroup FormGroup a marcar
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Obtiene el FormArray de API keys
   */
  get apiKeysArray(): FormArray {
    return this.integrationsForm.get('apiKeys') as FormArray;
  }
}
