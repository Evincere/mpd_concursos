import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideSecurityStrategies } from './security.providers';
import { provideStateStrategies } from './state.providers';
import { provideMonitoring } from './monitoring.providers';

export function provideExamenFeature(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideSecurityStrategies(),
    provideStateStrategies(),
    provideMonitoring()
  ]);
}
