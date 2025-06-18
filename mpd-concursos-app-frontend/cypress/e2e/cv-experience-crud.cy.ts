/**
 * E2E Tests for Experience CRUD Operations
 * 
 * Tests the complete lifecycle of experience management:
 * - Create new experiences
 * - Read/display experiences
 * - Update existing experiences
 * - Delete experiences
 * - Inline editing functionality
 * - Document upload
 * - Validation and error handling
 */

describe('CV Experience CRUD Operations', () => {
  beforeEach(() => {
    // Login as test user
    cy.loginAsTestUser();
    
    // Navigate to CV test page
    cy.goToCvTestPage();
    
    // Verify glassmorphism styling
    cy.verifyGlassmorphismStyling();
  });

  describe('Create Experience', () => {
    it('should create a new experience with all fields', () => {
      const newExperience = {
        position: 'Senior Software Engineer',
        company: 'Tech Innovation Corp',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        description: 'Leading development of enterprise applications using modern technologies.',
        location: 'Buenos Aires, Argentina'
      };

      cy.createTestExperience(newExperience);

      // Verify experience was created
      cy.get('[data-cy="experience-list"]')
        .should('contain', newExperience.position)
        .and('contain', newExperience.company);

      // Verify success message
      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Experiencia creada exitosamente');
    });

    it('should create current experience without end date', () => {
      const currentExperience = {
        position: 'Lead Developer',
        company: 'Current Company',
        startDate: '2024-06-01',
        description: 'Current position with ongoing responsibilities.',
        location: 'Remote',
        isCurrent: true
      };

      cy.createTestExperience(currentExperience);

      // Verify current experience indicator
      cy.get('[data-cy="experience-list"]')
        .contains(currentExperience.position)
        .parent()
        .should('contain', 'Actual');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy="add-experience-btn"]').click();

      // Try to save without required fields
      cy.get('[data-cy="save-experience-btn"]').click();

      // Verify validation errors
      cy.get('[data-cy="validation-errors"]').should('be.visible');
      cy.get('[data-cy="position-error"]').should('contain', 'El cargo es requerido');
      cy.get('[data-cy="company-error"]').should('contain', 'La empresa es requerida');
    });

    it('should validate date range', () => {
      cy.get('[data-cy="add-experience-btn"]').click();

      // Fill with invalid date range (end before start)
      cy.get('[data-cy="experience-position"]').type('Test Position');
      cy.get('[data-cy="experience-company"]').type('Test Company');
      cy.get('[data-cy="experience-start-date"]').type('2024-12-01');
      cy.get('[data-cy="experience-end-date"]').type('2024-01-01');

      cy.get('[data-cy="save-experience-btn"]').click();

      // Verify date validation error
      cy.get('[data-cy="date-range-error"]')
        .should('be.visible')
        .and('contain', 'La fecha de fin debe ser posterior a la fecha de inicio');
    });
  });

  describe('Read Experience', () => {
    beforeEach(() => {
      // Load test data
      cy.intercept('GET', '**/api/cv/experience/**', { fixture: 'experiences.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should display all experiences', () => {
      cy.get('[data-cy="experience-list"]').should('be.visible');
      
      // Verify all test experiences are displayed
      cy.get('[data-cy="experience-item"]').should('have.length', 3);
      
      // Verify experience details
      cy.get('[data-cy="experience-item"]').first()
        .should('contain', 'Desarrollador Frontend Senior')
        .and('contain', 'Tech Solutions SA')
        .and('contain', 'Actual');
    });

    it('should show experience details on expand', () => {
      cy.get('[data-cy="experience-item"]').first().click();

      // Verify expanded details
      cy.get('[data-cy="experience-description"]')
        .should('be.visible')
        .and('contain', 'Desarrollo de aplicaciones web');

      cy.get('[data-cy="experience-location"]')
        .should('be.visible')
        .and('contain', 'Buenos Aires');
    });

    it('should display documents when available', () => {
      cy.get('[data-cy="experience-item"]')
        .contains('Innovación Digital SRL')
        .parent()
        .within(() => {
          cy.get('[data-cy="experience-documents"]').should('be.visible');
          cy.get('[data-cy="document-link"]')
            .should('contain', 'Certificado de Trabajo')
            .and('have.attr', 'href');
        });
    });
  });

  describe('Update Experience', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/experience/**', { fixture: 'experiences.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should update experience using inline editing', () => {
      // Click on experience to enter edit mode
      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="edit-experience-btn"]').click();

      // Update position
      cy.get('[data-cy="experience-position-inline"]')
        .clear()
        .type('Senior Full Stack Developer');

      // Update description
      cy.get('[data-cy="experience-description-inline"]')
        .clear()
        .type('Updated description with new responsibilities and technologies.');

      // Mock update API call
      cy.intercept('PUT', '**/api/cv/experience/**', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'exp-1',
            position: 'Senior Full Stack Developer',
            description: 'Updated description with new responsibilities and technologies.'
          }
        }
      }).as('updateExperience');

      // Save changes
      cy.get('[data-cy="save-experience-btn"]').click();
      cy.wait('@updateExperience');

      // Verify changes were saved
      cy.get('[data-cy="experience-item"]').first()
        .should('contain', 'Senior Full Stack Developer');

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Experiencia actualizada exitosamente');
    });

    it('should cancel editing and revert changes', () => {
      const originalPosition = 'Desarrollador Frontend Senior';

      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="edit-experience-btn"]').click();

      // Make changes
      cy.get('[data-cy="experience-position-inline"]')
        .clear()
        .type('Changed Position');

      // Cancel editing
      cy.get('[data-cy="cancel-edit-btn"]').click();

      // Verify original values are restored
      cy.get('[data-cy="experience-item"]').first()
        .should('contain', originalPosition);
    });

    it('should validate inline editing', () => {
      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="edit-experience-btn"]').click();

      // Clear required field
      cy.get('[data-cy="experience-position-inline"]').clear();

      // Try to save
      cy.get('[data-cy="save-experience-btn"]').click();

      // Verify validation error
      cy.get('[data-cy="inline-validation-error"]')
        .should('be.visible')
        .and('contain', 'El cargo es requerido');
    });
  });

  describe('Delete Experience', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/experience/**', { fixture: 'experiences.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should delete experience with confirmation', () => {
      const initialCount = 3;

      // Mock delete API call
      cy.intercept('DELETE', '**/api/cv/experience/**', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Experiencia eliminada exitosamente'
        }
      }).as('deleteExperience');

      // Click delete button
      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="delete-experience-btn"]').click();

      // Confirm deletion in dialog
      cy.get('[data-cy="confirm-delete-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-delete-btn"]').click();

      cy.wait('@deleteExperience');

      // Verify experience was removed
      cy.get('[data-cy="experience-item"]').should('have.length', initialCount - 1);

      // Verify success message
      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Experiencia eliminada exitosamente');
    });

    it('should cancel deletion', () => {
      const initialCount = 3;

      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="delete-experience-btn"]').click();

      // Cancel deletion
      cy.get('[data-cy="confirm-delete-dialog"]').should('be.visible');
      cy.get('[data-cy="cancel-delete-btn"]').click();

      // Verify experience was not removed
      cy.get('[data-cy="experience-item"]').should('have.length', initialCount);
      cy.get('[data-cy="confirm-delete-dialog"]').should('not.exist');
    });
  });

  describe('Document Upload', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/experience/**', { fixture: 'experiences.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should upload document to experience', () => {
      // Mock upload API call
      cy.intercept('POST', '**/api/cv/experience/**/documento', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'exp-1',
            documentUrl: '/documents/new-certificate.pdf'
          }
        }
      }).as('uploadDocument');

      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="upload-document-btn"]').click();

      // Upload file
      cy.uploadFile('[data-cy="file-input"]', 'certificate.pdf');

      cy.wait('@uploadDocument');

      // Verify upload success
      cy.get('[data-cy="upload-success-message"]')
        .should('be.visible')
        .and('contain', 'Documento subido exitosamente');
    });

    it('should validate file type and size', () => {
      cy.get('[data-cy="experience-item"]').first()
        .find('[data-cy="upload-document-btn"]').click();

      // Try to upload invalid file type
      cy.uploadFile('[data-cy="file-input"]', 'document.txt', 'text/plain');

      // Verify validation error
      cy.get('[data-cy="file-validation-error"]')
        .should('be.visible')
        .and('contain', 'Solo se permiten archivos PDF');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      cy.checkA11y();

      // Check specific accessibility features
      cy.get('[data-cy="experience-item"]').should('have.attr', 'role');
      cy.get('[data-cy="add-experience-btn"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="experience-position-inline"]').should('have.attr', 'aria-label');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE

      cy.get('[data-cy="experience-list"]').should('be.visible');
      cy.get('[data-cy="add-experience-btn"]').should('be.visible');

      // Verify mobile-specific layout
      cy.get('.field-row').should('have.css', 'grid-template-columns', '1fr');
    });

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024); // iPad

      cy.get('[data-cy="experience-list"]').should('be.visible');
      cy.verifyGlassmorphismStyling();
    });
  });
});
