// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect in our application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Global before hook for all tests
beforeEach(() => {
  // Set viewport for consistent testing
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '**/api/auth/me', { fixture: 'user.json' }).as('getUser');
  cy.intercept('GET', '**/api/cv/experience/**', { fixture: 'experiences.json' }).as('getExperiences');
  cy.intercept('GET', '**/api/cv/education/**', { fixture: 'education.json' }).as('getEducation');
  
  // Clear local storage and session storage
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Global after hook
afterEach(() => {
  // Take screenshot on failure
  cy.screenshot({ capture: 'runner', onlyOnFailure: true });
});

// Custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with test user
       */
      loginAsTestUser(): Chainable<void>;
      
      /**
       * Custom command to login as admin
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Custom command to navigate to CV testing page
       */
      goToCvTestPage(): Chainable<void>;
      
      /**
       * Custom command to wait for CV components to load
       */
      waitForCvComponents(): Chainable<void>;
      
      /**
       * Custom command to create test experience
       */
      createTestExperience(experience: any): Chainable<void>;
      
      /**
       * Custom command to create test education
       */
      createTestEducation(education: any): Chainable<void>;
      
      /**
       * Custom command to verify glassmorphism styling
       */
      verifyGlassmorphismStyling(): Chainable<void>;
    }
  }
}
