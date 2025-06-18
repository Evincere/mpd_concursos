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
}
