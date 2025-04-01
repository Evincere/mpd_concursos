import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';

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
export class InscripcionStepperComponent {
  @Input() contest!: Contest;
  @Output() inscriptionCompleted = new EventEmitter<void>();

  currentStep = 1;
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

  documentacionRequerida = [
    { title: 'Documento de Identidad', completed: true },
    { title: 'Título Profesional', completed: true },
    { title: 'Certificado de Antecedentes', completed: false },
    { title: 'Currículum Vitae', completed: true },
    { title: 'Certificado de Inscripción en el Registro Nacional de Profesionales', completed: false }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<any>
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
      this.currentStep--;
      setTimeout(() => {
        const stepContent = document.querySelector('.step-content');
        if (stepContent) {
          stepContent.scrollTop = 0;
        }
      });
    }
  }

  finish(): void {
    if (this.canFinish()) {
      this.loading = true;
      this.inscriptionCompleted.emit();
    }
  }
} 