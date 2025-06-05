import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnifiedNotificationService } from '../unified-notification.service';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>🧪 Test de Notificaciones Unificadas</h2>
      <p>Prueba las notificaciones para verificar que el botón de cerrar funciona correctamente.</p>
      
      <div class="test-buttons">
        <button class="test-btn success" (click)="testSuccess()">
          ✅ Test Éxito
        </button>
        <button class="test-btn error" (click)="testError()">
          ❌ Test Error
        </button>
        <button class="test-btn warning" (click)="testWarning()">
          ⚠️ Test Advertencia
        </button>
        <button class="test-btn info" (click)="testInfo()">
          ℹ️ Test Información
        </button>
        <button class="test-btn special" (click)="testErrorWithRetry()">
          🔄 Test Error con Reintento
        </button>
        <button class="test-btn special" (click)="testPersistent()">
          📌 Test Persistente
        </button>
        <button class="test-btn control" (click)="testMultiple()">
          📚 Test Múltiples
        </button>
        <button class="test-btn control" (click)="dismissAll()">
          🗑️ Cerrar Todas
        </button>
      </div>

      <div class="test-info">
        <h3>Instrucciones de Prueba:</h3>
        <ol>
          <li>Haz clic en cualquier botón para mostrar una notificación</li>
          <li>Verifica que aparezca la notificación en la esquina superior derecha</li>
          <li>Haz clic en el botón "X" para cerrar la notificación</li>
          <li>Verifica que la notificación se cierre correctamente</li>
          <li>Prueba con diferentes tipos de notificaciones</li>
          <li>Prueba el botón "Reintentar" en las notificaciones de error</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 2rem;
      max-width: 800px;
      margin: 2rem auto;
      background: linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(75, 85, 99, 0.8) 100%);
      border-radius: 12px;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f9fafb;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    h2 {
      text-align: center;
      margin-bottom: 1rem;
      color: #f9fafb;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    p {
      text-align: center;
      margin-bottom: 2rem;
      color: #d1d5db;
    }

    .test-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .test-btn {
      padding: 1rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(55, 65, 81, 0.8);
      color: #f9fafb;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
      font-weight: 500;
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .test-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .test-btn.success {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(56, 142, 60, 0.9) 100%);
      border-color: rgba(76, 175, 80, 0.4);
    }

    .test-btn.error {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(211, 47, 47, 0.9) 100%);
      border-color: rgba(244, 67, 54, 0.4);
    }

    .test-btn.warning {
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(245, 124, 0, 0.9) 100%);
      border-color: rgba(255, 152, 0, 0.4);
    }

    .test-btn.info {
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(25, 118, 210, 0.9) 100%);
      border-color: rgba(33, 150, 243, 0.4);
    }

    .test-btn.special {
      background: linear-gradient(135deg, rgba(156, 39, 176, 0.8) 0%, rgba(123, 31, 162, 0.9) 100%);
      border-color: rgba(156, 39, 176, 0.4);
    }

    .test-btn.control {
      background: linear-gradient(135deg, rgba(96, 125, 139, 0.8) 0%, rgba(69, 90, 100, 0.9) 100%);
      border-color: rgba(96, 125, 139, 0.4);
    }

    .test-info {
      background: rgba(55, 65, 81, 0.5);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .test-info h3 {
      margin: 0 0 1rem 0;
      color: #f9fafb;
      font-size: 1.125rem;
    }

    .test-info ol {
      margin: 0;
      padding-left: 1.5rem;
      color: #d1d5db;
      line-height: 1.6;
    }

    .test-info li {
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .test-container {
        margin: 1rem;
        padding: 1rem;
      }

      .test-buttons {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NotificationTestComponent {
  constructor(private notificationService: UnifiedNotificationService) {}

  testSuccess(): void {
    this.notificationService.success(
      'Operación completada exitosamente. Todos los datos se han guardado correctamente.',
      'Éxito'
    );
  }

  testError(): void {
    this.notificationService.error(
      'Ha ocurrido un error inesperado. Por favor, verifica tu conexión e intenta nuevamente.',
      'Error'
    );
  }

  testWarning(): void {
    this.notificationService.warning(
      'Esta acción requiere confirmación. Algunos datos podrían perderse si continúas.',
      'Advertencia'
    );
  }

  testInfo(): void {
    this.notificationService.info(
      'Nueva información disponible. Se han actualizado los datos del sistema.',
      'Información'
    );
  }

  testErrorWithRetry(): void {
    this.notificationService.errorWithRetry(
      'Error de conexión con el servidor. Haz clic en "Reintentar" para volver a intentar.',
      () => {
        this.notificationService.success('Reintento ejecutado correctamente');
      }
    );
  }

  testPersistent(): void {
    this.notificationService.persistent(
      'Esta es una notificación persistente que no se cierra automáticamente. Debes cerrarla manualmente haciendo clic en el botón X.',
      'warning',
      'Notificación Persistente'
    );
  }

  testMultiple(): void {
    this.notificationService.success('Primera notificación');
    setTimeout(() => this.notificationService.info('Segunda notificación'), 500);
    setTimeout(() => this.notificationService.warning('Tercera notificación'), 1000);
    setTimeout(() => this.notificationService.error('Cuarta notificación'), 1500);
  }

  dismissAll(): void {
    this.notificationService.dismissAll();
  }
}
