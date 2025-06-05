import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Custom Components
import { CustomDialogRef, CUSTOM_DIALOG_DATA } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';

// Services
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { TipoDocumento } from '../../../../core/models/documento.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-documento-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './documento-upload.component.html',
  styleUrls: ['./documento-upload.component.scss']
})
export class DocumentoUploadComponent implements OnInit {
  documentoForm: FormGroup;
  tiposDocumento: TipoDocumento[] = [];
  tipoDocumentoSeleccionado: TipoDocumento | null = null;
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  esDNIGenerico = false;

  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private notification: CustomNotificationService,
    public dialogRef: CustomDialogRef<DocumentoUploadComponent>,
    @Inject(CUSTOM_DIALOG_DATA) public data: { tipoDocumentoId?: string }
  ) {
    console.log(`[DocumentoUpload] Constructor - tipoDocumentoId recibido: ${data.tipoDocumentoId || 'ninguno'}`);

    // Inicializar el formulario con el ID del tipo de documento si está disponible
    this.documentoForm = this.fb.group({
      tipoDocumentoId: [data.tipoDocumentoId || '', Validators.required],
      ladoDNI: [''],
      comentarios: ['']
    });

    // Si tenemos un ID de tipo de documento, lo mostramos en el título del diálogo
    if (data.tipoDocumentoId) {
      console.log(`[DocumentoUpload] Tipo de documento preseleccionado: ${data.tipoDocumentoId}`);
    }
  }

  ngOnInit(): void {
    // Cargar los tipos de documento y luego buscar el tipo seleccionado
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        console.log(`[DocumentoUpload] Tipos de documento cargados: ${tipos.length}`);

        // Si tenemos un ID de tipo de documento, buscamos el objeto completo
        if (this.data.tipoDocumentoId) {
          console.log(`[DocumentoUpload] Buscando tipo de documento con ID/código: ${this.data.tipoDocumentoId}`);

          // Buscar por ID exacto
          let tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.id === this.data.tipoDocumentoId);

          // Si no encontramos por ID, buscar por código
          if (!tipoSeleccionado) {
            tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.code === this.data.tipoDocumentoId);
            if (tipoSeleccionado) {
              console.log(`[DocumentoUpload] Tipo de documento encontrado por código: ${tipoSeleccionado.nombre}`);
            }
          } else {
            console.log(`[DocumentoUpload] Tipo de documento encontrado por ID: ${tipoSeleccionado.nombre}`);
          }

          // Si encontramos el tipo, lo establecemos
          if (tipoSeleccionado) {
            this.tipoDocumentoSeleccionado = tipoSeleccionado;
            // Asegurarnos de que el valor esté en el formulario
            this.documentoForm.get('tipoDocumentoId')?.setValue(tipoSeleccionado.id);
          } else {
            // Si no encontramos el tipo exacto, buscamos por nombre similar
            console.log(`[DocumentoUpload] Buscando tipo de documento por nombre similar...`);

            // Casos especiales para DNI
            if (this.data.tipoDocumentoId === 'dni-frente' || this.data.tipoDocumentoId === 'dni-dorso') {
              // Buscar un tipo de documento relacionado con DNI
              tipoSeleccionado = this.tiposDocumento.find(tipo =>
                tipo.nombre.toLowerCase().includes('dni') ||
                (tipo.code && tipo.code.includes('dni'))
              );

              if (tipoSeleccionado) {
                console.log(`[DocumentoUpload] Tipo de documento DNI encontrado: ${tipoSeleccionado.nombre}`);
                this.tipoDocumentoSeleccionado = tipoSeleccionado;
                this.documentoForm.get('tipoDocumentoId')?.setValue(tipoSeleccionado.id);
              }
            }

            // Si aún no encontramos, buscar por coincidencia parcial en el nombre
            if (!this.tipoDocumentoSeleccionado) {
              for (const tipo of this.tiposDocumento) {
                // Convertir ambos a minúsculas para comparación insensible a mayúsculas/minúsculas
                const idBusqueda = this.data.tipoDocumentoId.toLowerCase();
                const nombreTipo = tipo.nombre.toLowerCase();
                const codigoTipo = tipo.code ? tipo.code.toLowerCase() : '';

                // Buscar coincidencias parciales en el nombre o código
                if (idBusqueda.includes(nombreTipo) || nombreTipo.includes(idBusqueda) ||
                    idBusqueda.includes(codigoTipo) || codigoTipo.includes(idBusqueda)) {
                  console.log(`[DocumentoUpload] Tipo de documento similar encontrado: ${tipo.nombre}`);
                  this.tipoDocumentoSeleccionado = tipo;
                  this.documentoForm.get('tipoDocumentoId')?.setValue(tipo.id);
                  break;
                }
              }
            }

            // Si aún no encontramos, crear un tipo de documento temporal para la UI
            if (!this.tipoDocumentoSeleccionado) {
              console.log(`[DocumentoUpload] Creando tipo de documento temporal para UI`);
              // Crear un objeto temporal solo para la UI (no se guarda en el backend)
              this.tipoDocumentoSeleccionado = {
                id: this.data.tipoDocumentoId,
                code: this.data.tipoDocumentoId,
                nombre: this.formatearNombreTipoDocumento(this.data.tipoDocumentoId),
                descripcion: '',
                requerido: true,
                orden: 0,
                activo: true
              };
              // No cambiamos el valor en el formulario para enviar el ID original al backend
            }
          }
        }
      },
      error: (error) => {
        console.error('[DocumentoUpload] Error al cargar tipos de documento:', error);
        this.notification.error('Error al cargar los tipos de documento');
      }
    });
  }

  // Método para formatear el nombre de un tipo de documento a partir de su ID/código
  private formatearNombreTipoDocumento(id: string): string {
    // Eliminar prefijos comunes
    let nombre = id.replace(/^(doc-|documento-|tipo-)/i, '');

    // Reemplazar guiones por espacios
    nombre = nombre.replace(/-/g, ' ');

    // Capitalizar cada palabra
    nombre = nombre.split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');

    return nombre;
  }

  // Método para verificar si el documento es un DNI
  esTipoDNI(): boolean {
    // Verificar si el tipo seleccionado es DNI genérico
    if (this.tipoDocumentoSeleccionado) {
      const nombre = this.tipoDocumentoSeleccionado.nombre.toLowerCase();
      const codigo = this.tipoDocumentoSeleccionado.code?.toLowerCase() || '';

      // Si es un DNI genérico (no específico de frente o dorso)
      if ((nombre.includes('dni') || nombre.includes('documento nacional')) &&
          !nombre.includes('frente') && !nombre.includes('dorso') &&
          !nombre.includes('frontal') && !nombre.includes('reverso') &&
          !codigo.includes('frente') && !codigo.includes('dorso')) {
        return true;
      }

      // Si es un tipo genérico de DNI
      if (codigo === 'dni') {
        return true;
      }
    }

    // Verificar si el ID del tipo es genérico de DNI
    const tipoId = this.documentoForm.get('tipoDocumentoId')?.value;
    if (tipoId === 'dni') {
      return true;
    }

    return false;
  }

  // El método cargarTiposDocumento ha sido reemplazado por la lógica en ngOnInit

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File): void {
    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      this.notification.error('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.notification.error('El archivo excede el tamaño máximo de 5MB');
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }

  onSubmit(): void {
    if (this.documentoForm.valid && this.selectedFile) {
      // Validar que si es DNI, se haya seleccionado el lado
      if (this.esTipoDNI() && !this.documentoForm.get('ladoDNI')?.value) {
        this.documentoForm.get('ladoDNI')?.markAsTouched();
        this.notification.error('Por favor, especifique qué lado del DNI está subiendo');
        return;
      }

      this.isUploading = true;

      const formData = new FormData();
      // Asegurarnos de que el archivo se envíe como 'file'
      formData.append('file', this.selectedFile, this.selectedFile.name);

      // Obtener el ID o código del tipo de documento
      let tipoDocumentoId = this.documentoForm.get('tipoDocumentoId')?.value;

      // Si tenemos un tipo de documento seleccionado pero no está en el formulario, usamos su código o ID
      if (!tipoDocumentoId && this.tipoDocumentoSeleccionado) {
        // Preferir el código sobre el ID si está disponible
        tipoDocumentoId = this.tipoDocumentoSeleccionado.code || this.tipoDocumentoSeleccionado.id;
        console.log(`[DocumentoUpload] Usando código/ID del tipo de documento seleccionado: ${tipoDocumentoId}`);
      }

      // Si tenemos un ID en los datos de entrada, lo usamos como respaldo
      if (!tipoDocumentoId && this.data.tipoDocumentoId) {
        tipoDocumentoId = this.data.tipoDocumentoId;
        console.log(`[DocumentoUpload] Usando ID del tipo de documento de los datos de entrada: ${tipoDocumentoId}`);
      }

      // Si es un DNI genérico, modificamos el ID según el lado seleccionado
      if (this.esTipoDNI() && this.documentoForm.get('ladoDNI')?.value) {
        const lado = this.documentoForm.get('ladoDNI')?.value;
        if (lado === 'frente') {
          tipoDocumentoId = 'dni-frente';
          console.log(`[DocumentoUpload] Modificando tipo de documento a DNI Frente`);
        } else if (lado === 'dorso') {
          tipoDocumentoId = 'dni-dorso';
          console.log(`[DocumentoUpload] Modificando tipo de documento a DNI Dorso`);
        }
      }

      if (tipoDocumentoId) {
        formData.append('tipoDocumentoId', tipoDocumentoId);
      } else {
        console.error('[DocumentoUpload] No se pudo determinar el ID del tipo de documento');
        this.notification.error('Error: No se pudo determinar el tipo de documento');
        this.isUploading = false;
        return;
      }

      // Agregar comentarios al FormData
      let comentarios = this.documentoForm.get('comentarios')?.value || '';

      // Si es un DNI, agregar información sobre el lado en los comentarios
      if (this.esTipoDNI() && this.documentoForm.get('ladoDNI')?.value) {
        const lado = this.documentoForm.get('ladoDNI')?.value;
        const ladoTexto = lado === 'frente' ? 'Frente (Anverso)' : 'Dorso (Reverso)';

        if (comentarios) {
          comentarios = `${ladoTexto} - ${comentarios}`;
        } else {
          comentarios = `${ladoTexto} del DNI`;
        }
      }

      if (comentarios) {
        formData.append('comentarios', comentarios);
      }

      // Imprimir el FormData para debug
      console.log('[DocumentoUpload] FormData contenido:', {
        file: this.selectedFile.name,
        tipoDocumentoId: tipoDocumentoId || 'no seleccionado',
        comentarios: comentarios || 'no proporcionados'
      });

      // Verificar si el tipo de documento es válido
      const tipoValido = this.tiposDocumento.some(tipo => tipo.id === tipoDocumentoId);
      if (!tipoValido) {
        console.warn(`[DocumentoUpload] El ID del tipo de documento '${tipoDocumentoId}' no coincide con ningún tipo disponible en el sistema`);
        console.log('[DocumentoUpload] Tipos disponibles:', this.tiposDocumento.map(t => ({ id: t.id, nombre: t.nombre })));

        // Intentar encontrar un tipo similar
        const tipoSimilar = this.tiposDocumento.find(tipo =>
          tipo.nombre.toLowerCase().includes(tipoDocumentoId.toLowerCase()) ||
          tipoDocumentoId.toLowerCase().includes(tipo.nombre.toLowerCase())
        );

        if (tipoSimilar) {
          console.log(`[DocumentoUpload] Se encontró un tipo similar: ${tipoSimilar.nombre} (${tipoSimilar.id})`);
          tipoDocumentoId = tipoSimilar.id;
          formData.delete('tipoDocumentoId');
          formData.append('tipoDocumentoId', tipoSimilar.id);
        }
      }

      this.documentosService.uploadDocumento(formData)
        .pipe(
          finalize(() => {
            this.isUploading = false;
            this.uploadProgress = 0;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('[DocumentoUpload] Respuesta del servidor:', response);
            this.notification.success('Documento cargado exitosamente');
            this.dialogRef.close(response as any);
          },
          error: (error) => {
            console.error('[DocumentoUpload] Error al cargar documento:', error);

            // Mostrar información detallada sobre el error
            let mensajeError = 'Error al cargar el documento. Por favor, intente nuevamente.';

            if (error.error) {
              console.error('[DocumentoUpload] Detalles del error:', error.error);
              mensajeError = error.error.message || mensajeError;
            }

            if (error.status === 500) {
              mensajeError = 'Error interno del servidor. Es posible que el tipo de documento no sea válido o que el archivo no cumpla con los requisitos.';
            }

            this.notification.error(mensajeError);
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}