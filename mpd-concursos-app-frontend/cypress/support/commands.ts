// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Login as test user
 */
Cypress.Commands.add('loginAsTestUser', () => {
  const { username, password } = Cypress.env('testUser');
  
  cy.visit('/login');
  cy.get('[data-cy="username-input"]').type(username);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.wait('@getUser');
});

/**
 * Login as admin user
 */
Cypress.Commands.add('loginAsAdmin', () => {
  const { username, password } = Cypress.env('adminUser');
  
  cy.visit('/login');
  cy.get('[data-cy="username-input"]').type(username);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.wait('@getUser');
});

/**
 * Navigate to CV testing page
 */
Cypress.Commands.add('goToCvTestPage', () => {
  cy.visit('/dashboard/cv-nuevo/test');
  cy.waitForCvComponents();
});

/**
 * Wait for CV components to load
 */
Cypress.Commands.add('waitForCvComponents', () => {
  // Wait for the main CV test page to load
  cy.get('[data-cy="cv-test-page"]', { timeout: 10000 }).should('be.visible');
  
  // Wait for feature flags to be loaded
  cy.get('[data-cy="feature-flags-status"]').should('be.visible');
  
  // Wait for testing controls to be available
  cy.get('[data-cy="testing-controls"]').should('be.visible');
});

/**
 * Create test experience
 */
Cypress.Commands.add('createTestExperience', (experience) => {
  cy.intercept('POST', '**/api/cv/experience/**', {
    statusCode: 201,
    body: {
      success: true,
      data: { id: 'test-exp-1', ...experience }
    }
  }).as('createExperience');
  
  cy.get('[data-cy="add-experience-btn"]').click();
  
  // Fill experience form
  cy.get('[data-cy="experience-position"]').type(experience.position);
  cy.get('[data-cy="experience-company"]').type(experience.company);
  cy.get('[data-cy="experience-start-date"]').type(experience.startDate);
  
  if (experience.endDate) {
    cy.get('[data-cy="experience-end-date"]').type(experience.endDate);
  } else {
    cy.get('[data-cy="experience-current"]').check();
  }
  
  if (experience.description) {
    cy.get('[data-cy="experience-description"]').type(experience.description);
  }
  
  if (experience.location) {
    cy.get('[data-cy="experience-location"]').type(experience.location);
  }
  
  cy.get('[data-cy="save-experience-btn"]').click();
  cy.wait('@createExperience');
});

/**
 * Create test education
 */
Cypress.Commands.add('createTestEducation', (education) => {
  cy.intercept('POST', '**/api/cv/education/**', {
    statusCode: 201,
    body: {
      success: true,
      data: { id: 'test-edu-1', ...education }
    }
  }).as('createEducation');
  
  cy.get('[data-cy="add-education-btn"]').click();
  
  // Fill education form
  cy.get('[data-cy="education-type"]').select(education.type);
  cy.get('[data-cy="education-title"]').type(education.title);
  cy.get('[data-cy="education-institution"]').type(education.institution);
  cy.get('[data-cy="education-status"]').select(education.status);
  
  if (education.startDate) {
    cy.get('[data-cy="education-start-date"]').type(education.startDate);
  }
  
  if (education.endDate) {
    cy.get('[data-cy="education-end-date"]').type(education.endDate);
  }
  
  if (education.description) {
    cy.get('[data-cy="education-description"]').type(education.description);
  }
  
  cy.get('[data-cy="save-education-btn"]').click();
  cy.wait('@createEducation');
});

/**
 * Verify glassmorphism styling
 */
Cypress.Commands.add('verifyGlassmorphismStyling', () => {
  // Check for glassmorphism container
  cy.get('.glassmorphism-container').should('exist');
  
  // Verify backdrop-filter is applied
  cy.get('.glassmorphism-container').should('have.css', 'backdrop-filter');
  
  // Check for proper background color with transparency
  cy.get('.glassmorphism-container').should('have.css', 'background-color')
    .and('include', 'rgba');
  
  // Verify border radius
  cy.get('.glassmorphism-container').should('have.css', 'border-radius', '8px');
  
  // Check for border with transparency
  cy.get('.glassmorphism-container').should('have.css', 'border')
    .and('include', 'rgba(255, 255, 255, 0.2)');
});

/**
 * Custom command for file upload testing
 */
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType: string = 'application/pdf') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('test file content'),
    fileName: fileName,
    mimeType: fileType
  });
});

/**
 * Custom command for waiting for API responses
 */
Cypress.Commands.add('waitForApiResponse', (alias: string, timeout: number = 10000) => {
  cy.wait(alias, { timeout });
});

/**
 * Custom command for checking accessibility
 */
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('[role]').should('exist');
  cy.get('button').should('have.attr', 'type');
  cy.get('input').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
});

// Extend Cypress interface for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>;
      waitForApiResponse(alias: string, timeout?: number): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}
