import { Injectable } from '@angular/core';
import { BaseSecurityStrategy } from './base-security.strategy';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Injectable()
export class FullscreenStrategy extends BaseSecurityStrategy {
  getType(): SecurityViolationType {
    return SecurityViolationType.FULLSCREEN_REQUIRED;
  }

  handleViolation(details?: any): void {
    console.log('Violación de pantalla completa detectada:', details);
  }

  override async activate(): Promise<void> {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Error al activar pantalla completa:', error);
      throw error;
    }
  }

  override deactivate(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
}
