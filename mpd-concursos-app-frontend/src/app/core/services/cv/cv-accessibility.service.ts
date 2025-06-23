/**
 * Servicio de Accesibilidad para el Sistema CV
 * 
 * @description Maneja funcionalidades de accesibilidad, navegación por teclado y ARIA
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Injectable, signal, computed, inject, DOCUMENT } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

import { CvPreferencesService } from './cv-preferences.service';
import { CvNotificationService } from './cv-notification.service';

/**
 * Configuración de accesibilidad
 */
export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableFocusTrapping: boolean;
  enableAriaLiveRegions: boolean;
  keyboardShortcuts: KeyboardShortcuts;
  contrastRatio: 'AA' | 'AAA';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  announceChanges: boolean;
}

/**
 * Atajos de teclado
 */
export interface KeyboardShortcuts {
  search: string;
  clearFilters: string;
  nextResult: string;
  previousResult: string;
  openPreferences: string;
  saveFilter: string;
  exportResults: string;
  toggleFilters: string;
}

/**
 * Estado de navegación
 */
export interface NavigationState {
  currentFocusIndex: number;
  focusableElements: HTMLElement[];
  isNavigating: boolean;
  lastFocusedElement: HTMLElement | null;
  navigationMode: 'mouse' | 'keyboard' | 'screen-reader';
}

/**
 * Configuración de anuncios
 */
