import { Injectable } from '@angular/core';
import { ResponsiveTestingService } from './responsive-testing.service';
import { ResponsiveService } from './responsive.service';
import { ResponsiveTests } from '../testing/responsive-tests';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveTestResultsComponent } from '../components/responsive-test-results/responsive-test-results.component';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveTestRunnerService {
  private tests: ResponsiveTests;

  constructor(
    private responsiveTestingService: ResponsiveTestingService,
    private responsiveService: ResponsiveService,
    private dialog: MatDialog
  ) {
    this.tests = new ResponsiveTests(this.responsiveService);
  }

  /**
   * Ejecuta pruebas de responsividad si no estamos en producción
   */
  runTestsIfDevelopment(): void {
    // Pruebas deshabilitadas temporalmente
    console.log('Pruebas de responsividad deshabilitadas temporalmente');
    // if (!environment.production) {
    //   // Esperar a que la aplicación se cargue completamente
    //   setTimeout(() => {
    //     this.tests.runTests();
    //   }, 2000);
    // }
  }

  /**
   * Ejecuta pruebas de responsividad manualmente
   */
  runTests(): void {
    // Pruebas deshabilitadas temporalmente
    console.log('Ejecución manual de pruebas de responsividad deshabilitada temporalmente');
    // this.tests.runTests();

    // // Mostrar resultados en un diálogo
    // setTimeout(() => {
    //   this.showTestResults();
    // }, 1000);
  }

  /**
   * Muestra los resultados de las pruebas en un diálogo
   */
  showTestResults(): void {
    this.dialog.open(ResponsiveTestResultsComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });
  }
}
