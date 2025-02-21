import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { FullscreenSecurityStrategy } from '@core/services/examenes/security/strategies/fullscreen.strategy';
import { KeyboardSecurityStrategy } from '@core/services/examenes/security/strategies/keyboard.strategy';
import { TabSwitchSecurityStrategy } from '@core/services/examenes/security/strategies/tab-switch.strategy';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { ExamenPausadoState } from '@core/services/examenes/state/strategies/pausado.state';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';

export function provideSecurityStrategies(): EnvironmentProviders {
  return makeEnvironmentProviders([
    FullscreenSecurityStrategy,
    KeyboardSecurityStrategy,
    TabSwitchSecurityStrategy,
    ExamenSecurityService,
    {
      provide: 'SecurityStrategies',
      useFactory: (
        fullscreenStrategy: FullscreenSecurityStrategy,
        keyboardStrategy: KeyboardSecurityStrategy,
        tabSwitchStrategy: TabSwitchSecurityStrategy,
      ) => [
        fullscreenStrategy,
        keyboardStrategy,
        tabSwitchStrategy,
      ],
      deps: [
        FullscreenSecurityStrategy,
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
  FullscreenSecurityStrategy,
  KeyboardSecurityStrategy,
  TabSwitchSecurityStrategy,
  ExamenSecurityService,
  {
    provide: 'SecurityStrategies',
    useFactory: (
      fullscreen: FullscreenSecurityStrategy,
      keyboard: KeyboardSecurityStrategy,
      tabSwitch: TabSwitchSecurityStrategy
    ) => [fullscreen, keyboard, tabSwitch],
    deps: [FullscreenSecurityStrategy, KeyboardSecurityStrategy, TabSwitchSecurityStrategy]
  }
];
