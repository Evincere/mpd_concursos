import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnifiedNotificationService } from '../unified-notification.service';

@Component({
  selector: 'app-notification-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <h2>Demo de Notificaciones Unificadas</h2>
      <p>Prueba los diferentes tipos de notificaciones y sus funcionalidades.</p>
      
      <div class="demo-grid">
        <!-- Tipos básicos -->
        <div class="demo-section">
          <h3>Tipos Básicos</h3>
          <div class="button-group">
            <button class="demo-button success" (click)="showSuccess()">
              <i class="fas fa-check-circle"></i>
              Éxito
            </button>
            <button class="demo-button error" (click)="showError()">
              <i class="fas fa-times-circle"></i>
              Error
            </button>
            <button class="demo-button warning" (click)="showWarning()">
              <i class="fas fa-exclamation-triangle"></i>
              Advertencia
            </button>
            <button class="demo-button info" (click)="showInfo()">
              <i class="fas fa-info-circle"></i>
              Información
            </button>
          </div>
        </div>

        <!-- Posiciones -->
        <div class="demo-section">
          <h3>Posiciones</h3>
          <div class="button-group">
            <button class="demo-button" (click)="showAtTopStart()">Top Start</button>
            <button class="demo-button" (click)="showAtTopCenter()">Top Center</button>
            <button class="demo-button" (click)="showAtTopEnd()">Top End</button>
            <button class="demo-button" (click)="showAtBottomStart()">Bottom Start</button>
            <button class="demo-button" (click)="showAtBottomCenter()">Bottom Center</button>
            <button class="demo-button" (click)="showAtBottomEnd()">Bottom End</button>
          </div>
        </div>

        <!-- Funcionalidades especiales -->
        <div class="demo-section">
          <h3>Funcionalidades Especiales</h3>
          <div class="button-group">
            <button class="demo-button special" (click)="showWithRetry()">
              <i class="fas fa-redo"></i>
              Con Reintento
            </button>
            <button class="demo-button special" (click)="showPersistent()">
              <i class="fas fa-thumbtack"></i>
              Persistente
            </button>
            <button class="demo-button special" (click)="showMultiple()">
              <i class="fas fa-layer-group"></i>
              Múltiples
            </button>
            <button class="demo-button special" (click)="showLongMessage()">
              <i class="fas fa-align-left"></i>
              Mensaje Largo
            </button>
          </div>
        </div>

        <!-- Controles -->
        <div class="demo-section">
          <h3>Controles</h3>
          <div class="button-group">
            <button class="demo-button control" (click)="dismissAll()">
              <i class="fas fa-times"></i>
              Cerrar Todas
            </button>
            <button class="demo-button control" (click)="dismissErrors()">
              <i class="fas fa-exclamation-circle"></i>
              Cerrar Errores
            </button>
            <button class="demo-button control" (click)="showCount()">
              <i class="fas fa-hashtag"></i>
              Mostrar Contador
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(75, 85, 99, 0.8) 100%);
      border-radius: 12px;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f9fafb;
    }

    h2 {
      text-align: center;
      margin-bottom: 0.5rem;
      color: #f9fafb;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    p {
      text-align: center;
      margin-bottom: 2rem;
      color: #d1d5db;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .demo-section {
      background: rgba(55, 65, 81, 0.5);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .demo-section h3 {
      margin: 0 0 1rem 0;
      color: #f9fafb;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .button-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.75rem;
    }

    .demo-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      background: rgba(55, 65, 81, 0.8);
      color: #f9fafb;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      backdrop-filter: blur(4px);
    }

    .demo-button:hover {
      background: rgba(75, 85, 99, 0.9);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .demo-button.success {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(56, 142, 60, 0.9) 100%);
      border-color: rgba(76, 175, 80, 0.4);
    }

    .demo-button.error {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(211, 47, 47, 0.9) 100%);
      border-color: rgba(244, 67, 54, 0.4);
    }

    .demo-button.warning {
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(245, 124, 0, 0.9) 100%);
      border-color: rgba(255, 152, 0, 0.4);
    }

    .demo-button.info {
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(25, 118, 210, 0.9) 100%);
      border-color: rgba(33, 150, 243, 0.4);
    }

    .demo-button.special {
      background: linear-gradient(135deg, rgba(156, 39, 176, 0.8) 0%, rgba(123, 31, 162, 0.9) 100%);
      border-color: rgba(156, 39, 176, 0.4);
    }

    .demo-button.control {
      background: linear-gradient(135deg, rgba(96, 125, 139, 0.8) 0%, rgba(69, 90, 100, 0.9) 100%);
      border-color: rgba(96, 125, 139, 0.4);
    }

    .demo-button i {
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }

      .demo-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .button-group {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NotificationDemoComponent {
  constructor(private notificationService: UnifiedNotificationService) {}

  showSuccess(): void {
    this.notificationService.success('Operación completada exitosamente', 'Éxito');
  }

  showError(): void {
    this.notificationService.error('Ha ocurrido un error inesperado', 'Error');
  }

  showWarning(): void {
    this.notificationService.warning('Esta acción requiere confirmación', 'Advertencia');
  }

  showInfo(): void {
    this.notificationService.info('Nueva información disponible', 'Información');
  }

  showAtTopStart(): void {
    this.notificationService.showAt('Notificación en top-start', 'top-start', 'info');
  }

  showAtTopCenter(): void {
    this.notificationService.showAt('Notificación en top-center', 'top-center', 'info');
  }

  showAtTopEnd(): void {
    this.notificationService.showAt('Notificación en top-end', 'top-end', 'info');
  }

  showAtBottomStart(): void {
    this.notificationService.showAt('Notificación en bottom-start', 'bottom-start', 'info');
  }

  showAtBottomCenter(): void {
    this.notificationService.showAt('Notificación en bottom-center', 'bottom-center', 'info');
  }

  showAtBottomEnd(): void {
    this.notificationService.showAt('Notificación en bottom-end', 'bottom-end', 'info');
  }

  showWithRetry(): void {
    this.notificationService.errorWithRetry(
      'Error de conexión. Haga clic en "Reintentar" para volver a intentar.',
      () => {
        this.notificationService.success('Reintento ejecutado correctamente');
      }
    );
  }

  showPersistent(): void {
    this.notificationService.persistent(
      'Esta notificación no se cierra automáticamente. Debe cerrarla manualmente.',
      'warning',
      'Notificación Persistente'
    );
  }

  showMultiple(): void {
    this.notificationService.success('Primera notificación');
    setTimeout(() => this.notificationService.info('Segunda notificación'), 500);
    setTimeout(() => this.notificationService.warning('Tercera notificación'), 1000);
    setTimeout(() => this.notificationService.error('Cuarta notificación'), 1500);
  }

  showLongMessage(): void {
    this.notificationService.info(
      'Este es un mensaje muy largo que demuestra cómo se comporta el componente de notificación cuando el contenido es extenso. El texto debe ajustarse correctamente y mantener la legibilidad en diferentes tamaños de pantalla.',
      'Mensaje Extenso'
    );
  }

  dismissAll(): void {
    this.notificationService.dismissAll();
  }

  dismissErrors(): void {
    this.notificationService.dismissByType('error');
  }

  showCount(): void {
    const count = this.notificationService.getActiveCount();
    this.notificationService.info(`Hay ${count} notificaciones activas`, 'Contador');
  }
}
