import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { LoggingService } from '../logging/logging.service';

@Injectable({
  providedIn: 'root'
})
export class CSPService {
  private cspEnabled = environment.enableCSP;

  constructor(private loggingService: LoggingService) { // Inject LoggingService
    this.loggingService.debug('[CSPService] Initializing CSPService.', { cspEnabled: this.cspEnabled }, 'CSPService');
    this.initializeCSP();
  }

  /**
   * Initializes the Content Security Policy (CSP).
   */
  private initializeCSP(): void {
    if (!this.cspEnabled) {
      this.loggingService.info('[CSPService] CSP is disabled in environment settings. Skipping initialization.', undefined, 'CSPService');
      return;
    }

    this.loggingService.info('[CSPService] Initializing Content Security Policy (CSP).', undefined, 'CSPService');
    // Define the security policy value
    const cspValue = this.getCSPValue();

    // Apply the security policy
    this.applyCSP(cspValue);
  }

  /**
   * Gets the CSP policy string value.
   * You can customize these directives as needed for your application.
   * Be very careful with 'unsafe-inline' and 'unsafe-eval' in production.
   */
  private getCSPValue(): string {
    const csp = "default-src 'self' app:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // 'unsafe-eval' for JIT compilation, 'unsafe-inline' for inline scripts/styles (Angular might add these)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " + // 'unsafe-inline' for Angular's inline styles + external CDNs
              "img-src 'self' data: https: app: blob:; " +
              "connect-src 'self' * ws: wss: blob: chrome-extension:; " + // '*' for broad API calls, restrict this in production
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " + // Allow Google Fonts and FontAwesome
              "worker-src 'self' blob:;";
    this.loggingService.debug('[CSPService] Generated CSP value:', csp, 'CSPService');
    return csp;
  }

  /**
   * Applies the Content Security Policy to the document by creating or updating a meta tag.
   * @param cspValue The CSP string to apply.
   */
  private applyCSP(cspValue: string): void {
    try {
      // Check if a CSP meta tag already exists
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

      // If it doesn't exist, create a new one
      if (!cspMeta) {
        cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        document.head.appendChild(cspMeta);
        this.loggingService.info('[CSPService] Created new meta tag for Content-Security-Policy.', undefined, 'CSPService');
      } else {
        this.loggingService.debug('[CSPService] Found existing meta tag for Content-Security-Policy. Updating it.', undefined, 'CSPService');
      }

      // Set the content attribute value
      cspMeta.setAttribute('content', cspValue);
      this.loggingService.info('[CSPService] Content-Security-Policy applied successfully.', cspValue, 'CSPService');
    } catch (error) {
      this.loggingService.error('[CSPService] Error applying Content-Security-Policy:', error, 'CSPService');
    }
  }

  /**
   * Removes the Content Security Policy meta tag from the document.
   * This method might be used for testing or dynamic changes, but typically CSP is set once.
   */
  public removeCSP(): void {
    this.loggingService.info('[CSPService] Attempting to remove Content-Security-Policy meta tag.', undefined, 'CSPService');
    try {
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        cspMeta.remove();
        this.loggingService.info('[CSPService] Content-Security-Policy meta tag removed successfully.', undefined, 'CSPService');
      } else {
        this.loggingService.warn('[CSPService] Content-Security-Policy meta tag not found in document head. Nothing to remove.', undefined, 'CSPService');
      }
    } catch (error) {
      this.loggingService.error('[CSPService] Error removing Content-Security-Policy meta tag:', error, 'CSPService');
    }
  }
}
