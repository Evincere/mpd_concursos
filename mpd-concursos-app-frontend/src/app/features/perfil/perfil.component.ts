import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

// Servicios
import { ProfileService } from '@core/services/profile/profile.service';
import { ExperienceService } from '@core/services/experience/experience.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { EducacionService } from '@core/services/educacion/educacion.service';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { PerfilStateService } from './services/perfil-state.service';

// Tipos y modelos
import { TabKey, ProfileTab } from './models/types';
import { UserProfile, ExperienciaData, HabilidadData } from '@core/models/perfil.model';
import { Educacion, TipoEducacion } from '@core/models/educacion.model';
import { Experiencia } from '@core/models/experiencia.model';
// Intento corregir el import de Habilidad, si no existe lo comento
// import { Habilidad } from '@core/models/habilidad.model';

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
import { EducacionContainerComponent } from './components/educacion/educacion-container/educacion-container.component';
import { ExperienciaContainerComponent } from './components/experiencia/experiencia-container/experiencia-container.component';

// New Child Components
import { PerfilPersonalInfoComponent } from './components/perfil-personal-info/perfil-personal-info.component';
import { PerfilCvComponent } from './components/perfil-cv/perfil-cv.component';
import { PerfilLinkedInComponent } from './components/perfil-linkedin/perfil-linkedin.component';

