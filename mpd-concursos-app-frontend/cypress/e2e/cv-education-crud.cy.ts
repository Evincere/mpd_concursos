/**
 * E2E Tests for Education CRUD Operations
 * 
 * Tests the complete lifecycle of education management:
 * - Create new education records
 * - Read/display education
 * - Update existing education
 * - Delete education
 * - Scientific activities management
 * - Document upload
 * - Validation and error handling
 */

describe('CV Education CRUD Operations', () => {
  beforeEach(() => {
    // Login as test user
    cy.loginAsTestUser();
    
    // Navigate to CV test page
    cy.goToCvTestPage();
    
    // Verify glassmorphism styling
    cy.verifyGlassmorphismStyling();
  });

  describe('Create Education', () => {
    it('should create a new education record with all fields', () => {
      const newEducation = {
        type: 'POSTGRADUATE_MASTERS',
        title: 'Maestría en Ingeniería de Software',
        institution: 'Universidad Nacional de La Plata',
        status: 'IN_PROGRESS',
        startDate: '2024-03-01',
        description: 'Maestría enfocada en metodologías ágiles y arquitecturas de software modernas.'
      };

      cy.createTestEducation(newEducation);

      // Verify education was created
      cy.get('[data-cy="education-list"]')
        .should('contain', newEducation.title)
        .and('contain', newEducation.institution);

      // Verify success message
      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Registro de educación creado exitosamente');
    });

    it('should create completed education with end date', () => {
      const completedEducation = {
        type: 'UNDERGRADUATE_DEGREE',
        title: 'Ingeniería en Sistemas',
        institution: 'Universidad Tecnológica Nacional',
        status: 'COMPLETED',
        startDate: '2018-03-01',
        endDate: '2023-12-15',
        description: 'Carrera de grado con orientación en desarrollo de software.'
      };

      cy.createTestEducation(completedEducation);

      // Verify completed status
      cy.get('[data-cy="education-list"]')
        .contains(completedEducation.title)
        .parent()
        .should('contain', 'Completado');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy="add-education-btn"]').click();

      // Try to save without required fields
      cy.get('[data-cy="save-education-btn"]').click();

      // Verify validation errors
      cy.get('[data-cy="validation-errors"]').should('be.visible');
      cy.get('[data-cy="type-error"]').should('contain', 'El tipo de educación es requerido');
      cy.get('[data-cy="title-error"]').should('contain', 'El título es requerido');
      cy.get('[data-cy="institution-error"]').should('contain', 'La institución es requerida');
    });

    it('should validate education type selection', () => {
      cy.get('[data-cy="add-education-btn"]').click();

      // Verify all education types are available
      cy.get('[data-cy="education-type"]').click();
      cy.get('option[value="HIGHER_EDUCATION_DEGREE"]').should('contain', 'Título Terciario');
      cy.get('option[value="UNDERGRADUATE_DEGREE"]').should('contain', 'Título Universitario');
      cy.get('option[value="POSTGRADUATE_SPECIALIZATION"]').should('contain', 'Especialización');
      cy.get('option[value="POSTGRADUATE_MASTERS"]').should('contain', 'Maestría');
      cy.get('option[value="POSTGRADUATE_DOCTORATE"]').should('contain', 'Doctorado');
    });
  });

  describe('Read Education', () => {
    beforeEach(() => {
      // Load test data
      cy.intercept('GET', '**/api/cv/education/**', { fixture: 'education.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should display all education records', () => {
      cy.get('[data-cy="education-list"]').should('be.visible');
      
      // Verify all test education records are displayed
      cy.get('[data-cy="education-item"]').should('have.length', 3);
      
      // Verify education details
      cy.get('[data-cy="education-item"]').first()
        .should('contain', 'Licenciatura en Sistemas de Información')
        .and('contain', 'Universidad Tecnológica Nacional')
        .and('contain', 'Completado');
    });

    it('should show education details on expand', () => {
      cy.get('[data-cy="education-item"]').first().click();

      // Verify expanded details
      cy.get('[data-cy="education-description"]')
        .should('be.visible')
        .and('contain', 'Carrera de grado enfocada en desarrollo de software');

      cy.get('[data-cy="education-duration"]')
        .should('be.visible')
        .and('contain', '5 años');

      cy.get('[data-cy="education-average"]')
        .should('be.visible')
        .and('contain', '8.5');
    });

    it('should display scientific activities when available', () => {
      cy.get('[data-cy="education-item"]')
        .contains('Especialización en Desarrollo de Software')
        .parent()
        .within(() => {
          cy.get('[data-cy="scientific-activities"]').should('be.visible');
          cy.get('[data-cy="scientific-activity-item"]')
            .should('contain', 'Análisis de Patrones de Arquitectura')
            .and('contain', 'PRINCIPAL_INVESTIGATOR');
        });
    });

    it('should display documents when available', () => {
      cy.get('[data-cy="education-item"]')
        .contains('Licenciatura en Sistemas')
        .parent()
        .within(() => {
          cy.get('[data-cy="education-documents"]').should('be.visible');
          cy.get('[data-cy="document-link"]')
            .should('contain', 'Título Universitario')
            .and('have.attr', 'href');
        });
    });
  });

  describe('Update Education', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/education/**', { fixture: 'education.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should update education using inline editing', () => {
      // Click on education to enter edit mode
      cy.get('[data-cy="education-item"]').first()
        .find('[data-cy="edit-education-btn"]').click();

      // Update title
      cy.get('[data-cy="education-title-inline"]')
        .clear()
        .type('Licenciatura en Ingeniería en Sistemas de Información');

      // Update description
      cy.get('[data-cy="education-description-inline"]')
        .clear()
        .type('Carrera actualizada con nuevas materias de inteligencia artificial.');

      // Mock update API call
      cy.intercept('PUT', '**/api/cv/education/**', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'edu-1',
            title: 'Licenciatura en Ingeniería en Sistemas de Información',
            description: 'Carrera actualizada con nuevas materias de inteligencia artificial.'
          }
        }
      }).as('updateEducation');

      // Save changes
      cy.get('[data-cy="save-education-btn"]').click();
      cy.wait('@updateEducation');

      // Verify changes were saved
      cy.get('[data-cy="education-item"]').first()
        .should('contain', 'Licenciatura en Ingeniería en Sistemas de Información');

      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Registro de educación actualizado exitosamente');
    });

    it('should update education status', () => {
      cy.get('[data-cy="education-item"]')
        .contains('Especialización en Desarrollo de Software')
        .parent()
        .find('[data-cy="edit-education-btn"]').click();

      // Change status from IN_PROGRESS to COMPLETED
      cy.get('[data-cy="education-status-inline"]').select('COMPLETED');

      // Add end date
      cy.get('[data-cy="education-end-date-inline"]').type('2025-12-15');

      // Mock update API call
      cy.intercept('PUT', '**/api/cv/education/**', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'edu-2',
            status: 'COMPLETED',
            endDate: '2025-12-15T00:00:00Z'
          }
        }
      }).as('updateEducationStatus');

      cy.get('[data-cy="save-education-btn"]').click();
      cy.wait('@updateEducationStatus');

      // Verify status change
      cy.get('[data-cy="education-item"]')
        .contains('Especialización en Desarrollo de Software')
        .parent()
        .should('contain', 'Completado');
    });
  });

  describe('Scientific Activities Management', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/education/**', { fixture: 'education.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should add scientific activity to education', () => {
      cy.get('[data-cy="education-item"]')
        .contains('Especialización en Desarrollo de Software')
        .parent()
        .find('[data-cy="edit-education-btn"]').click();

      // Add new scientific activity
      cy.get('[data-cy="add-scientific-activity-btn"]').click();

      // Fill scientific activity form
      cy.get('[data-cy="scientific-activity-type"]').select('PUBLICATION');
      cy.get('[data-cy="scientific-activity-title"]')
        .type('Artículo sobre Microservicios en la Industria');
      cy.get('[data-cy="scientific-activity-role"]').select('AUTHOR');
      cy.get('[data-cy="scientific-activity-description"]')
        .type('Publicación en revista científica sobre implementación de microservicios.');

      // Save education with new activity
      cy.get('[data-cy="save-education-btn"]').click();

      // Verify activity was added
      cy.get('[data-cy="scientific-activities"]')
        .should('contain', 'Artículo sobre Microservicios en la Industria')
        .and('contain', 'AUTHOR');
    });

    it('should remove scientific activity', () => {
      cy.get('[data-cy="education-item"]')
        .contains('Especialización en Desarrollo de Software')
        .parent()
        .find('[data-cy="edit-education-btn"]').click();

      // Remove existing scientific activity
      cy.get('[data-cy="scientific-activity-item"]').first()
        .find('[data-cy="remove-activity-btn"]').click();

      // Confirm removal
      cy.get('[data-cy="confirm-remove-activity"]').click();

      // Save changes
      cy.get('[data-cy="save-education-btn"]').click();

      // Verify activity was removed
      cy.get('[data-cy="scientific-activities"]')
        .should('not.contain', 'Análisis de Patrones de Arquitectura');
    });
  });

  describe('Delete Education', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/cv/education/**', { fixture: 'education.json' });
      cy.reload();
      cy.waitForCvComponents();
    });

    it('should delete education with confirmation', () => {
      const initialCount = 3;

      // Mock delete API call
      cy.intercept('DELETE', '**/api/cv/education/**', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Registro de educación eliminado exitosamente'
        }
      }).as('deleteEducation');

      // Click delete button
      cy.get('[data-cy="education-item"]').first()
        .find('[data-cy="delete-education-btn"]').click();

      // Confirm deletion in dialog
      cy.get('[data-cy="confirm-delete-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-delete-btn"]').click();

      cy.wait('@deleteEducation');

      // Verify education was removed
      cy.get('[data-cy="education-item"]').should('have.length', initialCount - 1);

      // Verify success message
      cy.get('[data-cy="success-message"]')
        .should('be.visible')
        .and('contain', 'Registro de educación eliminado exitosamente');
    });
  });

  describe('Document Upload', () => {
    it('should upload document to education', () => {
      // Mock upload API call
      cy.intercept('POST', '**/api/cv/education/**/documento', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'edu-1',
            documentUrl: '/documents/new-diploma.pdf'
          }
        }
      }).as('uploadDocument');

      cy.get('[data-cy="education-item"]').first()
        .find('[data-cy="upload-document-btn"]').click();

      // Upload file
      cy.uploadFile('[data-cy="file-input"]', 'diploma.pdf');

      cy.wait('@uploadDocument');

      // Verify upload success
      cy.get('[data-cy="upload-success-message"]')
        .should('be.visible')
        .and('contain', 'Documento subido exitosamente');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '**/api/cv/education/**', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Error interno del servidor'
        }
      }).as('createEducationError');

      const newEducation = {
        type: 'UNDERGRADUATE_DEGREE',
        title: 'Test Education',
        institution: 'Test Institution',
        status: 'COMPLETED'
      };

      cy.createTestEducation(newEducation);

      // Verify error message
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .and('contain', 'Error interno del servidor');
    });

    it('should validate dangerous content', () => {
      cy.get('[data-cy="add-education-btn"]').click();

      // Try to enter dangerous content
      cy.get('[data-cy="education-description"]')
        .type('<script>alert("xss")</script>');

      // Verify security validation
      cy.get('[data-cy="security-warning"]')
        .should('be.visible')
        .and('contain', 'Contenido potencialmente peligroso detectado');
    });
  });

  describe('Accessibility and Responsive Design', () => {
    it('should be accessible', () => {
      cy.checkA11y();

      // Check specific accessibility features
      cy.get('[data-cy="education-item"]').should('have.attr', 'role');
      cy.get('[data-cy="add-education-btn"]').should('have.attr', 'aria-label');
    });

    it('should work on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE

      cy.get('[data-cy="education-list"]').should('be.visible');
      cy.get('[data-cy="add-education-btn"]').should('be.visible');

      // Verify mobile-specific layout
      cy.get('.field-row').should('have.css', 'grid-template-columns', '1fr');
    });
  });
});
