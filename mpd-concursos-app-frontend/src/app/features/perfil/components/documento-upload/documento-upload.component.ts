import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Custom Components
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';

// Services
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { TipoDocumento, DocumentoResponse } from '../../../../core/models/documento.model';

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
  isEditMode = false; // Indica si estamos editando un documento existente

  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private notification: UnifiedNotificationService,
    public dialogRef: UnifiedDialogRef<any>,
    @Inject(DIALOG_DATA) public data: { tipoDocumentoId?: string; documentoIdAEditar?: string }
  ) {
    // Inicializar el formulario en el constructor
    this.documentoForm = this.fb.group({
      tipoDocumentoId: ['', Validators.required],
      descripcion: [''],
      comentarios: [''],
      ladoDNI: [''] // Campo para especificar lado DNI (frente/dorso)
    });
  }

  ngOnInit(): void {
    // Detectar si estamos en modo edición
    this.isEditMode = !!this.data.documentoIdAEditar;
    this.loadTiposDocumento();
  }

  /**
   * Carga los tipos de documento disponibles desde el servicio
   * y preselecciona un tipo si se proporciona un ID en los datos del diálogo.
   */
  private loadTiposDocumento(): void {
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        if (this.data.tipoDocumentoId) {
          this.preSelectTipoDocumento(this.data.tipoDocumentoId);
        }
      },
      error: (error) => {
        console.error('[DocumentoUpload] Error al cargar tipos de documento:', error);
        this.notification.error('Error al cargar los tipos de documento');
      }
    });
  }

  /**
   * Intenta preseleccionar un tipo de documento basado en un ID objetivo.
   * Busca por ID exacto, código, o por coincidencia parcial en el nombre/código.
   * @param targetId El ID o código del tipo de documento a preseleccionar.
   */
  private preSelectTipoDocumento(targetId: string): void {
    let tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.id === targetId);

    if (!tipoSeleccionado) {
      tipoSeleccionado = this.tiposDocumento.find(tipo => tipo.code === targetId);
    }

    if (!tipoSeleccionado) {
      // Buscar por nombre similar o coincidencia parcial
      const idBusqueda = targetId.toLowerCase();
      for (const tipo of this.tiposDocumento) {
        const nombreTipo = tipo.nombre.toLowerCase();
        const codigoTipo = tipo.code ? tipo.code.toLowerCase() : '';

        if (nombreTipo.includes(idBusqueda) || idBusqueda.includes(nombreTipo) ||
            codigoTipo.includes(idBusqueda) || idBusqueda.includes(codigoTipo)) {
          tipoSeleccionado = tipo;
          break;
        }
      }
    }

    if (tipoSeleccionado) {
      this.tipoDocumentoSeleccionado = tipoSeleccionado;
      this.documentoForm.get('tipoDocumentoId')?.setValue(tipoSeleccionado.id);
    } else {
      // Si aún no se encuentra, establecer un tipo temporal para mostrar en la UI
      this.tipoDocumentoSeleccionado = {
        id: targetId,
        nombre: this.formatearNombreTipoDocumento(targetId),
        code: targetId
      } as TipoDocumento;
      this.documentoForm.get('tipoDocumentoId')?.setValue(targetId); // Mantener el ID original para el backend
      this.notification.warning(`No se encontró un tipo de documento exacto para "${targetId}". Se usará un nombre genérico.`);
    }

    this.esDNIGenerico = this.esTipoDNI(); // Actualizar la bandera después de la selección
  }

  /**
   * Formatea el nombre de un tipo de documento a partir de su ID/código
   * para una mejor visualización en la UI.
   * @param id El ID o código del tipo de documento.
   * @returns El nombre formateado.
   */
  private formatearNombreTipoDocumento(id: string): string {
    let nombre = id.replace(/^(doc-|documento-|tipo-)/i, '');
    nombre = nombre.replace(/-/g, ' ');
    nombre = nombre.split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
    return nombre;
  }

  /**
   * Verifica si el tipo de documento seleccionado es un DNI genérico
   * (no específico de frente o dorso).
   * @returns `true` si es un DNI genérico, `false` en caso contrario.
   */
  esTipoDNI(): boolean {
    const tipoSeleccionado = this.tipoDocumentoSeleccionado;
    const tipoIdForm = this.documentoForm.get('tipoDocumentoId')?.value;

    if (!tipoSeleccionado && !tipoIdForm) {
      return false;
    }

    const checkNameAndCode = (tipo: TipoDocumento) => {
      const nombre = tipo.nombre.toLowerCase();
      const code = tipo.code?.toLowerCase() || '';

      return (nombre.includes('dni') || nombre.includes('documento nacional')) &&
             !nombre.includes('frente') && !nombre.includes('dorso') &&
             !nombre.includes('frontal') && !nombre.includes('reverso') &&
             !code.includes('frente') && !code.includes('dorso');
    };

    // Priorizar el tipo seleccionado del componente
    if (tipoSeleccionado) {
      if (checkNameAndCode(tipoSeleccionado)) {
        return true;
      }
      if (tipoSeleccionado.code === 'dni') { // Asumiendo un código específico para DNI genérico
        return true;
      }
    }

    // Si no hay tipo seleccionado, verificar el valor en el formulario (ID)
    if (tipoIdForm && tipoIdForm.toLowerCase() === 'dni') {
      return true;
    }

    return false;
  }

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

  /**
   * Procesa el archivo seleccionado, realizando validaciones de tipo y tamaño.
   * @param file El archivo a procesar.
   */
  processFile(file: File): void {
    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      this.notification.error('Solo se permiten archivos PDF');
      this.selectedFile = null;
      return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      this.notification.error('El archivo excede el tamaño máximo de 10MB');
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  /**
   * Formatea el tamaño de un archivo en bytes a un formato legible (KB, MB).
   * @param bytes El tamaño del archivo en bytes.
   * @returns El tamaño formateado.
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }

  /**
   * Envía el formulario para cargar el documento.
   */
  onSubmit(): void {
    if (this.documentoForm.valid && this.selectedFile) {
      const formValues = this.documentoForm.value;
      let finalTipoDocumentoId = formValues.tipoDocumentoId;
      let comentarios = formValues.comentarios || '';

      // Lógica específica para documentos DNI
      if (this.esTipoDNI()) {
        const ladoDNI = formValues.ladoDNI;
        if (!ladoDNI) {
          this.documentoForm.get('ladoDNI')?.markAsTouched();
          this.notification.error('Por favor, especifique qué lado del DNI está subiendo');
          return;
        }
        // Modificar tipoDocumentoId y comentarios según el lado del DNI
        if (ladoDNI === 'frente') {
          finalTipoDocumentoId = 'dni-frente'; // ID específico para el backend
          comentarios = `Frente (Anverso) del DNI` + (comentarios ? ` - ${comentarios}` : '');
        } else if (ladoDNI === 'dorso') {
          finalTipoDocumentoId = 'dni-dorso'; // ID específico para el backend
          comentarios = `Dorso (Reverso) del DNI` + (comentarios ? ` - ${comentarios}` : '');
        }
      }

      if (!finalTipoDocumentoId) {
        console.error('[DocumentoUpload] No se pudo determinar el ID del tipo de documento final.');
        this.notification.error('Error: No se pudo determinar el tipo de documento.');
        return;
      }

      this.isUploading = true;
      this.uploadProgress = 0; // Reiniciar el progreso

      // CRITICAL FIX: Logging detallado para diagnosticar problemas
      console.log('[DocumentoUpload] Preparando subida de documento:', {
        fileName: this.selectedFile.name,
        fileSize: this.selectedFile.size,
        fileType: this.selectedFile.type,
        finalTipoDocumentoId: finalTipoDocumentoId,
        comentarios: comentarios,
        tiposDocumentoDisponibles: this.tiposDocumento.map(t => ({ id: t.id, code: t.code, nombre: t.nombre }))
      });

      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);
      formData.append('tipoDocumentoId', finalTipoDocumentoId);

      if (formValues.descripcion) {
        formData.append('descripcion', formValues.descripcion);
      }
      if (comentarios) {
        formData.append('comentarios', comentarios);
      }

      // Antes de la subida, verificar si el finalTipoDocumentoId existe en la lista de tipos cargados
      const tipoValidoEnLista = this.tiposDocumento.some(tipo =>
        tipo.id === finalTipoDocumentoId || tipo.code === finalTipoDocumentoId
      );

      if (!tipoValidoEnLista) {
        console.warn(`[DocumentoUpload] El ID del tipo de documento '${finalTipoDocumentoId}' no coincide con ningún tipo disponible en el sistema. Intentando buscar un tipo similar.`);
        const tipoSimilar = this.tiposDocumento.find(tipo =>
          tipo.nombre.toLowerCase().includes(finalTipoDocumentoId.toLowerCase()) ||
          (tipo.code && tipo.code.toLowerCase().includes(finalTipoDocumentoId.toLowerCase())) ||
          finalTipoDocumentoId.toLowerCase().includes(tipo.nombre.toLowerCase()) ||
          (tipo.code && finalTipoDocumentoId.toLowerCase().includes(tipo.code.toLowerCase()))
        );

        if (tipoSimilar) {
          console.warn(`[DocumentoUpload] Usando tipo similar: ${tipoSimilar.id || tipoSimilar.code}`);
          formData.set('tipoDocumentoId', tipoSimilar.id || tipoSimilar.code!); // Usar set para sobrescribir si ya se añadió
        } else {
          // Si no se encuentra un tipo similar, se procede con el ID original, pero se advierte.
          // El backend será el encargado de la validación final.
          this.notification.warning('Advertencia: El tipo de documento seleccionado podría no ser reconocido por el sistema.');
        }
      }

      // Usar el método correcto según el modo (crear vs actualizar)
      const serviceCall = this.isEditMode && this.data.documentoIdAEditar
        ? this.documentosService.updateDocumento(this.data.documentoIdAEditar, formData)
        : this.documentosService.uploadDocumento(formData);

      serviceCall
        .pipe(
          finalize(() => {
            this.isUploading = false;
            this.uploadProgress = 0;
          })
        )
        .subscribe({
          next: (_response: DocumentoResponse) => {
            const mensaje = this.isEditMode ? 'Documento actualizado correctamente.' : 'Documento cargado correctamente.';
            this.notification.success(mensaje);
            this.dialogRef.close(true); // Cerrar con resultado exitoso
          },
          error: (error) => {
            console.error('[DocumentoUpload] Error al cargar documento:', error);

            let mensajeError = 'Error al cargar el documento. Por favor, intente nuevamente.';

            if (error.error) {
              console.error('[DocumentoUpload] Detalles del error del servidor:', error.error);
              mensajeError = error.error.message || mensajeError;
            } else if (error.message) {
              mensajeError = error.message;
            }

            if (error.status === 500) {
              mensajeError = 'Error interno del servidor. Es posible que el tipo de documento no sea válido o que el archivo no cumpla con los requisitos.';
            } else if (error.status === 400) {
                mensajeError = `Solicitud inválida: ${error.error.message || 'Verifique los datos ingresados.'}`;
            }

            this.notification.error(mensajeError);
          }
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores de validación
      this.documentoForm.markAllAsTouched();
      this.notification.error('Por favor, complete todos los campos obligatorios y seleccione un archivo.');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
