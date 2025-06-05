import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTableComponent, TableColumn } from '@shared/components/custom-table/custom-table.component';

// Services
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

import { DocumentoUsuario, TipoDocumento } from '../../../../core/models/documento.model';
import { DocumentoUploadComponent } from '../documento-upload/documento-upload.component';
import { DocumentoViewerComponent } from '../documento-viewer/documento-viewer.component';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-documentacion-tab',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSpinnerComponent,
    CustomTableComponent
  ],
  template: `
    <div class="documentacion-container">
      <app-custom-card>
        <div class="documentacion-header">
          <div class="header-title">
            <i class="fas fa-file-alt" aria-hidden="true"></i>
            <h3>Documentación</h3>
          </div>
          <app-custom-button
            color="primary"
            icon="fa-plus"
            label="Agregar documento"
            (buttonClick)="abrirDialogoCargaDocumento()">
          </app-custom-button>
        </div>

      <!-- Mensaje de advertencia sobre formato de archivos -->
      <div class="documentacion-warning">
        <i class="fas fa-info-circle"></i>
        <div class="warning-content">
          <strong>Importante:</strong>
          <ul>
            <li>Solo se permitirán cargar archivos en formato PDF.</li>
            <li>En caso de tener múltiples páginas o documentos relacionados, por favor únalo en un único archivo PDF antes de cargarlo.</li>
          </ul>
        </div>
      </div>

        <!-- Indicador de progreso -->
        <div class="documentacion-progress">
          <div class="progress-header">
            <span>Estado de tu documentación</span>
            <span class="progress-percentage">{{progresoDocumentacion}}%</span>
          </div>
          <div class="custom-progress-bar">
            <div class="progress-fill"
                 [style.width.%]="progresoDocumentacion"
                 [class.warning]="progresoDocumentacion < 50"
                 [class.accent]="progresoDocumentacion >= 50 && progresoDocumentacion < 100"
                 [class.success]="progresoDocumentacion === 100">
            </div>
          </div>
          <div class="progress-info">
            <span *ngIf="progresoDocumentacion < 100">
              <i class="fas fa-info-circle" aria-hidden="true"></i>
              Te faltan {{documentosFaltantes}} documentos para completar tu perfil
            </span>
            <span *ngIf="progresoDocumentacion === 100">
              <i class="fas fa-check-circle" aria-hidden="true"></i>
              ¡Has completado toda la documentación requerida!
            </span>
          </div>
        </div>

      <!-- Sección de documentos requeridos -->
      <div class="documentos-requeridos">
        <h4>Documentos requeridos</h4>
        <div class="documentos-grid">
          <div *ngFor="let tipo of documentosRequeridos" class="documento-card"
               [class.completo]="isDocumentoSubido(tipo.id)">
            <div class="documento-icon">
              <i class="fas fa-file-pdf"></i>
              <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                <i class="fas fa-check"></i>
              </div>
            </div>
            <div class="documento-info">
              <h5>{{tipo.nombre}}</h5>
              <p *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
              <div class="documento-estado">
                <ng-container *ngIf="isDocumentoSubido(tipo.id); else pendiente">
                  <span class="estado-texto aprobado" *ngIf="getEstadoDocumento(tipo.id) === 'aprobado'">
                    <i class="fas fa-check-circle"></i> Aprobado
                  </span>
                  <span class="estado-texto pendiente" *ngIf="getEstadoDocumento(tipo.id) === 'pendiente'">
                    <i class="fas fa-clock"></i> Pendiente de revisión
                  </span>
                  <span class="estado-texto rechazado" *ngIf="getEstadoDocumento(tipo.id) === 'rechazado'">
                    <i class="fas fa-times-circle"></i> Rechazado
                  </span>
                </ng-container>
                <ng-template #pendiente>
                  <span class="estado-texto faltante">
                    <i class="fas fa-exclamation-triangle"></i> Pendiente de carga
                  </span>
                </ng-template>
              </div>
            </div>
            <div class="documento-actions">
              <ng-container *ngIf="isDocumentoSubido(tipo.id); else botonCargar">
                <app-custom-button
                  variant="icon"
                  color="primary"
                  icon="fa-eye"
                  [tooltip]="'Ver documento'"
                  (buttonClick)="verDocumento(getDocumentoByTipo(tipo.id))">
                </app-custom-button>
                <app-custom-button
                  variant="icon"
                  color="accent"
                  icon="fa-sync-alt"
                  [tooltip]="'Reemplazar documento'"
                  (buttonClick)="reemplazarDocumento(getDocumentoByTipo(tipo.id))">
                </app-custom-button>
                <app-custom-button
                  variant="icon"
                  color="warn"
                  icon="fa-trash"
                  [tooltip]="'Eliminar documento'"
                  (buttonClick)="eliminarDocumento(getDocumentoByTipo(tipo.id))">
                </app-custom-button>
              </ng-container>
              <ng-template #botonCargar>
                <app-custom-button
                  variant="stroked"
                  color="primary"
                  icon="fa-upload"
                  label="Cargar"
                  (buttonClick)="cargarDocumentoTipo(tipo.id)">
                </app-custom-button>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

        <!-- Tabla de documentos cargados -->
        <div class="documentos-tabla" *ngIf="documentosUsuario.length > 0">
          <h4>Todos los documentos</h4>
          <app-custom-table
            [data]="documentosUsuario"
            [columns]="tableColumns"
            [loading]="isLoading"
            [showActions]="true"
            (actionClick)="onTableAction($event)">
          </app-custom-table>
        </div>

        <!-- Estado vacío -->
        <div class="empty-state" *ngIf="documentosUsuario.length === 0 && !isLoading">
          <i class="fas fa-folder-open" aria-hidden="true"></i>
          <h4>No has cargado ningún documento aún</h4>
          <p>Comienza cargando los documentos requeridos para completar tu perfil</p>
          <app-custom-button
            color="primary"
            icon="fa-upload"
            label="Cargar documento"
            (buttonClick)="abrirDialogoCargaDocumento()">
          </app-custom-button>
        </div>

        <!-- Loading state -->
        <div class="loading-state" *ngIf="isLoading">
          <app-custom-spinner [size]="'large'"></app-custom-spinner>
          <p>Cargando documentos...</p>
        </div>
      </app-custom-card>
    </div>
  `,
  styles: [`
    .documentacion-container {
      padding: 1.5rem;
    }

    .documentacion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1.5rem;

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          color: #4CAF50;
          font-size: 1.5rem;
        }

        h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #f9fafb;
        }
      }
    }

    .documentacion-warning {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      background-color: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 8px;
      color: var(--text-color);

      i {
        color: #ff9800;
        font-size: 1.2rem;
        margin-top: 0.2rem;
      }

      .warning-content {
        flex: 1;

        strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #ff9800;
        }

        ul {
          margin: 0;
          padding-left: 1.2rem;

          li {
            margin-bottom: 0.25rem;
            font-size: 0.95rem;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .documentacion-progress {
      background: rgba(55, 65, 81, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(249, 250, 251, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;

        span {
          color: #f9fafb;
          font-weight: 500;
        }

        .progress-percentage {
          color: #4CAF50;
          font-weight: 600;
        }
      }

      .custom-progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(75, 85, 99, 0.3);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.75rem;

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease, background-color 0.3s ease;

          &.warning {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
          }

          &.accent {
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
          }

          &.success {
            background: linear-gradient(90deg, #4CAF50, #66bb6a);
          }
        }
      }

      .progress-info {
        color: #d1d5db;
        font-size: 0.9rem;

        i {
          margin-right: 0.5rem;
        }
      }
    }

    .documentos-requeridos {
      margin-bottom: 2rem;

      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: var(--text-color);
      }
    }

    .documentos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .documento-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      background-color: rgba(var(--surface-color-rgb), 0.5);
      border-radius: 8px;
      border: 1px solid var(--card-border);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      &.completo {
        border-left: 4px solid var(--primary-color);
      }
    }

    .documento-icon {
      position: relative;
      margin-right: 1rem;

      i {
        font-size: 2rem;
        color: #f44336;
      }

      .estado-badge {
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 0.7rem;
          color: white;
        }
      }
    }

    .documento-info {
      flex: 1;

      h5 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-color);
      }

      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .documento-estado {
      .estado-texto {
        display: inline-flex;
        align-items: center;
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;

        i {
          margin-right: 0.25rem;
        }

        &.aprobado {
          background-color: rgba(76, 175, 80, 0.15);
          color: #4caf50;
        }

        &.pendiente {
          background-color: rgba(255, 152, 0, 0.15);
          color: #ff9800;
        }

        &.rechazado {
          background-color: rgba(244, 67, 54, 0.15);
          color: #f44336;
        }

        &.faltante {
          background-color: rgba(158, 158, 158, 0.15);
          color: #9e9e9e;
        }
      }
    }

    .documento-actions {
      display: flex;
      gap: 0.5rem;
    }

    .documentos-tabla {
      margin-bottom: 2rem;

      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: var(--text-color);
      }

      table {
        width: 100%;
        background-color: rgba(var(--surface-color-rgb), 0.5);

        th {
          color: var(--text-color);
          font-weight: 500;
        }

        td {
          color: var(--text-color);
        }
      }
    }

    .estado-badge-tabla {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;

      i {
        margin-right: 0.25rem;
      }

      &.aprobado {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }

      &.pendiente {
        background-color: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }

      &.rechazado {
        background-color: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;

      i {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
      }

      p {
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;

      p {
        margin-top: 1rem;
        color: var(--text-color);
      }
    }
  `]
})
export class DocumentacionTabComponent implements OnInit, OnDestroy {
  isLoading = true;
  documentosUsuario: DocumentoUsuario[] = [];
  tiposDocumento: TipoDocumento[] = [];
  documentosRequeridos: TipoDocumento[] = [
    {
      id: 'dni-frente',
      code: 'dni-frente',
      nombre: 'DNI (Frente)',
      descripcion: 'Documento Nacional de Identidad - Lado frontal',
      requerido: true,
      orden: 1,
      parentId: 'dni',
      activo: true
    },
    {
      id: 'dni-dorso',
      code: 'dni-dorso',
      nombre: 'DNI (Dorso)',
      descripcion: 'Documento Nacional de Identidad - Lado posterior',
      requerido: true,
      orden: 2,
      parentId: 'dni',
      activo: true
    },
    {
      id: 'cuil',
      code: 'cuil',
      nombre: 'Constancia de CUIL',
      descripcion: 'Constancia de CUIL actualizada',
      requerido: true,
      orden: 3,
      activo: true
    },
    {
      id: 'titulo-universitario',
      code: 'titulo-universitario',
      nombre: 'Título Universitario',
      descripcion: 'Título de grado universitario',
      requerido: true,
      orden: 4,
      activo: true
    },
    {
      id: 'antecedentes-penales',
      code: 'antecedentes-penales',
      nombre: 'Certificado de Antecedentes Penales',
      descripcion: 'Certificado vigente con antigüedad no mayor a 90 días desde su emisión',
      requerido: true,
      orden: 5,
      activo: true
    },
    {
      id: 'certificado-profesional',
      code: 'certificado-profesional',
      nombre: 'Certificado de Ejercicio Profesional',
      descripcion: 'Certificado expedido por la Oficina de Profesionales de la SCJ o Colegio de Abogados, o certificación de servicios del Poder Judicial. Antigüedad máxima: 6 meses',
      requerido: true,
      orden: 6,
      activo: true
    },
    {
      id: 'certificado-sanciones',
      code: 'certificado-sanciones',
      nombre: 'Certificado de Sanciones Disciplinarias',
      descripcion: 'Certificado que acredite no registrar sanciones disciplinarias y/o en trámite. Antigüedad máxima: 6 meses',
      requerido: true,
      orden: 7,
      activo: true
    },
    {
      id: 'certificado-ley-micaela',
      code: 'certificado-ley-micaela',
      nombre: 'Certificado Ley Micaela',
      descripcion: 'Certificado de capacitación en Ley Micaela (opcional)',
      requerido: false,
      orden: 8,
      activo: true
    }
  ];
  progresoDocumentacion = 0;
  documentosFaltantes = 0;

