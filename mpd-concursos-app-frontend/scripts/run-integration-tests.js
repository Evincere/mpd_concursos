#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Script to run E2E tests with real backend integration
 * Handles backend startup, data seeding, test execution, and cleanup
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  backend: {
    port: 8080,
    healthEndpoint: 'http://localhost:8080/api/health',
    startupTimeout: 60000 // 1 minute
  },
  frontend: {
    port: 4200,
    url: 'http://localhost:4200'
  },
  cypress: {
    configFile: 'cypress.config.ts',
    browser: 'chrome',
    headless: true
  },
  database: {
    testSchema: 'mpd_concursos_test'
  }
};

class IntegrationTestRunner {
  constructor() {
    this.processes = [];
    this.isCleanupInProgress = false;
  }

  /**
   * Main execution flow
   */
  async run() {
    try {
      console.log('🚀 Starting Integration Test Suite...\n');

      // Pre-flight checks
      await this.preflightChecks();

      // Start services
      await this.startBackend();
      await this.startFrontend();

      // Wait for services to be ready
      await this.waitForServices();

      // Prepare test environment
      await this.prepareTestEnvironment();

      // Run tests
      await this.runCypressTests();

      console.log('✅ Integration tests completed successfully!');
      process.exit(0);

    } catch (error) {
      console.error('❌ Integration tests failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Pre-flight checks
   */
  async preflightChecks() {
    console.log('🔍 Running pre-flight checks...');

    // Check if required files exist
    const requiredFiles = [
      'cypress.config.ts',
      'package.json',
      '../mpd-concursos-app-backend/pom.xml'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Check if ports are available
    await this.checkPortAvailability(CONFIG.backend.port);
    await this.checkPortAvailability(CONFIG.frontend.port);

    console.log('✅ Pre-flight checks passed\n');
  }

  /**
   * Start backend service
   */
  async startBackend() {
    console.log('🔧 Starting backend service...');

    return new Promise((resolve, reject) => {
      const backendProcess = spawn('mvn', ['spring-boot:run', '-Dspring.profiles.active=test'], {
        cwd: '../mpd-concursos-app-backend',
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.processes.push(backendProcess);

      let output = '';
      backendProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Started MpdConcursosApplication')) {
          console.log('✅ Backend service started');
          resolve();
        }
      });

      backendProcess.stderr.on('data', (data) => {
        console.error('Backend error:', data.toString());
      });

      backendProcess.on('error', (error) => {
        reject(new Error(`Failed to start backend: ${error.message}`));
      });

      // Timeout
      setTimeout(() => {
        reject(new Error('Backend startup timeout'));
      }, CONFIG.backend.startupTimeout);
    });
  }

  /**
   * Start frontend service
   */
  async startFrontend() {
    console.log('🔧 Starting frontend service...');

    return new Promise((resolve, reject) => {
      const frontendProcess = spawn('npm', ['start'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.processes.push(frontendProcess);

      let output = '';
      frontendProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Local:') && output.includes('4200')) {
          console.log('✅ Frontend service started');
          resolve();
        }
      });

      frontendProcess.stderr.on('data', (data) => {
        const errorStr = data.toString();
        if (!errorStr.includes('WARNING')) {
          console.error('Frontend error:', errorStr);
        }
      });

      frontendProcess.on('error', (error) => {
        reject(new Error(`Failed to start frontend: ${error.message}`));
      });

      // Timeout
      setTimeout(() => {
        reject(new Error('Frontend startup timeout'));
      }, 60000);
    });
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');

    // Wait for backend health check
    await this.waitForUrl(CONFIG.backend.healthEndpoint, 30000);
    
    // Wait for frontend
    await this.waitForUrl(CONFIG.frontend.url, 30000);

    console.log('✅ All services are ready\n');
  }

  /**
   * Prepare test environment
   */
  async prepareTestEnvironment() {
    console.log('🛠️ Preparing test environment...');

    // Create test database schema
    await this.createTestDatabase();

    // Seed test data
    await this.seedTestData();

    console.log('✅ Test environment prepared\n');
  }

  /**
   * Run Cypress tests
   */
  async runCypressTests() {
    console.log('🧪 Running Cypress integration tests...');

    return new Promise((resolve, reject) => {
      const cypressArgs = [
        'run',
        '--config-file', CONFIG.cypress.configFile,
        '--browser', CONFIG.cypress.browser,
        '--spec', 'cypress/e2e/cv-backend-integration.cy.ts',
        '--env', `apiUrl=http://localhost:${CONFIG.backend.port}/api`
      ];

      if (CONFIG.cypress.headless) {
        cypressArgs.push('--headless');
      }

      const cypressProcess = spawn('npx', ['cypress', ...cypressArgs], {
        stdio: 'inherit'
      });

      cypressProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Cypress tests passed');
          resolve();
        } else {
          reject(new Error(`Cypress tests failed with exit code ${code}`));
        }
      });

      cypressProcess.on('error', (error) => {
        reject(new Error(`Failed to run Cypress: ${error.message}`));
      });
    });
  }

  /**
   * Check if port is available
   */
  async checkPortAvailability(port) {
    return new Promise((resolve, reject) => {
      const net = require('net');
      const server = net.createServer();

      server.listen(port, () => {
        server.once('close', () => resolve());
        server.close();
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Wait for URL to be available
   */
  async waitForUrl(url, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return;
        }
      } catch (error) {
        // URL not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for ${url}`);
  }

  /**
   * Create test database
   */
  async createTestDatabase() {
    console.log('📊 Creating test database...');
    
    // This would typically involve running SQL scripts or calling admin endpoints
    // For now, we'll assume the backend handles test database creation
    
    try {
      const response = await fetch(`http://localhost:${CONFIG.backend.port}/api/admin/database/create-test-schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token' // In real scenario, get admin token
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create test database: ${response.statusText}`);
      }
      
      console.log('✅ Test database created');
    } catch (error) {
      console.warn('⚠️ Could not create test database, assuming it exists');
    }
  }

  /**
   * Seed test data
   */
  async seedTestData() {
    console.log('🌱 Seeding test data...');
    
    try {
      const response = await fetch(`http://localhost:${CONFIG.backend.port}/api/admin/test-data/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token' // In real scenario, get admin token
        },
        body: JSON.stringify({
          users: true,
          experiences: true,
          education: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to seed test data: ${response.statusText}`);
      }
      
      console.log('✅ Test data seeded');
    } catch (error) {
      console.warn('⚠️ Could not seed test data, tests will create their own data');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.isCleanupInProgress) {
      return;
    }
    
    this.isCleanupInProgress = true;
    console.log('\n🧹 Cleaning up...');

    // Kill all spawned processes
    for (const process of this.processes) {
      if (process && !process.killed) {
        process.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 5000);
      }
    }

    // Clean test data
    try {
      await fetch(`http://localhost:${CONFIG.backend.port}/api/admin/test-data/clean`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      console.log('✅ Test data cleaned');
    } catch (error) {
      console.warn('⚠️ Could not clean test data');
    }

    console.log('✅ Cleanup completed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run the integration tests
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run().catch((error) => {
    console.error('❌ Integration test runner failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;
