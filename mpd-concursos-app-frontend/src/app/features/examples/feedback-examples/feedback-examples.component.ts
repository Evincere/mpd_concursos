import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

// Importar módulo de feedback
import { FeedbackModule } from '../../../shared/modules/feedback.module';

// Importar servicios
import { HelpService } from '../../../shared/services/help.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { FeedbackService } from '../../../shared/services/feedback.service';


// Importar directivas
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { AnimateDirective } from '../../../shared/directives/animate.directive';

// Importar componentes
import { EnhancedTooltipComponent } from '../../../shared/components/enhanced-tooltip/enhanced-tooltip.component';
import { ContextualHelpComponent } from '../../../shared/components/contextual-help/contextual-help.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { ProgressIndicatorComponent } from '../../../shared/components/progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-feedback-examples',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatSliderModule,
    FormsModule,
    FeedbackModule,
    TooltipDirective,
    AnimateDirective,
    EnhancedTooltipComponent,
    ContextualHelpComponent,
    LoadingIndicatorComponent,
    ProgressIndicatorComponent
  ],
  template: `
    <div class="examples-container">
      <h1 [appAnimate]="'fadeIn'" [animationDuration]="500">Ejemplos de Feedback Visual</h1>

      <mat-card [appAnimate]="'slideInBottom'" [animationDuration]="500" [animationDelay]="100">
        <mat-card-header>
          <mat-card-title>Componentes de Feedback Visual</mat-card-title>
          <mat-card-subtitle>Ejemplos de uso de los componentes y servicios de feedback visual</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <!-- Tooltips -->
            <mat-tab label="Tooltips">
              <div class="tab-content">
                <h2>Tooltips Mejorados</h2>
                <p>Pasa el cursor sobre los elementos para ver los tooltips:</p>

                <div class="examples-grid">
                  <button mat-raised-button color="primary"
                          appTooltip="Este es un tooltip básico"
                          tooltipPosition="top">
                    Tooltip Básico
                  </button>

                  <button mat-raised-button color="accent"
                          appTooltip="Tooltip con título e icono"
                          tooltipTitle="Información Importante"
                          tooltipIcon="info-circle"
                          tooltipPosition="right"
                          tooltipTheme="primary">
                    Tooltip con Título
                  </button>

                  <button mat-raised-button color="warn"
                          appTooltip="Este tooltip se muestra al hacer clic en el botón"
                          [tooltipShowOnClick]="true"
                          tooltipPosition="bottom"
                          tooltipTheme="warn">
                    Tooltip al Hacer Clic
                  </button>

                  <div>
                    <app-enhanced-tooltip
                      title="Tooltip Personalizado"
                      content="Este es un tooltip personalizado con más opciones de configuración"
                      position="left"
                      theme="accent"
                      icon="star">
                      <span class="custom-trigger">Tooltip Personalizado</span>
                    </app-enhanced-tooltip>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Ayudas Contextuales -->
            <mat-tab label="Ayudas Contextuales">
              <div class="tab-content">
                <h2>Ayudas Contextuales</h2>
                <p>Haz clic en los elementos para ver las ayudas contextuales:</p>

                <div class="examples-grid">
                  <app-contextual-help
                    title="Ayuda sobre Concursos"
                    [content]="helpContent.concursos"
                    icon="question-circle"
                    theme="info">
                    <button mat-raised-button color="primary">
                      Ayuda sobre Concursos
                    </button>
                  </app-contextual-help>

                  <app-contextual-help
                    title="Documentación Requerida"
                    [content]="helpContent.documentacion"
                    icon="file-alt"
                    theme="primary"
                    position="right"
                    [showActionButton]="true"
                    actionButtonText="Entendido">
                    <button mat-raised-button color="accent">
                      Documentación Requerida
                    </button>
                  </app-contextual-help>

                  <button mat-raised-button color="warn" (click)="showHelp('dashboard-ayuda')">
                    Mostrar Ayuda del Dashboard
                  </button>

                  <button mat-raised-button (click)="showHelp('examenes-info', 'bottom')">
                    Mostrar Ayuda sobre Exámenes
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Confirmaciones -->
            <mat-tab label="Confirmaciones">
              <div class="tab-content">
                <h2>Confirmaciones Visuales</h2>
                <p>Haz clic en los botones para ver los diferentes tipos de confirmaciones:</p>

                <div class="examples-grid">
                  <button mat-raised-button color="primary" (click)="showInfoConfirmation()">
                    Confirmación Informativa
                  </button>

                  <button mat-raised-button color="accent" (click)="showWarningConfirmation()">
                    Confirmación de Advertencia
                  </button>

                  <button mat-raised-button color="warn" (click)="showDangerConfirmation()">
                    Confirmación de Peligro
                  </button>

                  <button mat-raised-button color="primary" (click)="showSuccessConfirmation()">
                    Confirmación de Éxito
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Feedback de Acciones -->
            <mat-tab label="Feedback de Acciones">
              <div class="tab-content">
                <h2>Feedback de Acciones</h2>
                <p>Haz clic en los botones para ver los diferentes tipos de feedback:</p>

                <div class="examples-grid">
                  <button mat-raised-button color="primary" (click)="showSuccessFeedback()">
                    Feedback de Éxito
                  </button>

                  <button mat-raised-button color="warn" (click)="showErrorFeedback()">
                    Feedback de Error
                  </button>

                  <button mat-raised-button color="accent" (click)="showInfoFeedback()">
                    Feedback Informativo
                  </button>

                  <button mat-raised-button (click)="showWarningFeedback()">
                    Feedback de Advertencia
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Indicadores de Carga -->
            <mat-tab label="Indicadores de Carga">
              <div class="tab-content">
                <h2>Indicadores de Carga</h2>
                <p>Diferentes tipos de indicadores de carga y progreso:</p>

                <div class="examples-grid indicators-grid">
                  <div class="indicator-example">
                    <h3>Spinner</h3>
                    <app-progress-indicator
                      type="spinner"
                      [size]="40"
                      color="primary"
                      [showLabel]="true"
                      label="Cargando...">
                    </app-progress-indicator>
                  </div>

                  <div class="indicator-example">
                    <h3>Dots</h3>
                    <app-progress-indicator
                      type="dots"
                      [size]="40"
                      color="accent"
                      [showLabel]="true"
                      label="Procesando...">
                    </app-progress-indicator>
                  </div>

                  <div class="indicator-example">
                    <h3>Progress Bar</h3>
                    <app-progress-indicator
                      type="bar"
                      [determinate]="true"
                      [progress]="progressValue"
                      color="primary"
                      [showLabel]="true"
                      label="Cargando datos">
                    </app-progress-indicator>

                    <mat-slider
                      min="0"
                      max="100"
                      step="1"
                      [(ngModel)]="progressValue">
                    </mat-slider>
                  </div>

                  <div class="indicator-example">
                    <h3>Circular Progress</h3>
                    <app-progress-indicator
                      type="circular"
                      [determinate]="true"
                      [progress]="progressValue"
                      color="accent"
                      [showLabel]="true">
                    </app-progress-indicator>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Animaciones -->
            <mat-tab label="Animaciones">
              <div class="tab-content">
                <h2>Animaciones</h2>
                <p>Haz clic en los botones para ver las diferentes animaciones:</p>

                <div class="animation-controls">
                  <button mat-raised-button color="primary" (click)="resetAnimations()">
                    Reiniciar Animaciones
                  </button>
                </div>

                <div class="examples-grid animations-grid">
                  <div class="animation-example" #fadeInElement>
                    <div class="animation-box" [appAnimate]="'fadeIn'" [animationTrigger]="animationTriggers.fadeIn">
                      Fade In
                    </div>
                    <button mat-button (click)="triggerAnimation('fadeIn')">Ejecutar</button>
                  </div>

                  <div class="animation-example" #slideInElement>
                    <div class="animation-box" [appAnimate]="'slideInRight'" [animationTrigger]="animationTriggers.slideIn">
                      Slide In
                    </div>
                    <button mat-button (click)="triggerAnimation('slideIn')">Ejecutar</button>
                  </div>

                  <div class="animation-example" #scaleInElement>
                    <div class="animation-box" [appAnimate]="'scaleIn'" [animationTrigger]="animationTriggers.scaleIn">
                      Scale In
                    </div>
                    <button mat-button (click)="triggerAnimation('scaleIn')">Ejecutar</button>
                  </div>

                  <div class="animation-example" #pulseElement>
                    <div class="animation-box" [appAnimate]="'pulse'" [animationTrigger]="animationTriggers.pulse">
                      Pulse
                    </div>
                    <button mat-button (click)="triggerAnimation('pulse')">Ejecutar</button>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .examples-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 2rem;
      color: rgba(255, 255, 255, 0.87);
    }

    .tab-content {
      padding: 1.5rem 0;
    }

    h2 {
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 500;
    }

    p {
      margin-bottom: 1.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .examples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .indicators-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }

    .indicator-example {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .indicator-example h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .custom-trigger {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      cursor: pointer;
      display: inline-block;
    }

    .animation-controls {
      margin-bottom: 1.5rem;
    }

    .animations-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .animation-example {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .animation-box {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(25, 118, 210, 0.2);
      border: 1px solid rgba(25, 118, 210, 0.5);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.87);
      text-align: center;
      font-weight: 500;
    }
  `]
})
export class FeedbackExamplesComponent implements OnInit {
  progressValue = 75;

