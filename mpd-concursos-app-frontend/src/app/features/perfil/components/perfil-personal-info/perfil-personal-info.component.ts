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
      <!-- Profile Photo Section -->
      <div class="profile-photo-section">
        <app-custom-card>
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
        </app-custom-card>
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
                  <app-custom-form-field
                    label="Nombre de Usuario"
                    [readonly]="true"
                    hint="Campo no modificable">
                    <input customInput
                      type="text"
                      formControlName="username"
                      readonly>
                  </app-custom-form-field>

                  <app-custom-form-field
                    label="Email"
                    [readonly]="true"
                    hint="Campo no modificable">
                    <input customInput
                      type="email"
                      formControlName="email"
                      readonly>
                  </app-custom-form-field>
                </div>

                <div class="form-row">
                  <app-custom-form-field
                    label="Nombre"
                    [readonly]="!isEditing"
                    [required]="true">
                    <input customInput
                      type="text"
                      formControlName="firstName"
                      [readonly]="!isEditing">
                    <div error *ngIf="perfilForm.get('firstName')?.errors?.['required'] && perfilForm.get('firstName')?.touched">
                      El nombre es requerido
                    </div>
                  </app-custom-form-field>

                  <app-custom-form-field
                    label="Apellido"
                    [readonly]="!isEditing"
                    [required]="true">
                    <input customInput
                      type="text"
                      formControlName="lastName"
                      [readonly]="!isEditing">
                    <div error *ngIf="perfilForm.get('lastName')?.errors?.['required'] && perfilForm.get('lastName')?.touched">
                      El apellido es requerido
                    </div>
                  </app-custom-form-field>
                </div>

                <div class="form-row">
                  <app-custom-form-field
                    label="DNI"
                    [readonly]="!isEditing"
                    [required]="true">
                    <input customInput
                      type="text"
                      formControlName="dni"
                      [readonly]="!isEditing"
                      maxlength="8"
                      pattern="^[0-9]{8}$">
                    <div error *ngIf="perfilForm.get('dni')?.hasError('pattern') && perfilForm.get('dni')?.touched">
                      El DNI debe contener 8 dígitos numéricos
                    </div>
                  </app-custom-form-field>

                  <app-custom-form-field
                    label="CUIT"
                    [readonly]="!isEditing"
                    [required]="true"
                    hint="Formato: XX-XXXXXXXX-X">
                    <input customInput
                      type="text"
                      formControlName="cuit"
                      [readonly]="!isEditing"
                      placeholder="XX-XXXXXXXX-X"
                      maxlength="13">
                    <div error *ngIf="perfilForm.get('cuit')?.hasError('pattern') && perfilForm.get('cuit')?.touched">
                      El formato debe ser XX-XXXXXXXX-X
                    </div>
                  </app-custom-form-field>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="form-section">
                <h4>Información de Contacto</h4>
                <div class="form-row">
                  <app-custom-form-field
                    label="Teléfono"
                    [readonly]="!isEditing">
                    <input customInput
                      type="text"
                      formControlName="telefono"
                      [readonly]="!isEditing"
                      placeholder="Ingrese su teléfono">
                  </app-custom-form-field>

                  <app-custom-form-field
                    label="Dirección (Centro de Vida)"
                    [readonly]="!isEditing"
                    hint="Esta dirección se utilizará como su centro de vida para las inscripciones a concursos">
                    <input customInput
                      type="text"
                      formControlName="direccion"
                      [readonly]="!isEditing"
                      placeholder="Ingrese su dirección completa">
                  </app-custom-form-field>
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
