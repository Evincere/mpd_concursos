import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para prevenir doble clic en botones y operaciones concurrentes
 * 
 * Características:
 * - Bloqueo temporal de botones durante operaciones
 * - Tracking de operaciones en progreso
 * - Auto-liberación por timeout
 * - Estados observables para UI reactiva
 */
@Injectable({
  providedIn: 'root'
})
export class ButtonLockService {

  private lockedButtons = new Map<string, NodeJS.Timeout>();
  private operationsInProgress = new BehaviorSubject<Set<string>>(new Set());

  /**
   * Observable de operaciones en progreso
   */
  get operationsInProgress$(): Observable<Set<string>> {
    return this.operationsInProgress.asObservable();
  }

  /**
   * Bloquea un botón temporalmente
   * 
   * @param buttonId Identificador único del botón
   * @param durationMs Duración del bloqueo en milisegundos (default: 2000)
   * @returns true si el bloqueo fue exitoso, false si ya estaba bloqueado
   */
  lockButton(buttonId: string, durationMs: number = 2000): boolean {
    // Si ya está bloqueado, rechazar
    if (this.lockedButtons.has(buttonId)) {
      console.warn(`🔒 [ButtonLock] Botón ${buttonId} ya está bloqueado`);
      return false;
    }

    // Bloquear el botón
    const timeout = setTimeout(() => {
      this.unlockButton(buttonId);
    }, durationMs);

    this.lockedButtons.set(buttonId, timeout);
    this.updateOperationsInProgress();

    console.log(`🔒 [ButtonLock] Botón ${buttonId} bloqueado por ${durationMs}ms`);
    return true;
  }

  /**
   * Desbloquea un botón manualmente
   * 
   * @param buttonId Identificador único del botón
   */
  unlockButton(buttonId: string): void {
    const timeout = this.lockedButtons.get(buttonId);
    if (timeout) {
      clearTimeout(timeout);
      this.lockedButtons.delete(buttonId);
      this.updateOperationsInProgress();
      console.log(`🔓 [ButtonLock] Botón ${buttonId} desbloqueado`);
    }
  }

  /**
   * Verifica si un botón está bloqueado
   * 
   * @param buttonId Identificador único del botón
   * @returns true si está bloqueado
   */
  isButtonLocked(buttonId: string): boolean {
    return this.lockedButtons.has(buttonId);
  }

  /**
   * Ejecuta una operación con bloqueo automático de botón
   * 
   * @param buttonId Identificador único del botón
   * @param operation Función que retorna una Promise
   * @param lockDuration Duración mínima del bloqueo
   * @returns Promise con el resultado de la operación
   */
  async executeWithLock<T>(
    buttonId: string, 
    operation: () => Promise<T>, 
    lockDuration: number = 2000
  ): Promise<T> {
    
    // Intentar adquirir el lock
    if (!this.lockButton(buttonId, lockDuration)) {
      throw new Error(`Operación ya en progreso para ${buttonId}`);
    }

    try {
      console.log(`🚀 [ButtonLock] Ejecutando operación para ${buttonId}`);
      const result = await operation();
      console.log(`✅ [ButtonLock] Operación completada para ${buttonId}`);
      return result;
    } catch (error) {
      console.error(`❌ [ButtonLock] Error en operación para ${buttonId}:`, error);
      throw error;
    } finally {
      // Asegurar que el botón se desbloquee al final
      this.unlockButton(buttonId);
    }
  }

  /**
   * Limpia todos los bloqueos (útil para cleanup)
   */
  clearAllLocks(): void {
    this.lockedButtons.forEach((timeout, buttonId) => {
      clearTimeout(timeout);
      console.log(`🧹 [ButtonLock] Limpiando lock de ${buttonId}`);
    });
    
    this.lockedButtons.clear();
    this.updateOperationsInProgress();
  }

  /**
   * Obtiene estadísticas de bloqueos activos
   */
  getStats(): { activeLocksCount: number, lockedButtons: string[] } {
    return {
      activeLocksCount: this.lockedButtons.size,
      lockedButtons: Array.from(this.lockedButtons.keys())
    };
  }

  /**
   * Actualiza el observable de operaciones en progreso
   */
  private updateOperationsInProgress(): void {
    const currentOperations = new Set(this.lockedButtons.keys());
    this.operationsInProgress.next(currentOperations);
  }
}
