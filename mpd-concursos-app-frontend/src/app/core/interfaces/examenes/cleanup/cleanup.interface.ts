export interface ICleanupService {
  /**
   * Limpia todos los recursos asociados al servicio
   */
  cleanup(): void;

  /**
   * Reinicia el estado del servicio a sus valores iniciales
   */
  reset(): void;
}
