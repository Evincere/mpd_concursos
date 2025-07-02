import { ApplicationConfig, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { materialProviders } from './core/config/material.config';
import { ErrorDialogComponent } from '@shared/components/error-dialog/error-dialog.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IndexedDBService } from './core/services/storage/indexed-db.service';
import { CSPService } from './core/services/security/csp.service';
import { AuthService } from './core/services/auth/auth.service';
import { AppInitializationService } from './core/services/app-initialization.service';
import { ProfileService } from './core/services/profile/profile.service';
// Legacy ExperienceService removed - using ExperienceSimpleService
import { TokenService } from './core/services/auth/token.service';
import { DocumentosService } from './core/services/documentos/documentos.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error-interceptor.function';
import { debugInterceptor } from './core/interceptors/debug.interceptor';
// CV Mock interceptor removed - CV functionality will be reimplemented
import { urlTransformInterceptor } from './core/interceptors/url-transform.interceptor';
import { environment } from '../environments/environment';
// Legacy EducacionService removed - using EducationSimpleService
import { ArgentinaDataService } from './core/services/argentina-data.service';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { reducers } from './core/store';
import { ResponsiveService } from './shared/services/responsive.service';
import { provideServiceWorker } from '@angular/service-worker';
import { GlobalErrorHandler } from './core/services/error/global-error-handler';
import { ErrorHandler } from '@angular/core';

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
    // ExperienceService, // ❌ Legacy service removed
    TokenService,
    DocumentosService,
    // EducacionService, // ❌ Legacy service removed
    ArgentinaDataService,
    IndexedDBService,
    CSPService,
    AppInitializationService,
    // Inicialización de la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: (appInit: AppInitializationService) => () => appInit.initializeApp(),
      deps: [AppInitializationService],
      multi: true
    },
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
    }),
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]
};

/**
 * Configuración de interceptores
 */
function getInterceptors() {
  return [
    AuthInterceptor,
    ErrorInterceptor,
    debugInterceptor,
    urlTransformInterceptor
  ];
}
