import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ProfileService, Experiencia } from '../../../../../core/services/profile/profile.service';
import { ExperienceService, ExperienceRequest } from '../../../../../core/services/experience/experience.service';
import { HttpEventType } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export enum PasoWizard {
  INFORMACION_BASICA = 0,
  INFORMACION_DETALLADA = 1,
  DOCUMENTACION = 2,
  RESUMEN = 3
}

@Component({
  selector: 'app-experiencia-container',
  templateUrl: './experiencia-container.component.html',
  styleUrls: ['./experiencia-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ]
})
export class ExperienciaContainerComponent implements OnInit, OnDestroy {
  @Input() usuarioId: string = '';
  @Output() experienciaGuardada = new EventEmitter<any>();
  @Output() cerrar = new EventEmitter<void>();

  // Enum para gestionar los pasos del wizard
  pasoWizard = PasoWizard;
  pasoActual: PasoWizard = PasoWizard.INFORMACION_BASICA;

  // Formularios
  formInformacionBasica: FormGroup;
  formInformacionDetallada: FormGroup;
  formDocumentacion: FormGroup;
  experienciaForm: FormGroup;
  infoBasicaForm: FormGroup;
  infoDetalladaForm: FormGroup;
  documentacionForm: FormGroup;
  esNuevo: boolean = true;

  // Variables para gestionar la carga de archivos
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  cargandoArchivo: boolean = false;
  progresoCarga: number = 0;

  // Variables para el guardado
  guardando: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService,
    private experienceService: ExperienceService
  ) {
    // Inicializar formularios
    this.formInformacionBasica = this.fb.group({
      empresa: ['', Validators.required],
      cargo: ['', Validators.required],
      fechaInicio: [null, Validators.required],
      fechaFin: [null]
    });

    this.formInformacionDetallada = this.fb.group({
      descripcion: ['', Validators.required],
      comentario: ['']
    });

    this.formDocumentacion = this.fb.group({
      tieneCertificado: [false],
      certificadoId: [null]
    });

    // Inicializar el formulario experiencia principal
    this.experienciaForm = this.fb.group({
      id: [null],
      cargo: ['', Validators.required],
      empresa: ['', Validators.required],
      fechaInicio: [null, Validators.required],
      fechaFin: [null],
      descripcion: ['', Validators.required],
      comentario: [''],
      documentUrl: ['']
    });

    // Inicializar referencias para los formularios secundarios
    this.infoBasicaForm = this.fb.group({
      cargo: this.experienciaForm.get('cargo'),
      empresa: this.experienciaForm.get('empresa'),
      fechaInicio: this.experienciaForm.get('fechaInicio'),
      fechaFin: this.experienciaForm.get('fechaFin')
    });

    this.infoDetalladaForm = this.fb.group({
      descripcion: this.experienciaForm.get('descripcion'),
      comentario: this.experienciaForm.get('comentario')
    });

    this.documentacionForm = this.fb.group({
      documentUrl: this.experienciaForm.get('documentUrl')
    });
  }

  ngOnInit(): void {
    if (!this.usuarioId) {
      console.error('No se ha proporcionado un ID de usuario válido');
      this.snackBar.open('Error: No se ha proporcionado un ID de usuario válido', 'Cerrar', {
        duration: 5000
      });
      this.cerrarModal();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Métodos para navegación del wizard
  avanzarPaso(): void {
    if (this.validarPasoActual()) {
      this.pasoActual++;
      this.cdr.markForCheck();
    }
  }

  retrocederPaso(): void {
    if (this.pasoActual > 0) {
      this.pasoActual--;
      this.cdr.markForCheck();
    }
  }

  validarPasoActual(): boolean {
    switch (this.pasoActual) {
      case PasoWizard.INFORMACION_BASICA:
        return this.formInformacionBasica.valid;
      case PasoWizard.INFORMACION_DETALLADA:
        return this.formInformacionDetallada.valid;
      case PasoWizard.DOCUMENTACION:
        return true; // Documentación es opcional
      case PasoWizard.RESUMEN:
        return true; // Solo confirmación
      default:
        return false;
    }
  }

  // Gestión de archivos
  onArchivoSeleccionado(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado = files[0];
      if (this.archivoSeleccionado) {
        this.nombreArchivo = this.archivoSeleccionado.name;
      }
      this.cdr.markForCheck();
    }
  }

  seleccionarArchivo(): void {
    document.getElementById('file-input')?.click();
  }

  eliminarArchivoSeleccionado(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.cdr.markForCheck();
  }

  // Construcción de la experiencia
  private construirExperiencia(): ExperienceRequest {
    const valoresBasicos = this.formInformacionBasica.value;
    const valoresDetallados = this.formInformacionDetallada.value;

    // Adaptar al formato que espera el backend (ExperienceRequestDto)
    const experiencia: ExperienceRequest = {
      company: valoresBasicos.empresa,
      position: valoresBasicos.cargo,
      startDate: valoresBasicos.fechaInicio ? new Date(valoresBasicos.fechaInicio).toISOString().split('T')[0] : '',
      description: valoresDetallados.descripcion || '',
      comments: valoresDetallados.comentario || ''
    };

    // Añadir fecha fin solo si está definida
    if (valoresBasicos.fechaFin) {
      experiencia.endDate = new Date(valoresBasicos.fechaFin).toISOString().split('T')[0];
    }

    // Validar que todas las propiedades requeridas tengan valores
    if (!experiencia.company || !experiencia.position || !experiencia.startDate) {
      console.error('Error: La experiencia no tiene todos los campos requeridos', experiencia);
    } else {
      console.log('Experiencia construida correctamente:', experiencia);
    }

    return experiencia;
  }

  // Guardar experiencia
  guardarExperiencia(): void {
    if (!this.validarTodosLosPasos()) {
      this.snackBar.open('Por favor complete todos los campos requeridos antes de guardar', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const experiencia = this.construirExperiencia();
    console.log('Guardando experiencia:', experiencia);

    // Usar el servicio de experiencia para crear la experiencia
    this.experienceService.createExperience(this.usuarioId, experiencia)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (nuevaExperiencia) => {
          console.log('Experiencia creada correctamente:', nuevaExperiencia);

          // Convertir la respuesta al formato que espera el frontend
          const experienciaMapeada = this.mapearRespuestaBackend(nuevaExperiencia);

          // Verificar que la experiencia tenga ID
          if (nuevaExperiencia && nuevaExperiencia.id) {
            console.log(`Nueva experiencia creada con ID: ${nuevaExperiencia.id}`);

            // Mostrar mensaje de éxito
            this.snackBar.open('Experiencia guardada correctamente', 'Cerrar', {
              duration: 3000
            });

            // Emitir la experiencia creada para actualizar la lista en el componente padre
            if (experienciaMapeada) {
              this.experienciaGuardada.emit({ experienciaNueva: experienciaMapeada });
            }

            // Si hay un archivo seleccionado, lo subimos usando el ID de la nueva experiencia
            if (this.archivoSeleccionado) {
              console.log(`Subiendo certificado para la nueva experiencia con ID: ${nuevaExperiencia.id}`);
              this.subirCertificado(nuevaExperiencia.id);
            } else {
              this.finalizarGuardado();
            }
          } else {
            console.error('La experiencia se creó pero no tiene ID asignado:', nuevaExperiencia);
            this.snackBar.open('Experiencia guardada parcialmente. Es posible que no se pueda adjuntar el certificado.', 'Cerrar', {
              duration: 5000
            });
            this.finalizarGuardado();
          }
        },
        error: (error: unknown) => {
          console.error('Error al guardar la experiencia:', error);
          this.snackBar.open('Error al guardar la experiencia', 'Cerrar', {
            duration: 5000
          });
        }
      });
  }

  private subirCertificado(experienciaId: string): void {
    if (!this.archivoSeleccionado) {
      console.log('No hay archivo seleccionado para subir');
      this.finalizarGuardado();
      return;
    }

    // Validar archivo
    if (this.archivoSeleccionado.size > 10 * 1024 * 1024) { // 10MB
      this.snackBar.open(
        'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.',
        'Entendido',
        { duration: 5000 }
      );
      this.cargandoArchivo = false;
      this.cdr.markForCheck();
      this.finalizarGuardado();
      return;
    }

    this.cargandoArchivo = true;
    this.progresoCarga = 0;
    this.cdr.markForCheck();

    // Usar el servicio de experiencia para subir el documento
    this.experienceService.uploadDocument(experienciaId, this.archivoSeleccionado)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoArchivo = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (event: any) => {
          if (event.type === 'progress') {
            this.progresoCarga = event.progress;
            this.cdr.markForCheck();
          } else if (event.type === 'success') {
            console.log('Certificado subido correctamente:', event.experience);

            this.snackBar.open('Certificado subido correctamente', 'Cerrar', {
              duration: 3000
            });

            // Actualizar experiencia con la URL del documento si es necesario
            if (event.experience && event.experience.documentUrl) {
              console.log('URL del documento: ', event.experience.documentUrl);
            }

            this.finalizarGuardado();
          }
        },
        error: (error) => {
          console.error('Error al subir el certificado:', error);
          this.snackBar.open(
            'Error al subir el certificado: ' + (error.message || 'Error desconocido'),
            'Cerrar',
            { duration: 5000 }
          );
          this.finalizarGuardado();
        }
      });
  }

  private finalizarGuardado(): void {
    // Cerrar el modal
    this.cerrarModal();
  }

  // Cerrar el modal
  cerrarModal(): void {
    this.cerrar.emit();
  }

  private validarTodosLosPasos(): boolean {
    return this.formInformacionBasica.valid && this.formInformacionDetallada.valid;
  }

  // Información resumida para mostrar en la confirmación
  obtenerResumenExperiencia(): string[] {
    const resumen: string[] = [];
    const experiencia = this.construirExperiencia();

    resumen.push(`Cargo: ${experiencia.position}`);
    resumen.push(`Empresa: ${experiencia.company}`);

    if (experiencia.startDate) {
      resumen.push(`Fecha de inicio: ${new Date(experiencia.startDate).toLocaleDateString()}`);
    }

    if (experiencia.endDate) {
      resumen.push(`Fecha de fin: ${new Date(experiencia.endDate).toLocaleDateString()}`);
    }

    if (experiencia.description) {
      resumen.push(`Descripción: ${experiencia.description.substring(0, 50)}${experiencia.description.length > 50 ? '...' : ''}`);
    }

    if (this.archivoSeleccionado) {
      resumen.push(`Certificado: ${this.nombreArchivo}`);
    }

    return resumen;
  }

  actualizarFormulario(experiencia: Experiencia | null): void {
    if (experiencia) {
      // Actualizar la experiencia para inclusión en el formulario
      this.experienciaForm = this.fb.group({
        id: [experiencia.id],
        cargo: [experiencia.cargo, Validators.required],
        empresa: [experiencia.empresa, Validators.required],
        fechaInicio: [experiencia.fechaInicio ? new Date(experiencia.fechaInicio) : null, Validators.required],
        fechaFin: [experiencia.fechaFin ? new Date(experiencia.fechaFin) : null],
        descripcion: [experiencia.descripcion, Validators.required],
        comentario: [experiencia.comentario],
        documentUrl: [experiencia.documentUrl] // Añadir campo para URL del documento
      });
      this.esNuevo = false;
      this.pasoActual = this.pasoWizard.INFORMACION_BASICA;
    } else {
      // Crear un formulario nuevo
      this.experienciaForm = this.fb.group({
        id: [null],
        cargo: ['', Validators.required],
        empresa: ['', Validators.required],
        fechaInicio: [null, Validators.required],
        fechaFin: [null],
        descripcion: ['', Validators.required],
        comentario: [''],
        documentUrl: [''] // Campo para URL del documento en nuevo registro
      });
      this.esNuevo = true;
      this.pasoActual = this.pasoWizard.INFORMACION_BASICA;
    }

    this.infoBasicaForm = this.fb.group({
      cargo: this.experienciaForm.get('cargo'),
      empresa: this.experienciaForm.get('empresa'),
      fechaInicio: this.experienciaForm.get('fechaInicio'),
      fechaFin: this.experienciaForm.get('fechaFin')
    });

    this.infoDetalladaForm = this.fb.group({
      descripcion: this.experienciaForm.get('descripcion'),
      comentario: this.experienciaForm.get('comentario')
    });

    this.documentacionForm = this.fb.group({
      documentUrl: this.experienciaForm.get('documentUrl')
    });

    this.cdr.markForCheck();
  }

  // Método para mapear la respuesta del backend (en inglés) al formato del frontend (en español)
  private mapearRespuestaBackend(experienciaBackend: any): Experiencia | null {
    if (!experienciaBackend) {
      return null;
    }

    return {
      id: experienciaBackend.id,
      empresa: experienciaBackend.company,
      cargo: experienciaBackend.position,
      fechaInicio: experienciaBackend.startDate ? new Date(experienciaBackend.startDate) : new Date(),
      fechaFin: experienciaBackend.endDate ? new Date(experienciaBackend.endDate) : undefined,
      descripcion: experienciaBackend.description,
      comentario: experienciaBackend.comments,
      documentUrl: experienciaBackend.documentUrl
    };
  }
}
