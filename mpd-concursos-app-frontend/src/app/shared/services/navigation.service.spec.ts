import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NavigationService } from './navigation.service';
import { Subject } from 'rxjs';

describe('NavigationService', () => {
  let service: NavigationService;
  let locationSpy: jasmine.SpyObj<Location>;
  let routerSpy: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    // Crear spies para Location y Router
    locationSpy = jasmine.createSpyObj('Location', ['back', 'forward']);
    
    routerEventsSubject = new Subject<any>();
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    Object.defineProperty(routerSpy, 'events', {
      get: () => routerEventsSubject.asObservable()
    });

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Location, useValue: locationSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    // Espiar sessionStorage
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    spyOn(sessionStorage, 'setItem');
    
    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have recentHistory$ observable', () => {
    expect(service.recentHistory$).toBeTruthy();
  });

  it('should have currentUrl$ observable', () => {
    expect(service.currentUrl$).toBeTruthy();
  });

  it('should initialize history from sessionStorage if available', () => {
    // Simular que hay un historial guardado en sessionStorage
    const savedHistory = {
      history: [
        { url: '/test1', timestamp: 1000 },
        { url: '/test2', timestamp: 2000 }
      ],
      currentIndex: 1
    };
    
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(savedHistory));
    
    // Crear una nueva instancia del servicio para que lea el sessionStorage
    const newService = TestBed.inject(NavigationService);
    
    // Verificar que el historial se cargó correctamente
    expect(newService.getHistory().length).toBe(2);
    expect(newService.getHistory()[0].url).toBe('/test1');
    expect(newService.getHistory()[1].url).toBe('/test2');
  });

  it('should handle navigation events', () => {
    // Simular un evento de navegación
    const url = '/test-url';
    routerEventsSubject.next(new NavigationEnd(1, url, url));
    
    // Verificar que se agregó al historial
    expect(service.getHistory().length).toBe(1);
    expect(service.getHistory()[0].url).toBe(url);
    
    // Verificar que se actualizó currentUrl$
    service.currentUrl$.subscribe(currentUrl => {
      expect(currentUrl).toBe(url);
    });
  });

  it('should go back in history', () => {
    // Simular que hay historial
    spyOn<any>(service, 'canGoBack').and.returnValue(true);
    
    // Llamar a goBack
    const result = service.goBack();
    
    // Verificar que se llamó a location.back
    expect(locationSpy.back).toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  it('should not go back if there is no history', () => {
    // Simular que no hay historial
    spyOn<any>(service, 'canGoBack').and.returnValue(false);
    
    // Llamar a goBack
    const result = service.goBack();
    
    // Verificar que no se llamó a location.back
    expect(locationSpy.back).not.toHaveBeenCalled();
    expect(result).toBeFalse();
  });

  it('should go forward in history', () => {
    // Simular que hay historial hacia adelante
    spyOn<any>(service, 'canGoForward').and.returnValue(true);
    
    // Llamar a goForward
    const result = service.goForward();
    
    // Verificar que se llamó a location.forward
    expect(locationSpy.forward).toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  it('should not go forward if there is no forward history', () => {
    // Simular que no hay historial hacia adelante
    spyOn<any>(service, 'canGoForward').and.returnValue(false);
    
    // Llamar a goForward
    const result = service.goForward();
    
    // Verificar que no se llamó a location.forward
    expect(locationSpy.forward).not.toHaveBeenCalled();
    expect(result).toBeFalse();
  });

  it('should navigate to a URL', () => {
    // Llamar a navigateTo
    const url = '/test-url';
    service.navigateTo(url);
    
    // Verificar que se llamó a router.navigateByUrl
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(url);
  });

  it('should get recent history', () => {
    // Simular navegación a varias URLs
    routerEventsSubject.next(new NavigationEnd(1, '/url1', '/url1'));
    routerEventsSubject.next(new NavigationEnd(2, '/url2', '/url2'));
    routerEventsSubject.next(new NavigationEnd(3, '/url3', '/url3'));
    
    // Obtener historial reciente
    const recentHistory = service.getRecentHistory();
    
    // Verificar que se devuelven las URLs más recientes primero
    expect(recentHistory.length).toBe(3);
    expect(recentHistory[0].url).toBe('/url3');
    expect(recentHistory[1].url).toBe('/url2');
    expect(recentHistory[2].url).toBe('/url1');
  });

  it('should clear history', () => {
    // Simular navegación a varias URLs
    routerEventsSubject.next(new NavigationEnd(1, '/url1', '/url1'));
    routerEventsSubject.next(new NavigationEnd(2, '/url2', '/url2'));
    
    // Limpiar historial
    service.clearHistory();
    
    // Verificar que el historial está vacío
    expect(service.getHistory().length).toBe(0);
  });

  it('should save history to sessionStorage', () => {
    // Simular navegación a una URL
    routerEventsSubject.next(new NavigationEnd(1, '/url1', '/url1'));
    
    // Verificar que se llamó a sessionStorage.setItem
    expect(sessionStorage.setItem).toHaveBeenCalled();
    
    // Verificar que se guardó el historial correcto
    const savedData = JSON.parse((sessionStorage.setItem as jasmine.Spy).calls.mostRecent().args[1]);
    expect(savedData.history.length).toBe(1);
    expect(savedData.history[0].url).toBe('/url1');
    expect(savedData.currentIndex).toBe(0);
  });
});