// Defino TAB_KEYS y los tipos ExperienciaData y Habilidad si no existen en los imports
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
    EducacionContainerComponent,
    ExperienciaContainerComponent,
    PerfilPersonalInfoComponent,
    PerfilCvComponent,
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
  isEditing = false;
  isLoading = false;
  minDate: Date = new Date(1900, 0, 1);
  maxDate: Date = new Date();

  // Gestionar todas las suscripciones para poder limpiarlas
  private subscriptions: Subscription[] = [];

  // Variables para el modal de educación
  mostrarModalEducacion = false;
  educacionList: Educacion[] = [];
  // Variables para el modal de experiencia
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
  selectedTabIndex = 0; // Add numeric index for CustomTabsComponent

  /**
   * Cambia la pestaña activa
   * @param tabKey Clave de la pestaña a activar
   */
  changeTab(tabKey: TabKey): void {
    if (this.tabDefinitions.some(tab => tab.key === tabKey)) {
      this.selectedTab = tabKey;
      this.selectedTabIndex = this.tabDefinitions.findIndex(tab => tab.key === tabKey);
      this.cdr.markForCheck();
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
      this.cdr.markForCheck();
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
    private educacionService: EducacionService, 
    private experienceService: ExperienceService,
    private dialog: CustomDialogService,
    private notification: CustomNotificationService,
    private perfilState: PerfilStateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Consola para debug
    console.log('PerfilComponent inicializado');

    // Cargar el perfil de usuario
    this.loadUserProfile();
  }

  private initializeActiveTab(): void {
    // Verificar si hay un parámetro activeTab en la URL
    this.route.queryParams.subscribe(params => {
      if (params['activeTab']) {
        console.log('[PerfilComponent] Parámetro activeTab detectado:', params['activeTab']);

        // Buscar la pestaña por su etiqueta
        const matchingTab = this.tabDefinitions.find(tab => 
          tab.label === params['activeTab'] || tab.key === params['activeTab']
        );

        if (matchingTab) {
          console.log(`[PerfilComponent] Activando pestaña ${matchingTab.label}`);
          this.selectedTab = matchingTab.key;
          this.cdr.detectChanges();
        } else {
          console.warn(`[PerfilComponent] No se encontró la pestaña '${params['activeTab']}'`);
        }
      }
    });
  }

  private initializeForms() {
    this.perfilForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      dni: ['', [Validators.pattern('^[0-9]{8}$')]],
      cuit: ['', [Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]{1}$')]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      telefono: [{ value: '', disabled: true }],
      direccion: [{ value: '', disabled: true }],
      experiencias: this.fb.array([]),
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

  // Cargar datos del perfil con mejor gestión de rendimiento
  loadUserProfile(): void {
    this.isLoading = true;
    console.log('Iniciando carga del perfil de usuario');

    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        console.log('Perfil recibido:', profile);

        // Guardar la referencia al perfil del usuario
        this.userProfile = profile;

        // Cargar los datos básicos primero para una respuesta rápida
        this.cargarDatosBasicos(profile);

        // Cargar los arrays en un segundo ciclo para evitar bloqueos
        window.requestAnimationFrame(() => {
          console.log('Actualizando arrays de experiencias y habilidades');
          this.cargarDatosAvanzados(profile);

          // Cargar educación después de los datos básicos
          if (profile.id) {
            this.educacionService.cargarEducacion(profile.id).subscribe(
              respuesta => {
                if (respuesta.exito && respuesta.data) {
                  this.educacionList = respuesta.data;
                  console.log('Lista de educación actualizada:', this.educacionList);
                  this.cdr.detectChanges(); // Forzar detección de cambios
                } else {
                  console.error('Error al cargar educación:', respuesta.error);
                }
              },
              error => {                console.error('Error al cargar educación:', error);
                this.notification.error('No se pudieron cargar los registros de educación');
              }
            );
          }
        });

        // Marcar como no cargando después de cargar los datos básicos
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },      error: (error: Error) => {
        console.error('Error loading user profile', error);
        this.notification.error('Error al cargar el perfil');
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      }
    });
  }

  // Cargar solo los datos básicos del perfil
  private cargarDatosBasicos(profile: UserProfile): void {
    if (!profile) return;

    // Actualizar valores básicos del formulario
    this.perfilForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      username: profile.username || '',
      dni: profile.dni || '',
      cuit: profile.cuit || '',
      telefono: profile.telefono || '',
      direccion: profile.direccion || '',
    }, { emitEvent: false });

    // Notificar que los datos básicos están listos
    this.cdr.markForCheck();
  }

  // Cargar datos más complejos del perfil
  private cargarDatosAvanzados(profile: UserProfile): void {
    if (!profile) return;

    console.log('Cargando datos avanzados del perfil');

    // Actualizar experiencias y habilidades
    this.actualizarArrayExperiencias(profile);
    this.actualizarArrayHabilidades(profile);

    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  private updateFormWithProfile(profile: UserProfile): void {
    if (!profile) return;

    // Actualizar valores básicos del formulario
    this.perfilForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      username: profile.username || '',
      dni: profile.dni || '',
      cuit: profile.cuit || '',
      telefono: profile.telefono || '',
      direccion: profile.direccion || '',
    });

    // Actualizar arrays de forma optimizada
    this.actualizarArrayExperiencias(profile);
    this.actualizarArrayHabilidades(profile);

    // Actualizar UI
    this.cdr.markForCheck();
  }

  // Método optimizado para actualizar el array de experiencias
  private actualizarArrayExperiencias(profile: UserProfile): void {
    const experiencias = profile.experiencias as ExperienciaData[];
    const experienciasArray = this.perfilForm.get('experiencias') as FormArray;
    experienciasArray.clear();
    if (experiencias.length > 0) {
      experiencias.forEach(exp => {
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
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;

    if (profile.habilidades && Array.isArray(profile.habilidades)) {
      // Desactivar temporalmente cambios
      this.cdr.detach();

      try {
        habilidadesArray.clear();
        profile.habilidades.forEach((hab: HabilidadData) => {
          habilidadesArray.push(this.createHabilidadFormGroup(hab));
        });
      } finally {
        this.cdr.reattach();
      }
    }
  }

  private createExperienciaFormGroup(experiencia?: Experiencia): FormGroup {
    return this.fb.group({
      id: [experiencia?.id || null],
      puesto: [experiencia?.puesto || '', Validators.required],
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

  // Methods for child components
  onEditToggle(): void {
    this.toggleEditing();
  }

  onFormSave(): void {
    if (this.perfilForm.valid) {
      this.guardarPerfil();
    }
  }

  onFormReset(): void {
    this.resetForm();
  }

  // Getters para acceder a los FormArrays
  get experiencias() {
    return this.perfilForm.get('experiencias') as FormArray;
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

    // El ID puede ser un número o un UUID, ambos son válidos
    if (!this.esIdUsuarioValido()) {
      this.notification.error('No se puede agregar experiencia: ID de usuario inválido.');
      console.error(`ID de usuario inválido: ${this.usuarioId}`);
      return;
    }

    this.mostrarModalExperiencia = true;
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

    dialogRef.afterClosed().subscribe((confirmed: unknown) => {
      if (confirmed) {
        this.experienceService.deleteExperience(experiencia.id!)
          .pipe(finalize(() => this.cdr.markForCheck()))
          .subscribe({
            next: () => {
              experiencias.removeAt(index);
              this.notification.success('Experiencia eliminada correctamente');
            },
            error: (error) => {
              console.error('Error al eliminar experiencia:', error);
              this.notification.error('Error al eliminar la experiencia');
            }
          });
      }
    });
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
    if (this.perfilForm.valid) {
      this.isLoading = true;

      const formValues = this.perfilForm.value;

      const updatedProfile: Partial<UserProfile> = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        dni: formValues.dni,
        cuit: formValues.cuit,
        telefono: formValues.telefono,
        direccion: formValues.direccion,
        experiencias: (formValues.experiencias || []).map((exp: any) => ({
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
      };

      this.profileService.updateUserProfile(updatedProfile)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (profile) => {
            this.notification.success('Perfil actualizado con éxito');

            // Actualizar el perfil
            this.userProfile = profile;

            // Actualizar el formulario con los datos del perfil
            this.cargarPerfilForm(profile);

            this.perfilForm.markAsPristine();
          },
          error: (error: Error) => {
            console.error('Error al actualizar el perfil', error);
            this.notification.error('Error al actualizar el perfil');
          }
        });
    } else {
      this.notification.error('Por favor, complete todos los campos obligatorios antes de guardar.');
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
    // const mensaje = this.linkedInConectado ?
    //   'Cuenta de LinkedIn conectada exitosamente' :
    //   'Cuenta de LinkedIn desconectada';

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

        // ... existing code ...
      }
    });
  }

  /**
   * Obtiene el ID del usuario como UUID (string)
   */
  get usuarioId(): string {
    if (!this.userProfile || !this.userProfile.id) return '';
    return String(this.userProfile.id);
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

  // Método para mostrar el modal de educación
  agregarEducacion(): void {
    if (!this.userProfile || !this.userProfile.id) {
      this.notification.error('No se puede agregar educación sin datos de usuario. Por favor, espere a que cargue el perfil.');
      return;
    }

    // El ID puede ser un número o un UUID, ambos son válidos ahora
    if (!this.esIdUsuarioValido()) {
      this.notification.error('No se puede agregar educación: ID de usuario inválido.');
      console.error(`ID de usuario inválido: ${this.usuarioId}`);
      return;
    }

    this.mostrarModalEducacion = true;
    this.cdr.markForCheck();
  }

  // Método para cerrar el modal de educación
  cerrarModalEducacion(): void {
    this.mostrarModalEducacion = false;
    this.cdr.markForCheck();
  }

  // Método para manejar la educación guardada
  onEducacionGuardada(educacion: Educacion): void {
    // Log para depuración
    console.log('Educación guardada recibida:', educacion);

    // Verificar si la educación es válida antes de añadirla
    if (!educacion) {
      console.error('Error: Se recibió un objeto de educación nulo o indefinido');
      this.notification.error('Error al guardar educación: datos inválidos');
      return;
    }

    // Asegurarse de que el objeto tiene todas las propiedades base necesarias
    if (!educacion.tipo || !educacion.titulo || !educacion.institucion) {
      console.warn('Advertencia: El objeto de educación está incompleto', educacion);
    }

    // Actualizar la lista de educación añadiendo el nuevo registro
    if (!this.educacionList) {
      this.educacionList = [];
    }

    // Normalizar las propiedades específicas si es necesario antes de añadirlo
    const educacionNormalizada = this.normalizarEducacion(educacion);
    this.educacionList.push(educacionNormalizada);
    console.log('Lista de educación actualizada:', this.educacionList);

    // Mostrar notificación
    this.notification.success('Educación guardada exitosamente');

    // Cerrar el modal
    this.cerrarModalEducacion();

    // Forzar detección de cambios
    this.cdr.markForCheck();
  }

  /**
   * Verifica si la educación es de tipo Carrera de Nivel Superior o Carrera de Grado
   */
  private esCarreraSuperiorOGrado(educacion: Educacion): boolean {
    return educacion.tipo === TipoEducacion.CARRERA_NIVEL_SUPERIOR ||
           educacion.tipo === TipoEducacion.CARRERA_GRADO;
  }

  /**
   * Verifica si la educación es de tipo Posgrado (especialización, maestría o doctorado)
   */
  private esPosgrado(educacion: Educacion): boolean {
    return educacion.tipo === TipoEducacion.POSGRADO_ESPECIALIZACION ||
           educacion.tipo === TipoEducacion.POSGRADO_MAESTRIA ||
           educacion.tipo === TipoEducacion.POSGRADO_DOCTORADO;
  }

  /**
   * Verifica si la educación es de tipo Diplomatura o Curso de Capacitación
   */
  private esDiplomaturaOCurso(educacion: Educacion): boolean {
    return educacion.tipo === TipoEducacion.DIPLOMATURA ||
           educacion.tipo === TipoEducacion.CURSO_CAPACITACION;
  }

  /**
   * Verifica si la educación es de tipo Actividad Científica
   */
  private esActividadCientifica(educacion: Educacion): boolean {
    return educacion.tipo === TipoEducacion.ACTIVIDAD_CIENTIFICA;
  }

  /**
   * Normaliza un objeto de educación para asegurar que sus propiedades específicas
   * son accesibles directamente en el objeto base
   */
  private normalizarEducacion(educacion: Educacion): Educacion {
    console.log('Normalizando educación:', educacion);

    // Crear un objeto base con todas las propiedades
    const educacionNormalizada: any = {
      id: educacion.id,
      tipo: educacion.tipo,
      estado: educacion.estado,
      titulo: educacion.titulo,
      institucion: educacion.institucion,
      fechaEmision: educacion.fechaEmision,
      documentoPdf: educacion.documentoPdf
    };

    // Copiar todas las propiedades del objeto original que no sean undefined
    Object.keys(educacion).forEach(key => {
      if (educacion[key as keyof Educacion] !== undefined &&
          !['id', 'tipo', 'estado', 'titulo', 'institucion', 'fechaEmision', 'documentoPdf'].includes(key)) {
        (educacionNormalizada as any)[key] = (educacion as any)[key];
      }
    });

    // Buscar propiedades adicionales en cualquier campo "datos" o "propiedadesEspecificas"
    if ((educacion as any).datos) {
      Object.assign(educacionNormalizada, (educacion as any).datos);
    }

    if ((educacion as any).propiedadesEspecificas) {
      Object.assign(educacionNormalizada, (educacion as any).propiedadesEspecificas);
    }

    if ((educacion as any).detalle) {
      Object.assign(educacionNormalizada, (educacion as any).detalle);
    }

    console.log('Educación normalizada:', educacionNormalizada);
    return educacionNormalizada as Educacion;
  }

  // Método para cargar el perfil en el formulario
  cargarPerfilForm(profile: UserProfile): void {
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
      profile.experiencias.forEach((exp: ExperienciaData) => {
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

    // Actualizar habilidades si existen
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;
    if (profile.habilidades && Array.isArray(profile.habilidades)) {
      habilidadesArray.clear();
      profile.habilidades.forEach((hab: HabilidadData) => {
        habilidadesArray.push(this.createHabilidadFormGroup(hab));
      });
    }
  }

  // Método para marcar todos los campos inválidos
  marcarCamposInvalidos(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.marcarCamposInvalidos(control);
      } else if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          if (control.at(i) instanceof FormGroup) {
            this.marcarCamposInvalidos(control.at(i) as FormGroup);
          } else {
            control.at(i).markAsTouched();
          }
        }
      } else if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Abre un visor para visualizar el certificado
   * @param documentoId ID del documento a visualizar
   */
  verCertificado(documentoId: string): void {
    this.isLoading = true;

    // Abrir el diálogo de visualización con el ID del documento
    const dialogRef = this.dialog.open(DocumentoViewerComponent, {
      data: {
        documentoId: documentoId
      }
    });

    this.isLoading = false;
  }

  /**
   * Elimina el certificado asociado a una experiencia laboral
   * @param experienciaIndex Índice de la experiencia en el FormArray
   */
  eliminarCertificado(experienciaIndex: number): void {
    const certificadoId = this.experiencias.at(experienciaIndex).get('certificadoId')?.value;
    if (!certificadoId) return;

    if (confirm('¿Está seguro que desea eliminar este certificado?')) {
      this.isLoading = true;
      this.documentosService.deleteDocumento(certificadoId).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          // Limpiar el ID del certificado en el formulario
          this.experiencias.at(experienciaIndex).patchValue({
            certificadoId: null
          });
          this.notification.success('Certificado eliminado correctamente');
        },
        error: (error: Error) => {
          console.error('Error al eliminar el certificado:', error);
          this.notification.error('Error al eliminar el certificado');
        }
      });
    }
  }

  /**
   * Método para eliminar una educación
   * @param id ID (UUID) de la educación a eliminar
   */
  eliminarEducacion(id: string): void {
    // Validar que el ID no sea nulo o vacío
    if (!id || id.trim() === '') {
      this.notification.error('ID de educación inválido');
      return;
    }

    console.log(`Solicitando eliminar educación con ID (UUID): ${id}`);

    const dialogRef = this.dialog.open(CustomConfirmDialogComponent, {
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro que desea eliminar esta educación? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(_result => {
      if (_result) {
        this.educacionService.eliminarEducacion(id).subscribe({
          next: (response) => {
            if (response.exito) {
              // Filtrar los registros por ID exacto
              this.educacionList = this.educacionList.filter(e => e.id !== id);

              this.notification.success('Educación eliminada exitosamente');
              this.cdr.markForCheck();
            } else {
              this.notification.error(response.mensaje || 'Error al eliminar educación');
            }
          },
          error: (error: Error) => {
            console.error('Error eliminando educación', error);
            this.notification.error('Error al eliminar educación');
          }
        });
      }
    });
  }

  /**
   * Obtiene una propiedad específica de un objeto de educación según su tipo
   * Evita errores de type-checking al acceder propiedades específicas
   */
  getPropiedadEducacion(educacion: Educacion, propiedad: string): any {
    if (!educacion) {
      console.warn('Objeto de educación no definido');
      return null;
    }

    // Mapeo de propiedades en español a inglés y viceversa
    const propiedadesMapeadas: Record<string, string> = {
      'titulo': 'title',
      'title': 'titulo',
      'institucion': 'institution',
      'institution': 'institucion',
      'tipo': 'type',
      'type': 'tipo',
      'estado': 'status',
      'status': 'estado',
      'fechaEmision': 'issueDate',
      'issueDate': 'fechaEmision',
      'duracionAnios': 'durationYears',
      'durationYears': 'duracionAnios',
      'promedio': 'average',
      'average': 'promedio',
      'temaTesis': 'thesisTopic',
      'thesisTopic': 'temaTesis',
      'cargaHoraria': 'hourlyLoad',
      'hourlyLoad': 'cargaHoraria',
      'tuvoEvaluacionFinal': 'hadFinalEvaluation',
      'hadFinalEvaluation': 'tuvoEvaluacionFinal',
      'tipoActividad': 'activityType',
      'activityType': 'tipoActividad',
      'tema': 'topic',
      'topic': 'tema',
      'caracter': 'activityRole',
      'activityRole': 'caracter',
      'lugarFechaExposicion': 'expositionPlaceDate',
      'expositionPlaceDate': 'lugarFechaExposicion',
      'comentarios': 'comments',
      'comments': 'comentarios'
    };

    // 1. Intento directo - Acceder directamente a la propiedad del objeto
    if (propiedad in educacion) {
      const valor = (educacion as any)[propiedad];
      return valor;
    }

    // 2. Intentar con la propiedad mapeada (español a inglés o viceversa)
    const propiedadMapeada = propiedadesMapeadas[propiedad];
    if (propiedadMapeada && propiedadMapeada in educacion) {
      const valor = (educacion as any)[propiedadMapeada];
      return valor;
    }

    // 3. Búsqueda en objetos anidados conocidos
    const objetosAnidados = ['propiedadesEspecificas', 'detalle', 'datos', 'detalles', 'datosAdicionales'];
    for (const objetoAnidado of objetosAnidados) {
      if (educacion[objetoAnidado as keyof Educacion] &&
          typeof educacion[objetoAnidado as keyof Educacion] === 'object') {
        const objeto = educacion[objetoAnidado as keyof Educacion] as any;

        // Verificar la propiedad original
        if (propiedad in objeto) {
          return objeto[propiedad];
        }

        // Verificar la propiedad mapeada
        if (propiedadMapeada && propiedadMapeada in objeto) {
          return objeto[propiedadMapeada];
        }
      }
    }

    // 4. Búsqueda recursiva en otros objetos anidados
    const buscarPropiedadRecursiva = (obj: Record<string, any>, prop: string): any => {
      // Si es un objeto, buscar en sus propiedades
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        // Verificar si el objeto mismo tiene la propiedad
        if (prop in obj) {
          return obj[prop];
        }

        // Verificar la propiedad mapeada
        const propMapeada = propiedadesMapeadas[prop];
        if (propMapeada && propMapeada in obj) {
          return obj[propMapeada];
        }

        // Buscar recursivamente en las propiedades
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const resultado = buscarPropiedadRecursiva(obj[key] as Record<string, any>, prop);
            if (resultado !== undefined) {
              return resultado;
            }

            // También buscar con la propiedad mapeada
            if (propMapeada) {
              const resultadoMapeado = buscarPropiedadRecursiva(obj[key] as Record<string, any>, propMapeada);
              if (resultadoMapeado !== undefined) {
                return resultadoMapeado;
              }
            }
          }
        }
      }
      return undefined;
    };

    const valorEncontrado = buscarPropiedadRecursiva(educacion, propiedad);
    return valorEncontrado !== undefined ? valorEncontrado : null;
  }

  /**
   * Verifica si el ID de usuario es válido para realizar operaciones
   * @returns true si el ID es válido (string UUID no vacío)
   */
  esIdUsuarioValido(): boolean {
    const id = this.usuarioId;
    // Verificar que sea una cadena no vacía
    if (id && id.trim() !== '') {
      return true;
    }
    return false;
  }

  /**
   * Visualiza el documento PDF adjunto a un registro de educación
   * @param educacion Registro de educación con documento adjunto
   */
  verDocumentoEducacion(educacion: Educacion): void {
    if (!educacion || !educacion.documentoPdf) {
      this.notification.error('No hay documento adjunto para este registro');
      return;
    }

    console.log('Visualizando documento de educación:', educacion.documentoPdf);

    // Determinar el ID del documento
    let documentoId: string | null = null;

    // El documento puede estar como ID (string) o como objeto con ID
    if (typeof educacion.documentoPdf === 'string') {
      documentoId = educacion.documentoPdf;
    } else if (educacion.documentoPdf && typeof educacion.documentoPdf === 'object') {
      documentoId = (educacion.documentoPdf as any).id || null;
    }

    if (!documentoId) {
      this.notification.error('No se puede visualizar el documento: ID no disponible');
      return;
    }

    // Mostrar el visor de documentos
    const dialogRef = this.dialog.open(DocumentoViewerComponent, {
      data: {
        documentoId: documentoId
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Visor de documento cerrado');
    });
  }

  /**
   * Obtiene las claves de un objeto para facilitar su inspección
   */
  getObjectKeys(obj: unknown): string[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }
    return Object.keys(obj);
  }

  /**
   * Verifica si un valor es un valor simple (no objeto ni array)
   */
  isSimpleValue(value: unknown): boolean {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
  }

  /**
   * Formatea una fecha de manera segura para mostrarla en la interfaz
   * @param date Fecha a formatear (puede ser string, Date, o cualquier otro tipo)
   * @returns Fecha formateada como string en formato dd/mm/yyyy
   */
  formatDate(date: unknown): string {
    if (!date) return 'No especificada';

    try {
      const dateObj = new Date(date as string | number | Date);
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }

      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en formato de fecha';
    }
  }

  /**
   * Verifica si un objeto tiene una propiedad específica, incluso si está anidada
   */
  hasProperty(obj: unknown, propName: string): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // Mapeo de propiedades en español a inglés y viceversa
    const propiedadesMapeadas: Record<string, string> = {
      'titulo': 'title',
      'title': 'titulo',
      'institucion': 'institution',
      'institution': 'institucion',
      'tipo': 'type',
      'type': 'tipo',
      'estado': 'status',
      'status': 'estado',
      'fechaEmision': 'issueDate',
      'issueDate': 'fechaEmision',
      'duracionAnios': 'durationYears',
      'durationYears': 'duracionAnios',
      'promedio': 'average',
      'average': 'promedio',
      'temaTesis': 'thesisTopic',
      'thesisTopic': 'temaTesis',
      'cargaHoraria': 'hourlyLoad',
      'hourlyLoad': 'cargaHoraria',
      'tuvoEvaluacionFinal': 'hadFinalEvaluation',
      'hadFinalEvaluation': 'tuvoEvaluacionFinal',
      'tipoActividad': 'activityType',
      'activityType': 'tipoActividad',
      'tema': 'topic',
      'topic': 'tema',
      'caracter': 'activityRole',
      'activityRole': 'caracter',
      'lugarFechaExposicion': 'expositionPlaceDate',
      'expositionPlaceDate': 'lugarFechaExposicion',
      'comentarios': 'comments',
      'comments': 'comentarios'
    };

    // Nombre de propiedad alternativo según el mapeo
    const propAlternativa = propiedadesMapeadas[propName];

    // Función recursiva para buscar la propiedad en el objeto
    const buscarPropiedadRecursiva = (o: Record<string, any>, prop: string): boolean => {
      if (!o || typeof o !== 'object') return false;

      // Verificar si el objeto tiene la propiedad directamente
      if (prop in o) return true;

      // Verificar si el objeto tiene la propiedad alternativa
      if (propAlternativa && propAlternativa in o) return true;

      // Buscar recursivamente en las propiedades
      for (const key in o) {
        if (key === prop || (propAlternativa && key === propAlternativa)) return true;
        if (o[key] && typeof o[key] === 'object') {
          if (buscarPropiedadRecursiva(o[key] as Record<string, any>, prop)) {
            return true;
          }
          // También buscar la propiedad alternativa
          if (propAlternativa && buscarPropiedadRecursiva(o[key] as Record<string, any>, propAlternativa)) {
            return true;
          }
        }
      }

      return false;
    };

    return buscarPropiedadRecursiva(obj, propName);
  }

  /**
   * Muestra una ventana de diálogo con los datos crudos del objeto de educación
   * para facilitar la depuración
   */
  mostrarDatosCrudos(educacion: unknown): void {
    if (!educacion) {
      this.notification.error('No hay datos disponibles para mostrar');
      return;
    }

    try {
      // Intentar crear una copia profunda del objeto
      const datosCrudos = JSON.parse(JSON.stringify(educacion));

      // Formatear el JSON para mejor legibilidad
      const datosFormateados = JSON.stringify(datosCrudos, null, 2);

      console.log('Mostrando datos crudos de educación:', datosFormateados);

      // Crear una representación HTML formateada y estilizada de los datos
      const formatearValor = (valor: unknown): string => {
        if (valor === null || valor === undefined) {
          return '<span class="property-value empty">No especificado</span>';
        }

        if (typeof valor === 'object' && valor !== null) {
          if (Array.isArray(valor)) {
            if (valor.length === 0) {
              return '<span class="property-value empty">Lista vacía</span>';
            }

            let contenido = '<div style="padding-left: 16px;">';
            valor.forEach((item, index) => {
              contenido += `<div class="data-property">
                <span class="property-name">Elemento ${index + 1}</span>
                ${formatearValor(item)}
              </div>`;
            });
            contenido += '</div>';
            return contenido;
          } else {
            let contenido = '<div style="padding-left: 16px;">';
            for (const [key, val] of Object.entries(valor)) {
              contenido += `<div class="data-property">
                <span class="property-name">${key}</span>
                ${formatearValor(val)}
              </div>`;
            }
            contenido += '</div>';
            return contenido;
          }
        }

        // Para valores simples
        if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/) !== null) {
          // Es una fecha en formato ISO
          const fecha = new Date(valor);
          return `<span class="property-value">${fecha.toLocaleDateString('es-AR')}</span>`;
        }

        return `<span class="property-value">${valor}</span>`;
      };

      // Construir el HTML estructurado
      let htmlFormateado = '<div class="json-container">';
      for (const [key, valor] of Object.entries(datosCrudos)) {
        htmlFormateado += `
          <div class="data-property">
            <span class="property-name">${key}</span>
            ${formatearValor(valor)}
          </div>
        `;
      }
      htmlFormateado += '</div>';

      // Vista en formato JSON para desarrolladores (oculta por defecto)
      htmlFormateado += `
        <div style="margin-top: 16px;">
          <details>
            <summary style="cursor: pointer; color: var(--primary-color); padding: 8px;">Ver formato JSON (para desarrolladores)</summary>
            <pre>${datosFormateados}</pre>
          </details>
        </div>
      `;

      // Abrir diálogo con los datos formateados
      this.dialog.open(CustomConfirmDialogComponent, {
        data: {
          titulo: 'Detalles de Educación',
          mensaje: htmlFormateado,
          confirmButtonText: 'Cerrar',
          cancelButtonText: '',
          html: true,
          tipoDatos: 'educacion'
        }
      });
    } catch (error) {
      console.error('Error al procesar los datos de educación:', error);
      this.notification.error('Error al procesar los datos');
    }
  }

  // Método para cerrar el modal de experiencia
  cerrarModalExperiencia(): void {
    this.mostrarModalExperiencia = false;
    this.cdr.markForCheck();
  }

  // Método para manejar la experiencia guardada
  onExperienciaGuardada(datos: Record<string, unknown>): void {
    if (!datos) {
      console.log('No se recibieron datos de experiencia guardada');
      this.mostrarModalExperiencia = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Experiencia guardada recibida:', datos);

    if (datos['experienciaNueva']) {
      // Añadir la nueva experiencia a la lista

      // Cargar de nuevo las experiencias para asegurarnos de que tenemos los datos más actualizados
      this.experienceService.getAllExperiencesByUserId(this.usuarioId)
        .subscribe({
          next: (experiencias) => {
            // Actualizar la lista de experiencias en el perfil
            if (this.userProfile) {
              this.userProfile.experiencias = experiencias.map(exp => ({
                id: exp.id,
                empresa: exp.company,
                cargo: exp.position,
                puesto: exp.position,
                fechaInicio: exp.startDate ? (typeof exp.startDate === 'string' ? exp.startDate : new Date(exp.startDate).toISOString().split('T')[0]) : '',
                fechaFin: exp.endDate ? (typeof exp.endDate === 'string' ? exp.endDate : new Date(exp.endDate).toISOString().split('T')[0]) : '',
                descripcion: exp.description,
                comentario: exp.comments ?? '',
                documentUrl: exp.documentUrl ?? '',
                actual: false
              }));
              this.actualizarArrayExperiencias(this.userProfile);
              this.cdr.detectChanges();
            }
          },
          error: (error: Error) => {
            console.error('Error al cargar experiencias actualizadas:', error);
          }
        });
    }

    this.mostrarModalExperiencia = false;
    this.cdr.detectChanges();
  }

  /**
   * Método para mostrar los datos crudos de una experiencia
   */
  mostrarDatosExperiencia(experiencia: FormGroup): void {
    if (!experiencia) {
      this.notification.error('No hay datos disponibles para mostrar');
      return;
    }

    try {
      // Crear un objeto con todos los valores del control de experiencia
      const datosCrudos = {
        id: experiencia.get('id')?.value,
        puesto: experiencia.get('puesto')?.value,
        empresa: experiencia.get('empresa')?.value,
        fechaInicio: experiencia.get('fechaInicio')?.value,
        fechaFin: experiencia.get('fechaFin')?.value,
        descripcion: experiencia.get('descripcion')?.value,
        ubicacion: experiencia.get('ubicacion')?.value
      };

      // Formatear el JSON para mejor legibilidad
      const datosFormateados = JSON.stringify(datosCrudos, null, 2);

      console.log('Mostrando datos crudos de experiencia:', datosFormateados);

      // Crear una representación HTML formateada y estilizada de los datos
      const formatearValor = (valor: unknown): string => {
        if (valor === null || valor === undefined) {
          return '<span class="property-value empty">No especificado</span>';
        }

        if (typeof valor === 'object' && valor !== null) {
          if (Array.isArray(valor)) {
            if (valor.length === 0) {
              return '<span class="property-value empty">Lista vacía</span>';
            }

            let contenido = '<div style="padding-left: 16px;">';
            valor.forEach((item, index) => {
              contenido += `<div class="data-property">
                <span class="property-name">Elemento ${index + 1}</span>
                ${formatearValor(item)}
              </div>`;
            });
            contenido += '</div>';
            return contenido;
          } else {
            let contenido = '<div style="padding-left: 16px;">';
            for (const [key, val] of Object.entries(valor)) {
              contenido += `<div class="data-property">
                <span class="property-name">${key}</span>
                ${formatearValor(val)}
              </div>`;
            }
            contenido += '</div>';
            return contenido;
          }
        }

        // Para valores simples
        if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/) !== null) {
          // Es una fecha en formato ISO
          const fecha = new Date(valor);
          return `<span class="property-value">${fecha.toLocaleDateString('es-AR')}</span>`;
        }

        return `<span class="property-value">${valor}</span>`;
      };

      // Construir el HTML estructurado
      let htmlFormateado = '<div class="json-container">';
      for (const [key, valor] of Object.entries(datosCrudos)) {
        htmlFormateado += `
          <div class="data-property">
            <span class="property-name">${key}</span>
            ${formatearValor(valor)}
          </div>
        `;
      }
      htmlFormateado += '</div>';

      // Vista en formato JSON para desarrolladores (oculta por defecto)
      htmlFormateado += `
        <div style="margin-top: 16px;">
          <details>
            <summary style="cursor: pointer; color: var(--primary-color); padding: 8px;">Ver formato JSON (para desarrolladores)</summary>
            <pre>${datosFormateados}</pre>
          </details>
        </div>
      `;

      // Abrir diálogo con los datos formateados
      this.dialog.open(CustomConfirmDialogComponent, {
        data: {
          titulo: 'Detalles de Experiencia Laboral',
          mensaje: htmlFormateado,
          confirmButtonText: 'Cerrar',
          cancelButtonText: '',
          html: true,
          tipoDatos: 'experiencia'
        }
      });
    } catch (error) {
      console.error('Error al procesar los datos de experiencia:', error);
      this.notification.error('Error al procesar los datos');
    }
  }
}
