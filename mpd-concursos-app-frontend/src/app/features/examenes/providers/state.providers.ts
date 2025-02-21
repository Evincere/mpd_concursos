import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenStateService } from '@core/services/examenes/state/examen-state.service';

export function provideStateStrategies(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ExamenTimeService,
    ExamenStateService
  ]);
}
