import { ScreenSize } from '../services/responsive-testing.service';
import { ResponsiveService } from '../services/responsive.service';
import { ResponsiveTestingService } from '../services/responsive-testing.service';

/**
 * Clase para ejecutar pruebas de responsividad en componentes
 */
export class ResponsiveTests {
  private responsiveTestingService: ResponsiveTestingService;

  constructor(responsiveService: ResponsiveService) {
    this.responsiveTestingService = new ResponsiveTestingService(responsiveService);
  }


  /**
   * Ejecuta pruebas de responsividad en múltiples tamaños de pantalla
   */
  runTests(): void {
    console.log('Iniciando pruebas de responsividad...');

    this.responsiveTestingService.testInMultipleScreenSizes((size: ScreenSize) => {
      console.log(`Probando en ${size.breakpoint} (${size.width}x${size.height})`);

      // Ejecutar pruebas específicas para cada componente
      this.testDashboard(size);
      this.testForms(size);
      this.testTables(size);
      this.testCards(size);
      this.testNavigation(size);

      console.log(`Pruebas completadas para ${size.breakpoint}`);
    });

    console.log('Todas las pruebas de responsividad completadas');
  }

  /**
   * Prueba la responsividad del dashboard
   */
  private testDashboard(size: ScreenSize): void {
    console.log(`- Probando dashboard en ${size.breakpoint}`);

    // Verificar que el sidebar se colapsa en dispositivos móviles
    if (size.isMobile) {
      console.log('  - Verificando que el sidebar está colapsado en móviles');
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const isCollapsed = sidebar.classList.contains('collapsed') ||
                           getComputedStyle(sidebar).transform.includes('matrix');
        console.log(`  - Sidebar colapsado: ${isCollapsed}`);
      }

      // Verificar que la navegación móvil está visible
      const mobileNav = document.querySelector('.mobile-nav');
      if (mobileNav) {
        const isVisible = getComputedStyle(mobileNav).display !== 'none';
        console.log(`  - Navegación móvil visible: ${isVisible}`);
      }
    }

    // Verificar el ancho del contenido principal
    const content = document.querySelector('.dashboard-content');
    if (content) {
      const contentWidth = content.clientWidth;
      console.log(`  - Ancho del contenido: ${contentWidth}px`);
    }
  }

  /**
   * Prueba la responsividad de los formularios
   */
  private testForms(size: ScreenSize): void {
    console.log(`- Probando formularios en ${size.breakpoint}`);

    // Verificar el ancho de los campos de formulario
    const formFields = document.querySelectorAll('input, select, textarea');
    if (formFields.length > 0) {
      const fieldWidths = Array.from(formFields).map(field => field.clientWidth);
      const avgWidth = fieldWidths.reduce((sum, width) => sum + width, 0) / fieldWidths.length;
      console.log(`  - Ancho promedio de campos: ${avgWidth.toFixed(2)}px`);

      // Verificar que los campos no se desborden
      const overflowingFields = Array.from(formFields).filter(field => {
        const parent = field.parentElement;
        return parent && field.clientWidth > parent.clientWidth;
      });

      console.log(`  - Campos desbordados: ${overflowingFields.length}`);
    }

    // Verificar el tamaño de los botones en dispositivos táctiles
    if (size.isMobile || size.isTablet) {
      const buttons = document.querySelectorAll('button');
      if (buttons.length > 0) {
        const buttonHeights = Array.from(buttons).map(button => button.clientHeight);
        const avgHeight = buttonHeights.reduce((sum, height) => sum + height, 0) / buttonHeights.length;
        console.log(`  - Altura promedio de botones: ${avgHeight.toFixed(2)}px`);
        console.log(`  - Botones con altura < 44px: ${buttonHeights.filter(h => h < 44).length}`);
      }
    }
  }

  /**
   * Prueba la responsividad de las tablas
   */
  private testTables(size: ScreenSize): void {
    console.log(`- Probando tablas en ${size.breakpoint}`);

    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        const tableWidth = table.clientWidth;
        const containerWidth = table.parentElement ? table.parentElement.clientWidth : window.innerWidth;
        const isOverflowing = tableWidth > containerWidth;

        console.log(`  - Tabla ${index + 1}: Ancho=${tableWidth}px, Desbordamiento=${isOverflowing}`);

        // Verificar si hay scroll horizontal
        const hasScroll = table.parentElement ?
                         getComputedStyle(table.parentElement).overflowX === 'auto' ||
                         getComputedStyle(table.parentElement).overflowX === 'scroll' :
                         false;

        console.log(`  - Tabla ${index + 1}: Scroll horizontal=${hasScroll}`);
      });
    } else {
      console.log('  - No se encontraron tablas para probar');
    }
  }

  /**
   * Prueba la responsividad de las tarjetas
   */
  private testCards(size: ScreenSize): void {
    console.log(`- Probando tarjetas en ${size.breakpoint}`);

    const cards = document.querySelectorAll('.card, mat-card, .mat-mdc-card');
    if (cards.length > 0) {
      // Verificar el ancho de las tarjetas
      const cardWidths = Array.from(cards).map(card => card.clientWidth);
      const minWidth = Math.min(...cardWidths);
      const maxWidth = Math.max(...cardWidths);

      console.log(`  - Tarjetas: Min=${minWidth}px, Max=${maxWidth}px`);

      // Verificar el espaciado entre tarjetas
      const cardContainers = document.querySelectorAll('.cards-container, .card-grid, .dashboard-cards');
      if (cardContainers.length > 0) {
        cardContainers.forEach((container, index) => {
          const style = getComputedStyle(container);
          console.log(`  - Contenedor ${index + 1}: Gap=${style.gap}, Grid=${style.display === 'grid'}`);
        });
      }
    } else {
      console.log('  - No se encontraron tarjetas para probar');
    }
  }

  /**
   * Prueba la responsividad de la navegación
   */
  private testNavigation(size: ScreenSize): void {
    console.log(`- Probando navegación en ${size.breakpoint}`);

    // Verificar el header
    const header = document.querySelector('header, .header, app-header');
    if (header) {
      const headerHeight = header.clientHeight;
      console.log(`  - Altura del header: ${headerHeight}px`);
    }

    // Verificar la navegación principal
    const nav = document.querySelector('nav, .nav, app-navbar');
    if (nav) {
      const navItems = nav.querySelectorAll('a, button');
      console.log(`  - Elementos de navegación: ${navItems.length}`);

      // Verificar si hay elementos ocultos en dispositivos pequeños
      if (size.isMobile) {
        const hiddenItems = Array.from(navItems).filter(item =>
          getComputedStyle(item).display === 'none' ||
          getComputedStyle(item).visibility === 'hidden'
        );

        console.log(`  - Elementos ocultos en móvil: ${hiddenItems.length}`);
      }
    }

    // Verificar menú hamburguesa en dispositivos pequeños
    if (size.isMobile) {
      const hamburgerMenu = document.querySelector('.hamburger, .menu-toggle, .navbar-toggler');
      console.log(`  - Menú hamburguesa presente: ${!!hamburgerMenu}`);
    }
  }
}
