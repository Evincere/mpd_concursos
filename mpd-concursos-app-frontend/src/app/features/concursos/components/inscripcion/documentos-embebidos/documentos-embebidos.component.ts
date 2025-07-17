import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { FormsModule } from '@angular/forms';
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';

import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { NotificationService } from '@shared/services/notification.service';

import { DocumentoUsuario, TipoDocumento, EstadoDocumento } from '@core/models/documento.model'; // Import EstadoDocumento
import { DocumentoUploadDialogComponent } from './documento-upload-dialog/documento-upload-dialog.component';
import { DocumentoMultipleUploadDialogComponent } from './documento-multiple-upload-dialog/documento-multiple-upload-dialog.component';
import { DocumentoViewerComponent } from '@shared/components/documento-viewer/documento-viewer.component';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { LoggingService } from '@core/services/logging/logging.service';

import { finalize, catchError, map } from 'rxjs/operators'; // Import map
import { Subscription, of, forkJoin } from 'rxjs'; // Import forkJoin
import { ConfirmationService } from '@shared/services/confirmation.service';

@Component({
  selector: 'app-documentos-embebidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomButtonComponent,
    DocumentoViewerComponent,
    DocumentoMultipleUploadDialogComponent,
    DatePipe // Add DatePipe for date formatting in template
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
        <app-custom-button
          variant="primary"
          label="Carga múltiple"
          icon="upload"
          (buttonClick)="abrirCargaMultiple()"
          class="btn-carga-multiple">
        </app-custom-button>
      </div>

      <!-- Indicador de progreso -->
      <div class="documentos-progress">
        <div class="progress-header">
          <span>Estado de tu documentación</span>
          <span class="progress-percentage">{{progresoDocumentacion}}%</span>
        </div>
        <div class="custom-progress-bar">
          <div class="progress-track">
            <div class="progress-fill"
                  [style.width.%]="progresoDocumentacion"
                  [class.progress-low]="progresoDocumentacion < 50"
                  [class.progress-medium]="progresoDocumentacion >= 50 && progresoDocumentacion < 100"
                  [class.progress-complete]="progresoDocumentacion === 100">
            </div>
          </div>
        </div>
        <div class="progress-info">
          <span *ngIf="progresoDocumentacion < 100 && documentosFaltantes > 0">
            <i class="fas fa-info-circle"></i>
            Te faltan {{documentosFaltantes}} documentos obligatorios para completar tu inscripción
          </span>
          <span *ngIf="progresoDocumentacion === 100">
            <i class="fas fa-check-circle"></i>
            ¡Has completado toda la documentación obligatoria! Los documentos opcionales puedes cargarlos cuando desees.
          </span>
        </div>
      </div>



      <!-- NUEVA FUNCIONALIDAD: Información de plazos perentorios -->
      <div class="deadline-info" *ngIf="documentationDeadline && documentosFaltantes > 0">
        <div class="deadline-header">
          <i class="fas fa-clock"></i>
          <span>Plazo Perentorio para Documentación</span>
        </div>
        <div class="deadline-content">
          <div class="deadline-time"
                [class.deadline-warning]="showDeadlineWarning"
                [class.deadline-expired]="isDeadlineExpired">
            <span class="time-remaining">{{getTimeRemainingText()}}</span>
            <span class="deadline-date" *ngIf="documentationDeadline">Vence: {{documentationDeadline | date:'dd/MM/yyyy HH:mm'}}</span>
          </div>
          <div class="deadline-message">
            <p *ngIf="!isDeadlineExpired && showDeadlineWarning" class="warning-message">
              <i class="fas fa-exclamation-triangle"></i>
              ¡Atención! Quedan pocas horas para completar la documentación.
            </p>
            <p *ngIf="!isDeadlineExpired && !showDeadlineWarning" class="info-message">
              <i class="fas fa-info-circle"></i>
              Tiene tiempo suficiente para completar la documentación requerida.
            </p>
            <p *ngIf="isDeadlineExpired" class="error-message">
              <i class="fas fa-times-circle"></i>
              El plazo para cargar documentación ha vencido. Su inscripción será congelada.
            </p>
          </div>
        </div>
      </div>

      <!-- ELIMINADO: La confirmación provisional ahora se maneja en el componente padre -->

      <!-- Sección de documentos requeridos -->
      <div class="documentos-requeridos">
        <div class="documentos-grid">
          <div *ngFor="let tipo of documentosRequeridos" class="documento-card"
                [class.completo]="isDocumentoSubido(tipo.tipoDocumentoId)">
            <!-- Header con icono y estado -->
            <div class="documento-header">
              <div class="documento-icon">
                <i class="fas fa-file-alt"></i>
                <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.tipoDocumentoId)">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="documento-estado">
                <ng-container *ngIf="isDocumentoSubido(tipo.tipoDocumentoId); else pendiente">
                  <span class="estado-texto aprobado" *ngIf="getEstadoDocumento(tipo.tipoDocumentoId) === EstadoDocumento.APROBADO">
                    <i class="fas fa-check-circle"></i> Aprobado
                  </span>
                  <span class="estado-texto pendiente" *ngIf="getEstadoDocumento(tipo.tipoDocumentoId) === EstadoDocumento.PENDIENTE">
                    <i class="fas fa-clock"></i> Pendiente de revisión
                  </span>
                  <span class="estado-texto rechazado" *ngIf="getEstadoDocumento(tipo.tipoDocumentoId) === EstadoDocumento.RECHAZADO">
                    <i class="fas fa-times-circle"></i> Rechazado
                  </span>
                </ng-container>
                <ng-template #pendiente>
                  <span class="estado-texto no-subido">
                    <i class="fas fa-upload"></i> No subido
                  </span>
                </ng-template>
              </div>

              <!-- Botón eliminar en esquina superior derecha -->
              <div class="delete-button-corner" *ngIf="isDocumentoSubido(tipo.tipoDocumentoId)">
                <app-custom-button
                  variant="danger"
                  icon="trash"
                  size="small"
                  [iconOnly]="true"
                  [tooltip]="'Eliminar documento'"
                  ariaLabel="Eliminar documento"
                  (buttonClick)="eliminarDocumento(getDocumento(tipo.tipoDocumentoId))">
                </app-custom-button>
              </div>
            </div>

            <!-- Contenido principal -->
            <div class="documento-content">
              <div class="documento-titulo-container">
                <h5 class="documento-titulo">{{tipo.title}}</h5>
                <span class="documento-badge" [ngClass]="tipo.required ? 'obligatorio' : 'opcional'">
                  {{tipo.required ? 'Obligatorio' : 'Opcional'}}
                </span>
              </div>
              <p class="documento-descripcion" *ngIf="tipo.description">{{tipo.description}}</p>
            </div>

            <!-- Acciones -->
            <div class="documento-actions">
              <app-custom-button
                variant="primary"
                [label]="isDocumentoSubido(tipo.tipoDocumentoId) ? 'Reemplazar' : 'Cargar'"
                [icon]="isDocumentoSubido(tipo.tipoDocumentoId) ? 'sync' : 'upload'"
                size="small"
                (buttonClick)="cargarDocumentoTipo(tipo.tipoDocumentoId)">
              </app-custom-button>

              <app-custom-button
                *ngIf="isDocumentoSubido(tipo.tipoDocumentoId)"
                variant="secondary"
                label="Ver"
                icon="eye"
                size="small"
                (buttonClick)="verDocumento(getDocumento(tipo.tipoDocumentoId))">
              </app-custom-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="documentosRequeridos.length === 0 && !isLoading">
        <i class="fas fa-folder-open"></i>
        <h4>No hay documentos requeridos para este concurso</h4>
        <p>Puedes continuar con el proceso de inscripción</p>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="custom-spinner"></div>
        <p>Cargando documentos...</p>
      </div>
    </div>
  `,
  styles: [`
    .documentos-container {
      padding: 1.5rem;
      color: #f9fafb;
    }

    .documentos-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .btn-carga-multiple {
      white-space: nowrap;
      margin-left: 1rem;
    }

    .documentos-title {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      color: #3b82f6;
      font-weight: 700;
    }

    .documentos-description {
      margin-bottom: 0.5rem;
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.6;
    }

    .documentos-progress {
      /* Glassmorphism premium dark design */
      background: rgba(55, 65, 81, 0.9);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-weight: 600;
      position: relative;
      z-index: 1;
    }

    .progress-percentage {
      color: #3b82f6;
      font-weight: 700;
    }

    .custom-progress-bar {
      margin: 1rem 0;
      position: relative;
      z-index: 1;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &.progress-low {
        background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }

      &.progress-medium {
        background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
      }

      &.progress-complete {
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
      }
    }

    .progress-info {
      display: flex;
      align-items: center;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #d1d5db;
      position: relative;
      z-index: 1;
    }

    .progress-info i {
      font-size: 16px;
      margin-right: 0.5rem;
    }

    /* NUEVA FUNCIONALIDAD: Estilos para información de plazos */
    .deadline-info {
      background: rgba(55, 65, 81, 0.9);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .deadline-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      font-weight: 600;
      color: #f59e0b;
      font-size: 1.1rem;
    }

    .deadline-header i {
      font-size: 1.2rem;
      margin-right: 0.75rem;
    }

    .deadline-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .deadline-time {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .deadline-time.deadline-warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
    }

    .deadline-time.deadline-expired {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
    }

    .time-remaining {
      font-size: 1.2rem;
      font-weight: 700;
      color: #f9fafb;
    }

    .deadline-warning .time-remaining {
      color: #f59e0b;
    }

    .deadline-expired .time-remaining {
      color: #ef4444;
    }

    .deadline-date {
      font-size: 0.9rem;
      color: #d1d5db;
      opacity: 0.8;
    }

    .deadline-message p {
      display: flex;
      align-items: center;
      margin: 0;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .deadline-message i {
      font-size: 1rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .warning-message {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .info-message {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .documentos-requeridos {
      margin-bottom: 2rem;
    }

    .documentos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      align-items: stretch;
    }

    .documento-card {
      display: flex;
      flex-direction: column;
      /* Glassmorphism premium dark design */
      background: rgba(55, 65, 81, 0.9);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: visible;
      min-height: 200px;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.4),
          0 6px 20px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      &.completo {
        border-color: rgba(76, 175, 80, 0.4);
        background-image: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
          pointer-events: none;
          border-radius: 8px;
        }
      }
    }

    /* Botón eliminar en esquina superior derecha */
    .delete-button-corner {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 15; /* Z-index más alto para estar siempre encima */
      opacity: 0.7;
      /* CRITICAL FIX: Asegurar que el botón tenga espacio suficiente */
      min-width: 40px;
      min-height: 40px;
      /* CRITICAL FIX: Área de click clara */
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 1;
      }
    }

    /* Nueva estructura de header */
    .documento-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      z-index: 1;
      position: relative;
      position: relative;
    }

    .documento-icon {
      position: relative;
      flex-shrink: 0;
    }

    .documento-icon i {
      font-size: 32px;
      color: #3b82f6;
      opacity: 0.8;
    }

    .estado-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #374151;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
    }

    .estado-badge i {
      font-size: 10px;
      color: white;
    }

    /* Contenido principal */
    .documento-content {
      flex: 1;
      margin-bottom: 1.5rem;
      z-index: 1;
      position: relative;
    }

    .documento-titulo-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      gap: 0.75rem;
    }

    .documento-titulo {
      margin: 0;
      font-size: 1.1rem;
      color: #fff;
      font-weight: 600;
      line-height: 1.3;
      flex: 1;
    }

    .documento-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;

      &.obligatorio {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      &.opcional {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
    }

    .documento-descripcion {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .documento-estado {
      flex-shrink: 0;
      /* CRITICAL FIX: Agregar margen derecho para evitar superposición con botón eliminar */
      margin-right: 60px; /* Más espacio para el botón de eliminar */
      max-width: calc(100% - 70px); /* Limitar ancho para evitar overflow */
    }

    .estado-texto {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      /* CRITICAL FIX: Asegurar que el texto no se desborde */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      /* CRITICAL FIX: Máximo ancho para evitar superposición absoluta */
      max-width: 100%;
      box-sizing: border-box;
    }

    .estado-texto i {
      font-size: 16px;
      margin-right: 0.5rem;
    }

    .estado-texto.aprobado {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.4rem 0.6rem; /* Padding más compacto */
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
      font-size: 0.8rem; /* Texto ligeramente más pequeño */
    }

    .estado-texto.pendiente {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      padding: 0.4rem 0.6rem; /* Padding más compacto */
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
      font-size: 0.8rem; /* Texto ligeramente más pequeño */
    }

    .estado-texto.rechazado {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.4rem 0.6rem; /* Padding más compacto */
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
      font-size: 0.8rem; /* Texto ligeramente más pequeño */
    }

    .estado-texto.no-subido {
      color: #9ca3af;
      background: rgba(156, 163, 175, 0.1);
      border: 1px solid rgba(156, 163, 175, 0.2);
      padding: 0.4rem 0.6rem; /* Padding más compacto */
      border-radius: 6px;
      font-size: 0.8rem; /* Texto ligeramente más pequeño */
      backdrop-filter: blur(4px);
      font-weight: 600;
    }

    .documento-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: auto;
      z-index: 1;
      position: relative;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      /* Glassmorphism premium dark design */
      background: rgba(55, 65, 81, 0.9);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      color: #6b7280;
    }

    .empty-state h4 {
      margin: 0 0 0.75rem;
      color: #f9fafb;
      font-weight: 600;
    }

    .empty-state p {
      margin: 0;
      color: #d1d5db;
      line-height: 1.6;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .loading-state p {
      margin-top: 1.5rem;
      color: #d1d5db;
      font-size: 1rem;
    }

    .custom-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* NUEVA FUNCIONALIDAD: Estilos para confirmación provisional */
    .confirmacion-provisional {
      /* Glassmorphism premium dark design */
      background: rgba(245, 158, 11, 0.1);
      background-image: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(245, 158, 11, 0.1),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .confirmacion-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-weight: 600;
      color: #f59e0b;
      font-size: 1.1rem;
    }

    .confirmacion-header i {
      font-size: 1.2rem;
    }

    .confirmacion-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .confirmacion-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .custom-checkbox {
      width: 20px;
      height: 20px;
      margin: 0;
      cursor: pointer;
      accent-color: #f59e0b;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .checkbox-label {
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      line-height: 1.6;
      color: #f9fafb;
      font-size: 0.95rem;
    }

    .checkbox-text {
      flex: 1;
    }

    .checkbox-text strong {
      color: #f59e0b;
      font-weight: 600;
    }

    .confirmacion-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 6px;
      font-size: 0.9rem;
      color: #d1d5db;
      line-height: 1.5;
    }

    .confirmacion-warning i {
      color: #f59e0b;
      margin-top: 2px;
      flex-shrink: 0;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .documentos-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .documento-card {
        padding: 1.25rem;
        min-height: auto;
      }

      .documento-header {
        margin-bottom: 0.75rem;
      }

      /* CRITICAL FIX: Ajustes responsivos para evitar superposición en móviles */
      .documento-estado {
        margin-right: 50px; /* Margen suficiente en móviles */
        max-width: calc(100% - 55px);
      }

      .estado-texto {
        font-size: 0.75rem; /* Texto más pequeño en móviles */
        padding: 0.3rem 0.5rem; /* Padding más reducido */
      }

      .delete-button-corner {
        top: 6px;
        right: 6px;
        min-width: 36px;
        min-height: 36px;
      }

      .documento-icon i {
        font-size: 28px;
      }

      .documento-titulo {
        font-size: 1rem;
        margin-bottom: 0.5rem;
      }

      .documento-descripcion {
        font-size: 0.85rem;
      }

      .documento-content {
        margin-bottom: 1rem;
      }

      .documento-actions {
        gap: 0.5rem;
      }

      .confirmacion-provisional {
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .confirmacion-checkbox {
        gap: 0.75rem;
      }

      .checkbox-label {
        font-size: 0.9rem;
      }

      .confirmacion-warning {
        padding: 0.75rem;
        font-size: 0.85rem;
      }
    }

    @media (max-width: 480px) {
      .documentos-container {
        padding: 1rem;
      }

      .documentos-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .btn-carga-multiple {
        margin-left: 0;
        align-self: flex-start;
      }

      .documento-card {
        padding: 1rem;
      }

      .documento-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class DocumentosEmbebidosComponent implements OnInit, OnDestroy {
  @Input() concursoId!: number;
  @Input() documentationDeadline: Date | null = null; // New Input for deadline
  @Output() documentosCompletados = new EventEmitter<boolean>();

  // SIMPLIFICADO: Solo mantener datos básicos, la lógica de validación está centralizada
  documentosRequeridos: { title: string; description?: string; required: boolean; completed: boolean; tipoDocumentoId: string; }[] = [];
  documentosUsuario: DocumentoUsuario[] = [];
  isLoading = true;
  progresoDocumentacion = 0;
  documentosFaltantes = 0;
  todosDocumentosCompletos = false;

  private subscription: Subscription | undefined;
  private deadlineInterval: any; // Para limpiar el setInterval

  // NUEVA FUNCIONALIDAD: Plazos perentorios
  hoursUntilDeadline = -1;
  isDeadlineExpired = false;
  showDeadlineWarning = false;
  private lastNotificationHour = -1; // Para evitar notificaciones duplicadas

  // Cache para evitar múltiples verificaciones
  private documentoSubidoCache: Record<string, boolean> = {};
  private documentoCache: Record<string, DocumentoUsuario> = {};

  // Expose EstadoDocumento enum to the template
  public readonly EstadoDocumento = EstadoDocumento;

  constructor(
    private dialog: UnifiedDialogService,
    private notificationService: NotificationService,
    private documentosService: DocumentosService,
    private loggingService: LoggingService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loggingService.debug('[DocumentosEmbebidos] Componente inicializado.', undefined, 'DocumentosEmbebidos');
    // Force data reload on init
    this.cargarDatos(true);

    // Calculate deadline on init if available
    this.calculateDocumentationDeadline();

    // CRITICAL FIX: Eliminar suscripción duplicada que causa ciclo infinito
    // Esta suscripción se elimina porque causa conflictos con documentacion-tab
    // Los datos se actualizarán a través del cache del servicio
    // this.subscription = this.documentosService.documentoActualizado$.subscribe(() => {
    //   this.loggingService.debug('[DocumentosEmbebidos] Evento documentoActualizado$ recibido. Recargando datos.', undefined, 'DocumentosEmbebidos');
    //   this.cargarDatos(true); // Force reload all data
    // });

    // Update deadlines every minute
    this.deadlineInterval = setInterval(() => {
      this.calculateTimeUntilDeadline();
    }, 60000); // Update every minute
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();

    // CRITICAL FIX: Limpiar el setInterval para evitar memory leaks
    if (this.deadlineInterval) {
      clearInterval(this.deadlineInterval);
      this.deadlineInterval = null;
    }

    this.loggingService.debug('[DocumentosEmbebidos] Componente destruido. Suscripciones y timers limpiados.', undefined, 'DocumentosEmbebidos');
  }

  /**
   * Loads all required documents and user's uploaded documents.
   * @param forceReload Whether to force a reload from the service.
   */
  cargarDatos(forceReload = false): void {
    this.isLoading = true;
    this.loggingService.debug(`[DocumentosEmbebidos] Cargando datos (forzarRecarga: ${forceReload})...`, undefined, 'DocumentosEmbebidos');

    // Use forkJoin to fetch both types of documents in parallel
    forkJoin({
      tiposDocumento: this.documentosService.getTiposDocumento(forceReload),
      documentosUsuario: this.documentosService.getDocumentosUsuario(forceReload)
    }).pipe(
      map(({ tiposDocumento, documentosUsuario }) => {
        // First, process and consolidate required document types
        const processedRequiredDocs = this.processRequiredDocumentTypes(tiposDocumento);
        this.documentosRequeridos = processedRequiredDocs;

        // Then, update user's uploaded documents and caches
        this.documentosUsuario = documentosUsuario || [];
        this.documentoSubidoCache = {}; // Reset cache
        this.documentoCache = {}; // Reset cache
        for (const documento of this.documentosUsuario) {
          if (documento.tipoDocumentoId) {
            // CRITICAL FIX: Marcar como subido independientemente del estado de aprobación
            this.documentoSubidoCache[documento.tipoDocumentoId] = true;
            this.documentoCache[documento.tipoDocumentoId] = documento;

            // Log para debugging
            this.loggingService.debug(`[DocumentosEmbebidos] Documento en cache: ${documento.tipoDocumentoId}`, {
              tipoDocumentoId: documento.tipoDocumentoId,
              estado: documento.estado,
              nombreArchivo: documento.nombreArchivo
            }, 'DocumentosEmbebidos');
          }
        }
      }),
      finalize(() => {
        this.isLoading = false;
        this.loggingService.debug('[DocumentosEmbebidos] Carga de datos finalizada. Calculando progreso...', undefined, 'DocumentosEmbebidos');
        this.calcularProgreso(); // Calculate progress after both lists are loaded and caches updated

        // CRITICAL FIX: Forzar detección de cambios después de actualizar datos
        setTimeout(() => {
          this.cdr.detectChanges();
          this.loggingService.debug('[DocumentosEmbebidos] Detección de cambios forzada después de cargar datos', undefined, 'DocumentosEmbebidos');
        }, 100);
      }),
      catchError(error => {
        console.error('[DocumentosEmbebidos] Error al cargar datos combinados:', error);
        this.mostrarError('Error al cargar la documentación. Por favor, intente nuevamente.');
        this.isLoading = false;
        return of(null); // Return observable of null to gracefully handle errors
      })
    ).subscribe();
  }

  /**
   * Processes the raw list of document types, consolidating DNI front/back if present.
   * @param rawTipos The raw list of TipoDocumento from the service.
   * @returns A consolidated and cleaned list of required documents.
   */
  private processRequiredDocumentTypes(rawTipos: TipoDocumento[]): { title: string; description?: string; required: boolean; completed: boolean; tipoDocumentoId: string; }[] {

    // 🔍 DEBUGGING: Log de tipos de documento recibidos del backend
    this.loggingService.debug('[DocumentosEmbebidos] === TIPOS DE DOCUMENTO DEL BACKEND ===', {
      totalTipos: rawTipos.length,
      tiposRecibidos: rawTipos.map(tipo => ({
        id: tipo.id,
        code: tipo.code,
        nombre: tipo.nombre,
        requerido: tipo.requerido,
        activo: tipo.activo
      }))
    }, 'DocumentosEmbebidos');

    let documentosFinal: { title: string; description?: string; required: boolean; completed: boolean; tipoDocumentoId: string; }[] = [];

    // Prioritize getting DNI consolidated entry
    const dniFrente = rawTipos.find(tipo => tipo.id === 'dni-frente' || tipo.code === 'dni-frente' || (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('frente')));
    const dniDorso = rawTipos.find(tipo => tipo.id === 'dni-dorso' || tipo.code === 'dni-dorso' || (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('dorso')));

    // ✅ CORRECCIÓN: Identificación más específica del documento DNI general para evitar que aparezca en la interfaz
    const dniGeneral = rawTipos.find(tipo =>
      (tipo.id === 'dni' || tipo.code === 'dni' ||
       tipo.nombre.toLowerCase() === 'documento nacional de identidad' ||
       tipo.nombre.toLowerCase() === 'dni') &&
      !tipo.nombre.toLowerCase().includes('frente') &&
      !tipo.nombre.toLowerCase().includes('dorso')
    );

    const processedIds = new Set<string>();

    if (dniFrente && dniDorso) {
      // NUEVA IMPLEMENTACIÓN: Cards separadas para DNI Frente y Dorso
      documentosFinal.push({
        title: 'DNI (Frente)',
        description: 'Lado frontal de su Documento Nacional de Identidad.',
        required: dniFrente.requerido, // ✅ Usar la propiedad del backend
        completed: false,
        tipoDocumentoId: dniFrente.id
      });
      documentosFinal.push({
        title: 'DNI (Dorso)',
        description: 'Lado posterior de su Documento Nacional de Identidad.',
        required: dniDorso.requerido, // ✅ Usar la propiedad del backend
        completed: false,
        tipoDocumentoId: dniDorso.id
      });
      processedIds.add(dniFrente.id);
      processedIds.add(dniDorso.id);
    }

    // ✅ CORRECCIÓN CRÍTICA: Siempre marcar el DNI general como procesado para evitar que aparezca
    // El DNI siempre debe manejarse como frente y dorso separados
    if (dniGeneral) {
      processedIds.add(dniGeneral.id); // Marcar como procesado para evitar que aparezca
      this.loggingService.debug('[DocumentosEmbebidos] DNI general encontrado y marcado como procesado para evitar duplicación', {
        dniGeneralId: dniGeneral.id,
        dniGeneralNombre: dniGeneral.nombre
      }, 'DocumentosEmbebidos');
    }

    // Add all other documents that were not part of the DNI consolidation
    // CRITICAL FIX: Usar la propiedad 'requerido' del backend para determinar si es obligatorio
    rawTipos.forEach(tipo => {
      if (!processedIds.has(tipo.id)) {
        // ✅ FILTRO ADICIONAL: Evitar que aparezcan documentos DNI generales que no fueron detectados anteriormente
        const esDniGeneral = (
          tipo.nombre.toLowerCase() === 'documento nacional de identidad' ||
          tipo.nombre.toLowerCase() === 'dni' ||
          (tipo.id === 'dni' || tipo.code === 'dni')
        ) && !tipo.nombre.toLowerCase().includes('frente') && !tipo.nombre.toLowerCase().includes('dorso');

        if (esDniGeneral) {
          this.loggingService.debug('[DocumentosEmbebidos] Documento DNI general detectado en segunda pasada y filtrado', {
            tipoId: tipo.id,
            tipoNombre: tipo.nombre
          }, 'DocumentosEmbebidos');
          return; // Saltar este documento
        }

        documentosFinal.push({
          title: tipo.nombre,
          description: tipo.descripcion,
          required: tipo.requerido, // ✅ USAR LA PROPIEDAD DEL BACKEND
          completed: false,
          tipoDocumentoId: tipo.id
        });
      }
    });

    // CRITICAL FIX: Ensure essential documents are always present as a fallback
    if (documentosFinal.length === 0) {
      console.error('[DocumentosEmbebidos] CONFIGURACIÓN INCORRECTA: No hay documentos requeridos definidos desde el backend. Aplicando documentación base obligatoria de emergencia.');
      this.notificationService.error('Error de configuración de documentos. Se usarán documentos básicos obligatorios.');
      documentosFinal = this.getEmergencyBaseDocuments();
    }

    // 🔍 DEBUGGING: Log de documentos finales procesados
    const obligatorios = documentosFinal.filter(doc => doc.required);
    const opcionales = documentosFinal.filter(doc => !doc.required);

    this.loggingService.debug('[DocumentosEmbebidos] === DOCUMENTOS FINALES PROCESADOS ===', {
      totalDocumentos: documentosFinal.length,
      obligatoriosCount: obligatorios.length,
      opcionalesCount: opcionales.length,
      documentosObligatorios: obligatorios.map(doc => ({
        title: doc.title,
        tipoDocumentoId: doc.tipoDocumentoId,
        required: doc.required
      })),
      documentosOpcionales: opcionales.map(doc => ({
        title: doc.title,
        tipoDocumentoId: doc.tipoDocumentoId,
        required: doc.required
      }))
    }, 'DocumentosEmbebidos');

    return documentosFinal;
  }

  /**
   * Provides a list of emergency fallback base documents if no required documents are received from the backend.
   * This is a safeguard against misconfigurations.
   */
  private getEmergencyBaseDocuments(): { title: string; description?: string; required: boolean; completed: boolean; tipoDocumentoId: string; }[] {
    return [
      { title: 'DNI', description: 'Documento Nacional de Identidad', required: true, completed: false, tipoDocumentoId: 'dni-emergencia' },
      { title: 'CUIL', description: 'Constancia de CUIL/CUIT', required: true, completed: false, tipoDocumentoId: 'cuil-emergencia' },
      { title: 'Certificado de Antecedentes', description: 'Certificado de antecedentes penales', required: true, completed: false, tipoDocumentoId: 'antecedentes-emergencia' }
    ];
  }

  /**
   * Calculates the progress of document completion and updates related state variables.
   * CRITICAL FIX: Solo considera documentos marcados como 'required: true' para el progreso
   */
  calcularProgreso(): void {
    console.log('🔥 MÉTODO calcularProgreso() EJECUTÁNDOSE - CORRECCIÓN APLICADA');
    this.loggingService.debug('[DocumentosEmbebidos] Recalculando progreso de documentos...', undefined, 'DocumentosEmbebidos');

    // ✅ ACTUALIZAR ESTADO DE COMPLETITUD PARA TODOS LOS DOCUMENTOS (obligatorios y opcionales)
    this.documentosRequeridos.forEach(tipoDoc => {
      // SIMPLIFICADO: Verificación directa para cada documento individual
      // Ya no necesitamos lógica especial para DNI consolidado porque ahora son cards separadas
      if (tipoDoc.tipoDocumentoId.includes('-emergencia')) {
        // For emergency documents, check if corresponding real document is uploaded
        if (tipoDoc.tipoDocumentoId === 'dni-emergencia') {
          tipoDoc.completed = this.isDocumentoSubido('dni') || (this.isDocumentoSubido('dni-frente') && this.isDocumentoSubido('dni-dorso'));
        } else if (tipoDoc.tipoDocumentoId === 'cuil-emergencia') {
          tipoDoc.completed = this.isDocumentoSubido('cuil');
        } else if (tipoDoc.tipoDocumentoId === 'antecedentes-emergencia') {
          tipoDoc.completed = this.isDocumentoSubido('antecedentes');
        } else {
          tipoDoc.completed = this.isDocumentoSubido(tipoDoc.tipoDocumentoId);
        }
      } else {
        // Verificación estándar para todos los documentos (incluidos DNI frente y dorso por separado)
        tipoDoc.completed = this.isDocumentoSubido(tipoDoc.tipoDocumentoId);
      }
    });

    // ✅ FILTRAR SOLO DOCUMENTOS OBLIGATORIOS PARA EL CÁLCULO DE PROGRESO
    const documentosObligatorios = this.documentosRequeridos.filter(doc => doc.required === true);

    if (!documentosObligatorios || documentosObligatorios.length === 0) {
      this.documentosFaltantes = 0;
      this.progresoDocumentacion = 100;
      this.todosDocumentosCompletos = true;
      this.loggingService.debug('[DocumentosEmbebidos] No hay documentos obligatorios, progreso 100%.', undefined, 'DocumentosEmbebidos');
      this.emitirEstadoDocumentos();
      return;
    }

    // ✅ CONTAR SOLO DOCUMENTOS OBLIGATORIOS COMPLETADOS
    let documentosObligatoriosCompletados = 0;
    documentosObligatorios.forEach(tipoDoc => {
      if (tipoDoc.completed) {
        documentosObligatoriosCompletados++;
      }
    });

    // ✅ CALCULAR PROGRESO BASADO SOLO EN DOCUMENTOS OBLIGATORIOS
    this.documentosFaltantes = documentosObligatorios.length - documentosObligatoriosCompletados;
    this.progresoDocumentacion = Math.round((documentosObligatoriosCompletados / documentosObligatorios.length) * 100);
    this.todosDocumentosCompletos = this.documentosFaltantes === 0;

    this.loggingService.debug(`[DocumentosEmbebidos] Progreso CORREGIDO: ${this.progresoDocumentacion}%, Obligatorios: ${documentosObligatoriosCompletados}/${documentosObligatorios.length}, Faltantes: ${this.documentosFaltantes}`, {
      documentosObligatorios: documentosObligatorios.length,
      documentosObligatoriosCompletados,
      documentosFaltantes: this.documentosFaltantes,
      progresoDocumentacion: this.progresoDocumentacion,
      todosDocumentosCompletos: this.todosDocumentosCompletos
    }, 'DocumentosEmbebidos');

    // ✅ SOLO NOTIFICAR SI REALMENTE TODOS LOS DOCUMENTOS OBLIGATORIOS ESTÁN COMPLETOS
    if (this.todosDocumentosCompletos) {
      this.notificationService.success('¡Has completado toda la documentación obligatoria!');
    }

    this.emitirEstadoDocumentos();
  }

  /**
   * SIMPLIFICADO: Emite solo el estado de completitud de documentos
   * La lógica de inscripción provisional se maneja en el componente padre
   */
  emitirEstadoDocumentos(): void {
    this.loggingService.debug(`[DocumentosEmbebidos] Emitiendo estado de documentos: ${this.todosDocumentosCompletos}`, undefined, 'DocumentosEmbebidos');
    this.documentosCompletados.emit(this.todosDocumentosCompletos);
  }

  /**
   * SIMPLIFICADO: Verifica si un documento específico ha sido subido
   * @param tipoDocumentoId The ID of the document type to check.
   * @returns True if the document is uploaded, false otherwise.
   */
  isDocumentoSubido(tipoDocumentoId: string): boolean {
    // Handle emergency DNI type (checks if general DNI or front/back are uploaded)
    if (tipoDocumentoId === 'dni-emergencia') {
      return this.documentoSubidoCache['dni'] || (this.documentoSubidoCache['dni-frente'] && this.documentoSubidoCache['dni-dorso']);
    }
    // Verificación estándar para todos los documentos (incluidos DNI frente y dorso por separado)
    const isUploaded = this.documentoSubidoCache[tipoDocumentoId] === true;

    // Log para debugging
    this.loggingService.debug(`[DocumentosEmbebidos] Verificando documento ${tipoDocumentoId}: ${isUploaded ? 'SUBIDO' : 'NO SUBIDO'}`, {
      tipoDocumentoId,
      cacheValue: this.documentoSubidoCache[tipoDocumentoId],
      allCache: this.documentoSubidoCache
    }, 'DocumentosEmbebidos');

    return isUploaded;
  }

  /**
   * SIMPLIFICADO: Obtiene el documento subido para un tipo específico
   * @param tipoDocumentoId The ID of the document type.
   * @returns The DocumentoUsuario object, or undefined if not found.
   */
  getDocumento(tipoDocumentoId: string): DocumentoUsuario | undefined {
    if (tipoDocumentoId === 'dni-emergencia') {
      return this.documentoCache['dni'] || this.documentoCache['dni-frente'] || this.documentoCache['dni-dorso'];
    }
    // Búsqueda directa para todos los documentos (incluidos DNI frente y dorso por separado)
    return this.documentoCache[tipoDocumentoId];
  }

  /**
   * Gets the approval status of a document (e.g., 'aprobado', 'pendiente', 'rechazado', 'no-subido').
   * @param tipoDocumentoId The ID of the document type.
   * @returns The status string.
   */
  getEstadoDocumento(tipoDocumentoId: string): EstadoDocumento | 'no-subido' {
    const doc = this.getDocumento(tipoDocumentoId);
    if (doc) {
      return doc.estado || EstadoDocumento.PENDIENTE; // Default to PENDIENTE if state is missing
    }
    return 'no-subido';
  }

  /**
   * Opens the single document upload dialog for a specific document type.
   * @param tipoDocumentoId The ID of the document type to upload.
   */
  cargarDocumentoTipo(tipoDocumentoId: string): void {
    const tipoDoc = this.documentosRequeridos.find(d => d.tipoDocumentoId === tipoDocumentoId);
    if (!tipoDoc) {
      this.notificationService.error('Tipo de documento no encontrado.');
      return;
    }

    // Verificar si es un reemplazo (documento ya subido)
    const esReemplazo = this.isDocumentoSubido(tipoDocumentoId);
    const documentoExistente = esReemplazo ? this.getDocumento(tipoDocumentoId) : null;

    this.loggingService.debug(`[DocumentosEmbebidos] Abriendo diálogo para ${esReemplazo ? 'reemplazar' : 'cargar'} documento: ${tipoDocumentoId}`, undefined, 'DocumentosEmbebidos');

    this.dialog.open(DocumentoUploadDialogComponent, {
      title: `${esReemplazo ? 'Reemplazar' : 'Cargar'} ${tipoDoc.title}`,
      showFooter: false, // Disable external footer buttons
      showCancelButton: false, // Disable external cancel button
      showConfirmButton: false, // Disable external confirm button
      data: {
        tipoDocumentoId: tipoDoc.tipoDocumentoId,
        tipoDocumentoNombre: tipoDoc.title,
        modoReemplazo: esReemplazo,
        documentoExistente: documentoExistente
      }
    }).afterClosed().subscribe((result: any) => {
      if (result && result.success) {
        this.notificationService.success(`${tipoDoc.title} ${esReemplazo ? 'reemplazado' : 'cargado'} exitosamente.`);

        // CRITICAL FIX: Invalidar cache y recargar datos para forzar actualización de UI
        this.documentosService.invalidarCache();
        this.cargarDatos(true);

        // CRITICAL FIX: Forzar actualización inmediata de la UI
        setTimeout(() => {
          this.cdr.detectChanges();
          this.loggingService.debug('[DocumentosEmbebidos] UI actualizada después de upload exitoso', undefined, 'DocumentosEmbebidos');
        }, 200);

      } else if (result && result.cancelled) {
        this.loggingService.debug(`[DocumentosEmbebidos] ${esReemplazo ? 'Reemplazo' : 'Carga'} de documento cancelada.`, undefined, 'DocumentosEmbebidos');
      } else if (result !== null && result !== undefined) {
        this.notificationService.error(`Error al ${esReemplazo ? 'reemplazar' : 'cargar'} ${tipoDoc.title}.`);
      }
    });
  }

  /**
   * Opens the multiple document upload dialog.
   */
  abrirCargaMultiple(): void {
    this.loggingService.debug('[DocumentosEmbebidos] Abriendo diálogo de carga múltiple.', undefined, 'DocumentosEmbebidos');

    // CRITICAL FIX: Convert documentosRequeridos to TipoDocumento format expected by the dialog
    // First, get all document types from the service to have the complete TipoDocumento objects
    this.documentosService.getTiposDocumento().subscribe({
      next: (tiposDocumento) => {
        this.dialog.open(DocumentoMultipleUploadDialogComponent, {
          title: 'Carga Múltiple de Documentos',
          showFooter: false, // Disable external footer buttons
          showCancelButton: false, // Disable external cancel button
          showConfirmButton: false, // Disable external confirm button
          data: {
            tiposDocumento: tiposDocumento, // Pass the complete TipoDocumento array
            concursoId: this.concursoId // Pass contest ID if needed by multi-upload
          }
        }).afterClosed().subscribe((result: any) => {
          if (result && result.success) {
            // CRITICAL FIX: Eliminar notificación duplicada
            // El componente hijo ya maneja las notificaciones en finalizarProceso()
            // this.notificationService.success('Documentos cargados exitosamente.');

            // CRITICAL FIX: Invalidar cache y recargar datos para forzar actualización de UI
            this.documentosService.invalidarCache();
            this.cargarDatos(true); // Recargar todos los datos para actualizar el estado

            // CRITICAL FIX: Forzar actualización inmediata de la UI después de carga múltiple
            setTimeout(() => {
              this.cdr.detectChanges();
              this.loggingService.debug('[DocumentosEmbebidos] UI actualizada después de carga múltiple exitosa', undefined, 'DocumentosEmbebidos');
            }, 300);

          } else if (result && result.cancelled) {
            this.loggingService.debug('[DocumentosEmbebidos] Carga múltiple de documentos cancelada.', undefined, 'DocumentosEmbebidos');
          } else if (result !== null && result !== undefined) {
            // CRITICAL FIX: Eliminar notificación de error duplicada también
            // El componente hijo ya maneja las notificaciones de error
            // this.notificationService.error('Error al cargar documentos.');
          }
        });
      },
      error: (error) => {
        console.error('[DocumentosEmbebidos] Error al cargar tipos de documento para diálogo múltiple:', error);
        this.notificationService.error('Error al cargar los tipos de documento disponibles.');
      }
    });
  }

  /**
   * Opens the document viewer for an uploaded document.
   * @param documento The DocumentoUsuario object to view.
   */
  verDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notificationService.warning('Documento no disponible para ver.');
      return;
    }
    this.loggingService.debug(`[DocumentosEmbebidos] Abriendo visor para documento: ${documento.nombreArchivo}`, undefined, 'DocumentosEmbebidos');
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
   * Deletes an uploaded document after confirmation.
   * CRITICAL FIX: Reemplaza modal nativo con componente personalizado y corrige manejo de respuesta
   * @param documento The DocumentoUsuario object to delete.
   */
  eliminarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.notificationService.error('Documento no válido para eliminar.');
      return;
    }

    this.loggingService.debug(`[DocumentosEmbebidos] Confirmando eliminación para documento: ${documento.nombreArchivo}`, undefined, 'DocumentosEmbebidos');

    this.confirmationService
      .danger(
        'Eliminar Documento',
        `¿Está seguro de que desea eliminar el documento "${documento.nombreArchivo}"?`,
        'Esta acción no se puede deshacer.',
        'Eliminar',
        'Cancelar'
      )
      .subscribe((confirmed) => {
        if (confirmed) {
          this.loggingService.debug(`[DocumentosEmbebidos] Eliminando documento: ${documento.id}`, undefined, 'DocumentosEmbebidos');

          this.isLoading = true;
          this.documentosService.deleteDocumento(documento.id!).pipe(
            finalize(() => {
              this.isLoading = false;
              this.loggingService.debug('[DocumentosEmbebidos] Operación de eliminación finalizada', undefined, 'DocumentosEmbebidos');
            })
          ).subscribe(success => {
            if (success) {
              this.loggingService.debug('[DocumentosEmbebidos] Documento eliminado exitosamente', undefined, 'DocumentosEmbebidos');
              this.notificationService.success(`"${documento.nombreArchivo}" eliminado exitosamente.`);
              this.cargarDatos(true);
            } else {
              this.notificationService.error(`Error al eliminar ${documento.nombreArchivo}.`);
            }
          });
        } else {
          this.loggingService.debug('[DocumentosEmbebidos] Eliminación cancelada por el usuario', undefined, 'DocumentosEmbebidos');
        }
      });
  }

  /**
   * Calculates the time remaining until the documentation deadline.
   */
  calculateDocumentationDeadline(): void {
    if (!this.documentationDeadline) {
      this.hoursUntilDeadline = -1;
      this.isDeadlineExpired = false;
      this.showDeadlineWarning = false;
      this.loggingService.debug('[DocumentosEmbebidos] No se ha definido una fecha límite de documentación.', undefined, 'DocumentosEmbebidos');
      return;
    }

    const now = new Date();
    const deadlineTime = this.documentationDeadline.getTime();
    const remainingMs = deadlineTime - now.getTime();

    this.isDeadlineExpired = remainingMs <= 0;

    if (this.isDeadlineExpired) {
      this.hoursUntilDeadline = 0;
      this.showDeadlineWarning = false;
      this.notificationService.warning('El plazo para cargar la documentación ha vencido. Su inscripción será provisional.');
      this.emitirEstadoDocumentos(); // Emit updated status
    } else {
      this.hoursUntilDeadline = Math.ceil(remainingMs / (1000 * 60 * 60)); // Remaining hours
      // Set warning if less than 48 hours (or any threshold)
      this.showDeadlineWarning = this.hoursUntilDeadline <= 48;
    }
    // CRITICAL FIX: Eliminar cdr.detectChanges() para evitar bucles infinitos
    // Angular manejará automáticamente la detección de cambios

    this.loggingService.debug(`[DocumentosEmbebidos] Plazo límite: ${this.documentationDeadline.toISOString()}, Horas restantes: ${this.hoursUntilDeadline}, Expirado: ${this.isDeadlineExpired}`, undefined, 'DocumentosEmbebidos');
  }

  /**
   * Updates the displayed time remaining. Called periodically.
   */
  calculateTimeUntilDeadline(): void {
    if (this.isDeadlineExpired || !this.documentationDeadline) {
      return;
    }

    const now = new Date();
    const deadlineTime = this.documentationDeadline.getTime();
    const remainingMs = deadlineTime - now.getTime();

    if (remainingMs <= 0) {
      this.isDeadlineExpired = true;
      this.hoursUntilDeadline = 0;
      this.showDeadlineWarning = false;
      this.notificationService.warning('El plazo para cargar la documentación ha vencido. Su inscripción será provisional.');
      this.emitirEstadoDocumentos(); // Emit updated status
    } else {
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      if (remainingHours !== this.lastNotificationHour) { // Avoid spamming notifications
        if (remainingHours <= 24 && remainingHours > 0 && remainingHours !== this.lastNotificationHour) {
          this.notificationService.warning(`¡Atención! Solo quedan ${remainingHours} horas para cargar la documentación.`);
          this.lastNotificationHour = remainingHours;
        } else if (remainingHours <= 48 && remainingHours > 24 && remainingHours !== this.lastNotificationHour) {
          this.notificationService.info(`Quedan ${remainingHours} horas para el plazo de documentación.`);
          this.lastNotificationHour = remainingHours;
        }
      }
      this.hoursUntilDeadline = remainingHours;
      this.showDeadlineWarning = this.hoursUntilDeadline <= 48; // Adjust warning threshold as needed
    }
    // CRITICAL FIX: Eliminar cdr.detectChanges() para evitar bucles infinitos
    // Angular manejará automáticamente la detección de cambios
  }

  /**
   * Formats the remaining time into a human-readable string.
   */
  getTimeRemainingText(): string {
    if (this.isDeadlineExpired) {
      return 'Plazo Vencido';
    }
    if (this.hoursUntilDeadline === 0) {
      return 'Menos de 1 hora';
    }
    if (this.hoursUntilDeadline < 24) {
      return `${this.hoursUntilDeadline} horas restantes`;
    }
    const days = Math.floor(this.hoursUntilDeadline / 24);
    const hours = this.hoursUntilDeadline % 24;
    return `${days} días y ${hours} horas restantes`;
  }

  // ELIMINADO: onConfirmacionProvisionalChange - La lógica provisional se maneja en el componente padre

  /**
   * Displays an error notification.
   * @param message The error message.
   */
  private mostrarError(message: string): void {
    this.notificationService.error(message);
  }
}
