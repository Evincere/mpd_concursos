import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTableComponent, TableColumn } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';

// Services
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ConfirmationService } from '@shared/services/confirmation.service';

import { DocumentoUsuario, TipoDocumento, EstadoDocumento, EstadoProcesamiento, DocumentoReplaceResponse, DocumentoSummary } from '../../../../core/models/documento.model';
import { DocumentoViewerComponent } from '@shared/components/documento-viewer/documento-viewer.component';
import { DocumentManagerService } from '@core/services/documentos/document-manager.service';
import { TiposDocumentoService } from '@core/services/documentos/tipos-documento.service';
import { DocumentoMultipleUploadDialogComponent } from '../../../concursos/components/inscripcion/documentos-embebidos/documento-multiple-upload-dialog/documento-multiple-upload-dialog.component';
import { DocumentoUploadDialogComponent } from '../../../concursos/components/inscripcion/documentos-embebidos/documento-upload-dialog/documento-upload-dialog.component';
import { debounceTime, throttleTime, finalize } from 'rxjs/operators';
import { Subscription, firstValueFrom } from 'rxjs';

interface DocumentoCardViewModel {
  tipo: TipoDocumento;
  documento: DocumentoUsuario | null;
  subido: boolean;
  estado: 'aprobado' | 'pendiente' | 'rechazado' | 'faltante';
  estadoTexto: string;
  estadoIcon: string;
}

