import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { finalize, take } from 'rxjs/operators';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoUsuario, TipoDocumento } from '@core/models/documento.model';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';

@Component({
  selector: 'app-inscripcion-stepper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  template: `
    <div class="wizard glassmorphism">
      <div class="wizard-header">
        <h2>Proceso de Inscripción</h2>
      </div>

      <!-- Progress Steps -->
      <div class="wizard-steps">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
          <div class="step-number">1</div>
          <div class="step-label">Términos</div>
        </div>
        <div class="step-line" [class.active]="currentStep > 1"></div>
        <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
          <div class="step-number">2</div>
          <div class="step-label">Selecc</div>
        </div>
        <div class="step-line" [class.active]="currentStep > 2"></div>
        <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
          <div class="step-number">3</div>
          <div class="step-label">Conf</div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="step-content">
        <!-- Step 1: Términos y Condiciones -->
        <div class="step-form" *ngIf="currentStep === 1" [formGroup]="termsForm">
          <div class="concurso-detalle">
            <h3>Detalles del Concurso</h3>

            <div class="info-grid">
              <div class="info-item">
                <span class="label">Cargo:</span>
                <span class="value">{{contest.position}}</span>
              </div>
              <div class="info-item">
                <span class="label">Categoría:</span>
                <span class="value">{{contest.category}}</span>
              </div>
              <div class="info-item">
                <span class="label">Clase:</span>
                <span class="value">{{contest.class}}</span>
              </div>
              <div class="info-item">
                <span class="label">Funciones:</span>
                <span class="value">{{contest.functions}}</span>
              </div>
              <div class="info-item">
                <span class="label">Estado:</span>
                <span class="value status-badge" [class.active]="contest.status === 'ACTIVE'">
                  {{contest.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}}
                </span>
              </div>
            </div>

            <div class="documentos-section">
              <div class="documento-item">
                <span class="label">Bases y Condiciones:</span>
                <a [href]="contest.termsUrl || contest.basesUrl || '#'" target="_blank" class="documento-link">
                  <mat-icon>description</mat-icon>
                  Ver documento
                </a>
              </div>
              <div class="documento-item">
                <span class="label">Descripción del Puesto:</span>
                <a [href]="contest.profileUrl || contest.descriptionUrl || '#'" target="_blank" class="documento-link">
                  <mat-icon>work_outline</mat-icon>
                  Ver documento
                </a>
              </div>
            </div>
          </div>

          <div class="terms-section">
            <h3>Confirmación de Lectura y Aceptación</h3>
            <p class="confirmation-question">
              ¿Ha leído atentamente las <strong>BASES CONCURSO DE ANTECEDENTES Y OPOSICIÓN</strong> y la <strong>DESCRIPCIÓN DEL PUESTO PSICOLABORAL</strong> y declara formalmente aceptar los términos y condiciones impuestos, así como los requisitos formales de cada uno de las etapas que se explican?
            </p>

            <div class="confirmation-options">
              <button type="button"
                      class="btn btn-primary"
                      [class.selected]="termsForm.get('acceptedTerms')?.value === true"
                      (click)="setTermsAcceptance(true)">
                Sí, continuar al siguiente paso
              </button>
              <button type="button"
                      class="btn btn-secondary"
                      [class.selected]="termsForm.get('acceptedTerms')?.value === false"
                      (click)="closeDialog()">
                No, cerrar inscripción
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Selección de Circunscripción -->
        <div class="step-form" *ngIf="currentStep === 2" [formGroup]="locationForm">
          <h3>Selección de Circunscripciones</h3>

          <div class="info-box warning">
            <mat-icon>warning</mat-icon>
            <strong>IMPORTANTE: ESTA SELECCIÓN NO PODRÁ SER MODIFICADA CON POSTERIORIDAD</strong>
          </div>

          <div class="info-section">
            <p class="question">En el caso de aprobar todas las instancias del presente Concurso de Antecedentes y Oposición y conformar el orden de mérito definitivo, ¿en qué Circunscripción/es Judiciales en las cuales está dispuesto a ser designado?</p>

            <div class="info-details">
              <div class="info-card">
                <h4>Requisitos y Compromisos</h4>
                <p>Es requisito excluyente previo a la designación fijar o expresar compromiso formal de fijar, bajo declaración jurada, domicilio real en un radio de 30 km del lugar donde cumplirá funciones.</p>
              </div>

              <div class="info-card">
                <h4>Proceso de Designación</h4>
                <ul>
                  <li>Esta información será utilizada para la confección del orden de mérito definitivo y la convocatoria a los participantes que correspondan.</li>
                  <li>El ofrecimiento de cargos se realizará de acuerdo con las vacantes, conforme el orden de mérito definitivo y la/s circunscripción/es optadas al momento de la inscripción.</li>
                </ul>
              </div>

              <div class="info-card warning-card">
                <h4>Advertencias Importantes</h4>
                <ul>
                  <li>En caso de desistimiento de cualquier ofrecimiento, el participante será colocado al final del orden de mérito.</li>
                  <li>En caso de rechazar dos veces el ofrecimiento de cualquier cargo para el que haya sido convocado a aceptar, conforme el orden de mérito, quedará eliminado del mismo.</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="circunscripciones-grid">
            <div class="checkbox-card" *ngFor="let circ of circunscripciones">
              <label class="checkbox-container">
                <input type="checkbox"
                       [checked]="isCircunscripcionSelected(circ.value)"
                       (change)="toggleCircunscripcion(circ.value)">
                <span class="checkmark"></span>
                <div class="checkbox-content">
                  <span class="checkbox-title">{{circ.label}}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: Confirmación de Datos -->
        <div class="step-form" *ngIf="currentStep === 3" [formGroup]="confirmationForm">
          <h3>Resumen y Declaración</h3>

          <div class="info-box warning">
            <mat-icon>warning</mat-icon>
            <strong>IMPORTANTE: Se tomará solo lo declarado y la documentación cargada hasta el momento de finalizar la inscripción para el Concurso al que aspira.</strong>
          </div>

          <div class="resumen-section">
            <h4>Resumen de Selecciones</h4>
            <div class="resumen-grid">
              <div class="resumen-item">
                <span class="label">Concurso:</span>
                <span class="value">{{contest.title}}</span>
              </div>
              <div class="resumen-item">
                <span class="label">Cargo:</span>
                <span class="value">{{contest.position}}</span>
              </div>
              <div class="resumen-item">
                <span class="label">Circunscripciones seleccionadas:</span>
                <ul class="value">
                  <li *ngFor="let circ of getSelectedCircunscripciones()">
                    {{circ.label}}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="documentacion-section">
            <h4>Estado de la Documentación</h4>
            <div class="documentacion-grid">
              <div class="documentacion-item" *ngFor="let doc of documentacionRequerida">
                <div class="doc-header">
                  <mat-icon [class.completed]="doc.completed" [class.pending]="!doc.completed">
                    {{doc.completed ? 'check_circle' : 'pending'}}
                  </mat-icon>
                  <span class="doc-title">{{doc.title}}</span>
                </div>
                <span class="doc-status" [class.completed]="doc.completed" [class.pending]="!doc.completed">
                  {{doc.completed ? 'Completado' : 'Pendiente'}}
                </span>
              </div>
            </div>

            <!-- Botón para ir a la sección de documentación -->
            <div class="documentacion-actions" *ngIf="tieneDocumentosPendientes()">
              <p class="warning-text">Tiene documentación pendiente de carga. Para completar su inscripción, debe cargar todos los documentos requeridos.</p>
              <button type="button" class="btn btn-primary" (click)="irADocumentacion()">
                <mat-icon>upload_file</mat-icon>
                Ir a cargar documentación
              </button>
            </div>
          </div>

          <div class="declaracion-section">
            <h4>Declaración Jurada</h4>
            <div class="declaracion-content">
              <p>Declaro bajo juramento que:</p>
              <ul>
                <li>Los datos personales cargados en la aplicación son verídicos y actuales.</li>
                <li>La documentación cargada es auténtica y corresponde a mi persona.</li>
                <li>El Currículum Vitae cargado refleja fielmente mi formación académica y experiencia laboral.</li>
                <li>Entiendo que la documentación pendiente de carga no será considerada para este concurso.</li>
              </ul>
            </div>

            <div class="form-field">
              <label class="checkbox-container">
                <input type="checkbox" formControlName="confirmedPersonalData">
                <span class="checkmark"></span>
                <span class="label-text">Acepto y firmo la declaración jurada</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step Actions -->
        <div class="step-actions">
          <button class="btn btn-secondary"
                  *ngIf="currentStep > 1"
                  (click)="previousStep()">
            Atrás
          </button>
          <button class="btn btn-primary"
                  *ngIf="currentStep === 2"
                  [disabled]="!canProceed()"
                  (click)="nextStep()">
            Siguiente
          </button>
          <button class="btn btn-primary"
                  *ngIf="currentStep === 3"
                  [disabled]="!canFinish() || loading"
                  (click)="finish()">
            <span *ngIf="!loading">Finalizar Inscripción</span>
            <div class="spinner" *ngIf="loading"></div>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wizard {
      height: 100%;
      width: 100%;
      display: grid;
      grid-template-rows: auto auto 1fr;
      gap: 24px;
      padding: 24px;
      background: rgba(30, 30, 30, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    .wizard-header {
      h2 {
        color: #ffffff;
        font-size: 24px;
        margin: 0;
        font-weight: 500;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .wizard-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;

      &.active {
        .step-number {
          background: linear-gradient(
            135deg,
            rgba(63, 81, 181, 0.9) 0%,
            rgba(63, 81, 181, 0.7) 100%
          );
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);
        }
        .step-label {
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      }

      &.completed {
        .step-number {
          background: linear-gradient(
            135deg,
            rgba(76, 175, 80, 0.9) 0%,
            rgba(76, 175, 80, 0.7) 100%
          );
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
      }
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
    }

    .step-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-weight: 500;
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;

      &.active {
        background: linear-gradient(
          to right,
          rgba(76, 175, 80, 0.7) 0%,
          rgba(76, 175, 80, 0.3) 100%
        );
      }
    }

    .step-content {
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(63, 81, 181, 0.5);
        border-radius: 4px;
        backdrop-filter: blur(5px);
      }
    }

    .step-form {
      h3 {
        color: #3f51b5;
        font-size: 18px;
        margin: 0 0 16px;
        font-weight: 500;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .step-description {
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 24px;
      }
    }

    .concurso-detalle {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;

      h3 {
        color: #3f51b5;
        font-size: 18px;
        margin: 0 0 24px;
        font-weight: 500;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .info-item {
      .label {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 4px;
      }

      .value {
        color: white;
        font-size: 16px;
        font-weight: 500;

        &.status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;

          &.active {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
        }
      }
    }

    .documentos-section {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
    }

    .documento-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
      }

      .documento-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #3f51b5;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 4px;
        background: rgba(63, 81, 181, 0.1);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(63, 81, 181, 0.2);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .terms-section {
      margin-top: 32px;
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;
    }

    .confirmation-question {
      color: rgba(255, 255, 255, 0.87);
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
      text-align: justify;

      strong {
        color: #3f51b5;
        font-weight: 500;
      }
    }

    .confirmation-options {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .btn {
        width: 100%;
        padding: 16px;
        font-size: 16px;
        border-radius: 8px;
        transition: all 0.3s ease;
        backdrop-filter: blur(5px);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;

        &.btn-primary {
          background: linear-gradient(
            135deg,
            rgba(63, 81, 181, 0.9) 0%,
            rgba(63, 81, 181, 0.7) 100%
          );
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);

          &:hover:not(.selected) {
            background: linear-gradient(
              135deg,
              rgba(63, 81, 181, 1) 0%,
              rgba(63, 81, 181, 0.8) 100%
            );
            transform: translateY(-1px);
          }

          &.selected {
            background: linear-gradient(
              135deg,
              rgba(76, 175, 80, 0.9) 0%,
              rgba(76, 175, 80, 0.7) 100%
            );
            pointer-events: none;
          }
        }

        &.btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);

          &:hover:not(.selected) {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }

          &.selected {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
            pointer-events: none;
          }
        }
      }
    }

    .form-field {
      margin: 24px 0;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;

      input[type="checkbox"] {
        display: none;
      }

      .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        position: relative;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);

        &:after {
          content: '';
          position: absolute;
          display: none;
          left: 5px;
          top: 1px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      input[type="checkbox"]:checked ~ .checkmark {
        background: linear-gradient(
          135deg,
          rgba(63, 81, 181, 0.9) 0%,
          rgba(63, 81, 181, 0.7) 100%
        );
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px rgba(63, 81, 181, 0.3);

        &:after {
          display: block;
        }
      }

      .label-text {
        color: rgba(255, 255, 255, 0.87);
      }
    }

    .custom-select {
      position: relative;
      width: 100%;

      .select-header {
        background: rgba(45, 45, 45, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(45, 45, 45, 0.7);
        }

        .select-placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .selected-items {
          color: white;
        }

        .select-arrow {
          color: rgba(255, 255, 255, 0.6);
          transition: transform 0.3s ease;

          &.open {
            transform: rotate(180deg);
          }
        }
      }

      .select-options {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(45, 45, 45, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin-top: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

        .option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          input[type="checkbox"] {
            display: none;
          }

          .option-text {
            color: white;
          }
        }
      }
    }

    .confirmation-data {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;

      .data-item {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          display: block;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .value {
          color: white;
        }

        ul {
          margin: 8px 0 0;
          padding-left: 20px;

          li {
            margin: 4px 0;
          }
        }
      }
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
    }

    .btn {
      min-width: 100px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
      }

      &.btn-primary {
        background: linear-gradient(
          135deg,
          rgba(63, 81, 181, 0.9) 0%,
          rgba(63, 81, 181, 0.7) 100%
        );
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);

        &:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(63, 81, 181, 1) 0%,
            rgba(63, 81, 181, 0.8) 100%
          );
          box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4);
        }

        &:disabled {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
        }
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .info-box {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      backdrop-filter: blur(5px);

      &.warning {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.2);

        mat-icon {
          color: #ffc107;
        }

        strong {
          color: #ffc107;
          font-weight: 500;
        }
      }
    }

    .info-section {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;

      .question {
        color: white;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
        font-weight: 500;
      }
    }

    .info-details {
      display: grid;
      gap: 16px;
    }

    .info-card {
      background: rgba(30, 30, 30, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;

      h4 {
        color: #3f51b5;
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 500;
      }

      p {
        color: rgba(255, 255, 255, 0.87);
        margin: 0;
        line-height: 1.5;
      }

      ul {
        color: rgba(255, 255, 255, 0.87);
        margin: 0;
        padding-left: 20px;

        li {
          margin: 8px 0;
          line-height: 1.5;
        }
      }

      &.warning-card {
        border-color: rgba(255, 193, 7, 0.2);

        h4 {
          color: #ffc107;
        }
      }
    }

    .circunscripciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .checkbox-card {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(45, 45, 45, 0.7);
        transform: translateY(-2px);
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        width: 100%;
        gap: 12px;

        input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          min-width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          position: relative;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);

          &:after {
            content: '';
            position: absolute;
            display: none;
            left: 8px;
            top: 3px;
            width: 6px;
            height: 12px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
        }

        input[type="checkbox"]:checked ~ .checkmark {
          background: linear-gradient(
            135deg,
            rgba(63, 81, 181, 0.9) 0%,
            rgba(63, 81, 181, 0.7) 100%
          );
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 8px rgba(63, 81, 181, 0.3);

          &:after {
            display: block;
          }
        }

        .checkbox-content {
          flex: 1;

          .checkbox-title {
            color: white;
            font-weight: 500;
            font-size: 15px;
          }
        }
      }
    }

    .resumen-section {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;

      h4 {
        color: #3f51b5;
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .resumen-grid {
      display: grid;
      gap: 16px;
    }

    .resumen-item {
      .label {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 4px;
      }

      .value {
        color: white;
        font-size: 15px;
        line-height: 1.5;

        ul {
          margin: 8px 0 0;
          padding-left: 20px;

          li {
            margin: 4px 0;
          }
        }
      }
    }

    .documentacion-section {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;

      h4 {
        color: #3f51b5;
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .documentacion-grid {
      display: grid;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 10px;
      margin-bottom: 16px;
    }

    .documentacion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(30, 30, 30, 0.5);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);

      .doc-header {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: rgba(255, 255, 255, 0.6);

          &.completed {
            color: #4caf50;
          }

          &.pending {
            color: #ffc107;
          }
        }

        .doc-title {
          color: white;
          font-size: 15px;
        }
      }

      .doc-status {
        font-size: 14px;
        font-weight: 500;

        &.completed {
          color: #4caf50;
        }

        &.pending {
          color: #ffc107;
        }
      }
    }

    /* Estilos para la sección de documentación */
    .documentacion-actions {
      margin-top: 20px;
      padding: 15px;
      background-color: rgba(255, 193, 7, 0.1);
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .documentacion-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .warning-text {
      color: rgba(255, 255, 255, 0.87);
      margin-bottom: 15px;
      font-weight: 500;
    }

    .declaracion-section {
      background: rgba(45, 45, 45, 0.5);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 24px;

      h4 {
        color: #3f51b5;
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .declaracion-content {
      color: rgba(255, 255, 255, 0.87);
      margin-bottom: 24px;

      p {
        margin: 0 0 12px;
        font-size: 15px;
        line-height: 1.5;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin: 8px 0;
          line-height: 1.5;
          font-size: 15px;
        }
      }
    }
  `]
})
export class InscripcionStepperComponent implements OnInit {
  @Input() contest!: Contest;
  @Input() initialStep = 1; // Paso inicial por defecto
  @Input() inscriptionId: string | null = null; // ID de la inscripción si ya existe
  @Input() formData: any = null; // Datos del formulario guardados previamente
  @Output() inscriptionCompleted = new EventEmitter<void>();

  currentStep = 1; // Se inicializa con 1, pero se actualiza en ngOnInit si hay un initialStep
  loading = false;
  isCircunscripcionesOpen = false;

  circunscripciones = [
    { value: 'Primera', label: 'Primera Circunscripción Judicial' },
    { value: 'Segunda', label: 'Segunda Circunscripción Judicial' },
    { value: 'Tercera', label: 'Tercera Circunscripción Judicial' },
    { value: 'Cuarta', label: 'Cuarta Circunscripción Judicial' }
  ];

  termsForm: FormGroup;
  locationForm: FormGroup;
  confirmationForm: FormGroup;

  // Lista de documentos requeridos para la inscripción
  documentacionRequerida: { title: string, completed: boolean, tipoDocumentoId: string }[] = [];

  // Tipos de documento disponibles en el sistema
  private tiposDocumento: TipoDocumento[] = [];

  ngOnInit(): void {
    // Establecer el paso inicial si se proporciona
    if (this.initialStep > 1 && this.initialStep <= 3) {
      console.log(`[InscripcionStepper] Iniciando en paso ${this.initialStep}`);
      this.currentStep = this.initialStep;
    }

    // Primero cargamos los tipos de documento disponibles
    this.cargarTiposDocumento();

    // Verificar si hay un concurso seleccionado
    if (!this.contest) {
      console.error('[InscripcionStepper] No hay concurso seleccionado');
      return;
    }

    // Inicializar el concursoId
    this.concursoId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

    console.log('[InscripcionStepper] Concurso seleccionado:', this.contest);

    // Si hay datos de formulario guardados, restaurarlos
    if (this.formData) {
      console.log('[InscripcionStepper] Restaurando datos del formulario desde input:', this.formData);
      this.restoreFormData();
    } else if (this.inscriptionId) {
      // Intentar recuperar el estado desde el servicio de inscripción
      const savedState = this.inscriptionService.getFormState(this.inscriptionId);
      if (savedState) {
        console.log('[InscripcionStepper] Restaurando datos del formulario desde servicio:', savedState);
        this.formData = savedState;
        this.restoreFormData();

        // Si el estado guardado tiene un paso actual, actualizarlo
        if (savedState.currentStep) {
          this.currentStep = savedState.currentStep;
          console.log(`[InscripcionStepper] Restaurando paso: ${this.currentStep}`);
        }
      }
    }
  }

  /**
   * Restaura los datos del formulario guardados previamente
   */
  private restoreFormData(): void {
    if (!this.formData) return;

    // Restaurar los valores de los formularios
    if (this.formData.termsAccepted !== undefined) {
      this.termsForm.patchValue({ acceptedTerms: this.formData.termsAccepted });
    }

    if (this.formData.selectedCircunscripciones) {
      this.locationForm.patchValue({ selectedCircunscripciones: this.formData.selectedCircunscripciones });
    }

    if (this.formData.confirmedPersonalData !== undefined) {
      this.confirmationForm.patchValue({ confirmedPersonalData: this.formData.confirmedPersonalData });
    }

    console.log('[InscripcionStepper] Datos del formulario restaurados');
  }

  /**
   * Carga los tipos de documento disponibles en el sistema
   */
  private cargarTiposDocumento(): void {
    // Inicializar con valores por defecto primero para asegurar que siempre haya algo visible
    this.inicializarDocumentacionPorDefecto();

    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos: TipoDocumento[]) => {
        console.log('[InscripcionStepper] Tipos de documento cargados:', tipos);

        if (tipos && tipos.length > 0) {
          this.tiposDocumento = tipos;

          // Inicializar la documentación requerida basada en los tipos disponibles
          const documentosDelBackend = this.tiposDocumento
            .filter(tipo => tipo.requerido) // Solo incluir los documentos requeridos
            .map(tipo => ({
              title: tipo.nombre,
              completed: false,
              tipoDocumentoId: tipo.id
            }));

          // Solo actualizamos si realmente obtuvimos documentos del backend
          if (documentosDelBackend.length > 0) {
            // Conservar los documentos que ya teníamos y agregar los nuevos
            // Esto garantiza que siempre tengamos al menos los documentos básicos
            const documentosActuales = [...this.documentacionRequerida];

            // Agregar los documentos del backend que no estén ya en la lista
            documentosDelBackend.forEach(docBackend => {
              const existeDocumento = documentosActuales.some(doc =>
                doc.tipoDocumentoId === docBackend.tipoDocumentoId ||
                doc.title.toLowerCase() === docBackend.title.toLowerCase()
              );

              if (!existeDocumento) {
                documentosActuales.push(docBackend);
              }
            });

            this.documentacionRequerida = documentosActuales;
            console.log('[InscripcionStepper] Documentación requerida actualizada con datos del backend:', this.documentacionRequerida);
          }
        } else {
          console.warn('[InscripcionStepper] No se recibieron tipos de documento del backend, usando valores por defecto');
        }

        // Asegurarnos de que la documentación requerida tenga todos los documentos necesarios
        this.verificarDocumentacionCompleta();

        // Ahora cargamos los documentos del usuario para actualizar el estado
        this.cargarDocumentosUsuario();
      },
      error: (error: any) => {
        console.error('[InscripcionStepper] Error al cargar tipos de documento:', error);
        // Ya inicializamos con valores por defecto, asegurarnos de que estén todos los documentos necesarios
        this.verificarDocumentacionCompleta();
        // Intentamos cargar los documentos del usuario
        this.cargarDocumentosUsuario();
      }
    });
  }

  /**
   * Inicializa la documentación requerida con valores por defecto
   * en caso de que no se puedan cargar los tipos de documento del backend
   * Estos valores deben coincidir con los de la pestaña "Documentación" del perfil
   */
  private inicializarDocumentacionPorDefecto(): void {
    // Inicializar con los documentos que se muestran en la interfaz
    // Evitamos documentos redundantes como "Documento Nacional de Identidad"
    this.documentacionRequerida = [
      // Documentos principales
      { title: 'Título Universitario', completed: false, tipoDocumentoId: 'titulo' },
      { title: 'Certificado de Buena Conducta', completed: false, tipoDocumentoId: 'certificado-conducta' },
      { title: 'DNI (Frente)', completed: false, tipoDocumentoId: 'dni-frente' },
      { title: 'DNI (Dorso)', completed: false, tipoDocumentoId: 'dni-dorso' },
      { title: 'Constancia de CUIL', completed: false, tipoDocumentoId: 'cuil' },
      { title: 'Certificado de Antecedentes Penales', completed: false, tipoDocumentoId: 'antecedentes-penales' },
      { title: 'Certificado de Ejercicio Profesional', completed: false, tipoDocumentoId: 'certificado-profesional' },
      { title: 'Certificado de Sanciones Disciplinarias', completed: false, tipoDocumentoId: 'certificado-sanciones' },
      { title: 'Certificado Ley Micaela', completed: false, tipoDocumentoId: 'certificado-ley-micaela' }
    ];
  }

  /**
   * Verifica si un documento está subido por el usuario
   * @param tipoDocumentoId ID o código del tipo de documento a verificar
   * @returns true si el documento está subido, false en caso contrario
   */
  private isDocumentoSubido(tipoDocumentoId: string, documentos: DocumentoUsuario[]): boolean {
    // Verificar si hay algún documento con el ID exacto
    const documentoExacto = documentos.some(doc => doc.tipoDocumentoId === tipoDocumentoId);

    if (documentoExacto) {
      console.log(`[InscripcionStepper] Documento con ID exacto encontrado: ${tipoDocumentoId}`);
      return true;
    }

    // Verificar si hay algún documento con el código exacto
    const documentoPorCodigo = documentos.some(doc =>
      doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId
    );

    if (documentoPorCodigo) {
      console.log(`[InscripcionStepper] Documento con código exacto encontrado: ${tipoDocumentoId}`);
      return true;
    }

    // Casos especiales para DNI (frente y dorso)
    if (tipoDocumentoId === 'dni-frente' || tipoDocumentoId === 'dni-dorso') {
      // Buscar documentos que coincidan exactamente con el tipo solicitado (frente o dorso)
      const dniEspecifico = documentos.some(doc => {
        // Verificar por código exacto
        if (doc.tipoDocumento && doc.tipoDocumento.code === tipoDocumentoId) {
          console.log(`[InscripcionStepper] Documento DNI específico encontrado por código: ${tipoDocumentoId}`);
          return true;
        }

        // Verificar por nombre que contenga 'frente' o 'dorso' según corresponda
        if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
          const nombre = doc.tipoDocumento.nombre.toLowerCase();
          const esFrente = tipoDocumentoId === 'dni-frente' &&
                          (nombre.includes('frente') || nombre.includes('frontal') || nombre.includes('anverso'));
          const esDorso = tipoDocumentoId === 'dni-dorso' &&
                         (nombre.includes('dorso') || nombre.includes('reverso') || nombre.includes('posterior'));

          if (esFrente || esDorso) {
            console.log(`[InscripcionStepper] Documento DNI específico encontrado por nombre: ${nombre} para ${tipoDocumentoId}`);
            return true;
          }
        }

        return false;
      });

      if (dniEspecifico) {
        return true;
      }

      // Si hay un documento genérico de DNI, verificar si tiene información en el nombre o comentarios
      // que indique si es frente o dorso
      const dniGenerico = documentos.find(doc =>
        doc.tipoDocumentoId === 'dni' ||
        (doc.tipoDocumento && doc.tipoDocumento.code === 'dni') ||
        (doc.tipoDocumento && doc.tipoDocumento.nombre &&
         (doc.tipoDocumento.nombre.toLowerCase().includes('dni') ||
          doc.tipoDocumento.nombre.toLowerCase().includes('documento nacional')))
      );

      if (dniGenerico) {
        // Verificar si el nombre o comentarios contienen información sobre frente o dorso
        const nombreDoc = dniGenerico.tipoDocumento?.nombre?.toLowerCase() || '';
        const comentarios = dniGenerico.comentarios?.toLowerCase() || '';
        const nombreArchivo = dniGenerico.nombreArchivo?.toLowerCase() || '';

        if (tipoDocumentoId === 'dni-frente') {
          const esFrente = nombreDoc.includes('frente') || nombreDoc.includes('frontal') || nombreDoc.includes('anverso') ||
                          comentarios.includes('frente') || comentarios.includes('frontal') || comentarios.includes('anverso') ||
                          nombreArchivo.includes('frente') || nombreArchivo.includes('frontal') || nombreArchivo.includes('anverso');

          if (esFrente) {
            console.log(`[InscripcionStepper] Documento DNI genérico identificado como frente por metadatos`);
            return true;
          }
        } else if (tipoDocumentoId === 'dni-dorso') {
          const esDorso = nombreDoc.includes('dorso') || nombreDoc.includes('reverso') || nombreDoc.includes('posterior') ||
                         comentarios.includes('dorso') || comentarios.includes('reverso') || comentarios.includes('posterior') ||
                         nombreArchivo.includes('dorso') || nombreArchivo.includes('reverso') || nombreArchivo.includes('posterior');

          if (esDorso) {
            console.log(`[InscripcionStepper] Documento DNI genérico identificado como dorso por metadatos`);
            return true;
          }
        }
      }
    }

    // Buscar por coincidencia parcial en el nombre
    const docRequerido = this.documentacionRequerida.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    if (docRequerido) {
      const nombreTipoDocumento = docRequerido.title.toLowerCase();

      // Verificar si hay algún documento cuyo tipo coincida con el nombre del tipo requerido
      for (const doc of documentos) {
        // Obtener el nombre del tipo de documento
        let nombreDocTipo = '';

        // Si el documento tiene un objeto tipoDocumento, usamos su nombre
        if (doc.tipoDocumento && doc.tipoDocumento.nombre) {
          nombreDocTipo = doc.tipoDocumento.nombre.toLowerCase();
        }

        // Si no pudimos obtener el nombre, continuamos con el siguiente documento
        if (!nombreDocTipo) {
          continue;
        }

        // Verificar si hay coincidencia entre los nombres
        const coincidenciaNombre = nombreDocTipo.includes(nombreTipoDocumento) ||
                                  nombreTipoDocumento.includes(nombreDocTipo);

        if (coincidenciaNombre) {
          console.log(`[InscripcionStepper] Documento encontrado por nombre: ${nombreTipoDocumento} coincide con ${nombreDocTipo}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Carga los documentos del usuario y actualiza el estado de la documentación requerida
   */
  private cargarDocumentosUsuario(): void {
    console.log('[InscripcionStepper] Intentando cargar documentos del usuario...');
    console.log('[InscripcionStepper] Documentación requerida actual:', this.documentacionRequerida);

    // Asegurarnos de que la documentación requerida tenga todos los documentos necesarios
    // Esta es una medida de seguridad para garantizar que siempre se muestren todos los documentos
    this.verificarDocumentacionCompleta();

    this.documentosService.getDocumentosUsuario().subscribe({
      next: (documentos: DocumentoUsuario[]) => {
        console.log('[InscripcionStepper] Documentos del usuario cargados:', documentos);

        if (documentos && documentos.length > 0) {
          // Actualizar el estado de la documentación requerida usando la nueva lógica
          this.documentacionRequerida.forEach(doc => {
            const estadoAnterior = doc.completed;
            doc.completed = this.isDocumentoSubido(doc.tipoDocumentoId, documentos);

            if (estadoAnterior !== doc.completed) {
              console.log(`[InscripcionStepper] Documento '${doc.title}' actualizado: ${estadoAnterior ? 'completado' : 'pendiente'} -> ${doc.completed ? 'completado' : 'pendiente'}`);
            }
          });

          // Mostrar resumen de documentos completados vs. requeridos
          const totalCompletados = this.documentacionRequerida.filter(doc => doc.completed).length;
          const totalRequeridos = this.documentacionRequerida.length;
          console.log(`[InscripcionStepper] Resumen de documentos: ${totalCompletados}/${totalRequeridos} completados`);
          console.log('[InscripcionStepper] Documentación requerida final:', JSON.stringify(this.documentacionRequerida));
        } else {
          console.warn('[InscripcionStepper] No se encontraron documentos para el usuario actual');
        }
      },
      error: (error: any) => {
        console.error('[InscripcionStepper] Error al cargar documentos del usuario:', error);
        // No mostrar error al usuario, simplemente usar los valores por defecto
        this.snackBar.open('No se pudieron cargar sus documentos. Por favor, intente nuevamente más tarde.', 'Cerrar', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
    });
  }

  /**
   * Verifica que la lista de documentación requerida contenga todos los documentos necesarios
   * Si faltan documentos, los agrega a la lista
   * También elimina documentos duplicados o redundantes
   */
  private verificarDocumentacionCompleta(): void {
    console.log('[InscripcionStepper] Verificando que la documentación requerida esté completa...');

    // Lista de documentos que deben estar presentes
    const documentosNecesarios = [
      // Nota: No incluimos 'Documento Nacional de Identidad' porque es redundante con DNI (Frente) y DNI (Dorso)
      { title: 'Título Universitario', completed: false, tipoDocumentoId: 'titulo-universitario' },
      { title: 'Certificado de Buena Conducta', completed: false, tipoDocumentoId: 'certificado-buena-conducta' },
      { title: 'Constancia de CUIL', completed: false, tipoDocumentoId: 'cuil' },
      { title: 'Certificado de Antecedentes Penales', completed: false, tipoDocumentoId: 'antecedentes-penales' },
      { title: 'Certificado de Ejercicio Profesional', completed: false, tipoDocumentoId: 'certificado-profesional' },
      { title: 'Certificado de Sanciones Disciplinarias', completed: false, tipoDocumentoId: 'certificado-sanciones' },
      { title: 'DNI (Frente)', completed: false, tipoDocumentoId: 'dni-frente' },
      { title: 'DNI (Dorso)', completed: false, tipoDocumentoId: 'dni-dorso' },
      { title: 'Certificado Ley Micaela', completed: false, tipoDocumentoId: 'certificado-ley-micaela' }
    ];

    // Verificar si cada documento necesario está en la lista
    documentosNecesarios.forEach(docNecesario => {
      // Buscar si ya existe un documento con el mismo ID o título similar
      const existeDocumento = this.documentacionRequerida.some(doc =>
        doc.tipoDocumentoId === docNecesario.tipoDocumentoId ||
        doc.title.toLowerCase() === docNecesario.title.toLowerCase()
      );

      // Si no existe, agregarlo a la lista
      if (!existeDocumento) {
        console.log(`[InscripcionStepper] Agregando documento faltante: ${docNecesario.title}`);
        this.documentacionRequerida.push(docNecesario);
      }
    });

    // Eliminar documentos duplicados o redundantes
    const documentosSinDuplicados: { title: string, completed: boolean, tipoDocumentoId: string }[] = [];
    const idsAgregados: string[] = [];
    const titulosExactos: string[] = [];

    // Lista de documentos redundantes que deben ser excluidos
    const documentosRedundantes = [
      'Documento Nacional de Identidad' // Redundante con DNI (Frente) y DNI (Dorso)
    ];

    // Filtrar la lista de documentación requerida
    this.documentacionRequerida.forEach(doc => {
      // Verificar si el documento es redundante
      const esRedundante = documentosRedundantes.some(titulo =>
        doc.title.toLowerCase() === titulo.toLowerCase()
      );

      // Verificar si ya agregamos un documento con el mismo ID o título exacto
      const idYaAgregado = idsAgregados.includes(doc.tipoDocumentoId);
      const tituloYaAgregado = titulosExactos.includes(doc.title.toLowerCase());

      // Si no es redundante y no está duplicado, lo agregamos a la lista
      if (!esRedundante && !idYaAgregado && !tituloYaAgregado) {
        documentosSinDuplicados.push(doc);
        idsAgregados.push(doc.tipoDocumentoId);
        titulosExactos.push(doc.title.toLowerCase());
      } else {
        console.log(`[InscripcionStepper] Documento excluido por redundante o duplicado: ${doc.title}`);
      }
    });

    // Actualizamos la lista de documentación requerida
    this.documentacionRequerida = documentosSinDuplicados;

    console.log('[InscripcionStepper] Documentación requerida después de verificar:', this.documentacionRequerida);
  }

  /**
   * Verifica si el usuario tiene documentos pendientes de carga
   * @returns true si hay al menos un documento pendiente, false en caso contrario
   */
  tieneDocumentosPendientes(): boolean {
    return this.documentacionRequerida.some(doc => !doc.completed);
  }

  /**
   * Navega a la sección de documentación en el perfil del usuario
   * para que pueda cargar los documentos faltantes
   */
  irADocumentacion(): void {
    console.log('[InscripcionStepper] Navegando a la sección de documentación...');

    // Guardar el estado de la inscripción actual para poder retomar después
    if (this.inscriptionId) {
      // Obtener los valores actuales de los formularios
      const formData = {
        termsAccepted: this.termsForm.get('acceptedTerms')?.value,
        selectedCircunscripciones: this.locationForm.get('selectedCircunscripciones')?.value || [],
        confirmedPersonalData: this.confirmationForm.get('confirmedPersonalData')?.value,
        currentStep: this.currentStep,
        contestId: this.concursoId,
        contestTitle: this.contest.title || this.contest.position
      };

      // 1. Guardar en el servicio de inscripción (memoria)
      this.inscriptionService.saveFormState(this.inscriptionId, formData);
      console.log('[InscripcionStepper] Estado guardado en el servicio de inscripción:', formData);

      // 2. Guardar en el servicio de estado (localStorage)
      this.inscriptionStateService.saveInscriptionState(
        this.inscriptionId,
        this.concursoId,
        this.currentStep as unknown as InscriptionStep,
        formData,
        this.contest.title || this.contest.position
      );

      // 3. Marcar que venimos de la inscripción
      this.inscriptionStateService.setRedirectFromInscription(this.inscriptionId);

      console.log('[InscripcionStepper] Estado de inscripción guardado para retomar después');
    }

    // Cerrar el diálogo actual
    this.dialogRef.close();

    // Navegar a la sección de documentación en el perfil
    // La ruta correcta es '/dashboard/perfil' según la configuración de rutas
    // El parámetro 'activeTab' se usará para activar directamente la pestaña de documentación
    console.log('[InscripcionStepper] Navegando a la sección de documentación...');
    this.router.navigate(['/dashboard/perfil'], { queryParams: { activeTab: 'Documentación', fromInscription: 'true' } })
      .then(success => {
        console.log('[InscripcionStepper] Navegación exitosa:', success);
      })
      .catch(error => {
        console.error('[InscripcionStepper] Error en la navegación:', error);
        // Intentar con una ruta alternativa si la primera falla
        this.router.navigate(['/dashboard']);
      });

    // Mostrar mensaje al usuario
    this.snackBar.open('Navegando a la sección de documentación. Podrá retomar su inscripción después de cargar los documentos.', 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Abre la sección de documentación en una nueva pestaña del navegador
   * Alternativa por si la navegación interna falla
   */
  abrirDocumentacionEnNuevaPestana(): void {
    // Cerrar el diálogo actual
    this.dialogRef.close();

    // Abrir en nueva pestaña
    const url = window.location.origin + '/dashboard/perfil?tab=documentacion';
    console.log('[InscripcionStepper] Abriendo documentación en nueva pestaña:', url);

    // Usar window.open para abrir en nueva pestaña
    const nuevaPestana = window.open(url, '_blank');

    // Verificar si se pudo abrir la pestaña (podría estar bloqueada por el navegador)
    if (!nuevaPestana || nuevaPestana.closed || typeof nuevaPestana.closed === 'undefined') {
      console.warn('[InscripcionStepper] No se pudo abrir la nueva pestaña, posiblemente bloqueada por el navegador');
      this.snackBar.open('No se pudo abrir la nueva pestaña. Por favor, permita ventanas emergentes para este sitio.', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } else {
      this.snackBar.open('Abriendo sección de documentación en nueva pestaña...', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<any>,
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private snackBar: MatSnackBar,
    private documentosService: DocumentosService,
    private router: Router
  ) {
    this.termsForm = this.fb.group({
      acceptedTerms: [null, Validators.required]
    });

    this.locationForm = this.fb.group({
      selectedCircunscripciones: [[], [Validators.required, Validators.minLength(1)]]
    });

    this.confirmationForm = this.fb.group({
      confirmedPersonalData: [false, Validators.requiredTrue]
    });
  }

  setTermsAcceptance(accepted: boolean): void {
    this.termsForm.patchValue({ acceptedTerms: accepted });
    if (accepted) {
      this.nextStep();
    }
  }

  closeDialog(): void {
    this.termsForm.patchValue({ acceptedTerms: false });
    this.dialogRef.close();
  }

  toggleCircunscripcionesDropdown(): void {
    this.isCircunscripcionesOpen = !this.isCircunscripcionesOpen;
  }

  toggleCircunscripcion(value: string): void {
    const current = this.locationForm.get('selectedCircunscripciones')?.value || [];
    const index = current.indexOf(value);

    if (index === -1) {
      current.push(value);
    } else {
      current.splice(index, 1);
    }

    this.locationForm.patchValue({ selectedCircunscripciones: current });
  }

  isCircunscripcionSelected(value: string): boolean {
    const selected = this.locationForm.get('selectedCircunscripciones')?.value || [];
    return selected.includes(value);
  }

  hasSelectedCircunscripciones(): boolean {
    const selected = this.locationForm.get('selectedCircunscripciones')?.value || [];
    return selected.length > 0;
  }

  getSelectedCircunscripcionesText(): string {
    const selected = this.locationForm.get('selectedCircunscripciones')?.value || [];
    return `${selected.length} seleccionada${selected.length !== 1 ? 's' : ''}`;
  }

  getSelectedCircunscripciones(): any[] {
    const selected = this.locationForm.get('selectedCircunscripciones')?.value || [];
    return this.circunscripciones.filter(c => selected.includes(c.value));
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.termsForm.valid;
      case 2:
        return this.locationForm.valid;
      default:
        return false;
    }
  }

  canFinish(): boolean {
    return this.confirmationForm.valid;
  }

  nextStep(): void {
    if (this.canProceed()) {
      // Guardar el estado actual antes de avanzar
      this.saveCurrentState();

      this.currentStep++;
      setTimeout(() => {
        const stepContent = document.querySelector('.step-content');
        if (stepContent) {
          stepContent.scrollTop = 0;
        }
      });
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      // Guardar el estado actual antes de retroceder
      this.saveCurrentState();

      this.currentStep--;
      setTimeout(() => {
        const stepContent = document.querySelector('.step-content');
        if (stepContent) {
          stepContent.scrollTop = 0;
        }
      });
    }
  }

  /**
   * Guarda el estado actual del formulario
   */
  saveCurrentState(): void {
    if (!this.inscriptionId) return;

    // Obtener los valores actuales de los formularios
    const formData = {
      termsAccepted: this.termsForm.get('acceptedTerms')?.value,
      selectedCircunscripciones: this.locationForm.get('selectedCircunscripciones')?.value || [],
      confirmedPersonalData: this.confirmationForm.get('confirmedPersonalData')?.value,
      currentStep: this.currentStep,
      contestId: this.concursoId,
      contestTitle: this.contest.title || this.contest.position
    };

    // Guardar el estado en ambos servicios para mayor seguridad
    // 1. En el servicio de estado (localStorage)
    this.inscriptionStateService.saveInscriptionState(
      this.inscriptionId,
      this.concursoId,
      this.currentStep as unknown as InscriptionStep,
      formData,
      this.contest.title || this.contest.position
    );

    // 2. En el servicio de inscripción (memoria)
    this.inscriptionService.saveFormState(this.inscriptionId, formData);

    console.log('[InscripcionStepper] Estado guardado:', {
      inscriptionId: this.inscriptionId,
      currentStep: this.currentStep,
      formData
    });
  }

  // Variable para evitar múltiples envíos simultáneos
  private isSubmitting = false;

  // Variables para guardar el ID del concurso
  concursoId: number = 0;

  finish(): void {
    // Evitar múltiples envíos simultáneos
    if (this.isSubmitting) {
      console.log('[InscripcionStepper] Ya hay un envío en progreso, ignorando solicitud');
      return;
    }

    if (this.canFinish()) {
      this.isSubmitting = true;
      this.loading = true;

      // Primero obtenemos todas las inscripciones del usuario
      this.inscriptionService.inscriptions.pipe(
        // Solo necesitamos una emisión
        take(1),
        // Asegurarnos de que siempre se complete el loading y el flag de envío
        finalize(() => {
          this.loading = false;
          this.isSubmitting = false;
        })
      ).subscribe({
        next: (inscriptions) => {
          // Buscamos la inscripción activa (no cancelada) correspondiente a este concurso
          const inscription = inscriptions.find(ins =>
            ins.contestId === this.contest.id &&
            ins.state !== InscripcionState.CANCELLED
          );

          if (inscription) {
            // Guardar el ID de la inscripción y el concurso para usarlos en otros métodos
            this.inscriptionId = inscription.id;
            this.concursoId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

            console.log('[InscripcionStepper] Actualizando estado de inscripción:', inscription.id);

            // Actualizamos el estado de la inscripción a CONFIRMADA
            this.inscriptionService.updateInscriptionStatus(inscription.id, {
              state: InscripcionState.CONFIRMADA
            }).subscribe({
              next: () => {
                console.log('[InscripcionStepper] Estado de inscripción actualizado a CONFIRMADA');
                // Actualizamos también el paso de la inscripción
                this.updateInscriptionStep(inscription.id);
                // Mostrar mensaje de éxito
                this.snackBar.open('Inscripción completada con éxito', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                // Emitir evento para cerrar el diálogo
                this.inscriptionCompleted.emit();
              },
              error: (error) => {
                console.error('[InscripcionStepper] Error al actualizar estado de inscripción:', error);
                // Aún si hay un error, consideramos la inscripción como completada
                // ya que el estado local ya se actualizó en el servicio
                this.snackBar.open('La inscripción se ha registrado, pero hubo un problema al actualizar su estado', 'Cerrar', {
                  duration: 5000
                });
                this.inscriptionCompleted.emit(); // Emitimos el evento de todas formas para cerrar el diálogo
              }
            });
          } else {
            console.error('[InscripcionStepper] No se encontró una inscripción activa para el concurso:', this.contest.id);
            // Intentar crear una nueva inscripción como fallback
            this.snackBar.open('No se encontró una inscripción activa. Intente nuevamente.', 'Cerrar', { duration: 3000 });
            this.inscriptionCompleted.emit();
          }
        },
        error: (error) => {
          console.error('[InscripcionStepper] Error al obtener inscripciones:', error);
          this.snackBar.open('Error al obtener las inscripciones. Intente nuevamente.', 'Cerrar', { duration: 3000 });
          this.inscriptionCompleted.emit();
        }
      });
    }
  }

  private updateInscriptionStep(inscriptionId: string): void {
    // Obtenemos los valores de los formularios
    const termsAccepted = this.termsForm.get('acceptedTerms')?.value;
    const selectedCircunscripciones = this.locationForm.get('selectedCircunscripciones')?.value || [];
    const confirmedPersonalData = this.confirmationForm.get('confirmedPersonalData')?.value;

    // Creamos la solicitud para actualizar el paso
    const request = {
      step: InscriptionStep.COMPLETED,
      selectedCircunscripciones: selectedCircunscripciones,
      acceptedTerms: termsAccepted,
      confirmedPersonalData: confirmedPersonalData
    };

    console.log('[InscripcionStepper] Actualizando paso de inscripción a COMPLETED:', inscriptionId);

    this.inscriptionService.updateInscriptionStep(inscriptionId, request)
      .subscribe({
        next: () => {
          console.log('[InscripcionStepper] Paso de inscripción actualizado a COMPLETED');
          // No emitimos el evento aquí, ya que ya se emitió en el método finish()
        },
        error: (error) => {
          console.error('[InscripcionStepper] Error al actualizar paso de inscripción:', error);
          this.inscriptionCompleted.emit(); // Emitimos el evento de todas formas para cerrar el diálogo
        }
      });
  }
}