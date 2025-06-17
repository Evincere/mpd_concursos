import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Custom Components
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { ProfileImageManagerComponent } from '@shared/components/profile-image-manager/profile-image-manager.component';

// Models
import { UserProfile } from '@core/models/perfil.model';

// Services
import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-perfil-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomButtonComponent,
    ProfileImageManagerComponent
  ],
  template: `
    <div class="personal-info-container">
      <!-- Profile Photo Section - Using Unified ProfileImageManagerComponent -->
      <div class="profile-photo-section">
        <app-profile-image-manager
          [initialImageUrl]="getCurrentImageUrl()"
          [showRemoveButton]="true"
          [showUploadInfo]="true"
          size="large"
          imageAlt="Foto de perfil del usuario"
          (imageUploaded)="onImageUploaded($event)"
          (imageRemoved)="onImageRemoved()"
          (uploadError)="onUploadError($event)">
        </app-profile-image-manager>
      </div>

      <!-- Personal Data Form -->
      <div class="personal-data-section">
        <form [formGroup]="perfilForm" class="perfil-form">
          <app-custom-card>
            <div class="card-header" slot="header">
              <div class="header-content">
                <h3>
                  <i class="fas fa-user-circle" aria-hidden="true"></i>
                  Datos Personales
                </h3>
                <app-custom-button
                  [color]="isEditing ? 'warn' : 'primary'"
                  [icon]="isEditing ? 'fa-times' : 'fa-edit'"
                  [label]="isEditing ? 'Cancelar edición' : 'Editar datos personales'"
                  (buttonClick)="isEditing ? onFormReset() : onEditToggle()">
                </app-custom-button>
              </div>
            </div>

            <div class="form-content" [class.editing]="isEditing">
              <!-- Basic Information -->
              <div class="form-section">
                <h4>Información Básica</h4>
                <div class="form-row">
                  <div class="form-field-wrapper">
                    <label class="field-label">Nombre de Usuario</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="username"
                      readonly>
                    <div class="hint-text">Campo no modificable</div>
                  </div>

                  <div class="form-field-wrapper">
                    <label class="field-label">Email</label>
                    <input
                      type="email"
                      class="field-input"
                      formControlName="email"
                      readonly>
                    <div class="hint-text">Campo no modificable</div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field-wrapper">
                    <label class="field-label required">Nombre</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="firstName"
                      [readonly]="!isEditing">
                    <div class="error-message" *ngIf="perfilForm.get('firstName')?.errors?.['required'] && perfilForm.get('firstName')?.touched">
                      El nombre es requerido
                    </div>
                  </div>

                  <div class="form-field-wrapper">
                    <label class="field-label required">Apellido</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="lastName"
                      [readonly]="!isEditing">
                    <div class="error-message" *ngIf="perfilForm.get('lastName')?.errors?.['required'] && perfilForm.get('lastName')?.touched">
                      El apellido es requerido
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field-wrapper">
                    <label class="field-label required">DNI</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="dni"
                      [readonly]="!isEditing"
                      maxlength="8"
                      pattern="^[0-9]{8}$">
                    <div class="error-message" *ngIf="perfilForm.get('dni')?.hasError('pattern') && perfilForm.get('dni')?.touched">
                      El DNI debe contener 8 dígitos numéricos
                    </div>
                  </div>

                  <div class="form-field-wrapper">
                    <label class="field-label required">CUIT</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="cuit"
                      [readonly]="!isEditing"
                      placeholder="XX-XXXXXXXX-X"
                      maxlength="13">
                    <div class="hint-text">Formato: XX-XXXXXXXX-X</div>
                    <div class="error-message" *ngIf="perfilForm.get('cuit')?.hasError('pattern') && perfilForm.get('cuit')?.touched">
                      El formato debe ser XX-XXXXXXXX-X
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="form-section">
                <h4>Información de Contacto</h4>
                <div class="form-row">
                  <div class="form-field-wrapper">
                    <label class="field-label">Teléfono</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="telefono"
                      [readonly]="!isEditing"
                      placeholder="Ingrese su teléfono">
                  </div>

                  <div class="form-field-wrapper">
                    <label class="field-label">Dirección (Centro de Vida)</label>
                    <input
                      type="text"
                      class="field-input"
                      formControlName="direccion"
                      [readonly]="!isEditing"
                      placeholder="Ingrese su dirección completa">
                    <div class="hint-text">Esta dirección se utilizará como su centro de vida para las inscripciones a concursos</div>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions" *ngIf="isEditing">
                <app-custom-button
                  color="primary"
                  icon="fa-save"
                  label="Guardar Cambios"
                  [disabled]="perfilForm.invalid || isLoading"
                  (buttonClick)="onFormSave()">
                </app-custom-button>
                <app-custom-button
                  color="warn"
                  icon="fa-times"
                  label="Cancelar"
                  (buttonClick)="onFormReset()">
                </app-custom-button>
              </div>
            </div>
          </app-custom-card>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./perfil-personal-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilPersonalInfoComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null;
  @Input() perfilForm!: FormGroup;
  @Input() isEditing = false;
  @Input() isLoading = false;

  @Output() editToggle = new EventEmitter<void>();
  @Output() formSave = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  private authService = inject(AuthService);

  ngOnInit(): void {
    // Component initialization - ProfileImageManagerComponent handles image state
  }

  onEditToggle(): void {
    this.editToggle.emit();
  }

  onFormSave(): void {
    if (this.perfilForm.valid) {
      this.formSave.emit();
    }
  }

  onFormReset(): void {
    this.formReset.emit();
  }

  // === PROFILE IMAGE MANAGER HANDLERS ===

  /**
   * Get current image URL for ProfileImageManagerComponent
   */
  getCurrentImageUrl(): string | null {
    if (this.userProfile?.profileImageUrl) {
      return this.userProfile.profileImageUrl;
    }

    const userInfo = this.authService.userInfo();
    return userInfo.profileImage || null;
  }

  /**
   * Handle successful image upload from ProfileImageManagerComponent
   */
  onImageUploaded(imageUrl: string): void {
    console.log('Imagen de perfil actualizada exitosamente:', imageUrl);
    // The ProfileImageManagerComponent already handles AuthService update
    // Additional logic can be added here if needed
  }

  /**
   * Handle image removal from ProfileImageManagerComponent
   */
  onImageRemoved(): void {
    console.log('Imagen de perfil eliminada exitosamente');
    // The ProfileImageManagerComponent already handles AuthService update
    // Additional logic can be added here if needed
  }

  /**
   * Handle upload errors from ProfileImageManagerComponent
   */
  onUploadError(error: string): void {
    console.error('Error en upload de imagen:', error);
    // The ProfileImageManagerComponent already handles error notifications
    // Additional error handling can be added here if needed
  }
}
