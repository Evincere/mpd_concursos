import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ResponsiveService } from './responsive.service';

export interface ScreenSize {
  width: number;
  height: number;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveTestingService {
  private screenSizeSubject = new BehaviorSubject<ScreenSize>(this.getCurrentScreenSize());
  screenSize$: Observable<ScreenSize> = this.screenSizeSubject.asObservable();

  constructor(private responsiveService: ResponsiveService) {
    // Observar cambios en el tamaño de la ventana
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        startWith(null),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.screenSizeSubject.next(this.getCurrentScreenSize());
      });
  }

  /**
   * Obtiene el tamaño actual de la pantalla y determina el breakpoint
   */
  private getCurrentScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

    if (width < 480) {
      breakpoint = 'xs';
    } else if (width < 576) {
      breakpoint = 'sm';
    } else if (width < 768) {
      breakpoint = 'md';
    } else if (width < 992) {
      breakpoint = 'lg';
    } else if (width < 1200) {
      breakpoint = 'xl';
    } else {
      breakpoint = 'xxl';
    }

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 992;
    const isDesktop = width >= 992;

    return {
      width,
      height,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop
    };
  }

  /**
   * Simula un cambio de tamaño de pantalla (útil para pruebas)
   */
  simulateScreenSize(width: number, height: number = window.innerHeight): void {
    this.responsiveService.simulateScreenSize(width, height);
  }

  /**
   * Restaura el tamaño real de la pantalla después de una simulación
   */
  restoreRealScreenSize(): void {
    this.responsiveService.restoreRealScreenSize();
  }

  /**
   * Ejecuta una función de prueba en múltiples tamaños de pantalla
   */
  testInMultipleScreenSizes(testFunction: (size: ScreenSize) => void): void {
    // Definir tamaños de pantalla para probar
    const screenSizes = [
      { width: 375, height: 667, name: 'Mobile (iPhone 8)' },
      { width: 414, height: 896, name: 'Mobile (iPhone 11)' },
      { width: 768, height: 1024, name: 'Tablet (iPad)' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1280, height: 800, name: 'Small Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];

    // Guardar el tamaño original
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    // Ejecutar pruebas en cada tamaño
    screenSizes.forEach(size => {
      console.log(`Testing in ${size.name} (${size.width}x${size.height})`);
      this.simulateScreenSize(size.width, size.height);

      // Ejecutar la función de prueba con el tamaño actual
      testFunction(this.getCurrentScreenSize());
    });

    // Restaurar el tamaño original
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalHeight, writable: true });
    window.dispatchEvent(new Event('resize'));
  }
}
