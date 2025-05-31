import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from  '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ScreenSize } from  '../../services/responsive-testing.service';

interface TestResult {
  screenSize: ScreenSize;
  timestamp: Date;
  results: {
    component: string;
    tests: {
      name: string;
      passed: boolean;
      message: string;
    }[];
  }[];
}

@Component({
  selector: 'app-responsive-test-results',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="test-results-dialog">
      <h2 mat-dialog-title>Resultados de Pruebas de Responsividad</h2>

      <mat-dialog-content>
        <div class="test-summary">
          <div class="summary-item">
            <span class="label">Total de pruebas:</span>
            <span class="value">{{getTotalTests()}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Pruebas exitosas:</span>
            <span class="value success">{{getPassedTests()}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Pruebas fallidas:</span>
            <span class="value error">{{getFailedTests()}}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <mat-tab-group>
          <mat-tab *ngFor="let result of testResults" [label]="result.screenSize.breakpoint">
            <div class="screen-size-info">
              <div class="size-details">
                <span class="dimensions">{{result.screenSize.width}}x{{result.screenSize.height}}</span>
                <mat-chip-set>
                  <mat-chip [highlighted]="result.screenSize.isMobile">Mobile</mat-chip>
                  <mat-chip [highlighted]="result.screenSize.isTablet">Tablet</mat-chip>
                  <mat-chip [highlighted]="result.screenSize.isDesktop">Desktop</mat-chip>
                </mat-chip-set>
              </div>
              <div class="timestamp">
                {{result.timestamp | date:'medium'}}
              </div>
            </div>

            <mat-accordion>
              <mat-expansion-panel *ngFor="let componentResult of result.results">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    {{componentResult.component}}
                  </mat-panel-title>
                  <mat-panel-description>
                    <span class="test-count">
                      {{getComponentPassedTests(componentResult)}} / {{componentResult.tests.length}} pruebas exitosas
                    </span>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="test-list">
                  <div *ngFor="let test of componentResult.tests"
                       class="test-item"
                       [class.passed]="test.passed"
                       [class.failed]="!test.passed">
                    <mat-icon>{{test.passed ? 'check_circle' : 'error'}}</mat-icon>
                    <div class="test-details">
                      <div class="test-name">{{test.name}}</div>
                      <div class="test-message">{{test.message}}</div>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="runTests()">Ejecutar Nuevamente</button>
        <button mat-button [mat-dialog-close]="true">Cerrar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .test-results-dialog {
      max-width: 800px;
      max-height: 80vh;
    }

    .test-summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
    }

    .label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .value {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .success {
      color: #4caf50;
    }

    .error {
      color: #f44336;
    }

    .screen-size-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1rem 0;
      flex-wrap: wrap;
    }

    .size-details {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dimensions {
      font-size: 1.2rem;
      font-weight: bold;
      color: #2196f3;
    }

    .timestamp {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .test-count {
      font-size: 0.9rem;
    }

    .test-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .test-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .test-item.passed {
      background: rgba(76, 175, 80, 0.1);
    }

    .test-item.failed {
      background: rgba(244, 67, 54, 0.1);
    }

    .test-item mat-icon {
      font-size: 1.2rem;
      height: 1.2rem;
      width: 1.2rem;
    }

    .test-item.passed mat-icon {
      color: #4caf50;
    }

    .test-item.failed mat-icon {
      color: #f44336;
    }

    .test-details {
      flex: 1;
    }

    .test-name {
      font-weight: 500;
    }

    .test-message {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    mat-dialog-content {
      max-height: 60vh;
    }
  `]
})
export class ResponsiveTestResultsComponent implements OnInit {
  testResults: TestResult[] = [];



  ngOnInit(): void {
    // Generar resultados de prueba para demostración
    this.generateDemoResults();
  }

  /**
   * Genera resultados de prueba para demostración
   */
  private generateDemoResults(): void {
    const screenSizes = [
      { width: 375, height: 667, breakpoint: 'xs', isMobile: true, isTablet: false, isDesktop: false },
      { width: 768, height: 1024, breakpoint: 'md', isMobile: false, isTablet: true, isDesktop: false },
      { width: 1280, height: 800, breakpoint: 'lg', isMobile: false, isTablet: false, isDesktop: true }
    ];

    this.testResults = screenSizes.map(size => ({
      screenSize: size as ScreenSize,
      timestamp: new Date(),
      results: [
        {
          component: 'Dashboard',
          tests: [
            {
              name: 'Sidebar colapsado en móvil',
              passed: size.isMobile,
              message: size.isMobile ? 'El sidebar se colapsa correctamente' : 'No aplicable'
            },
            {
              name: 'Navegación móvil visible',
              passed: size.isMobile,
              message: size.isMobile ? 'La navegación móvil es visible' : 'No aplicable'
            },
            {
              name: 'Contenido adaptado',
              passed: true,
              message: `El contenido se adapta correctamente a ${size.width}px`
            }
          ]
        },
        {
          component: 'Formularios',
          tests: [
            {
              name: 'Campos de ancho completo',
              passed: size.isMobile,
              message: size.isMobile ? 'Los campos ocupan el ancho completo' : 'Los campos tienen ancho adecuado'
            },
            {
              name: 'Botones de tamaño adecuado',
              passed: size.isMobile ? Math.random() > 0.3 : true,
              message: 'Los botones tienen un tamaño mínimo de 44px en dispositivos táctiles'
            },
            {
              name: 'Espaciado entre campos',
              passed: true,
              message: 'El espaciado entre campos es adecuado'
            }
          ]
        },
        {
          component: 'Tablas',
          tests: [
            {
              name: 'Scroll horizontal',
              passed: size.isMobile ? Math.random() > 0.5 : true,
              message: size.isMobile ? 'Las tablas tienen scroll horizontal' : 'Las tablas se muestran correctamente'
            },
            {
              name: 'Contenido legible',
              passed: true,
              message: 'El contenido de las tablas es legible'
            }
          ]
        },
        {
          component: 'Tarjetas',
          tests: [
            {
              name: 'Disposición en grid',
              passed: true,
              message: `Las tarjetas se organizan en ${size.isMobile ? '1 columna' : size.isTablet ? '2 columnas' : '3 o más columnas'}`
            },
            {
              name: 'Espaciado adecuado',
              passed: true,
              message: 'El espaciado entre tarjetas es adecuado'
            }
          ]
        },
        {
          component: 'Navegación',
          tests: [
            {
              name: 'Menú hamburguesa',
              passed: size.isMobile,
              message: size.isMobile ? 'El menú hamburguesa está presente' : 'No aplicable'
            },
            {
              name: 'Enlaces de navegación',
              passed: true,
              message: 'Los enlaces de navegación son accesibles'
            }
          ]
        }
      ]
    }));
  }

  /**
   * Obtiene el número total de pruebas
   */
  getTotalTests(): number {
    return this.testResults.reduce((total, result) => {
      return total + result.results.reduce((componentTotal, component) => {
        return componentTotal + component.tests.length;
      }, 0);
    }, 0);
  }

  /**
   * Obtiene el número de pruebas exitosas
   */
  getPassedTests(): number {
    return this.testResults.reduce((total, result) => {
      return total + result.results.reduce((componentTotal, component) => {
        return componentTotal + component.tests.filter(test => test.passed).length;
      }, 0);
    }, 0);
  }

  /**
   * Obtiene el número de pruebas fallidas
   */
  getFailedTests(): number {
    return this.getTotalTests() - this.getPassedTests();
  }

  /**
   * Obtiene el número de pruebas exitosas para un componente
   */
  getComponentPassedTests(componentResult: unknown): number {
    const result = componentResult as { tests: Array<{ passed: boolean }> };
    return result.tests ? result.tests.filter(test => test.passed).length : 0;
  }

  /**
   * Ejecuta las pruebas nuevamente
   */
  runTests(): void {
    // Generar nuevos resultados de prueba
    this.generateDemoResults();
  }
}
