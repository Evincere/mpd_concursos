/**
 * Backend Integration Support
 * 
 * Utilities and helpers for testing with real backend integration
 */

/**
 * Setup backend integration testing environment
 */
export function setupBackendIntegration() {
  // Configure API interceptors for real backend calls
  cy.intercept('GET', '**/api/**', (req) => {
    // Add authentication headers if not present
    if (!req.headers.authorization && window.localStorage.getItem('authToken')) {
      req.headers.authorization = `Bearer ${window.localStorage.getItem('authToken')}`;
    }
    
    // Log API calls for debugging
    console.log(`API Call: ${req.method} ${req.url}`);
  });

  // Handle authentication errors
  cy.intercept('GET', '**/api/**', (req) => {
    req.continue((res) => {
      if (res.statusCode === 401) {
        // Clear invalid token and redirect to login
        window.localStorage.removeItem('authToken');
        cy.visit('/login');
      }
    });
  });
}

/**
 * Wait for backend to be ready
 */
export function waitForBackend(timeout: number = 30000) {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.request({
    method: 'GET',
    url: `${apiUrl}/health`,
    timeout: timeout,
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    cy.log('Backend is ready');
  });
}

/**
 * Create test user in backend
 */
export function createBackendTestUser(userData: any) {
  const apiUrl = Cypress.env('apiUrl');
  
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/admin/users`,
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`,
      'Content-Type': 'application/json'
    },
    body: userData,
    failOnStatusCode: false
  });
}

/**
 * Clean test data from backend
 */
export function cleanBackendTestData() {
  const apiUrl = Cypress.env('apiUrl');
  const adminToken = getAdminToken();
  
  // Clean test experiences
  cy.request({
    method: 'DELETE',
    url: `${apiUrl}/admin/test-data/experiences`,
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    failOnStatusCode: false
  });

  // Clean test education
  cy.request({
    method: 'DELETE',
    url: `${apiUrl}/admin/test-data/education`,
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    failOnStatusCode: false
  });

  // Clean test users
  cy.request({
    method: 'DELETE',
    url: `${apiUrl}/admin/test-data/users`,
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    failOnStatusCode: false
  });
}

/**
 * Get admin authentication token
 */
function getAdminToken(): string {
  const apiUrl = Cypress.env('apiUrl');
  const { username, password } = Cypress.env('adminUser');
  
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/login`,
    body: {
      username,
      password
    }
  }).then((response) => {
    return response.body.token;
  });
}

/**
 * Seed backend with test data
 */
export function seedBackendTestData() {
  const apiUrl = Cypress.env('apiUrl');
  const adminToken = getAdminToken();
  
  const testData = {
    users: [
      {
        id: 'test-user-1',
        username: 'test_user_integration',
        email: 'test.integration@example.com',
        password: 'test123',
        roles: ['USER']
      }
    ],
    experiences: [
      {
        userId: 'test-user-1',
        position: 'Test Developer',
        company: 'Test Company',
        startDate: '2023-01-01T00:00:00Z',
        endDate: null,
        description: 'Test experience for integration testing',
        isCurrent: true
      }
    ],
    education: [
      {
        userId: 'test-user-1',
        type: 'UNDERGRADUATE_DEGREE',
        status: 'COMPLETED',
        title: 'Test Degree',
        institution: 'Test University',
        startDate: '2019-03-01T00:00:00Z',
        endDate: '2023-12-15T00:00:00Z'
      }
    ]
  };

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/admin/test-data/seed`,
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: testData
  });
}

/**
 * Verify backend API endpoints are available
 */
export function verifyBackendEndpoints() {
  const apiUrl = Cypress.env('apiUrl');
  const endpoints = [
    '/auth/login',
    '/auth/me',
    '/cv/experience',
    '/cv/education',
    '/health'
  ];

  endpoints.forEach(endpoint => {
    cy.request({
      method: 'OPTIONS',
      url: `${apiUrl}${endpoint}`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 204, 405]); // OK, No Content, or Method Not Allowed
      cy.log(`Endpoint ${endpoint} is available`);
    });
  });
}

/**
 * Test database connection
 */
export function testDatabaseConnection() {
  const apiUrl = Cypress.env('apiUrl');
  
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/admin/database/status`,
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.connected).to.be.true;
    cy.log('Database connection is healthy');
  });
}

/**
 * Monitor API performance during tests
 */
export function monitorApiPerformance() {
  const performanceData: any[] = [];
  
  cy.intercept('**', (req) => {
    const startTime = Date.now();
    
    req.continue((res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      performanceData.push({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      // Log slow requests
      if (duration > 2000) {
        cy.log(`Slow API call detected: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
  });

  // Store performance data for analysis
  cy.wrap(performanceData).as('apiPerformanceData');
}

/**
 * Validate API response schemas
 */
export function validateApiResponseSchema(response: any, expectedSchema: any) {
  // Basic schema validation
  Object.keys(expectedSchema).forEach(key => {
    expect(response.body).to.have.property(key);
    
    if (expectedSchema[key].type) {
      expect(typeof response.body[key]).to.eq(expectedSchema[key].type);
    }
    
    if (expectedSchema[key].required && expectedSchema[key].required === true) {
      expect(response.body[key]).to.not.be.null;
      expect(response.body[key]).to.not.be.undefined;
    }
  });
}

/**
 * Test API rate limiting
 */
export function testApiRateLimit(endpoint: string, maxRequests: number = 100) {
  const apiUrl = Cypress.env('apiUrl');
  const requests: Promise<any>[] = [];
  
  // Send multiple requests rapidly
  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      cy.request({
        method: 'GET',
        url: `${apiUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        },
        failOnStatusCode: false
      })
    );
  }

  // Check if rate limiting is working
  Promise.all(requests).then((responses) => {
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    
    if (rateLimitedResponses.length > 0) {
      cy.log(`Rate limiting is working: ${rateLimitedResponses.length} requests were rate limited`);
    } else {
      cy.log('No rate limiting detected - consider implementing rate limiting for security');
    }
  });
}

// Add custom commands to Cypress
declare global {
  namespace Cypress {
    interface Chainable {
      setupBackendIntegration(): Chainable<void>;
      waitForBackend(timeout?: number): Chainable<void>;
      createBackendTestUser(userData: any): Chainable<any>;
      cleanBackendTestData(): Chainable<void>;
      seedBackendTestData(): Chainable<any>;
      verifyBackendEndpoints(): Chainable<void>;
      testDatabaseConnection(): Chainable<any>;
      monitorApiPerformance(): Chainable<void>;
      validateApiResponseSchema(response: any, schema: any): Chainable<void>;
      testApiRateLimit(endpoint: string, maxRequests?: number): Chainable<void>;
    }
  }
}

// Register commands
Cypress.Commands.add('setupBackendIntegration', setupBackendIntegration);
Cypress.Commands.add('waitForBackend', waitForBackend);
Cypress.Commands.add('createBackendTestUser', createBackendTestUser);
Cypress.Commands.add('cleanBackendTestData', cleanBackendTestData);
Cypress.Commands.add('seedBackendTestData', seedBackendTestData);
Cypress.Commands.add('verifyBackendEndpoints', verifyBackendEndpoints);
Cypress.Commands.add('testDatabaseConnection', testDatabaseConnection);
Cypress.Commands.add('monitorApiPerformance', monitorApiPerformance);
Cypress.Commands.add('validateApiResponseSchema', validateApiResponseSchema);
Cypress.Commands.add('testApiRateLimit', testApiRateLimit);
