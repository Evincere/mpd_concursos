import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { configureGlobalApexChartsDefaults } from './app/core/config/chart-global-config';

// CRITICAL: Configure ApexCharts global defaults BEFORE bootstrapping
configureGlobalApexChartsDefaults();

// Configuración de depuración
if (environment.logLevel === 'debug') {
  console.log('Aplicación iniciando en modo debug');
}

// Bootstrap de la aplicación
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('Aplicación iniciada correctamente');
  })
  .catch((err: any) => {
    console.error('Error al iniciar la aplicación:', err);
  });
