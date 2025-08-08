import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';

import { WelcomeModalService } from '@core/services/welcome-modal.service';
import { AuthService } from '@core/services/auth/auth.service';
import { LoggingService } from '@core/services/logging/logging.service';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomIconButtonComponent } from '@shared/components/custom-icon-button/custom-icon-button.component';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomButtonComponent,
    CustomIconButtonComponent
  ],
  template: `
    <!-- Modal Backdrop -->
    <div
      *ngIf="isVisible()"
      class="modal-backdrop"
      [@backdropAnimation]
      (click)="onBackdropClick($event)">

      <!-- Modal Container -->
      <div
        class="modal-container"
        [@modalAnimation]
        (click)="$event.stopPropagation()">

        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-content">
            <div class="welcome-icon">
              <i class="fas fa-hand-wave" aria-hidden="true"></i>
            </div>
            <div class="header-text">
              <h2 class="modal-title">¡Bienvenido/a {{ userName() }}!</h2>
              <p class="modal-subtitle">Recomendaciones Importantes</p>
            </div>
          </div>

          <app-custom-icon-button
            [icon]="'times'"
            [variant]="'ghost'"
            [size]="'small'"
            [ariaLabel]="'Cerrar modal'"
            (buttonClick)="onClose()">
          </app-custom-icon-button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div class="welcome-content">
            <p class="intro-text">
              Antes de iniciar tu proceso de inscripción, te recomendamos seguir estos pasos para asegurar una postulación exitosa:
            </p>

            <div class="recommendations-list">
              <div class="recommendation-item">
                <div class="recommendation-icon">
                  <i class="fas fa-user-edit" aria-hidden="true"></i>
                </div>
                <div class="recommendation-content">
                  <h4>Actualiza tu perfil</h4>
                  <p>Es preferible que tengas tu centro de vida definido antes de inscribirte. Consulta las bases y condiciones del concurso para conocer las consecuencias del establecimiento de este domicilio.</p>
                </div>
              </div>

              <div class="recommendation-item">
                <div class="recommendation-icon">
                  <i class="fas fa-file-upload" aria-hidden="true"></i>
                </div>
                <div class="recommendation-content">
                  <h4>Carga tu documentación</h4>
                  <p>Aunque es posible inscribirse sin documentación, esta inscripción será provisoria. Si no completas la documentación dentro de los tres días hábiles posteriores al cierre de inscripciones, tu postulación carecerá de efectos legales.</p>
                </div>
              </div>

              <div class="recommendation-item">
                <div class="recommendation-icon">
                  <i class="fas fa-check-double" aria-hidden="true"></i>
                </div>
                <div class="recommendation-content">
                  <h4>Verifica los tipos de documento</h4>
                  <p>Asegúrate de cargar cada documento en el tipo correcto en la sección "Mi Perfil > Documentación".</p>
                </div>
              </div>

              <div class="recommendation-item important">
                <div class="recommendation-icon">
                  <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                </div>
                <div class="recommendation-content">
                  <h4>Importante</h4>
                  <p>La cancelación de una postulación durante el proceso de inscripción implica no poder volver a inscribirse al mismo concurso en el período actual.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="footer-options">
            <label class="checkbox-container">
              <input
                type="checkbox"
                [(ngModel)]="dontShowAgain"
                class="checkbox-input">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">No mostrar nuevamente</span>
            </label>
          </div>

          <div class="footer-actions">
            <app-custom-button
              [label]="'Cerrar'"
              [variant]="'stroked'"
              [size]="'medium'"
              [ariaLabel]="'Cerrar modal sin marcar como leído'"
              (buttonClick)="onClose()">
            </app-custom-button>

            <app-custom-button
              [label]="'Entendido'"
              [variant]="'primary'"
              [size]="'medium'"
              [ariaLabel]="'Confirmar lectura y cerrar modal'"
              (buttonClick)="onUnderstood()">
            </app-custom-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './welcome-modal.component.scss',
  animations: [
    trigger('backdropAnimation', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ]),
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-50px) scale(0.9)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })),
      transition('void => *', animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ]
})
export class WelcomeModalComponent implements OnInit, OnDestroy {

  // Signals
  private isVisibleSignal = signal<boolean>(false);
  private userNameSignal = signal<string>('');

  public readonly isVisible = this.isVisibleSignal.asReadonly();
  public readonly userName = this.userNameSignal.asReadonly();

  // State
  dontShowAgain = false;

  constructor(
    private welcomeModalService: WelcomeModalService,
    private authService: AuthService,
    private loggingService: LoggingService
  ) {
    // Usar effect con allowSignalWrites para poder escribir a signals
    effect(() => {
      const show = this.welcomeModalService.showModal();
      this.isVisibleSignal.set(show);

      if (show) {
        this.loadUserName();
        this.onModalOpened();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // El effect ya está configurado en el constructor
    // Aquí solo inicializamos si es necesario
    this.loggingService.debug('[WelcomeModalComponent] Componente inicializado', undefined, 'WelcomeModal');
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
    if (this.isVisible()) {
      this.onModalClosed();
    }
  }

  /**
   * Carga el nombre del usuario
   */
  private loadUserName(): void {
    const userInfo = this.authService.userInfo();
    this.userNameSignal.set(userInfo.username || 'Usuario');
  }

  /**
   * Maneja el clic en el backdrop
   */
  onBackdropClick(event: Event): void {
    // Solo cerrar si se hace clic directamente en el backdrop
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  /**
   * Maneja el cierre del modal sin marcar como leído
   */
  onClose(): void {
    this.loggingService.debug('[WelcomeModalComponent] Modal cerrado sin confirmar lectura', undefined, 'WelcomeModal');
    this.welcomeModalService.hideModal();
    this.onModalClosed();
  }

  /**
   * Maneja la confirmación de lectura
   */
  onUnderstood(): void {
    this.loggingService.info('[WelcomeModalComponent] Usuario confirmó lectura de recomendaciones', {
      dontShowAgain: this.dontShowAgain
    }, 'WelcomeModal');

    // Si el usuario marcó "No mostrar nuevamente", marcar como mostrado
    if (this.dontShowAgain) {
      this.welcomeModalService.markAsShown();
    } else {
      this.welcomeModalService.hideModal();
    }

    this.onModalClosed();
  }

  /**
   * Maneja la apertura del modal
   */
  private onModalOpened(): void {
    // Prevenir scroll del body
    document.body.classList.add('modal-open');

    // Focus management para accesibilidad
    setTimeout(() => {
      const firstFocusable = document.querySelector('.modal-container .modal-title') as HTMLElement;
      firstFocusable?.focus();
    }, 100);

    this.loggingService.debug('[WelcomeModalComponent] Modal de bienvenida abierto', undefined, 'WelcomeModal');
  }

  /**
   * Maneja el cierre del modal
   */
  private onModalClosed(): void {
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');

    this.loggingService.debug('[WelcomeModalComponent] Modal de bienvenida cerrado', undefined, 'WelcomeModal');
  }
}
