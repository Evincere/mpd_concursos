import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService, UserProfile, Experiencia, Educacion, Habilidad, TipoEducacion, EstadoEducacion, TipoActividadCientifica, CaracterActividadCientifica } from '../../core/services/profile/profile.service';
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
import { EducacionComponent } from './components/educacion/educacion.component';

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
    EducacionComponent
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
    
    // Limpiar el array primero
    educacionArray.clear();
    
    // Si no hay educación, salir tempranamente
    if (!profile.educacion || !Array.isArray(profile.educacion) || profile.educacion.length === 0) {
      return;
    }
    
    // Tamaño del lote para procesar
    const batchSize = 5;
    const total = profile.educacion.length;
    const educacionArray2 = [...profile.educacion]; // Copia segura del array
    
    // Procesar en lotes para evitar bloquear el hilo principal
    const processBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, total);
      
      // Procesar este lote
      for (let i = startIndex; i < endIndex; i++) {
        const item = educacionArray2[i];
        const grupo = this.createEducacionFormGroup(item);
        educacionArray.push(grupo);
      }
      
      // Si hay más lotes para procesar, programarlos para el siguiente ciclo
      if (endIndex < total) {
        setTimeout(() => processBatch(endIndex), 0);
      } else {
        console.debug('Educación cargada: ' + educacionArray.length + ' elementos');
        // Cuando hayamos terminado, desactivar el indicador de carga
        this.cdr.markForCheck();
      }
    };
    
    // Iniciar procesamiento por lotes
    processBatch(0);
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

  // Método para agregar un nuevo item de educación - versión ultra simplificada
  agregarEducacion(): void {
    if (this.isLoading) return;

    // Activar indicador de carga
    this.isLoading = true;
    
    // Usar setTimeout con 0ms para devolver el control inmediatamente al navegador
    // y evitar bloquear la interfaz de usuario
    setTimeout(() => {
      try {
        // Crear un formulario mínimo (solo con campos requeridos) para reducir la carga inicial
        const formGroup = this.fb.group({
          titulo: ['', Validators.required],
          institucion: ['', Validators.required],
          tipo: [TipoEducacion.GRADO, Validators.required],
          estado: [EstadoEducacion.FINALIZADO, Validators.required],
          documentoId: [null]
        });
    
        // Agregar al FormArray
        const educacionArray = this.perfilForm.get('educacion') as FormArray;
        educacionArray.push(formGroup);
        
        // Desactivar indicador de carga después de un breve retraso
        // para permitir que el navegador actualice la UI
        setTimeout(() => {
          this.isLoading = false;
          
          // Hacer scroll al elemento recién agregado en otro ciclo
          setTimeout(() => {
            const elements = document.querySelectorAll('.cv-item');
            if (elements?.length > 0) {
              const lastElement = elements[elements.length - 1];
              lastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }, 50);
      } catch (error) {
        console.error('Error al agregar educación:', error);
        this.isLoading = false;
      }
    }, 0);
  }

  // Versión simplificada para crear un grupo de formulario con campos mínimos o completos
  createEducacionFormGroup(educacion?: any): FormGroup {
    console.debug('Creando grupo de educación');
    
    // Si tenemos datos completos, crear un formulario completo
    if (educacion) {
      return this.fb.group({
        titulo: [educacion.titulo || '', Validators.required],
        institucion: [educacion.institucion || '', Validators.required],
        tipo: [educacion.tipo || TipoEducacion.GRADO, Validators.required],
        estado: [educacion.estado || EstadoEducacion.FINALIZADO, Validators.required],
        documentoId: [educacion.documentoId || null],
        fechaInicio: [educacion.fechaInicio || null],
        fechaFin: [educacion.fechaFin || null],
        fechaEmision: [educacion.fechaEmision || null],
        duracionAnios: [educacion.duracionAnios || null, [Validators.min(1)]],
        promedio: [educacion.promedio || null, [Validators.min(0), Validators.max(10)]],
        temaTesis: [educacion.temaTesis || ''],
        cargaHoraria: [educacion.cargaHoraria || null, [Validators.min(1)]],
        evaluacionFinal: [educacion.evaluacionFinal || false],
        tipoActividad: [educacion.tipoActividad || null],
        caracter: [educacion.caracter || null],
        lugarFechaExposicion: [educacion.lugarFechaExposicion || ''],
        comentarios: [educacion.comentarios || ''],
        descripcion: [educacion.descripcion || '']
      });
    } else {
      // Si es un nuevo elemento, crear solo los campos básicos para mejorar rendimiento
      return this.fb.group({
        titulo: ['', Validators.required],
        institucion: ['', Validators.required],
        tipo: [TipoEducacion.GRADO, Validators.required],
        estado: [EstadoEducacion.FINALIZADO, Validators.required],
        documentoId: [null]
      });
    }
  }

  // Método para cargar documento de educación
  cargarDocumentoEducacion(index: number): void {
    if (this.isLoading) return;
    
    // Crear un input de tipo file oculto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Manejar la selección de archivo
    fileInput.addEventListener('change', (event: any) => {
      if (!event.target.files || event.target.files.length === 0) {
        document.body.removeChild(fileInput);
        return;
      }
      
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
      this.cdr.markForCheck();

      // Subir el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Usar setTimeout para dar tiempo a que la UI se actualice antes de la operación costosa
      setTimeout(() => {
        this.documentosService.uploadDocumento(formData).subscribe({
          next: (response: DocumentoResponse) => {
            // Actualizar el ID del documento en el formulario de manera segura
            try {
              const educacionItem = this.educacion.at(index) as FormGroup;
              if (educacionItem) {
                educacionItem.patchValue({
                  documentoId: response.id
                });
              }

              this.snackBar.open('Documento cargado exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            } catch (error) {
              console.error('Error al actualizar el formulario:', error);
            } finally {
              this.isLoading = false;
              this.cdr.markForCheck();
            }
          },
          error: (error: any) => {
            console.error('Error al cargar el documento', error);
            this.snackBar.open('Error al cargar el documento', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          complete: () => {
            // Asegurarse de que el input se elimine siempre
            try {
              if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
              }
            } catch (e) {
              console.error('Error al eliminar el input:', e);
            }
          }
        });
      }, 0);
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

  verCertificadoEducacion(certificadoId: string) {
    if (certificadoId) {
      this.documentosService.getDocumentoFile(certificadoId).subscribe({
        next: (documento: Blob) => {
          this.dialog.open(DocumentoViewerComponent, {
            data: { documento },
            width: '80%',
            height: '80%'
          });
        },
        error: (error: Error) => {
          this.snackBar.open('Error al cargar el certificado', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  eliminarCertificadoEducacion(index: number) {
    const educacionArray = this.perfilForm.get('educacion') as FormArray;
    const educacion = educacionArray.at(index);
    const certificadoId = educacion.get('certificadoId')?.value;

    if (certificadoId) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { message: '¿Está seguro que desea eliminar el certificado?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.documentosService.deleteDocumento(certificadoId).subscribe({
            next: () => {
              educacion.patchValue({ certificadoId: null });
              this.snackBar.open('Certificado eliminado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: (error) => {
              this.snackBar.open('Error al eliminar el certificado', 'Cerrar', { duration: 3000 });
            }
          });
        }
      });
    }
  }

  cargarCertificadoEducacion(index: number) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', { duration: 3000 });
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        this.documentosService.uploadDocumento(formData).subscribe(
          (response: DocumentoResponse) => {
            const educacionArray = this.perfilForm.get('educacion') as FormArray;
            const educacion = educacionArray.at(index);
            educacion.patchValue({ certificadoId: response.id });
            this.snackBar.open('Certificado cargado correctamente', 'Cerrar', { duration: 3000 });
          },
          error => {
            this.snackBar.open('Error al cargar el certificado', 'Cerrar', { duration: 3000 });
          }
        );
      }
    };

    fileInput.click();
  }

  // Método para cargar campos adicionales de educación bajo demanda
  cargarCamposAdicionales(index: number): void {
    if (this.isLoading) return;
    
    // Activar indicador de carga
    this.isLoading = true;
    
    // Usar setTimeout para no bloquear la interfaz de usuario
    setTimeout(() => {
      try {
        const formArray = this.perfilForm.get('educacion') as FormArray;
        const educacionItem = formArray.at(index) as FormGroup;
        
        // Obtener los valores actuales del formulario
        const currentValues = educacionItem.value;
        
        // Crear un nuevo FormGroup con todos los campos
        const nuevoFormGroup = this.fb.group({
          titulo: [currentValues.titulo || '', Validators.required],
          institucion: [currentValues.institucion || '', Validators.required],
          tipo: [currentValues.tipo || TipoEducacion.GRADO, Validators.required],
          estado: [currentValues.estado || EstadoEducacion.FINALIZADO, Validators.required],
          documentoId: [currentValues.documentoId || null],
          // Campos adicionales
          fechaInicio: [null],
          fechaFin: [null],
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
          descripcion: ['']
        });
        
        // Reemplazar el FormGroup en el FormArray
        formArray.setControl(index, nuevoFormGroup);
        
      } catch (error) {
        console.error('Error al cargar campos adicionales:', error);
      } finally {
        this.isLoading = false;
      }
    }, 0);
  }
}
