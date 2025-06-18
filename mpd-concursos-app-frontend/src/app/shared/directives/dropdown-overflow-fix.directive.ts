import { Directive, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appDropdownOverflowFix]',
  standalone: true
})
export class DropdownOverflowFixDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.setupOverflowFix();
    this.observeDropdownChanges();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupOverflowFix(): void {
    const element = this.el.nativeElement;
    
    // Aplicar estilos directamente al elemento
    element.style.overflow = 'visible';
    element.style.position = 'relative';
    element.style.zIndex = '1000';

    // Buscar y configurar contenedores padre
    this.fixParentContainers(element);
    
    // Buscar y configurar dropdown
    this.fixDropdownElements(element);
  }

  private fixParentContainers(element: HTMLElement): void {
    let parent = element.parentElement;
    let level = 0;
    
    // Subir hasta 5 niveles para encontrar contenedores que puedan estar cortando
    while (parent && level < 5) {
      const computedStyle = window.getComputedStyle(parent);
      
      // Si el padre tiene overflow hidden, cambiarlo a visible
      if (computedStyle.overflow === 'hidden' || 
          computedStyle.overflowX === 'hidden' || 
          computedStyle.overflowY === 'hidden') {
        parent.style.overflow = 'visible';
      }
      
      // Si es una card o contenedor de filtros, asegurar overflow visible
      if (parent.classList.contains('custom-card') ||
          parent.classList.contains('card-content') ||
          parent.classList.contains('filter-form') ||
          parent.classList.contains('filter-row')) {
        parent.style.overflow = 'visible';
      }
      
      parent = parent.parentElement;
      level++;
    }
  }

  private fixDropdownElements(element: HTMLElement): void {
    // Buscar dropdown dentro del elemento
    const dropdown = element.querySelector('.select-dropdown');
    if (dropdown) {
      this.applyDropdownStyles(dropdown as HTMLElement);
    }
  }

  private applyDropdownStyles(dropdown: HTMLElement): void {
    // Solo aplicar z-index muy alto, mantener otros estilos del componente
    dropdown.style.zIndex = '9999999';
    dropdown.style.position = 'absolute';
  }

  private observeDropdownChanges(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // Validación de null safety
            if (node && node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;

              // Verificar que el elemento y sus propiedades existan
              if (element && element.classList) {
                // Si se añade un dropdown, aplicar estilos
                if (element.classList.contains('select-dropdown')) {
                  this.applyDropdownStyles(element);
                }

                // Buscar dropdowns dentro del elemento añadido
                try {
                  const dropdowns = element.querySelectorAll('.select-dropdown');
                  dropdowns.forEach(dropdown => {
                    if (dropdown) {
                      this.applyDropdownStyles(dropdown as HTMLElement);
                    }
                  });
                } catch (error) {
                  console.warn('Error al buscar dropdowns:', error);
                }
              }
            }
          });
        }
      });
    });

    // Observar cambios en el elemento y sus hijos
    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });
  }
}
