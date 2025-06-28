import { Injectable } from '@angular/core';

/**
 * Servicio para detectar y solucionar problemas de carga de fuentes
 * Especialmente útil después de hard refresh que puede corromper el cache de fuentes
 */
@Injectable({
  providedIn: 'root'
})
export class FontLoaderService {
  private readonly FONT_CHECK_TIMEOUT = 5000;
  private readonly RETRY_ATTEMPTS = 3;
  private fontsLoaded = false;

  constructor() {
    this.initializeFontLoading();
  }

  /**
   * Inicializa la carga y verificación de fuentes
   */
  private async initializeFontLoading(): Promise<void> {
    try {
      await this.waitForDOMReady();
      await this.loadAndVerifyFonts();
    } catch (error) {
      console.error('[FontLoader] Error initializing fonts:', error);
      this.implementFallbackSolution();
    }
  }

  /**
   * Espera a que el DOM esté listo
   */
  private waitForDOMReady(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Carga y verifica que las fuentes estén disponibles
   */
  private async loadAndVerifyFonts(): Promise<void> {
    console.log('[FontLoader] 🔍 Verificando carga de fuentes...');

    // Verificar Font Awesome (único sistema de iconos necesario)
    const fontAwesomeLoaded = await this.checkFontAwesome();

    if (!fontAwesomeLoaded) {
      console.warn('[FontLoader] ⚠️ Font Awesome no detectado, aplicando solución...');
      await this.reloadFontAwesome();
    }

    if (fontAwesomeLoaded) {
      console.log('[FontLoader] ✅ Font Awesome cargado correctamente');
      this.fontsLoaded = true;
    }
  }

  /**
   * Verifica si Font Awesome está cargado
   */
  private async checkFontAwesome(): Promise<boolean> {
    return new Promise((resolve) => {
      const testElement = document.createElement('i');
      testElement.className = 'fas fa-home';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.fontSize = '16px';
      
      document.body.appendChild(testElement);

      // Verificar después de un breve delay
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(testElement, '::before');
        const content = computedStyle.getPropertyValue('content');
        const fontFamily = computedStyle.getPropertyValue('font-family');
        
        document.body.removeChild(testElement);
        
        // Font Awesome carga si hay contenido en ::before y la fuente es correcta
        const isLoaded = !!(content && content !== 'none' && content !== '""' &&
                           fontFamily.includes('Font Awesome'));

        console.log('[FontLoader] Font Awesome check:', { content, fontFamily, isLoaded });
        resolve(isLoaded);
      }, 100);
    });
  }

  /**
   * Verifica si Material Icons está cargado
   */
  private async checkMaterialIcons(): Promise<boolean> {
    return new Promise((resolve) => {
      const testElement = document.createElement('span');
      testElement.className = 'material-icons';
      testElement.textContent = 'home';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      
      document.body.appendChild(testElement);

      setTimeout(() => {
        const computedStyle = window.getComputedStyle(testElement);
        const fontFamily = computedStyle.getPropertyValue('font-family');
        
        document.body.removeChild(testElement);
        
        const isLoaded = !!fontFamily.includes('Material Icons');
        console.log('[FontLoader] Material Icons check:', { fontFamily, isLoaded });
        resolve(isLoaded);
      }, 100);
    });
  }

  /**
   * Recarga Font Awesome forzando el cache
   */
  private async reloadFontAwesome(): Promise<void> {
    console.log('[FontLoader] 🔄 Recargando Font Awesome...');
    
    // Remover enlaces existentes
    const existingLinks = document.querySelectorAll('link[href*="fontawesome"], link[href*="font-awesome"]');
    existingLinks.forEach(link => link.remove());

    // Crear nuevo enlace con cache-busting
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/assets/fontawesome/css/all.min.css?v=${Date.now()}`;
    link.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      link.onload = () => {
        console.log('[FontLoader] ✅ Font Awesome recargado exitosamente');
        resolve();
      };
      
      link.onerror = () => {
        console.error('[FontLoader] ❌ Error recargando Font Awesome');
        reject(new Error('Failed to reload Font Awesome'));
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Recarga Material Icons forzando el cache
   */
  private async reloadMaterialIcons(): Promise<void> {
    console.log('[FontLoader] 🔄 Recargando Material Icons...');
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/assets/material-icons/material-icons.css?v=${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      link.onload = () => {
        console.log('[FontLoader] ✅ Material Icons recargado exitosamente');
        resolve();
      };
      
      link.onerror = () => {
        console.error('[FontLoader] ❌ Error recargando Material Icons');
        reject(new Error('Failed to reload Material Icons'));
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Implementa una solución de fallback usando Unicode
   */
  private implementFallbackSolution(): void {
    console.log('[FontLoader] 🛠️ Implementando solución de fallback...');
    
    // Mapeo de iconos a Unicode como fallback
    const iconFallbacks: Record<string, string> = {
      'fas fa-home': '🏠',
      'fas fa-gavel': '⚖️',
      'fas fa-user': '👤',
      'fas fa-cog': '⚙️',
      'fas fa-bell': '🔔',
      'fas fa-search': '🔍',
      'fas fa-plus': '➕',
      'fas fa-edit': '✏️',
      'fas fa-trash': '🗑️',
      'fas fa-download': '⬇️',
      'fas fa-upload': '⬆️',
      'fas fa-check': '✅',
      'fas fa-times': '❌',
      'fas fa-arrow-left': '←',
      'fas fa-arrow-right': '→',
      'material-icons': '📄'
    };

    // Aplicar fallbacks
    Object.entries(iconFallbacks).forEach(([className, unicode]) => {
      const elements = document.querySelectorAll(`.${className.replace(' ', '.')}`);
      elements.forEach(element => {
        if (!element.textContent || element.textContent.trim() === '') {
          element.textContent = unicode;
          element.setAttribute('data-fallback', 'true');
        }
      });
    });
  }

  /**
   * Fuerza la recarga de todas las fuentes
   */
  public async forceReloadFonts(): Promise<void> {
    console.log('[FontLoader] 🔄 Forzando recarga de todas las fuentes...');
    
    try {
      await Promise.all([
        this.reloadFontAwesome(),
        this.reloadMaterialIcons()
      ]);
      
      // Verificar nuevamente después de la recarga
      setTimeout(() => {
        this.loadAndVerifyFonts();
      }, 500);
      
    } catch (error) {
      console.error('[FontLoader] Error en recarga forzada:', error);
      this.implementFallbackSolution();
    }
  }

  /**
   * Verifica si las fuentes están cargadas
   */
  public areFontsLoaded(): boolean {
    return this.fontsLoaded;
  }
}
