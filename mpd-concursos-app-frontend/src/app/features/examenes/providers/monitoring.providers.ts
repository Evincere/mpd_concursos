import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ExamenActivityLoggerService } from '@core/services/examenes/examen-activity-logger.service';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';

export function provideMonitoring(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ExamenActivityLoggerService,
    ExamenTimeService
  ]);
}
