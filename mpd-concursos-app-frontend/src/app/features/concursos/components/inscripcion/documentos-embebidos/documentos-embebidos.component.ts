import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';

import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { NotificationService } from '@shared/services/notification.service';

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
    FormsModule,
    CustomButtonComponent,
    DocumentoViewerComponent,
    DocumentoMultipleUploadDialogComponent
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
            ¡Has completado toda la documentación requerida!
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
            <span class="deadline-date">Vence: {{documentationDeadline | date:'dd/MM/yyyy HH:mm'}}</span>
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

      <!-- NUEVA FUNCIONALIDAD: Confirmación de inscripción provisional -->
      <div class="confirmacion-provisional" *ngIf="mostrarConfirmacionProvisional && !isDeadlineExpired">
        <div class="confirmacion-header">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Inscripción Provisional</span>
        </div>
        <div class="confirmacion-content">
          <div class="confirmacion-checkbox">
            <input
              type="checkbox"
              id="confirmacion-provisional"
              [(ngModel)]="confirmacionInscripcionProvisional"
              (ngModelChange)="onConfirmacionProvisionalChange($event)"
              class="custom-checkbox">
            <label for="confirmacion-provisional" class="checkbox-label">
              <span class="checkbox-text">
                Comprendo que mi inscripción será <strong>provisional</strong> hasta completar toda la documentación requerida
                dentro del plazo perentorio establecido. Acepto que la falta de documentación completa puede resultar
                en la <strong>descalificación automática</strong> de mi postulación.
              </span>
            </label>
          </div>
          <div class="confirmacion-warning">
            <i class="fas fa-info-circle"></i>
            <span>
              Al continuar sin documentación completa, tu inscripción quedará en estado provisional.
              Debes regularizar la documentación antes del vencimiento del plazo para evitar la descalificación.
            </span>
          </div>
        </div>
      </div>

      <!-- Sección de documentos requeridos -->
      <div class="documentos-requeridos">
        <div class="documentos-grid">
          <div *ngFor="let tipo of documentosRequeridos" class="documento-card"
               [class.completo]="isDocumentoSubido(tipo.id)">
            <!-- Header con icono y estado -->
            <div class="documento-header">
              <div class="documento-icon">
                <i class="fas fa-file-alt"></i>
                <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                  <i class="fas fa-check"></i>
                </div>
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
                  <span class="estado-texto no-subido">
                    <i class="fas fa-upload"></i> No subido
                  </span>
                </ng-template>
              </div>
            </div>

            <!-- Contenido principal -->
            <div class="documento-content">
              <h5 class="documento-titulo">{{tipo.nombre}}</h5>
              <p class="documento-descripcion" *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
            </div>

            <!-- Acciones -->
            <div class="documento-actions">
              <app-custom-button
                variant="primary"
                [label]="isDocumentoSubido(tipo.id) ? 'Reemplazar' : 'Cargar'"
                [icon]="isDocumentoSubido(tipo.id) ? 'sync' : 'upload'"
                size="small"
                (buttonClick)="cargarDocumentoTipo(tipo.id)">
              </app-custom-button>

              <app-custom-button
                *ngIf="isDocumentoSubido(tipo.id)"
                variant="secondary"
                label="Ver"
                icon="eye"
                size="small"
                (buttonClick)="verDocumento(getDocumento(tipo.id))">
              </app-custom-button>

              <app-custom-button
                *ngIf="isDocumentoSubido(tipo.id)"
                variant="danger"
                label="Eliminar"
                icon="trash"
                size="small"
                (buttonClick)="eliminarDocumento(getDocumento(tipo.id))">
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

    /* Nueva estructura de header */
    .documento-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      z-index: 1;
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

    .documento-titulo {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
      color: #fff;
      font-weight: 600;
      line-height: 1.3;
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
    }

    .estado-texto {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
    }

    .estado-texto i {
      font-size: 16px;
      margin-right: 0.5rem;
    }

    .estado-texto.aprobado {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
    }

    .estado-texto.pendiente {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
    }

    .estado-texto.rechazado {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      backdrop-filter: blur(4px);
      font-weight: 600;
    }

    .estado-texto.no-subido {
      color: #9ca3af;
      background: rgba(156, 163, 175, 0.1);
      border: 1px solid rgba(156, 163, 175, 0.2);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
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
  @Output() documentosCompletados = new EventEmitter<boolean>();

  documentosRequeridos: TipoDocumento[] = [];
  documentosUsuario: DocumentoUsuario[] = [];
  isLoading = true;
  progresoDocumentacion = 0;
  documentosFaltantes = 0;
  todosDocumentosCompletos = false; // Variable para controlar si todos los documentos están completos

  // NUEVA FUNCIONALIDAD: Confirmación de inscripción provisional
  confirmacionInscripcionProvisional = false;
  mostrarConfirmacionProvisional = false; // Se muestra solo cuando hay documentos faltantes

  private subscription: Subscription | undefined;

  // NUEVA FUNCIONALIDAD: Plazos perentorios
  documentationDeadline: Date | null = null;
  hoursUntilDeadline = -1;
  isDeadlineExpired = false;
  showDeadlineWarning = false;
  private lastNotificationHour = -1; // Para evitar notificaciones duplicadas

  // Cache para evitar múltiples verificaciones
  private documentoSubidoCache: Record<string, boolean> = {};
  private documentoCache: Record<string, DocumentoUsuario> = {};

  constructor(
    private dialog: CustomDialogService,
    private notificationService: NotificationService,
    private documentosService: DocumentosService
  ) {}



  ngOnInit(): void {
    // Forzar recarga de datos al inicializar
    this.cargarDatos(true);

    // NUEVA FUNCIONALIDAD: Calcular plazos perentorios
    this.calculateDocumentationDeadline();

    // Suscribirse a las actualizaciones de documentos
    this.subscription = this.documentosService.documentoActualizado$.subscribe(() => {
      console.log('[DocumentosEmbebidos] Recibida notificación de documento actualizado, recargando documentos...');
      this.cargarDocumentosUsuario(true);
    });

    // NUEVA FUNCIONALIDAD: Actualizar plazos cada minuto
    setInterval(() => {
      this.calculateTimeUntilDeadline();
    }, 60000); // Actualizar cada minuto
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

        // CORRECCIÓN CRÍTICA: Garantizar documentación base obligatoria
        if (documentosRequeridos.length === 0) {
          console.error('[DocumentosEmbebidos] CONFIGURACIÓN INCORRECTA: No hay documentos requeridos definidos');
          console.warn('[DocumentosEmbebidos] Aplicando documentación base obligatoria de emergencia');

          // Cargar documentación base mínima obligatoria como fallback
          documentosRequeridos = this.getDocumentacionBaseObligatoria(tipos);

          if (documentosRequeridos.length === 0) {
            console.error('[DocumentosEmbebidos] ERROR CRÍTICO: No se pudo establecer documentación base');
            this.mostrarError('Error crítico: No se pudo cargar la documentación requerida. Contacte al administrador.');
            return;
          }
        }

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

    // CORRECCIÓN CRÍTICA: Nunca debe haber 0 documentos requeridos
    if (documentosRequeridos.length === 0) {
      console.error('[DocumentosEmbebidos] ERROR CRÍTICO: No hay documentos requeridos para calcular progreso');
      this.documentosFaltantes = 1; // Indicar que falta documentación
      this.progresoDocumentacion = 0; // Progreso 0% hasta que se corrija la configuración
      console.error('[DocumentosEmbebidos] Progreso establecido en 0% debido a configuración incorrecta');
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

    // Actualizar el estado de completitud
    this.todosDocumentosCompletos = this.documentosFaltantes === 0;

    // NUEVA FUNCIONALIDAD: Mostrar confirmación provisional solo si hay documentos faltantes
    this.mostrarConfirmacionProvisional = this.documentosFaltantes > 0;

    // Si ya no hay documentos faltantes, resetear la confirmación provisional
    if (this.todosDocumentosCompletos) {
      this.confirmacionInscripcionProvisional = false;
      this.mostrarConfirmacionProvisional = false;
    }

    // Emitir el estado de los documentos
    this.emitirEstadoDocumentos();
  }

  emitirEstadoDocumentos(): void {
    // NUEVA LÓGICA: Permitir continuar si todos los documentos están completos
    // O si hay documentos faltantes pero el usuario confirmó inscripción provisional
    const puedeContinuar = this.todosDocumentosCompletos ||
                          (this.documentosFaltantes > 0 && this.confirmacionInscripcionProvisional);

    console.log('[DocumentosEmbebidos] Emitiendo estado de documentos:', {
      todosCompletos: this.todosDocumentosCompletos,
      documentosFaltantes: this.documentosFaltantes,
      confirmacionProvisional: this.confirmacionInscripcionProvisional,
      puedeContinuar: puedeContinuar
    });

    this.documentosCompletados.emit(puedeContinuar);
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

  /**
   * NUEVA FUNCIONALIDAD: Maneja el cambio del checkbox de confirmación provisional
   */
  onConfirmacionProvisionalChange(confirmado: boolean): void {
    console.log('[DocumentosEmbebidos] Confirmación provisional cambiada:', confirmado);
    this.confirmacionInscripcionProvisional = confirmado;

    // Re-emitir el estado para actualizar el botón "Continuar"
    this.emitirEstadoDocumentos();
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

    console.log('[DocumentosEmbebidos] Abriendo diálogo de carga para tipo:', tipoDocumento);

    const dialogRef = this.dialog.open(DocumentoUploadDialogComponent, {
      title: 'Cargar Documento',
      icon: 'upload',
      size: 'medium',
      width: '600px',
      showCloseButton: true,
      showFooter: false,
      data: { tipoDocumentoId, tipoDocumentoNombre: tipoDocumento.nombre }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        console.log('[DocumentosEmbebidos] Documento subido correctamente, recargando lista');
        // El documento se subió correctamente, actualizar la lista
        this.cargarDocumentosUsuario(true); // Forzar recarga desde backend
      }
    });
  }

  abrirCargaMultiple(): void {
    const dialogRef = this.dialog.open(DocumentoMultipleUploadDialogComponent, {
      data: { tiposDocumento: this.documentosRequeridos }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        // Se subieron documentos correctamente, actualizar la lista
        this.cargarDocumentosUsuario(true); // Forzar recarga desde backend

        // Mostrar mensaje de éxito
        this.notificationService.success('Documentos cargados correctamente');
      }
    });
  }

  verDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.mostrarError('No se pudo encontrar el documento');
      return;
    }

    console.log('[DocumentosEmbebidos] Abriendo visor para documento:', documento);

    // Abrir visor de documentos mejorado
    this.dialog.open(DocumentoViewerComponent, {
      width: '95vw',
      height: '95vh',
      maxWidth: '1600px',
      maxHeight: '1000px',
      showCloseButton: true,
      showFooter: false,
      data: { documentoId: documento.id }
    });
  }

  eliminarDocumento(documento: DocumentoUsuario | undefined): void {
    if (!documento || !documento.id) {
      this.mostrarError('No se pudo encontrar el documento');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      this.documentosService.deleteDocumento(documento.id).subscribe({
        next: () => {
          this.notificationService.success('Documento eliminado correctamente');
          this.cargarDocumentosUsuario(true); // Forzar recarga desde backend
        },
        error: (error: unknown) => {
          console.error('Error al eliminar documento:', error);
          this.mostrarError('Error al eliminar el documento');
        }
      });
    }
  }

  mostrarError(mensaje: string): void {
    this.notificationService.error(mensaje);
  }

  /**
   * Obtiene la documentación base obligatoria mínima para todos los concursos
   * Esta función actúa como fallback cuando no hay documentos marcados como requeridos
   */
  private getDocumentacionBaseObligatoria(todosTipos: TipoDocumento[]): TipoDocumento[] {
    console.log('[DocumentosEmbebidos] Aplicando documentación base obligatoria');

    // Documentos base que SIEMPRE deben estar presentes en cualquier concurso
    const documentosBaseCodes = [
      'dni-frente',
      'dni-dorso',
      'dni', // DNI general como fallback
      'cuil',
      'antecedentes-penales'
    ];

    const documentosBaseNombres = [
      'dni (frente)',
      'dni (dorso)',
      'documento nacional de identidad',
      'constancia de cuil',
      'certificado de antecedentes penales',
      'antecedentes penales'
    ];

    // Buscar documentos base en la lista de todos los tipos
    const documentosBase: TipoDocumento[] = [];

    // Primero buscar por código
    for (const code of documentosBaseCodes) {
      const documento = todosTipos.find(tipo =>
        tipo.code?.toLowerCase() === code.toLowerCase()
      );
      if (documento && !documentosBase.some(d => d.id === documento.id)) {
        // Marcar como requerido temporalmente
        const docRequerido = { ...documento, requerido: true };
        documentosBase.push(docRequerido);
        console.log(`[DocumentosEmbebidos] Documento base agregado por código: ${documento.nombre}`);
      }
    }

    // Luego buscar por nombre si no encontramos suficientes
    if (documentosBase.length < 3) {
      for (const nombre of documentosBaseNombres) {
        const documento = todosTipos.find(tipo =>
          tipo.nombre?.toLowerCase().includes(nombre.toLowerCase())
        );
        if (documento && !documentosBase.some(d => d.id === documento.id)) {
          // Marcar como requerido temporalmente
          const docRequerido = { ...documento, requerido: true };
          documentosBase.push(docRequerido);
          console.log(`[DocumentosEmbebidos] Documento base agregado por nombre: ${documento.nombre}`);
        }
      }
    }

    // Verificar que tenemos al menos documentación mínima
    if (documentosBase.length === 0) {
      console.error('[DocumentosEmbebidos] No se pudo encontrar ningún documento base en el sistema');
      // Como último recurso, crear documentos base virtuales
      return this.crearDocumentosBaseVirtuales();
    }

    console.log(`[DocumentosEmbebidos] Documentación base establecida: ${documentosBase.length} documentos`);
    return documentosBase;
  }

  /**
   * Crea documentos base virtuales como último recurso
   * Solo se usa si no hay ningún documento en el sistema
   */
  private crearDocumentosBaseVirtuales(): TipoDocumento[] {
    console.warn('[DocumentosEmbebidos] Creando documentos base virtuales como último recurso');

    return [
      {
        id: 'virtual-dni-frente',
        code: 'dni-frente',
        nombre: 'DNI (Frente)',
        descripcion: 'Documento Nacional de Identidad - Lado frontal',
        requerido: true,
        orden: 1,
        activo: true
      },
      {
        id: 'virtual-dni-dorso',
        code: 'dni-dorso',
        nombre: 'DNI (Dorso)',
        descripcion: 'Documento Nacional de Identidad - Lado posterior',
        requerido: true,
        orden: 2,
        activo: true
      },
      {
        id: 'virtual-cuil',
        code: 'cuil',
        nombre: 'Constancia de CUIL',
        descripcion: 'Constancia de CUIL actualizada',
        requerido: true,
        orden: 3,
        activo: true
      }
    ];
  }

  /**
   * NUEVA FUNCIONALIDAD: Calcula y actualiza información de plazos perentorios
   */
  calculateDocumentationDeadline(): void {
    // Por ahora, simular el cálculo del plazo perentorio
    // En una implementación completa, esto vendría del backend

    // Simular que el plazo es 3 días hábiles después del cierre de inscripciones
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 3); // 3 días desde ahora como ejemplo

    this.documentationDeadline = deadline;
    this.calculateTimeUntilDeadline();
  }

  /**
   * NUEVA FUNCIONALIDAD: Calcula el tiempo restante hasta el deadline
   */
  calculateTimeUntilDeadline(): void {
    if (!this.documentationDeadline) {
      this.hoursUntilDeadline = -1;
      this.isDeadlineExpired = false;
      this.showDeadlineWarning = false;
      return;
    }

    const now = new Date();
    const deadline = this.documentationDeadline;
    const timeDiff = deadline.getTime() - now.getTime();

    if (timeDiff <= 0) {
      // Plazo vencido
      this.hoursUntilDeadline = 0;
      this.isDeadlineExpired = true;
      this.showDeadlineWarning = true;

      // Notificar solo una vez cuando vence
      if (this.lastNotificationHour !== 0) {
        this.notificationService.error(
          'El plazo para cargar documentación ha vencido. Su inscripción será congelada automáticamente.'
        );
        this.lastNotificationHour = 0;
      }
    } else {
      // Calcular horas restantes
      this.hoursUntilDeadline = Math.ceil(timeDiff / (1000 * 60 * 60));
      this.isDeadlineExpired = false;

      // Mostrar advertencia si quedan menos de 24 horas
      this.showDeadlineWarning = this.hoursUntilDeadline <= 24;

      // NUEVA FUNCIONALIDAD: Notificaciones automáticas
      this.checkAndSendDeadlineNotifications();
    }

    console.log(`[DocumentosEmbebidos] Plazo: ${this.hoursUntilDeadline}h restantes, Vencido: ${this.isDeadlineExpired}, Advertencia: ${this.showDeadlineWarning}`);
  }

  /**
   * NUEVA FUNCIONALIDAD: Obtiene el texto formateado del tiempo restante
   */
  getTimeRemainingText(): string {
    if (this.isDeadlineExpired) {
      return 'Plazo vencido';
    }

    if (this.hoursUntilDeadline <= 0) {
      return 'Sin plazo definido';
    }

    if (this.hoursUntilDeadline < 24) {
      return `${this.hoursUntilDeadline} horas restantes`;
    }

    const days = Math.floor(this.hoursUntilDeadline / 24);
    const hours = this.hoursUntilDeadline % 24;

    if (hours === 0) {
      return `${days} día${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    }

    return `${days} día${days > 1 ? 's' : ''} y ${hours} hora${hours > 1 ? 's' : ''} restantes`;
  }

  /**
   * NUEVA FUNCIONALIDAD: Verifica y envía notificaciones automáticas según el tiempo restante
   */
  private checkAndSendDeadlineNotifications(): void {
    // Solo notificar si hay documentos pendientes
    if (this.documentosFaltantes === 0) {
      return;
    }

    const hours = this.hoursUntilDeadline;

    // Notificaciones en momentos específicos (evitar duplicados)
    if (hours === 72 && this.lastNotificationHour !== 72) {
      // 3 días restantes
      this.notificationService.warning(
        'Recordatorio: Quedan 3 días para completar la documentación requerida para su inscripción.'
      );
      this.lastNotificationHour = 72;
    } else if (hours === 24 && this.lastNotificationHour !== 24) {
      // 1 día restante
      this.notificationService.warning(
        '¡Atención! Queda solo 1 día para completar la documentación requerida. Complete la carga de documentos para evitar que su inscripción sea congelada.'
      );
      this.lastNotificationHour = 24;
    } else if (hours === 6 && this.lastNotificationHour !== 6) {
      // 6 horas restantes
      this.notificationService.error(
        '¡URGENTE! Quedan solo 6 horas para completar la documentación. Su inscripción será congelada automáticamente si no completa la documentación a tiempo.'
      );
      this.lastNotificationHour = 6;
    } else if (hours === 1 && this.lastNotificationHour !== 1) {
      // 1 hora restante
      this.notificationService.error(
        '¡ÚLTIMA HORA! Queda solo 1 hora para completar la documentación. Complete inmediatamente para evitar la congelación de su inscripción.'
      );
      this.lastNotificationHour = 1;
    }
  }
}
