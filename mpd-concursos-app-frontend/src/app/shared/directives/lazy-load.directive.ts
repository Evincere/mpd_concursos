import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  Renderer2,
  Output,
  EventEmitter
} from '@angular/core';
import { PerformanceOptimizationService } from '@core/services/performance/performance-optimization.service';

/**
 * Directiva para lazy loading de elementos
 */
@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit, OnDestroy {

  @Input('appLazyLoad') src!: string;
  @Input() srcset?: string;
  @Input() placeholder?: string;
  @Input() errorImage?: string;
  @Input() loadingClass = 'lazy-loading';
  @Input() loadedClass = 'lazy-loaded';
  @Input() errorClass = 'lazy-error';
  @Input() fadeInDuration = 300;
  @Input() optimizeImage = true;
  @Input() imageQuality = 0.8;
  @Input() imageFormat: 'webp' | 'jpeg' | 'png' = 'webp';

  @Output() loaded = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();
  @Output() loading = new EventEmitter<void>();

  private intersectionObserver?: IntersectionObserver;
  private isLoaded = false;
  private isLoading = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private performanceService: PerformanceOptimizationService
  ) {}

  ngOnInit(): void {
    this.initializeLazyLoading();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  /**
   * Inicializa el lazy loading
   */
  private initializeLazyLoading(): void {
    const element = this.elementRef.nativeElement;
    
    // Agregar clase de loading inicial
    this.renderer.addClass(element, this.loadingClass);
    
    // Configurar placeholder si se proporciona
    if (this.placeholder) {
      this.setPlaceholder();
    }

    // Verificar si IntersectionObserver está disponible
    if (!('IntersectionObserver' in window)) {
      // Fallback: cargar inmediatamente
      this.loadElement();
      return;
    }

    // Crear observer
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoaded && !this.isLoading) {
            this.loadElement();
            this.intersectionObserver?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    this.intersectionObserver.observe(element);
  }

  /**
   * Configura el placeholder
   */
  private setPlaceholder(): void {
    const element = this.elementRef.nativeElement;
    
    if (element.tagName === 'IMG') {
      this.renderer.setAttribute(element, 'src', this.placeholder!);
    } else {
      this.renderer.setStyle(element, 'background-image', `url(${this.placeholder})`);
      this.renderer.setStyle(element, 'background-size', 'cover');
      this.renderer.setStyle(element, 'background-position', 'center');
    }
  }

  /**
   * Carga el elemento
   */
  private async loadElement(): Promise<void> {
    if (this.isLoading || this.isLoaded) return;

    this.isLoading = true;
    this.loading.emit();

    const element = this.elementRef.nativeElement;

    try {
      let finalSrc = this.src;

      // Optimizar imagen si está habilitado
      if (this.optimizeImage && element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        const rect = img.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
          finalSrc = await this.performanceService.optimizeImage(this.src, {
            width: Math.ceil(rect.width * window.devicePixelRatio),
            height: Math.ceil(rect.height * window.devicePixelRatio),
            quality: this.imageQuality,
            format: this.imageFormat
          });
        }
      }

      await this.loadResource(finalSrc);
      
      this.isLoaded = true;
      this.isLoading = false;
      
      this.renderer.removeClass(element, this.loadingClass);
      this.renderer.addClass(element, this.loadedClass);
      
      // Aplicar efecto de fade in
      this.applyFadeInEffect();
      
      this.loaded.emit();
      
    } catch (error) {
      this.isLoading = false;
      this.handleLoadError(error as Error);
    }
  }

  /**
   * Carga el recurso
   */
  private loadResource(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const element = this.elementRef.nativeElement;

      if (element.tagName === 'IMG') {
        this.loadImage(src, resolve, reject);
      } else if (element.tagName === 'IFRAME') {
        this.loadIframe(src, resolve, reject);
      } else {
        this.loadBackgroundImage(src, resolve, reject);
      }
    });
  }

  /**
   * Carga imagen
   */
  private loadImage(src: string, resolve: () => void, reject: (error: Error) => void): void {
    const element = this.elementRef.nativeElement as HTMLImageElement;
    
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = () => {
      this.renderer.setAttribute(element, 'src', src);
      
      if (this.srcset) {
        this.renderer.setAttribute(element, 'srcset', this.srcset);
      }
      
      resolve();
    };
    
    tempImg.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    tempImg.src = src;
  }

  /**
   * Carga iframe
   */
  private loadIframe(src: string, resolve: () => void, reject: (error: Error) => void): void {
    const element = this.elementRef.nativeElement as HTMLIFrameElement;
    
    const onLoad = () => {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onError);
      resolve();
    };
    
    const onError = () => {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onError);
      reject(new Error(`Failed to load iframe: ${src}`));
    };
    
    element.addEventListener('load', onLoad);
    element.addEventListener('error', onError);
    
    this.renderer.setAttribute(element, 'src', src);
  }

  /**
   * Carga imagen de fondo
   */
  private loadBackgroundImage(src: string, resolve: () => void, reject: (error: Error) => void): void {
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = () => {
      this.renderer.setStyle(this.elementRef.nativeElement, 'background-image', `url(${src})`);
      resolve();
    };
    
    tempImg.onerror = () => {
      reject(new Error(`Failed to load background image: ${src}`));
    };
    
    tempImg.src = src;
  }

  /**
   * Maneja errores de carga
   */
  private handleLoadError(error: Error): void {
    const element = this.elementRef.nativeElement;
    
    this.renderer.removeClass(element, this.loadingClass);
    this.renderer.addClass(element, this.errorClass);
    
    // Usar imagen de error si se proporciona
    if (this.errorImage) {
      if (element.tagName === 'IMG') {
        this.renderer.setAttribute(element, 'src', this.errorImage);
      } else {
        this.renderer.setStyle(element, 'background-image', `url(${this.errorImage})`);
      }
    }
    
    this.error.emit(error);
  }

  /**
   * Aplica efecto de fade in
   */
  private applyFadeInEffect(): void {
    if (this.fadeInDuration <= 0) return;

    const element = this.elementRef.nativeElement;
    
    // Configurar estado inicial
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'transition', `opacity ${this.fadeInDuration}ms ease-in-out`);
    
    // Aplicar fade in después de un frame
    requestAnimationFrame(() => {
      this.renderer.setStyle(element, 'opacity', '1');
      
      // Limpiar estilos después de la transición
      setTimeout(() => {
        this.renderer.removeStyle(element, 'transition');
      }, this.fadeInDuration);
    });
  }

  /**
   * Fuerza la carga del elemento
   */
  public forceLoad(): void {
    if (!this.isLoaded && !this.isLoading) {
      this.loadElement();
    }
  }

  /**
   * Recarga el elemento
   */
  public reload(): void {
    this.isLoaded = false;
    this.isLoading = false;
    
    const element = this.elementRef.nativeElement;
    this.renderer.removeClass(element, this.loadedClass);
    this.renderer.removeClass(element, this.errorClass);
    this.renderer.addClass(element, this.loadingClass);
    
    if (this.placeholder) {
      this.setPlaceholder();
    }
    
    this.loadElement();
  }

  /**
   * Verifica si el elemento está cargado
   */
  public get loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Verifica si el elemento está cargando
   */
  public get loading(): boolean {
    return this.isLoading;
  }
}
