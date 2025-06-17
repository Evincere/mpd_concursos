import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Custom Components
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

// Directives
import { LazyLoadImageDirective } from '@shared/directives/lazy-load-image.directive';

// Models
import { UserProfile } from '@core/models/perfil.model';

// Services
import { UserProfileService } from '@core/services/user/user-profile.service';
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
    LazyLoadImageDirective
  ],
  template: `
    <div class="personal-info-container">
      <!-- Profile Photo Section - Rebuilt without custom-card wrapper -->
      <div class="profile-photo-section">
        <div class="photo-glassmorphism-container">
          <div class="photo-content">
            <div class="photo-container">
              <ng-container *ngIf="fotoPerfil && fotoPerfil !== 'assets/images/default-avatar.png'; else defaultAvatar">
                <img
                  appLazyLoadImage
                  [src]="fotoPerfil"
                  [placeholder]="'assets/images/avatar-placeholder.png'"
                  alt="Foto de perfil"
                  class="profile-image"
                  [loadingClass]="'profile-image-loading'"
                  [loadedClass]="'profile-image-loaded'"
                  [errorClass]="'profile-image-error'">
              </ng-container>
              <ng-template #defaultAvatar>
                <div class="default-avatar">
                  <i class="fas fa-user" aria-hidden="true"></i>
                </div>
              </ng-template>
              <button
                class="change-photo-btn"
                (click)="abrirSelectorArchivo()"
                [disabled]="isUploadingImage"
                aria-label="Cambiar foto de perfil">
                <i class="fas" [class.fa-camera]="!isUploadingImage" [class.fa-spinner]="isUploadingImage" [class.fa-spin]="isUploadingImage" aria-hidden="true"></i>
              </button>
              <input
                type="file"
                hidden
                #fileInput
                (change)="onFileSelected($event)"
                accept="image/*">
            </div>
            <div class="photo-info">
              <h3>Foto de Perfil</h3>
              <p *ngIf="!isUploadingImage">Haga clic en el ícono de cámara para cambiar su foto</p>
              <p *ngIf="isUploadingImage" class="uploading-text">Subiendo imagen...</p>
            </div>
          </div>
        </div>
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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);

  fotoPerfil = 'assets/images/default-avatar.png';
  isUploadingImage = false;

  ngOnInit(): void {
    // Initialize profile image from user profile or auth service
    if (this.userProfile?.profileImageUrl) {
      this.fotoPerfil = this.userProfile.profileImageUrl;
    } else {
      // Get profile image from auth service signal
      const userInfo = this.authService.userInfo();
      if (userInfo.profileImage) {
        this.fotoPerfil = userInfo.profileImage;
      }
    }
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

  abrirSelectorArchivo(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, seleccione un archivo de imagen válido.');
        return;
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      this.isUploadingImage = true;
      this.userProfileService.uploadProfileImage(file).subscribe({
        next: (response) => {
          if (response && (response as any).imageUrl) {
            this.fotoPerfil = (response as any).imageUrl;
            this.authService.updateProfileImage((response as any).imageUrl);
            console.log('Imagen de perfil actualizada exitosamente');
          }
          this.isUploadingImage = false;
        },
        error: (error) => {
          console.error('Error al cargar la imagen:', error);
          alert('Error al cargar la imagen. Por favor, intente nuevamente.');
          this.isUploadingImage = false;
        }
      });
    }
  }
}
