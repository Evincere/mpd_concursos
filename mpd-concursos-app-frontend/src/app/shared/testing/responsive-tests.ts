import { ScreenSize } from '../services/responsive-testing.service';
import { ResponsiveService } from '../services/responsive.service';
import { ResponsiveTestingService } from '../services/responsive-testing.service';
import { LoggingService } from '../../core/services/logging/logging.service';

/**
 * Class to execute responsiveness tests on components
 */
export class ResponsiveTests {
  private responsiveTestingService: ResponsiveTestingService;
  private loggingService: LoggingService; // Inject LoggingService

  constructor(responsiveService: ResponsiveService, loggingService: LoggingService) {
    this.responsiveTestingService = new ResponsiveTestingService(responsiveService);
    this.loggingService = loggingService; // Assign injected service
    this.loggingService.debug('[ResponsiveTests] Initializing ResponsiveTests class.', undefined, 'ResponsiveTests');
  }

  /**
   * Executes responsiveness tests across multiple screen sizes.
   */
  runTests(): void {
    this.loggingService.info('[ResponsiveTests] Starting responsiveness tests.', undefined, 'ResponsiveTests');

    // Define test screen sizes
    const screenSizes: ScreenSize[] = [
      { width: 1920, height: 1080, breakpoint: 'xxl', isMobile: false, isTablet: false, isDesktop: true },
      { width: 768, height: 1024, breakpoint: 'md', isMobile: false, isTablet: true, isDesktop: false },
      { width: 375, height: 667, breakpoint: 'xs', isMobile: true, isTablet: false, isDesktop: false }
    ];

    for (const size of screenSizes) {
      const sizeLabel = size.isMobile ? 'mobile' : size.isTablet ? 'tablet' : 'desktop';
      this.loggingService.info(`[ResponsiveTests] Testing for screen size: ${sizeLabel.toUpperCase()} (${size.width}x${size.height})`, undefined, 'ResponsiveTests');

      // Simulate the screen size
      this.responsiveTestingService.simulateScreenSize(size.width, size.height);

      // Execute specific tests for each component/area
      this.testDashboard(size);
      this.testForms(size);
      this.testTables(size);
      this.testCards(size);
      this.testNavigation(size);

      this.loggingService.info(`[ResponsiveTests] Finished tests for screen size: ${sizeLabel.toUpperCase()}`, undefined, 'ResponsiveTests');
    }

    // Restore original screen size
    this.responsiveTestingService.restoreRealScreenSize();
    this.loggingService.info('[ResponsiveTests] All responsiveness tests completed.', undefined, 'ResponsiveTests');
  }

