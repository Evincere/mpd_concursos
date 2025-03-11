import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { ProfileService, UserProfile } from '../../../core/services/profile/profile.service';
import { DocumentacionTabComponent } from './documentacion-tab/documentacion-tab.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    DocumentacionTabComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fechaInicio') fechaInicio: any;
  @ViewChild('fechaFin') fechaFin: any;
  @ViewChild('fechaEduInicio') fechaEduInicio: any;
  @ViewChild('fechaEduFin') fechaEduFin: any;
  perfilForm!: FormGroup;

  fotoPerfil: string = 'assets/images/default-avatar.png';
  linkedInConectado = false;
  linkedInTab = true;
  isEditing = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private initializeForms() {
    this.perfilForm = this.fb.group({
      username: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}],
      dni: ['', [Validators.pattern('^[0-9]{8}$')]],
      cuit: ['', [Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]{1}$')]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      telefono: [{value: '', disabled: true}],
      direccion: [{value: '', disabled: true}],
      experiencias: this.fb.array([]),
      educacion: this.fb.array([]),
      habilidades: this.fb.array([])
    });

    // Suscribirse a los cambios del CUIT para formatear automáticamente
    this.perfilForm.get('cuit')?.valueChanges.subscribe(value => {
      if (value) {
        // Remover todos los caracteres no numéricos
        const numericValue = value.replace(/\D/g, '');

        // Solo procesar si tenemos números
        if (numericValue.length > 0) {
          let formattedValue = numericValue;

          // Aplicar formato XX-XXXXXXXX-X
          if (numericValue.length >= 2) {
            formattedValue = numericValue.substring(0, 2);
            if (numericValue.length > 2) {
              formattedValue += '-' + numericValue.substring(2);
            }
            if (numericValue.length > 10) {
              formattedValue = formattedValue.substring(0, 11) + '-' + numericValue.substring(10, 11);
            }
          }

          // Actualizar el valor sin emitir un nuevo evento
          if (formattedValue !== value) {
            this.perfilForm.get('cuit')?.setValue(formattedValue, { emitEvent: false });
          }
        }
      }
    });
  }

  private loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (profile) => {
          this.updateFormWithProfile(profile);
        },
        error: (error) => {
          console.error('Error al cargar el perfil:', error);
          this.snackBar.open('Error al cargar los datos del perfil', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private updateFormWithProfile(profile: UserProfile): void {
    // Actualizar campos básicos
    const basicFields = ['username', 'email', 'dni', 'cuit', 'firstName', 'lastName', 'telefono', 'direccion'];
    basicFields.forEach(key => {
      const control = this.perfilForm.get(key);
      if (control && profile[key as keyof UserProfile] !== undefined) {
        control.setValue(profile[key as keyof UserProfile] || '', { emitEvent: false });
        // Marcar como pristine para que no afecte la validación inicial
        control.markAsPristine();
      }
    });

    // Actualizar experiencias si existen
    const experienciasArray = this.perfilForm.get('experiencias') as FormArray;
    if (profile.experiencias && Array.isArray(profile.experiencias)) {
      experienciasArray.clear(); // Limpiar experiencias existentes
      profile.experiencias.forEach(exp => {
        experienciasArray.push(this.createExperienciaFormGroup(exp));
      });
    }

    // Actualizar educación si existe
    const educacionArray = this.perfilForm.get('educacion') as FormArray;
    if (profile.educacion && Array.isArray(profile.educacion)) {
      educacionArray.clear();
      profile.educacion.forEach(edu => {
        educacionArray.push(this.createEducacionFormGroup(edu));
      });
    }

    // Actualizar habilidades si existen
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;
    if (profile.habilidades && Array.isArray(profile.habilidades)) {
      habilidadesArray.clear();
      profile.habilidades.forEach(hab => {
        habilidadesArray.push(this.createHabilidadFormGroup(hab));
      });
    }
  }

  private createExperienciaFormGroup(experiencia?: any): FormGroup {
    return this.fb.group({
      empresa: [experiencia?.empresa || '', Validators.required],
      cargo: [experiencia?.cargo || '', Validators.required],
      fechaInicio: [experiencia?.fechaInicio || null, Validators.required],
      fechaFin: [experiencia?.fechaFin || null],
      descripcion: [experiencia?.descripcion || '']
    });
  }

  toggleEditing(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      // Habilitar solo los campos editables
      const editableFields = ['firstName', 'lastName', 'dni', 'cuit', 'telefono', 'direccion'];
      editableFields.forEach(field => {
        const control = this.perfilForm.get(field);
        if (control) {
          control.enable();
        }
      });
    } else {
      // Deshabilitar todos los campos
      Object.keys(this.perfilForm.controls).forEach(key => {
        this.perfilForm.get(key)?.disable();
      });
    }
  }

  // Getters para acceder a los FormArrays
  get experiencias() {
    return this.perfilForm.get('experiencias') as FormArray;
  }

  get educacion() {
    return this.perfilForm.get('educacion') as FormArray;
  }

  get habilidades() {
    return this.perfilForm.get('habilidades') as FormArray;
  }

  // Método para crear un nuevo grupo de educación
  createEducacionFormGroup(educacion?: any): FormGroup {
    const group = this.fb.group({
      institucion: [educacion?.institucion || '', Validators.required],
      titulo: [educacion?.titulo || '', Validators.required],
      descripcion: [educacion?.descripcion || '', Validators.required],
      fechaInicio: [educacion?.fechaInicio || null, Validators.required],
      fechaFin: [educacion?.fechaFin || null]
    });

    // Suscribirse a cambios en las fechas
    group.get('fechaInicio')?.valueChanges.subscribe(value => {
      const fechaFinControl = group.get('fechaFin');
      if (fechaFinControl && value) {
        fechaFinControl.setValidators([
          Validators.required,
          (control) => {
            const fechaFin = control.value;
            if (!fechaFin) return null;
            return new Date(fechaFin) <= new Date(value) ?
              { fechaInvalida: 'La fecha de fin debe ser posterior a la fecha de inicio' } : null;
          }
        ]);
        fechaFinControl.updateValueAndValidity();
      }
    });

    return group;
  }

  // Método para crear un nuevo grupo de habilidad
  createHabilidadFormGroup(habilidad?: any): FormGroup {
    return this.fb.group({
      nombre: [habilidad?.nombre || '', Validators.required],
      nivel: [habilidad?.nivel || '', Validators.required]
    });
  }

  // Métodos para agregar elementos
  agregarExperiencia(): void {
    this.experiencias.push(this.createExperienciaFormGroup());
  }

  agregarEducacion(): void {
    this.educacion.push(this.createEducacionFormGroup());
  }

  agregarHabilidad(): void {
    this.habilidades.push(this.createHabilidadFormGroup());
  }

  // Métodos para eliminar elementos
  eliminarExperiencia(index: number): void {
    this.experiencias.removeAt(index);
  }

  eliminarEducacion(index: number): void {
    this.educacion.removeAt(index);
  }

  eliminarHabilidad(index: number): void {
    this.habilidades.removeAt(index);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPerfil = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid) {
      this.isLoading = true;

      // Obtener todos los valores del formulario
      const formValues = this.perfilForm.getRawValue();

      // Remover guiones del CUIT antes de enviarlo
      const cuitNumerico = formValues.cuit ? formValues.cuit.replace(/\D/g, '') : '';

      // Crear el objeto de actualización con los campos requeridos
      const updatedProfile = {
        firstName: formValues.firstName?.trim(),
        lastName: formValues.lastName?.trim(),
        dni: formValues.dni?.trim(),
        cuit: cuitNumerico,
        telefono: formValues.telefono?.trim() || '',
        direccion: formValues.direccion?.trim() || '',
        experiencias: (formValues.experiencias || []).map((exp: any) => ({
          ...exp,
          fechaInicio: exp.fechaInicio ? new Date(exp.fechaInicio).toISOString().split('T')[0] : null,
          fechaFin: exp.fechaFin ? new Date(exp.fechaFin).toISOString().split('T')[0] : null
        })),
        educacion: (formValues.educacion || []).map((edu: any) => ({
          ...edu,
          fechaInicio: edu.fechaInicio ? new Date(edu.fechaInicio).toISOString().split('T')[0] : null,
          fechaFin: edu.fechaFin ? new Date(edu.fechaFin).toISOString().split('T')[0] : null
        })),
        habilidades: formValues.habilidades || []
      };

      console.log('Enviando perfil actualizado:', updatedProfile);

      this.profileService.updateUserProfile(updatedProfile)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (profile) => {
            this.updateFormWithProfile(profile);
            this.toggleEditing();
            this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Error al actualizar el perfil:', error);
            let errorMessage = 'Error al actualizar el perfil';
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.errors) {
              // Si hay múltiples errores de validación, mostrarlos
              errorMessage = Object.values(error.error.errors).join('\n');
            }
            this.snackBar.open(errorMessage, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Mostrar todos los errores de validación
      const errores: string[] = [];
      Object.keys(this.perfilForm.controls).forEach(key => {
        const control = this.perfilForm.get(key);
        if (control?.errors) {
          errores.push(`${key}: ${Object.keys(control.errors).join(', ')}`);
        }
      });

      this.snackBar.open(
        'Por favor, complete todos los campos requeridos correctamente:\n' + errores.join('\n'),
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  resetForm(): void {
    this.loadUserProfile();
    this.isEditing = false;
    Object.keys(this.perfilForm.controls).forEach(key => {
      this.perfilForm.get(key)?.disable();
    });
  }

  conectarLinkedIn(): void {
    this.linkedInConectado = !this.linkedInConectado;
    const mensaje = this.linkedInConectado ?
      'Cuenta de LinkedIn conectada exitosamente' :
      'Cuenta de LinkedIn desconectada';

    // this.messageService.showSuccess(mensaje);
  }

  // Método para convertir texto en array de letras
  splitLabel(text: string): { char: string, delay: string }[] {
    return text.split('').map((char, index) => ({
        char,
        delay: `${index * 50}ms`
    }));
  }

  // Método para formatear el CUIT al perder el foco
  onCuitBlur(): void {
    const cuitControl = this.perfilForm.get('cuit');
    if (cuitControl && cuitControl.value) {
      const numericValue = cuitControl.value.replace(/\D/g, '');
      if (numericValue.length === 11) {
        const formattedValue = `${numericValue.substr(0,2)}-${numericValue.substr(2,8)}-${numericValue.substr(10,1)}`;
        cuitControl.setValue(formattedValue, { emitEvent: false });
      }
    }
  }
}
