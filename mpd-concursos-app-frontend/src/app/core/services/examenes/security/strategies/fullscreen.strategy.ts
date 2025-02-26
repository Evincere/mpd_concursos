import { Injectable } from '@angular/core';
import { BaseSecurityStrategy } from './base-security.strategy';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ExamenNotificationService } from '../../examen-notification.service';

export enum FullscreenState {
  INITIAL = 'INITIAL',      // Estado inicial (antes de activar)
  ENTERING = 'ENTERING',    // Solicitando entrar a pantalla completa
  ACTIVE = 'ACTIVE',        // En pantalla completa
  EXITING = 'EXITING',      // Intentando salir de pantalla completa
  VIOLATED = 'VIOLATED'     // Ha salido de pantalla completa (infracción)
}

@Injectable()
export class FullscreenStrategy extends BaseSecurityStrategy implements ISecurityStrategy {
  private currentState: FullscreenState = FullscreenState.INITIAL;

  constructor(private notificationService: ExamenNotificationService) {
    super();
  }

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

  // Método para comprobar si el navegador soporta pantalla completa
  checkFullscreenSupport(): boolean {
    const docElm = document.documentElement;
    
    // Comprobamos las diferentes API de pantalla completa según el navegador
    const fullscreenEnabled = document.fullscreenEnabled || 
                            (document as any).webkitFullscreenEnabled || 
                            (document as any).mozFullScreenEnabled ||
                            (document as any).msFullscreenEnabled;
    
    const requestFullscreen = docElm.requestFullscreen ||
                            (docElm as any).webkitRequestFullscreen ||
                            (docElm as any).mozRequestFullScreen ||
                            (docElm as any).msRequestFullscreen;
    
    console.log('Soporte de pantalla completa:', {
      fullscreenEnabled,
      requestFullscreenExists: !!requestFullscreen
    });
    
    return !!fullscreenEnabled && !!requestFullscreen;
  }

  override async activate(): Promise<void> {
    try {
      // Verificamos si el navegador soporta pantalla completa
      if (!this.checkFullscreenSupport()) {
        console.error('Este navegador no soporta la API de pantalla completa');
        throw new Error('Navegador no compatible con pantalla completa');
      }
      
      // Si ya estamos en estado ACTIVE, no hacemos nada
      if (this.currentState === FullscreenState.ACTIVE) {
        console.log('Ya estamos en pantalla completa, no se hace nada');
        return;
      }

      console.log(`Activando pantalla completa. Estado actual: ${this.currentState}`);
      
      // Cambiamos al estado ENTERING
      this.currentState = FullscreenState.ENTERING;
      console.log('Estado cambiado a ENTERING');
      
      const element = document.documentElement;
      
      // Verificamos si ya estamos en pantalla completa
      if (!document.fullscreenElement) {
        console.log('Solicitando pantalla completa desde la estrategia...');
        try {
          await element.requestFullscreen();
          console.log('Pantalla completa activada exitosamente desde la estrategia');
          
          // Después de la activación exitosa, cambiamos a ACTIVE
          this.currentState = FullscreenState.ACTIVE;
          console.log('Estado actualizado a ACTIVE');
        } catch (fsError) {
          console.error('Error al solicitar pantalla completa:', fsError);
          throw fsError;
        }
      } else {
        console.log('Ya estamos en pantalla completa, no se necesita solicitar de nuevo');
        // Si ya estamos en pantalla completa, actualizamos el estado igualmente
        this.currentState = FullscreenState.ACTIVE;
        console.log('Estado actualizado a ACTIVE');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error en método activate de FullscreenStrategy:', error);
      // No cambiamos el estado en caso de error
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
    console.log(`Manejando cambio de pantalla completa. Estado actual: ${this.currentState}, ¿Está en pantalla completa?: ${isInFullscreen}`);
    
    // Si estamos en estado INITIAL o ENTERING, significa que estamos en el proceso de
    // activar la pantalla completa inicialmente, por lo que no deberíamos generar warning o violación
    switch (this.currentState) {
      case FullscreenState.INITIAL:
      case FullscreenState.ENTERING:
        if (isInFullscreen) {
          console.log('Transición exitosa de INITIAL/ENTERING a ACTIVE');
          this.currentState = FullscreenState.ACTIVE;
          return true;
        } else {
          console.log('Se canceló la entrada a pantalla completa desde INITIAL/ENTERING');
          // No cambiamos a VIOLATED en este caso, ya que podría ser solo la activación inicial
          return false;
        }
        break;

      case FullscreenState.ACTIVE:
        if (!isInFullscreen) {
          console.log('Saliendo de pantalla completa desde ACTIVE, cambiando a EXITING');
          this.currentState = FullscreenState.EXITING;
          return false; // Indica que debemos mostrar advertencia
        }
        break;

      case FullscreenState.EXITING:
        if (isInFullscreen) {
          // El usuario canceló la salida
          console.log('Usuario canceló la salida de pantalla completa, volviendo a ACTIVE');
          this.currentState = FullscreenState.ACTIVE;
          return true;
        } else {
          // El usuario confirmó la salida
          console.log('Usuario confirmó la salida de pantalla completa, cambiando a VIOLATED');
          this.currentState = FullscreenState.VIOLATED;
          return false;
        }
        break;
        
      case FullscreenState.VIOLATED:
        if (isInFullscreen) {
          // El usuario volvió a la pantalla completa después de una violación
          console.log('Usuario volvió a pantalla completa después de una violación, restaurando estado a ACTIVE');
          this.currentState = FullscreenState.ACTIVE;
          return true;
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
