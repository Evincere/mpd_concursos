import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { FullscreenStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';
import { KeyboardSecurityStrategy } from '@core/services/examenes/security/strategies/keyboard.strategy';
import { TabSwitchSecurityStrategy } from '@core/services/examenes/security/strategies/tab-switch.strategy';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenPausadoState } from '@core/services/examenes/state/strategies/pausado.state';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';

export function provideSecurityStrategies(): EnvironmentProviders {
  return makeEnvironmentProviders([
    FullscreenStrategy,
    KeyboardSecurityStrategy,
    TabSwitchSecurityStrategy,
    ExamenSecurityService,
    {
      provide: 'SecurityStrategies',
      useFactory: (
        fullscreenStrategy: FullscreenStrategy,
        keyboardStrategy: KeyboardSecurityStrategy,
        tabSwitchStrategy: TabSwitchSecurityStrategy,
      ) => [
        fullscreenStrategy,
        keyboardStrategy,
        tabSwitchStrategy,
      ],
      deps: [
        FullscreenStrategy,
        KeyboardSecurityStrategy,
        TabSwitchSecurityStrategy,
      ]
    },
    {
      provide: 'ExamenEnCurso',
      useFactory: () => ({
        estado: 'INICIAL',
        // otras propiedades iniciales necesarias...
      })
    },
    ExamenTimeService,
    ExamenPausadoState
  ]);
}

export const SECURITY_PROVIDERS: Provider[] = [
  FullscreenStrategy,
  KeyboardSecurityStrategy,
  TabSwitchSecurityStrategy,
  ExamenSecurityService,
  {
    provide: 'SecurityStrategies',
    useFactory: (
      fullscreen: FullscreenStrategy,
      keyboard: KeyboardSecurityStrategy,
      tabSwitch: TabSwitchSecurityStrategy
    ) => [fullscreen, keyboard, tabSwitch],
    deps: [FullscreenStrategy, KeyboardSecurityStrategy, TabSwitchSecurityStrategy]
  }
];
