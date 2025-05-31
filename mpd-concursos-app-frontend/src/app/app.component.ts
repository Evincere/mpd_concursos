import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { ResponsiveTestRunnerService } from './shared/services/responsive-test-runner.service';

// Componentes cargados de forma perezosa
import { PageTransitionComponent } from './shared/components/page-transition/page-transition.component';

// Importación condicional para el componente de depuración
import { ResponsiveDebugComponent } from './shared/components/responsive-debug/responsive-debug.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ResponsiveDebugComponent, PageTransitionComponent],
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

  constructor(private responsiveTestRunner: ResponsiveTestRunnerService) {}

  ngOnInit(): void {
    // Ejecutar pruebas de responsividad en modo desarrollo
    this.responsiveTestRunner.runTestsIfDevelopment();
  }
}
