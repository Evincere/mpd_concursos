import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService, UserProfile, Experiencia, Educacion, Habilidad, TipoEducacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../../core/services/profile/profile.service';
import { DocumentosService } from '../../../core/services/documentos/documentos.service';
import { DocumentoViewerComponent } from './documento-viewer/documento-viewer.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
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
import { DocumentacionTabComponent } from './documentacion-tab/documentacion-tab.component';
import { DocumentoResponse } from '../../../core/models/documento.model';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
    DocumentacionTabComponent
  ]
})
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fechaInicio') fechaInicio: any;
  @ViewChild('fechaFin') fechaFin: any;
  @ViewChild('fechaEduInicio') fechaEduInicio: any;
  @ViewChild('fechaEduFin') fechaEduFin: any;
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

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private documentosService: DocumentosService,
    private dialog: MatDialog,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
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

  // Cargar datos del perfil con mejor gestión de rendimiento
  loadUserProfile(): void {
    this.isLoading = true;

    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        // Cargar los datos básicos primero para una respuesta rápida
        this.cargarDatosBasicos(profile);

        // Cargar los arrays en un segundo ciclo para evitar bloqueos
        window.requestAnimationFrame(() => {
          this.cargarDatosAvanzados(profile);
        });
      },
      error: (error) => {
        console.error('Error loading user profile', error);
        this.snackBar.open('Error al cargar el perfil', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
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
    // Usar un enfoque progresivo para actualizar los arrays
    const tareas = [
      () => this.actualizarArrayExperiencias(profile),
      () => this.actualizarArrayHabilidades(profile),
      () => this.actualizarArrayEducacion(profile)
    ];

    // Procesamiento secuencial para evitar bloqueos
    const procesarSiguienteTarea = (index: number) => {
      if (index >= tareas.length) {
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }

      // Ejecutar la tarea actual
      tareas[index]();

      // Programar la siguiente tarea
      window.requestAnimationFrame(() => {
        procesarSiguienteTarea(index + 1);
      });
    };

    // Iniciar el procesamiento secuencial
    procesarSiguienteTarea(0);
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
    this.actualizarArrayEducacion(profile);
    this.actualizarArrayHabilidades(profile);

    // Actualizar UI
    this.cdr.markForCheck();
  }

  // Método optimizado para actualizar el array de experiencias
  private actualizarArrayExperiencias(profile: UserProfile): void {
    const experienciasArray = this.perfilForm.get('experiencias') as FormArray;

    if (profile.experiencias && Array.isArray(profile.experiencias)) {
      // Desactivar temporalmente cambios
      this.cdr.detach();

      try {
        experienciasArray.clear();
        profile.experiencias.forEach((exp: Experiencia) => {
          experienciasArray.push(this.createExperienciaFormGroup(exp));
        });
      } finally {
        this.cdr.reattach();
      }
    }
  }

  // Método optimizado para actualizar el array de educación
  private actualizarArrayEducacion(profile: UserProfile): void {
    console.debug('Inicio actualizarArrayEducacion');
    const educacionArray = this.perfilForm.get('educacion') as FormArray;

    if (!profile.educacion || !Array.isArray(profile.educacion) || profile.educacion.length === 0) {
      educacionArray.clear();
      console.debug('No hay educación que cargar');
      return;
    }

    // Desactivar detección de cambios para mejorar rendimiento
    this.cdr.detach();

    try {
      // Limpiar el array actual
      educacionArray.clear();
      console.debug('Array de educación limpiado');

      // Procesar todos los elementos de una vez, sin procesamiento en lotes
      // para simplificar y eliminar posibles fuentes de congelamiento
      profile.educacion.forEach((item: Educacion) => {
        // Usar la versión simplificada para crear los grupos de formulario
        const grupo = this.createEducacionFormGroup(item);
        educacionArray.push(grupo);
      });

      console.debug('Educación cargada: ' + educacionArray.length + ' elementos');
    } catch (error) {
      console.error('Error al cargar datos de educación:', error);
    } finally {
      // Siempre reactivar la detección de cambios
      this.cdr.reattach();
      this.cdr.markForCheck();
      console.debug('Detección de cambios restaurada');
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

  get educacion() {
    return this.perfilForm.get('educacion') as FormArray;
  }

  get habilidades() {
    return this.perfilForm.get('habilidades') as FormArray;
  }

  // Método para agregar un nuevo item de educación - versión simplificada sin suscripciones
  agregarEducacion(): void {
    console.debug('===== INICIO agregarEducacion() - versión sin operaciones asíncronas =====');

    // Creamos directamente un objeto completo con todos los campos requeridos
    const formGroup = this.fb.group({
      tipo: [TipoEducacion.GRADO, Validators.required],
      estado: [EstadoEducacion.FINALIZADO, Validators.required],
      titulo: ['', Validators.required],
      institucion: ['', Validators.required],
      documentoId: [null],

      // Campos adicionales según el tipo
      fechaEmision: [null],
      duracionAnios: [null, [Validators.min(1)]],
      promedio: [null, [Validators.min(0), Validators.max(10)]],
      temaTesis: [''],
      cargaHoraria: [null, [Validators.min(1)]],
      evaluacionFinal: [false],
      tipoActividad: [null],
      caracter: [null],
      lugarFechaExposicion: [''],
      comentarios: [''],
      descripcion: [''],
      fechaInicio: [null],
      fechaFin: [null]
    });

    // Agregamos el grupo al FormArray directamente
    (this.perfilForm.get('educacion') as FormArray).push(formGroup);

    console.debug('===== FIN agregarEducacion() - formGroup agregado =====');

    // Hacemos scroll al nuevo elemento usando setTimeout para asegurar que el DOM se ha actualizado
    setTimeout(() => {
      try {
        const elements = document.querySelectorAll('.cv-item');
        if (elements && elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          lastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.debug('Scroll realizado al nuevo elemento de educación');
        }
      } catch (e) {
        console.error('Error al hacer scroll:', e);
      }
    }, 100);
  }

  // Simplificamos también el método createEducacionFormGroup
  createEducacionFormGroup(educacion?: any): FormGroup {
    console.debug('Creando grupo de educación simple');

    return this.fb.group({
      tipo: [educacion?.tipo || TipoEducacion.GRADO, Validators.required],
      estado: [educacion?.estado || EstadoEducacion.FINALIZADO, Validators.required],
      titulo: [educacion?.titulo || '', Validators.required],
      institucion: [educacion?.institucion || '', Validators.required],
      documentoId: [educacion?.documentoId || null],

      // Todos los campos adicionales presentes desde el inicio
      fechaEmision: [educacion?.fechaEmision || null],
      duracionAnios: [educacion?.duracionAnios || null],
      promedio: [educacion?.promedio || null],
      temaTesis: [educacion?.temaTesis || ''],
      cargaHoraria: [educacion?.cargaHoraria || null],
      evaluacionFinal: [educacion?.evaluacionFinal || false],
      tipoActividad: [educacion?.tipoActividad || null],
      caracter: [educacion?.caracter || null],
      lugarFechaExposicion: [educacion?.lugarFechaExposicion || ''],
      comentarios: [educacion?.comentarios || ''],
      descripcion: [educacion?.descripcion || ''],
      fechaInicio: [educacion?.fechaInicio || null],
      fechaFin: [educacion?.fechaFin || null]
    });
  }

  // Método para cargar documento de educación
  cargarDocumentoEducacion(index: number): void {
    // Crear un input de tipo file oculto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Manejar la selección de archivo
    fileInput.addEventListener('change', (event: any) => {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        // Verificar que sea un PDF
        if (file.type !== 'application/pdf') {
          this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          document.body.removeChild(fileInput);
          return;
        }

        // Mostrar indicador de carga
        this.isLoading = true;

        // Subir el archivo
        const formData = new FormData();
        formData.append('file', file);

        this.documentosService.uploadDocumento(formData).subscribe({
          next: (response: DocumentoResponse) => {
            // Actualizar el ID del documento en el formulario
            const educacionItem = this.educacion.at(index) as FormGroup;
            educacionItem.patchValue({
              documentoId: response.id
            });

            this.snackBar.open('Documento cargado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error al cargar el documento', error);
            this.snackBar.open('Error al cargar el documento', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          },
          complete: () => {
            document.body.removeChild(fileInput);
          }
        });
      } else {
        document.body.removeChild(fileInput);
      }
    });

    // Disparar el diálogo de selección de archivo
    fileInput.click();
  }

  // Método para ver un documento de educación
  verDocumentoEducacion(index: number): void {
    const educacionItem = this.educacion.at(index) as FormGroup;
    const documentoId = educacionItem.get('documentoId')?.value;

    if (!documentoId) {
      this.snackBar.open('No hay documento para visualizar', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.dialog.open(DocumentoViewerComponent, {
      width: '80%',
      height: '80%',
      data: { documentoId }
    });
  }

  // Método para eliminar un documento de educación
  eliminarDocumentoEducacion(index: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar documento',
        message: '¿Está seguro que desea eliminar este documento? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const educacionItem = this.educacion.at(index) as FormGroup;
        const documentoId = educacionItem.get('documentoId')?.value;

        if (!documentoId) {
          return;
        }

        // Eliminar la referencia en el formulario
        educacionItem.patchValue({
          documentoId: null
        });

        this.snackBar.open('Documento eliminado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  // Método para obtener los tipos de educación
  get tiposEducacion(): { value: string, label: string }[] {
    return Object.entries(TipoEducacion).map(([key, value]) => ({
      value,
      label: value
    }));
  }

  // Método para obtener los estados de educación
  get estadosEducacion(): { value: string, label: string }[] {
    return Object.entries(EstadoEducacion).map(([key, value]) => ({
      value,
      label: value
    }));
  }

  // Método para obtener los tipos de actividad científica
  get tiposActividadCientifica(): { value: string, label: string }[] {
    return Object.entries(TipoActividadCientifica).map(([key, value]) => ({
      value,
      label: value
    }));
  }

  // Método para obtener los tipos de carácter de actividad científica
  get caracteresActividadCientifica(): { value: string, label: string }[] {
    return Object.entries(CaracterActividadCientifica).map(([key, value]) => ({
      value,
      label: value
    }));
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
        educacion: (formValues.educacion || []).map((edu: any) => ({
          tipo: edu.tipo,
          estado: edu.estado,
          titulo: edu.titulo,
          institucion: edu.institucion,
          fechaEmision: edu.fechaEmision ? new Date(edu.fechaEmision).toISOString().split('T')[0] : null,
          documentoId: edu.documentoId,
          // Campos específicos según el tipo
          duracionAnios: edu.duracionAnios,
          promedio: edu.promedio,
          temaTesis: edu.temaTesis,
          cargaHoraria: edu.cargaHoraria,
          evaluacionFinal: edu.evaluacionFinal,
          tipoActividad: edu.tipoActividad,
          caracter: edu.caracter,
          lugarFechaExposicion: edu.lugarFechaExposicion,
          comentarios: edu.comentarios,
          // Campos para backward compatibility
          descripcion: edu.descripcion,
          fechaInicio: edu.fechaInicio ? new Date(edu.fechaInicio).toISOString().split('T')[0] : null,
          fechaFin: edu.fechaFin ? new Date(edu.fechaFin).toISOString().split('T')[0] : null
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

        // Enviar el archivo al servidor
        this.documentosService.uploadDocumento(formData).pipe(
          finalize(() => {
            this.isLoading = false;
            document.body.removeChild(fileInput);
          })
        ).subscribe({
          next: (response: DocumentoResponse) => {
            // Actualizar el FormControl con el ID del documento
            this.experiencias.at(experienciaIndex).patchValue({
              certificadoId: response.id
            });
            this.snackBar.open('Certificado cargado correctamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error: any) => {
            console.error('Error al cargar el certificado:', error);
            this.snackBar.open('Error al cargar el certificado', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });

    // Simular clic para abrir el selector de archivos
    fileInput.click();
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

    // Actualizar educación si existe
    const educacionArray = this.perfilForm.get('educacion') as FormArray;
    if (profile.educacion && Array.isArray(profile.educacion)) {
      educacionArray.clear();
      profile.educacion.forEach((edu: Educacion) => {
        educacionArray.push(this.createEducacionFormGroup(edu));
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

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones para evitar memory leaks
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }
}
