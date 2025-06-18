/**
 * E2E Tests for CV Backend Integration
 * 
 * Tests the complete integration with the Java backend:
 * - Real API calls to backend services
 * - Authentication and authorization
 * - Data persistence and retrieval
 * - Error handling and edge cases
 * - Performance under real conditions
 */

describe('CV Backend Integration', () => {
  const apiUrl = Cypress.env('apiUrl');
  
  beforeEach(() => {
    // Login with real backend authentication
    cy.loginAsTestUser();
    
    // Clean up any existing test data
    cy.task('cleanDatabase');
  });

  afterEach(() => {
    // Clean up test data after each test
    cy.task('cleanDatabase');
  });

  describe('Authentication and Authorization', () => {
    it('should authenticate successfully with backend', () => {
      // Verify JWT token is present and valid
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.not.be.null;
        
        // Decode JWT to verify structure (basic validation)
        const payload = JSON.parse(atob(token.split('.')[1]));
        expect(payload).to.have.property('sub');
        expect(payload).to.have.property('exp');
      });

      // Test API call with authentication
      cy.request({
        method: 'GET',
        url: `${apiUrl}/auth/me`,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('username');
        expect(response.body).to.have.property('roles');
      });
    });

    it('should handle expired tokens gracefully', () => {
      // Set an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', expiredToken);
      });

      // Try to access protected resource
      cy.request({
        method: 'GET',
        url: `${apiUrl}/cv/experience/usuario/test-user-1`,
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should handle unauthorized access', () => {
      // Remove authentication
      cy.clearLocalStorage();

      cy.request({
        method: 'GET',
        url: `${apiUrl}/cv/experience/usuario/test-user-1`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  describe('Experience API Integration', () => {
    it('should create experience via real API', () => {
      const newExperience = {
        position: 'Integration Test Developer',
        company: 'Test Company Ltd',
        startDate: '2024-01-15T00:00:00Z',
        endDate: null,
        description: 'Testing backend integration with real API calls.',
        location: 'Remote',
        isCurrent: true
      };

      // Get auth token
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Create experience via API
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: newExperience
        }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.have.property('id');
          expect(response.body.data.position).to.eq(newExperience.position);
          
          // Store created ID for cleanup
          cy.wrap(response.body.data.id).as('createdExperienceId');
        });
      });
    });

    it('should retrieve experiences from real API', () => {
      // First create test data
      cy.task('createTestUser', { id: 'test-user-1', username: 'test_user' });

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Get experiences
        cy.request({
          method: 'GET',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
          
          // Verify structure of experience objects
          if (response.body.length > 0) {
            const experience = response.body[0];
            expect(experience).to.have.property('id');
            expect(experience).to.have.property('position');
            expect(experience).to.have.property('company');
            expect(experience).to.have.property('startDate');
          }
        });
      });
    });

    it('should update experience via real API', () => {
      // Create experience first
      const originalExperience = {
        position: 'Original Position',
        company: 'Original Company',
        startDate: '2024-01-01T00:00:00Z',
        description: 'Original description'
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Create
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: originalExperience
        }).then((createResponse) => {
          const experienceId = createResponse.body.data.id;
          
          // Update
          const updatedExperience = {
            ...originalExperience,
            position: 'Updated Position',
            description: 'Updated description'
          };

          cy.request({
            method: 'PUT',
            url: `${apiUrl}/cv/experience/${experienceId}`,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: updatedExperience
          }).then((updateResponse) => {
            expect(updateResponse.status).to.eq(200);
            expect(updateResponse.body.success).to.be.true;
            expect(updateResponse.body.data.position).to.eq('Updated Position');
            expect(updateResponse.body.data.description).to.eq('Updated description');
          });
        });
      });
    });

    it('should delete experience via real API', () => {
      // Create experience first
      const experienceToDelete = {
        position: 'To Be Deleted',
        company: 'Delete Company',
        startDate: '2024-01-01T00:00:00Z'
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Create
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: experienceToDelete
        }).then((createResponse) => {
          const experienceId = createResponse.body.data.id;
          
          // Delete
          cy.request({
            method: 'DELETE',
            url: `${apiUrl}/cv/experience/${experienceId}`,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then((deleteResponse) => {
            expect(deleteResponse.status).to.eq(200);
            expect(deleteResponse.body.success).to.be.true;
          });

          // Verify deletion
          cy.request({
            method: 'GET',
            url: `${apiUrl}/cv/experience/${experienceId}`,
            headers: {
              'Authorization': `Bearer ${token}`
            },
            failOnStatusCode: false
          }).then((getResponse) => {
            expect(getResponse.status).to.eq(404);
          });
        });
      });
    });
  });

  describe('Education API Integration', () => {
    it('should create education via real API', () => {
      const newEducation = {
        type: 'UNDERGRADUATE_DEGREE',
        status: 'COMPLETED',
        title: 'Integration Test Degree',
        institution: 'Test University',
        startDate: '2020-03-01T00:00:00Z',
        endDate: '2024-12-15T00:00:00Z',
        description: 'Testing education creation with real backend.'
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/education/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: newEducation
        }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.have.property('id');
          expect(response.body.data.title).to.eq(newEducation.title);
          expect(response.body.data.type).to.eq(newEducation.type);
        });
      });
    });

    it('should validate education enum values with backend', () => {
      const invalidEducation = {
        type: 'INVALID_TYPE',
        status: 'COMPLETED',
        title: 'Test Education',
        institution: 'Test Institution'
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/education/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: invalidEducation,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.success).to.be.false;
          expect(response.body.message).to.include('tipo de educación');
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Simulate slow network by using a very short timeout
        cy.request({
          method: 'GET',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 1, // Very short timeout to simulate network issues
          failOnStatusCode: false
        }).then((response) => {
          // Should handle timeout gracefully
          expect(response.status).to.be.oneOf([408, 504, 0]); // Timeout or gateway timeout
        });
      });
    });

    it('should handle malformed requests', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: 'invalid json',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400);
        });
      });
    });

    it('should handle large payloads', () => {
      const largeDescription = 'A'.repeat(10000); // 10KB description
      
      const largeExperience = {
        position: 'Large Data Test',
        company: 'Big Data Corp',
        startDate: '2024-01-01T00:00:00Z',
        description: largeDescription
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: largeExperience,
          timeout: 30000 // Longer timeout for large payload
        }).then((response) => {
          expect(response.status).to.be.oneOf([201, 413]); // Created or Payload Too Large
        });
      });
    });
  });

  describe('Performance Testing', () => {
    it('should handle concurrent requests efficiently', () => {
      const requests = [];
      
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Create 10 concurrent requests
        for (let i = 0; i < 10; i++) {
          requests.push(
            cy.request({
              method: 'GET',
              url: `${apiUrl}/cv/experience/usuario/test-user-1`,
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          );
        }

        // All requests should complete successfully
        Promise.all(requests).then((responses) => {
          responses.forEach((response) => {
            expect(response.status).to.eq(200);
          });
        });
      });
    });

    it('should respond within acceptable time limits', () => {
      const startTime = Date.now();

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'GET',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((response) => {
          const responseTime = Date.now() - startTime;
          
          expect(response.status).to.eq(200);
          expect(responseTime).to.be.lessThan(2000); // Should respond within 2 seconds
        });
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across operations', () => {
      const testExperience = {
        position: 'Consistency Test',
        company: 'Data Corp',
        startDate: '2024-01-01T00:00:00Z',
        description: 'Testing data consistency'
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Create
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: testExperience
        }).then((createResponse) => {
          const experienceId = createResponse.body.data.id;
          
          // Retrieve and verify
          cy.request({
            method: 'GET',
            url: `${apiUrl}/cv/experience/${experienceId}`,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then((getResponse) => {
            expect(getResponse.body.position).to.eq(testExperience.position);
            expect(getResponse.body.company).to.eq(testExperience.company);
            expect(getResponse.body.description).to.eq(testExperience.description);
          });
        });
      });
    });

    it('should validate required fields on backend', () => {
      const incompleteExperience = {
        position: 'Test Position'
        // Missing required fields: company, startDate
      };

      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.request({
          method: 'POST',
          url: `${apiUrl}/cv/experience/usuario/test-user-1`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: incompleteExperience,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.success).to.be.false;
          expect(response.body.message).to.include('requerido');
        });
      });
    });
  });
});
