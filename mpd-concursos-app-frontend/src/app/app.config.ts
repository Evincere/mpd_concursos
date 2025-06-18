import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { materialProviders } from './core/config/material.config';
import { ErrorDialogComponent } from '@shared/components/error-dialog/error-dialog.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IndexedDBService } from './core/services/storage/indexed-db.service';
import { CSPService } from './core/services/security/csp.service';
import { AuthService } from './core/services/auth/auth.service';
import { ProfileService } from './core/services/profile/profile.service';
import { ExperienceService } from './core/services/experience/experience.service';
import { TokenService } from './core/services/auth/token.service';
import { DocumentosService } from './core/services/documentos/documentos.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error-interceptor.function';
import { debugInterceptor } from './core/interceptors/debug.interceptor';
import { cvEnhancedInterceptor } from './core/interceptors/cv-enhanced.interceptor';
import { cvMockInterceptor } from './core/interceptors/cv-mock.interceptor';
import { environment } from '../environments/environment';
import { EducacionService } from './core/services/educacion/educacion.service';
import { ArgentinaDataService } from './core/services/argentina-data.service';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { reducers } from './core/store';
import { ResponsiveService } from './shared/services/responsive.service';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top'
    })),
    provideAnimations(),
    ...materialProviders,
    // Componentes de diálogo
    ErrorDialogComponent,
    // Proveedores de servicios core
    AuthService,
    ProfileService,
    ExperienceService,
    TokenService,
    DocumentosService,
    EducacionService,
    ArgentinaDataService,
    IndexedDBService,
    CSPService,
    // Proveedores de servicios de responsividad
    ResponsiveService,
    // Proveedores de tokens para inyección
    { provide: 'ResponsiveService', useExisting: ResponsiveService },
    // Deshabilitamos temporalmente los servicios de prueba
    { provide: 'ResponsiveTestRunnerService', useValue: {} },
    // Configuración condicional de interceptores
    provideHttpClient(withInterceptors(
      getInterceptors()
    )),
    // NgRx Store
    provideStore(reducers),
    provideEffects([]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};

/**
 * Configuración condicional de interceptores basada en environment
 * ✅ Mock interceptor solo en desarrollo
 * ❌ Mock interceptor deshabilitado en producción
 */
function getInterceptors() {
  const baseInterceptors = [
    AuthInterceptor,
    ErrorInterceptor,
    cvEnhancedInterceptor,
    debugInterceptor
  ];

  // Solo agregar mock interceptor en desarrollo
  if (environment.features?.enableCvMockInterceptor) {
    baseInterceptors.splice(2, 0, cvMockInterceptor);
  }

  return baseInterceptors;
}
