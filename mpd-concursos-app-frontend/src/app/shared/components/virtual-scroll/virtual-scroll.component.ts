import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, throttleTime, debounceTime } from 'rxjs/operators';

/**
 * Interfaz para configuración del virtual scroll
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  scrollDebounceTime: number;
  scrollThrottleTime: number;
  enableSmoothScrolling: boolean;
  trackByFn?: (index: number, item: any) => any;
}

/**
 * Interfaz para el rango visible
 */
export interface VisibleRange {
  start: number;
  end: number;
  visibleItems: any[];
}

/**
 * Componente de virtual scrolling para listas grandes
 */
@Component({
  selector: 'app-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class VirtualScrollComponent implements OnInit, OnDestroy, OnChanges {

  @Input() items: any[] = [];
  @Input() itemTemplate!: TemplateRef<any>;
  @Input() loadingTemplate?: TemplateRef<any>;
  @Input() emptyTemplate?: TemplateRef<any>;
  @Input() config: Partial<VirtualScrollConfig> = {};
  @Input() loading = false;
  @Input() height = '400px';
  @Input() width = '100%';

  @Output() scrolled = new EventEmitter<number>();
  @Output() rangeChanged = new EventEmitter<VisibleRange>();
  @Output() scrolledToEnd = new EventEmitter<void>();
  @Output() scrolledToStart = new EventEmitter<void>();

  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('contentContainer', { static: true }) contentContainer!: ElementRef<HTMLDivElement>;

  // Configuración por defecto
  private defaultConfig: VirtualScrollConfig = {
    itemHeight: 50,
    bufferSize: 5,
    scrollDebounceTime: 50,
    scrollThrottleTime: 16,
    enableSmoothScrolling: true,
    trackByFn: (index: number, item: any) => item.id || index
  };

  // Estado interno
  public visibleRange: VisibleRange = { start: 0, end: 0, visibleItems: [] };
  public totalHeight = 0;
  public offsetY = 0;
  public containerHeight = 0;
  public visibleItemsCount = 0;

  private destroy$ = new Subject<void>();
  private currentConfig!: VirtualScrollConfig;
  private isScrolling = false;
  private scrollTimeout?: number;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initializeConfig();
    this.setupScrollListener();
    this.calculateDimensions();
    this.updateVisibleRange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.calculateDimensions();
      this.updateVisibleRange();
    }

    if (changes['config']) {
      this.initializeConfig();
      this.calculateDimensions();
      this.updateVisibleRange();
    }

    if (changes['height'] || changes['width']) {
      setTimeout(() => {
        this.calculateDimensions();
        this.updateVisibleRange();
      });
    }
  }

  /**
   * Inicializa la configuración
   */
  private initializeConfig(): void {
    this.currentConfig = { ...this.defaultConfig, ...this.config };
  }

  /**
   * Configura el listener de scroll
   */
  private setupScrollListener(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(this.scrollContainer.nativeElement, 'scroll')
        .pipe(
          throttleTime(this.currentConfig.scrollThrottleTime),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.onScroll();
        });

      fromEvent(this.scrollContainer.nativeElement, 'scroll')
        .pipe(
          debounceTime(this.currentConfig.scrollDebounceTime),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.onScrollEnd();
        });
    });

    // Listener para resize
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(250),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.calculateDimensions();
        this.updateVisibleRange();
      });
  }

  /**
   * Calcula las dimensiones
   */
  private calculateDimensions(): void {
    const container = this.scrollContainer.nativeElement;
    this.containerHeight = container.clientHeight;
    this.totalHeight = this.items.length * this.currentConfig.itemHeight;
    this.visibleItemsCount = Math.ceil(this.containerHeight / this.currentConfig.itemHeight) + 
                            (this.currentConfig.bufferSize * 2);
  }

  /**
   * Maneja el evento de scroll
   */
  private onScroll(): void {
    this.isScrolling = true;
    this.updateVisibleRange();
    
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    this.scrolled.emit(scrollTop);

    // Detectar scroll al final
    const scrollHeight = this.scrollContainer.nativeElement.scrollHeight;
    const clientHeight = this.scrollContainer.nativeElement.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      this.ngZone.run(() => {
        this.scrolledToEnd.emit();
      });
    }

    // Detectar scroll al inicio
    if (scrollTop <= 10) {
      this.ngZone.run(() => {
        this.scrolledToStart.emit();
      });
    }
  }

  /**
   * Maneja el final del scroll
   */
  private onScrollEnd(): void {
    this.isScrolling = false;
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.scrollTimeout = window.setTimeout(() => {
      this.ngZone.run(() => {
        this.cdr.markForCheck();
      });
    }, 100);
  }

  /**
   * Actualiza el rango visible
   */
  private updateVisibleRange(): void {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    const startIndex = Math.floor(scrollTop / this.currentConfig.itemHeight);
    
    const bufferedStart = Math.max(0, startIndex - this.currentConfig.bufferSize);
    const bufferedEnd = Math.min(
      this.items.length,
      startIndex + this.visibleItemsCount + this.currentConfig.bufferSize
    );

    this.visibleRange = {
      start: bufferedStart,
      end: bufferedEnd,
      visibleItems: this.items.slice(bufferedStart, bufferedEnd)
    };

    this.offsetY = bufferedStart * this.currentConfig.itemHeight;

    this.ngZone.run(() => {
      this.rangeChanged.emit(this.visibleRange);
      this.cdr.markForCheck();
    });
  }

  /**
   * Scroll a un índice específico
   */
  public scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const targetScrollTop = index * this.currentConfig.itemHeight;
    
    this.scrollContainer.nativeElement.scrollTo({
      top: targetScrollTop,
      behavior: this.currentConfig.enableSmoothScrolling ? behavior : 'auto'
    });
  }

  /**
   * Scroll al inicio
   */
  public scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollToIndex(0, behavior);
  }

  /**
   * Scroll al final
   */
  public scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollToIndex(this.items.length - 1, behavior);
  }

  /**
   * Obtiene el índice del primer elemento visible
   */
  public getFirstVisibleIndex(): number {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    return Math.floor(scrollTop / this.currentConfig.itemHeight);
  }

  /**
   * Obtiene el índice del último elemento visible
   */
  public getLastVisibleIndex(): number {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    const firstVisible = Math.floor(scrollTop / this.currentConfig.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.currentConfig.itemHeight);
    return Math.min(this.items.length - 1, firstVisible + visibleCount - 1);
  }

  /**
   * Verifica si un índice está visible
   */
  public isIndexVisible(index: number): boolean {
    return index >= this.getFirstVisibleIndex() && index <= this.getLastVisibleIndex();
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(newConfig: Partial<VirtualScrollConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...newConfig };
    this.calculateDimensions();
    this.updateVisibleRange();
  }

  /**
   * Refresca el virtual scroll
   */
  public refresh(): void {
    this.calculateDimensions();
    this.updateVisibleRange();
  }

  /**
   * Función de tracking para ngFor
   */
  public trackByFn = (index: number, item: any): any => {
    return this.currentConfig.trackByFn!(this.visibleRange.start + index, item);
  };

  /**
   * Obtiene el estilo para el contenedor de contenido
   */
  public getContentStyle(): { [key: string]: string } {
    return {
      'height': `${this.totalHeight}px`,
      'position': 'relative'
    };
  }

  /**
   * Obtiene el estilo para los elementos visibles
   */
  public getVisibleItemsStyle(): { [key: string]: string } {
    return {
      'transform': `translateY(${this.offsetY}px)`,
      'position': 'absolute',
      'top': '0',
      'left': '0',
      'right': '0'
    };
  }

  /**
   * Obtiene el estilo para un elemento individual
   */
  public getItemStyle(index: number): { [key: string]: string } {
    return {
      'height': `${this.currentConfig.itemHeight}px`,
      'position': 'absolute',
      'top': `${index * this.currentConfig.itemHeight}px`,
      'left': '0',
      'right': '0'
    };
  }

  /**
   * Obtiene estadísticas del virtual scroll
   */
  public getStats(): {
    totalItems: number;
    visibleItems: number;
    renderedItems: number;
    scrollPercentage: number;
    memoryUsage: string;
  } {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    const scrollHeight = this.scrollContainer.nativeElement.scrollHeight;
    const clientHeight = this.scrollContainer.nativeElement.clientHeight;
    
    const scrollPercentage = scrollHeight > clientHeight 
      ? (scrollTop / (scrollHeight - clientHeight)) * 100 
      : 0;

    const memoryUsage = `${this.visibleRange.visibleItems.length}/${this.items.length}`;

    return {
      totalItems: this.items.length,
      visibleItems: this.getLastVisibleIndex() - this.getFirstVisibleIndex() + 1,
      renderedItems: this.visibleRange.visibleItems.length,
      scrollPercentage: Math.round(scrollPercentage * 100) / 100,
      memoryUsage
    };
  }
}
