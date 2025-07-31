import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { ResponsiveTestRunnerService } from './shared/services/responsive-test-runner.service';
import { AccessibilityPreferencesService } from './core/services/accessibility/accessibility-preferences.service';
import { FontLoaderService } from './core/services/font-loader.service';
import { IconConverterService } from './core/services/icon-converter.service';

// Componentes cargados de forma perezosa
import { PageTransitionComponent } from './shared/components/page-transition/page-transition.component';

// Importación condicional para el componente de depuración
import { ResponsiveDebugComponent } from './shared/components/responsive-debug/responsive-debug.component';
import { WelcomeModalComponent } from './shared/components/welcome-modal/welcome-modal.component';
import { WelcomeModalService } from './core/services/welcome-modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ResponsiveDebugComponent, PageTransitionComponent, WelcomeModalComponent],
  templateUrl: './app.component.html',
  animations: [
    trigger('fadeAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ],
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'mpd-concursos-app';

  constructor(
    private responsiveTestRunner: ResponsiveTestRunnerService,
    private accessibilityPreferences: AccessibilityPreferencesService,
    private fontLoader: FontLoaderService,
    private iconConverter: IconConverterService,
    private welcomeModalService: WelcomeModalService
  ) {}

  ngOnInit(): void {
    // Ejecutar pruebas de responsividad en modo desarrollo
    this.responsiveTestRunner.runTestsIfDevelopment();

    // Inicializar preferencias de accesibilidad
    // El servicio se auto-inicializa, pero lo inyectamos para asegurar que se cargue
    console.log('Accessibility preferences initialized:', this.accessibilityPreferences.preferences());

    // Inicializar carga de fuentes y conversión de iconos
    // Los servicios FontLoaderService e IconConverterService se auto-inicializan
    // y detectan/solucionan automáticamente problemas de fuentes e iconos

    // Exponer métodos de testing para el modal de bienvenida
    this.welcomeModalService.exposeForTesting();
  }
}
