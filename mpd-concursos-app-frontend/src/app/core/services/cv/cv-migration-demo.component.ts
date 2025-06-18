/**
 * CV Migration Demo Component - Testing and demonstration component
 * 
 * This component provides a UI for testing the CV migration functionality
 * and demonstrating the gradual transition between legacy and new services.
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { 
  CvMigrationService, 
  MigrationStrategy, 
  MigrationStatus 
} from './cv-migration.service';
import { FeatureToggleService } from '../feature-toggle.service';
import { CvStateService } from './cv-state.service';
import { Experience, Education, CvData } from '../../models/cv';

@Component({
  selector: 'app-cv-migration-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cv-migration-demo">
      <h2>🔄 CV Migration Demo</h2>
      
      <!-- Migration Status -->
      <div class="status-section">
        <h3>📊 Migration Status</h3>
        <div class="status-card" [ngClass]="'phase-' + migrationStatus.phase">
          <div class="status-header">
            <span class="phase-badge">{{ migrationStatus.phase | uppercase }}</span>
            <span class="timestamp">{{ migrationStatus.lastMigrationCheck | date:'short' }}</span>
          </div>
          
          <div class="services-status">
            <div class="service-item">
              <span class="service-name">Experience Service:</span>
              <span class="service-status" [ngClass]="migrationStatus.experienceService">
                {{ migrationStatus.experienceService }}
              </span>
            </div>
            <div class="service-item">
              <span class="service-name">Education Service:</span>
              <span class="service-status" [ngClass]="migrationStatus.educationService">
                {{ migrationStatus.educationService }}
              </span>
            </div>
            <div class="service-item">
              <span class="service-name">State Management:</span>
              <span class="service-status" [ngClass]="migrationStatus.stateManagement">
                {{ migrationStatus.stateManagement }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Flags Control -->
      <div class="controls-section">
        <h3>🚩 Feature Flags</h3>
        <div class="flag-controls">
          <label class="flag-item">
            <input type="checkbox" 
                   [checked]="featureFlags.useRealServices"
                   (change)="toggleFlag('useRealServices', $event)">
            <span>Use Real Services</span>
          </label>
          
          <label class="flag-item">
            <input type="checkbox" 
                   [checked]="featureFlags.useStandardizedModels"
                   (change)="toggleFlag('useStandardizedModels', $event)">
            <span>Use Standardized Models</span>
          </label>
          
          <label class="flag-item">
            <input type="checkbox" 
                   [checked]="featureFlags.useEnhancedValidation"
                   (change)="toggleFlag('useEnhancedValidation', $event)">
            <span>Use Enhanced Validation</span>
          </label>
        </div>
      </div>

      <!-- Migration Readiness Test -->
      <div class="test-section">
        <h3>🧪 Migration Readiness</h3>
        <button class="test-button" (click)="testMigrationReadiness()" [disabled]="testing">
          {{ testing ? 'Testing...' : 'Test Readiness' }}
        </button>
        
        <div *ngIf="readinessResult" class="readiness-result">
          <div class="readiness-status" [ngClass]="readinessResult.ready ? 'ready' : 'not-ready'">
            {{ readinessResult.ready ? '✅ Ready for Migration' : '❌ Not Ready' }}
          </div>
          
          <div *ngIf="readinessResult.issues.length > 0" class="issues-list">
            <h4>Issues:</h4>
            <ul>
              <li *ngFor="let issue of readinessResult.issues">{{ issue }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Test Operations -->
      <div class="operations-section">
        <h3>⚡ Test Operations</h3>
        
        <div class="operation-group">
          <h4>Load CV Data</h4>
          <input type="text" [(ngModel)]="testUserId" placeholder="User ID" class="user-input">
          <button (click)="testLoadCv()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Load CV' }}
          </button>
        </div>

        <div class="operation-group">
          <h4>Create Experience</h4>
          <button (click)="testCreateExperience()" [disabled]="loading">
            Create Test Experience
          </button>
        </div>

        <div class="operation-group">
          <h4>Create Education</h4>
          <button (click)="testCreateEducation()" [disabled]="loading">
            Create Test Education
          </button>
        </div>
      </div>

      <!-- Results Display -->
      <div *ngIf="lastResult" class="results-section">
        <h3>📋 Last Operation Result</h3>
        <div class="result-card" [ngClass]="lastResult.success ? 'success' : 'error'">
          <div class="result-header">
            <span class="result-status">{{ lastResult.success ? 'SUCCESS' : 'ERROR' }}</span>
            <span class="result-timestamp">{{ lastResult.timestamp | date:'medium' }}</span>
          </div>
          <div class="result-message">{{ lastResult.message }}</div>
          <div *ngIf="lastResult.data" class="result-data">
            <pre>{{ lastResult.data | json }}</pre>
          </div>
        </div>
      </div>

      <!-- Logs -->
      <div class="logs-section">
        <h3>📝 Operation Logs</h3>
        <div class="logs-container">
          <div *ngFor="let log of logs" class="log-entry" [ngClass]="log.level">
            <span class="log-timestamp">{{ log.timestamp | date:'HH:mm:ss' }}</span>
            <span class="log-level">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cv-migration-demo {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .status-section, .controls-section, .test-section, .operations-section, .results-section, .logs-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .status-card {
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ccc;
    }

    .phase-legacy { border-left-color: #ff9800; background: #fff3e0; }
    .phase-hybrid { border-left-color: #2196f3; background: #e3f2fd; }
    .phase-new { border-left-color: #4caf50; background: #e8f5e8; }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .phase-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      background: #666;
    }

    .services-status {
      display: grid;
      gap: 8px;
    }

    .service-item {
      display: flex;
      justify-content: space-between;
    }

    .service-status.legacy { color: #ff9800; }
    .service-status.new { color: #4caf50; }

    .flag-controls {
      display: grid;
      gap: 10px;
    }

    .flag-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .test-button, button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      background: #2196f3;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }

    .test-button:disabled, button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .readiness-result {
      margin-top: 15px;
    }

    .readiness-status.ready { color: #4caf50; font-weight: bold; }
    .readiness-status.not-ready { color: #f44336; font-weight: bold; }

    .operation-group {
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .user-input {
      padding: 8px;
      margin-right: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .result-card {
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ccc;
    }

    .result-card.success { border-left-color: #4caf50; background: #e8f5e8; }
    .result-card.error { border-left-color: #f44336; background: #ffebee; }

    .result-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .result-data pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }

    .logs-container {
      max-height: 300px;
      overflow-y: auto;
      background: #000;
      color: #0f0;
      padding: 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .log-entry {
      margin-bottom: 5px;
    }

    .log-entry.error { color: #ff6b6b; }
    .log-entry.warn { color: #ffd93d; }
    .log-entry.info { color: #74c0fc; }
    .log-entry.debug { color: #51cf66; }

    .log-timestamp { opacity: 0.7; margin-right: 10px; }
    .log-level { 
      display: inline-block; 
      width: 60px; 
      text-transform: uppercase; 
      font-weight: bold; 
    }
  `]
})
export class CvMigrationDemoComponent implements OnInit {
  
  private readonly migrationService = inject(CvMigrationService);
  private readonly featureToggleService = inject(FeatureToggleService);
  private readonly stateService = inject(CvStateService);

  migrationStatus: MigrationStatus = {
    phase: 'legacy',
    experienceService: 'legacy',
    educationService: 'legacy',
    stateManagement: 'legacy',
    lastMigrationCheck: new Date(),
    errors: [],
    warnings: []
  };

  featureFlags: any = {};
  readinessResult: { ready: boolean; issues: string[] } | null = null;
  lastResult: any = null;
  logs: Array<{ timestamp: Date; level: string; message: string }> = [];
  
  testUserId = 'user1';
  testing = false;
  loading = false;

  ngOnInit() {
    this.updateStatus();
    this.updateFeatureFlags();
    this.addLog('info', 'CV Migration Demo initialized');
  }

  updateStatus() {
    this.migrationStatus = this.migrationService.getMigrationStatus();
    this.addLog('debug', `Migration status updated: ${this.migrationStatus.phase} phase`);
  }

  updateFeatureFlags() {
    this.featureFlags = this.featureToggleService.getCvMigrationStrategy();
  }

  toggleFlag(flagName: string, event: any) {
    const enabled = event.target.checked;
    this.featureToggleService.setFeature(flagName, enabled);
    this.updateFeatureFlags();
    this.updateStatus();
    this.addLog('info', `Feature flag ${flagName} ${enabled ? 'enabled' : 'disabled'}`);
  }

  testMigrationReadiness() {
    this.testing = true;
    this.addLog('info', 'Testing migration readiness...');
    
    this.migrationService.testMigrationReadiness().subscribe({
      next: (result) => {
        this.readinessResult = result;
        this.testing = false;
        this.addLog('info', `Readiness test completed: ${result.ready ? 'READY' : 'NOT READY'}`);
        if (result.issues.length > 0) {
          result.issues.forEach(issue => this.addLog('warn', `Issue: ${issue}`));
        }
      },
      error: (error) => {
        this.testing = false;
        this.addLog('error', `Readiness test failed: ${error.message}`);
      }
    });
  }

  testLoadCv() {
    if (!this.testUserId) {
      this.addLog('warn', 'Please enter a user ID');
      return;
    }

    this.loading = true;
    this.addLog('info', `Loading CV for user: ${this.testUserId}`);
    
    this.migrationService.loadUserCv(this.testUserId).subscribe({
      next: (cvData) => {
        this.loading = false;
        this.lastResult = {
          success: true,
          message: 'CV loaded successfully',
          data: cvData,
          timestamp: new Date()
        };
        this.addLog('info', `CV loaded: ${cvData.experiences.length} experiences, ${cvData.education.length} education records`);
      },
      error: (error) => {
        this.loading = false;
        this.lastResult = {
          success: false,
          message: `Failed to load CV: ${error.message}`,
          timestamp: new Date()
        };
        this.addLog('error', `CV load failed: ${error.message}`);
      }
    });
  }

  testCreateExperience() {
    const testExperience: Experience = {
      userId: this.testUserId,
      position: 'Test Developer',
      company: 'Test Company',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-01-01'),
      description: 'Test experience created by migration demo',
      location: 'Remote'
    };

    this.loading = true;
    this.addLog('info', 'Creating test experience...');
    
    this.migrationService.createExperience(this.testUserId, testExperience).subscribe({
      next: (result) => {
        this.loading = false;
        this.lastResult = {
          success: result.success,
          message: result.message,
          data: result.data,
          timestamp: new Date()
        };
        this.addLog(result.success ? 'info' : 'error', `Experience creation: ${result.message}`);
      },
      error: (error) => {
        this.loading = false;
        this.lastResult = {
          success: false,
          message: `Failed to create experience: ${error.message}`,
          timestamp: new Date()
        };
        this.addLog('error', `Experience creation failed: ${error.message}`);
      }
    });
  }

  testCreateEducation() {
    const testEducation: Education = {
      userId: this.testUserId,
      type: 'UNIVERSITY_DEGREE' as any,
      institution: 'Test University',
      title: 'Computer Science',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2024-01-01'),
      status: 'COMPLETED' as any,
      description: 'Test education created by migration demo'
    };

    this.loading = true;
    this.addLog('info', 'Creating test education...');
    
    this.migrationService.createEducation(this.testUserId, testEducation).subscribe({
      next: (result) => {
        this.loading = false;
        this.lastResult = {
          success: result.success,
          message: result.message,
          data: result.data,
          timestamp: new Date()
        };
        this.addLog(result.success ? 'info' : 'error', `Education creation: ${result.message}`);
      },
      error: (error) => {
        this.loading = false;
        this.lastResult = {
          success: false,
          message: `Failed to create education: ${error.message}`,
          timestamp: new Date()
        };
        this.addLog('error', `Education creation failed: ${error.message}`);
      }
    });
  }

  private addLog(level: string, message: string) {
    this.logs.unshift({
      timestamp: new Date(),
      level,
      message
    });
    
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50);
    }
  }
}
