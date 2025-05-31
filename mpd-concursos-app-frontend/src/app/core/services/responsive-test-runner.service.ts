import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

/**
 * Servicio para ejecutar pruebas de responsividad en la aplicación
 * Este servicio es utilizado para verificar que los componentes se muestren correctamente
 * en diferentes tamaños de pantalla
 */
@Injectable({
  providedIn: 'root'
})
export class ResponsiveTestRunnerService {
  
  constructor(private dialog: MatDialog) {}

  /**
   * Ejecuta pruebas de responsividad si no estamos en producción
   */
  runTestsIfDevelopment(): void {
    // Pruebas deshabilitadas temporalmente
    console.log('Pruebas de responsividad deshabilitadas temporalmente');
    // En una implementación real, aquí se ejecutarían las pruebas
  }

  /**
   * Ejecuta pruebas de responsividad manualmente
   */
  runTests(): void {
    // Pruebas deshabilitadas temporalmente
    console.log('Ejecución manual de pruebas de responsividad deshabilitada temporalmente');
  }

  /**
   * Muestra los resultados de las pruebas en un diálogo
   */
  showTestResults(): void {
    // En una implementación real, aquí se mostraría un diálogo con los resultados
    console.log('Mostrar resultados de pruebas deshabilitado temporalmente');
  }
}
