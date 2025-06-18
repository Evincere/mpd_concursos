
/**
 * CV Migration Feature Flags Initialization
 * This script sets up localStorage with the required feature flags
 */

(function initializeCvMigrationFlags() {
  console.log('🚀 Initializing CV Migration feature flags...');
  
  const flags = {
    useNewCvServices: true,
    useNewCvStateManagement: true,
    useInlineComponents: true,
    enableRealTimeValidation: true,
    enableCvInlineTesting: true,
    enableCvTestingMetrics: true,
    enableCvTestingLogging: true,
    enableCvMockDataGeneration: true,
    enableCvValidationTesting: true,
    enableCvPerformanceTesting: true,
    fallbackToLegacy: true,
    enableErrorRecovery: true,
    logMigrationEvents: true
  };

  // Set individual flags
  Object.entries(flags).forEach(([key, value]) => {
    localStorage.setItem(`feature_toggle_${key}`, JSON.stringify(value));
  });

  // Set master configuration
  localStorage.setItem('feature_toggle_config', JSON.stringify({
    version: '2.0.0',
    activatedAt: new Date().toISOString(),
    activatedBy: 'cv-migration-script',
    flags: flags
  }));

  console.log('✅ CV Migration feature flags initialized');
})();
