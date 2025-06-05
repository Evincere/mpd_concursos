import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

// Servicios
import { ProfileService } from '@core/services/profile/profile.service';
import { ExperienceService } from '@core/services/experience/experience.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { EducacionService } from '@core/services/educacion/educacion.service';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { NotificationService } from '@shared/services/notification.service';
import { PerfilStateService } from './services/perfil-state.service';

// Interfaces y tipos
import { UserProfile, ProfilePhotoResponse } from '@core/models/perfil.model';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';

// Componentes del módulo
import { DocumentacionTabComponent } from './components/documentacion-tab/documentacion-tab.component';
import { EducacionContainerComponent } from './components/educacion/educacion-container/educacion-container.component';
import { ExperienciaContainerComponent } from './components/experiencia/experiencia-container/experiencia-container.component';

// Modelos
import { Educacion } from '@core/models/educacion.model';
import { Experiencia } from '@core/models/experiencia.model';
import { TabKey, ProfileTab, TAB_KEYS } from './models/types';

// Diálogos
import { CustomConfirmDialogComponent } from '@shared/components/custom-confirm-dialog/custom-confirm-dialog.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomTabsComponent,
    CustomTabComponent,
    CustomSpinnerComponent,
    DocumentacionTabComponent,
    EducacionContainerComponent,
    ExperienciaContainerComponent
  ]
})
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  perfilForm!: FormGroup;
  userProfile: UserProfile | null = null;
  fotoPerfil = 'assets/images/default-avatar.png';
  minDate: Date = new Date(1900, 0, 1);
  maxDate: Date = new Date();
  
  private subscriptions: Subscription[] = [];
  
  private readonly tabDefinitions: ProfileTab[] = [
    { key: TAB_KEYS.INFO, label: 'Información Personal', icon: 'fa-user' },
    { key: TAB_KEYS.CV, label: 'Curriculum Vitae', icon: 'fa-file-alt' },
    { key: TAB_KEYS.DOCS, label: 'Documentación', icon: 'fa-folder' },
    { key: TAB_KEYS.LINKEDIN, label: 'LinkedIn', icon: 'fa-linkedin' }
  ];

  get tabs(): ProfileTab[] {
    return this.tabDefinitions.filter(tab => 
      tab.key !== TAB_KEYS.LINKEDIN || this.perfilState.currentState.linkedInTab
    );
  }

  // Getters y setters para el estado
  get selectedTab(): TabKey {
    return this.perfilState.currentState.selectedTab;
  }

  set selectedTab(value: TabKey) {
    this.perfilState.setTab(value);
  }

  get isEditing(): boolean {
    return this.perfilState.currentState.isEditing;
  }

  get isLoading(): boolean {
    return this.perfilState.currentState.isLoading;
  }

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private experienceService: ExperienceService,
    private documentosService: DocumentosService,
    private dialog: CustomDialogService,
    private notification: NotificationService,
    private perfilState: PerfilStateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Manejar el parámetro tab de la URL
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        const tab = params['tab'] as TabKey;
        if (tab && Object.values(TAB_KEYS).includes(tab)) {
          this.selectedTab = tab;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initForm(): void {
    this.perfilForm = this.fb.group({
      username: ['', { disabled: true }],
      email: ['', { disabled: true }],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dni: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      fechaNacimiento: [null],
      nacionalidad: [''],
      domicilio: [''],
      provincia: [''],
      pais: ['']
    });
  }

  private loadUserProfile(): void {
    this.perfilState.setLoading(true);
    
    this.profileService.getUserProfile()
      .pipe(finalize(() => this.perfilState.setLoading(false)))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.updateFormWithProfile(profile);
          this.fotoPerfil = profile.fotoPerfil || 'assets/images/default-avatar.png';
        },
        error: (error) => {
          this.notification.error('Error al cargar el perfil');
          console.error('Error loading profile:', error);
        }
      });
  }
  private updateFormWithProfile(profile: UserProfile): void {
    if (!profile) return;

    // Actualizar campos básicos usando keyof para asegurar tipos correctos
    const basicFields: Array<keyof UserProfile> = ['username', 'email', 'firstName', 'lastName', 'dni', 'telefono', 'fechaNacimiento', 'nacionalidad', 'domicilio', 'provincia', 'pais'];
    basicFields.forEach(key => {
      const value = profile[key];
      if (value !== undefined) {
        this.perfilForm.get(key as string)?.patchValue(value);
      }
    });
  }

  toggleEditing(): void {
    const newEditingState = !this.isEditing;
    this.perfilState.setEditing(newEditingState);
    
    if (!newEditingState) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.userProfile) {
      this.updateFormWithProfile(this.userProfile);
    }
    this.perfilState.setEditing(false);
  }

  saveProfile(): void {
    if (this.perfilForm.invalid) {
      this.notification.error('Por favor, complete todos los campos requeridos');
      return;
    }

    this.perfilState.setLoading(true);
    const formValues = this.perfilForm.getRawValue();

    // Limpiar el CUIT removiendo guiones antes de enviarlo al backend
    if (formValues.cuit) {
      const originalCuit = formValues.cuit;
      formValues.cuit = formValues.cuit.replace(/\D/g, '');
      console.log('🔧 CUIT original:', originalCuit, '-> CUIT limpio:', formValues.cuit);
    }

    this.profileService.updateUserProfile(formValues)
      .pipe(finalize(() => this.perfilState.setLoading(false)))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.notification.success('Perfil actualizado correctamente');
          this.perfilState.setEditing(false);
        },
        error: (error) => {
          this.notification.error('Error al actualizar el perfil');
          console.error('Error updating profile:', error);
        }
      });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (!file) return;

    this.perfilState.setLoading(true);

    try {
      const response = await this.profileService.uploadProfilePhoto(file).toPromise();
      if (response?.url) {
        this.fotoPerfil = response.url;
        this.notification.success('Foto de perfil actualizada correctamente');
      }
    } catch (error) {
      this.notification.error('Error al actualizar la foto de perfil');
      console.error('Error uploading profile photo:', error);
    } finally {
      this.perfilState.setLoading(false);
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      input.value = '';
    }
  }

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }
}
