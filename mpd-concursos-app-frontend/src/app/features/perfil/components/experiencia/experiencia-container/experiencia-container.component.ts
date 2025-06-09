import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

// Servicios mock para evitar errores de imports
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
class MockService {
  getUserProfile(): Observable<any> { return of(null); }
  cargarEducacionPorUsuario(id: number): Observable<any> { return of({ exito: true, data: [] }); }
  deleteExperience(id: number): Observable<any> { return of({}); }
  updateUserProfile(data: any): Observable<any> { return of(data); }
  open(component: any, config?: any): any { return { afterClosed: () => of(false) }; }
  success(message: string): void { console.log(message); }
  error(message: string): void { console.error(message); }
  debug(message: string): void { console.log(message); }
  info(message: string): void { console.log(message); }
  warn(message: string): void { console.warn(message); }
}

// Tipos y modelos
// import { TabKey, ProfileTab } from './models/types';
type TabKey = 'info' | 'cv' | 'docs' | 'linkedin';
interface ProfileTab {
  key: TabKey;
  label: string;
  icon: string;
}
// Imports eliminados - usando interfaces locales
// Definir interfaz Habilidad localmente si no existe el modelo
interface UserProfile {
  id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  direccion?: string;
  experiencias?: ExperienciaData[];
  habilidades?: HabilidadData[];
}

interface ExperienciaData {
  id?: number;
  puesto?: string;
  cargo?: string;
  empresa?: string;
  descripcion?: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  actual?: boolean;
  ubicacion?: string;
}

interface HabilidadData {
  nombre: string;
  nivel: string;
}

interface Experiencia {
  id?: number;
  puesto: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  actual?: boolean;
  ubicacion?: string;
}

interface Educacion {
  id?: number;
  tipo?: string;
  institucion?: string;
  titulo?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Habilidad {
  nombre: string;
  nivel: string;
}

interface OperacionResponse<T> {
  exito: boolean;
  data?: T;
  mensaje?: string;
}

// Enum para tipos de educación
enum TipoEducacion {
  CARRERA_NIVEL_SUPERIOR = 'CARRERA_NIVEL_SUPERIOR',
  CARRERA_GRADO = 'CARRERA_GRADO',
  POSGRADO_ESPECIALIZACION = 'POSGRADO_ESPECIALIZACION',
  POSGRADO_MAESTRIA = 'POSGRADO_MAESTRIA',
  POSGRADO_DOCTORADO = 'POSGRADO_DOCTORADO',
  DIPLOMATURA = 'DIPLOMATURA',
  CURSO_CAPACITACION = 'CURSO_CAPACITACION',
  ACTIVIDAD_CIENTIFICA = 'ACTIVIDAD_CIENTIFICA'
}

// Mock component para diálogos
class CustomConfirmDialogComponent {}

// Componentes personalizados eliminados temporalmente para evitar errores de imports

const TAB_KEYS = {
  INFO: 'info' as TabKey,
  CV: 'cv' as TabKey,
  DOCS: 'docs' as TabKey,
  LINKEDIN: 'linkedin' as TabKey
};

@Component({
  selector: 'app-experiencia-container',
  templateUrl: './experiencia-container.component.html',
  styleUrls: ['./experiencia-container.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ExperienciaContainerComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fechaInicio') fechaInicio!: ElementRef;
  @ViewChild('fechaFin') fechaFin!: ElementRef;

  @Input() usuarioId?: string;
  @Output() experienciaGuardada = new EventEmitter<any>();

  perfilForm!: FormGroup;
  formInformacionBasica!: FormGroup;
  formInformacionDetallada!: FormGroup;
  formDocumentacion!: FormGroup;
  userProfile: UserProfile | null = null;

  // Propiedades para el wizard de experiencia
  pasoActual = 1;
  pasoWizard = {
    INFORMACION_BASICA: 1,
    INFORMACION_DETALLADA: 2,
    DOCUMENTACION: 3,
    RESUMEN: 4
  };

  fotoPerfil = 'assets/images/default-avatar.png';
  linkedInConectado = false;
  linkedInTab = true;
  isEditing = false;
  isLoading = false;
  guardando = false;
  minDate: Date = new Date(1900, 0, 1);
  maxDate: Date = new Date();

  // Propiedades para manejo de archivos
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  cargandoArchivo = false;
  progresoCarga = 0;

  private subscriptions: Subscription[] = [];

  mostrarModalEducacion = false;
  educacionList: Educacion[] = [];

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
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    // Inicializar servicios mock
    this.documentosService = new MockService();
    this.profileService = new MockService();
    this.educacionService = new MockService();
    this.experienceService = new MockService();
    this.authService = new MockService();
    this.dialog = new MockService();
    this.notification = new MockService();
    this.loggingService = new MockService();

    this.initializeForms();
  }

  // Propiedades para servicios mock
  private documentosService: any;
  private profileService: any;
  private educacionService: any;
  private experienceService: any;
  private authService: any;
  private dialog: any;
  private notification: any;
  private loggingService: any;

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

    // Formulario específico para información básica de experiencia
    this.formInformacionBasica = this.fb.group({
      cargo: ['', Validators.required],
      empresa: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      actual: [false],
      ubicacion: ['']
    });

    // Formulario para información detallada de experiencia
    this.formInformacionDetallada = this.fb.group({
      descripcion: ['', Validators.required],
      responsabilidades: [''],
      logros: [''],
      tecnologias: ['']
    });

    // Formulario para documentación de experiencia
    this.formDocumentacion = this.fb.group({
      certificados: this.fb.array([]),
      referencias: this.fb.array([])
    });

    this.perfilForm.get('username')?.disable();
    this.perfilForm.get('email')?.disable();

    const cuitValueChanges = this.perfilForm.get('cuit')?.valueChanges.subscribe(value => {
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
    });

    if (cuitValueChanges) {
      this.subscriptions.push(cuitValueChanges);
    }
  }