  /**
   * Tests the responsiveness of the dashboard layout.
   */
  private testDashboard(size: ScreenSize): void {
    this.loggingService.debug(`[ResponsiveTests] Running dashboard tests for ${size} size.`, undefined, 'ResponsiveTests');

    const sidebar = document.querySelector('.sidebar') as HTMLElement; // Assuming a .sidebar class
    const mobileNav = document.querySelector('.mobile-nav') as HTMLElement; // Assuming a .mobile-nav class for hamburger menu
    const content = document.querySelector('.main-content') as HTMLElement; // Assuming a .main-content class

    if (sidebar) {
      const isCollapsed = sidebar.classList.contains('collapsed') ||
                          getComputedStyle(sidebar).transform.includes('matrix'); // Checks for CSS transform property
      this.loggingService.debug(`[ResponsiveTests] Sidebar (ID: ${sidebar.id || 'N/A'}) isCollapsed: ${isCollapsed} for ${size}.`, undefined, 'ResponsiveTests');
      if (size.isMobile && !isCollapsed) {
        this.loggingService.warn(`[ResponsiveTests] WARNING: Sidebar not collapsed on mobile size ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] Dashboard sidebar element not found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (mobileNav) {
      const isVisible = getComputedStyle(mobileNav).display !== 'none';
      this.loggingService.debug(`[ResponsiveTests] Mobile navigation isVisible: ${isVisible} for ${size}.`, undefined, 'ResponsiveTests');
      if (size.isMobile && !isVisible) {
        this.loggingService.warn(`[ResponsiveTests] WARNING: Mobile navigation not visible on mobile size ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
      } else if (!size.isMobile && isVisible) {
        this.loggingService.warn(`[ResponsiveTests] WARNING: Mobile navigation visible on non-mobile size ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] Dashboard mobile navigation element not found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (content) {
      const contentWidth = content.clientWidth;
      const windowWidth = window.innerWidth;
      this.loggingService.debug(`[ResponsiveTests] Main content width: ${contentWidth}px (Window: ${windowWidth}px) for ${size}.`, undefined, 'ResponsiveTests');
      if (contentWidth > windowWidth) {
        this.loggingService.warn(`[ResponsiveTests] WARNING: Main content overflowing window width on ${size} size.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] Main content element not found for ${size} size.`, undefined, 'ResponsiveTests');
    }
  }

  /**
   * Tests the responsiveness of forms.
   */
  private testForms(size: ScreenSize): void {
    this.loggingService.debug(`[ResponsiveTests] Running forms tests for ${size} size.`, undefined, 'ResponsiveTests');

    const formFields = document.querySelectorAll('.custom-form-field') as NodeListOf<HTMLElement>; // Assuming .custom-form-field class
    const buttons = document.querySelectorAll('form button, form .custom-button') as NodeListOf<HTMLElement>; // Assuming .custom-button class

    if (formFields.length > 0) {
      const fieldWidths = Array.from(formFields).map(field => field.clientWidth);
      const avgWidth = fieldWidths.reduce((sum, width) => sum + width, 0) / fieldWidths.length;
      this.loggingService.debug(`[ResponsiveTests] Average form field width: ${avgWidth.toFixed(2)}px for ${size}.`, undefined, 'ResponsiveTests');

      const overflowingFields = Array.from(formFields).filter(field => {
        const parent = field.parentElement;
        return parent && field.clientWidth > parent.clientWidth;
      });

      if (overflowingFields.length > 0) {
        this.loggingService.warn(`[ResponsiveTests] WARNING: ${overflowingFields.length} form field(s) overflowing parent for ${size}.`, undefined, 'ResponsiveTests');
        overflowingFields.forEach(field => this.loggingService.warn(`- Overflowing field: ${field.outerHTML.substring(0, 50)}...`, undefined, 'ResponsiveTests'));
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] No form fields found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (buttons.length > 0) {
      const buttonHeights = Array.from(buttons).map(button => button.clientHeight);
      const avgHeight = buttonHeights.reduce((sum, height) => sum + height, 0) / buttonHeights.length;
      this.loggingService.debug(`[ResponsiveTests] Average button height: ${avgHeight.toFixed(2)}px for ${size}.`, undefined, 'ResponsiveTests');

      // Check for buttons stacking or wrapping correctly on smaller screens
      // This is a heuristic and might need fine-tuning based on actual button layout
      const buttonsInOneRow = buttons.length; // Max buttons expected in one row
      if (size.isMobile && buttonsInOneRow > 2 && avgHeight > 50) { // If average height is too large, they might not be stacking
         this.loggingService.info(`[ResponsiveTests] Consider checking button stacking/wrapping for forms on mobile for ${size.width}x${size.height}. Average height: ${avgHeight.toFixed(2)}px.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] No form buttons found for ${size} size.`, undefined, 'ResponsiveTests');
    }
  }

  /**
   * Tests the responsiveness of tables.
   */
  private testTables(size: ScreenSize): void {
    this.loggingService.debug(`[ResponsiveTests] Running tables tests for ${size} size.`, undefined, 'ResponsiveTests');

    const tables = document.querySelectorAll('.custom-table table, .data-table table') as NodeListOf<HTMLElement>; // Assuming .custom-table or .data-table class

    if (tables.length > 0) {
      tables.forEach((table, index) => {
        const tableWidth = table.clientWidth;
        const containerWidth = table.parentElement ? table.parentElement.clientWidth : window.innerWidth;
        const isOverflowing = tableWidth > containerWidth;
        const hasResponsiveClass = table.parentElement?.classList.contains('table-responsive') || false; // Assuming a wrapper div for responsive tables

        this.loggingService.debug(`[ResponsiveTests] Table ${index} (ID: ${table.id || 'N/A'}) width: ${tableWidth}px, Container width: ${containerWidth}px. Overflowing: ${isOverflowing}, Has responsive class: ${hasResponsiveClass} for ${size}.`, undefined, 'ResponsiveTests');

        if (isOverflowing && !hasResponsiveClass) {
          this.loggingService.warn(`[ResponsiveTests] WARNING: Table ${index} overflowing without a responsive class for ${size}. Potential horizontal scroll.`, undefined, 'ResponsiveTests');
        } else if (isOverflowing && hasResponsiveClass) {
          this.loggingService.info(`[ResponsiveTests] Table ${index} is overflowing but has responsive class for ${size}. (Expected behavior for responsive tables).`, undefined, 'ResponsiveTests');
        }
      });
    } else {
      this.loggingService.warn(`[ResponsiveTests] No tables found for ${size} size.`, undefined, 'ResponsiveTests');
    }
  }

  /**
   * Tests the responsiveness of cards.
   */
  private testCards(size: ScreenSize): void {
    this.loggingService.debug(`[ResponsiveTests] Running cards tests for ${size} size.`, undefined, 'ResponsiveTests');

    const cards = document.querySelectorAll('.custom-card') as NodeListOf<HTMLElement>; // Assuming .custom-card class
    const cardContainers = document.querySelectorAll('.card-grid, .card-flex-container') as NodeListOf<HTMLElement>; // Assuming a grid/flex container for cards

    if (cards.length > 0) {
      const cardWidths = Array.from(cards).map(card => card.clientWidth);
      const minWidth = Math.min(...cardWidths);
      const maxWidth = Math.max(...cardWidths);
      this.loggingService.debug(`[ResponsiveTests] Card widths range: ${minWidth}px - ${maxWidth}px for ${size}.`, undefined, 'ResponsiveTests');

      // Check if cards are becoming too narrow on smaller screens
      if (size.isMobile && minWidth < 150) { // Heuristic: cards too narrow
        this.loggingService.warn(`[ResponsiveTests] WARNING: Cards might be too narrow on mobile for ${size.width}x${size.height}. Min width: ${minWidth}px.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] No cards found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (cardContainers.length > 0) {
      cardContainers.forEach((container, index) => {
        const style = getComputedStyle(container);
        this.loggingService.debug(`[ResponsiveTests] Card container ${index} (ID: ${container.id || 'N/A'}) display: ${style.display}, flex-wrap: ${style.flexWrap}, grid-template-columns: ${style.gridTemplateColumns} for ${size}.`, undefined, 'ResponsiveTests');

        if (style.display === 'flex' && style.flexWrap === 'nowrap' && size.isMobile) {
            this.loggingService.warn(`[ResponsiveTests] WARNING: Flex container ${index} is not wrapping items on mobile for ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
        }
      });
    } else {
      this.loggingService.warn(`[ResponsiveTests] No card containers found for ${size} size.`, undefined, 'ResponsiveTests');
    }
  }

  /**
   * Tests the responsiveness of navigation elements.
   */
  private testNavigation(size: ScreenSize): void {
    this.loggingService.debug(`[ResponsiveTests] Running navigation tests for ${size} size.`, undefined, 'ResponsiveTests');

    const header = document.querySelector('header.app-header') as HTMLElement; // Assuming a common header class
    const nav = document.querySelector('nav.main-nav') as HTMLElement; // Assuming a common main navigation class
    const hamburgerMenu = document.querySelector('.hamburger-menu') as HTMLElement; // Assuming a hamburger menu icon

    if (header) {
      const headerHeight = header.clientHeight;
      this.loggingService.debug(`[ResponsiveTests] Header height: ${headerHeight}px for ${size}.`, undefined, 'ResponsiveTests');
      if (size.isMobile && headerHeight > 80) { // Heuristic: header too tall on mobile
        this.loggingService.warn(`[ResponsiveTests] WARNING: Header might be too tall on mobile for ${size.width}x${size.height}. Height: ${headerHeight}px.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] Navigation header element not found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (nav) {
      const navItems = nav.querySelectorAll('a, button') as NodeListOf<HTMLElement>; // Get all clickable nav items
      if (navItems.length > 0) {
        const navWidth = nav.clientWidth;
        const totalItemsWidth = Array.from(navItems).reduce((sum, item) => sum + item.clientWidth, 0);
        this.loggingService.debug(`[ResponsiveTests] Main navigation width: ${navWidth}px, Total nav items width: ${totalItemsWidth}px for ${size}.`, undefined, 'ResponsiveTests');

        // Check if nav items are overflowing or wrapping correctly
        if (size.isMobile && totalItemsWidth > navWidth && navItems.length > 1) {
            this.loggingService.info(`[ResponsiveTests] Navigation items might be wrapping or hidden on mobile for ${size.width}x${size.height}. Expected behavior if responsive.`, undefined, 'ResponsiveTests');
        } else if (!size.isMobile && totalItemsWidth > navWidth) {
             this.loggingService.warn(`[ResponsiveTests] WARNING: Navigation items overflowing on non-mobile for ${size.width}x${size.height}. Consider checking layout.`, undefined, 'ResponsiveTests');
        }
      } else {
        this.loggingService.warn(`[ResponsiveTests] No navigation items found within main nav for ${size} size.`, undefined, 'ResponsiveTests');
      }
    } else {
      this.loggingService.warn(`[ResponsiveTests] Main navigation element not found for ${size} size.`, undefined, 'ResponsiveTests');
    }

    if (hamburgerMenu) {
        const isHamburgerVisible = getComputedStyle(hamburgerMenu).display !== 'none';
        this.loggingService.debug(`[ResponsiveTests] Hamburger menu isVisible: ${isHamburgerVisible} for ${size}.`, undefined, 'ResponsiveTests');
        if (size.isMobile && !isHamburgerVisible) {
            this.loggingService.warn(`[ResponsiveTests] WARNING: Hamburger menu not visible on mobile for ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
        } else if (!size.isMobile && isHamburgerVisible) {
            this.loggingService.warn(`[ResponsiveTests] WARNING: Hamburger menu visible on non-mobile for ${size.width}x${size.height}.`, undefined, 'ResponsiveTests');
        }
    } else {
        this.loggingService.info(`[ResponsiveTests] Hamburger menu element not found. This might be intentional if navigation is always visible for ${size}.`, undefined, 'ResponsiveTests');
    }
  }
}
