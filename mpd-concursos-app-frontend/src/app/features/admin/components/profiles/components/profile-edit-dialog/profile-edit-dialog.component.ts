import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminProfilesService, UserProfile, UpdateProfileRequest } from '@core/services/admin/admin-profiles.service';

@Component({
  selector: 'app-profile-edit-dialog',
  templateUrl: './profile-edit-dialog.component.html',
  styleUrls: ['./profile-edit-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ProfileEditDialogComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  isLoading = true;
  isSaving = false;
  activeTab = 0;

  personalForm: FormGroup;
  addressForm: FormGroup;
  professionalForm: FormGroup;
  preferencesForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private profilesService: AdminProfilesService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProfileEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { profileId: string }
  ) {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dni: [''],
      cuit: [''],
      birthDate: [null],
      gender: [''],
      nationality: ['']
    });

    this.addressForm = this.fb.group({
      address: this.fb.group({
        street: [''],
        number: [''],
        floor: [''],
        apartment: [''],
        city: [''],
        province: [''],
        postalCode: [''],
        country: ['']
      }),
      centroDeVida: this.fb.group({
        street: [''],
        number: [''],
        floor: [''],
        apartment: [''],
        city: [''],
        province: [''],
        postalCode: [''],
        country: ['']
      }),
      sameCentroDeVida: [false]
    });

    this.professionalForm = this.fb.group({
      title: [''],
      specialization: [''],
      licenseNumber: [''],
      graduationDate: [null],
      university: ['']
    });

    this.preferencesForm = this.fb.group({
      theme: ['system'],
      language: ['es'],
      notifications: this.fb.group({
        email: [true],
        push: [false],
        sms: [false]
      }),
      accessibility: this.fb.group({
        highContrast: [false],
        largeText: [false],
        screenReader: [false]
      })
    });
  }

  ngOnInit(): void {
    this.loadProfileData();

    // Escuchar cambios en sameCentroDeVida
    this.addressForm.get('sameCentroDeVida')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(same => {
        if (same) {
          // Copiar valores de address a centroDeVida
          const addressValue = this.addressForm.get('address')?.value;
          this.addressForm.get('centroDeVida')?.setValue(addressValue);
          this.addressForm.get('centroDeVida')?.disable();
        } else {
          this.addressForm.get('centroDeVida')?.enable();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfileData(): void {
    this.isLoading = true;

    this.profilesService.getProfileById(this.data.profileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.populateForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando perfil:', error);
          this.snackBar.open('Error al cargar los datos del perfil', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  populateForms(): void {
    if (!this.profile) return;

    // Datos personales
    this.personalForm.patchValue({
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email,
      phone: this.profile.phone,
      dni: this.profile.dni,
      cuit: this.profile.cuit,
      birthDate: this.profile.birthDate ? new Date(this.profile.birthDate) : null,
      gender: this.profile.gender,
      nationality: this.profile.nationality
    });

    // Dirección
    if (this.profile.address) {
      this.addressForm.get('address')?.patchValue(this.profile.address);
    }

    if (this.profile.centroDeVida) {
      this.addressForm.get('centroDeVida')?.patchValue(this.profile.centroDeVida);

      // Verificar si son iguales
      const addressStr = JSON.stringify(this.profile.address);
      const centroDeVidaStr = JSON.stringify(this.profile.centroDeVida);

      if (addressStr === centroDeVidaStr) {
        this.addressForm.get('sameCentroDeVida')?.setValue(true);
      }
    }

    // Información profesional
    if (this.profile.professionalInfo) {
      this.professionalForm.patchValue({
        title: this.profile.professionalInfo.title,
        specialization: this.profile.professionalInfo.specialization,
        licenseNumber: this.profile.professionalInfo.licenseNumber,
        graduationDate: this.profile.professionalInfo.graduationDate ? new Date(this.profile.professionalInfo.graduationDate) : null,
        university: this.profile.professionalInfo.university
      });
    }

    // Preferencias
    if (this.profile.preferences) {
      this.preferencesForm.patchValue({
        theme: this.profile.preferences.theme || 'system',
        language: this.profile.preferences.language || 'es'
      });

      if (this.profile.preferences.notifications) {
        this.preferencesForm.get('notifications')?.patchValue(this.profile.preferences.notifications);
      }

      if (this.profile.preferences.accessibility) {
        this.preferencesForm.get('accessibility')?.patchValue(this.profile.preferences.accessibility);
      }
    }
  }

  onSubmit(): void {
    if (this.personalForm.invalid) {
      this.snackBar.open('Por favor, complete los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const updateData: UpdateProfileRequest = {
      ...this.personalForm.value,
      address: this.addressForm.get('address')?.value,
      centroDeVida: this.addressForm.get('sameCentroDeVida')?.value ?
        this.addressForm.get('address')?.value :
        this.addressForm.get('centroDeVida')?.value,
      professionalInfo: this.professionalForm.value,
      preferences: this.preferencesForm.value
    };

    this.profilesService.updateProfile(this.data.profileId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_profile) => {
          this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error actualizando perfil:', error);
          this.snackBar.open('Error al actualizar el perfil', 'Cerrar', { duration: 3000 });
          this.isSaving = false;
        }
      });
  }

  copyAddressToCentroDeVida(): void {
    const addressValue = this.addressForm.get('address')?.value;
    this.addressForm.get('centroDeVida')?.setValue(addressValue);
  }

  getFullName(): string {
    if (!this.profile) return '';
    return `${this.profile.lastName}, ${this.profile.firstName}`;
  }

  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }
}
