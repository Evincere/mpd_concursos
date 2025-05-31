import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Directiva para cargar imágenes de forma perezosa
 * 
 * Ejemplo de uso:
 * ```html
 * <img appLazyLoadImage [src]="imageUrl" [placeholder]="placeholderUrl" />
 * ```
 */
@Directive({
  selector: '[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit {
  /**
   * URL de la imagen
   */
  @Input() src!: string;
  
  /**
   * URL de la imagen de placeholder
   */
  @Input() placeholder?: string;
  
  /**
   * Clase CSS para aplicar durante la carga
   */
  @Input() loadingClass = 'image-loading';
  
  /**
   * Clase CSS para aplicar cuando la imagen está cargada
   */
  @Input() loadedClass = 'image-loaded';
  
  /**
   * Clase CSS para aplicar cuando hay un error
   */
  @Input() errorClass = 'image-error';
  
  /**
   * Texto alternativo para la imagen
   */
  @Input() alt = '';
  
  /**
   * Observer de intersección
   */
  private intersectionObserver?: IntersectionObserver;
  
  /**
   * Indica si la imagen está cargada
   */
  private isLoaded = false;

  /**
   * Constructor
   * @param el Referencia al elemento
   * @param renderer Renderer
   */
  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  /**
   * Inicializa la directiva
   */
  ngOnInit(): void {
    // Aplicar clase de carga
    this.renderer.addClass(this.el.nativeElement, this.loadingClass);
    
    // Establecer imagen de placeholder si existe
    if (this.placeholder) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    }
    
    // Establecer texto alternativo
    if (this.alt) {
      this.renderer.setAttribute(this.el.nativeElement, 'alt', this.alt);
    }
    
    // Crear observer de intersección
    this.setupIntersectionObserver();
  }

  /**
   * Configura el observer de intersección
   */
  private setupIntersectionObserver(): void {
    if (!this.intersectionObserver && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // Si el elemento es visible y la imagen no está cargada
          if (entry.isIntersecting && !this.isLoaded) {
            this.loadImage();
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      this.intersectionObserver.observe(this.el.nativeElement);
    } else {
      // Fallback para navegadores que no soportan IntersectionObserver
      this.loadImage();
    }
  }

  /**
   * Carga la imagen
   */
  private loadImage(): void {
    if (!this.src) {
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
      this.renderer.addClass(this.el.nativeElement, this.loadedClass);
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
      this.isLoaded = true;
      
      // Desconectar el observer
      this.disconnectObserver();
    };
    
    img.onerror = () => {
      this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
      this.renderer.addClass(this.el.nativeElement, this.errorClass);
      
      // Mantener la imagen de placeholder si existe
      if (!this.placeholder) {
        this.renderer.setAttribute(this.el.nativeElement, 'src', 'assets/images/image-error.png');
      }
      
      // Desconectar el observer
      this.disconnectObserver();
    };
    
    img.src = this.src;
  }

  /**
   * Desconecta el observer de intersección
   */
  private disconnectObserver(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }
}
