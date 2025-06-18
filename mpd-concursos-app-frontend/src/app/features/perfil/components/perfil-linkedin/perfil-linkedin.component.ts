import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

// Models
import { UserProfile } from '@core/models/perfil.model';

@Component({
  selector: 'app-perfil-linkedin',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
  ],
  template: `
    <div class="linkedin-container">
      <!-- Development Notice Banner -->
      <div class="development-notice">
        <div class="notice-content">
          <i class="fas fa-tools" aria-hidden="true"></i>
          <div class="notice-text">
            <h3>Funcionalidad en Desarrollo</h3>
            <p>La integración con LinkedIn está actualmente en desarrollo. Esta funcionalidad estará disponible próximamente.</p>
          </div>
        </div>
      </div>

      <!-- Glassmorphism LinkedIn Card -->
      <div class="linkedin-glassmorphism-card disabled-state">
        <div class="linkedin-content">
          <!-- Header -->
          <div class="linkedin-header">
            <div class="linkedin-logo">
              <i class="fab fa-linkedin" aria-hidden="true"></i>
            </div>
            <div class="header-text">
              <h2>Integración con LinkedIn</h2>
              <p>Conecte su perfil de LinkedIn para importar automáticamente su experiencia profesional</p>
            </div>
          </div>

          <!-- Connection Status -->
          <div class="connection-status" [ngClass]="linkedInConectado ? 'connected' : 'disconnected'">
            <div class="status-indicator">
              <i class="fas" [ngClass]="linkedInConectado ? 'fa-check-circle' : 'fa-times-circle'" aria-hidden="true"></i>
            </div>
            <div class="status-text">
              <h3>{{ linkedInConectado ? 'Cuenta Conectada' : 'Cuenta No Conectada' }}</h3>
              <p>{{ linkedInConectado ? 'Su perfil de LinkedIn está sincronizado' : 'Conecte su cuenta para importar datos automáticamente' }}</p>
            </div>
          </div>

          <!-- Connected State -->
          <div *ngIf="linkedInConectado" class="connected-section">
            <div class="profile-info">
              <h4>Información Sincronizada</h4>
              <div class="sync-items">
                <div class="sync-item">
                  <i class="fas fa-briefcase" aria-hidden="true"></i>
                  <span>Experiencia Laboral</span>
                  <span class="sync-status success">
                    <i class="fas fa-check" aria-hidden="true"></i>
                    Sincronizado
                  </span>
                </div>
                <div class="sync-item">
                  <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                  <span>Educación</span>
                  <span class="sync-status success">
                    <i class="fas fa-check" aria-hidden="true"></i>
                    Sincronizado
                  </span>
                </div>
                <div class="sync-item">
                  <i class="fas fa-award" aria-hidden="true"></i>
                  <span>Habilidades</span>
                  <span class="sync-status success">
                    <i class="fas fa-check" aria-hidden="true"></i>
                    Sincronizado
                  </span>
                </div>
              </div>
            </div>

            <div class="sync-actions">
              <app-custom-button
                color="primary"
                icon="fa-sync"
                label="Sincronizar Ahora"
                (buttonClick)="syncLinkedInData()">
              </app-custom-button>
              
              <app-custom-button
                color="warn"
                variant="stroked"
                icon="fa-unlink"
                label="Desconectar LinkedIn"
                (buttonClick)="disconnectLinkedIn()">
              </app-custom-button>
            </div>

            <div class="last-sync">
              <i class="fas fa-clock" aria-hidden="true"></i>
              <span>Última sincronización: {{ getLastSyncDate() }}</span>
            </div>
          </div>

          <!-- Disconnected State -->
          <div *ngIf="!linkedInConectado" class="disconnected-section">
            <div class="benefits-list">
              <h4>Beneficios de conectar LinkedIn:</h4>
              <ul>
                <li>
                  <i class="fas fa-check" aria-hidden="true"></i>
                  Importación automática de experiencia laboral
                </li>
                <li>
                  <i class="fas fa-check" aria-hidden="true"></i>
                  Sincronización de educación y certificaciones
                </li>
                <li>
                  <i class="fas fa-check" aria-hidden="true"></i>
                  Actualización automática de habilidades
                </li>
                <li>
                  <i class="fas fa-check" aria-hidden="true"></i>
                  Perfil siempre actualizado
                </li>
              </ul>
            </div>

            <div class="connect-action">
              <app-custom-button
                color="warn"
                icon="fas fa-tools"
                label="En Desarrollo"
                [disabled]="true"
                tooltip="Esta funcionalidad estará disponible próximamente">
              </app-custom-button>
            </div>

            <div class="privacy-notice">
              <div class="notice-header">
                <i class="fas fa-shield-alt" aria-hidden="true"></i>
                <h5>Privacidad y Seguridad</h5>
              </div>
              <p>
                Solo accedemos a la información pública de su perfil de LinkedIn. 
                Sus datos están protegidos y nunca compartimos información personal con terceros.
              </p>
              <ul class="privacy-points">
                <li>✓ Conexión segura mediante OAuth 2.0</li>
                <li>✓ Solo lectura de datos públicos</li>
                <li>✓ Puede desconectar en cualquier momento</li>
                <li>✓ Cumplimiento con GDPR y normativas de privacidad</li>
              </ul>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-overlay">
            <div class="loading-content">
              <div class="spinner"></div>
              <p>{{ loadingMessage }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./perfil-linkedin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilLinkedInComponent {
  @Input() linkedInConectado = false;
  @Input() userProfile: UserProfile | null = null;

  isLoading = false;
  loadingMessage = '';

  connectLinkedIn(): void {
    this.isLoading = true;
    this.loadingMessage = 'Conectando con LinkedIn...';
    
    // Simulate LinkedIn connection process
    setTimeout(() => {
      this.isLoading = false;
      // Implementation for LinkedIn connection
    }, 2000);
  }

  disconnectLinkedIn(): void {
    this.isLoading = true;
    this.loadingMessage = 'Desconectando de LinkedIn...';
    
    // Simulate LinkedIn disconnection process
    setTimeout(() => {
      this.isLoading = false;
      // Implementation for LinkedIn disconnection
    }, 1500);
  }

  syncLinkedInData(): void {
    this.isLoading = true;
    this.loadingMessage = 'Sincronizando datos de LinkedIn...';
    
    // Simulate LinkedIn sync process
    setTimeout(() => {
      this.isLoading = false;
      // Implementation for LinkedIn data sync
    }, 3000);
  }

  getLastSyncDate(): string {
    // Return formatted last sync date
    const lastSync = new Date();
    lastSync.setHours(lastSync.getHours() - 2); // Simulate 2 hours ago
    
    return lastSync.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
