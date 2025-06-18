/**
 * E2E Tests for CV Test Page
 * 
 * Tests the CV testing interface and functionality:
 * - Page loading and initialization
 * - Feature flags integration
 * - Testing controls functionality
 * - Metrics and logging systems
 * - Performance monitoring
 * - Overall user experience
 */

describe('CV Test Page', () => {
  beforeEach(() => {
    // Login as test user
    cy.loginAsTestUser();
  });

  describe('Page Access and Loading', () => {
    it('should load CV test page successfully', () => {
      cy.goToCvTestPage();

      // Verify page elements are present
      cy.get('[data-cy="cv-test-page"]').should('be.visible');
      cy.get('[data-cy="page-title"]').should('contain', 'CV Inline Testing');
      
      // Verify glassmorphism styling
      cy.verifyGlassmorphismStyling();
    });

    it('should redirect to login if not authenticated', () => {
      // Clear authentication
      cy.clearLocalStorage();
      cy.clearCookies();

      cy.visit('/dashboard/cv-nuevo/test');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should show access denied for users without testing permissions', () => {
      // Mock user without testing permissions
      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'user-no-perms',
          username: 'limited_user',
          roles: ['USER'],
          permissions: []
        }
      });

      cy.visit('/dashboard/cv-nuevo/test');

      // Should show access denied message
      cy.get('[data-cy="access-denied"]')
        .should('be.visible')
        .and('contain', 'No tienes permisos para acceder a esta página');
    });
  });

  describe('Feature Flags Integration', () => {
    beforeEach(() => {
      cy.goToCvTestPage();
    });

    it('should display feature flags status', () => {
      cy.get('[data-cy="feature-flags-status"]').should('be.visible');

      // Verify individual feature flags
      cy.get('[data-cy="flag-cv-inline-testing"]')
        .should('be.visible')
        .and('contain', 'Habilitado');

      cy.get('[data-cy="flag-cv-testing-metrics"]')
        .should('be.visible')
        .and('contain', 'Habilitado');

      cy.get('[data-cy="flag-cv-testing-logging"]')
        .should('be.visible')
        .and('contain', 'Habilitado');
    });

    it('should allow toggling feature flags', () => {
      // Toggle metrics flag
      cy.get('[data-cy="toggle-metrics-flag"]').click();

      // Verify flag status changed
      cy.get('[data-cy="flag-cv-testing-metrics"]')
        .should('contain', 'Deshabilitado');

      // Verify metrics section is hidden
      cy.get('[data-cy="metrics-section"]').should('not.be.visible');

      // Toggle back
      cy.get('[data-cy="toggle-metrics-flag"]').click();
      cy.get('[data-cy="flag-cv-testing-metrics"]')
        .should('contain', 'Habilitado');
    });

    it('should enable/disable testing mode', () => {
      // Enable full testing mode
      cy.get('[data-cy="enable-testing-mode-btn"]').click();

      // Verify all flags are enabled
      cy.get('[data-cy="feature-flags-status"]')
        .find('[data-cy^="flag-"]')
        .should('contain', 'Habilitado');

      // Disable testing mode
      cy.get('[data-cy="disable-testing-mode-btn"]').click();

      // Verify flags are disabled
      cy.get('[data-cy="feature-flags-status"]')
        .find('[data-cy^="flag-"]')
        .should('contain', 'Deshabilitado');
    });
  });

  describe('Testing Controls', () => {
    beforeEach(() => {
      cy.goToCvTestPage();
    });

    it('should display testing controls', () => {
      cy.get('[data-cy="testing-controls"]').should('be.visible');

      // Verify control buttons
      cy.get('[data-cy="run-all-tests-btn"]').should('be.visible');
      cy.get('[data-cy="load-test-data-btn"]').should('be.visible');
      cy.get('[data-cy="clear-data-btn"]').should('be.visible');
      cy.get('[data-cy="generate-report-btn"]').should('be.visible');
    });

    it('should run all tests successfully', () => {
      // Mock test execution
      cy.intercept('POST', '**/api/cv/test/run-all', {
        statusCode: 200,
        body: {
          success: true,
          results: {
            total: 6,
            passed: 6,
            failed: 0,
            duration: 1250
          }
        }
      }).as('runAllTests');

      cy.get('[data-cy="run-all-tests-btn"]').click();

      // Verify loading state
      cy.get('[data-cy="tests-loading"]').should('be.visible');

      cy.wait('@runAllTests');

      // Verify test results
      cy.get('[data-cy="test-results"]').should('be.visible');
      cy.get('[data-cy="tests-passed"]').should('contain', '6');
      cy.get('[data-cy="tests-failed"]').should('contain', '0');
      cy.get('[data-cy="test-duration"]').should('contain', '1.25s');
    });

    it('should load test data', () => {
      // Mock data loading
      cy.intercept('POST', '**/api/cv/test/load-data', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            experiences: 3,
            education: 2
          }
        }
      }).as('loadTestData');

      cy.get('[data-cy="load-test-data-btn"]').click();

      cy.wait('@loadTestData');

      // Verify data was loaded
      cy.get('[data-cy="data-loaded-message"]')
        .should('be.visible')
        .and('contain', 'Datos de prueba cargados exitosamente');

      // Verify data counts
      cy.get('[data-cy="experience-count"]').should('contain', '3');
      cy.get('[data-cy="education-count"]').should('contain', '2');
    });

    it('should clear test data', () => {
      // Mock data clearing
      cy.intercept('DELETE', '**/api/cv/test/clear-data', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Datos de prueba eliminados'
        }
      }).as('clearTestData');

      cy.get('[data-cy="clear-data-btn"]').click();

      // Confirm clearing
      cy.get('[data-cy="confirm-clear-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-clear-btn"]').click();

      cy.wait('@clearTestData');

      // Verify data was cleared
      cy.get('[data-cy="data-cleared-message"]')
        .should('be.visible')
        .and('contain', 'Datos de prueba eliminados exitosamente');
    });
  });

  describe('Metrics and Logging', () => {
    beforeEach(() => {
      cy.goToCvTestPage();
    });

    it('should display metrics dashboard', () => {
      cy.get('[data-cy="metrics-section"]').should('be.visible');

      // Verify metrics components
      cy.get('[data-cy="performance-metrics"]').should('be.visible');
      cy.get('[data-cy="component-metrics"]').should('be.visible');
      cy.get('[data-cy="session-metrics"]').should('be.visible');
    });

    it('should show real-time performance metrics', () => {
      // Trigger some actions to generate metrics
      cy.get('[data-cy="run-all-tests-btn"]').click();

      // Wait for metrics to update
      cy.wait(2000);

      // Verify metrics are displayed
      cy.get('[data-cy="render-time"]').should('not.be.empty');
      cy.get('[data-cy="validation-time"]').should('not.be.empty');
      cy.get('[data-cy="memory-usage"]').should('not.be.empty');
    });

    it('should export metrics data', () => {
      cy.get('[data-cy="export-metrics-btn"]').click();

      // Verify download was triggered
      cy.readFile('cypress/downloads/cv-metrics.json').should('exist');
    });

    it('should display logging information', () => {
      cy.get('[data-cy="logging-section"]').should('be.visible');

      // Verify log levels
      cy.get('[data-cy="log-level-debug"]').should('be.visible');
      cy.get('[data-cy="log-level-info"]').should('be.visible');
      cy.get('[data-cy="log-level-warn"]').should('be.visible');
      cy.get('[data-cy="log-level-error"]').should('be.visible');
    });

    it('should filter logs by level', () => {
      // Set filter to show only errors
      cy.get('[data-cy="log-filter-select"]').select('error');

      // Verify only error logs are shown
      cy.get('[data-cy="log-entry"]').each(($log) => {
        cy.wrap($log).should('contain', 'ERROR');
      });
    });
  });

  describe('Component Testing Interface', () => {
    beforeEach(() => {
      cy.goToCvTestPage();
    });

    it('should display component testing sections', () => {
      cy.get('[data-cy="experience-testing"]').should('be.visible');
      cy.get('[data-cy="education-testing"]').should('be.visible');
    });

    it('should allow adding test experiences', () => {
      cy.get('[data-cy="add-test-experience-btn"]').click();

      // Verify experience was added to test list
      cy.get('[data-cy="test-experience-list"]')
        .find('[data-cy="test-experience-item"]')
        .should('have.length.greaterThan', 0);
    });

    it('should allow adding test education', () => {
      cy.get('[data-cy="add-test-education-btn"]').click();

      // Verify education was added to test list
      cy.get('[data-cy="test-education-list"]')
        .find('[data-cy="test-education-item"]')
        .should('have.length.greaterThan', 0);
    });

    it('should validate component interactions', () => {
      // Add test data
      cy.get('[data-cy="add-test-experience-btn"]').click();

      // Test inline editing
      cy.get('[data-cy="test-experience-item"]').first()
        .find('[data-cy="edit-btn"]').click();

      // Verify edit mode is active
      cy.get('[data-cy="inline-edit-mode"]').should('be.visible');

      // Make changes and save
      cy.get('[data-cy="position-input"]').clear().type('Updated Position');
      cy.get('[data-cy="save-btn"]').click();

      // Verify changes were applied
      cy.get('[data-cy="test-experience-item"]').first()
        .should('contain', 'Updated Position');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load quickly', () => {
      const startTime = Date.now();

      cy.goToCvTestPage();

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load in less than 3 seconds
      });
    });

    it('should be responsive on different screen sizes', () => {
      // Test mobile
      cy.viewport(375, 667);
      cy.goToCvTestPage();
      cy.get('[data-cy="cv-test-page"]').should('be.visible');

      // Test tablet
      cy.viewport(768, 1024);
      cy.get('[data-cy="cv-test-page"]').should('be.visible');

      // Test desktop
      cy.viewport(1920, 1080);
      cy.get('[data-cy="cv-test-page"]').should('be.visible');
    });

    it('should handle large datasets efficiently', () => {
      // Load large test dataset
      cy.intercept('POST', '**/api/cv/test/load-large-data', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            experiences: 100,
            education: 50
          }
        }
      }).as('loadLargeData');

      cy.get('[data-cy="load-large-dataset-btn"]').click();
      cy.wait('@loadLargeData');

      // Verify page remains responsive
      cy.get('[data-cy="cv-test-page"]').should('be.visible');
      cy.get('[data-cy="performance-warning"]').should('not.exist');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.goToCvTestPage();
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '**/api/cv/test/run-all', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Error interno del servidor'
        }
      }).as('testError');

      cy.get('[data-cy="run-all-tests-btn"]').click();
      cy.wait('@testError');

      // Verify error is displayed
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .and('contain', 'Error interno del servidor');
    });

    it('should handle network failures', () => {
      // Simulate network failure
      cy.intercept('POST', '**/api/cv/test/run-all', { forceNetworkError: true }).as('networkError');

      cy.get('[data-cy="run-all-tests-btn"]').click();
      cy.wait('@networkError');

      // Verify network error message
      cy.get('[data-cy="network-error"]')
        .should('be.visible')
        .and('contain', 'Error de conexión');
    });
  });
});
