import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DocumentoUsuario, TipoDocumento } from '@core/models/documento.model';
import { DocumentoUploadDialogComponent } from './documento-upload-dialog/documento-upload-dialog.component';
import { DocumentoMultipleUploadDialogComponent } from './documento-multiple-upload-dialog/documento-multiple-upload-dialog.component';
import { DocumentoViewerComponent } from '../../../../perfil/components/documento-viewer/documento-viewer.component';
import { DocumentosService } from '@core/services/documentos/documentos.service';

import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-documentos-embebidos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DocumentoViewerComponent
  ],
  template: `
    <div class="documentos-container">
      <div class="documentos-header">
        <div>
          <h3 class="documentos-title">Documentación Requerida</h3>
          <p class="documentos-description">
            Para completar tu inscripción, debes cargar los siguientes documentos. Puedes continuar con el proceso
            una vez que hayas cargado al menos los documentos obligatorios.
          </p>
        </div>
        <button mat-raised-button color="primary" (click)="abrirCargaMultiple()" class="btn-carga-multiple">
          <mat-icon>upload_file</mat-icon>
          Carga múltiple
        </button>
      </div>

      <!-- Indicador de progreso -->
      <div class="documentos-progress">
        <div class="progress-header">
          <span>Estado de tu documentación</span>
          <span class="progress-percentage">{{progresoDocumentacion}}%</span>
        </div>
        <mat-progress-bar
          [value]="progresoDocumentacion"
          [color]="progresoDocumentacion < 50 ? 'warn' : progresoDocumentacion < 100 ? 'accent' : 'primary'">
        </mat-progress-bar>
        <div class="progress-info">
          <span *ngIf="progresoDocumentacion < 100 && documentosFaltantes > 0">
            <mat-icon>info</mat-icon>
            Te faltan {{documentosFaltantes}} documentos obligatorios para completar tu inscripción
          </span>
          <span *ngIf="progresoDocumentacion === 100">
            <mat-icon>check_circle</mat-icon>
            ¡Has completado toda la documentación requerida!
          </span>
        </div>
      </div>

      <!-- Sección de documentos requeridos -->
      <div class="documentos-requeridos">
        <div class="documentos-grid">
          <div *ngFor="let tipo of documentosRequeridos" class="documento-card"
               [class.completo]="isDocumentoSubido(tipo.id)">
            <div class="documento-icon">
              <mat-icon>description</mat-icon>
              <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                <mat-icon>check</mat-icon>
              </div>
            </div>
            <div class="documento-info">
              <h5>{{tipo.nombre}}</h5>
              <p *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
              <div class="documento-estado">
                <ng-container *ngIf="isDocumentoSubido(tipo.id); else pendiente">
                  <span class="estado-texto aprobado" *ngIf="getEstadoDocumento(tipo.id) === 'aprobado'">
                    <mat-icon>check_circle</mat-icon> Aprobado
                  </span>
                  <span class="estado-texto pendiente" *ngIf="getEstadoDocumento(tipo.id) === 'pendiente'">
                    <mat-icon>pending</mat-icon> Pendiente de revisión
                  </span>
                  <span class="estado-texto rechazado" *ngIf="getEstadoDocumento(tipo.id) === 'rechazado'">
                    <mat-icon>cancel</mat-icon> Rechazado
                  </span>
                </ng-container>
                <ng-template #pendiente>
                  <span class="estado-texto no-subido">
                    <mat-icon>upload</mat-icon> No subido
                  </span>
                </ng-template>
              </div>
              <div class="documento-actions">
                <button mat-button color="primary" (click)="cargarDocumentoTipo(tipo.id)">
                  <mat-icon>{{isDocumentoSubido(tipo.id) ? 'refresh' : 'upload'}}</mat-icon>
                  {{isDocumentoSubido(tipo.id) ? 'Reemplazar' : 'Cargar'}}
                </button>
                <button mat-button color="accent" *ngIf="isDocumentoSubido(tipo.id)"
                        (click)="verDocumento(getDocumento(tipo.id))">
                  <mat-icon>visibility</mat-icon>
                  Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="documentosRequeridos.length === 0 && !isLoading">
        <mat-icon>folder_open</mat-icon>
        <h4>No hay documentos requeridos para este concurso</h4>
        <p>Puedes continuar con el proceso de inscripción</p>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando documentos...</p>
      </div>
    </div>
  `,
  styles: [`
    .documentos-container {
      padding: 1rem;
      color: rgba(255, 255, 255, 0.87);
    }

    .documentos-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .btn-carga-multiple {
      white-space: nowrap;
      margin-left: 1rem;
    }

    .documentos-title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #fff;
    }

    .documentos-description {
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .documentos-progress {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .progress-percentage {
      color: #fff;
    }

    .progress-info {
      display: flex;
      align-items: center;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .progress-info mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }

    .documentos-requeridos {
      margin-bottom: 2rem;
    }

    .documentos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .documento-card {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .documento-card.completo {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.3);
    }

    .documento-icon {
      position: relative;
      margin-right: 1rem;
    }

    .documento-icon mat-icon {
      font-size: 2rem;
      height: 2rem;
      width: 2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .estado-badge {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: #4caf50;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .estado-badge mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      color: white;
    }

    .documento-info {
      flex: 1;
    }

    .documento-info h5 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: #fff;
    }

    .documento-info p {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .documento-estado {
      margin-bottom: 0.5rem;
    }

    .estado-texto {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
    }

    .estado-texto mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }

    .aprobado {
      color: #4caf50;
    }

    .pendiente {
      color: #ff9800;
    }

    .rechazado {
      color: #f44336;
    }

    .no-subido {
      color: rgba(255, 255, 255, 0.5);
    }

    .documento-actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      color: #fff;
    }

    .empty-state p {
      margin: 0 0 1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-state p {
      margin-top: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class DocumentosEmbebidosComponent implements OnInit, OnDestroy {
  @Input() concursoId!: number;
  @Output() documentosCompletados = new EventEmitter<boolean>();

  documentosRequeridos: TipoDocumento[] = [];
  documentosUsuario: DocumentoUsuario[] = [];
  isLoading = true;
  progresoDocumentacion = 0;
  documentosFaltantes = 0;
  todosDocumentosCompletos = false; // Variable para controlar si todos los documentos están completos
  private subscription: Subscription | undefined;

  // Cache para evitar múltiples verificaciones
  private documentoSubidoCache: Record<string, boolean> = {};
  private documentoCache: Record<string, DocumentoUsuario> = {};

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private documentosService: DocumentosService
  ) {}



  ngOnInit(): void {
    // Forzar recarga de datos al inicializar
    this.cargarDatos(true);

    // Suscribirse a las actualizaciones de documentos
    this.subscription = this.documentosService.documentoActualizado$.subscribe(() => {
      console.log('[DocumentosEmbebidos] Recibida notificación de documento actualizado, recargando documentos...');
      this.cargarDocumentosUsuario(true);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  cargarDatos(forzarRecarga = false): void {
    console.log('[DocumentosEmbebidos] Cargando datos, forzarRecarga:', forzarRecarga);
    this.isLoading = true;
    this.cargarTiposDocumento(forzarRecarga);
    this.cargarDocumentosUsuario(forzarRecarga);
  }

  cargarTiposDocumento(forzarRecarga = false): void {
    console.log('[DocumentosEmbebidos] Cargando tipos de documento, forzarRecarga:', forzarRecarga);
    this.documentosService.getTiposDocumento(forzarRecarga).subscribe({
      next: (tipos: TipoDocumento[]) => {
        console.log('[DocumentosEmbebidos] Tipos de documento obtenidos:', tipos);

        // Filtrar solo los documentos requeridos para concursos
        let documentosRequeridos = tipos.filter((tipo: TipoDocumento) => tipo.requerido);

        // Identificar si existe el documento DNI general
        const dniGeneral = documentosRequeridos.find((tipo: TipoDocumento) =>
          (tipo.nombre.toLowerCase().includes('documento nacional de identidad') ||
           tipo.code === 'dni') &&
          !tipo.nombre.toLowerCase().includes('frente') &&
          !tipo.nombre.toLowerCase().includes('dorso')
        );

        // Identificar si existen los documentos DNI frente y dorso
        const dniFrenteExiste = documentosRequeridos.some((tipo: TipoDocumento) =>
          tipo.id === 'dni-frente' ||
          tipo.code === 'dni-frente' ||
          (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('frente'))
        );

        const dniDorsoExiste = documentosRequeridos.some((tipo: TipoDocumento) =>
          tipo.id === 'dni-dorso' ||
          tipo.code === 'dni-dorso' ||
          (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('dorso'))
        );

        // Si existe el DNI general y también existen DNI frente y dorso, eliminar el DNI general
        if (dniGeneral && dniFrenteExiste && dniDorsoExiste) {
          console.log('[DocumentosEmbebidos] Eliminando DNI general redundante:', dniGeneral);
          documentosRequeridos = documentosRequeridos.filter((tipo: TipoDocumento) => tipo.id !== dniGeneral.id);
        }

        this.documentosRequeridos = documentosRequeridos;
        this.calcularProgreso();
      },
      error: (error: unknown) => {
        console.error('[DocumentosEmbebidos] Error al cargar tipos de documento:', error);
        this.mostrarError('Error al cargar los tipos de documento');
        this.isLoading = false;
      }
    });
  }

  cargarDocumentosUsuario(forzarRecarga = false): void {
    console.log('[DocumentosEmbebidos] Cargando documentos del usuario, forzarRecarga:', forzarRecarga);
    // Limpiar el caché de documentos subidos
    this.documentoSubidoCache = {};
    this.documentoCache = {};

    this.documentosService.getDocumentosUsuario(forzarRecarga)
      .pipe(finalize(() => {
        this.isLoading = false;
        console.log('[DocumentosEmbebidos] Finalizada carga de documentos.');
      }))
      .subscribe({
        next: (documentos: DocumentoUsuario[]) => {
          console.log('[DocumentosEmbebidos] Documentos del usuario obtenidos:', documentos.length);
          this.documentosUsuario = documentos;
          this.calcularProgreso();
          this.actualizarEstadoDocumentos();
        },
        error: (error: unknown) => {
          console.error('[DocumentosEmbebidos] Error al cargar documentos del usuario:', error);
          this.mostrarError('Error al cargar tus documentos');
        }
      });
  }

  calcularProgreso(): void {
    console.log('[DocumentosEmbebidos] Calculando progreso de documentación');
    console.log('[DocumentosEmbebidos] Documentos requeridos:', this.documentosRequeridos.length);
    console.log('[DocumentosEmbebidos] Documentos del usuario:', this.documentosUsuario.length);

    // Filtrar solo los documentos requeridos
    const documentosRequeridos = this.documentosRequeridos.filter(doc => doc.requerido);
    console.log('[DocumentosEmbebidos] Documentos requeridos filtrados:', documentosRequeridos.length);

    // Si no hay documentos requeridos, el progreso es 100%
    if (documentosRequeridos.length === 0) {
      this.documentosFaltantes = 0;
      this.progresoDocumentacion = 100;
      console.log('[DocumentosEmbebidos] No hay documentos requeridos, progreso 100%');
      this.emitirEstadoDocumentos();
      return;
    }

    // Contar documentos completados
    let documentosCompletados = 0;

    // Verificar cada documento requerido
    for (const tipoDoc of documentosRequeridos) {
      const subido = this.isDocumentoSubido(tipoDoc.id);
      console.log(`[DocumentosEmbebidos] Documento ${tipoDoc.id} (${tipoDoc.nombre}): ${subido ? 'Subido' : 'No subido'}`);
      if (subido) {
        documentosCompletados++;
      }
    }

    // Calcular documentos faltantes y progreso
    this.documentosFaltantes = documentosRequeridos.length - documentosCompletados;
    this.progresoDocumentacion = Math.round((documentosCompletados / documentosRequeridos.length) * 100);

    console.log('[DocumentosEmbebidos] Progreso calculado:', {
      total: documentosRequeridos.length,
      completados: documentosCompletados,
      faltantes: this.documentosFaltantes,
      porcentaje: this.progresoDocumentacion
    });

    // Emitir el estado de los documentos
    this.emitirEstadoDocumentos();

    // Actualizar el estado de completitud
    this.todosDocumentosCompletos = this.documentosFaltantes === 0;
  }

  emitirEstadoDocumentos(): void {
    // Emitir true si todos los documentos requeridos están completos
    const todosCompletados = this.documentosFaltantes === 0;
    console.log('[DocumentosEmbebidos] Emitiendo estado de documentos:', todosCompletados);
    this.documentosCompletados.emit(todosCompletados);

    // Actualizar la propiedad local también
    this.todosDocumentosCompletos = todosCompletados;
  }

  actualizarEstadoDocumentos(): void {
    // Actualizar el caché de documentos subidos
    for (const documento of this.documentosUsuario) {
      if (documento.tipoDocumentoId) {
        this.documentoSubidoCache[documento.tipoDocumentoId] = true;
        this.documentoCache[documento.tipoDocumentoId] = documento;
      }
    }
    this.calcularProgreso();
  }

  isDocumentoSubido(tipoDocumentoId: string): boolean {
    // Usar caché si existe
    if (Object.prototype.hasOwnProperty.call(this.documentoSubidoCache, tipoDocumentoId)) {
      return this.documentoSubidoCache[tipoDocumentoId];
    }

    // Caso especial para DNI general
    if (tipoDocumentoId === 'dni' ||
        (tipoDocumentoId.toLowerCase().includes('documento') &&
         tipoDocumentoId.toLowerCase().includes('identidad') &&
         !tipoDocumentoId.toLowerCase().includes('frente') &&
         !tipoDocumentoId.toLowerCase().includes('dorso'))) {

      // Verificar si tanto el frente como el dorso del DNI están cargados
      const frenteSubido = this.documentosUsuario.some(doc =>
        doc.tipoDocumentoId === 'dni-frente' ||
        (doc.tipoDocumento && doc.tipoDocumento.code === 'dni-frente') ||
        (doc.tipoDocumento && doc.tipoDocumento.nombre &&
         doc.tipoDocumento.nombre.toLowerCase().includes('dni') &&
         doc.tipoDocumento.nombre.toLowerCase().includes('frente'))
      );

      const dorsoSubido = this.documentosUsuario.some(doc =>
        doc.tipoDocumentoId === 'dni-dorso' ||
        (doc.tipoDocumento && doc.tipoDocumento.code === 'dni-dorso') ||
        (doc.tipoDocumento && doc.tipoDocumento.nombre &&
         doc.tipoDocumento.nombre.toLowerCase().includes('dni') &&
         doc.tipoDocumento.nombre.toLowerCase().includes('dorso'))
      );

      // Si ambos están cargados, consideramos que el DNI general está cargado
      const resultado = frenteSubido && dorsoSubido;
      this.documentoSubidoCache[tipoDocumentoId] = resultado;
      return resultado;
    }

    // Calcular y guardar en caché para otros tipos de documento
    const resultado = this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipoDocumentoId);
    this.documentoSubidoCache[tipoDocumentoId] = resultado;
    return resultado;
  }

  getDocumento(tipoDocumentoId: string): DocumentoUsuario | undefined {
    // Usar caché si existe
    if (Object.prototype.hasOwnProperty.call(this.documentoCache, tipoDocumentoId)) {
      return this.documentoCache[tipoDocumentoId];
    }

    // Caso especial para DNI general
    if (tipoDocumentoId === 'dni' ||
        (tipoDocumentoId.toLowerCase().includes('documento') &&
         tipoDocumentoId.toLowerCase().includes('identidad') &&
         !tipoDocumentoId.toLowerCase().includes('frente') &&
         !tipoDocumentoId.toLowerCase().includes('dorso'))) {

      // Buscar el documento DNI frente (prioridad)
      const dniFrenteDoc = this.documentosUsuario.find(doc =>
        doc.tipoDocumentoId === 'dni-frente' ||
        (doc.tipoDocumento && doc.tipoDocumento.code === 'dni-frente') ||
        (doc.tipoDocumento && doc.tipoDocumento.nombre &&
         doc.tipoDocumento.nombre.toLowerCase().includes('dni') &&
         doc.tipoDocumento.nombre.toLowerCase().includes('frente'))
      );

      if (dniFrenteDoc) {
        this.documentoCache[tipoDocumentoId] = dniFrenteDoc;
        return dniFrenteDoc;
      }
    }

    // Buscar y guardar en caché para otros tipos de documento
    const documento = this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    if (documento) {
      this.documentoCache[tipoDocumentoId] = documento;
    }
    return documento;
  }

  getEstadoDocumento(tipoDocumentoId: string): string {
    const documento = this.getDocumento(tipoDocumentoId);
    return documento ? documento.estado.toLowerCase() : 'no-subido';
  }

  cargarDocumentoTipo(tipoDocumentoId: string): void {
    const tipoDocumento = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);
    if (!tipoDocumento) {
      this.mostrarError('Tipo de documento no encontrado');
      return;
    }

    const dialogRef = this.dialog.open(DocumentoUploadDialogComponent, {
      width: '600px',
      data: { tipoDocumentoId, tipoDocumentoNombre: tipoDocumento.nombre }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        // El documento se subió correctamente, actualizar la lista
        this.cargarDocumentosUsuario();
      }
    });
  }

  abrirCargaMultiple(): void {
    const dialogRef = this.dialog.open(DocumentoMultipleUploadDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { tiposDocumento: this.documentosRequeridos }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        // Se subieron documentos correctamente, actualizar la lista
        this.cargarDocumentosUsuario();

        // Mostrar mensaje de éxito
        this.snackBar.open('Documentos cargados correctamente', 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  verDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.mostrarError('No se pudo encontrar el documento');
      return;
    }

    // Abrir visor de documentos mejorado
    this.dialog.open(DocumentoViewerComponent, {
      width: '800px',
      height: '80vh',
      data: { documentoId: documento.id }
    });
  }

  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