  animationTriggers = {
    fadeIn: 0,
    slideIn: 0,
    scaleIn: 0,
    pulse: 0
  };

  helpContent = {
    concursos: 'En esta sección podrás ver todos los concursos disponibles para postularte.\n\nPuedes filtrar los concursos por categoría, estado o fecha para encontrar más fácilmente el que te interesa.\n\nHaz clic en "Ver Detalles" para obtener más información sobre un concurso específico.',
    documentacion: 'Para completar tu inscripción, necesitarás tener a mano los siguientes documentos:\n\n- DNI (frente y dorso)\n- Título universitario o certificado analítico\n- Curriculum Vitae actualizado\n- Certificados de antecedentes (si corresponde)\n\nTodos los documentos deben estar en formato PDF y tener un tamaño máximo de 5MB.'
  };

  constructor(
    private helpService: HelpService,
    private confirmationService: ConfirmationService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
    console.log('FeedbackExamplesComponent inicializado');
  }

  // Métodos para tooltips y ayudas contextuales
  showHelp(helpId: string, position: 'top' | 'bottom' | 'left' | 'right' = 'right'): void {
    // Obtener el elemento que disparó el evento
    const targetElement = document.activeElement as HTMLElement;

    if (targetElement) {
      this.helpService.showHelp(helpId, targetElement, position);
    }
  }

