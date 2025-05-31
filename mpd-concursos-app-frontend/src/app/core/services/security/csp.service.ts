import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CSPService {
  private cspEnabled = environment.enableCSP;

  constructor() {
    this.initializeCSP();
  }

  /**
   * Inicializa la política de seguridad de contenido (CSP)
   */
  private initializeCSP(): void {
    if (!this.cspEnabled) {
      console.log('CSP está deshabilitada en este entorno');
      this.removeCSPMeta();
      return;
    }

    // Definir la política de seguridad
    const cspValue = this.getCSPValue();
    
    // Aplicar la política de seguridad
    this.applyCSP(cspValue);
  }

  /**
   * Obtiene el valor de la política de seguridad
   */
  private getCSPValue(): string {
    return "default-src 'self' app:; " +
           "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
           "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
           "img-src 'self' data: https: app: blob:; " +
           "connect-src 'self' * ws: wss: blob: chrome-extension:; " +
           "font-src 'self' https://fonts.gstatic.com; " +
           "worker-src 'self' blob:;";
  }

  /**
   * Aplica la política de seguridad
   */
  private applyCSP(cspValue: string): void {
    // Buscar si ya existe un meta tag de CSP
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    // Si no existe, crear uno nuevo
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    
    // Establecer el valor de la política
    cspMeta.setAttribute('content', cspValue);
    
    console.log('CSP aplicada:', cspValue);
  }

  /**
   * Elimina el meta tag de CSP
   */
  private removeCSPMeta(): void {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      cspMeta.remove();
      console.log('Meta tag de CSP eliminado');
    }
  }
}
