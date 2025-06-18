/**
 * Feature Toggle Service - Manages feature flags for gradual migration
 * 
 * Enables safe rollout of new CV functionality while maintaining backward compatibility.
 * Supports environment-based configuration and runtime feature toggling.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  dependencies?: string[];
}

export interface FeatureConfig {
  [key: string]: boolean | FeatureFlag;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureToggleService {
  
  private readonly STORAGE_KEY = 'mpd_feature_flags';
  
  private featuresSubject = new BehaviorSubject<FeatureConfig>(this.getInitialFeatures());
  public features$ = this.featuresSubject.asObservable();

  /**
   * Default feature configuration
   */
  private defaultFeatures: FeatureConfig = {
    // CV Refactoring Features
    useRealCvServices: {
      key: 'useRealCvServices',
      enabled: this.getStoredFlag('useRealCvServices', false),
      description: 'Use real CV services instead of mock services',
      dependencies: []
    },
    
    useStandardizedModels: {
      key: 'useStandardizedModels',
      enabled: this.getStoredFlag('useStandardizedModels', true),
      description: 'Use new standardized CV models with English terminology',
      dependencies: []
    },
    
    useInlineEditing: {
      key: 'useInlineEditing',
      enabled: this.getStoredFlag('useInlineEditing', false),
      description: 'Enable inline editing for CV items instead of wizard',
      dependencies: ['useStandardizedModels']
    },
    
    useUnifiedCvComponents: {
      key: 'useUnifiedCvComponents',
      enabled: this.getStoredFlag('useUnifiedCvComponents', false),
      description: 'Use new unified CV component architecture',
      dependencies: ['useStandardizedModels', 'useRealCvServices']
    },
    
    useEnhancedValidation: {
      key: 'useEnhancedValidation',
      enabled: this.getStoredFlag('useEnhancedValidation', true),
      description: 'Enable enhanced CV form validation with XSS protection',
      dependencies: []
    },
    
    // Legacy Support
    useLegacyComponents: {
      key: 'useLegacyComponents',
      enabled: this.getStoredFlag('useLegacyComponents', true),
      description: 'Keep legacy CV components as fallback',
      dependencies: []
    },
    
    useMockServices: {
      key: 'useMockServices',
      enabled: this.getStoredFlag('useMockServices', true),
      description: 'Use mock services for development/testing',
      dependencies: []
    },
    
    useWizardFlow: {
      key: 'useWizardFlow',
      enabled: this.getStoredFlag('useWizardFlow', true),
      description: 'Use wizard flow for adding CV items',
      dependencies: []
    },
    
    // Performance Features
    useLazyLoading: {
      key: 'useLazyLoading',
      enabled: this.getStoredFlag('useLazyLoading', false),
      description: 'Enable lazy loading for CV components',
      dependencies: []
    },
    
    useVirtualScrolling: {
      key: 'useVirtualScrolling',
      enabled: this.getStoredFlag('useVirtualScrolling', false),
      description: 'Enable virtual scrolling for large CV lists',
      dependencies: []
    },
    
    // Debug Features
    enableCvDebugMode: {
      key: 'enableCvDebugMode',
      enabled: this.getStoredFlag('enableCvDebugMode', false),
      description: 'Enable debug logging for CV operations',
      dependencies: []
    },

    // Testing Features for CV Inline (Fase 2)
    enableCvInlineTesting: {
      key: 'enableCvInlineTesting',
      enabled: this.getStoredFlag('enableCvInlineTesting', true),
      description: 'Enable CV inline components testing page',
      dependencies: []
    },

    enableCvTestingMetrics: {
      key: 'enableCvTestingMetrics',
      enabled: this.getStoredFlag('enableCvTestingMetrics', true),
      description: 'Enable performance metrics collection for CV testing',
      dependencies: ['enableCvInlineTesting']
    },

    enableCvTestingLogging: {
      key: 'enableCvTestingLogging',
      enabled: this.getStoredFlag('enableCvTestingLogging', true),
      description: 'Enable detailed logging for CV testing operations',
      dependencies: ['enableCvInlineTesting']
    },

    enableCvMockDataGeneration: {
      key: 'enableCvMockDataGeneration',
      enabled: this.getStoredFlag('enableCvMockDataGeneration', true),
      description: 'Enable automatic mock data generation for CV testing',
      dependencies: ['enableCvInlineTesting']
    },

    enableCvValidationTesting: {
      key: 'enableCvValidationTesting',
      enabled: this.getStoredFlag('enableCvValidationTesting', true),
      description: 'Enable validation system testing for CV components',
      dependencies: ['enableCvInlineTesting', 'useEnhancedValidation']
    },

    enableCvPerformanceTesting: {
      key: 'enableCvPerformanceTesting',
      enabled: this.getStoredFlag('enableCvPerformanceTesting', true),
      description: 'Enable performance testing for CV inline components',
      dependencies: ['enableCvInlineTesting', 'enableCvTestingMetrics']
    }
  };

  constructor() {
    this.initializeFeatures();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(featureKey: string): boolean {
    const features = this.featuresSubject.value;
    const feature = features[featureKey];
    
    if (!feature) {
      console.warn(`[FeatureToggle] Feature '${featureKey}' not found`);
      return false;
    }

    const enabled = typeof feature === 'boolean' ? feature : feature.enabled;
    
    // Check dependencies
    if (typeof feature === 'object' && feature.dependencies) {
      const dependenciesMet = feature.dependencies.every(dep => this.isEnabled(dep));
      if (!dependenciesMet) {
        return false;
      }
    }

    return enabled;
  }

  /**
   * Enable a feature
   */
  enableFeature(featureKey: string): void {
    this.setFeature(featureKey, true);
  }

  /**
   * Disable a feature
   */
  disableFeature(featureKey: string): void {
    this.setFeature(featureKey, false);
  }

  /**
   * Toggle a feature
   */
  toggleFeature(featureKey: string): void {
    const currentState = this.isEnabled(featureKey);
    this.setFeature(featureKey, !currentState);
  }

  /**
   * Set feature state
   */
  setFeature(featureKey: string, enabled: boolean): void {
    const features = { ...this.featuresSubject.value };
    const feature = features[featureKey];
    
    if (!feature) {
      console.warn(`[FeatureToggle] Feature '${featureKey}' not found`);
      return;
    }

    if (typeof feature === 'boolean') {
      features[featureKey] = enabled;
    } else {
      features[featureKey] = { ...feature, enabled };
    }

    this.featuresSubject.next(features);
    this.persistFeatures(features);
    
    console.log(`[FeatureToggle] Feature '${featureKey}' ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get all features
   */
  getAllFeatures(): FeatureConfig {
    return this.featuresSubject.value;
  }

  /**
   * Get feature details
   */
  getFeature(featureKey: string): FeatureFlag | boolean | null {
    return this.featuresSubject.value[featureKey] || null;
  }

  /**
   * Reset all features to default
   */
  resetToDefaults(): void {
    this.featuresSubject.next(this.defaultFeatures);
    this.persistFeatures(this.defaultFeatures);
    console.log('[FeatureToggle] Features reset to defaults');
  }

  /**
   * Get CV migration strategy based on current feature flags
   */
  getCvMigrationStrategy(): {
    useNewModels: boolean;
    useRealServices: boolean;
    useInlineEdit: boolean;
    useUnifiedComponents: boolean;
    fallbackToLegacy: boolean;
  } {
    return {
      useNewModels: this.isEnabled('useStandardizedModels'),
      useRealServices: this.isEnabled('useRealCvServices'),
      useInlineEdit: this.isEnabled('useInlineEditing'),
      useUnifiedComponents: this.isEnabled('useUnifiedCvComponents'),
      fallbackToLegacy: this.isEnabled('useLegacyComponents')
    };
  }

  /**
   * Get CV testing configuration based on current feature flags
   */
  getCvTestingConfiguration(): {
    enableTesting: boolean;
    enableMetrics: boolean;
    enableLogging: boolean;
    enableMockData: boolean;
    enableValidationTesting: boolean;
    enablePerformanceTesting: boolean;
  } {
    return {
      enableTesting: this.isEnabled('enableCvInlineTesting'),
      enableMetrics: this.isEnabled('enableCvTestingMetrics'),
      enableLogging: this.isEnabled('enableCvTestingLogging'),
      enableMockData: this.isEnabled('enableCvMockDataGeneration'),
      enableValidationTesting: this.isEnabled('enableCvValidationTesting'),
      enablePerformanceTesting: this.isEnabled('enableCvPerformanceTesting')
    };
  }

  /**
   * Enable all CV testing features for development
   */
  enableCvTestingMode(): void {
    console.log('[FeatureToggle] Enabling CV testing mode');

    this.setFeature('enableCvInlineTesting', true);
    this.setFeature('enableCvTestingMetrics', true);
    this.setFeature('enableCvTestingLogging', true);
    this.setFeature('enableCvMockDataGeneration', true);
    this.setFeature('enableCvValidationTesting', true);
    this.setFeature('enableCvPerformanceTesting', true);
    this.setFeature('enableCvDebugMode', true);

    // Also enable inline components for testing
    this.setFeature('useInlineEditing', true);
    this.setFeature('useUnifiedCvComponents', true);
  }

  /**
   * Disable all CV testing features for production
   */
  disableCvTestingMode(): void {
    console.log('[FeatureToggle] Disabling CV testing mode');

    this.setFeature('enableCvInlineTesting', false);
    this.setFeature('enableCvTestingMetrics', false);
    this.setFeature('enableCvTestingLogging', false);
    this.setFeature('enableCvMockDataGeneration', false);
    this.setFeature('enableCvValidationTesting', false);
    this.setFeature('enableCvPerformanceTesting', false);
    this.setFeature('enableCvDebugMode', false);
  }

  /**
   * Check if CV testing is available
   */
  isCvTestingAvailable(): boolean {
    return this.isEnabled('enableCvInlineTesting');
  }

  /**
   * Initialize features from storage and environment
   */
  private initializeFeatures(): void {
    const features = this.getInitialFeatures();
    this.featuresSubject.next(features);
  }

  /**
   * Get initial feature configuration
   */
  private getInitialFeatures(): FeatureConfig {
    const storedFeatures = this.getStoredFeatures();
    const result: FeatureConfig = { ...this.defaultFeatures };

    // Merge stored features, filtering out undefined values
    Object.entries(storedFeatures).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Get stored feature flag value
   */
  private getStoredFlag(key: string, defaultValue: boolean): boolean {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get all stored features
   */
  private getStoredFeatures(): Partial<FeatureConfig> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Persist features to localStorage
   */
  private persistFeatures(features: FeatureConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(features));

      // Also store individual flags for easier access
      Object.entries(features).forEach(([key, feature]) => {
        const enabled = typeof feature === 'boolean' ? feature : feature.enabled;
        localStorage.setItem(`${this.STORAGE_KEY}_${key}`, JSON.stringify(enabled));
      });
    } catch (error) {
      console.warn('[FeatureToggle] Failed to persist features:', error);
    }
  }

  // ========================================
  // CV MIGRATION METHODS
  // ========================================

  /**
   * Activate complete CV migration to new system
   * Phase 1: Enable new system as default with legacy fallback
   */
  activateCompleteCvMigration(): void {
    console.log('[FeatureToggleService] 🚀 Activating complete CV migration to new system');

    // Enable all new CV features
    this.enableFeature('useNewCvServices');
    this.enableFeature('useNewCvStateManagement');
    this.enableFeature('useInlineComponents');
    this.enableFeature('enableRealTimeValidation');

    // Enable CV testing features for monitoring
    this.enableFeature('enableCvInlineTesting');
    this.enableFeature('enableCvTestingMetrics');
    this.enableFeature('enableCvTestingLogging');
    this.enableFeature('enableCvMockDataGeneration');
    this.enableFeature('enableCvValidationTesting');
    this.enableFeature('enableCvPerformanceTesting');

    // Keep fallback enabled during transition
    this.enableFeature('fallbackToLegacy');
    this.enableFeature('enableErrorRecovery');
    this.enableFeature('logMigrationEvents');

    console.log('[FeatureToggleService] ✅ Complete CV migration activated with legacy fallback');
  }

  /**
   * Disable legacy CV system (final step)
   * Phase 2: Remove legacy fallback after validation
   */
  disableLegacyCvSystem(): void {
    console.log('[FeatureToggleService] 🔄 Disabling legacy CV system');

    // Disable fallback to legacy
    this.disableFeature('fallbackToLegacy');

    // Keep error recovery and logging for monitoring
    this.enableFeature('enableErrorRecovery');
    this.enableFeature('logMigrationEvents');

    console.log('[FeatureToggleService] ✅ Legacy CV system disabled - New system only');
  }

  /**
   * Check if CV migration is complete
   */
  isCvMigrationComplete(): boolean {
    return this.isEnabled('useNewCvServices') &&
           this.isEnabled('useNewCvStateManagement') &&
           this.isEnabled('useInlineComponents') &&
           !this.isEnabled('fallbackToLegacy');
  }

  /**
   * Get migration status for monitoring
   */
  getCvMigrationStatus(): {
    phase: 'legacy' | 'transitioning' | 'complete';
    newSystemEnabled: boolean;
    legacyFallbackEnabled: boolean;
    testingEnabled: boolean;
    timestamp: Date;
  } {
    const newSystemEnabled = this.isEnabled('useNewCvServices');
    const legacyFallbackEnabled = this.isEnabled('fallbackToLegacy');
    const testingEnabled = this.isEnabled('enableCvTestingMetrics');

    let phase: 'legacy' | 'transitioning' | 'complete';

    if (!newSystemEnabled) {
      phase = 'legacy';
    } else if (legacyFallbackEnabled) {
      phase = 'transitioning';
    } else {
      phase = 'complete';
    }

    return {
      phase,
      newSystemEnabled,
      legacyFallbackEnabled,
      testingEnabled,
      timestamp: new Date()
    };
  }

  /**
   * Emergency rollback to legacy system
   */
  emergencyRollbackToLegacy(): void {
    console.warn('[FeatureToggleService] 🚨 EMERGENCY ROLLBACK to legacy CV system');

    // Disable new system
    this.disableFeature('useNewCvServices');
    this.disableFeature('useNewCvStateManagement');
    this.disableFeature('useInlineComponents');

    // Enable legacy fallback
    this.enableFeature('fallbackToLegacy');
    this.enableFeature('enableErrorRecovery');
    this.enableFeature('logMigrationEvents');

    console.warn('[FeatureToggleService] ⚠️ Emergency rollback completed - Legacy system active');
  }
}
