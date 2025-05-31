import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { KeyboardShortcutsService, KeyboardShortcut } from './keyboard-shortcuts.service';
import { NavigationService } from './navigation.service';
import { LoaderService } from './loader.service';

describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;
  let routerSpy: jasmine.SpyObj<Router>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let loaderServiceSpy: jasmine.SpyObj<LoaderService>;
  let documentSpy: jasmine.SpyObj<Document>;
  let keydownHandler: (event: KeyboardEvent) => void;

  beforeEach(() => {
    // Crear spies para las dependencias
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['goBack', 'goForward']);
    loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    
    // Espiar document.addEventListener para capturar el handler de keydown
    documentSpy = jasmine.createSpyObj('Document', ['addEventListener']);
    documentSpy.addEventListener.and.callFake((event, handler) => {
      if (event === 'keydown') {
        keydownHandler = handler as any;
      }
    });
    
    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutsService,
        { provide: Router, useValue: routerSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: Document, useFactory: () => documentSpy }
      ]
    });
    
    // Inyectar el servicio
    service = TestBed.inject(KeyboardShortcutsService);
    
    // Espiar console.warn para evitar mensajes en la consola durante las pruebas
    spyOn(console, 'warn');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register global shortcuts on initialization', () => {
    // Verificar que hay atajos registrados
    expect(service.getShortcuts().length).toBeGreaterThan(0);
  });

  it('should register a shortcut', () => {
    // Registrar un nuevo atajo
    const shortcut: KeyboardShortcut = {
      key: 'T',
      description: 'Test shortcut',
      action: jasmine.createSpy('action')
    };
    
    service.registerShortcut(shortcut);
    
    // Verificar que el atajo se registró
    const shortcuts = service.getShortcuts();
    expect(shortcuts).toContain(shortcut);
  });

  it('should not register duplicate shortcuts', () => {
    // Registrar un atajo
    const shortcut: KeyboardShortcut = {
      key: 'T',
      description: 'Test shortcut',
      action: jasmine.createSpy('action')
    };
    
    service.registerShortcut(shortcut);
    const countBefore = service.getShortcuts().length;
    
    // Intentar registrar el mismo atajo de nuevo
    service.registerShortcut(shortcut);
    const countAfter = service.getShortcuts().length;
    
    // Verificar que no se registró dos veces
    expect(countAfter).toBe(countBefore);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should unregister a shortcut', () => {
    // Registrar un atajo
    const shortcut: KeyboardShortcut = {
      key: 'T',
      description: 'Test shortcut',
      action: jasmine.createSpy('action')
    };
    
    service.registerShortcut(shortcut);
    
    // Eliminar el atajo
    service.unregisterShortcut(shortcut);
    
    // Verificar que el atajo se eliminó
    const shortcuts = service.getShortcuts();
    expect(shortcuts).not.toContain(shortcut);
  });

  it('should enable and disable shortcuts', () => {
    // Por defecto, los atajos están habilitados
    expect(service['enabled']).toBeTrue();
    
    // Deshabilitar atajos
    service.setEnabled(false);
    expect(service['enabled']).toBeFalse();
    
    // Habilitar atajos
    service.setEnabled(true);
    expect(service['enabled']).toBeTrue();
  });

  it('should get shortcut description', () => {
    // Crear un atajo con modificadores
    const shortcut: KeyboardShortcut = {
      key: 'S',
      ctrlKey: true,
      altKey: true,
      description: 'Test shortcut',
      action: jasmine.createSpy('action')
    };
    
    // Obtener la descripción
    const description = service.getShortcutDescription(shortcut);
    
    // Verificar que la descripción es correcta
    expect(description).toBe('Ctrl + Alt + S');
  });

  it('should clear shortcuts but keep global ones', () => {
    // Registrar un atajo no global
    const shortcut: KeyboardShortcut = {
      key: 'T',
      description: 'Test shortcut',
      action: jasmine.createSpy('action'),
      global: false
    };
    
    service.registerShortcut(shortcut);
    
    // Contar atajos globales antes de limpiar
    const globalShortcutsBefore = service.getShortcuts().filter(s => s.global).length;
    
    // Limpiar atajos
    service.clearShortcuts();
    
    // Verificar que el atajo no global se eliminó
    const shortcuts = service.getShortcuts();
    expect(shortcuts).not.toContain(shortcut);
    
    // Verificar que los atajos globales se mantuvieron
    const globalShortcutsAfter = shortcuts.filter(s => s.global).length;
    expect(globalShortcutsAfter).toBe(globalShortcutsBefore);
  });

  it('should handle keydown events', () => {
    // Verificar que se registró un event listener para keydown
    expect(documentSpy.addEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    
    // Registrar un atajo de prueba
    const actionSpy = jasmine.createSpy('action');
    const shortcut: KeyboardShortcut = {
      key: 't',
      description: 'Test shortcut',
      action: actionSpy
    };
    
    service.registerShortcut(shortcut);
    
    // Simular un evento keydown que coincide con el atajo
    const event = new KeyboardEvent('keydown', {
      key: 't',
      bubbles: true,
      cancelable: true
    });
    
    // Llamar al handler directamente
    keydownHandler(event);
    
    // Verificar que se ejecutó la acción del atajo
    expect(actionSpy).toHaveBeenCalled();
  });

  it('should not handle keydown events in input elements', () => {
    // Registrar un atajo de prueba
    const actionSpy = jasmine.createSpy('action');
    const shortcut: KeyboardShortcut = {
      key: 't',
      description: 'Test shortcut',
      action: actionSpy
    };
    
    service.registerShortcut(shortcut);
    
    // Crear un elemento input
    const input = document.createElement('input');
    
    // Simular un evento keydown en el input
    const event = new KeyboardEvent('keydown', {
      key: 't',
      bubbles: true,
      cancelable: true
    });
    
    // Establecer el target del evento como el input
    Object.defineProperty(event, 'target', { value: input });
    
    // Llamar al handler directamente
    keydownHandler(event);
    
    // Verificar que no se ejecutó la acción del atajo
    expect(actionSpy).not.toHaveBeenCalled();
  });
});