@Component({
  selector: 'app-documentacion-tab',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSpinnerComponent,
    CustomTableComponent,
    CustomTableColumnComponent,
    DocumentoMultipleUploadDialogComponent,
    DocumentoUploadDialogComponent,
    DocumentoViewerComponent
  ],
  template: `
    <div class="documentacion-container">
      <app-custom-card>
        <div class="documentacion-header">
          <div class="header-title">
            <i class="fas fa-file-alt" aria-hidden="true"></i>
            <h3>Documentación</h3>
          </div>
          <div class="header-actions">
            <app-custom-button
              color="success"
              icon="upload"
              label="Carga múltiple"
              (buttonClick)="abrirDialogoCargaMultiple()">
            </app-custom-button>
          </div>
        </div>

      <!-- Mensaje de advertencia sobre formato de archivos -->
      <div class="documentacion-warning">
        <i class="fas fa-info-circle"></i>
        <div class="warning-content">
          <strong>Importante:</strong>
          <ul>
            <li>Solo se permitirán cargar archivos en formato PDF (máximo 10MB).</li>
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

      <!-- Sección de documentos obligatorios -->
      <div class="documentos-requeridos" *ngIf="documentosObligatorios.length > 0">
        <h4>Documentos obligatorios</h4>
        <div class="documentos-grid">
          <div *ngFor="let vm of getObligatoriosViewModel()" class="documento-card"
               [class.completo]="vm.subido"
               [class.obligatorio]="vm.tipo.requerido">
            <!-- Badge de tipo en esquina superior derecha -->
            <div class="estado-badge estado-bloqueado badge-posicion">
              <i class="fas fa-exclamation-circle"></i>
              <span>Obligatorio</span>
            </div>

            <!-- Contenido principal de la card -->
            <div class="documento-content">
              <div class="documento-icon">
                <i class="fas fa-file-pdf"
                   [class.documento-completo]="vm.subido"
                   [class.documento-pendiente]="!vm.subido"></i>
                <div class="estado-badge" *ngIf="vm.subido">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="documento-info">
                <div>
                  <h5>{{vm.tipo.nombre}}</h5>
                  <p *ngIf="vm.tipo.descripcion">{{vm.tipo.descripcion}}</p>
                </div>
                <div class="documento-estado">
                  <span class="estado-texto {{vm.estado}}">
                    <i class="fas {{vm.estadoIcon}}"></i> {{vm.estadoTexto}}
                  </span>
                </div>
                <div class="documento-actions">
                  <ng-container *ngIf="vm.subido; else botonCargar">
                    <app-custom-button
                      variant="icon"
                      color="primary"
                      icon="eye"
                      [tooltip]="'Ver documento'"
                      (buttonClick)="verDocumento(vm.documento)">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="success"
                      icon="sync-alt"
                      [tooltip]="'Reemplazar documento'"
                      (buttonClick)="reemplazarDocumento(vm.documento)">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="danger"
                      icon="trash"
                      [tooltip]="'Eliminar documento'"
                      (buttonClick)="eliminarDocumento(vm.documento)">
                    </app-custom-button>
                  </ng-container>
                  <ng-template #botonCargar>
                    <app-custom-button
                      variant="stroked"
                      color="primary"
                      icon="upload"
                      label="Cargar"
                      (buttonClick)="cargarDocumentoTipo(vm.tipo.id)">
                    </app-custom-button>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de documentos opcionales -->
      <div class="documentos-opcionales" *ngIf="documentosOpcionales.length > 0">
        <h4>Documentos opcionales</h4>
        <p class="seccion-descripcion">
          <i class="fas fa-info-circle"></i>
          Estos documentos pueden mejorar tu perfil profesional, pero no son obligatorios para completar tu inscripción.
        </p>
        <div class="documentos-grid">
          <div *ngFor="let vm of getOpcionalesViewModel()" class="documento-card"
               [class.completo]="vm.subido"
               [class.opcional]="!vm.tipo.requerido">
            <!-- Badge de tipo en esquina superior derecha -->
            <div class="estado-badge estado-activo badge-posicion">
              <i class="fas fa-plus-circle"></i>
              <span>Opcional</span>
            </div>

            <!-- Contenido principal de la card -->
            <div class="documento-content">
              <div class="documento-icon">
                <i class="fas fa-file-pdf"
                   [class.documento-completo]="vm.subido"
                   [class.documento-pendiente]="!vm.subido"></i>
                <div class="estado-badge" *ngIf="vm.subido">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="documento-info">
                <div>
                  <h5>{{vm.tipo.nombre}}</h5>
                  <p *ngIf="vm.tipo.descripcion">{{vm.tipo.descripcion}}</p>
                </div>
                <div class="documento-estado">
                  <span class="estado-texto {{vm.estado}}">
                    <i class="fas {{vm.estadoIcon}}"></i> {{vm.estadoTexto}}
                  </span>
                </div>
                <div class="documento-actions">
                  <ng-container *ngIf="vm.subido; else botonCargarOpcional">
                    <app-custom-button
                      variant="icon"
                      color="primary"
                      icon="eye"
                      [tooltip]="'Ver documento'"
                      (buttonClick)="verDocumento(vm.documento)">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="success"
                      icon="sync-alt"
                      [tooltip]="'Reemplazar documento'"
                      (buttonClick)="reemplazarDocumento(vm.documento)">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="danger"
                      icon="trash"
                      [tooltip]="'Eliminar documento'"
                      (buttonClick)="eliminarDocumento(vm.documento)">
                    </app-custom-button>
                  </ng-container>
                  <ng-template #botonCargarOpcional>
                    <app-custom-button
                      variant="stroked"
                      color="primary"
                      icon="upload"
                      label="Cargar"
                      (buttonClick)="cargarDocumentoTipo(vm.tipo.id)">
                    </app-custom-button>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Tabla de resumen de documentos -->
        <div class="documentos-tabla" *ngIf="documentosSummary.length > 0">
          <h4>Documentos cargados</h4>
          <p class="table-description">Mostrando solo la versión más reciente de cada tipo de documento</p>
          <app-custom-table
            [data]="documentosSummary"
            [loading]="(documentManager.loading$ | async) ?? false"
            (rowClick)="onSummaryRowClick($event)">
          </app-custom-table>
        </div>

        <!-- Estado vacío - Solo se muestra cuando no hay tipos de documento configurados -->
        <div class="empty-state" *ngIf="documentosObligatorios.length === 0 && documentosOpcionales.length === 0 && !(documentManager.loading$ | async)">
          <i class="fas fa-folder-open" aria-hidden="true"></i>
          <h4>No hay tipos de documento configurados</h4>
          <p>Contacta al administrador para configurar los tipos de documento requeridos</p>
        </div>

        <!-- Loading state -->
        <div class="loading-state" *ngIf="documentManager.loading$ | async">
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

      .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
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
      color: #f9fafb;

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
            color: #f9fafb;

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
        color: #ffffff;
        font-size: 0.9rem;

        i {
          margin-right: 0.5rem;
        }
      }
    }

    .documentos-requeridos,
    .documentos-opcionales {
      margin-bottom: 2rem;

      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: #f9fafb;
      }

      .seccion-descripcion {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 8px;
        color: #ffffff;
        font-size: 0.9rem;

        i {
          color: #3b82f6;
        }
      }
    }

    .documentos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .documento-card {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background: rgba(55, 65, 81, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(249, 250, 251, 0.1);
      border-radius: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      min-height: 220px;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        background: rgba(55, 65, 81, 0.9);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      }

      &.completo {
        border-left: 4px solid #4CAF50;
        background: rgba(76, 175, 80, 0.05);
      }

      &.obligatorio {
        border-left: 4px solid #f59e0b;

        &.completo {
          border-left: 4px solid #4CAF50;
        }
      }

      &.opcional {
        border-left: 4px solid #3b82f6;
        background: rgba(59, 130, 246, 0.03);

        &.completo {
          border-left: 4px solid #4CAF50;
          background: rgba(76, 175, 80, 0.05);
        }
      }

      // Contenido principal de la card
      .documento-content {
        display: flex;
        align-items: flex-start;
        flex: 1;
        gap: 1rem;
        margin-top: 0.5rem;
      }
    }

    /* Badge de posicionamiento para esquina superior derecha */
    /* Forzar estilos específicos para máximo contraste */
    .badge-posicion {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      z-index: 10 !important;
      font-size: 0.65rem !important;
      padding: 0.25rem 0.5rem !important;
      border-radius: 12px !important;
      margin: 0 !important;

      /* Estilos específicos para cada tipo */
      &.estado-bloqueado {
        background: #f44336 !important; /* Rojo sólido */
        color: white !important;
        border: 1px solid rgba(244, 67, 54, 0.3) !important;

        span, i {
          color: white !important;
        }
      }

      &.estado-activo {
        background: #4caf50 !important; /* Verde sólido */
        color: white !important;
        border: 1px solid rgba(76, 175, 80, 0.3) !important;

        span, i {
          color: white !important;
        }
      }
    }

    .documento-icon {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;

      i {
        font-size: 2.5rem;
        transition: color 0.3s ease;
        margin-bottom: 0.5rem;

        &.documento-completo {
          color: #4CAF50;
        }

        &.documento-pendiente {
          color: #9e9e9e;
        }
      }

      .estado-badge {
        position: absolute;
        bottom: 0;
        right: -5px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: #4CAF50;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        border: 2px solid rgba(55, 65, 81, 0.8);

        i {
          font-size: 0.7rem;
          color: white;
          margin-bottom: 0;
        }
      }
    }

    .documento-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 120px;

      h5 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #f9fafb;
        line-height: 1.3;
      }

      p {
        margin: 0 0 1rem 0;
        font-size: 0.85rem;
        color: #d1d5db;
        line-height: 1.4;
        flex: 1;
      }
    }

    .documento-estado {
      margin-bottom: 1rem;

      .estado-texto {
        display: inline-flex;
        align-items: center;
        font-size: 0.8rem;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-weight: 500;

        i {
          margin-right: 0.4rem;
          font-size: 0.75rem;
        }

        &.aprobado {
          background-color: rgba(76, 175, 80, 0.8);
          color: #ffffff;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        &.pendiente {
          background-color: rgba(255, 152, 0, 0.8);
          color: #ffffff;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        &.rechazado {
          background-color: rgba(244, 67, 54, 0.8);
          color: #ffffff;
          border: 1px solid rgba(244, 67, 54, 0.3);
        }

        &.faltante {
          background-color: rgba(158, 158, 158, 0.8);
          color: #ffffff;
          border: 1px solid rgba(158, 158, 158, 0.3);
        }

        &.opcional-pendiente {
          background-color: rgba(59, 130, 246, 0.8);
          color: #ffffff;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
      }
    }

    .documento-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-end;
      margin-top: auto;
    }

    .documentos-tabla {
      margin-bottom: 2rem;

      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: #f9fafb;
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
        background-color: rgba(76, 175, 80, 0.8);
        color: #ffffff;
      }

      &.pendiente {
        background-color: rgba(255, 152, 0, 0.8);
        color: #ffffff;
      }

      &.rechazado {
        background-color: rgba(244, 67, 54, 0.8);
        color: #ffffff;
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
        color: #ffffff;
      }

      p {
        margin: 0 0 1.5rem 0;
        color: #ffffff;
      }

      .empty-state-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .header-actions,
      .empty-state-actions {
        flex-direction: column;
        width: 100%;

        app-custom-button {
          width: 100%;
        }
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
        color: #ffffff;
      }
    }

    /* Estilos para la nueva tabla de resumen */
    .table-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .versiones-info {
      display: inline-flex;
      align-items: center;
      font-size: 0.8rem;
      color: #6b7280;

      i {
        margin-right: 0.4rem;
        font-size: 0.75rem;
      }
    }

    .estado-badge-tabla {
      display: inline-flex;
      align-items: center;
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-weight: 500;

      i {
        margin-right: 0.3rem;
        font-size: 0.7rem;
      }

      &.aprobado {
        background-color: rgba(76, 175, 80, 0.8);
        color: #ffffff;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      &.pendiente {
        background-color: rgba(255, 152, 0, 0.8);
        color: #ffffff;
        border: 1px solid rgba(255, 152, 0, 0.3);
      }

      &.rechazado {
        background-color: rgba(244, 67, 54, 0.8);
        color: #ffffff;
        border: 1px solid rgba(244, 67, 54, 0.3);
      }

      &.archivado {
        background-color: rgba(158, 158, 158, 0.8);
        color: #ffffff;
        border: 1px solid rgba(158, 158, 158, 0.3);
      }
    }
  `]
})
export class DocumentacionTabComponent implements OnInit, OnDestroy {

