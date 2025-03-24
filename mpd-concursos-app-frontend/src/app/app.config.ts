import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { materialProviders } from './core/config/material.config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/services/auth/auth.service';
import { ProfileService } from './core/services/profile/profile.service';
import { ExperienceService } from './core/services/experience/experience.service';
import { TokenService } from './core/services/auth/token.service';
import { DocumentosService } from './core/services/documentos/documentos.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { EducacionService } from './core/services/educacion/educacion.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    ...materialProviders,
    // Proveedores de servicios core
    AuthService,
    ProfileService,
    ExperienceService,
    TokenService,
    DocumentosService,
    EducacionService,
    provideHttpClient(withInterceptors([AuthInterceptor]))
  ]
};
