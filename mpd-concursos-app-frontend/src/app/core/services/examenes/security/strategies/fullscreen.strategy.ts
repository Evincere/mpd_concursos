import { Injectable } from '@angular/core';
import { BaseSecurityStrategy } from './base-security.strategy';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export enum FullscreenState {
  INITIAL = 'initial',         // Estado antes de iniciar el examen
  ENTERING = 'entering',       // En proceso de solicitar y entrar en pantalla completa
  ACTIVE = 'active',          // En pantalla completa correctamente
  EXITING = 'exiting',        // Intentando salir (momento para la advertencia)
  VIOLATED = 'violated'        // Ha salido de pantalla completa (infracción)
}

@Injectable()
export class FullscreenStrategy extends BaseSecurityStrategy {
  private currentState: FullscreenState = FullscreenState.INITIAL;

  getType(): SecurityViolationType {
    return SecurityViolationType.FULLSCREEN_REQUIRED;
  }

  handleViolation(details?: any): void {
    // Solo manejamos violaciones cuando estamos en estado ACTIVE o EXITING
    if (this.currentState === FullscreenState.ACTIVE || 
        this.currentState === FullscreenState.EXITING) {
      console.log('Violación de pantalla completa detectada:', details);
    }
  }

  getCurrentState(): FullscreenState {
    return this.currentState;
  }

  override async activate(): Promise<void> {
    try {
      // Si ya estamos en estado ACTIVE, no hacemos nada
      if (this.currentState === FullscreenState.ACTIVE) {
        return;
      }

      // Cambiamos al estado ENTERING
      this.currentState = FullscreenState.ENTERING;
      
      const element = document.documentElement;
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      }
      
      // Después de la activación exitosa, cambiamos a ACTIVE
      this.currentState = FullscreenState.ACTIVE;
    } catch (error) {
      console.error('Error al activar pantalla completa:', error);
      throw error;
    }
  }

  override deactivate(): void {
    if (document.fullscreenElement && this.currentState === FullscreenState.ACTIVE) {
      document.exitFullscreen();
      this.currentState = FullscreenState.VIOLATED;
    }
  }

  async handleFullscreenChange(isInFullscreen: boolean): Promise<boolean> {
    switch (this.currentState) {
      case FullscreenState.INITIAL:
      case FullscreenState.ENTERING:
        if (isInFullscreen) {
          this.currentState = FullscreenState.ACTIVE;
          return true;
        }
        break;

      case FullscreenState.ACTIVE:
        if (!isInFullscreen) {
          this.currentState = FullscreenState.EXITING;
          return false; // Indica que debemos mostrar advertencia
        }
        break;

      case FullscreenState.EXITING:
        if (isInFullscreen) {
          // El usuario canceló la salida
          this.currentState = FullscreenState.ACTIVE;
          return true;
        } else {
          // El usuario confirmó la salida
          this.currentState = FullscreenState.VIOLATED;
          return false;
        }
        break;
    }
    return true;
  }

  isInViolatedState(): boolean {
    return this.currentState === FullscreenState.VIOLATED;
  }

  isInInitialPhase(): boolean {
    return this.currentState === FullscreenState.INITIAL || 
           this.currentState === FullscreenState.ENTERING;
  }
}
