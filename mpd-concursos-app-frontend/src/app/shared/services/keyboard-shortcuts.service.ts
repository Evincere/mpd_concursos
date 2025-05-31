import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationService } from './navigation.service';
import { LoaderService } from './loader.service';

/**
 * Interfaz para definir un atajo de teclado
 */
export interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
  global?: boolean;
}

/**
 * Servicio para gestionar atajos de teclado en la aplicación.
 * Permite registrar, eliminar y ejecutar atajos de teclado.
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService implements OnDestroy {
  private shortcuts: KeyboardShortcut[] = [];
  private destroy$ = new Subject<void>();
  private enabled = true;
  
  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private loaderService: LoaderService
  ) {
    // Suscribirse a eventos de teclado
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (this.enabled) {
          this.handleKeyDown(event);
        }
      });
    
    // Registrar atajos de teclado globales
    this.registerGlobalShortcuts();
  }
  
  /**
   * Registra un nuevo atajo de teclado
   * @param shortcut Atajo de teclado a registrar
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    // Verificar si ya existe un atajo con la misma combinación de teclas
    const exists = this.shortcuts.some(s => 
      s.key === shortcut.key &&
      s.altKey === shortcut.altKey &&
      s.ctrlKey === shortcut.ctrlKey &&
      s.shiftKey === shortcut.shiftKey
    );
    
    if (!exists) {
      this.shortcuts.push(shortcut);
    } else {
      console.warn(`Shortcut already exists: ${this.getShortcutDescription(shortcut)}`);
    }
  }
  
  /**
   * Elimina un atajo de teclado
   * @param shortcut Atajo de teclado a eliminar
   */
  unregisterShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts = this.shortcuts.filter(s => 
      !(s.key === shortcut.key &&
        s.altKey === shortcut.altKey &&
        s.ctrlKey === shortcut.ctrlKey &&
        s.shiftKey === shortcut.shiftKey)
    );
  }
  
  /**
   * Habilita o deshabilita los atajos de teclado
   * @param enabled true para habilitar, false para deshabilitar
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Obtiene todos los atajos de teclado registrados
   * @returns Lista de atajos de teclado
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }
  
  /**
   * Obtiene una descripción legible de un atajo de teclado
   * @param shortcut Atajo de teclado
   * @returns Descripción legible
   */
  getShortcutDescription(shortcut: KeyboardShortcut): string {
    const modifiers = [];
    
    if (shortcut.ctrlKey) {
      modifiers.push('Ctrl');
    }
    
    if (shortcut.altKey) {
      modifiers.push('Alt');
    }
    
    if (shortcut.shiftKey) {
      modifiers.push('Shift');
    }
    
    const key = shortcut.key.toUpperCase();
    
    return [...modifiers, key].join(' + ');
  }
  
  /**
   * Limpia todos los atajos de teclado registrados
   */
  clearShortcuts(): void {
    this.shortcuts = [];
    this.registerGlobalShortcuts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Maneja eventos de teclado
   * @param event Evento de teclado
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Ignorar eventos en campos de texto
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    
    // Buscar atajos que coincidan con la combinación de teclas
    const matchingShortcuts = this.shortcuts.filter(shortcut => 
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.altKey === event.altKey &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.shiftKey === event.shiftKey
    );
    
    if (matchingShortcuts.length > 0) {
      event.preventDefault();
      
      // Ejecutar la acción del primer atajo que coincida
      matchingShortcuts[0].action();
    }
  }
  
  /**
   * Registra atajos de teclado globales
   */
  private registerGlobalShortcuts(): void {
    // Navegación hacia atrás
    this.registerShortcut({
      key: 'ArrowLeft',
      altKey: true,
      description: 'Navegar hacia atrás',
      global: true,
      action: () => {
        this.navigationService.goBack();
      }
    });
    
    // Navegación hacia adelante
    this.registerShortcut({
      key: 'ArrowRight',
      altKey: true,
      description: 'Navegar hacia adelante',
      global: true,
      action: () => {
        this.navigationService.goForward();
      }
    });
    
    // Ir al dashboard
    this.registerShortcut({
      key: 'h',
      altKey: true,
      description: 'Ir al dashboard',
      global: true,
      action: () => {
        this.router.navigate(['/admin/dashboard']);
      }
    });
    
    // Alternar entre vista de administrador y usuario
    this.registerShortcut({
      key: 'u',
      altKey: true,
      description: 'Alternar entre vista de administrador y usuario',
      global: true,
      action: () => {
        this.router.navigate(['/dashboard']);
      }
    });
    
    // Mostrar ayuda de atajos de teclado
    this.registerShortcut({
      key: '?',
      description: 'Mostrar ayuda de atajos de teclado',
      global: true,
      action: () => {
        // Aquí se podría mostrar un diálogo con la ayuda
        console.log('Atajos de teclado disponibles:', this.shortcuts);
      }
    });
  }
}
