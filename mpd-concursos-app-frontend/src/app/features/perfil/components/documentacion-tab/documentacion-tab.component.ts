import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTableComponent, TableColumn } from '@shared/components/custom-table/custom-table.component';

// Services
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ConfirmationService } from '@shared/services/confirmation.service';

import { DocumentoUsuario, TipoDocumento } from '../../../../core/models/documento.model';
import { DocumentoUploadComponent } from '../documento-upload/documento-upload.component';
import { DocumentoViewerComponent } from '@shared/components/documento-viewer/documento-viewer.component';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { DocumentoMultipleUploadDialogComponent } from '../../../concursos/components/inscripcion/documentos-embebidos/documento-multiple-upload-dialog/documento-multiple-upload-dialog.component';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-documentacion-tab',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
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
      <div class="documentos-requeridos" *ngIf="getDocumentosObligatorios().length > 0">
        <h4>Documentos obligatorios</h4>
        <div class="documentos-grid">
          <div *ngFor="let tipo of getDocumentosObligatorios()" class="documento-card"
               [class.completo]="isDocumentoSubido(tipo.id)"
               [class.obligatorio]="tipo.requerido">
            <!-- Badge de tipo en esquina superior derecha -->
            <div class="estado-badge estado-bloqueado badge-posicion">
              <i class="fas fa-exclamation-circle"></i>
              <span>Obligatorio</span>
            </div>

            <!-- Contenido principal de la card -->
            <div class="documento-content">
              <div class="documento-icon">
                <i class="fas fa-file-pdf"
                   [class.documento-completo]="isDocumentoSubido(tipo.id)"
                   [class.documento-pendiente]="!isDocumentoSubido(tipo.id)"></i>
                <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="documento-info">
                <div>
                  <h5>{{tipo.nombre}}</h5>
                  <p *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
                </div>
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
                <div class="documento-actions">
                  <ng-container *ngIf="isDocumentoSubido(tipo.id); else botonCargar">
                    <app-custom-button
                      variant="icon"
                      color="primary"
                      icon="eye"
                      [tooltip]="'Ver documento'"
                      (buttonClick)="verDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="success"
                      icon="sync-alt"
                      [tooltip]="'Reemplazar documento'"
                      (buttonClick)="reemplazarDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="danger"
                      icon="trash"
                      [tooltip]="'Eliminar documento'"
                      (buttonClick)="eliminarDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                  </ng-container>
                  <ng-template #botonCargar>
                    <app-custom-button
                      variant="stroked"
                      color="primary"
                      icon="upload"
                      label="Cargar"
                      (buttonClick)="cargarDocumentoTipo(tipo.id)">
                    </app-custom-button>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de documentos opcionales -->
      <div class="documentos-opcionales" *ngIf="getDocumentosOpcionales().length > 0">
        <h4>Documentos opcionales</h4>
        <p class="seccion-descripcion">
          <i class="fas fa-info-circle"></i>
          Estos documentos pueden mejorar tu perfil profesional, pero no son obligatorios para completar tu inscripción.
        </p>
        <div class="documentos-grid">
          <div *ngFor="let tipo of getDocumentosOpcionales()" class="documento-card"
               [class.completo]="isDocumentoSubido(tipo.id)"
               [class.opcional]="!tipo.requerido">
            <!-- Badge de tipo en esquina superior derecha -->
            <div class="estado-badge estado-activo badge-posicion">
              <i class="fas fa-plus-circle"></i>
              <span>Opcional</span>
            </div>

            <!-- Contenido principal de la card -->
            <div class="documento-content">
              <div class="documento-icon">
                <i class="fas fa-file-pdf"
                   [class.documento-completo]="isDocumentoSubido(tipo.id)"
                   [class.documento-pendiente]="!isDocumentoSubido(tipo.id)"></i>
                <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="documento-info">
                <div>
                  <h5>{{tipo.nombre}}</h5>
                  <p *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
                </div>
                <div class="documento-estado">
                  <ng-container *ngIf="isDocumentoSubido(tipo.id); else pendienteOpcional">
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
                  <ng-template #pendienteOpcional>
                    <span class="estado-texto opcional-pendiente">
                      <i class="fas fa-plus"></i> Disponible para cargar
                    </span>
                  </ng-template>
                </div>
                <div class="documento-actions">
                  <ng-container *ngIf="isDocumentoSubido(tipo.id); else botonCargarOpcional">
                    <app-custom-button
                      variant="icon"
                      color="primary"
                      icon="eye"
                      [tooltip]="'Ver documento'"
                      (buttonClick)="verDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="success"
                      icon="sync-alt"
                      [tooltip]="'Reemplazar documento'"
                      (buttonClick)="reemplazarDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                    <app-custom-button
                      variant="icon"
                      color="danger"
                      icon="trash"
                      [tooltip]="'Eliminar documento'"
                      (buttonClick)="eliminarDocumento(getDocumentoByTipo(tipo.id))">
                    </app-custom-button>
                  </ng-container>
                  <ng-template #botonCargarOpcional>
                    <app-custom-button
                      variant="stroked"
                      color="accent"
                      icon="plus"
                      label="Agregar"
                      (buttonClick)="cargarDocumentoTipo(tipo.id)">
                    </app-custom-button>
                  </ng-template>
                </div>
              </div>
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
          <div class="empty-state-actions">
            <app-custom-button
              color="success"
              icon="upload"
              label="Carga múltiple"
              (buttonClick)="abrirDialogoCargaMultiple()">
            </app-custom-button>
          </div>
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
        color: #d1d5db;
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
        color: #93c5fd;
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

    // Badge de posicionamiento para esquina superior derecha
    // Usando las clases globales existentes con solo ajustes de posición
    .badge-posicion {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      z-index: 10 !important;
      font-size: 0.65rem !important;
      padding: 0.25rem 0.5rem !important;
      border-radius: 12px !important;
      margin: 0 !important;
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
          background-color: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        &.pendiente {
          background-color: rgba(255, 152, 0, 0.2);
          color: #ff9800;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        &.rechazado {
          background-color: rgba(244, 67, 54, 0.2);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.3);
        }

        &.faltante {
          background-color: rgba(158, 158, 158, 0.2);
          color: #9e9e9e;
          border: 1px solid rgba(158, 158, 158, 0.3);
        }

        &.opcional-pendiente {
          background-color: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
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
        color: #f9fafb;
      }

      p {
        margin: 0 0 1.5rem 0;
        color: #d1d5db;
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
        color: #f9fafb;
      }
    }
  `]
})
export class DocumentacionTabComponent implements OnInit, OnDestroy {
  isLoading = true;
  documentosUsuario: DocumentoUsuario[] = [];
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

  // Table configuration for custom table component
  tableColumns: TableColumn[] = [
    { key: 'tipoDocumento.nombre', label: 'Tipo de documento', sortable: true },
    {
      key: 'nombreArchivo',
      label: 'Nombre del archivo',
      sortable: true,
      type: 'custom',
      render: (doc: DocumentoUsuario) => {
        // Mostrar nombre basado en el tipo de documento en lugar del nombre original
        const nombreTipoDocumento = doc.tipoDocumento?.nombre || 'Documento';
        return `${nombreTipoDocumento}.pdf`;
      }
    },
    { key: 'fechaCarga', label: 'Fecha de carga', sortable: true, type: 'date' },
    {
      key: 'estado',
      label: 'Estado',
      sortable: false,
      type: 'custom',
      render: (doc: DocumentoUsuario) => {
        const estadoClass = this.getEstadoDocumento(doc.tipoDocumentoId);
        const estadoText = this.getEstadoDocumentoTexto(doc.tipoDocumentoId); // Get text for badge
        const iconClass = this.getEstadoDocumentoIcon(doc.tipoDocumentoId); // Get icon for badge
        return `<span class="estado-badge-tabla ${estadoClass}">
                  <i class="fas ${iconClass}"></i> ${estadoText}
                </span>`;
      }
    },
    { key: 'acciones', label: 'Acciones', sortable: false, type: 'actions' }
  ];

  private subscription: Subscription | undefined;

  constructor(
    private dialog: UnifiedDialogService,
    private notification: CustomNotificationService,
    private documentosService: DocumentosService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Forzar recarga de datos al inicializar
    this.cargarDatos(true);

    // Suscribirse a las actualizaciones de documentos
    this.subscription = this.documentosService.documentoActualizado$.subscribe(() => {
      this.cargarDocumentosUsuario(true); // Recargar documentos cuando se notifica una actualización
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Carga los tipos de documento y los documentos del usuario.
   * @param forzarRecarga Si es `true`, fuerza la recarga de datos desde el servicio.
   */
  cargarDatos(forzarRecarga = false): void {
    this.isLoading = true;
    this.documentosService.getTiposDocumento(forzarRecarga)
      .pipe(
        finalize(() => {
          this.isLoading = false; // Set loading to false once all data is fetched or on error
        })
      )
      .subscribe({
        next: (tipos) => {
          this.tiposDocumento = tipos; // Store all available document types
          // Update required documents from backend data
          this.actualizarDocumentosRequeridos(tipos);
          this.cargarDocumentosUsuario(forzarRecarga); // Then load user documents
        },
        error: (error: unknown) => {
          console.error('[DocumentacionTab] Error al cargar tipos de documento:', error);
          this.isLoading = false;
          this.notification.error('Error al cargar los tipos de documento');
        }
      });
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

      const obligatorios = documentosDisponibles.filter(d => d.requerido);
      const opcionales = documentosDisponibles.filter(d => !d.requerido);

      console.log('[DocumentacionTab] Documentos actualizados desde backend:');
      console.log(`- Total: ${documentosDisponibles.length}`);
      console.log(`- Obligatorios: ${obligatorios.length}`);
      console.log(`- Opcionales: ${opcionales.length}`);
      console.log('- Documentos filtrados:', documentosDisponibles.map(d => d.nombre));
    } else {
      // Fallback to hardcoded list if backend doesn't have documents
      console.log('[DocumentacionTab] No se encontraron documentos en backend, usando lista hardcodeada');
    }
  }

  /**
   * Carga los documentos del usuario.
   * @param forzarRecarga Si es `true`, fuerza la recarga de datos desde el servicio.
   */
  cargarDocumentosUsuario(forzarRecarga = false): void {
    this.isLoading = true;
    this.documentoSubidoCache = {}; // Clear cache when loading new data

    this.documentosService.getDocumentosUsuario(forzarRecarga)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (documentos: DocumentoUsuario[]) => {
          this.documentosUsuario = documentos;
          console.log('[DocumentacionTab] Documentos del usuario cargados:', documentos.length);
          console.log('[DocumentacionTab] Documentos requeridos configurados:', this.documentosRequeridos.length);

          // SOLUCIÓN: Limpiar la caché de documentos subidos para forzar recálculo
          this.documentoSubidoCache = {};

          // Forzar detección de cambios para actualizar la interfaz
          this.cdr.detectChanges();

          // Actualizar el estado de los documentos en la interfaz (cards, progress)
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
   * Actualiza el estado de los documentos en la interfaz (cards de requeridos y tabla).
   */
  actualizarEstadoDocumentos(): void {
    // No es necesario un setTimeout aquí si los cambios se reflejan vía OnPush + detectChanges
    // Si la tabla y las cards se actualizan de forma reactiva, esta función asegura la sincronización.
    this.calcularProgreso(); // Recalcular progreso para asegurar la visualización

    // Force change detection if needed for OnPush strategy
    // this.cdr.detectChanges(); // Uncomment if you face update issues with OnPush
  }

  /**
   * Calcula el progreso de documentación basándose en los documentos obligatorios cargados.
   * Los documentos opcionales no afectan el progreso de completitud.
   */
  calcularProgreso(): void {
    if (!this.documentosRequeridos || this.documentosRequeridos.length === 0) {
      console.log('[DocumentacionTab] No hay documentos configurados');
      this.progresoDocumentacion = 100;
      this.documentosFaltantes = 0;
      return;
    }

    let documentosObligatoriosCargados = 0;
    const documentosObligatorios = this.getDocumentosObligatorios().filter(d => d.activo);

    console.log('[DocumentacionTab] Calculando progreso:');
    console.log('- Documentos totales:', this.documentosRequeridos.length);
    console.log('- Documentos obligatorios:', documentosObligatorios.length);
    console.log('- Documentos opcionales:', this.getDocumentosOpcionales().length);
    console.log('- Documentos del usuario:', this.documentosUsuario.length);

    for (const tipoDoc of documentosObligatorios) {
      const isSubido = this.isDocumentoSubido(tipoDoc.id);
      console.log(`- ${tipoDoc.nombre} (${tipoDoc.id}): ${isSubido ? 'SUBIDO' : 'FALTANTE'}`);
      if (isSubido) {
        documentosObligatoriosCargados++;
      }
    }

    this.progresoDocumentacion = documentosObligatorios.length > 0 ? Math.round(
      (documentosObligatoriosCargados / documentosObligatorios.length) * 100
    ) : 100;

    this.documentosFaltantes = documentosObligatorios.length - documentosObligatoriosCargados;

    console.log(`[DocumentacionTab] Progreso calculado: ${this.progresoDocumentacion}% (${documentosObligatoriosCargados}/${documentosObligatorios.length})`);
    console.log(`[DocumentacionTab] Documentos obligatorios faltantes: ${this.documentosFaltantes}`);
  }

  /**
   * Abre el diálogo para cargar un único documento.
   * @param tipoDocumentoId El ID del tipo de documento a cargar (opcional).
   */
  abrirDialogoCargaDocumento(tipoDocumentoId?: string): void {
    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      title: 'Cargar Documento',
      showFooter: false, // Disable external footer buttons
      showCancelButton: false, // Disable external cancel button
      showConfirmButton: false, // Disable external confirm button
      data: { tipoDocumentoId: tipoDocumentoId }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        this.notification.success('Documento cargado exitosamente');
        this.cargarDocumentosUsuario(true); // Force reload
        this.documentosService.notificarDocumentoActualizado();
      }
    });
  }

  cargarDocumentoTipo(tipoDocumentoId: string): void {
    this.abrirDialogoCargaDocumento(tipoDocumentoId);
  }

  /**
   * Obtiene la lista de documentos obligatorios.
   * @returns Array de documentos obligatorios.
   */
  getDocumentosObligatorios(): TipoDocumento[] {
    return this.documentosRequeridos.filter(doc => doc.requerido);
  }

  /**
   * Obtiene la lista de documentos opcionales.
   * @returns Array de documentos opcionales.
   */
  getDocumentosOpcionales(): TipoDocumento[] {
    return this.documentosRequeridos.filter(doc => !doc.requerido);
  }

  /**
   * Abre el diálogo para la carga múltiple de documentos.
   */
  abrirDialogoCargaMultiple(): void {
    const dialogRef = this.dialog.open(DocumentoMultipleUploadDialogComponent, {
      title: 'Carga Múltiple de Documentos',
      showFooter: false, // Disable external footer buttons
      showCancelButton: false, // Disable external cancel button
      showConfirmButton: false, // Disable external confirm button
      data: { /* any data needed for multiple upload component */ }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        // CRITICAL FIX: Eliminar notificación duplicada
        // El componente hijo ya maneja las notificaciones en finalizarProceso()
        // this.notification.success('Documentos cargados exitosamente');
        this.cargarDocumentosUsuario(true); // Force reload
        this.documentosService.notificarDocumentoActualizado();
      }
    });
  }

  /**
   * Abre el visor de documentos para un documento específico.
   * @param documento El objeto DocumentoUsuario a visualizar.
   */
  verDocumento(documento: DocumentoUsuario | undefined): void {
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
      panelClass: 'documento-viewer-dialog'
    });
  }

  /**
   * Permite reemplazar un documento existente abriendo el diálogo de carga.
   * @param documento El documento a reemplazar.
   */
  reemplazarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id || !documento.tipoDocumentoId) {
      this.notification.error('No se pudo encontrar el documento para reemplazar');
      return;
    }

    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      title: 'Reemplazar Documento',
      showFooter: false, // Disable external footer buttons
      showCancelButton: false, // Disable external cancel button
      showConfirmButton: false, // Disable external confirm button
      data: { tipoDocumentoId: documento.tipoDocumentoId, documentoIdAEditar: documento.id }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        this.notification.success('Documento reemplazado exitosamente.');
        this.cargarDocumentosUsuario(true); // Force reload
        this.documentosService.notificarDocumentoActualizado();
      }
    });
  }

  /**
   * Elimina un documento del usuario.
   * @param documento El documento a eliminar.
   */
  eliminarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notification.error('No se pudo encontrar el documento para eliminar');
      return;
    }

    // Usar el servicio de confirmación que funciona correctamente
    this.confirmationService.danger(
      'Eliminar Documento',
      `¿Estás seguro de que deseas eliminar el documento "${documento.nombreArchivo}"?`,
      'Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.documentosService.deleteDocumento(documento.id!).subscribe({
          next: () => {
            this.notification.success('Documento eliminado correctamente');
            this.cargarDocumentosUsuario(true); // Force reload
            this.documentosService.notificarDocumentoActualizado();
          },
          error: (error: unknown) => {
            console.error('Error al eliminar documento:', error);
            this.notification.error('Error al eliminar el documento');
          }
        });
      }
    });
  }

  /**
   * Maneja las acciones de la tabla.
   * @param event Objeto con el `action` y el `data` de la fila.
   */
  onTableAction(event: { action: string, data?: DocumentoUsuario, row?: any }): void {
    // Normalizar el evento para manejar tanto 'data' como 'row'
    const documento = event.data || event.row as DocumentoUsuario;

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

  // Cache para evitar verificaciones repetidas
  private documentoSubidoCache: Record<string, boolean> = {};

  /**
   * Verifica si un documento con un `tipoDocumentoId` específico ha sido subido.
   * La lógica intenta ser flexible para cubrir IDs exactos, códigos y nombres.
   * @param tipoDocumentoId El ID del tipo de documento a verificar.
   * @returns `true` si el documento está subido, `false` en caso contrario.
   */
  isDocumentoSubido(tipoDocumentoId: string): boolean {
    // Si ya verificamos este documento, devolver el resultado cacheado
    // La caché se limpia al cargar nuevos documentos, lo que asegura que no esté rancia.
    if (Object.prototype.hasOwnProperty.call(this.documentoSubidoCache, tipoDocumentoId)) {
      return this.documentoSubidoCache[tipoDocumentoId];
    }

    // SOLUCIÓN: Buscar el tipo de documento requerido para obtener su información
    const tipoRequerido = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);

    // Buscar si hay algún documento que coincida exactamente con el id proporcionado
    const documentoExacto = this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    if (documentoExacto) {
      return this.documentoSubidoCache[tipoDocumentoId] = true;
    }

    // Buscar si hay algún documento cuyo tipo tenga el 'code' que coincide con tipoDocumentoId
    const documentoPorCodigo = this.documentosUsuario.find(doc =>
      doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId
    );
    if (documentoPorCodigo) {
      return this.documentoSubidoCache[tipoDocumentoId] = true;
    }

    // NUEVA LÓGICA: Buscar por nombre del tipo de documento si tenemos la información del tipo requerido
    if (tipoRequerido) {
      const documentoPorNombre = this.documentosUsuario.find(doc => {
        if (!doc.tipoDocumento || !doc.tipoDocumento.nombre) return false;

        // Comparación exacta de nombres (case insensitive)
        const nombreDocumento = doc.tipoDocumento.nombre.toLowerCase().trim();
        const nombreRequerido = tipoRequerido.nombre.toLowerCase().trim();

        return nombreDocumento === nombreRequerido;
      });

      if (documentoPorNombre) {
        return this.documentoSubidoCache[tipoDocumentoId] = true;
      }
    }

    // Caso especial para DNI (frente y dorso) si la lógica de IDs es genérica o combinada
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
        return this.documentoSubidoCache[tipoDocumentoId] = true;
      }
    }

    // Buscar por coincidencia parcial en el nombre del tipo de documento (usando tipoRequerido ya declarado)
    if (tipoRequerido) {
      const nombreTipoRequeridoLower = tipoRequerido.nombre.toLowerCase();

      for (const doc of this.documentosUsuario) {
        let nombreDocTipoLower = '';
        if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
          nombreDocTipoLower = doc.tipoDocumento.nombre.toLowerCase();
        } else {
          // Fallback: intentar encontrar el nombre del tipo de documento en la lista general de tipos
          const matchingTipo = this.tiposDocumento.find(t => t.id === doc.tipoDocumentoId || t.code === doc.tipoDocumentoId);
          if (matchingTipo && matchingTipo.nombre) {
            nombreDocTipoLower = matchingTipo.nombre.toLowerCase();
          }
        }

        if (nombreDocTipoLower &&
            (nombreDocTipoLower.includes(nombreTipoRequeridoLower) || nombreTipoRequeridoLower.includes(nombreDocTipoLower))) {
          return this.documentoSubidoCache[tipoDocumentoId] = true;
        }
      }
    }

    // Si no se encontró en ninguna de las comprobaciones
    return this.documentoSubidoCache[tipoDocumentoId] = false;
  }

  /**
   * Obtiene el objeto DocumentoUsuario subido que corresponde a un tipo de documento específico.
   * Utiliza la misma lógica de búsqueda flexible que `isDocumentoSubido`.
   * @param tipoDocumentoId El ID del tipo de documento a buscar.
   * @returns El objeto `DocumentoUsuario` o `undefined` si no se encuentra.
   */
  getDocumentoByTipo(tipoDocumentoId: string): DocumentoUsuario | undefined {
    // Buscar si hay algún documento que coincida exactamente con el id proporcionado
    const documentoExacto = this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    if (documentoExacto) {
      return documentoExacto;
    }

    // Buscar si hay algún documento cuyo tipo tenga el 'code' que coincide con tipoDocumentoId
    const documentoPorCodigo = this.documentosUsuario.find(doc =>
      doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId
    );
    if (documentoPorCodigo) {
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

        return esFrente || esDorso;
      });
      if (dniEspecifico) {
        return dniEspecifico;
      }
    }

    // Buscar por coincidencia parcial en el nombre
    const tipoRequerido = this.documentosRequeridos.find(tipo => tipo.id === tipoDocumentoId);
    if (tipoRequerido) {
      const nombreTipoRequeridoLower = tipoRequerido.nombre.toLowerCase();

      for (const doc of this.documentosUsuario) {
        let nombreDocTipoLower = '';
        if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
          nombreDocTipoLower = doc.tipoDocumento.nombre.toLowerCase();
        } else {
          const matchingTipo = this.tiposDocumento.find(t => t.id === doc.tipoDocumentoId || t.code === doc.tipoDocumentoId);
          if (matchingTipo && matchingTipo.nombre) {
            nombreDocTipoLower = matchingTipo.nombre.toLowerCase();
          }
        }

        if (nombreDocTipoLower &&
            (nombreDocTipoLower.includes(nombreTipoRequeridoLower) || nombreTipoRequeridoLower.includes(nombreDocTipoLower))) {
          return doc;
        }
      }
    }
    return undefined; // Si no se encuentra ningún documento que coincida
  }

  /**
   * Obtiene el estado del documento para su visualización en la UI.
   * Retorna una cadena para usar como clase CSS ('aprobado', 'pendiente', 'rechazado', 'faltante').
   * @param tipoDocumentoId El ID del tipo de documento.
   * @returns El estado del documento.
   */
  getEstadoDocumento(tipoDocumentoId: string): 'aprobado' | 'pendiente' | 'rechazado' | 'faltante' {
    const documento = this.getDocumentoByTipo(tipoDocumentoId);
    if (documento) {
      // Asumiendo que DocumentoUsuario tiene una propiedad 'estado'
      switch (documento.estado?.toLowerCase()) {
        case 'aprobado': return 'aprobado';
        case 'pendiente': return 'pendiente';
        case 'rechazado': return 'rechazado';
        default: return 'pendiente'; // Estado por defecto si no es reconocido
      }
    }
    return 'faltante';
  }

  /**
   * Obtiene el texto del estado del documento para su visualización.
   * @param tipoDocumentoId El ID del tipo de documento.
   * @returns El texto del estado.
   */
  getEstadoDocumentoTexto(tipoDocumentoId: string): string {
    const documento = this.getDocumentoByTipo(tipoDocumentoId);
    if (documento) {
      switch (documento.estado?.toLowerCase()) {
        case 'aprobado': return 'Aprobado';
        case 'pendiente': return 'Pendiente de revisión';
        case 'rechazado': return 'Rechazado';
        default: return 'Pendiente de revisión';
      }
    }
    return 'Pendiente de carga';
  }

  /**
   * Obtiene el ícono del estado del documento para su visualización.
   * @param tipoDocumentoId El ID del tipo de documento.
   * @returns La clase del ícono FontAwesome.
   */
  getEstadoDocumentoIcon(tipoDocumentoId: string): string {
    const estado = this.getEstadoDocumento(tipoDocumentoId);
    switch (estado) {
      case 'aprobado': return 'fa-check-circle';
      case 'pendiente': return 'fa-clock';
      case 'rechazado': return 'fa-times-circle';
      case 'faltante': return 'fa-exclamation-triangle';
      default: return 'fa-question-circle';
    }
  }
}
