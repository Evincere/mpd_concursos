import { Injectable } from '@angular/core';
import { LoggingService } from '../../core/services/logging/logging.service';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

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
export class ResponsiveService {
  private screenSizeSubject = new BehaviorSubject<ScreenSize>(this.getCurrentScreenSize());
  screenSize$: Observable<ScreenSize> = this.screenSizeSubject.asObservable();

  constructor(
    private loggingService: LoggingService
  ) {
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
    // Crear un evento de resize personalizado
    const resizeEvent = new Event('resize');
    
    // Sobrescribir temporalmente window.innerWidth y window.innerHeight
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    
    // Disparar el evento
    window.dispatchEvent(resizeEvent);
  }

  /**
   * Restaura el tamaño real de la pantalla después de una simulación
   */
  restoreRealScreenSize(): void {
    // Restaurar los valores originales
    Object.defineProperty(window, 'innerWidth', { value: window.outerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: window.outerHeight, writable: true });
    
    // Disparar el evento de resize
    window.dispatchEvent(new Event('resize'));
  }
}
