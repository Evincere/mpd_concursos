import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, finalize, switchMap, catchError } from 'rxjs/operators';
import { ProfileService } from '../../../../../core/services/profile/profile.service';
import { DocumentosService } from '../../../../../core/services/documentos/documentos.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

// Interfaz para la respuesta de la API
interface ExperienciaResponse {
  id: string;
  [key: string]: any;
}

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
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private profileService: ProfileService,
    private documentosService: DocumentosService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
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
  private construirExperiencia(): any {
    const valoresBasicos = this.formInformacionBasica.value;
    const valoresDetallados = this.formInformacionDetallada.value;

    return {
      empresa: valoresBasicos.empresa,
      cargo: valoresBasicos.cargo,
      fechaInicio: valoresBasicos.fechaInicio ? new Date(valoresBasicos.fechaInicio).toISOString().split('T')[0] : null,
      fechaFin: valoresBasicos.fechaFin ? new Date(valoresBasicos.fechaFin).toISOString().split('T')[0] : null,
      descripcion: valoresDetallados.descripcion,
      comentario: valoresDetallados.comentario
    };
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

    // Obtenemos el perfil completo primero, luego actualizamos las experiencias
    this.profileService.getUserProfile()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(perfil => {
          console.log('Perfil actual obtenido:', perfil);
          // Creamos una copia del array de experiencias o inicializamos uno nuevo
          const experiencias = perfil.experiencias ? [...perfil.experiencias] : [];

          // Agregamos la nueva experiencia
          experiencias.push(experiencia);

          // Actualizamos el perfil con la nueva experiencia
          const perfilActualizado = {
            ...perfil,
            experiencias: experiencias
          };
          console.log('Perfil a actualizar:', perfilActualizado);

          return this.profileService.updateUserProfile(perfilActualizado);
        }),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (respuesta) => {
          console.log('Perfil actualizado correctamente:', respuesta);
          
          // Emitimos el evento con la respuesta completa
          this.experienciaGuardada.emit(respuesta);
          
          // Mostramos mensaje de éxito
          this.snackBar.open('Experiencia guardada correctamente', 'Cerrar', {
            duration: 3000
          });

          // Si hay un archivo seleccionado, lo subimos
          if (this.archivoSeleccionado) {
            this.subirCertificado(this.usuarioId);
          } else {
            this.finalizarGuardado();
          }
        },
        error: (error: unknown) => {
          console.error('Error al guardar la experiencia:', error);
          this.snackBar.open('Error al guardar la experiencia', 'Cerrar', {
            duration: 5000
          });
          this.guardando = false;
          this.cdr.markForCheck();
        }
      });
  }

  private subirCertificado(experienciaId: string | number): void {
    if (!this.archivoSeleccionado) {
      this.finalizarGuardado();
      return;
    }

    this.cargandoArchivo = true;
    this.progresoCarga = 0;
    this.cdr.markForCheck();

    // Verificar si el endpoint existe
    this.http.head(`${environment.apiUrl}/documentos/upload/experiencia`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.log('El endpoint para subir documentos no está disponible:', error);
          // Si el endpoint no existe, mostramos un mensaje informativo pero no bloqueante
          this.snackBar.open('No se pudo subir el certificado porque la funcionalidad no está disponible en este momento', 'Entendido', {
            duration: 5000
          });
          // Continuamos con el flujo normal
          this.finalizarGuardado();
          // Devolvemos un observable vacío para que no se continúe con la lógica
          return EMPTY;
        })
      )
      .subscribe(() => {
        // Si el endpoint existe, procedemos con la subida
        this.documentosService.subirDocumentoExperiencia(this.archivoSeleccionado!, experienciaId)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.cargandoArchivo = false;
              this.cdr.markForCheck();
            })
          )
          .subscribe({
            next: (response) => {
              this.snackBar.open('Certificado subido correctamente', 'Cerrar', {
                duration: 3000
              });
              this.finalizarGuardado();
            },
            error: (error) => {
              console.error('Error al subir el certificado:', error);
              this.snackBar.open('Error al subir el certificado', 'Cerrar', {
                duration: 5000
              });
              // Aún así finalizamos el proceso
              this.finalizarGuardado();
            }
          });
      });
  }

  private finalizarGuardado(): void {
    // Emitir la experiencia guardada para que el componente padre la reciba
    const experienciaGuardadaObj = this.construirExperiencia();
    console.log('Emitiendo evento experienciaGuardada con:', experienciaGuardadaObj);
    
    // Recargar el perfil para asegurar que tenemos los datos más recientes
    this.profileService.getUserProfile().subscribe(perfilActualizado => {
      // Emitir el perfil actualizado para que el componente padre lo reciba
      this.experienciaGuardada.emit(perfilActualizado);
      
      // Cerrar el modal
      this.cerrarModal();
    });
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

    resumen.push(`Cargo: ${experiencia.cargo}`);
    resumen.push(`Empresa: ${experiencia.empresa}`);

    if (experiencia.fechaInicio) {
      resumen.push(`Fecha de inicio: ${new Date(experiencia.fechaInicio).toLocaleDateString()}`);
    }

    if (experiencia.fechaFin) {
      resumen.push(`Fecha de fin: ${new Date(experiencia.fechaFin).toLocaleDateString()}`);
    }

    if (experiencia.descripcion) {
      resumen.push(`Descripción: ${experiencia.descripcion.substring(0, 50)}${experiencia.descripcion.length > 50 ? '...' : ''}`);
    }

    if (this.archivoSeleccionado) {
      resumen.push(`Certificado: ${this.nombreArchivo}`);
    }

    return resumen;
  }
}
