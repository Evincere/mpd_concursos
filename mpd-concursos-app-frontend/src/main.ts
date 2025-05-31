import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Configuración de depuración
if (environment.logLevel === 'debug') {
  console.log('Iniciando aplicación en modo de depuración');
  console.log('Entorno:', environment);
}

// Inicializar la aplicación
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log(`Aplicación iniciada correctamente (v${environment.version})`);
  })
  .catch((err) => {
    console.error('Error al iniciar la aplicación:', err);
  });
