import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService, UserProfile, Experiencia, Habilidad } from '../../core/services/profile/profile.service';
import { DocumentosService } from '../../core/services/documentos/documentos.service';
import { DocumentoViewerComponent } from './components/documento-viewer/documento-viewer.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DocumentacionTabComponent } from './components/documentacion-tab/documentacion-tab.component';
import { DocumentoResponse } from '../../core/models/documento.model';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { EducacionModule } from './components/educacion/educacion.module';
import { EducacionService } from './services/educacion.service';
import { Educacion } from './models/educacion.model';
import { TipoEducacion } from './models/educacion.model';
import { ExperienciaModule } from './components/experiencia/experiencia.module';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatRadioModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    DocumentacionTabComponent,
    EducacionModule,
    ExperienciaModule
  ]
})
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fechaInicio') fechaInicio: any;
  @ViewChild('fechaFin') fechaFin: any;
  perfilForm!: FormGroup;
  userProfile: UserProfile | null = null;

  fotoPerfil: string = 'assets/images/default-avatar.png';
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

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private documentosService: DocumentosService,
    private dialog: MatDialog,
    private profileService: ProfileService,
    private educacionService: EducacionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Consola para debug
    console.log('PerfilComponent inicializado');

    // Cargar el perfil de usuario
    this.loadUserProfile();
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
              error => {
                console.error('Error al cargar educación:', error);
                this.snackBar.open('No se pudieron cargar los registros de educación', 'Cerrar', {
                  duration: 5000,
                  horizontalPosition: 'center',
                  verticalPosition: 'bottom'
                });
              }
            );
          }
        });

        // Marcar como no cargando después de cargar los datos básicos
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error) => {
        console.error('Error loading user profile', error);
        this.snackBar.open('Error al cargar el perfil', 'Cerrar', {
          duration: 3000
        });
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
    console.log('Actualizando array de experiencias:', profile.experiencias);
    
    const experienciasArray = this.perfilForm.get('experiencias') as FormArray;
    experienciasArray.clear();

    // Asegurarse de que haya un array de experiencias, incluso si viene vacío o undefined
    const experiencias = profile.experiencias || [];
    
    if (experiencias.length > 0) {
      experiencias.forEach(exp => {
        experienciasArray.push(this.fb.group({
          empresa: [exp.empresa],
          cargo: [exp.cargo],
          fechaInicio: [exp.fechaInicio],
          fechaFin: [exp.fechaFin],
          descripcion: [exp.descripcion],
          comentario: [exp.comentario]
        }));
      });
    }
    
    console.log('Array de experiencias actualizado:', experienciasArray.value);
  }

  // Método optimizado para actualizar el array de habilidades
  private actualizarArrayHabilidades(profile: UserProfile): void {
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;

    if (profile.habilidades && Array.isArray(profile.habilidades)) {
      // Desactivar temporalmente cambios
      this.cdr.detach();

      try {
        habilidadesArray.clear();
        profile.habilidades.forEach((hab: Habilidad) => {
          habilidadesArray.push(this.createHabilidadFormGroup(hab));
        });
      } finally {
        this.cdr.reattach();
      }
    }
  }

  private createExperienciaFormGroup(experiencia?: any): FormGroup {
    return this.fb.group({
      empresa: [experiencia?.empresa || '', Validators.required],
      cargo: [experiencia?.cargo || '', Validators.required],
      fechaInicio: [experiencia?.fechaInicio || null, Validators.required],
      fechaFin: [experiencia?.fechaFin || null],
      descripcion: [experiencia?.descripcion || ''],
      comentario: [experiencia?.comentario || ''],
      certificadoId: [experiencia?.certificadoId || null]
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

  get habilidades() {
    return this.perfilForm.get('habilidades') as FormArray;
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
    if (!this.userProfile || !this.userProfile.id) {
      this.snackBar.open('No se puede agregar experiencia sin datos de usuario. Por favor, espere a que cargue el perfil.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }

    // El ID puede ser un número o un UUID, ambos son válidos
    if (!this.esIdUsuarioValido()) {
      this.snackBar.open('No se puede agregar experiencia: ID de usuario inválido.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
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
    this.experiencias.removeAt(index);
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
          cargo: exp.cargo,
          fechaInicio: exp.fechaInicio ? new Date(exp.fechaInicio).toISOString().split('T')[0] : null,
          fechaFin: exp.fechaFin ? new Date(exp.fechaFin).toISOString().split('T')[0] : null,
          descripcion: exp.descripcion,
          comentario: exp.comentario,
          certificadoId: exp.certificadoId
        })),
        habilidades: (formValues.habilidades || []).map((hab: any) => ({
          nombre: hab.nombre,
          nivel: hab.nivel
        }))
      };

      this.profileService.updateUserProfile(updatedProfile)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (profile) => {
            this.snackBar.open('Perfil actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            // Actualizar el perfil
            this.userProfile = profile;

            // Actualizar el formulario con los datos del perfil
            this.cargarPerfilForm(profile);

            this.perfilForm.markAsPristine();
          },
          error: (error) => {
            console.error('Error al actualizar el perfil', error);
            this.snackBar.open('Error al actualizar el perfil', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.snackBar.open('Por favor, corrija los errores en el formulario antes de guardar', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });

      this.marcarCamposInvalidos(this.perfilForm);
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
    fileInput.addEventListener('change', (e: any) => {
      const file = e.target.files[0];
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
      this.snackBar.open('No se puede agregar educación sin datos de usuario. Por favor, espere a que cargue el perfil.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }

    // El ID puede ser un número o un UUID, ambos son válidos ahora
    if (!this.esIdUsuarioValido()) {
      this.snackBar.open('No se puede agregar educación: ID de usuario inválido.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
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
      this.snackBar.open('Error al guardar educación: datos inválidos', 'Cerrar', { duration: 3000 });
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
    this.snackBar.open('Educación guardada exitosamente', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });

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
      profile.experiencias.forEach((exp: Experiencia) => {
        experienciasArray.push(this.createExperienciaFormGroup(exp));
      });
    }

    // Actualizar habilidades si existen
    const habilidadesArray = this.perfilForm.get('habilidades') as FormArray;
    if (profile.habilidades && Array.isArray(profile.habilidades)) {
      habilidadesArray.clear();
      profile.habilidades.forEach((hab: Habilidad) => {
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
      width: '80%',
      height: '80%',
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
          this.snackBar.open('Certificado eliminado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error al eliminar el certificado:', error);
          this.snackBar.open('Error al eliminar el certificado', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
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
      this.snackBar.open('ID de educación inválido', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log(`Solicitando eliminar educación con ID (UUID): ${id}`);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro que desea eliminar esta educación? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.educacionService.eliminarEducacion(id).subscribe(
          response => {
            if (response.exito) {
              // Filtrar los registros por ID exacto
              this.educacionList = this.educacionList.filter(e => e.id !== id);

              this.snackBar.open('Educación eliminada exitosamente', 'Cerrar', {
                duration: 3000
              });
              this.cdr.markForCheck();
            } else {
              this.snackBar.open(response.mensaje || 'Error al eliminar educación', 'Cerrar', {
                duration: 3000
              });
            }
          },
          error => {
            console.error('Error eliminando educación', error);
            this.snackBar.open('Error al eliminar educación', 'Cerrar', {
              duration: 3000
            });
          }
        );
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
    const buscarPropiedadRecursiva = (obj: any, prop: string): any => {
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
            const resultado = buscarPropiedadRecursiva(obj[key], prop);
            if (resultado !== undefined) {
              return resultado;
            }

            // También buscar con la propiedad mapeada
            if (propMapeada) {
              const resultadoMapeado = buscarPropiedadRecursiva(obj[key], propMapeada);
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
      this.snackBar.open('No hay documento adjunto para este registro', 'Cerrar', {
        duration: 3000
      });
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
      this.snackBar.open('No se puede visualizar el documento: ID no disponible', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Mostrar el visor de documentos
    const dialogRef = this.dialog.open(DocumentoViewerComponent, {
      width: '80%',
      height: '80%',
      data: {
        documentoId: documentoId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Visor de documento cerrado');
    });
  }

  /**
   * Obtiene las claves de un objeto para facilitar su inspección
   */
  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }
    return Object.keys(obj);
  }

  /**
   * Verifica si un valor es un valor simple (no objeto ni array)
   */
  isSimpleValue(value: any): boolean {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
  }

  /**
   * Verifica si un objeto tiene una propiedad específica, incluso si está anidada
   */
  hasProperty(obj: any, propName: string): boolean {
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
    const buscarPropiedadRecursiva = (o: any, prop: string): boolean => {
      if (!o || typeof o !== 'object') return false;

      // Verificar si el objeto tiene la propiedad directamente
      if (prop in o) return true;

      // Verificar si el objeto tiene la propiedad alternativa
      if (propAlternativa && propAlternativa in o) return true;

      // Buscar recursivamente en las propiedades
      for (const key in o) {
        if (key === prop || (propAlternativa && key === propAlternativa)) return true;
        if (o[key] && typeof o[key] === 'object') {
          if (buscarPropiedadRecursiva(o[key], prop)) {
            return true;
          }
          // También buscar la propiedad alternativa
          if (propAlternativa && buscarPropiedadRecursiva(o[key], propAlternativa)) {
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
  mostrarDatosCrudos(educacion: any): void {
    if (!educacion) {
      this.snackBar.open('No hay datos disponibles para mostrar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    try {
      // Intentar crear una copia profunda del objeto
      const datosCrudos = JSON.parse(JSON.stringify(educacion));

      // Formatear el JSON para mejor legibilidad
      const datosFormateados = JSON.stringify(datosCrudos, null, 2);

      console.log('Mostrando datos crudos de educación:', datosFormateados);

      // Abrir diálogo con los datos formateados
      this.dialog.open(ConfirmDialogComponent, {
        width: '80%',
        maxHeight: '80vh',
        data: {
          titulo: 'Datos completos de Educación',
          mensaje: `<pre style="max-height: 60vh; overflow: auto; background-color: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace;">${datosFormateados}</pre>`,
          confirmButtonText: 'Cerrar',
          cancelButtonText: ''
        }
      });
    } catch (error) {
      console.error('Error al procesar los datos de educación:', error);
      this.snackBar.open('Error al procesar los datos', 'Cerrar', {
        duration: 3000
      });
    }
  }

  // Método para cerrar el modal de experiencia
  cerrarModalExperiencia(): void {
    this.mostrarModalExperiencia = false;
    this.cdr.markForCheck();
  }

  // Método para manejar la experiencia guardada
  onExperienciaGuardada(perfilActualizado: UserProfile): void {
    console.log('Evento experienciaGuardada recibido:', perfilActualizado);
    
    // Actualizar el perfil local con los nuevos datos
    this.userProfile = perfilActualizado;
    
    // Actualizar el formulario con los nuevos datos
    this.cargarDatosBasicos(perfilActualizado);
    this.cargarDatosAvanzados(perfilActualizado);
    
    // Cerrar el modal de experiencia
    this.mostrarModalExperiencia = false;
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    console.log('Perfil actualizado después de guardar experiencia:', this.userProfile);
  }
}
