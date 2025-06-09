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
    // Logging implementado con LoggingService