  documentosUsuario: DocumentoUsuario[] = [];
  documentosSummary: DocumentoSummary[] = []; // Resumen de documentos agrupados por tipo
  tiposDocumento: TipoDocumento[] = []; // This will hold all document types from the backend
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

  // Propiedades calculadas para evitar filtrado repetitivo en el template
  documentosObligatorios: TipoDocumento[] = [];
  documentosOpcionales: TipoDocumento[] = [];

  // ViewModel para el template, para evitar llamadas a funciones
  documentosViewModel: DocumentoCardViewModel[] = [];

  // Table configuration for custom table component
  tableColumns: TableColumn[] = [
    { property: 'tipoDocumento.nombre', header: 'Tipo de documento', sortable: true },
    { property: 'nombreArchivo', header: 'Nombre del archivo', sortable: true },
    { property: 'fechaCarga', header: 'Fecha de carga', sortable: true },
    { property: 'estado', header: 'Estado', sortable: false },
    { property: 'acciones', header: 'Acciones', sortable: false }
  ];

  // Nueva configuración de columnas para la tabla de resumen
  summaryTableColumns: TableColumn[] = [
    { property: 'tipoDocumento.nombre', header: 'Tipo de documento', sortable: true },
    { property: 'nombreArchivo', header: 'Archivo actual', sortable: true },
    { property: 'fechaCarga', header: 'Fecha de carga', sortable: true },
    { property: 'estadoDetallado', header: 'Estado', sortable: false },
    { property: 'versiones', header: 'Versiones', sortable: false },
    { property: 'acciones', header: 'Acciones', sortable: false }
  ];

