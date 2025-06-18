import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    env: {
      // Backend API URL for testing
      apiUrl: 'http://localhost:8080/api',
      
      // Test user credentials
      testUser: {
        username: 'user_test',
        password: 'user123'
      },
      
      // Admin user credentials
      adminUser: {
        username: 'admin',
        password: 'admin123'
      },
      
      // Feature flags for testing
      enableCvInlineTesting: true,
      enableCvTestingMetrics: true,
      enableCvTestingLogging: true
    },
    
    setupNodeEvents(on, config) {
      // Task for database seeding
      on('task', {
        seedDatabase() {
          // Implementation for seeding test data
          return null;
        },
        
        cleanDatabase() {
          // Implementation for cleaning test data
          return null;
        },
        
        createTestUser(userData) {
          // Implementation for creating test users
          console.log('Creating test user:', userData);
          return null;
        },
        
        deleteTestUser(userId) {
          // Implementation for deleting test users
          console.log('Deleting test user:', userId);
          return null;
        }
      });
      
      // Plugin for handling file uploads
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.component.cy.ts',
    supportFile: 'cypress/support/component.ts'
  }
});
