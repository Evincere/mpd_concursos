import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

// Servicios
import { LoggingService } from '@core/services/logging/logging.service';
import { ProfileService } from '@core/services/profile/profile.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { AuthService } from '@core/services/auth/auth.service';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { PerfilStateService } from './services/perfil-state.service';
import { ValidationService } from '@shared/services/validation.service';

// Tipos y modelos
import { TabKey, ProfileTab } from './models/types';
import { UserProfile, ExperienciaData, HabilidadData } from '@core/models/perfil.model';

// Interfaz temporal para Experiencia (será removida con la reimplementación)
interface Experiencia {
  id?: string;
  puesto: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  actual?: boolean;
  ubicacion?: string;
}


// Componentes personalizados
import { CustomConfirmDialogComponent } from '@shared/components/custom-confirm-dialog/custom-confirm-dialog.component';
import { DocumentoViewerComponent } from '@shared/components/documento-viewer/documento-viewer.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { DocumentacionTabComponent } from './components/documentacion-tab/documentacion-tab.component';
import { PerfilPersonalInfoComponent } from './components/perfil-personal-info/perfil-personal-info.component';
// CV Component - New implementation
import { CvContainerComponent } from './components/cv/cv-container.component';
import { PerfilLinkedInComponent } from './components/perfil-linkedin/perfil-linkedin.component';