  private subscription = new Subscription();

  constructor(
    private dialog: UnifiedDialogService,
    private notification: CustomNotificationService,
    public documentManager: DocumentManagerService, // Public for template access
    private tiposDocumentoService: TiposDocumentoService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[DocumentacionTab] 🚧 Constructor ejecutado');
  }

  ngOnInit(): void {
    console.log('[DocumentacionTab] 🚀 Componente inicializado');

    this.subscription.add(this.documentManager.documentos$.subscribe(documentos => {
      this.documentosUsuario = documentos;
      this.buildViewModel();
      this.calcularProgreso();
      this.cdr.markForCheck();
    }));

    // Cargar los tipos de documento una vez
    this.tiposDocumentoService.getTiposDocumento().subscribe(tipos => {
      this.tiposDocumento = tipos;
      this.actualizarDocumentosRequeridos(tipos);
      this.buildViewModel();
      this.calcularProgreso();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    console.log('[DocumentacionTab] 🔥 Componente destruido (ngOnDestroy)');
    this.subscription?.unsubscribe();
  }

  cargarTiposDocumento(): void {
    // This method should be implemented to fetch document types from a service.
    // For now, it will use the hardcoded list.
    this.actualizarDocumentosRequeridos(this.tiposDocumento);
  }

  /**
   * Actualiza la lista de documentos disponibles basándose en los tipos de documento del backend.
   * Ahora incluye tanto documentos obligatorios como opcionales para consistencia con el proceso de inscripción.
   * @param tipos Lista de tipos de documento del backend.
   */
  private actualizarDocumentosRequeridos(tipos: TipoDocumento[]): void {
    // NUEVA IMPLEMENTACIÓN: Mostrar TODOS los documentos activos (obligatorios y opcionales)
    // para ser consistente con el paso 3 del proceso de inscripción
    const documentosDisponibles = tipos.filter(tipo => {
      if (!tipo.activo) return false;

      // FILTRAR documentos específicos que no deben aparecer:
      // 1. "Documento Nacional de Identidad" genérico (ya se maneja con DNI Frente y Dorso)
      // 2. "Curriculum Vitae" (tiene su propia mecánica en otra pestaña)
      const nombreLower = tipo.nombre.toLowerCase();
      const codeLower = tipo.code?.toLowerCase() || '';

      // Excluir DNI genérico
      const esDNIGenerico = (
        nombreLower === 'documento nacional de identidad' ||
        nombreLower === 'dni' ||
        codeLower === 'dni'
      ) && !nombreLower.includes('frente') && !nombreLower.includes('dorso');

      // Excluir Curriculum Vitae
      const esCurriculumVitae = (
        nombreLower.includes('curriculum') ||
        nombreLower.includes('cv') ||
        codeLower === 'curriculum-vitae' ||
        codeLower === 'cv'
      );

      return !esDNIGenerico && !esCurriculumVitae;
    });

    if (documentosDisponibles.length > 0) {
      // Use backend data as the source of truth - incluye tanto obligatorios como opcionales
      this.documentosRequeridos = documentosDisponibles;

      // Actualizar propiedades calculadas para evitar filtrado repetitivo en el template
      this.documentosObligatorios = documentosDisponibles.filter(d => d.requerido);
      this.documentosOpcionales = documentosDisponibles.filter(d => !d.requerido);

      console.log('[DocumentacionTab] Documentos actualizados desde backend:');
      console.log(`- Total: ${documentosDisponibles.length}`);
      console.log(`- Obligatorios: ${this.documentosObligatorios.length}`);
      console.log(`- Opcionales: ${this.documentosOpcionales.length}`);
      console.log('- Documentos con IDs:', documentosDisponibles.map(d => `${d.nombre} (${d.id})`));

      // DEBUGGING CRÍTICO: Verificar específicamente CUIL y DNI_DORSO
      const cuil = documentosDisponibles.find(d => d.code === 'CONSTANCIA_CUIL');
      const dniDorso = documentosDisponibles.find(d => d.code === 'DNI_DORSO');

      console.log('🔍 [DocumentacionTab] DEBUGGING ESPECÍFICO:');
      if (cuil) {
        console.log(`📄 CONSTANCIA_CUIL: requerido=${cuil.requerido}, nombre="${cuil.nombre}"`);
      } else {
        console.log('❌ CONSTANCIA_CUIL no encontrado');
      }

      if (dniDorso) {
        console.log(`📄 DNI_DORSO: requerido=${dniDorso.requerido}, nombre="${dniDorso.nombre}"`);
      } else {
        console.log('❌ DNI_DORSO no encontrado');
      }

      console.log('📋 [DocumentacionTab] OBLIGATORIOS:', this.documentosObligatorios.map(d => `${d.nombre} (${d.code})`));
      console.log('📋 [DocumentacionTab] OPCIONALES:', this.documentosOpcionales.map(d => `${d.nombre} (${d.code})`));
    } else {
      // Fallback to hardcoded list if backend doesn't have documents
      console.log('[DocumentacionTab] No se encontraron documentos en backend, usando lista hardcodeada');
      // También actualizar las propiedades calculadas para el fallback
      this.documentosObligatorios = this.documentosRequeridos.filter(d => d.requerido);
      this.documentosOpcionales = this.documentosRequeridos.filter(d => !d.requerido);
    }
  }



  buildViewModel(): void {
    console.log('[DocumentacionTab] 🏗️ Construyendo ViewModel...');
    console.log(`- Documentos requeridos: ${this.documentosRequeridos.length}`);
    console.log(`- Documentos del usuario: ${this.documentosUsuario.length}`);
    console.log('- Documentos del usuario IDs:', this.documentosUsuario.map(d => `${d.tipoDocumentoId} (${d.nombreArchivo})`));

    const viewModel: DocumentoCardViewModel[] = [];

    for (const tipo of this.documentosRequeridos) {
      const documento = this.documentosUsuario.find(d => d.tipoDocumentoId === tipo.id) || null;
      const subido = !!documento;
      let estado: 'aprobado' | 'pendiente' | 'rechazado' | 'faltante' = 'faltante';
      let estadoTexto = 'Pendiente de carga';
      let estadoIcon = 'fa-exclamation-triangle';

      console.log(`[DocumentacionTab] 📋 Procesando tipo: ${tipo.nombre} (ID: ${tipo.id}, requerido: ${tipo.requerido})`);
      console.log(`  - Documento encontrado: ${documento ? 'SÍ' : 'NO'}`);
      console.log(`  - Subido: ${subido}`);

      if (documento) {
        // Verificar primero el estado de procesamiento técnico
        if (documento.estadoProcesamiento) {
          switch (documento.estadoProcesamiento) {
            case EstadoProcesamiento.SUBIENDO:
              estado = 'pendiente';
              estadoTexto = 'Subiendo documento...';
              estadoIcon = 'fa-upload';
              break;
            case EstadoProcesamiento.PROCESANDO:
              estado = 'pendiente';
              estadoTexto = 'Procesando documento...';
              estadoIcon = 'fa-cog fa-spin';
              break;
            case EstadoProcesamiento.ERROR:
              estado = 'rechazado';
              estadoTexto = 'Error en procesamiento';
              estadoIcon = 'fa-exclamation-triangle';
              break;
            case EstadoProcesamiento.COMPLETADO:
              // Procesamiento técnico completado, verificar estado de negocio
              if (documento.estado) {
                switch (documento.estado) {
                  case EstadoDocumento.APROBADO:
                    estado = 'aprobado';
                    estadoTexto = 'Aprobado por administrador';
                    estadoIcon = 'fa-check-circle';
                    break;
                  case EstadoDocumento.RECHAZADO:
                    estado = 'rechazado';
                    estadoTexto = 'Rechazado por administrador';
                    estadoIcon = 'fa-times-circle';
                    break;
                  case EstadoDocumento.PENDIENTE:
                  default:
                    estado = 'pendiente';
                    estadoTexto = 'Subido correctamente - En revisión';
                    estadoIcon = 'fa-clock';
                    break;
                }
              } else {
                // Sin estado de negocio aún, asumir PENDING
                estado = 'pendiente';
                estadoTexto = 'Subido correctamente - En revisión';
                estadoIcon = 'fa-clock';
              }
              break;
          }
        } else {
          // Fallback para documentos sin estadoProcesamiento (compatibilidad)
          switch (documento.estado) {
            case EstadoDocumento.APROBADO:
              estado = 'aprobado';
              estadoTexto = 'Aprobado por administrador';
              estadoIcon = 'fa-check-circle';
              break;
            case EstadoDocumento.RECHAZADO:
              estado = 'rechazado';
              estadoTexto = 'Rechazado por administrador';
              estadoIcon = 'fa-times-circle';
              break;
            case EstadoDocumento.PENDIENTE:
            default:
              estado = 'pendiente';
              estadoTexto = 'Subido correctamente - En revisión';
              estadoIcon = 'fa-clock';
              break;
          }
        }
      }

      viewModel.push({
        tipo,
        documento,
        subido,
        estado,
        estadoTexto,
        estadoIcon
      });
    }

    this.documentosViewModel = viewModel;
    console.log('[DocumentacionTab] ✅ ViewModel construido:');
    console.log(`- Total items en ViewModel: ${viewModel.length}`);
    console.log(`- Documentos subidos: ${viewModel.filter(vm => vm.subido).length}`);
    console.log(`- Documentos obligatorios: ${viewModel.filter(vm => vm.tipo.requerido).length}`);
    console.log(`- Documentos obligatorios subidos: ${viewModel.filter(vm => vm.tipo.requerido && vm.subido).length}`);
  }

  calcularProgreso(): void {
    console.log('[DocumentacionTab] 📊 Calculando progreso de documentación...');

    if (!this.documentosViewModel || this.documentosViewModel.length === 0) {
      console.log('[DocumentacionTab] ⚠️ No hay documentos en ViewModel, estableciendo progreso a 100%');
      this.progresoDocumentacion = 100;
      this.documentosFaltantes = 0;
      return;
    }

    const documentosObligatorios = this.documentosViewModel.filter(vm => vm.tipo.requerido);
    const documentosObligatoriosCargados = documentosObligatorios.filter(vm => vm.subido).length;

    console.log('[DocumentacionTab] 📈 Estadísticas de progreso:');
    console.log(`- Total documentos en ViewModel: ${this.documentosViewModel.length}`);
    console.log(`- Documentos obligatorios: ${documentosObligatorios.length}`);
    console.log(`- Documentos obligatorios cargados: ${documentosObligatoriosCargados}`);
    console.log('- Documentos obligatorios:', documentosObligatorios.map(d => `${d.tipo.nombre} (subido: ${d.subido})`));

    this.progresoDocumentacion = documentosObligatorios.length > 0
      ? Math.round((documentosObligatoriosCargados / documentosObligatorios.length) * 100)
      : 100;

    this.documentosFaltantes = documentosObligatorios.length - documentosObligatoriosCargados;

    console.log(`[DocumentacionTab] 🎯 Progreso calculado: ${this.progresoDocumentacion}% (faltan ${this.documentosFaltantes} documentos)`);
  }

  abrirDialogoCargaMultiple(): void {
    const dialogRef = this.dialog.open(DocumentoMultipleUploadDialogComponent, {
      title: 'Carga Múltiple de Documentos',
      showFooter: false,
      showCancelButton: false,
      showConfirmButton: false,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      // CRITICAL FIX: Eliminar recarga manual redundante
      // uploadDocumento() ya emite documentoActualizado$ que dispara la recarga automática
      // Mantener solo para logging/debugging si es necesario
      if (result) {
        console.log('[DocumentacionTab] 📄 Diálogo de carga múltiple cerrado exitosamente - recarga automática en progreso');
      }
    });
  }

  cargarDocumentoTipo(tipoDocumentoId: string): void {
    // Buscar el tipo de documento para obtener su información
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.id === tipoDocumentoId);
    if (!tipoDocumento) {
      this.notification.error('Tipo de documento no encontrado');
      return;
    }

    console.log('[DocumentacionTab] 📤 Abriendo diálogo de carga individual para:', tipoDocumento.nombre);

    const dialogRef = this.dialog.open(DocumentoUploadDialogComponent, {
      title: `Cargar ${tipoDocumento.nombre}`,
      showFooter: false,
      showCancelButton: false,
      showConfirmButton: false,
      data: {
        tipoDocumentoId: tipoDocumento.id,
        tipoDocumentoNombre: tipoDocumento.nombre
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.success) {
        this.notification.success(`${tipoDocumento.nombre} cargado exitosamente`);
        console.log('[DocumentacionTab] 📄 Documento individual cargado exitosamente - forzando recarga inmediata');

        // CRITICAL FIX: Forzar recarga inmediata para asegurar actualización de UI
        // Recargar datos secuencialmente para evitar bloqueos
        setTimeout(() => {
          console.log('[DocumentacionTab] 🔄 Ejecutando recarga manual completa como respaldo');
          this.documentManager.cargarDocumentos(true);
        }, 500); // Pequeño delay para que el backend procese

      } else if (result && result.cancelled) {
        console.log('[DocumentacionTab] ❌ Carga de documento cancelada por el usuario');
      }
    });
  }

  verDocumento(documento: DocumentoUsuario | null): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento para visualizar');
      return;
    }

