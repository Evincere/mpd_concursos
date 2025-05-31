import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

// Componente de prueba
@Component({
  template: `
    <img
      appLazyLoadImage
      [src]="imageSrc"
      [placeholder]="placeholderSrc"
      [loadingClass]="loadingClass"
      [loadedClass]="loadedClass"
      [errorClass]="errorClass"
      [alt]="altText"
    />
  `
})
class TestComponent {
  imageSrc = 'https://example.com/image.jpg';
  placeholderSrc = 'https://example.com/placeholder.jpg';
  loadingClass = 'custom-loading';
  loadedClass = 'custom-loaded';
  errorClass = 'custom-error';
  altText = 'Test image';
}

describe('LazyLoadImageDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: DebugElement;
  let directive: LazyLoadImageDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [LazyLoadImageDirective]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    imgEl = fixture.debugElement.query(By.css('img'));

    // Obtener la instancia de la directiva
    directive = imgEl.injector.get(LazyLoadImageDirective);

    // Espiar el método setupIntersectionObserver
    spyOn<any>(directive, 'setupIntersectionObserver');

    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should apply loading class on initialization', () => {
    expect(imgEl.nativeElement.classList.contains('custom-loading')).toBeTruthy();
  });

  it('should set placeholder image if provided', () => {
    expect(imgEl.nativeElement.src).toContain('placeholder.jpg');
  });

  it('should set alt text if provided', () => {
    expect(imgEl.nativeElement.alt).toBe('Test image');
  });

  it('should call setupIntersectionObserver on initialization', () => {
    expect(directive['setupIntersectionObserver']).toHaveBeenCalled();
  });

  it('should load image when loadImage is called', () => {
    // Espiar el método disconnectObserver
    spyOn<any>(directive, 'disconnectObserver');

    // Mockear Image
    const originalImage = window.Image;
    const mockImage = {
      onload: () => {},
      onerror: () => {},
      src: ''
    };

    // Reemplazar el constructor de Image
    (window as any).Image = function() {
      return mockImage;
    };

    try {
      // Llamar a loadImage
      directive['loadImage']();

      // Simular carga exitosa
      mockImage.onload();

      // Verificar que se aplicaron las clases correctas
      expect(imgEl.nativeElement.classList.contains('custom-loading')).toBeFalsy();
      expect(imgEl.nativeElement.classList.contains('custom-loaded')).toBeTruthy();

      // Verificar que se estableció la imagen correcta
      expect(imgEl.nativeElement.src).toContain('image.jpg');

      // Verificar que se desconectó el observer
      expect(directive['disconnectObserver']).toHaveBeenCalled();
    } finally {
      // Restaurar el constructor original de Image
      window.Image = originalImage;
    }
  });

  it('should handle image load error', () => {
    // Espiar el método disconnectObserver
    spyOn<any>(directive, 'disconnectObserver');

    // Mockear Image
    const originalImage = window.Image;
    const mockImage = {
      onload: () => {},
      onerror: () => {},
      src: ''
    };

    // Reemplazar el constructor de Image
    (window as any).Image = function() {
      return mockImage;
    };

    try {
      // Llamar a loadImage
      directive['loadImage']();

      // Simular error de carga
      mockImage.onerror();

      // Verificar que se aplicaron las clases correctas
      expect(imgEl.nativeElement.classList.contains('custom-loading')).toBeFalsy();
      expect(imgEl.nativeElement.classList.contains('custom-error')).toBeTruthy();

      // Verificar que se mantuvo la imagen de placeholder
      expect(imgEl.nativeElement.src).toContain('placeholder.jpg');

      // Verificar que se desconectó el observer
      expect(directive['disconnectObserver']).toHaveBeenCalled();
    } finally {
      // Restaurar el constructor original de Image
      window.Image = originalImage;
    }
  });

  it('should use default error image if no placeholder is provided', () => {
    // Establecer placeholder a null
    component.placeholderSrc = '';
    fixture.detectChanges();

    // Espiar el método disconnectObserver
    spyOn<any>(directive, 'disconnectObserver');

    // Mockear Image
    const originalImage = window.Image;
    const mockImage = {
      onload: () => {},
      onerror: () => {},
      src: ''
    };

    // Reemplazar el constructor de Image
    (window as any).Image = function() {
      return mockImage;
    };

    try {
      // Llamar a loadImage
      directive['loadImage']();

      // Simular error de carga
      mockImage.onerror();

      // Verificar que se estableció la imagen de error por defecto
      expect(imgEl.nativeElement.src).toContain('assets/images/image-error.png');
    } finally {
      // Restaurar el constructor original de Image
      window.Image = originalImage;
    }
  });

  it('should disconnect observer when disconnectObserver is called', () => {
    // Crear un mock del IntersectionObserver
    const mockObserver = {
      disconnect: jasmine.createSpy('disconnect')
    };

    // Asignar el mock al observer de la directiva
    directive['intersectionObserver'] = mockObserver as any;

    // Llamar a disconnectObserver
    directive['disconnectObserver']();

    // Verificar que se llamó a disconnect
    expect(mockObserver.disconnect).toHaveBeenCalled();

    // Verificar que se estableció el observer a undefined
    expect(directive['intersectionObserver']).toBeUndefined();
  });
});
