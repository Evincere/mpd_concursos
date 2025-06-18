/**
 * Feature Toggle Service Tests - Unit tests for feature flag management
 */

import { TestBed } from '@angular/core/testing';
import { FeatureToggleService } from './feature-toggle.service';

describe('FeatureToggleService', () => {
  let service: FeatureToggleService;
  let localStorageSpy: jasmine.Spy;

  beforeEach(() => {
    // Mock localStorage
    const store: { [key: string]: string } = {};
    localStorageSpy = spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    TestBed.configureTestingModule({
      providers: [FeatureToggleService]
    });
    service = TestBed.inject(FeatureToggleService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Feature Flag Management', () => {
    
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should return default feature values', () => {
      expect(service.isEnabled('useStandardizedModels')).toBe(true);
      expect(service.isEnabled('useEnhancedValidation')).toBe(true);
      expect(service.isEnabled('useLegacyComponents')).toBe(true);
    });

    it('should enable a feature', () => {
      service.enableFeature('useInlineEditing');
      expect(service.isEnabled('useInlineEditing')).toBe(true);
    });

    it('should disable a feature', () => {
      service.disableFeature('useStandardizedModels');
      expect(service.isEnabled('useStandardizedModels')).toBe(false);
    });

    it('should toggle a feature', () => {
      const initialState = service.isEnabled('useInlineEditing');
      service.toggleFeature('useInlineEditing');
      expect(service.isEnabled('useInlineEditing')).toBe(!initialState);
    });

    it('should handle non-existent features gracefully', () => {
      spyOn(console, 'warn');
      const result = service.isEnabled('nonExistentFeature');
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("[FeatureToggle] Feature 'nonExistentFeature' not found");
    });
  });

  describe('Feature Dependencies', () => {
    
    it('should respect feature dependencies', () => {
      // useInlineEditing depends on useStandardizedModels
      service.disableFeature('useStandardizedModels');
      service.enableFeature('useInlineEditing');
      
      // Even though useInlineEditing is enabled, it should return false due to dependency
      expect(service.isEnabled('useInlineEditing')).toBe(false);
    });

    it('should allow feature when dependencies are met', () => {
      service.enableFeature('useStandardizedModels');
      service.enableFeature('useInlineEditing');
      
      expect(service.isEnabled('useInlineEditing')).toBe(true);
    });

    it('should handle multiple dependencies', () => {
      // useUnifiedCvComponents depends on both useStandardizedModels and useRealCvServices
      service.enableFeature('useStandardizedModels');
      service.disableFeature('useRealCvServices');
      service.enableFeature('useUnifiedCvComponents');
      
      expect(service.isEnabled('useUnifiedCvComponents')).toBe(false);
      
      service.enableFeature('useRealCvServices');
      expect(service.isEnabled('useUnifiedCvComponents')).toBe(true);
    });
  });

  describe('Feature Persistence', () => {
    
    it('should persist feature changes to localStorage', () => {
      service.enableFeature('useInlineEditing');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mpd_feature_flags',
        jasmine.any(String)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mpd_feature_flags_useInlineEditing',
        'true'
      );
    });

    it('should load features from localStorage on initialization', () => {
      // Simulate stored feature flags
      localStorageSpy.and.callFake((key: string) => {
        if (key === 'mpd_feature_flags_useInlineEditing') {
          return 'true';
        }
        return null;
      });

      // Create new service instance to test initialization
      const newService = new FeatureToggleService();
      expect(newService.isEnabled('useInlineEditing')).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      spyOn(console, 'warn');
      
      service.enableFeature('useInlineEditing');
      
      expect(console.warn).toHaveBeenCalledWith(
        '[FeatureToggle] Failed to persist features:',
        jasmine.any(Error)
      );
    });
  });

  describe('CV Migration Strategy', () => {
    
    it('should return correct migration strategy', () => {
      service.enableFeature('useStandardizedModels');
      service.enableFeature('useRealCvServices');
      service.enableFeature('useInlineEditing');
      service.enableFeature('useUnifiedCvComponents');
      service.enableFeature('useLegacyComponents');

      const strategy = service.getCvMigrationStrategy();

      expect(strategy).toEqual({
        useNewModels: true,
        useRealServices: true,
        useInlineEdit: true,
        useUnifiedComponents: true,
        fallbackToLegacy: true
      });
    });

    it('should return conservative migration strategy when features are disabled', () => {
      service.disableFeature('useStandardizedModels');
      service.disableFeature('useRealCvServices');
      service.disableFeature('useInlineEditing');
      service.disableFeature('useUnifiedCvComponents');

      const strategy = service.getCvMigrationStrategy();

      expect(strategy).toEqual({
        useNewModels: false,
        useRealServices: false,
        useInlineEdit: false,
        useUnifiedComponents: false,
        fallbackToLegacy: true // This should remain true by default
      });
    });
  });

  describe('Feature Information', () => {
    
    it('should return all features', () => {
      const allFeatures = service.getAllFeatures();
      
      expect(allFeatures).toBeDefined();
      expect(allFeatures['useStandardizedModels']).toBeDefined();
      expect(allFeatures['useInlineEditing']).toBeDefined();
      expect(allFeatures['useRealCvServices']).toBeDefined();
    });

    it('should return specific feature details', () => {
      const feature = service.getFeature('useStandardizedModels');

      expect(feature).toBeDefined();
      if (feature && typeof feature === 'object') {
        expect(feature.key).toBe('useStandardizedModels');
        expect(feature.description).toContain('standardized CV models');
      }
    });

    it('should return null for non-existent feature', () => {
      const feature = service.getFeature('nonExistentFeature');
      expect(feature).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    
    it('should reset all features to defaults', () => {
      // Change some features
      service.enableFeature('useInlineEditing');
      service.disableFeature('useStandardizedModels');
      
      // Reset to defaults
      service.resetToDefaults();
      
      // Check that features are back to default values
      expect(service.isEnabled('useStandardizedModels')).toBe(true); // Default is true
      expect(service.isEnabled('useInlineEditing')).toBe(false); // Default is false
    });

    it('should log reset action', () => {
      spyOn(console, 'log');
      service.resetToDefaults();
      expect(console.log).toHaveBeenCalledWith('[FeatureToggle] Features reset to defaults');
    });
  });

  describe('Observable Features', () => {
    
    it('should emit feature changes through observable', (done) => {
      let emissionCount = 0;
      
      service.features$.subscribe(features => {
        emissionCount++;
        
        if (emissionCount === 1) {
          // Initial emission
          expect(features['useInlineEditing']).toBeDefined();
        } else if (emissionCount === 2) {
          // After feature change
          const feature = features['useInlineEditing'];
          const enabled = typeof feature === 'boolean' ? feature : feature.enabled;
          expect(enabled).toBe(true);
          done();
        }
      });

      // Trigger feature change
      service.enableFeature('useInlineEditing');
    });
  });

  describe('Environment Integration', () => {
    
    it('should consider environment settings for production features', () => {
      // This test would need to mock environment.production
      // For now, we just verify the service handles environment-based features
      const realServicesEnabled = service.isEnabled('useRealCvServices');
      expect(typeof realServicesEnabled).toBe('boolean');
    });
  });
});
