import { Injectable } from '@angular/core';

/**
 * Servicio para convertir iconos de Material Icons a Font Awesome
 * y aplicar correcciones automáticas cuando los iconos no se muestran
 */
@Injectable({
  providedIn: 'root'
})
export class IconConverterService {

  /**
   * Mapeo de iconos de Material Icons a Font Awesome
   */
  private readonly materialToFontAwesome: Record<string, string> = {
    // Navegación
    'home': 'fas fa-home',
    'arrow_back': 'fas fa-arrow-left',
    'arrow_forward': 'fas fa-arrow-right',
    'menu': 'fas fa-bars',
    'close': 'fas fa-times',
    'expand_more': 'fas fa-chevron-down',
    'expand_less': 'fas fa-chevron-up',
    'keyboard_arrow_down': 'fas fa-chevron-down',
    'keyboard_arrow_up': 'fas fa-chevron-up',
    'keyboard_arrow_left': 'fas fa-chevron-left',
    'keyboard_arrow_right': 'fas fa-chevron-right',
    
    // Acciones
    'add': 'fas fa-plus',
    'edit': 'fas fa-edit',
    'delete': 'fas fa-trash',
    'save': 'fas fa-save',
    'cancel': 'fas fa-times',
    'check': 'fas fa-check',
    'clear': 'fas fa-times',
    'refresh': 'fas fa-sync',
    'search': 'fas fa-search',
    'filter_list': 'fas fa-filter',
    'sort': 'fas fa-sort',
    'more_vert': 'fas fa-ellipsis-v',
    'more_horiz': 'fas fa-ellipsis-h',
    
    // Interfaz
    'touch_app': 'fas fa-hand-pointer',
    'visibility': 'fas fa-eye',
    'visibility_off': 'fas fa-eye-slash',
    'settings': 'fas fa-cog',
    'info': 'fas fa-info-circle',
    'warning': 'fas fa-exclamation-triangle',
    'error': 'fas fa-exclamation-circle',
    'help': 'fas fa-question-circle',
    'notifications': 'fas fa-bell',
    'account_circle': 'fas fa-user-circle',
    
    // Documentos y archivos
    'description': 'fas fa-file-alt',
    'folder': 'fas fa-folder',
    'folder_open': 'fas fa-folder-open',
    'attach_file': 'fas fa-paperclip',
    'cloud_upload': 'fas fa-cloud-upload-alt',
    'cloud_download': 'fas fa-cloud-download-alt',
    'file_copy': 'fas fa-copy',
    'print': 'fas fa-print',
    
    // Estados
    'check_circle': 'fas fa-check-circle',
    'cancel_circle': 'fas fa-times-circle',
    'schedule': 'fas fa-clock',
    'pending': 'fas fa-hourglass-half',
    'done': 'fas fa-check',
    'error_outline': 'fas fa-exclamation-circle',
    
    // Comunicación
    'email': 'fas fa-envelope',
    'phone': 'fas fa-phone',
    'message': 'fas fa-comment',
    'chat': 'fas fa-comments',
    
    // Usuarios y personas
    'person': 'fas fa-user',
    'people': 'fas fa-users',
    'group': 'fas fa-users',
    'supervisor_account': 'fas fa-user-shield',
    
    // Fechas y tiempo
    'calendar_today': 'fas fa-calendar',
    'event': 'fas fa-calendar-alt',
    'access_time': 'fas fa-clock',
    'timer': 'fas fa-stopwatch',
    
    // Otros comunes
    'star': 'fas fa-star',
    'favorite': 'fas fa-heart',
    'bookmark': 'fas fa-bookmark',
    'share': 'fas fa-share',
    'link': 'fas fa-link',
    'launch': 'fas fa-external-link-alt'
  };

  constructor() {
    this.initializeIconConversion();
  }

  /**
   * Inicializa la conversión automática de iconos
   */
  private initializeIconConversion(): void {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.convertMaterialIcons());
    } else {
      this.convertMaterialIcons();
    }

    // Observar cambios en el DOM para convertir iconos dinámicos
    this.observeDOMChanges();
  }

  /**
   * Convierte todos los iconos de Material Icons a Font Awesome
   */
  public convertMaterialIcons(): void {
    console.log('[IconConverter] 🔄 Convirtiendo iconos de Material a Font Awesome...');

    // Buscar elementos con clases de Material Icons
    const materialIconElements = document.querySelectorAll('.material-icons, .material-symbols-outlined');
    
    materialIconElements.forEach(element => {
      const iconName = element.textContent?.trim();
      if (iconName && this.materialToFontAwesome[iconName]) {
        this.convertElement(element as HTMLElement, iconName);
      }
    });

    // Buscar elementos que contengan texto de iconos de Material
    this.convertTextIcons();

    console.log('[IconConverter] ✅ Conversión de iconos completada');
  }

  /**
   * Convierte un elemento específico de Material Icon a Font Awesome
   */
  private convertElement(element: HTMLElement, iconName: string): void {
    const fontAwesomeClass = this.materialToFontAwesome[iconName];
    if (fontAwesomeClass) {
      // Limpiar clases de Material Icons
      element.classList.remove('material-icons', 'material-symbols-outlined');
      
      // Agregar clases de Font Awesome
      const classes = fontAwesomeClass.split(' ');
      element.classList.add(...classes);
      
      // Limpiar el contenido de texto
      element.textContent = '';
      
      // Agregar atributo aria-hidden para accesibilidad
      element.setAttribute('aria-hidden', 'true');
      
      console.log(`[IconConverter] Convertido: ${iconName} → ${fontAwesomeClass}`);
    }
  }

  /**
   * Busca y convierte iconos que aparecen como texto plano
   */
  private convertTextIcons(): void {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && this.materialToFontAwesome[text] ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const iconName = textNode.textContent?.trim();
      if (iconName && this.materialToFontAwesome[iconName]) {
        this.replaceTextWithIcon(textNode, iconName);
      }
    });
  }

  /**
   * Reemplaza un nodo de texto con un icono de Font Awesome
   */
  private replaceTextWithIcon(textNode: Text, iconName: string): void {
    const fontAwesomeClass = this.materialToFontAwesome[iconName];
    if (fontAwesomeClass && textNode.parentElement) {
      const iconElement = document.createElement('i');
      const classes = fontAwesomeClass.split(' ');
      iconElement.classList.add(...classes);
      iconElement.setAttribute('aria-hidden', 'true');
      
      textNode.parentElement.replaceChild(iconElement, textNode);
      
      console.log(`[IconConverter] Texto convertido: ${iconName} → ${fontAwesomeClass}`);
    }
  }

  /**
   * Observa cambios en el DOM para convertir iconos dinámicos
   */
  private observeDOMChanges(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldConvert = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldConvert = true;
        }
      });
      
      if (shouldConvert) {
        // Debounce para evitar conversiones excesivas
        setTimeout(() => this.convertMaterialIcons(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Convierte un icono específico por nombre
   */
  public convertIcon(iconName: string): string {
    return this.materialToFontAwesome[iconName] || `fas fa-question-circle`;
  }

  /**
   * Fuerza la conversión de todos los iconos
   */
  public forceConversion(): void {
    console.log('[IconConverter] 🔄 Forzando conversión de todos los iconos...');
    this.convertMaterialIcons();
  }
}
