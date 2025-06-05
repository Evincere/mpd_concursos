import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Custom Components
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

// Models
import { UserProfile } from '@core/models/perfil.model';

@Component({
  selector: 'app-perfil-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomButtonComponent
  ],
  template: `
    <div class="personal-info-container">
      <!-- Profile Photo Section - Rebuilt without custom-card wrapper -->
      <div class="profile-photo-section">
        <div class="photo-glassmorphism-container">
          <div class="photo-content">
            <div class="photo-container">
              <ng-container *ngIf="fotoPerfil && fotoPerfil !== 'assets/images/default-avatar.png'; else defaultAvatar">
                <img [src]="fotoPerfil" alt="Foto de perfil" class="profile-image">
              </ng-container>
              <ng-template #defaultAvatar>
                <div class="default-avatar">
                  <i class="fas fa-user" aria-hidden="true"></i>
                </div>
              </ng-template>
              <button
                class="change-photo-btn"
                (click)="abrirSelectorArchivo()"
                aria-label="Cambiar foto de perfil">
                <i class="fas fa-camera" aria-hidden="true"></i>
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
              <p>Haga clic en el ícono de cámara para cambiar su foto</p>
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

  fotoPerfil = 'assets/images/default-avatar.png';

  ngOnInit(): void {
    // Initialize component
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
    // Implementation for file selector
  }

  onFileSelected(event: Event): void {
    // Implementation for file selection
  }
}