export interface AnnouncementConfig {
  type: 'polite' | 'assertive' | 'off';
  message: string;
  delay?: number;
  clear?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CvAccessibilityService {
  // ===== SERVICIOS INYECTADOS =====
  private readonly document = inject(DOCUMENT);
  private readonly preferencesService = inject(CvPreferencesService);
  private readonly notificationService = inject(CvNotificationService);

  // ===== CONFIGURACIÓN POR DEFECTO =====
  private readonly defaultConfig: AccessibilityConfig = {
    enableKeyboardNavigation: true,
    enableScreenReaderSupport: true,
    enableHighContrast: false,
    enableReducedMotion: false,
    enableFocusTrapping: true,
    enableAriaLiveRegions: true,
    keyboardShortcuts: {
      search: 'Ctrl+F',
      clearFilters: 'Ctrl+Shift+C',
      nextResult: 'ArrowDown',
      previousResult: 'ArrowUp',
      openPreferences: 'Ctrl+,',
      saveFilter: 'Ctrl+S',
      exportResults: 'Ctrl+E',
      toggleFilters: 'Ctrl+Shift+F'
    },
    contrastRatio: 'AA',
    fontSize: 'medium',
    announceChanges: true
  };

  // ===== ESTADO REACTIVO =====
  private readonly configSignal = signal<AccessibilityConfig>(this.defaultConfig);
  private readonly navigationStateSignal = signal<NavigationState>({
    currentFocusIndex: -1,
    focusableElements: [],
    isNavigating: false,
    lastFocusedElement: null,
    navigationMode: 'mouse'
  });

  // ===== OBSERVABLES =====
  private readonly keyboardEvents$ = fromEvent<KeyboardEvent>(this.document, 'keydown');
  private readonly focusEvents$ = merge(
    fromEvent<FocusEvent>(this.document, 'focusin'),
    fromEvent<FocusEvent>(this.document, 'focusout')
  );

  // ===== ELEMENTOS ARIA =====
  private liveRegionPolite: HTMLElement | null = null;
  private liveRegionAssertive: HTMLElement | null = null;

  // ===== GETTERS PÚBLICOS =====
  public readonly config = this.configSignal.asReadonly();
  public readonly navigationState = this.navigationStateSignal.asReadonly();

  // ===== COMPUTED SIGNALS =====
  public readonly isKeyboardNavigationEnabled = computed(() => 
    this.config().enableKeyboardNavigation
  );
  public readonly isScreenReaderSupported = computed(() => 
    this.config().enableScreenReaderSupport
  );
  public readonly currentFontSize = computed(() => this.config().fontSize);
  public readonly isHighContrastEnabled = computed(() => this.config().enableHighContrast);

  constructor() {
    this.initializeAccessibility();
    this.setupKeyboardNavigation();
    this.setupAriaLiveRegions();
    this.detectUserPreferences();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Actualiza la configuración de accesibilidad
   */
  updateConfig(config: Partial<AccessibilityConfig>): void {
    const currentConfig = this.configSignal();
    const newConfig = { ...currentConfig, ...config };
    this.configSignal.set(newConfig);
    this.applyAccessibilitySettings(newConfig);
  }

  /**
   * Anuncia un mensaje a lectores de pantalla
   */
  announce(config: AnnouncementConfig): void {
    if (!this.config().enableAriaLiveRegions) return;

    const { type, message, delay = 0, clear = false } = config;
    
    setTimeout(() => {
      const liveRegion = type === 'assertive' ? this.liveRegionAssertive : this.liveRegionPolite;
      
      if (liveRegion) {
        if (clear) {
          liveRegion.textContent = '';
          setTimeout(() => {
            liveRegion.textContent = message;
          }, 100);
        } else {
          liveRegion.textContent = message;
        }
      }
    }, delay);
  }

  /**
   * Configura navegación por teclado para un contenedor
   */
  setupKeyboardNavigationForContainer(container: HTMLElement): void {
    if (!this.config().enableKeyboardNavigation) return;

    const focusableElements = this.getFocusableElements(container);
    
    this.navigationStateSignal.update(state => ({
      ...state,
      focusableElements
    }));

    // Configurar event listeners
    container.addEventListener('keydown', (event) => {
      this.handleContainerKeydown(event, focusableElements);
    });
  }

  /**
   * Maneja navegación con flechas
   */
  handleArrowNavigation(event: KeyboardEvent, elements: HTMLElement[]): void {
    if (!this.config().enableKeyboardNavigation) return;

    const currentState = this.navigationState();
    let newIndex = currentState.currentFocusIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = Math.min(elements.length - 1, newIndex + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = Math.max(0, newIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = elements.length - 1;
        break;
    }

    if (newIndex !== currentState.currentFocusIndex && elements[newIndex]) {
      this.focusElement(elements[newIndex], newIndex);
    }
  }

  /**
   * Enfoca un elemento y actualiza el estado
   */
  focusElement(element: HTMLElement, index?: number): void {
    element.focus();
    
    this.navigationStateSignal.update(state => ({
      ...state,
      currentFocusIndex: index ?? state.focusableElements.indexOf(element),
      lastFocusedElement: element,
      isNavigating: true,
      navigationMode: 'keyboard'
    }));

    // Anunciar el elemento enfocado
    this.announceElementFocus(element);
  }

  /**
   * Configura trampa de foco para modales
   */
  setupFocusTrap(container: HTMLElement): () => void {
    if (!this.config().enableFocusTrapping) return () => {};

    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (this.document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (this.document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeydown);
    firstElement?.focus();

    // Retornar función de limpieza
    return () => {
      container.removeEventListener('keydown', handleKeydown);
    };
  }

  /**
   * Configura atributos ARIA para un elemento
   */
  setupAriaAttributes(element: HTMLElement, config: {
    role?: string;
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: string;
  }): void {
    const { role, label, describedBy, expanded, selected, disabled, live, atomic, relevant } = config;

    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    if (describedBy) element.setAttribute('aria-describedby', describedBy);
    if (expanded !== undefined) element.setAttribute('aria-expanded', expanded.toString());
    if (selected !== undefined) element.setAttribute('aria-selected', selected.toString());
    if (disabled !== undefined) element.setAttribute('aria-disabled', disabled.toString());
    if (live) element.setAttribute('aria-live', live);
    if (atomic !== undefined) element.setAttribute('aria-atomic', atomic.toString());
    if (relevant) element.setAttribute('aria-relevant', relevant);
  }

  /**
   * Mejora el contraste de colores
   */
  toggleHighContrast(enable?: boolean): void {
    const shouldEnable = enable ?? !this.config().enableHighContrast;
    
    this.updateConfig({ enableHighContrast: shouldEnable });
    
    if (shouldEnable) {
      this.document.body.classList.add('high-contrast');
      this.announce({
        type: 'polite',
        message: 'Modo de alto contraste activado'
      });
    } else {
      this.document.body.classList.remove('high-contrast');
      this.announce({
        type: 'polite',
        message: 'Modo de alto contraste desactivado'
      });
    }
  }

  /**
   * Cambia el tamaño de fuente
   */
  setFontSize(size: AccessibilityConfig['fontSize']): void {
    this.updateConfig({ fontSize: size });
    
    // Remover clases anteriores
    this.document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    
    // Agregar nueva clase
    this.document.body.classList.add(`font-${size}`);
    
    this.announce({
      type: 'polite',
      message: `Tamaño de fuente cambiado a ${size}`
    });
  }

  /**
   * Detecta si el usuario usa lector de pantalla
   */
  detectScreenReader(): boolean {
    // Detectar lectores de pantalla comunes
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaders = ['nvda', 'jaws', 'voiceover', 'talkback', 'orca'];
    
    return screenReaders.some(sr => userAgent.includes(sr)) ||
           'speechSynthesis' in window ||
           navigator.maxTouchPoints > 0;
  }

  /**
   * Obtiene información de accesibilidad del elemento
   */
  getElementAccessibilityInfo(element: HTMLElement): {
    hasLabel: boolean;
    hasDescription: boolean;
    isKeyboardAccessible: boolean;
    hasProperRole: boolean;
    contrastRatio?: number;
  } {
    return {
      hasLabel: !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
      hasDescription: !!element.getAttribute('aria-describedby'),
      isKeyboardAccessible: element.tabIndex >= 0 || this.isNativelyFocusable(element),
      hasProperRole: !!element.getAttribute('role'),
      // contrastRatio se calcularía con una librería específica
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializa la accesibilidad
   */
  private initializeAccessibility(): void {
    // Aplicar configuración inicial
    this.applyAccessibilitySettings(this.config());
    
    // Detectar preferencias del sistema
    this.detectUserPreferences();
  }

  /**
   * Configura navegación por teclado global
   */
  private setupKeyboardNavigation(): void {
    this.keyboardEvents$.pipe(
      filter(() => this.config().enableKeyboardNavigation),
      debounceTime(10)
    ).subscribe(event => {
      this.handleGlobalKeydown(event);
    });

    this.focusEvents$.subscribe(event => {
      this.handleFocusChange(event);
    });
  }

  /**
   * Configura regiones ARIA live
   */
  private setupAriaLiveRegions(): void {
    if (!this.config().enableAriaLiveRegions) return;

    // Crear región polite
    this.liveRegionPolite = this.document.createElement('div');
    this.liveRegionPolite.setAttribute('aria-live', 'polite');
    this.liveRegionPolite.setAttribute('aria-atomic', 'true');
    this.liveRegionPolite.className = 'sr-only';
    this.document.body.appendChild(this.liveRegionPolite);

    // Crear región assertive
    this.liveRegionAssertive = this.document.createElement('div');
    this.liveRegionAssertive.setAttribute('aria-live', 'assertive');
    this.liveRegionAssertive.setAttribute('aria-atomic', 'true');
    this.liveRegionAssertive.className = 'sr-only';
    this.document.body.appendChild(this.liveRegionAssertive);
  }

  /**
   * Detecta preferencias del usuario
   */
  private detectUserPreferences(): void {
    // Detectar preferencia de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.updateConfig({ enableReducedMotion: true });
    }

    // Detectar preferencia de alto contraste
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.updateConfig({ enableHighContrast: true });
    }

    // Detectar lector de pantalla
    if (this.detectScreenReader()) {
      this.updateConfig({ enableScreenReaderSupport: true });
    }
  }

  /**
   * Aplica configuraciones de accesibilidad
   */
  private applyAccessibilitySettings(config: AccessibilityConfig): void {
    const body = this.document.body;

    // Aplicar clases CSS
    body.classList.toggle('high-contrast', config.enableHighContrast);
    body.classList.toggle('reduced-motion', config.enableReducedMotion);
    body.classList.toggle('keyboard-navigation', config.enableKeyboardNavigation);
    
    // Aplicar tamaño de fuente
    body.className = body.className.replace(/font-(small|medium|large|extra-large)/g, '');
    body.classList.add(`font-${config.fontSize}`);
  }

  /**
   * Maneja teclas globales
   */
  private handleGlobalKeydown(event: KeyboardEvent): void {
    const shortcuts = this.config().keyboardShortcuts;
    const key = this.getKeyboardShortcut(event);

    // Manejar atajos de teclado
    Object.entries(shortcuts).forEach(([action, shortcut]) => {
      if (key === shortcut) {
        event.preventDefault();
        this.executeShortcutAction(action);
      }
    });
  }

  /**
   * Maneja cambios de foco
   */
  private handleFocusChange(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    if (event.type === 'focusin') {
      this.navigationStateSignal.update(state => ({
        ...state,
        lastFocusedElement: target,
        navigationMode: event.detail === 0 ? 'keyboard' : 'mouse'
      }));
    }
  }

  /**
   * Maneja keydown en contenedores
   */
  private handleContainerKeydown(event: KeyboardEvent, elements: HTMLElement[]): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        this.handleArrowNavigation(event, elements);
        break;
    }
  }

  /**
   * Obtiene elementos enfocables
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Verifica si un elemento es naturalmente enfocable
   */
  private isNativelyFocusable(element: HTMLElement): boolean {
    const focusableTags = ['button', 'input', 'select', 'textarea', 'a'];
    return focusableTags.includes(element.tagName.toLowerCase()) &&
           !element.hasAttribute('disabled');
  }

  /**
   * Anuncia el elemento enfocado
   */
  private announceElementFocus(element: HTMLElement): void {
    if (!this.config().announceChanges) return;

    const label = element.getAttribute('aria-label') ||
                  element.getAttribute('title') ||
                  element.textContent?.trim() ||
                  element.tagName.toLowerCase();

    if (label) {
      this.announce({
        type: 'polite',
        message: `Enfocado: ${label}`,
        delay: 100
      });
    }
  }

  /**
   * Obtiene atajo de teclado del evento
   */
  private getKeyboardShortcut(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    
    if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt' && event.key !== 'Meta') {
      parts.push(event.key);
    }
    
    return parts.join('+');
  }

  /**
   * Ejecuta acción de atajo de teclado
   */
  private executeShortcutAction(action: string): void {
    // Emitir evento personalizado para que los componentes puedan escuchar
    const event = new CustomEvent(`cv-shortcut-${action}`, {
      detail: { action }
    });
    this.document.dispatchEvent(event);

    // Anunciar la acción
    this.announce({
      type: 'polite',
      message: `Ejecutando: ${action}`
    });
  }
}