  // Métodos para confirmaciones
  showInfoConfirmation(): void {
    this.confirmationService.info(
      'Información',
      '¿Estás seguro de que deseas continuar?',
      'Esta acción no se puede deshacer.'
    ).subscribe((result: boolean) => {
      if (result) {
        this.showSuccessFeedback('Has confirmado la acción');
      }
    });
  }

  showWarningConfirmation(): void {
    this.confirmationService.warning(
      'Advertencia',
      'Esta acción podría tener consecuencias',
      'Asegúrate de haber guardado todos tus cambios antes de continuar.'
    ).subscribe((result: boolean) => {
      if (result) {
        this.showSuccessFeedback('Has confirmado la advertencia');
      }
    });
  }

  showDangerConfirmation(): void {
    this.confirmationService.danger(
      'Eliminar Elemento',
      '¿Estás seguro de que deseas eliminar este elemento?',
      'Esta acción no se puede deshacer y todos los datos asociados se perderán permanentemente.'
    ).subscribe((result: boolean) => {
      if (result) {
        this.showSuccessFeedback('Elemento eliminado correctamente');
      }
    });
  }

  showSuccessConfirmation(): void {
    this.confirmationService.success(
      'Operación Exitosa',
      'La operación se ha completado correctamente',
      'Puedes continuar trabajando con normalidad.'
    ).subscribe(() => {
      // No hacer nada, solo cerrar el diálogo
    });
  }

  // Métodos para feedback de acciones
  showSuccessFeedback(message = 'Operación completada con éxito'): void {
    this.feedbackService.showSuccess(message);
  }

  showErrorFeedback(): void {
    this.feedbackService.showError('Ha ocurrido un error al procesar la solicitud');
  }

  showInfoFeedback(): void {
    this.feedbackService.showInfo('Se han actualizado los datos');
  }

  showWarningFeedback(): void {
    this.feedbackService.showWarning('La sesión expirará en 5 minutos');
  }

  // Métodos para animaciones
  triggerAnimation(type: string): void {
    this.animationTriggers[type as keyof typeof this.animationTriggers]++;
  }

  resetAnimations(): void {
    Object.keys(this.animationTriggers).forEach(key => {
      this.animationTriggers[key as keyof typeof this.animationTriggers] = 0;
    });

    // Esperar un poco y luego disparar todas las animaciones
    setTimeout(() => {
      Object.keys(this.animationTriggers).forEach(key => {
        this.animationTriggers[key as keyof typeof this.animationTriggers]++;
      });
    }, 100);
  }
}
