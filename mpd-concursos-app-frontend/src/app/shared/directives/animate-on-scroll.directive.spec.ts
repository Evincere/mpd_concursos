import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnimateOnScrollDirective } from './animate-on-scroll.directive';
import { AnimationService } from '../services/animation.service';
import { AnimationFactory, AnimationPlayer } from '@angular/animations';
import { NgZone } from '@angular/core';

// Componente de prueba
@Component({
  template: `
    <div
      [appAnimateOnScroll]="animationType"
      [animationDuration]="duration"
      [animationDelay]="delay"
      [threshold]="threshold"
      [once]="once">
      Test content
    </div>
  `
})
class TestComponent {
  animationType: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInTop' | 'slideInBottom' | 'scaleIn' | 'pulse' = 'fadeIn';
  duration = 300;
  delay = 0;
  threshold = 0.2;
  once = true;
}

describe('AnimateOnScrollDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveElement: DebugElement;
  let directive: AnimateOnScrollDirective;
  let animationServiceSpy: jasmine.SpyObj<AnimationService>;
  let animationFactorySpy: jasmine.SpyObj<AnimationFactory>;
  let animationPlayerSpy: jasmine.SpyObj<AnimationPlayer>;
  let originalIntersectionObserver: any;
  let intersectionObserverSpy: jasmine.Spy;
  let observeSpy: jasmine.Spy;
  let disconnectSpy: jasmine.Spy;

  beforeEach(async () => {
    // Guardar la implementación original de IntersectionObserver
    originalIntersectionObserver = window.IntersectionObserver;

    // Crear spies para AnimationService
    animationPlayerSpy = jasmine.createSpyObj('AnimationPlayer', ['play', 'destroy']);
    animationFactorySpy = jasmine.createSpyObj('AnimationFactory', ['create']);
    animationFactorySpy.create.and.returnValue(animationPlayerSpy);
    
    const animationServiceSpy = jasmine.createSpyObj('AnimationService', [
      'createFadeIn',
      'createSlideIn',
      'createScaleIn',
      'createPulse',
      'runAnimation'
    ]);
    animationServiceSpy.createFadeIn.and.returnValue(animationFactorySpy);
    animationServiceSpy.createSlideIn.and.returnValue(animationFactorySpy);
    animationServiceSpy.createScaleIn.and.returnValue(animationFactorySpy);
    animationServiceSpy.createPulse.and.returnValue(animationFactorySpy);
    animationServiceSpy.runAnimation.and.returnValue(animationPlayerSpy);

    // Mock para IntersectionObserver
    observeSpy = jasmine.createSpy('observe');
    disconnectSpy = jasmine.createSpy('disconnect');
    
    intersectionObserverSpy = spyOn(window, 'IntersectionObserver').and.returnValue({
      observe: observeSpy,
      disconnect: disconnectSpy,
      unobserve: jasmine.createSpy('unobserve'),
      takeRecords: jasmine.createSpy('takeRecords')
    } as any);

    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [AnimateOnScrollDirective],
      providers: [
        { provide: AnimationService, useValue: animationServiceSpy },
        NgZone
      ]
    }).compileComponents();

    animationServiceSpy = TestBed.inject(AnimationService) as jasmine.SpyObj<AnimationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directiveElement = fixture.debugElement.query(By.directive(AnimateOnScrollDirective));
    directive = directiveElement.injector.get(AnimateOnScrollDirective);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Restaurar la implementación original de IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(directive.animationType).toBe('fadeIn');
    expect(directive.animationDuration).toBe(300);
    expect(directive.animationDelay).toBe(0);
    expect(directive.threshold).toBe(0.2);
    expect(directive.once).toBe(true);
  });

  it('should create an IntersectionObserver on init', () => {
    expect(intersectionObserverSpy).toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledWith(directiveElement.nativeElement);
  });

  it('should set initial opacity to 0', () => {
    expect(directiveElement.nativeElement.style.opacity).toBe('0');
  });

  it('should clean up on destroy', () => {
    directive.ngOnDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should check for reduced motion preference', () => {
    // Espiar el método privado
    spyOn<any>(directive, 'prefersReducedMotion').and.returnValue(false);
    directive.ngOnInit();
    expect(directive['prefersReducedMotion']).toHaveBeenCalled();
  });

  it('should not animate if user prefers reduced motion', () => {
    spyOn<any>(directive, 'prefersReducedMotion').and.returnValue(true);
    directive.ngOnInit();
    expect(directiveElement.nativeElement.style.opacity).toBe('1');
    expect(observeSpy).not.toHaveBeenCalled();
  });

  // Prueba para simular la intersección
  it('should animate when element intersects viewport', () => {
    // Obtener la función callback del IntersectionObserver
    const callback = intersectionObserverSpy.calls.mostRecent().args[0];
    
    // Simular una entrada que intersecta
    const entries = [{ isIntersecting: true, target: directiveElement.nativeElement }];
    
    // Espiar el método privado de animación
    spyOn<any>(directive, 'animate');
    
    // Llamar al callback con las entradas simuladas
    callback(entries);
    
    // Verificar que se llamó al método de animación
    expect(directive['animate']).toHaveBeenCalled();
  });

  it('should disconnect observer after animation if once is true', () => {
    // Obtener la función callback del IntersectionObserver
    const callback = intersectionObserverSpy.calls.mostRecent().args[0];
    
    // Simular una entrada que intersecta
    const entries = [{ isIntersecting: true, target: directiveElement.nativeElement }];
    
    // Llamar al callback con las entradas simuladas
    callback(entries);
    
    // Verificar que se desconectó el observador
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should not disconnect observer after animation if once is false', () => {
    // Cambiar la propiedad once a false
    component.once = false;
    directive.once = false;
    fixture.detectChanges();
    
    // Resetear el spy de disconnect
    disconnectSpy.calls.reset();
    
    // Obtener la función callback del IntersectionObserver
    const callback = intersectionObserverSpy.calls.mostRecent().args[0];
    
    // Simular una entrada que intersecta
    const entries = [{ isIntersecting: true, target: directiveElement.nativeElement }];
    
    // Llamar al callback con las entradas simuladas
    callback(entries);
    
    // Verificar que no se desconectó el observador
    expect(disconnectSpy).not.toHaveBeenCalled();
  });
});