  // Cargar datos del perfil con mejor gestión de rendimiento
  loadUserProfile(): void {
    this.isLoading = true;

    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      this.profileService.getUserProfile().pipe(
        finalize(() => this.isLoading = false) // Mover finalize aquí para asegurar que siempre se ejecuta
      ).subscribe({
        next: (profile: any) => {
          this.userProfile = profile; // Almacenar el perfil completo
          this.cargarDatosBasicos(profile);
          this.cargarPerfilForm(profile); // Llamar para cargar el formulario completo

          // Cargar educación y experiencias en un segundo ciclo para evitar bloqueos
          window.requestAnimationFrame(() => {
            if (profile.id) {
              this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
                this.educacionService.cargarEducacionPorUsuario(profile.id).subscribe({
                  next: (response: OperacionResponse<Educacion[]>) => {
                    if (response.exito && response.data) {
                      this.educacionList = response.data;
                      this.cdr.detectChanges(); // Forzar detección de cambios
                    } else if (response.mensaje) {
                      this.notification.error(response.mensaje, 'Advertencia');
                    }
                  },
                  error: (error: Error) => {
                    console.error('Error al cargar educación:', error);
                    this.notification.error('No se pudieron cargar los registros de educación');
                  }
                })
              );
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
          empresa: exp.empresa || '',
          descripcion: exp.descripcion || '',
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
  get experienciasArray() {
    return [...(this.perfilForm.get('experiencias') as FormArray).controls];
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
      console.error(`ID de usuario inválido: ${this.getUserId()}`);
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

    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      dialogRef.afterClosed().subscribe((confirmed: unknown) => {
        if (confirmed) {
          // Si el usuario confirma, eliminar del backend
          this.experienceService.deleteExperience(experiencia.id!).subscribe({
            next: () => {
              experiencias.removeAt(index);
              this.notification.success('Experiencia eliminada correctamente');
              this.cdr.detectChanges(); // Forzar detección de cambios
            },
            error: (error: any) => {
              console.error('Error al eliminar experiencia en el backend:', error);
              this.notification.error('Error al eliminar la experiencia. Intente nuevamente.');
            }
          });
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

  onArchivoSeleccionado(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.notification.error('Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG.');
        return;
      }

      // Validar tamaño de archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        this.notification.error('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      // Procesar el archivo
      this.archivoSeleccionado = file;
      this.nombreArchivo = file.name;
      console.log('Archivo seleccionado:', file.name);
      this.notification.success(`Archivo "${file.name}" seleccionado correctamente.`);

      // TODO: Implementar la lógica para subir el archivo al servidor
      // this.documentosService.uploadDocument(file).subscribe(...);
    }
  }

  /**
   * Abre el selector de archivos
   */
  seleccionarArchivo(): void {
    this.abrirSelectorArchivo();
  }

  /**
   * Elimina el archivo seleccionado
   */
  eliminarArchivoSeleccionado(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.progresoCarga = 0;
    this.cargandoArchivo = false;
    this.notification.success('Archivo eliminado correctamente.');
  }

  /**
   * Obtiene el resumen de la experiencia para mostrar en el paso final
   */
  obtenerResumenExperiencia(): string[] {
    const resumen: string[] = [];

    if (this.formInformacionBasica?.valid) {
      const basica = this.formInformacionBasica.value;
      resumen.push(`Cargo: ${basica.cargo}`);
      resumen.push(`Empresa: ${basica.empresa}`);
      resumen.push(`Fecha inicio: ${basica.fechaInicio}`);
      if (basica.fechaFin) {
        resumen.push(`Fecha fin: ${basica.fechaFin}`);
      } else if (basica.actual) {
        resumen.push('Trabajo actual');
      }
      if (basica.ubicacion) {
        resumen.push(`Ubicación: ${basica.ubicacion}`);
      }
    }

    if (this.formInformacionDetallada?.valid) {
      const detallada = this.formInformacionDetallada.value;
      if (detallada.descripcion) {
        resumen.push(`Descripción: ${detallada.descripcion}`);
      }
      if (detallada.responsabilidades) {
        resumen.push(`Responsabilidades: ${detallada.responsabilidades}`);
      }
      if (detallada.logros) {
        resumen.push(`Logros: ${detallada.logros}`);
      }
      if (detallada.tecnologias) {
        resumen.push(`Tecnologías: ${detallada.tecnologias}`);
      }
    }

    if (this.archivoSeleccionado) {
      resumen.push(`Documento adjunto: ${this.nombreArchivo}`);
    }

    return resumen;
  }

  /**
   * Retrocede al paso anterior del wizard
   */
  retrocederPaso(): void {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  /**
   * Cierra el modal de experiencia
   */
  cerrarModal(): void {
    // Emitir evento para cerrar el modal
    console.log('Cerrando modal de experiencia');
    // TODO: Implementar lógica para cerrar modal
  }

  /**
   * Avanza al siguiente paso del wizard
   */
  avanzarPaso(): void {
    if (this.validarPasoActual()) {
      if (this.pasoActual < this.pasoWizard.RESUMEN) {
        this.pasoActual++;
      }
    }
  }

  /**
   * Valida el paso actual del wizard
   */
  validarPasoActual(): boolean {
    switch (this.pasoActual) {
      case this.pasoWizard.INFORMACION_BASICA:
        return this.formInformacionBasica?.valid || false;
      case this.pasoWizard.INFORMACION_DETALLADA:
        return this.formInformacionDetallada?.valid || false;
      case this.pasoWizard.DOCUMENTACION:
        return true; // La documentación es opcional
      default:
        return true;
    }
  }

  /**
   * Guarda la experiencia laboral
   */
  guardarExperiencia(): void {
    if (!this.validarFormularios()) {
      this.notification.error('Por favor, complete todos los campos obligatorios.');
      return;
    }

    this.guardando = true;

    // Simular guardado
    setTimeout(() => {
      this.guardando = false;
      this.notification.success('Experiencia guardada correctamente.');

      // Emitir evento de experiencia guardada
      const experienciaData = {
        ...this.formInformacionBasica?.value,
        ...this.formInformacionDetallada?.value,
        archivo: this.archivoSeleccionado
      };

      this.experienciaGuardada.emit(experienciaData);

      // Cerrar modal
      this.cerrarModal();
    }, 1000);
  }

  /**
   * Valida todos los formularios necesarios
   */
  private validarFormularios(): boolean {
    return (this.formInformacionBasica?.valid || false) &&
           (this.formInformacionDetallada?.valid || false);
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid && this.userProfile?.id) { // Asegurarse de tener un ID de usuario
      const formValues = this.perfilForm.value;

      const perfilData = {
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
      };

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

        // Asumiendo que 'documentosService.uploadDocument' es el método correcto para subir
        this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
          this.documentosService.uploadDocumento(formData).pipe( // Asumiendo que el servicio espera FormData
            finalize(() => {
              this.isLoading = false;
              document.body.removeChild(fileInput); // Limpiar el input file
              this.cdr.detectChanges(); // Forzar detección de cambios
            })
          ).subscribe({
            next: (response: any) => {
              this.notification.success('Certificado subido correctamente.');
              // Aquí podrías querer actualizar el modelo de experiencia si el backend devuelve un ID o URL para el certificado
              console.log('Respuesta de subida de documento:', response);
            },
            error: (error: any) => {
              console.error('Error al subir certificado:', error);
              this.notification.error('Error al subir el certificado. Intente nuevamente.');
            }
          })
        );
      } else {
        document.body.removeChild(fileInput); // Limpiar el input si no se selecciona archivo
      }
    });

    fileInput.click(); // Abrir el selector de archivo
  }

  /**
   * Obtiene el ID del usuario como UUID (string)
   */
  getUserId(): string {
    // Priorizar el input si está disponible
    if (this.usuarioId) {
      return this.usuarioId;
    }

    // Es crucial que userProfile esté cargado para obtener el ID
    if (!this.userProfile || !this.userProfile.id) {
      return '';
    }
    return String(this.userProfile.id);
  }

  /**
   * Verifica si el ID de usuario es válido (asumiendo que un ID vacío o null no es válido)
   */
  private esIdUsuarioValido(): boolean {
    const userId = this.getUserId();
    return !!userId && userId.length > 0;
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

    if (!this.esIdUsuarioValido()) {
      this.notification.error('No se puede agregar educación: ID de usuario inválido.');
      console.error(`ID de usuario inválido: ${this.getUserId()}`);
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
  onEducacionGuardada(_educacion: Educacion): void {
    this.recargarEducacion();
  }

  // Método para recargar educación desde el backend
  private recargarEducacion(): void {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No hay usuarioId disponible para recargar educación');
      return;
    }

    this.subscriptions.push( // Añadir a las suscripciones para limpiar en OnDestroy
      this.educacionService.cargarEducacionPorUsuario(userId).subscribe({
        next: (response: OperacionResponse<Educacion[]>) => {
          if (response.exito && response.data) {
            this.educacionList = response.data;
            this.notification.success('Lista de educación actualizada');
          } else if (response.mensaje) {
            this.notification.error(response.mensaje);
          }
          this.cdr.detectChanges(); // Forzar detección de cambios
        },
        error: (error: Error) => {
          console.error('Error al recargar educación:', error);
          this.notification.error('Error al actualizar la lista de educación');
          this.cdr.detectChanges(); // Forzar detección de cambios
        }
      })
    );
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
}