  // Table configuration for custom table component
  tableColumns: TableColumn[] = [
    { key: 'tipoDocumento.nombre', label: 'Tipo de documento', sortable: true },
    { key: 'nombreArchivo', label: 'Nombre del archivo', sortable: true },
    { key: 'fechaCarga', label: 'Fecha de carga', sortable: true, type: 'date' },
    { key: 'estado', label: 'Estado', sortable: false, type: 'badge' },
    { key: 'acciones', label: 'Acciones', sortable: false, type: 'actions' }
  ];

  private subscription: Subscription | undefined;

  constructor(
    private dialog: CustomDialogService,
    private notification: CustomNotificationService,
    private documentosService: DocumentosService
  ) {}

  ngOnInit(): void {
    // Forzar recarga de datos al inicializar
    this.cargarDatos(true);

    // Suscribirse a las actualizaciones de documentos
    this.subscription = this.documentosService.documentoActualizado$.subscribe(() => {
      console.log('[DocumentacionTab] Recibida notificación de documento actualizado, recargando documentos...');
      this.cargarDocumentosUsuario(true);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  cargarDatos(forzarRecarga = false): void {
    this.isLoading = true;
    console.log('[DocumentacionTab] Iniciando carga de datos, forzarRecarga:', forzarRecarga);

    // Cargar tipos de documento
    this.documentosService.getTiposDocumento(forzarRecarga).subscribe({
      next: (tipos: TipoDocumento[]) => {
        console.log('[DocumentacionTab] Tipos de documento obtenidos:', tipos);
        this.tiposDocumento = tipos;
        console.log('[DocumentacionTab] Documentos requeridos:', this.documentosRequeridos);

        // Cargar documentos del usuario
        this.cargarDocumentosUsuario(forzarRecarga);
      },
      error: (error: unknown) => {
        console.error('[DocumentacionTab] Error al cargar tipos de documento:', error);
        this.isLoading = false;
        this.notification.error('Error al cargar los tipos de documento');
      }
    });
  }

  cargarDocumentosUsuario(forzarRecarga = false): void {
    console.log('[DocumentacionTab] Cargando documentos del usuario, forzarRecarga:', forzarRecarga);

    // Limpiar el caché de documentos subidos
    this.documentoSubidoCache = {};

    this.documentosService.getDocumentosUsuario(forzarRecarga)
      .pipe(finalize(() => {
        this.isLoading = false;
        console.log('[DocumentacionTab] Finalizada carga de documentos.');
      }))
      .subscribe({
        next: (documentos: DocumentoUsuario[]) => {
          console.log('[DocumentacionTab] Documentos del usuario obtenidos:', documentos.length);

          // Guardar los documentos
          this.documentosUsuario = documentos;

          // Imprimir detalles de los documentos para depuración
          documentos.forEach((doc: DocumentoUsuario) => {
            console.log(`[DocumentacionTab] Documento cargado: ID=${doc.id}, Tipo=${doc.tipoDocumentoId}, Nombre=${doc.nombreArchivo}`);
            if (doc.tipoDocumento) {
              console.log(`[DocumentacionTab] Detalles del tipo: ID=${doc.tipoDocumento.id}, Code=${doc.tipoDocumento.code}, Nombre=${doc.tipoDocumento.nombre}`);
            }
          });

          // Actualizar el estado de los documentos en la interfaz
          this.actualizarEstadoDocumentos();

          // Calcular el progreso después de actualizar el estado
          this.calcularProgreso();
        },
        error: (error: unknown) => {
          console.error('[DocumentacionTab] Error al cargar documentos del usuario:', error);
          this.notification.error('Error al cargar tus documentos');
        }
      });
  }

  /**
   * Actualiza el estado de los documentos en la interfaz
   * Esto ayuda a sincronizar las tarjetas con la tabla de documentos
   */
  actualizarEstadoDocumentos(): void {
    console.log('[DocumentacionTab] Actualizando estado de documentos en la interfaz...');

    // Limpiar el caché de documentos subidos para forzar una nueva verificación
    this.documentoSubidoCache = {};

    // Imprimir todos los documentos del usuario para depuración
    console.log('[DocumentacionTab] Documentos del usuario:', this.documentosUsuario);

    // Imprimir todos los tipos de documento para depuración
    console.log('[DocumentacionTab] Tipos de documento:', this.tiposDocumento);

    // Precalcular el estado de todos los documentos requeridos
    // Esto ayuda a llenar el caché de una sola vez
    this.documentosRequeridos.forEach(tipoDoc => {
      // Verificar si el documento está cargado
      const documentoCargado = this.isDocumentoSubido(tipoDoc.id);
      console.log(`[DocumentacionTab] Documento ${tipoDoc.nombre} (${tipoDoc.id}): ${documentoCargado ? 'CARGADO' : 'PENDIENTE'}`);

      // Obtener el documento si está cargado
      if (documentoCargado) {
        const documento = this.getDocumentoByTipo(tipoDoc.id);
        console.log(`[DocumentacionTab] Detalles del documento cargado:`, documento);
      }
    });

    // Forzar detección de cambios
    setTimeout(() => {
      console.log('[DocumentacionTab] Forzando actualización de la interfaz...');
      // La actualización ocurrirá en el siguiente ciclo de detección de cambios de Angular

      // Verificar nuevamente el estado de los documentos después de la actualización
      this.documentosRequeridos.forEach(tipoDoc => {
        const documentoCargado = this.isDocumentoSubido(tipoDoc.id);
        console.log(`[DocumentacionTab] (Después de actualizar) Documento ${tipoDoc.nombre} (${tipoDoc.id}): ${documentoCargado ? 'CARGADO' : 'PENDIENTE'}`);
      });

      // Recalcular el progreso para asegurarnos de que esté actualizado
      this.calcularProgreso();
    }, 500);
  }

  calcularProgreso(): void {
    console.log('[DocumentacionTab] Calculando progreso de documentación...');

    if (this.documentosRequeridos.length === 0) {
      this.progresoDocumentacion = 100;
      this.documentosFaltantes = 0;
      console.log('[DocumentacionTab] No hay documentos requeridos, progreso 100%');
      return;
    }

    // Contar documentos requeridos que están cargados
    let documentosRequeridosCargados = 0;
    const documentosRequeridos = this.documentosRequeridos;

    // Verificar cada documento requerido
    for (const tipoDoc of documentosRequeridos) {
      // Verificar si el documento está cargado usando el método isDocumentoSubido
      const documentoSubido = this.isDocumentoSubido(tipoDoc.id);

      if (documentoSubido) {
        documentosRequeridosCargados++;
      }

      console.log(`[DocumentacionTab] Documento ${tipoDoc.nombre} (${tipoDoc.id}): ${documentoSubido ? 'CARGADO' : 'PENDIENTE'}`);
    }

    // Calcular el porcentaje de progreso
    this.progresoDocumentacion = Math.round(
      (documentosRequeridosCargados / documentosRequeridos.length) * 100
    );

    // Calcular cuántos documentos faltan
    this.documentosFaltantes = documentosRequeridos.length - documentosRequeridosCargados;

    console.log(`[DocumentacionTab] Progreso calculado: ${this.progresoDocumentacion}% (${documentosRequeridosCargados}/${documentosRequeridos.length} documentos cargados)`);
  }

  abrirDialogoCargaDocumento(tipoDocumentoId?: string): void {
    console.log(`[DocumentacionTab] Abriendo diálogo de carga para tipo: ${tipoDocumentoId || 'ninguno'}`);

    // Si tenemos un ID de tipo de documento, verificar si existe en los tipos requeridos
    if (tipoDocumentoId) {
      const tipoDocumento = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);
      if (tipoDocumento) {
        console.log(`[DocumentacionTab] Tipo de documento encontrado: ${tipoDocumento.nombre}`);
      } else {
        console.warn(`[DocumentacionTab] Tipo de documento no encontrado en la lista de requeridos: ${tipoDocumentoId}`);
        console.log('[DocumentacionTab] Documentos requeridos:', this.documentosRequeridos);
      }
    }

    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      title: 'Cargar nuevo documento',
      icon: 'fa-upload',
      size: 'medium',
      showCloseButton: true,
      showFooter: false,
      data: { tipoDocumentoId }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        // Mostrar mensaje de éxito
        this.notification.success('Documento cargado exitosamente');

        // Recargar documentos después de una carga exitosa
        this.cargarDocumentosUsuario();

        // Notificar al servicio que se ha actualizado un documento
        this.documentosService.notificarDocumentoActualizado();

        // Forzar actualización de la interfaz después de un breve retraso
        // Esto ayuda a sincronizar el estado entre las tarjetas y la tabla
        setTimeout(() => {
          console.log('[DocumentacionTab] Forzando actualización después de cargar documento...');
          this.actualizarEstadoDocumentos();
        }, 500);
      }
    });
  }

  cargarDocumentoTipo(tipoDocumentoId: string): void {
    this.abrirDialogoCargaDocumento(tipoDocumentoId);
  }

  verDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento');
      return;
    }

    console.log('[DocumentacionTab] Abriendo visor para documento:', documento);

    this.dialog.open(DocumentoViewerComponent, {
      width: '95vw',
      height: '95vh',
      maxWidth: '1600px',
      maxHeight: '1000px',
      showCloseButton: false,
      showFooter: false,
      title: '',
      data: { documentoId: documento.id }
    });
  }

  reemplazarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento');
      return;
    }

    console.log('[DocumentacionTab] Abriendo diálogo de reemplazo para documento:', documento);

    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      title: 'Reemplazar documento',
      icon: 'fa-upload',
      size: 'medium',
      showCloseButton: true,
      showFooter: false,
      data: { tipoDocumentoId: documento.tipoDocumentoId }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        console.log('[DocumentacionTab] Documento subido, eliminando anterior...');
        // Eliminar el documento anterior y recargar
        this.documentosService.deleteDocumento(documento.id!).subscribe({
          next: () => {
            this.notification.success('Documento reemplazado correctamente');
            this.cargarDocumentosUsuario();

            // Notificar al servicio que se ha actualizado un documento
            this.documentosService.notificarDocumentoActualizado();

            // Forzar actualización de la interfaz después de un breve retraso
            setTimeout(() => {
              this.actualizarEstadoDocumentos();
            }, 500);
          },
          error: (error: unknown) => {
            console.error('Error al reemplazar documento:', error);
            // Recargar de todos modos para mostrar el nuevo documento
            this.cargarDocumentosUsuario();
          }
        });
      }
    });
  }

  eliminarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      this.documentosService.deleteDocumento(documento.id).subscribe({
        next: () => {
          this.notification.success('Documento eliminado correctamente');
          this.cargarDocumentosUsuario();

          // Notificar al servicio que se ha actualizado un documento
          this.documentosService.notificarDocumentoActualizado();

          // Forzar actualización de la interfaz después de un breve retraso
          setTimeout(() => {
            this.actualizarEstadoDocumentos();
          }, 500);
        },
        error: (error: unknown) => {
          console.error('Error al eliminar documento:', error);
          this.notification.error('Error al eliminar el documento');
        }
      });
    }
  }

  // Cache para evitar verificaciones repetidas
  private documentoSubidoCache: Record<string, boolean> = {};

  isDocumentoSubido(tipoDocumentoId: string): boolean {
    // Si ya verificamos este documento, devolver el resultado cacheado
    // Solo usar caché si no estamos en un proceso de actualización
    if (Object.prototype.hasOwnProperty.call(this.documentoSubidoCache, tipoDocumentoId) && Object.keys(this.documentoSubidoCache).length > 0) {
      console.log(`[DocumentacionTab] Usando caché para ${tipoDocumentoId}: ${this.documentoSubidoCache[tipoDocumentoId]}`);
      return this.documentoSubidoCache[tipoDocumentoId];
    }

    // Verificar si hay algún documento con el ID exacto
    const documentoExacto = this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipoDocumentoId);

    if (documentoExacto) {
      console.log(`[DocumentacionTab] Documento con ID exacto encontrado: ${tipoDocumentoId}`);
      this.documentoSubidoCache[tipoDocumentoId] = true;
      return true;
    }

    // Verificar si hay algún documento con el código exacto
    const documentoPorCodigo = this.documentosUsuario.some(doc =>
      doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId
    );

    if (documentoPorCodigo) {
      console.log(`[DocumentacionTab] Documento con código exacto encontrado: ${tipoDocumentoId}`);
      this.documentoSubidoCache[tipoDocumentoId] = true;
      return true;
    }

    // Caso especial para DNI (frente y dorso)
    if (tipoDocumentoId === 'dni-frente' || tipoDocumentoId === 'dni-dorso') {
      const dniEspecifico = this.documentosUsuario.some(doc => {
        if (!doc.tipoDocumento) return false;

        const nombre = doc.tipoDocumento.nombre?.toLowerCase() || '';
        const esFrente = tipoDocumentoId === 'dni-frente' &&
          (nombre.includes('dni') || nombre.includes('documento') || nombre.includes('identidad')) &&
          (nombre.includes('frente') || nombre.includes('anverso'));
        const esDorso = tipoDocumentoId === 'dni-dorso' &&
          (nombre.includes('dni') || nombre.includes('documento') || nombre.includes('identidad')) &&
          (nombre.includes('dorso') || nombre.includes('reverso'));

        return esFrente || esDorso;
      });

      if (dniEspecifico) {
        console.log(`[DocumentacionTab] Documento DNI específico encontrado: ${tipoDocumentoId}`);
        this.documentoSubidoCache[tipoDocumentoId] = true;
        return true;
      }
    }

    // Buscar por coincidencia parcial en el nombre
    const tipoRequerido = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);
    if (tipoRequerido) {
      const nombreTipoDocumento = tipoRequerido.nombre.toLowerCase();

      // Verificar si hay algún documento cuyo tipo coincida con el nombre del tipo requerido
      for (const doc of this.documentosUsuario) {
        // Obtener el nombre del tipo de documento
        let nombreDocTipo = '';

        // Si el documento tiene un objeto tipoDocumento, usamos su nombre
        if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
          nombreDocTipo = doc.tipoDocumento.nombre.toLowerCase();
        } else {
          // Intentar obtener el nombre del tipo de documento desde la lista de tipos
          const tipoDoc = this.tiposDocumento.find(t => t.id === doc.tipoDocumentoId);
          if (tipoDoc && tipoDoc.nombre) {
            nombreDocTipo = tipoDoc.nombre.toLowerCase();
          }
        }

        // Si no pudimos obtener el nombre, continuamos con el siguiente documento
        if (!nombreDocTipo) {
          continue;
        }

        // Verificar si hay coincidencia entre los nombres
        const coincidenciaNombre = nombreDocTipo.includes(nombreTipoDocumento) ||
                                  nombreTipoDocumento.includes(nombreDocTipo);

        if (coincidenciaNombre) {
          console.log(`[DocumentacionTab] Documento encontrado por nombre: ${nombreTipoDocumento} coincide con ${nombreDocTipo}`);
          this.documentoSubidoCache[tipoDocumentoId] = true;
          return true;
        }
      }
    }

    // Si llegamos aquí, no se encontró el documento
    this.documentoSubidoCache[tipoDocumentoId] = false;
    return false;
  }

  getDocumentoByTipo(tipoDocumentoId: string): DocumentoUsuario | undefined {
    // Verificar si hay algún documento con el ID exacto
    const documentoExacto = this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    if (documentoExacto) {
      console.log(`[DocumentacionTab] getDocumentoByTipo: Documento con ID exacto encontrado: ${tipoDocumentoId}`);
      return documentoExacto;
    }

    // Verificar si hay algún documento con el código exacto
    const documentoPorCodigo = this.documentosUsuario.find(doc =>
      doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId
    );
    if (documentoPorCodigo) {
      console.log(`[DocumentacionTab] getDocumentoByTipo: Documento con código exacto encontrado: ${tipoDocumentoId}`);
      return documentoPorCodigo;
    }

    // Caso especial para DNI (frente y dorso)
    if (tipoDocumentoId === 'dni-frente' || tipoDocumentoId === 'dni-dorso') {
      const dniEspecifico = this.documentosUsuario.find(doc => {
        if (!doc.tipoDocumento) return false;

        const nombre = doc.tipoDocumento.nombre?.toLowerCase() || '';
        const esFrente = tipoDocumentoId === 'dni-frente' &&
          (nombre.includes('dni') || nombre.includes('documento') || nombre.includes('identidad')) &&
          (nombre.includes('frente') || nombre.includes('anverso'));
        const esDorso = tipoDocumentoId === 'dni-dorso' &&
          (nombre.includes('dni') || nombre.includes('documento') || nombre.includes('identidad')) &&
          (nombre.includes('dorso') || nombre.includes('reverso'));

        if (esFrente || esDorso) {
          console.log(`[DocumentacionTab] getDocumentoByTipo: Documento DNI específico encontrado por nombre: ${nombre} para ${tipoDocumentoId}`);
          return true;
        }
        return false;
      });

      if (dniEspecifico) {
        return dniEspecifico;
      }
    }

    // Buscar por coincidencia parcial en el nombre
    const tipoDocumento = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);
    if (!tipoDocumento) {
      return undefined;
    }

    const nombreTipoDocumento = tipoDocumento.nombre.toLowerCase();
    for (const doc of this.documentosUsuario) {
      // Obtener el nombre del tipo de documento
      let nombreDocTipo = '';

      // Si el documento tiene un objeto tipoDocumento, usamos su nombre
      if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
        nombreDocTipo = doc.tipoDocumento.nombre.toLowerCase();
      } else {
        // Intentar obtener el nombre del tipo de documento desde la lista de tipos
        const tipoEncontrado = this.tiposDocumento.find(tipo => tipo.id === doc.tipoDocumentoId);
        if (tipoEncontrado && tipoEncontrado.nombre) {
          nombreDocTipo = tipoEncontrado.nombre.toLowerCase();
        }
      }

      // Si no pudimos obtener el nombre, continuamos con el siguiente documento
      if (!nombreDocTipo) {
        continue;
      }

      // Verificar si hay coincidencia entre los nombres
      const coincidenciaNombre = nombreDocTipo.includes(nombreTipoDocumento) ||
                                nombreTipoDocumento.includes(nombreDocTipo);

      if (coincidenciaNombre) {
        console.log(`[DocumentacionTab] getDocumentoByTipo: Documento encontrado por nombre: ${nombreTipoDocumento} coincide con ${nombreDocTipo}`);
        return doc;
      }
    }

    return undefined;
  }

  getEstadoDocumento(tipoDocumentoId: string): string {
    const documento = this.getDocumentoByTipo(tipoDocumentoId);
    if (!documento) return 'pendiente';
    return documento.estado.toLowerCase();
  }

  getTipoDocumentoNombre(tipoDocumentoId: string): string {
    const tipo = this.tiposDocumento.find(t => t.id === tipoDocumentoId);
    return tipo?.nombre || 'Documento';
  }

  getIconForStatus(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'aprobado':
        return 'fa-check-circle';
      case 'pendiente':
        return 'fa-clock';
      case 'rechazado':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'aprobado':
        return 'Aprobado';
      case 'pendiente':
        return 'Pendiente de revisión';
      case 'rechazado':
        return 'Rechazado';
      default:
        return 'Estado desconocido';
    }
  }

  onTableAction(event: {action: string, row: any}): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.verDocumento(row);
        break;
      case 'replace':
        this.reemplazarDocumento(row);
        break;
      case 'delete':
        this.eliminarDocumento(row);
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  }

}
