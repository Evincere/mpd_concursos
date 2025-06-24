/**
 * Tests de Integración para el Sistema de Búsqueda del CV
 * 
 * @description Tests E2E para validar la funcionalidad completa de búsqueda
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

describe('CV Search Integration Tests', () => {
  beforeEach(() => {
    // Configurar interceptores para APIs
    cy.intercept('GET', '/api/cv/experiences', { fixture: 'cv/experiences.json' }).as('getExperiences');
    cy.intercept('GET', '/api/cv/education', { fixture: 'cv/education.json' }).as('getEducation');
    cy.intercept('POST', '/api/cv/search', { fixture: 'cv/search-results.json' }).as('searchCV');
    
    // Visitar la página de búsqueda del CV
    cy.visit('/perfil/cv/busqueda');
    
    // Esperar a que se carguen los datos
    cy.wait(['@getExperiences', '@getEducation']);
  });

  describe('Búsqueda básica', () => {
    it('should perform basic text search', () => {
      // Escribir término de búsqueda
      cy.get('[data-cy="search-input"]').type('Angular');
      
      // Hacer clic en buscar
      cy.get('[data-cy="search-button"]').click();
      
      // Verificar que se muestren resultados
      cy.get('[data-cy="search-results"]').should('be.visible');
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
      
      // Verificar que los resultados contienen el término buscado
      cy.get('[data-cy="result-item"]').first().should('contain.text', 'Angular');
    });

    it('should show no results message for non-matching search', () => {
      cy.get('[data-cy="search-input"]').type('Python');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="no-results"]').should('be.visible');
      cy.get('[data-cy="no-results"]').should('contain.text', 'No se encontraron resultados');
    });

    it('should clear search results when input is cleared', () => {
      // Realizar búsqueda
      cy.get('[data-cy="search-input"]').type('Angular');
      cy.get('[data-cy="search-button"]').click();
      cy.get('[data-cy="result-item"]').should('exist');
      
      // Limpiar búsqueda
      cy.get('[data-cy="search-input"]').clear();
      cy.get('[data-cy="clear-search"]').click();
      
      // Verificar que se muestren todos los resultados
      cy.get('[data-cy="all-results"]').should('be.visible');
    });
  });

  describe('Filtros avanzados', () => {
    beforeEach(() => {
      // Abrir panel de filtros avanzados
      cy.get('[data-cy="advanced-filters-toggle"]').click();
      cy.get('[data-cy="advanced-filters-panel"]').should('be.visible');
    });

    it('should filter by company', () => {
      // Seleccionar filtro de empresa
      cy.get('[data-cy="company-filter"]').click();
      cy.get('[data-cy="company-option-techcorp"]').click();
      
      // Aplicar filtros
      cy.get('[data-cy="apply-filters"]').click();
      
      // Verificar resultados filtrados
      cy.get('[data-cy="result-item"]').each(($item) => {
        cy.wrap($item).should('contain.text', 'TechCorp');
      });
    });

    it('should filter by technology', () => {
      cy.get('[data-cy="technology-filter"]').type('Angular');
      cy.get('[data-cy="technology-suggestion-angular"]').click();
      cy.get('[data-cy="apply-filters"]').click();
      
      cy.get('[data-cy="result-item"]').should('contain.text', 'Angular');
    });

    it('should filter by date range', () => {
      // Configurar rango de fechas
      cy.get('[data-cy="date-range-preset"]').select('last_year');
      cy.get('[data-cy="apply-filters"]').click();
      
      // Verificar que los resultados están en el rango correcto
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="results-count"]').should('contain.text', 'resultados del último año');
    });

    it('should combine multiple filters', () => {
      // Aplicar múltiples filtros
      cy.get('[data-cy="company-filter"]').click();
      cy.get('[data-cy="company-option-techcorp"]').click();
      
      cy.get('[data-cy="technology-filter"]').type('Angular');
      cy.get('[data-cy="technology-suggestion-angular"]').click();
      
      cy.get('[data-cy="date-range-preset"]').select('last_6_months');
      
      cy.get('[data-cy="apply-filters"]').click();
      
      // Verificar que se aplicaron todos los filtros
      cy.get('[data-cy="active-filters"]').should('contain.text', 'TechCorp');
      cy.get('[data-cy="active-filters"]').should('contain.text', 'Angular');
      cy.get('[data-cy="active-filters"]').should('contain.text', 'Últimos 6 meses');
    });
  });

  describe('Facetas dinámicas', () => {
    it('should display facets with counts', () => {
      cy.get('[data-cy="facets-panel"]').should('be.visible');
      
      // Verificar facetas de empresas
      cy.get('[data-cy="company-facets"]').should('be.visible');
      cy.get('[data-cy="company-facet-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="company-facet-item"]').first().should('contain.text', '(');
      
      // Verificar facetas de tecnologías
      cy.get('[data-cy="technology-facets"]').should('be.visible');
      cy.get('[data-cy="technology-facet-item"]').should('have.length.greaterThan', 0);
    });

    it('should filter by clicking facet items', () => {
      // Hacer clic en una faceta de empresa
      cy.get('[data-cy="company-facet-item"]').first().click();
      
      // Verificar que se aplicó el filtro
      cy.get('[data-cy="active-filters"]').should('be.visible');
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
    });

    it('should update facet counts when filters are applied', () => {
      // Obtener conteo inicial
      cy.get('[data-cy="company-facet-item"]').first().then(($facet) => {
        const initialText = $facet.text();
        
        // Aplicar un filtro de tecnología
        cy.get('[data-cy="technology-filter"]').type('Angular');
        cy.get('[data-cy="technology-suggestion-angular"]').click();
        cy.get('[data-cy="apply-filters"]').click();
        
        // Verificar que los conteos se actualizaron
        cy.get('[data-cy="company-facet-item"]').first().should('not.contain.text', initialText);
      });
    });
  });

  describe('Ordenamiento', () => {
    it('should sort results by date', () => {
      cy.get('[data-cy="sort-select"]').select('date');
      cy.get('[data-cy="sort-order"]').select('desc');
      
      // Verificar que los resultados están ordenados por fecha descendente
      cy.get('[data-cy="result-date"]').then(($dates) => {
        const dates = Array.from($dates).map(el => new Date(el.textContent || ''));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).to.be.greaterThanOrEqual(dates[i + 1].getTime());
        }
      });
    });

    it('should sort results by relevance', () => {
      // Realizar búsqueda con término específico
      cy.get('[data-cy="search-input"]').type('Angular');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="sort-select"]').select('relevance');
      
      // Verificar que los resultados más relevantes aparecen primero
      cy.get('[data-cy="result-item"]').first().should('contain.text', 'Angular');
    });
  });

  describe('Paginación', () => {
    it('should paginate results correctly', () => {
      // Configurar para mostrar pocos elementos por página
      cy.get('[data-cy="items-per-page"]').select('5');
      
      // Verificar que se muestran solo 5 elementos
      cy.get('[data-cy="result-item"]').should('have.length', 5);
      
      // Ir a la siguiente página
      cy.get('[data-cy="next-page"]').click();
      
      // Verificar que se cargaron nuevos resultados
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="current-page"]').should('contain.text', '2');
    });

    it('should show total results count', () => {
      cy.get('[data-cy="total-results"]').should('be.visible');
      cy.get('[data-cy="total-results"]').should('contain.text', 'resultados encontrados');
    });
  });

  describe('Guardado de filtros', () => {
    it('should save current filters as preset', () => {
      // Configurar filtros
      cy.get('[data-cy="advanced-filters-toggle"]').click();
      cy.get('[data-cy="company-filter"]').click();
      cy.get('[data-cy="company-option-techcorp"]').click();
      cy.get('[data-cy="apply-filters"]').click();
      
      // Guardar filtro
      cy.get('[data-cy="save-filter"]').click();
      cy.get('[data-cy="filter-name-input"]').type('Filtro TechCorp');
      cy.get('[data-cy="save-filter-confirm"]').click();
      
      // Verificar que se guardó
      cy.get('[data-cy="success-message"]').should('contain.text', 'Filtro guardado');
    });

    it('should load saved filter preset', () => {
      // Abrir lista de filtros guardados
      cy.get('[data-cy="saved-filters"]').click();
      cy.get('[data-cy="saved-filter-item"]').first().click();
      
      // Verificar que se aplicó el filtro
      cy.get('[data-cy="active-filters"]').should('be.visible');
    });
  });

  describe('Historial de búsquedas', () => {
    it('should save search to history', () => {
      cy.get('[data-cy="search-input"]').type('Angular Developer');
      cy.get('[data-cy="search-button"]').click();
      
      // Abrir historial
      cy.get('[data-cy="search-history"]').click();
      
      // Verificar que la búsqueda se guardó
      cy.get('[data-cy="history-item"]').first().should('contain.text', 'Angular Developer');
    });

    it('should repeat search from history', () => {
      // Abrir historial y hacer clic en una búsqueda anterior
      cy.get('[data-cy="search-history"]').click();
      cy.get('[data-cy="history-item"]').first().click();
      
      // Verificar que se ejecutó la búsqueda
      cy.get('[data-cy="search-input"]').should('have.value');
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Exportación de resultados', () => {
    it('should export search results', () => {
      // Realizar búsqueda
      cy.get('[data-cy="search-input"]').type('Angular');
      cy.get('[data-cy="search-button"]').click();
      
      // Exportar resultados
      cy.get('[data-cy="export-results"]').click();
      cy.get('[data-cy="export-format"]').select('pdf');
      cy.get('[data-cy="export-confirm"]').click();
      
      // Verificar que se inició la exportación
      cy.get('[data-cy="export-progress"]').should('be.visible');
    });
  });

  describe('Responsividad', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport('iphone-x');
      
      // Verificar que los elementos principales son visibles
      cy.get('[data-cy="search-input"]').should('be.visible');
      cy.get('[data-cy="search-button"]').should('be.visible');
      
      // Verificar que el panel de filtros se adapta
      cy.get('[data-cy="mobile-filters-toggle"]').click();
      cy.get('[data-cy="mobile-filters-panel"]').should('be.visible');
    });

    it('should work correctly on tablet devices', () => {
      cy.viewport('ipad-2');
      
      cy.get('[data-cy="search-input"]').should('be.visible');
      cy.get('[data-cy="facets-panel"]').should('be.visible');
      cy.get('[data-cy="results-panel"]').should('be.visible');
    });
  });

  describe('Accesibilidad', () => {
    it('should be keyboard navigable', () => {
      // Navegar con Tab
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'search-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'search-button');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="search-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="search-button"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="facets-panel"]').should('have.attr', 'role', 'region');
    });

    it('should announce search results to screen readers', () => {
      cy.get('[data-cy="search-input"]').type('Angular');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="search-results"]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-cy="results-count"]').should('have.attr', 'aria-label');
    });
  });
});