    this.dialog.open(DocumentoViewerComponent, {
      title: 'Visualizador de documento',
      icon: 'file-pdf',
      size: 'large',
      data: { documentoId: documento.id },
      showFooter: true,
      showCancelButton: false,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      panelClass: 'documento-viewer-dialog',
    });
  }

  /**
   * Abre un diálogo de selección de archivo y devuelve el archivo seleccionado como una Promesa.
   * @returns Una promesa que se resuelve con el archivo seleccionado o se rechaza si se cancela.
   */
  private selectFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';

      // Se resuelve la promesa cuando el usuario selecciona un archivo
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error('No se seleccionó ningún archivo.'));
        }
      };

      // Si el usuario cierra el selector de archivos sin elegir nada, el foco vuelve
      // a la ventana. Podemos usar esto para detectar una "cancelación".
      window.addEventListener('focus', () => {
        // Rechazamos la promesa solo si no se ha seleccionado un archivo todavía
        // Se usa un pequeño timeout para asegurar que el evento onchange se dispare primero si hubo una selección.
        setTimeout(() => {
            reject(new Error('Selección de archivo cancelada.'));
        }, 300);
      }, { once: true });

      input.click();
    });
  }

  async reemplazarDocumento(documento: DocumentoUsuario | null): Promise<void> {
    if (!documento || !documento.id || !documento.tipoDocumentoId) {
      this.notification.error('No se pudo encontrar el documento para reemplazar');
      return;
    }

    try {
      const file = await this.selectFile();

      const checkResp: any = await firstValueFrom(this.documentManager.checkReplaceDocumento(documento.id!, file, 'Reemplazo de documento'));

      if (checkResp.warning && checkResp.impactedEntities && checkResp.impactedEntities.length > 0) {
        const detalle = checkResp.impactedEntities.map((e: string) => `<li>${e}</li>`).join('');
        const confirmado = await firstValueFrom(this.dialog.openConfirm({
          title: 'Advertencia de reemplazo',
          icon: 'warning',
          message: `${checkResp.warning}<ul>${detalle}</ul><p>¿Deseas continuar y reemplazar el documento?</p>`,
          confirmButtonText: 'Reemplazar',
          cancelButtonText: 'Cancelar',
          size: 'medium',
        }).afterClosed());

        if (confirmado) {
          const resp2: any = await firstValueFrom(this.documentManager.replaceDocumento(documento.id!, file, 'Reemplazo de documento', true));
          this.notification.success(resp2.message || 'Documento reemplazado exitosamente.');
        }
      } else {
        const resp: any = await firstValueFrom(this.documentManager.replaceDocumento(documento.id!, file, 'Reemplazo de documento'));
        this.notification.success(resp.message || 'Documento reemplazado exitosamente.');
      }
    } catch (error: any) {
      if(error.message.includes('cancelada')){
        this.notification.info('La operación de reemplazo fue cancelada.');
      } else {
        this.notification.error(error.message || 'Error al reemplazar el documento');
      }
    }
  }

  eliminarDocumento(documento: DocumentoUsuario | null): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento para eliminar');
      return;
    }

    this.confirmationService
      .danger(
        'Eliminar Documento',
        `¿Estás seguro de que deseas eliminar el documento "${documento.nombreArchivo}"?`,
        'Esta acción no se puede deshacer.',
        'Eliminar',
        'Cancelar'
      )
      .subscribe((confirmed) => {
        if (confirmed) {
          this.documentManager.eliminarDocumento(documento.id!)
        }
      });
  }

  onTableAction(event: { action: string; data?: DocumentoUsuario; row?: any }): void {
    const documento = event.data || (event.row as DocumentoUsuario);

    switch (event.action) {
      case 'view':
        this.verDocumento(documento);
        break;
      case 'replace':
        this.reemplazarDocumento(documento);
        break;
      case 'delete':
        this.eliminarDocumento(documento);
        break;
      default:
        console.warn(`Acción desconocida: ${event.action}`);
    }
  }

  /**
   * Maneja el clic en una fila de la tabla de resumen
   */
  onSummaryRowClick(summary: DocumentoSummary): void {
    // Crear un DocumentoUsuario temporal para compatibilidad
    const documento: DocumentoUsuario = {
      id: summary.id,
      tipoDocumentoId: summary.tipoDocumentoId,
      tipoDocumento: summary.tipoDocumento,
      nombreArchivo: summary.nombreArchivo,
      estado: summary.estado as any,
      comentarios: summary.comentarios,
      fechaCarga: summary.fechaCarga,
      validadoPor: summary.validadoPor,
      fechaValidacion: summary.fechaValidacion,
      motivoRechazo: summary.motivoRechazo
    };

    this.verDocumento(documento);
  }

  /**
   * Maneja las acciones de la tabla de resumen de documentos
   */
  onSummaryTableAction(event: { action: string; data?: DocumentoSummary; row?: any }): void {
    const summary = event.data || (event.row as DocumentoSummary);

    // Crear un DocumentoUsuario temporal para compatibilidad con métodos existentes
    const documento: DocumentoUsuario = {
      id: summary.id,
      tipoDocumentoId: summary.tipoDocumentoId,
      tipoDocumento: summary.tipoDocumento,
      nombreArchivo: summary.nombreArchivo,
      estado: summary.estado as any,
      comentarios: summary.comentarios,
      fechaCarga: summary.fechaCarga,
      validadoPor: summary.validadoPor,
      fechaValidacion: summary.fechaValidacion,
      motivoRechazo: summary.motivoRechazo
    };

    switch (event.action) {
      case 'view':
        this.verDocumento(documento);
        break;
      case 'replace':
        this.reemplazarDocumento(documento);
        break;
      case 'delete':
        this.eliminarDocumento(documento);
        break;
      case 'history':
        this.verHistorialDocumento(summary);
        break;
      default:
        console.warn(`Acción desconocida: ${event.action}`);
    }
  }

  /**
   * Muestra el historial de versiones de un documento
   */
  verHistorialDocumento(summary: DocumentoSummary): void {
    console.log('[DocumentacionTab] 📋 Mostrando historial de documento:', summary.tipoDocumento.nombre);
    // TODO: Implementar diálogo de historial de versiones
    this.notification.info(`Historial de ${summary.tipoDocumento.nombre}: ${summary.totalVersiones} versiones`);
  }

  /**
   * Obtiene la clase CSS para el estado del documento
   */
  private getEstadoClass(estadoDetallado: string): string {
    switch (estadoDetallado.toLowerCase()) {
      case 'en revisión':
      case 'pendiente':
        return 'pendiente';
      case 'aprobado':
        return 'aprobado';
      case 'rechazado':
        return 'rechazado';
      case 'archivado':
        return 'archivado';
      default:
        return 'pendiente';
    }
  }

  /**
   * Obtiene el icono para el estado del documento
   */
  private getEstadoIcon(estadoDetallado: string): string {
    switch (estadoDetallado.toLowerCase()) {
      case 'en revisión':
      case 'pendiente':
        return 'fa-clock';
      case 'aprobado':
        return 'fa-check-circle';
      case 'rechazado':
        return 'fa-times-circle';
      case 'archivado':
        return 'fa-archive';
      default:
        return 'fa-clock';
    }
  }

  /**
   * Obtiene los elementos del ViewModel que corresponden a documentos obligatorios
   */
  getObligatoriosViewModel(): any[] {
    return this.documentosViewModel.filter(vm => vm.tipo.requerido);
  }

  /**
   * Obtiene los elementos del ViewModel que corresponden a documentos opcionales
   */
  getOpcionalesViewModel(): any[] {
    return this.documentosViewModel.filter(vm => !vm.tipo.requerido);
  }


}