const TAB_KEYS = {
  INFO: 'info' as TabKey,
  CV: 'cv' as TabKey,
  DOCS: 'docs' as TabKey,
  LINKEDIN: 'linkedin' as TabKey
};

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
    PerfilPersonalInfoComponent,
    CvContainerComponent,
    PerfilLinkedInComponent
  ]
})
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fechaInicio') fechaInicio!: ElementRef;
  @ViewChild('fechaFin') fechaFin!: ElementRef;
  perfilForm!: FormGroup;
  userProfile: UserProfile | null = null;

  fotoPerfil = 'assets/images/default-avatar.png';
  linkedInConectado = false;
  linkedInTab = true;
  isEditing = false; // Corregida la doble declaración
  isLoading = false;
  minDate: Date = new Date(1900, 0, 1);
  maxDate: Date = new Date();

  private subscriptions: Subscription[] = [];

  mostrarModalExperiencia = false;

  private readonly tabDefinitions: ProfileTab[] = [
    { key: TAB_KEYS.INFO, label: 'Información Personal', icon: 'fa-user' },
    { key: TAB_KEYS.CV, label: 'Curriculum Vitae', icon: 'fa-file-alt' },
    { key: TAB_KEYS.DOCS, label: 'Documentación', icon: 'fa-folder' },
    { key: TAB_KEYS.LINKEDIN, label: 'LinkedIn', icon: 'fa-linkedin' }
  ];

  get tabs(): ProfileTab[] {
    return this.tabDefinitions.filter(tab =>
      tab.key !== TAB_KEYS.LINKEDIN || this.linkedInTab
    );
  }

  selectedTab: TabKey = TAB_KEYS.INFO;
  selectedTabIndex = 0;

  /**
   * Cambia la pestaña activa
   * @param tabKey Clave de la pestaña a activar
   */
  changeTab(tabKey: TabKey): void {
    if (this.tabDefinitions.some(tab => tab.key === tabKey)) {
      this.selectedTab = tabKey;
      this.selectedTabIndex = this.tabDefinitions.findIndex(tab => tab.key === tabKey);
      // Diferir la detección de cambios al siguiente ciclo
      setTimeout(() => this.cdr.markForCheck(), 0);
    }
  }

  /**
   * Maneja el cambio de pestaña por índice
   * @param index Índice de la pestaña
   */
  onTabChange(index: number): void {
    const availableTabs = this.tabs;
    if (index >= 0 && index < availableTabs.length) {
      this.selectedTab = availableTabs[index].key;
      this.selectedTabIndex = index;
      // Diferir la detección de cambios al siguiente ciclo
      setTimeout(() => this.cdr.markForCheck(), 0);
    }
  }

  /**
   * Verifica si una pestaña está activa
   * @param tabKey Clave de la pestaña a verificar
   * @returns true si la pestaña está activa
   */
  isTabActive(tabKey: TabKey): boolean {
    return this.selectedTab === tabKey;
  }

  /**
   * Obtiene el ícono de una pestaña
   * @param tabKey Clave de la pestaña
   * @returns Clase del ícono FontAwesome
   */
  getTabIcon(tabKey: TabKey): string {
    const tab = this.tabDefinitions.find(t => t.key === tabKey);
    return tab?.icon || 'fa-circle';
  }

  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private profileService: ProfileService,

    private authService: AuthService,
    private dialog: CustomDialogService,
    private notification: CustomNotificationService,
    private perfilState: PerfilStateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private loggingService: LoggingService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserProfile(); // Cargar perfil al iniciar el componente
    this.initializeActiveTab(); // Inicializar la pestaña activa desde la URL
  }

  private initializeActiveTab(): void {
    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      this.route.queryParams.subscribe(params => {
        if (params['activeTab']) {
          const activeTabParam = params['activeTab'];
          const tabKeyMap: Record<string, TabKey> = {
            personal: TAB_KEYS.INFO,
            cv: TAB_KEYS.CV,
            docs: TAB_KEYS.DOCS,
            linkedin: TAB_KEYS.LINKEDIN
          };

          const tabKey = tabKeyMap[activeTabParam];
          if (tabKey) {
            this.changeTab(tabKey);
          } else {
            console.warn(`[PerfilComponent] No se encontró la pestaña '${activeTabParam}'`);
          }
        }
      })
    );
  }

  private initializeForms(): void {
    this.perfilForm = this.fb.group({
      username: [''],
      email: [''],
      dni: ['', [Validators.pattern('^[0-9]{8}$')]],
      cuit: ['', [Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]{1}$')]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      experiencias: this.fb.array([]),
      habilidades: this.fb.array([])
    });

    this.perfilForm.get('username')?.disable();
    this.perfilForm.get('email')?.disable();

    const cuitControl = this.perfilForm.get('cuit');
    if (cuitControl) {
      this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
        cuitControl.valueChanges.subscribe(value => {
        if (value) {
          const numericValue = value.replace(/\D/g, '');
          if (numericValue.length > 0) {
            let formattedValue = numericValue;
            if (numericValue.length >= 2) {
              formattedValue = numericValue.substring(0, 2);
              if (numericValue.length > 2) {
                formattedValue += '-' + numericValue.substring(2);
              }
              if (numericValue.length > 10) {
                formattedValue = formattedValue.substring(0, 11) + '-' + numericValue.substring(10, 11);
              }
            }
            if (formattedValue !== value) {
              this.perfilForm.get('cuit')?.setValue(formattedValue, { emitEvent: false });
            }
          }
        }
      })
      );
    }
  }

  // Cargar datos del perfil con mejor gestión de rendimiento
  loadUserProfile(): void {
    this.isLoading = true;

    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      this.profileService.getUserProfile().pipe(
        finalize(() => this.isLoading = false) // Mover finalize aquí para asegurar que siempre se ejecuta
      ).subscribe({
        next: (profile) => {
          this.userProfile = profile; // Almacenar el perfil completo
          this.cargarDatosBasicos(profile);
          this.cargarPerfilForm(profile); // Llamar para cargar el formulario completo

          // Cargar datos adicionales en un segundo ciclo para evitar bloqueos
          window.requestAnimationFrame(() => {
            if (profile.id) {
              // CV data will be handled by new CV component
              this.cdr.detectChanges();
            }
          });

          // Asegurar que los campos estén en el estado correcto (deshabilitados si no está editando)
          if (!this.isEditing) {
            this.deshabilitarCamposEditables();
          }

          this.cdr.detectChanges(); // Forzar detección de cambios
        },
        error: (error: Error) => {
          console.error('Error loading user profile', error);
          this.notification.error('Error al cargar el perfil');
          this.cdr.detectChanges(); // Forzar detección de cambios
        }
      })
    );
  }

  // Cargar solo los datos básicos del perfil
  private cargarDatosBasicos(profile: UserProfile): void {
    if (!profile) {
      console.error('Profile es null o undefined');
      return;
    }

    // Actualizar campos deshabilitados individualmente
    this.perfilForm.get('username')?.setValue(profile.username || '', { emitEvent: false });
    this.perfilForm.get('email')?.setValue(profile.email || '', { emitEvent: false });

    // Actualizar valores básicos del formulario para campos habilitados
    this.perfilForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      dni: profile.dni || '',
      cuit: profile.cuit || '',
      telefono: profile.telefono || '',
      direccion: profile.direccion || '',
    }, { emitEvent: false });

    this.cdr.markForCheck();
  }



  // Método optimizado para actualizar el array de experiencias
  private actualizarArrayExperiencias(profile: UserProfile): void {
    const experiencias = profile.experiencias as ExperienciaData[];
    const experienciasArray = this.perfilForm.get('experiencias') as FormArray;

    experienciasArray.clear(); // Limpiar experiencias existentes

    if (experiencias && experiencias.length > 0) {
      experiencias.forEach((exp) => {
        // Mapeo de ExperienciaData a Experiencia
        const experiencia: Experiencia = {
          id: exp.id,
          puesto: exp.puesto || exp.cargo || '',
          empresa: exp.empresa,
          descripcion: exp.descripcion,
          fechaInicio: typeof exp.fechaInicio === 'string' ? exp.fechaInicio : exp.fechaInicio?.toISOString().split('T')[0] || '',
          fechaFin: typeof exp.fechaFin === 'string' ? exp.fechaFin : exp.fechaFin?.toISOString().split('T')[0],
          actual: exp.actual,
          ubicacion: exp.ubicacion
        };
        experienciasArray.push(this.createExperienciaFormGroup(experiencia));
      });
    }
  }

  // Método optimizado para actualizar el array de habilidades
  private actualizarArrayHabilidades(profile: UserProfile): void {
    const habilidades = profile.habilidades as HabilidadData[];
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;

    habilidadesArray.clear(); // Limpiar habilidades existentes

    if (habilidades && habilidades.length > 0) {
      this.cdr.detach(); // Desactivar detección de cambios temporalmente para optimizar
      try {
        habilidades.forEach((hab: HabilidadData) => {
          habilidadesArray.push(this.createHabilidadFormGroup(hab));
        });
      } finally {
        this.cdr.reattach(); // Reactivar detección de cambios
      }
    }
  }

  private createExperienciaFormGroup(experiencia?: Experiencia): FormGroup {
    return this.fb.group({
      id: [experiencia?.id || null],
      puesto: [experiencia?.puesto || '', Validators.required],
      cargo: [experiencia?.puesto || '', Validators.required], // Agregar campo cargo para compatibilidad
      empresa: [experiencia?.empresa || '', Validators.required],
      fechaInicio: [experiencia?.fechaInicio ? new Date(experiencia.fechaInicio) : null, Validators.required],
      fechaFin: [experiencia?.fechaFin ? new Date(experiencia.fechaFin) : null],
      descripcion: [experiencia?.descripcion || '', Validators.required],
      ubicacion: [experiencia?.ubicacion || '']
    });
  }

  toggleEditing(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.habilitarCamposEditables();
    } else {
      this.deshabilitarCamposEditables();
    }
  }

  private habilitarCamposEditables(): void {
    const editableFields = ['firstName', 'lastName', 'dni', 'cuit', 'telefono', 'direccion'];
    editableFields.forEach(field => {
      const control = this.perfilForm.get(field);
      if (control) {
        control.enable();
      }
    });
  }

  private deshabilitarCamposEditables(): void {
    const editableFields = ['firstName', 'lastName', 'dni', 'cuit', 'telefono', 'direccion'];
    editableFields.forEach(field => {
      const control = this.perfilForm.get(field);
      if (control) {
        control.disable();
      }
    });
  }

  // Methods for child components
  onEditToggle(): void {
    this.toggleEditing();
  }

  onFormSave(): void {
    // Sanitizar el formulario antes de validar
    ValidationService.sanitizeFormGroup(this.perfilForm);

    if (this.perfilForm.valid) {
      this.guardarPerfil();
    } else {
      this.marcarCamposInvalidos(this.perfilForm);
      this.notification.error('Por favor, complete todos los campos obligatorios antes de guardar.');
    }
  }

  onFormReset(): void {
    this.resetForm();
  }

  // Getters para acceder a los FormArrays
  get experiencias() {
    return this.perfilForm.get('experiencias') as FormArray;
  }

  // Getter que devuelve una copia del array para forzar detección de cambios
  get experienciasArray(): FormGroup[] {
    return [...(this.perfilForm.get('experiencias') as FormArray).controls] as FormGroup[];
  }

  get habilidades() {
    return this.perfilForm.get('habilidades') as FormArray;
  }

  // Método para crear un nuevo grupo de habilidad
  createHabilidadFormGroup(habilidad?: HabilidadData): FormGroup {
    return this.fb.group({
      nombre: [habilidad?.nombre || '', Validators.required],
      nivel: [habilidad?.nivel || '', Validators.required]
    });
  }

  // Métodos para agregar elementos
  agregarExperiencia(): void {
    if (!this.userProfile || !this.userProfile.id) {
      this.notification.error('No se puede agregar experiencia sin datos de usuario. Por favor, espere a que cargue el perfil.');
      return;
    }

    if (!this.esIdUsuarioValido()) {
      this.notification.error('No se puede agregar experiencia: ID de usuario inválido.');
      console.error(`ID de usuario inválido: ${this.usuarioId}`);
      return;
    }

    this.mostrarModalExperiencia = true;
    this.cdr.markForCheck();
  }

  cerrarModalExperiencia(): void {
    this.mostrarModalExperiencia = false;
    this.cdr.markForCheck();
  }

  agregarHabilidad(): void {
    this.habilidades.push(this.createHabilidadFormGroup());
  }

  // Métodos para eliminar elementos
  eliminarExperiencia(index: number): void {
    const experiencias = this.perfilForm.get('experiencias') as FormArray;
    const experiencia = experiencias.at(index).value as ExperienciaData;

    // Si no tiene ID, solo eliminar del FormArray
    if (!experiencia.id) {
      experiencias.removeAt(index);
      this.notification.success('Experiencia eliminada correctamente');
      return;
    }

    // Configurar y abrir el diálogo de confirmación
    const dialogRef = this.dialog.open(CustomConfirmDialogComponent, {
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro que desea eliminar esta experiencia laboral?',
        cancelText: 'Cancelar',
        confirmText: 'Eliminar'
      }
    });

    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      dialogRef.afterClosed().subscribe((confirmed: unknown) => {
        if (confirmed) {
          // Experience deletion handled locally (backend operations in CvSimpleComponent)
          experiencias.removeAt(index);
          this.notification.success('Experiencia eliminada correctamente');
          this.cdr.detectChanges();
        }
      })
    );
  }

  eliminarHabilidad(index: number): void {
    this.habilidades.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPerfil = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid && this.userProfile?.id) { // Asegurarse de tener un ID de usuario
      const formValues = this.perfilForm.value;

      const perfilData = ValidationService.sanitizeObject({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        dni: formValues.dni,
        cuit: formValues.cuit ? formValues.cuit.replace(/\D/g, '') : '', // Remover guiones del CUIT
        telefono: formValues.telefono,
        direccion: formValues.direccion,
        experiencias: (formValues.experiencias || []).map((exp: any) => ({
          id: exp.id, // Incluir ID para actualizaciones
          empresa: exp.empresa,
          cargo: exp.puesto,
          puesto: exp.puesto,
          fechaInicio: exp.fechaInicio ? (typeof exp.fechaInicio === 'string' ? exp.fechaInicio : exp.fechaInicio.toISOString().split('T')[0]) : '',
          fechaFin: exp.fechaFin ? (typeof exp.fechaFin === 'string' ? exp.fechaFin : exp.fechaFin.toISOString().split('T')[0]) : '',
          descripcion: exp.descripcion,
          actual: exp.actual ?? false,
          ubicacion: exp.ubicacion ?? ''
        })),
        habilidades: (formValues.habilidades || []).map((hab: HabilidadData) => ({
          nombre: hab.nombre,
          nivel: hab.nivel
        }))
      });

      this.isLoading = true; // Iniciar carga
      this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
        this.profileService.updateUserProfile(perfilData).pipe(
          finalize(() => this.isLoading = false) // Finalizar carga
        ).subscribe({
          next: (profile: UserProfile) => {
            this.notification.success('Perfil actualizado correctamente');
            this.userProfile = profile;
            this.cargarPerfilForm(profile);
            this.isEditing = false;
            this.deshabilitarCamposEditables(); // Usar método para deshabilitar campos
            this.perfilForm.markAsPristine();
            this.cdr.detectChanges(); // Forzar detección de cambios
          },
          error: (error: Error) => {
            console.error('Error al actualizar el perfil', error);
            this.notification.error('Error al actualizar el perfil');
            this.cdr.detectChanges(); // Forzar detección de cambios
          }
        })
      );
    } else {
      this.marcarCamposInvalidos(this.perfilForm);
      this.notification.error('Por favor, complete todos los campos obligatorios antes de guardar.');
    }
  }

  resetForm(): void {
    this.loadUserProfile(); // Recargar el perfil para restablecer el formulario
    this.isEditing = false;
    this.deshabilitarCamposEditables();
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  conectarLinkedIn(): void {
    this.linkedInConectado = !this.linkedInConectado;
    const message = this.linkedInConectado ?
      'Cuenta de LinkedIn conectada exitosamente' :
      'Cuenta de LinkedIn desconectada';
    this.notification.success(message); // Usar notificación en lugar de messageService
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
        const formattedValue = `${numericValue.substr(0, 2)}-${numericValue.substr(2, 8)}-${numericValue.substr(10, 1)}`;
        cuitControl.setValue(formattedValue, { emitEvent: false });
      }
    }
  }

  /**
   * Abre un diálogo para cargar un certificado para una experiencia laboral
   * @param experienciaIndex Índice de la experiencia en el FormArray
   */
  cargarCertificado(experienciaIndex: number): void {
    // Crear un input file oculto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Escuchar el evento de cambio de archivo
    fileInput.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.isLoading = true;
        // Crear FormData para el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipoDocumentoId', 'certificado_laboral'); // Asumiendo que existe este tipo
        formData.append('descripcion', `Certificado laboral - ${this.experiencias.at(experienciaIndex).get('empresa')?.value}`);

        // TODO: Implementar subida de documentos cuando el servicio esté disponible
        this.isLoading = false;
        document.body.removeChild(fileInput);
        this.notification.info('Funcionalidad de subida de certificados en desarrollo');
        this.cdr.detectChanges();
      } else {
        document.body.removeChild(fileInput); // Limpiar el input si no se selecciona archivo
      }
    });

    fileInput.click(); // Abrir el selector de archivo
  }

  /**
   * Obtiene el ID del usuario como UUID (string)
   */
  get usuarioId(): string {
    // Es crucial que userProfile esté cargado para obtener el ID
    if (!this.userProfile || !this.userProfile.id) {
        return '';
    }
    return String(this.userProfile.id);
  }

  /**
   * Verifica si el ID de usuario es válido (asumiendo que un ID vacío o null no es válido)
   */
  public esIdUsuarioValido(): boolean {
    return !!this.usuarioId && this.usuarioId.length > 0;
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones para evitar memory leaks
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  // Education methods removed - will be handled by new CV component

  // Education type verification methods removed - will be handled by new CV component

  // Método para cargar el perfil en el formulario
  cargarPerfilForm(profile: UserProfile): void {
    // Actualizar campos deshabilitados individualmente
    const disabledFields = ['username', 'email'];
    disabledFields.forEach(key => {
      const control = this.perfilForm.get(key);
      if (control && profile[key as keyof UserProfile] !== undefined) {
        control.setValue(profile[key as keyof UserProfile] || '', { emitEvent: false });
        control.markAsPristine();
      }
    });

    // Actualizar campos habilitados
    const enabledFields = ['dni', 'cuit', 'firstName', 'lastName', 'telefono', 'direccion'];
    enabledFields.forEach(key => {
      const control = this.perfilForm.get(key);
      if (control && profile[key as keyof UserProfile] !== undefined) {
        control.setValue(profile[key as keyof UserProfile] || '', { emitEvent: false });
        control.markAsPristine();
      }
    });

    // Actualizar arrays de forma optimizada
    this.actualizarArrayExperiencias(profile);
    this.actualizarArrayHabilidades(profile);
    this.cdr.detectChanges(); // Forzar detección de cambios después de actualizar los arrays
  }

  // Método para marcar todos los campos inválidos
  marcarCamposInvalidos(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.marcarCamposInvalidos(control);
      } else if (control) {
        control.markAsTouched();
        control.markAsDirty(); // También marcar como dirty para mostrar errores de validación
        this.cdr.markForCheck(); // Forzar detección para actualizar el estado visual
      }
    });
  }

  /**
   * Maneja el evento cuando se guarda una experiencia
   * @param experiencia La experiencia que fue guardada
   */
  onExperienciaGuardada(experiencia: any): void {
    console.log('Experiencia guardada:', experiencia);

    // Cerrar el modal
    this.mostrarModalExperiencia = false;

    // Recargar el perfil para mostrar la nueva experiencia
    this.loadUserProfile();

    // Mostrar notificación de éxito
    this.notification.success('Experiencia guardada correctamente');

    // Forzar detección de cambios
    this.cdr.markForCheck();
  }

  // Education deletion method removed - will be handled by new CV component
}
