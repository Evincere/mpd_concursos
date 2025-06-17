import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Interfaz para las preferencias de accesibilidad del usuario
 */
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  reducedTransparency: boolean;
  forcedColors: boolean;
  darkMode: boolean;
}

/**
 * Servicio para gestionar las preferencias de accesibilidad del usuario
 * Detecta automáticamente las preferencias del sistema y proporciona
 * métodos para aplicar configuraciones de accesibilidad
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityPreferencesService {
  
  // Signals para preferencias reactivas
  private readonly _reducedMotion = signal(false);
  private readonly _highContrast = signal(false);
  private readonly _reducedTransparency = signal(false);
  private readonly _forcedColors = signal(false);
  private readonly _darkMode = signal(false);
  
  // Getters públicos para las preferencias
  public readonly reducedMotion = this._reducedMotion.asReadonly();
  public readonly highContrast = this._highContrast.asReadonly();
  public readonly reducedTransparency = this._reducedTransparency.asReadonly();
  public readonly forcedColors = this._forcedColors.asReadonly();
  public readonly darkMode = this._darkMode.asReadonly();
  
  // Computed signal para todas las preferencias
  public readonly preferences = computed<AccessibilityPreferences>(() => ({
    reducedMotion: this._reducedMotion(),
    highContrast: this._highContrast(),
    reducedTransparency: this._reducedTransparency(),
    forcedColors: this._forcedColors(),
    darkMode: this._darkMode()
  }));
  
  // Media queries
  private readonly mediaQueries = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    highContrast: window.matchMedia('(prefers-contrast: high)'),
    reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)'),
    forcedColors: window.matchMedia('(forced-colors: active)'),
    darkMode: window.matchMedia('(prefers-color-scheme: dark)')
  };
  
  constructor() {
    this.initializePreferences();
    this.setupMediaQueryListeners();
    this.applyPreferencesToDOM();
  }
  
  /**
   * Inicializa las preferencias basadas en las media queries actuales
   */
  private initializePreferences(): void {
    this._reducedMotion.set(this.mediaQueries.reducedMotion.matches);
    this._highContrast.set(this.mediaQueries.highContrast.matches);
    this._reducedTransparency.set(this.mediaQueries.reducedTransparency.matches);
    this._forcedColors.set(this.mediaQueries.forcedColors.matches);
    this._darkMode.set(this.mediaQueries.darkMode.matches);
  }
  
  /**
   * Configura los listeners para cambios en las media queries
   */
  private setupMediaQueryListeners(): void {
    // Listener para reduced motion
    this.mediaQueries.reducedMotion.addEventListener('change', (e) => {
      this._reducedMotion.set(e.matches);
      this.applyReducedMotionToDOM(e.matches);
    });
    
    // Listener para high contrast
    this.mediaQueries.highContrast.addEventListener('change', (e) => {
      this._highContrast.set(e.matches);
      this.applyHighContrastToDOM(e.matches);
    });
    
    // Listener para reduced transparency
    this.mediaQueries.reducedTransparency.addEventListener('change', (e) => {
      this._reducedTransparency.set(e.matches);
      this.applyReducedTransparencyToDOM(e.matches);
    });
    
    // Listener para forced colors
    this.mediaQueries.forcedColors.addEventListener('change', (e) => {
      this._forcedColors.set(e.matches);
      this.applyForcedColorsToDOM(e.matches);
    });
    
    // Listener para dark mode
    this.mediaQueries.darkMode.addEventListener('change', (e) => {
      this._darkMode.set(e.matches);
      this.applyDarkModeToDOM(e.matches);
    });
  }
  
  /**
   * Aplica las preferencias actuales al DOM
   */
  private applyPreferencesToDOM(): void {
    this.applyReducedMotionToDOM(this._reducedMotion());
    this.applyHighContrastToDOM(this._highContrast());
    this.applyReducedTransparencyToDOM(this._reducedTransparency());
    this.applyForcedColorsToDOM(this._forcedColors());
    this.applyDarkModeToDOM(this._darkMode());
  }
  
  /**
   * Aplica configuración de reduced motion al DOM
   */
  private applyReducedMotionToDOM(enabled: boolean): void {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('reduced-motion');
      root.style.setProperty('--animation-duration-multiplier', '0');
      root.style.setProperty('--transition-duration-multiplier', '0');
    } else {
      root.classList.remove('reduced-motion');
      root.style.setProperty('--animation-duration-multiplier', '1');
      root.style.setProperty('--transition-duration-multiplier', '1');
    }
  }
  
  /**
   * Aplica configuración de high contrast al DOM
   */
  private applyHighContrastToDOM(enabled: boolean): void {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }
  
  /**
   * Aplica configuración de reduced transparency al DOM
   */
  private applyReducedTransparencyToDOM(enabled: boolean): void {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('reduced-transparency');
      root.style.setProperty('--backdrop-blur-multiplier', '0');
      root.style.setProperty('--opacity-multiplier', '1');
    } else {
      root.classList.remove('reduced-transparency');
      root.style.setProperty('--backdrop-blur-multiplier', '1');
      root.style.setProperty('--opacity-multiplier', '1');
    }
  }
  
  /**
   * Aplica configuración de forced colors al DOM
   */
  private applyForcedColorsToDOM(enabled: boolean): void {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('forced-colors');
    } else {
      root.classList.remove('forced-colors');
    }
  }
  
  /**
   * Aplica configuración de dark mode al DOM
   */
  private applyDarkModeToDOM(enabled: boolean): void {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('dark-mode-preferred');
    } else {
      root.classList.remove('dark-mode-preferred');
    }
  }
  
  /**
   * Verifica si las animaciones deben estar deshabilitadas
   */
  public shouldDisableAnimations(): boolean {
    return this._reducedMotion();
  }
  
  /**
   * Verifica si las transiciones deben estar deshabilitadas
   */
  public shouldDisableTransitions(): boolean {
    return this._reducedMotion();
  }
  
  /**
   * Verifica si el blur debe estar reducido
   */
  public shouldReduceBlur(): boolean {
    return this._reducedTransparency();
  }
  
  /**
   * Obtiene la duración de animación ajustada según las preferencias
   */
  public getAdjustedAnimationDuration(baseDuration: number): number {
    return this._reducedMotion() ? 0 : baseDuration;
  }
  
  /**
   * Obtiene la duración de transición ajustada según las preferencias
   */
  public getAdjustedTransitionDuration(baseDuration: number): number {
    return this._reducedMotion() ? 0 : baseDuration;
  }
  
  /**
   * Aplica configuraciones de accesibilidad a un elemento específico
   */
  public applyToElement(element: HTMLElement, options: {
    disableAnimations?: boolean;
    disableTransitions?: boolean;
    reduceBlur?: boolean;
  } = {}): void {
    const {
      disableAnimations = true,
      disableTransitions = true,
      reduceBlur = true
    } = options;
    
    if (disableAnimations && this._reducedMotion()) {
      element.style.setProperty('animation', 'none', 'important');
    }
    
    if (disableTransitions && this._reducedMotion()) {
      element.style.setProperty('transition', 'none', 'important');
    }
    
    if (reduceBlur && this._reducedTransparency()) {
      element.style.setProperty('backdrop-filter', 'none', 'important');
      element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    }
  }
}
